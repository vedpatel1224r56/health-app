const { listReportCatalog, buildReportInsights, parseReportText, parseReportSections } = require("../services/reportInsightsService");
const { extractDocumentFromFile, getExtractionCapabilities } = require("../services/reportExtractionService");

const registerPatientRoutes = (fastify, deps) => {
  const {
    requireAuth,
    requireOps,
    all,
    get,
    run,
    nowIso,
    safeJsonParse,
    getFamilyMember,
    fs,
    path,
    RECORDS_DIR,
    saveUpload,
    canAccessUser,
    validatePatientProfileCompleteness,
    getAllowedVisitTypeCodes,
    hospitalSettingsService,
    purgeExpiredSharePasses,
    checkRateLimit,
    createShareCode,
    incrementMetric,
    metricDate,
    createPublicId,
    enqueueAndDeliverUserNotification,
  } = deps;
  const reportCatalog = listReportCatalog();
  const reportTypeKeys = new Set(reportCatalog.map((item) => item.key));
  const reportCatalogMap = new Map(reportCatalog.map((item) => [item.key, item]));
  const ABHA_ADDRESS_PATTERN = /^[a-z0-9][a-z0-9._-]{1,98}@[a-z][a-z0-9._-]{1,48}$/i;

  const normalizeAbhaNumber = (value = "") => String(value || "").replace(/\D/g, "");
  const normalizeAbhaAddress = (value = "") => String(value || "").trim().toLowerCase();
  const validateAbhaIdentity = ({ abhaNumber = "", abhaAddress = "" }) => {
    const normalizedNumber = normalizeAbhaNumber(abhaNumber);
    const normalizedAddress = normalizeAbhaAddress(abhaAddress);
    if (normalizedNumber && normalizedNumber.length !== 14) {
      return { ok: false, error: "ABHA number must be 14 digits." };
    }
    if (normalizedAddress && !ABHA_ADDRESS_PATTERN.test(normalizedAddress)) {
      return { ok: false, error: "ABHA address must look like name@abdm." };
    }
    return {
      ok: true,
      normalizedNumber,
      normalizedAddress,
    };
  };

  const findConflictingAbhaIdentity = async ({ userId, abhaNumber = "", abhaAddress = "" }) => {
    const conditions = [];
    const params = [Number(userId)];
    if (abhaNumber) {
      conditions.push("p.abha_number = ?");
      params.push(abhaNumber);
    }
    if (abhaAddress) {
      conditions.push("lower(COALESCE(p.abha_address, '')) = ?");
      params.push(abhaAddress);
    }
    if (!conditions.length) return null;
    return get(
      `SELECT u.id, u.name, u.patient_uid, p.abha_number, p.abha_address, p.abha_status
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE u.id != ?
         AND u.role = 'patient'
         AND (${conditions.join(" OR ")})
       LIMIT 1`,
      params,
    );
  };

  const loadCombinedAnalyses = async ({ userId, memberId = null }) => {
    const analyses = await all(
      `SELECT id, record_id, report_type, report_date, notes, source, created_at, updated_at
       FROM medical_record_analyses
       WHERE user_id = ?
         AND COALESCE(member_id, 0) = COALESCE(?, 0)
       ORDER BY report_date DESC, created_at DESC`,
      [userId, memberId || 0],
    );
    const sectionAnalyses = await all(
      `SELECT id, record_id, report_type, report_date, notes, source, created_at, updated_at,
              page_number, section_key, section_label
       FROM medical_record_section_analyses
       WHERE user_id = ?
         AND COALESCE(member_id, 0) = COALESCE(?, 0)
       ORDER BY report_date DESC, created_at DESC`,
      [userId, memberId || 0],
    );
    const analysisIds = analyses.map((item) => item.id);
    const sectionAnalysisIds = sectionAnalyses.map((item) => item.id);
    const metrics = analysisIds.length
      ? await all(
          `SELECT id, analysis_id, metric_key, metric_label, value_num, unit, reference_low, reference_high, confidence, created_at
           FROM medical_record_metrics
           WHERE analysis_id IN (${analysisIds.map(() => "?").join(",")})
           ORDER BY created_at ASC, id ASC`,
          analysisIds,
        )
      : [];
    const sectionMetrics = sectionAnalysisIds.length
      ? await all(
          `SELECT id, section_analysis_id, metric_key, metric_label, value_num, unit, reference_low, reference_high, confidence, created_at
           FROM medical_record_section_metrics
           WHERE section_analysis_id IN (${sectionAnalysisIds.map(() => "?").join(",")})
           ORDER BY created_at ASC, id ASC`,
          sectionAnalysisIds,
        )
      : [];

    return [
      ...analyses.map((analysis) => ({
        id: `analysis-${analysis.id}`,
        recordId: analysis.record_id,
        reportType: analysis.report_type,
        reportDate: analysis.report_date,
        notes: analysis.notes || "",
        source: analysis.source || "manual",
        createdAt: analysis.created_at,
        updatedAt: analysis.updated_at,
        metrics: metrics
          .filter((item) => item.analysis_id === analysis.id)
          .map((item) => ({
            id: item.id,
            metricKey: item.metric_key,
            metricLabel: item.metric_label,
            valueNum: item.value_num,
            unit: item.unit || "",
            referenceLow: item.reference_low,
            referenceHigh: item.reference_high,
            confidence: item.confidence,
          })),
      })),
      ...sectionAnalyses.map((analysis) => ({
        id: `section-${analysis.id}`,
        recordId: analysis.record_id,
        reportType: analysis.report_type,
        reportDate: analysis.report_date,
        notes: analysis.notes || "",
        source: analysis.source || "auto_extracted",
        createdAt: analysis.created_at,
        updatedAt: analysis.updated_at,
        pageNumber: analysis.page_number,
        sectionKey: analysis.section_key || "",
        sectionLabel: analysis.section_label || "",
        metrics: sectionMetrics
          .filter((item) => item.section_analysis_id === analysis.id)
          .map((item) => ({
            id: item.id,
            metricKey: item.metric_key,
            metricLabel: item.metric_label,
            valueNum: item.value_num,
            unit: item.unit || "",
            referenceLow: item.reference_low,
            referenceHigh: item.reference_high,
            confidence: item.confidence,
          })),
      })),
    ];
  };

  const readPatientProfileByUserId = async (userId) => {
    const profile = await get(
      `SELECT
          u.id AS user_id,
          u.name,
          u.email,
          u.registration_mode,
          p.age,
          p.sex,
          p.conditions,
          p.allergies,
          p.region,
          p.phone,
          p.address,
          p.address_line_1,
          p.address_line_2,
          p.blood_group,
          p.weight_kg,
          p.height_cm,
          p.date_of_birth,
          p.abha_number,
          p.abha_address,
          p.abha_status,
          p.abha_verified_at,
          p.abha_link_source,
          p.abha_last_synced_at,
          p.abha_last_error,
          p.emergency_contact_name,
          p.emergency_contact_phone,
          p.updated_at,
          pr.visit_time,
          pr.unit_department_id,
          pr.unit_department_name,
          pr.unit_doctor_id,
          pr.unit_doctor_name,
          pr.aadhaar_no,
          pr.marital_status,
          pr.taluka,
          pr.district,
          pr.city,
          pr.state,
          pr.country,
          pr.pin_code
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN patient_registration_details pr ON pr.user_id = u.id
       WHERE u.id = ?`,
      [userId],
    );
    if (!profile) return null;
    return {
      ...profile,
      conditions: profile.conditions ? safeJsonParse(profile.conditions, []) : [],
      allergies: profile.allergies ? safeJsonParse(profile.allergies, []) : [],
    };
  };

  const loadReportInsightPayload = async ({ userId, memberId = null, months = 6 }) => {
    const records = await all(
      `SELECT id, file_name, mimetype, created_at
       FROM medical_records
       WHERE user_id = ?
         AND COALESCE(member_id, 0) = COALESCE(?, 0)
       ORDER BY created_at DESC`,
      [userId, memberId || 0],
    );
    const extractions = await all(
      `SELECT record_id, extracted_text, extraction_status, extractor, updated_at,
              suggested_report_type, suggested_report_date, suggested_metrics_json,
              detected_lab_source, overall_confidence, needs_review, last_error, detected_sections_json,
              rejected_metrics_json, quality_gate
       FROM medical_record_extractions
       WHERE user_id = ?
         AND COALESCE(member_id, 0) = COALESCE(?, 0)`,
      [userId, memberId || 0],
    );
    const analysisRows = await loadCombinedAnalyses({ userId, memberId });
    const insightPayload = buildReportInsights({ analyses: analysisRows, months });
    return {
      catalog: reportCatalog,
      extractionCapabilities: getExtractionCapabilities(),
      records: records.map((record) => ({
        ...record,
        analysis: analysisRows.find((item) => item.recordId === record.id) || null,
        analyses: analysisRows.filter((item) => item.recordId === record.id),
        extraction: (() => {
          const extraction = extractions.find((item) => item.record_id === record.id) || null;
          if (!extraction) return null;
          return {
            ...extraction,
            suggested_metrics: extraction.suggested_metrics_json ? safeJsonParse(extraction.suggested_metrics_json, []) : [],
            detected_sections: extraction.detected_sections_json ? safeJsonParse(extraction.detected_sections_json, []) : [],
            rejected_metrics: extraction.rejected_metrics_json ? safeJsonParse(extraction.rejected_metrics_json, []) : [],
            needs_review: Boolean(extraction.needs_review),
            quality_gate: extraction.quality_gate || "review",
          };
        })(),
        downloadUrl: `/api/records/${record.id}/download`,
      })),
      insights: insightPayload,
    };
  };

  const upsertRecordAnalysis = async ({ recordId, userId, memberId = null, reportType, reportDate, notes = "", metrics = [], source = "manual" }) => {
    const catalogEntry = reportCatalogMap.get(reportType);
    if (!catalogEntry) {
      return { ok: false, error: "Unsupported report type." };
    }

    const allowedMetrics = new Map((catalogEntry.metrics || []).map((item) => [item.key, item]));
    const normalizedMetrics = metrics
      .map((item) => {
        const metricKey = String(item.metricKey || "").trim();
        const catalogMetric = allowedMetrics.get(metricKey);
        const valueNum = Number(item.valueNum);
        if (!catalogMetric || !Number.isFinite(valueNum)) return null;
        return {
          metricKey,
          metricLabel: catalogMetric.label,
          valueNum,
          unit: catalogMetric.unit || "",
          referenceLow: catalogMetric.low ?? null,
          referenceHigh: catalogMetric.high ?? null,
          confidence: 1,
        };
      })
      .filter(Boolean);

    if (!normalizedMetrics.length) {
      return { ok: false, error: "No valid metric values were provided." };
    }

    const now = nowIso();
    const existing = await get(`SELECT id FROM medical_record_analyses WHERE record_id = ?`, [recordId]);
    let analysisId = existing?.id || null;
    if (analysisId) {
      await run(
        `UPDATE medical_record_analyses
         SET report_type = ?, report_date = ?, notes = ?, source = ?, updated_at = ?
         WHERE id = ?`,
        [reportType, reportDate, String(notes || "").trim(), source, now, analysisId],
      );
      await run(`DELETE FROM medical_record_metrics WHERE analysis_id = ?`, [analysisId]);
    } else {
      const result = await run(
        `INSERT INTO medical_record_analyses
         (record_id, user_id, member_id, report_type, report_date, notes, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [recordId, userId, memberId || null, reportType, reportDate, String(notes || "").trim(), source, now, now],
      );
      analysisId = result.lastID;
    }

    for (const metric of normalizedMetrics) {
      await run(
        `INSERT INTO medical_record_metrics
         (analysis_id, metric_key, metric_label, value_num, unit, reference_low, reference_high, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          analysisId,
          metric.metricKey,
          metric.metricLabel,
          metric.valueNum,
          metric.unit,
          metric.referenceLow,
          metric.referenceHigh,
          metric.confidence ?? 1,
          now,
        ],
      );
    }

    return { ok: true, analysisId };
  };

  const replaceRecordSectionAnalyses = async ({ recordId, userId, memberId = null, sections = [], source = "auto_extracted" }) => {
    const existing = await all(`SELECT id FROM medical_record_section_analyses WHERE record_id = ?`, [recordId]);
    for (const row of existing) {
      await run(`DELETE FROM medical_record_section_metrics WHERE section_analysis_id = ?`, [row.id]);
    }
    await run(`DELETE FROM medical_record_section_analyses WHERE record_id = ?`, [recordId]);

    const createdIds = [];
    const now = nowIso();
    for (const section of sections) {
      const catalogEntry = reportCatalogMap.get(section.reportType);
      if (!catalogEntry) continue;
      const allowedMetrics = new Map((catalogEntry.metrics || []).map((item) => [item.key, item]));
      const normalizedMetrics = (section.metrics || [])
        .map((item) => {
          const metricKey = String(item.metricKey || "").trim();
          const catalogMetric = allowedMetrics.get(metricKey);
          const valueNum = Number(item.valueNum);
          if (!catalogMetric || !Number.isFinite(valueNum)) return null;
          return {
            metricKey,
            metricLabel: catalogMetric.label,
            valueNum,
            unit: catalogMetric.unit || "",
            referenceLow: catalogMetric.low ?? null,
            referenceHigh: catalogMetric.high ?? null,
            confidence: item.confidence ?? null,
          };
        })
        .filter(Boolean);
      if (!normalizedMetrics.length) continue;

      const insert = await run(
        `INSERT INTO medical_record_section_analyses
         (record_id, user_id, member_id, page_number, section_key, section_label, report_type, report_date, notes, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          userId,
          memberId || null,
          section.pageNumber || null,
          section.sectionKey || section.reportType || "",
          section.label || "",
          section.reportType,
          section.reportDate,
          String(section.summary || "").trim(),
          source,
          now,
          now,
        ],
      );

      for (const metric of normalizedMetrics) {
        await run(
          `INSERT INTO medical_record_section_metrics
           (section_analysis_id, metric_key, metric_label, value_num, unit, reference_low, reference_high, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insert.lastID,
            metric.metricKey,
            metric.metricLabel,
            metric.valueNum,
            metric.unit,
            metric.referenceLow,
            metric.referenceHigh,
            metric.confidence ?? null,
            now,
          ],
        );
      }
      createdIds.push(insert.lastID);
    }
    return createdIds;
  };

  const upsertRecordExtraction = async ({
    recordId,
    userId,
    memberId = null,
    extractedText = "",
    extractionStatus = "success",
    extractor = "swift_ocr",
    suggestedReportType = "",
    suggestedReportDate = "",
    suggestedMetrics = [],
    detectedSections = [],
    rejectedMetrics = [],
    detectedLabSource = "",
    overallConfidence = null,
    needsReview = true,
    qualityGate = "review",
    lastError = "",
  }) => {
    const now = nowIso();
    const existing = await get(`SELECT id FROM medical_record_extractions WHERE record_id = ?`, [recordId]);
    if (existing) {
      await run(
        `UPDATE medical_record_extractions
         SET extracted_text = ?, extraction_status = ?, extractor = ?, suggested_report_type = ?, suggested_report_date = ?,
             suggested_metrics_json = ?, detected_sections_json = ?, rejected_metrics_json = ?, detected_lab_source = ?, overall_confidence = ?, needs_review = ?, quality_gate = ?, last_error = ?, updated_at = ?
         WHERE id = ?`,
        [
          String(extractedText || ""),
          extractionStatus,
          extractor,
          suggestedReportType || "",
          suggestedReportDate || "",
          JSON.stringify(suggestedMetrics || []),
          JSON.stringify(detectedSections || []),
          JSON.stringify(rejectedMetrics || []),
          detectedLabSource || "",
          overallConfidence,
          needsReview ? 1 : 0,
          qualityGate || "review",
          lastError || "",
          now,
          existing.id,
        ],
      );
    } else {
      await run(
        `INSERT INTO medical_record_extractions
         (record_id, user_id, member_id, extracted_text, extraction_status, extractor, suggested_report_type,
          suggested_report_date, suggested_metrics_json, detected_sections_json, rejected_metrics_json, detected_lab_source, overall_confidence, needs_review, quality_gate, last_error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          userId,
          memberId || null,
          String(extractedText || ""),
          extractionStatus,
          extractor,
          suggestedReportType || "",
          suggestedReportDate || "",
          JSON.stringify(suggestedMetrics || []),
          JSON.stringify(detectedSections || []),
          JSON.stringify(rejectedMetrics || []),
          detectedLabSource || "",
          overallConfidence,
          needsReview ? 1 : 0,
          qualityGate || "review",
          lastError || "",
          now,
          now,
        ],
      );
    }
  };

  const assessUploadReadability = ({ mimetype = "", extraction = null, suggestion = null }) => {
    const type = String(mimetype || "");
    const isImage = type.startsWith("image/");
    const isPdf = type === "application/pdf";
    const metricCount = suggestion?.metrics?.length || 0;
    const overallConfidence = Number(suggestion?.overallConfidence || 0);
    const qualityGate = String(suggestion?.qualityGate || "review");
    const rejectedCritical = (suggestion?.rejectedMetrics || []).some((metric) => metric?.reviewStatus === "rejected");

    if (isImage && (!extraction?.text || !metricCount || overallConfidence < 0.78)) {
      return {
        ok: false,
        error: "This photo looks too blurry or incomplete to read reliably. Please upload a clean, well-lit image or a PDF lab report.",
      };
    }

    if (isPdf && !extraction?.text) {
      return {
        ok: false,
        error: "We could not read this PDF reliably. Please upload a text PDF or a clearer scanned report.",
      };
    }

    if (isPdf && !metricCount) {
      return {
        ok: false,
        error: "This report format is not supported yet. Please upload a clearer standard lab report PDF/image.",
      };
    }

    if (qualityGate === "rejected" || rejectedCritical) {
      return {
        ok: false,
        error: "We could not extract this report reliably enough. Please upload a cleaner report or review the values manually.",
      };
    }

    return { ok: true };
  };

  const autoExtractAndAnalyzeRecord = async ({
    recordId,
    userId,
    memberId = null,
    filePath,
    mimetype,
    reportDate,
    extraction: providedExtraction = null,
    suggestion: providedSuggestion = null,
  }) => {
    const extraction = providedExtraction || extractDocumentFromFile({ filePath, mimetype });
    const suggestion = providedSuggestion || (extraction.text
      ? parseReportSections({ text: extraction.text, pages: extraction.pages || [], reportDate })
      : null);
    await upsertRecordExtraction({
      recordId,
      userId,
      memberId,
      extractedText: extraction.text || "",
      extractionStatus: extraction.error ? "failed" : extraction.text ? "success" : "empty",
      extractor: extraction.extractor || "swift_ocr",
      suggestedReportType: suggestion?.reportType || "",
      suggestedReportDate: suggestion?.reportDate || reportDate || "",
      suggestedMetrics: suggestion?.metrics || [],
      detectedSections: suggestion?.detectedSections || [],
      rejectedMetrics: suggestion?.rejectedMetrics || [],
      detectedLabSource: suggestion?.detectedLabSource?.label || "",
      overallConfidence: suggestion?.overallConfidence ?? null,
      needsReview: suggestion?.needsReview ?? true,
      qualityGate: suggestion?.qualityGate || "review",
      lastError: extraction.error || "",
    });

    if (!extraction.text) {
      return { ok: false, reason: extraction.error || "No text extracted." };
    }

    if (!(suggestion?.metrics || []).length) {
      return { ok: false, reason: suggestion?.summary || "No structured values detected." };
    }

    const legacyAnalysis = await get(`SELECT id FROM medical_record_analyses WHERE record_id = ?`, [recordId]);
    if (legacyAnalysis?.id) {
      await run(`DELETE FROM medical_record_metrics WHERE analysis_id = ?`, [legacyAnalysis.id]);
      await run(`DELETE FROM medical_record_analyses WHERE id = ?`, [legacyAnalysis.id]);
    }

    const createdSectionIds = await replaceRecordSectionAnalyses({
      recordId,
      userId,
      memberId,
      sections: suggestion.sections || [],
      source: "auto_extracted",
    });

    if (!createdSectionIds.length) {
      return {
        ok: false,
        reason: "Structured values were detected but could not be saved as report sections.",
        suggestionStored: true,
      };
    }

    return { ok: true, suggestionStored: true, sectionAnalysisIds: createdSectionIds };
  };

  fastify.get("/api/family", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const rows = await all(
      `SELECT id, name, relation, age, sex, blood_type, conditions, allergies, created_at, updated_at
       FROM family_members WHERE user_id = ? ORDER BY created_at ASC`,
      [request.authUser.id],
    );
    return {
      members: rows.map((row) => ({
        ...row,
        conditions: row.conditions ? safeJsonParse(row.conditions, []) : [],
        allergies: row.allergies ? safeJsonParse(row.allergies, []) : [],
      })),
    };
  });

  fastify.post("/api/family", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const {
      name,
      relation = "",
      age = null,
      sex = "",
      bloodType = "",
      conditions = [],
      allergies = [],
    } = request.body || {};

    if (!name) {
      return reply.code(400).send({ error: "name is required." });
    }

    const result = await run(
      `INSERT INTO family_members
       (user_id, name, relation, age, sex, blood_type, conditions, allergies, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.authUser.id,
        name,
        relation,
        age,
        sex,
        bloodType,
        JSON.stringify(conditions),
        JSON.stringify(allergies),
        nowIso(),
        nowIso(),
      ],
    );
    return { id: result.lastID };
  });

  fastify.put("/api/family/:memberId", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { memberId } = request.params;
    const member = await getFamilyMember(request.authUser.id, memberId);
    if (!member) return reply.code(404).send({ error: "Member not found." });

    const {
      name = member.name,
      relation = member.relation || "",
      age = member.age,
      sex = member.sex || "",
      bloodType = member.blood_type || "",
      conditions = member.conditions ? safeJsonParse(member.conditions, []) : [],
      allergies = member.allergies ? safeJsonParse(member.allergies, []) : [],
    } = request.body || {};

    await run(
      `UPDATE family_members
       SET name = ?, relation = ?, age = ?, sex = ?, blood_type = ?, conditions = ?, allergies = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [
        name,
        relation,
        age,
        sex,
        bloodType,
        JSON.stringify(conditions),
        JSON.stringify(allergies),
        nowIso(),
        memberId,
        request.authUser.id,
      ],
    );
    return { ok: true };
  });

  fastify.delete("/api/family/:memberId", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { memberId } = request.params;
    await run("DELETE FROM family_members WHERE id = ? AND user_id = ?", [memberId, request.authUser.id]);
    await run("DELETE FROM medical_records WHERE member_id = ? AND user_id = ?", [memberId, request.authUser.id]);
    return { ok: true };
  });

  fastify.get("/api/family/:memberId/records", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { memberId } = request.params;
    const member = await getFamilyMember(request.authUser.id, memberId);
    if (!member) return reply.code(404).send({ error: "Member not found." });
    const records = await all(
      `SELECT id, file_name, mimetype, created_at FROM medical_records
       WHERE user_id = ? AND member_id = ? ORDER BY created_at DESC`,
      [request.authUser.id, memberId],
    );
    return {
      records: records.map((row) => ({
        ...row,
        downloadUrl: `/api/records/${row.id}/download`,
      })),
    };
  });

  fastify.get("/api/records", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const records = await all(
      `SELECT id, file_name, mimetype, created_at FROM medical_records
       WHERE user_id = ? AND member_id IS NULL ORDER BY created_at DESC`,
      [request.authUser.id],
    );
    return {
      records: records.map((row) => ({
        ...row,
        downloadUrl: `/api/records/${row.id}/download`,
      })),
    };
  });

  fastify.get("/api/records/insights", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const memberId = request.query?.memberId ? Number(request.query.memberId) : null;
    const months = request.query?.months ? Number(request.query.months) : 6;
    if (memberId) {
      const member = await getFamilyMember(request.authUser.id, memberId);
      if (!member) return reply.code(404).send({ error: "Member not found." });
    }
    const payload = await loadReportInsightPayload({
      userId: request.authUser.id,
      memberId,
      months,
    });
    return payload;
  });

  fastify.post("/api/records/:recordId/analysis", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const recordId = Number(request.params.recordId);
    if (!recordId) return reply.code(400).send({ error: "Invalid record id." });
    const record = await get(
      `SELECT id, user_id, member_id
       FROM medical_records
       WHERE id = ? AND user_id = ?`,
      [recordId, request.authUser.id],
    );
    if (!record) return reply.code(404).send({ error: "Record not found." });

    const {
      reportType = "",
      reportDate = "",
      notes = "",
      metrics = [],
    } = request.body || {};
    if (!reportTypeKeys.has(reportType)) {
      return reply.code(400).send({ error: "Select a supported report type." });
    }
    if (!String(reportDate || "").trim()) {
      return reply.code(400).send({ error: "reportDate is required." });
    }
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return reply.code(400).send({ error: "Add at least one metric value." });
    }

    const result = await upsertRecordAnalysis({
      recordId,
      userId: record.user_id,
      memberId: record.member_id || null,
      reportType,
      reportDate,
      notes,
      metrics,
      source: "manual",
    });
    if (!result.ok) {
      return reply.code(400).send({ error: result.error || "Unable to save analysis." });
    }
    return { ok: true, analysisId: result.analysisId };
  });

  fastify.post("/api/records/:recordId/analysis/auto-suggest", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const recordId = Number(request.params.recordId);
    if (!recordId) return reply.code(400).send({ error: "Invalid record id." });
    const record = await get(
      `SELECT id, user_id
       FROM medical_records
       WHERE id = ? AND user_id = ?`,
      [recordId, request.authUser.id],
    );
    if (!record) return reply.code(404).send({ error: "Record not found." });

    const { reportText = "", hintedReportType = "", reportDate = "" } = request.body || {};
    let sourceText = String(reportText || "");
    if (!sourceText.trim()) {
      const extractionRow = await get(
        `SELECT extracted_text, suggested_report_type, suggested_report_date, suggested_metrics_json,
                detected_lab_source, overall_confidence, needs_review, detected_sections_json, rejected_metrics_json, quality_gate
         FROM medical_record_extractions WHERE record_id = ?`,
        [recordId],
      );
      if (extractionRow?.extracted_text) {
        sourceText = extractionRow.extracted_text;
        if (extractionRow.suggested_metrics_json) {
          return {
            ok: true,
            suggestion: {
              reportType: extractionRow.suggested_report_type || "",
              reportDate: extractionRow.suggested_report_date || reportDate || "",
              metrics: safeJsonParse(extractionRow.suggested_metrics_json, []),
              detectedSections: extractionRow.detected_sections_json ? safeJsonParse(extractionRow.detected_sections_json, []) : [],
              rejectedMetrics: extractionRow.rejected_metrics_json ? safeJsonParse(extractionRow.rejected_metrics_json, []) : [],
              detectedLabSource: extractionRow.detected_lab_source ? { label: extractionRow.detected_lab_source } : null,
              overallConfidence: extractionRow.overall_confidence,
              needsReview: Boolean(extractionRow.needs_review),
              qualityGate: extractionRow.quality_gate || "review",
              source: "cached_extraction",
              summary: "Loaded suggested values from the extracted report text. Review before saving.",
            },
          };
        }
      } else {
        const fileRecord = await get(
          `SELECT file_path, mimetype FROM medical_records WHERE id = ? AND user_id = ?`,
          [recordId, request.authUser.id],
        );
        if (fileRecord) {
          const extraction = extractDocumentFromFile({ filePath: fileRecord.file_path, mimetype: fileRecord.mimetype || "" });
          const suggestion = extraction.text
            ? parseReportSections({ text: extraction.text, pages: extraction.pages || [], hintedReportType, reportDate })
            : null;
          await upsertRecordExtraction({
            recordId,
            userId: request.authUser.id,
            memberId: record.member_id || null,
            extractedText: extraction.text || "",
            extractionStatus: extraction.error ? "failed" : extraction.text ? "success" : "empty",
            extractor: extraction.extractor || "swift_ocr",
            suggestedReportType: suggestion?.reportType || "",
            suggestedReportDate: suggestion?.reportDate || reportDate || "",
            suggestedMetrics: suggestion?.metrics || [],
            detectedSections: suggestion?.detectedSections || [],
            detectedLabSource: suggestion?.detectedLabSource?.label || "",
            overallConfidence: suggestion?.overallConfidence ?? null,
            needsReview: suggestion?.needsReview ?? true,
            lastError: extraction.error || "",
          });
          sourceText = extraction.text || "";
        }
      }
    }
    const suggestion = parseReportText({ text: sourceText, hintedReportType, reportDate });
    return { ok: true, suggestion };
  });

  fastify.post("/api/records/demo-seed", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const memberId = request.body?.memberId ? Number(request.body.memberId) : null;
    if (memberId) {
      const member = await getFamilyMember(request.authUser.id, memberId);
      if (!member) return reply.code(404).send({ error: "Member not found." });
    }

    const userId = request.authUser.id;
    const existingDemoRows = await all(
      `SELECT a.id AS analysis_id, r.id AS record_id, r.file_path
       FROM medical_record_analyses a
       JOIN medical_records r ON r.id = a.record_id
       WHERE a.user_id = ?
         AND COALESCE(a.member_id, 0) = COALESCE(?, 0)
         AND a.source = 'demo_seed'
       UNION
       SELECT sa.id AS analysis_id, r.id AS record_id, r.file_path
       FROM medical_record_section_analyses sa
       JOIN medical_records r ON r.id = sa.record_id
       WHERE sa.user_id = ?
         AND COALESCE(sa.member_id, 0) = COALESCE(?, 0)
         AND sa.source = 'demo_seed'`,
      [userId, memberId || null, userId, memberId || null],
    );
    for (const row of existingDemoRows) {
      await run(`DELETE FROM medical_record_metrics WHERE analysis_id = ?`, [row.analysis_id]);
      await run(`DELETE FROM medical_record_analyses WHERE id = ?`, [row.analysis_id]);
      await run(`DELETE FROM medical_record_section_metrics WHERE section_analysis_id = ?`, [row.analysis_id]);
      await run(`DELETE FROM medical_record_section_analyses WHERE id = ?`, [row.analysis_id]);
      await run(`DELETE FROM medical_record_extractions WHERE record_id = ?`, [row.record_id]);
      await run(`DELETE FROM medical_records WHERE id = ?`, [row.record_id]);
      if (row.file_path && fs.existsSync(row.file_path)) {
        fs.unlinkSync(row.file_path);
      }
    }
    const now = new Date();
    const demoRows = [
      {
        monthsAgo: 11,
        fileName: "demo-hba1c-11m.txt",
        reportType: "hba1c",
        text: "HbA1c report. HbA1c 9.1 %",
        metrics: [{ metricKey: "hba1c", valueNum: 9.1 }],
      },
      {
        monthsAgo: 7,
        fileName: "demo-cbc-7m.txt",
        reportType: "cbc",
        text: "Complete blood count. Hemoglobin 10.4 g/dL. WBC 7.8. Platelet count 210.",
        metrics: [
          { metricKey: "hemoglobin", valueNum: 10.4 },
          { metricKey: "wbc", valueNum: 7.8 },
          { metricKey: "platelets", valueNum: 210 },
        ],
      },
      {
        monthsAgo: 5,
        fileName: "demo-renal-5m.txt",
        reportType: "renal",
        text: "Renal function test. Creatinine 1.6 mg/dL. Urea 48 mg/dL. Uric acid 6.1 mg/dL.",
        metrics: [
          { metricKey: "creatinine", valueNum: 1.6 },
          { metricKey: "urea", valueNum: 48 },
          { metricKey: "uric_acid", valueNum: 6.1 },
        ],
      },
      {
        monthsAgo: 3,
        fileName: "demo-thyroid-3m.txt",
        reportType: "thyroid",
        text: "Thyroid profile. TSH 6.2 uIU/mL. T3 110 ng/dL. T4 7.1 ug/dL.",
        metrics: [
          { metricKey: "tsh", valueNum: 6.2 },
          { metricKey: "t3", valueNum: 110 },
          { metricKey: "t4", valueNum: 7.1 },
        ],
      },
      {
        monthsAgo: 2,
        fileName: "demo-lipid-2m.txt",
        reportType: "lipid",
        text: "Lipid profile. Total cholesterol 238 mg/dL. LDL 156 mg/dL. HDL 36 mg/dL. Triglycerides 226 mg/dL.",
        metrics: [
          { metricKey: "total_cholesterol", valueNum: 238 },
          { metricKey: "ldl", valueNum: 156 },
          { metricKey: "hdl", valueNum: 36 },
          { metricKey: "triglycerides", valueNum: 226 },
        ],
      },
      {
        monthsAgo: 1,
        fileName: "demo-liver-1m.txt",
        reportType: "liver",
        text: "Liver function test. Bilirubin total 1.8 mg/dL. SGPT 82 U/L. SGOT 66 U/L.",
        metrics: [
          { metricKey: "bilirubin_total", valueNum: 1.8 },
          { metricKey: "sgpt_alt", valueNum: 82 },
          { metricKey: "sgot_ast", valueNum: 66 },
        ],
      },
      {
        monthsAgo: 1,
        fileName: "demo-hba1c-1m.txt",
        reportType: "hba1c",
        text: "HbA1c report. HbA1c 7.4 %",
        metrics: [{ metricKey: "hba1c", valueNum: 7.4 }],
      },
      {
        monthsAgo: 0,
        fileName: "demo-glucose-current.txt",
        reportType: "glucose",
        text: "Blood sugar profile. FBS 138 mg/dL. PPBS 218 mg/dL. RBS 189 mg/dL.",
        metrics: [
          { metricKey: "fbs", valueNum: 138 },
          { metricKey: "ppbs", valueNum: 218 },
          { metricKey: "rbs", valueNum: 189 },
        ],
      },
    ];

    const createdRecordIds = [];
    for (const row of demoRows) {
      const reportDateObj = new Date(now);
      reportDateObj.setMonth(reportDateObj.getMonth() - row.monthsAgo);
      const reportDate = reportDateObj.toISOString().slice(0, 10);
      const createdAt = `${reportDate}T08:00:00.000Z`;
      const filePath = path.join(RECORDS_DIR, `${Date.now()}-${Math.random().toString(36).slice(2)}-${row.fileName}`);
      fs.writeFileSync(filePath, row.text, "utf8");

      const recordInsert = await run(
        `INSERT INTO medical_records
         (user_id, member_id, file_name, file_path, mimetype, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, memberId || null, row.fileName, filePath, "text/plain", createdAt],
      );
      const analysisInsert = await run(
        `INSERT INTO medical_record_analyses
         (record_id, user_id, member_id, report_type, report_date, notes, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'demo_seed', ?, ?)`,
        [recordInsert.lastID, userId, memberId || null, row.reportType, reportDate, "Demo seeded lab report for trend review.", createdAt, createdAt],
      );

      const catalogEntry = reportCatalogMap.get(row.reportType);
      for (const metric of row.metrics) {
        const definition = catalogEntry?.metrics?.find((item) => item.key === metric.metricKey);
        if (!definition) continue;
        await run(
          `INSERT INTO medical_record_metrics
           (analysis_id, metric_key, metric_label, value_num, unit, reference_low, reference_high, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            analysisInsert.lastID,
            definition.key,
            definition.label,
            metric.valueNum,
            definition.unit || "",
            definition.low ?? null,
            definition.high ?? null,
            createdAt,
          ],
        );
      }
      createdRecordIds.push(recordInsert.lastID);
    }

    return { ok: true, created: createdRecordIds.length };
  });

  fastify.get("/api/admin/patients/:patientId/records", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    const { patientId } = request.params;
    const patient = await get("SELECT id FROM users WHERE id = ? AND role = 'patient'", [patientId]);
    if (!patient) return reply.code(404).send({ error: "Patient not found." });
    const records = await all(
      `SELECT id, file_name, mimetype, created_at
       FROM medical_records
       WHERE user_id = ? AND member_id IS NULL
       ORDER BY created_at DESC
       LIMIT 50`,
      [patientId],
    );
    return { records };
  });

  fastify.get("/api/admin/records/:recordId/download", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    const { recordId } = request.params;
    const record = await get(
      `SELECT id, file_name, file_path, mimetype
       FROM medical_records
       WHERE id = ?`,
      [recordId],
    );
    if (!record) return reply.code(404).send({ error: "Record not found." });
    if (!fs.existsSync(record.file_path)) return reply.code(404).send({ error: "Record file missing." });
    const attachmentName = String(record.file_name || "record").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    reply.header("Content-Type", record.mimetype || "application/octet-stream");
    reply.header("Content-Disposition", `attachment; filename="${attachmentName}"`);
    return reply.send(fs.createReadStream(record.file_path));
  });

  fastify.post("/api/family/:memberId/records", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { memberId } = request.params;
    const member = await getFamilyMember(request.authUser.id, memberId);
    if (!member) return reply.code(404).send({ error: "Member not found." });
    if (!request.isMultipart()) return reply.code(400).send({ error: "multipart form-data required." });

    let fileMeta = null;
    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (!part.mimetype || (!part.mimetype.startsWith("image/") && part.mimetype !== "application/pdf")) {
          return reply.code(400).send({ error: "Unsupported format. Upload a PDF or a clear image file (JPG, PNG, HEIC, WEBP)." });
        }
        fileMeta = await saveUpload(part, { dir: RECORDS_DIR, prefix: "record" });
      }
    }
    if (!fileMeta) return reply.code(400).send({ error: "record file is required." });

    const extraction = extractDocumentFromFile({ filePath: fileMeta.path, mimetype: fileMeta.mimetype });
    const suggestion = extraction.text
      ? parseReportSections({ text: extraction.text, pages: extraction.pages || [], reportDate: nowIso().slice(0, 10) })
      : null;
    const assessment = assessUploadReadability({ mimetype: fileMeta.mimetype, extraction, suggestion });

    const result = await run(
      `INSERT INTO medical_records (user_id, member_id, file_name, file_path, mimetype, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [request.authUser.id, memberId, fileMeta.filename, fileMeta.path, fileMeta.mimetype, nowIso()],
    );
    await autoExtractAndAnalyzeRecord({
      recordId: result.lastID,
      userId: request.authUser.id,
      memberId,
      filePath: fileMeta.path,
      mimetype: fileMeta.mimetype,
      reportDate: nowIso().slice(0, 10),
      extraction,
      suggestion,
    });
    return {
      id: result.lastID,
      message: assessment.ok
        ? "Report uploaded and parsed."
        : "Report uploaded. Auto-read was limited, so you may need to review or add values manually.",
      extractionStatus: assessment.ok ? "parsed" : "review_needed",
    };
  });

  fastify.post("/api/records", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    if (!request.isMultipart()) return reply.code(400).send({ error: "multipart form-data required." });
    let fileMeta = null;
    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (!part.mimetype || (!part.mimetype.startsWith("image/") && part.mimetype !== "application/pdf")) {
          return reply.code(400).send({ error: "Unsupported format. Upload a PDF or a clear image file (JPG, PNG, HEIC, WEBP)." });
        }
        fileMeta = await saveUpload(part, { dir: RECORDS_DIR, prefix: "record" });
      }
    }
    if (!fileMeta) return reply.code(400).send({ error: "record file is required." });

    const extraction = extractDocumentFromFile({ filePath: fileMeta.path, mimetype: fileMeta.mimetype });
    const suggestion = extraction.text
      ? parseReportSections({ text: extraction.text, pages: extraction.pages || [], reportDate: nowIso().slice(0, 10) })
      : null;
    const assessment = assessUploadReadability({ mimetype: fileMeta.mimetype, extraction, suggestion });

    const result = await run(
      `INSERT INTO medical_records (user_id, member_id, file_name, file_path, mimetype, created_at)
       VALUES (?, NULL, ?, ?, ?, ?)`,
      [request.authUser.id, fileMeta.filename, fileMeta.path, fileMeta.mimetype, nowIso()],
    );
    await autoExtractAndAnalyzeRecord({
      recordId: result.lastID,
      userId: request.authUser.id,
      memberId: null,
      filePath: fileMeta.path,
      mimetype: fileMeta.mimetype,
      reportDate: nowIso().slice(0, 10),
      extraction,
      suggestion,
    });
    return {
      id: result.lastID,
      message: assessment.ok
        ? "Report uploaded and parsed."
        : "Report uploaded. Auto-read was limited, so you may need to review or add values manually.",
      extractionStatus: assessment.ok ? "parsed" : "review_needed",
    };
  });

  fastify.get("/api/records/:recordId/download", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { recordId } = request.params;
    const record = await get(
      `SELECT id, file_name, file_path, mimetype FROM medical_records
       WHERE id = ? AND user_id = ?`,
      [recordId, request.authUser.id],
    );
    if (!record) return reply.code(404).send({ error: "Record not found." });
    if (!fs.existsSync(record.file_path)) return reply.code(404).send({ error: "Record file missing." });
    const attachmentName = String(record.file_name || "record").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    reply.header("Content-Type", record.mimetype || "application/octet-stream");
    reply.header("Content-Disposition", `attachment; filename="${attachmentName}"`);
    return reply.send(fs.createReadStream(record.file_path));
  });

  fastify.delete("/api/records/:recordId", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { recordId } = request.params;
    const record = await get(
      `SELECT id, file_path
       FROM medical_records
       WHERE id = ? AND user_id = ?`,
      [recordId, request.authUser.id],
    );
    if (!record) return reply.code(404).send({ error: "Record not found." });

    const analysisRows = await all(`SELECT id FROM medical_record_analyses WHERE record_id = ?`, [recordId]);
    for (const analysis of analysisRows) {
      await run(`DELETE FROM medical_record_metrics WHERE analysis_id = ?`, [analysis.id]);
      await run(`DELETE FROM medical_record_analyses WHERE id = ?`, [analysis.id]);
    }
    const sectionRows = await all(`SELECT id FROM medical_record_section_analyses WHERE record_id = ?`, [recordId]);
    for (const section of sectionRows) {
      await run(`DELETE FROM medical_record_section_metrics WHERE section_analysis_id = ?`, [section.id]);
      await run(`DELETE FROM medical_record_section_analyses WHERE id = ?`, [section.id]);
    }
    await run(`DELETE FROM medical_record_extractions WHERE record_id = ?`, [recordId]);
    await run("DELETE FROM medical_records WHERE id = ? AND user_id = ?", [recordId, request.authUser.id]);
    try {
      if (record.file_path && fs.existsSync(record.file_path)) {
        fs.unlinkSync(record.file_path);
      }
    } catch (error) {
      request.log.error(error);
    }
    return { ok: true };
  });

  fastify.get("/api/profile/:userId", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { userId } = request.params;
    if (!canAccessUser(request, userId)) {
      return reply.code(403).send({ error: "Forbidden." });
    }
    const profile = await readPatientProfileByUserId(userId);
    if (!profile) return reply.code(404).send({ error: "Profile not found." });
    return { profile };
  });

  fastify.get("/api/abha/history", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const rows = await all(
      `SELECT id, abha_number, abha_address, action, status, source, notes, payload_json, created_at
       FROM abha_link_events
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 20`,
      [request.authUser.id],
    );
    return {
      history: rows.map((row) => ({
        id: row.id,
        abhaNumber: row.abha_number || "",
        abhaAddress: row.abha_address || "",
        action: row.action,
        status: row.status,
        source: row.source || "",
        notes: row.notes || "",
        payload: row.payload_json ? safeJsonParse(row.payload_json, {}) : {},
        createdAt: row.created_at,
      })),
    };
  });

  fastify.get("/api/admin/abha/review-queue", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    if (!["admin", "front_desk"].includes(request.authUser.role)) {
      return reply.code(403).send({ error: "Forbidden." });
    }
    const rows = await all(
      `SELECT
          u.id AS patient_id,
          u.name AS patient_name,
          u.patient_uid,
          u.email AS patient_email,
          p.phone,
          p.abha_number,
          p.abha_address,
          p.abha_status,
          p.abha_last_error,
          pr.unit_department_name,
          pr.unit_doctor_name,
          (
            SELECT created_at
            FROM abha_link_events e
            WHERE e.user_id = u.id AND e.action = 'verification_requested'
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ) AS requested_at,
          (
            SELECT notes
            FROM abha_link_events e
            WHERE e.user_id = u.id AND e.action = 'verification_requested'
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ) AS request_notes
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN patient_registration_details pr ON pr.user_id = u.id
       WHERE u.role = 'patient'
         AND p.abha_status IN ('pending_verification', 'verification_rejected')
       ORDER BY
         CASE p.abha_status WHEN 'pending_verification' THEN 0 ELSE 1 END,
         COALESCE(requested_at, u.created_at) DESC`,
      [],
    );
    return {
      queue: rows.map((row) => ({
        patientId: row.patient_id,
        patientName: row.patient_name,
        patientUid: row.patient_uid || `PID${String(row.patient_id).padStart(6, "0")}`,
        patientEmail: row.patient_email || "",
        phone: row.phone || "",
        abhaNumber: row.abha_number || "",
        abhaAddress: row.abha_address || "",
        abhaStatus: row.abha_status || "not_linked",
        abhaLastError: row.abha_last_error || "",
        departmentName: row.unit_department_name || "",
        doctorName: row.unit_doctor_name || "",
        requestedAt: row.requested_at || null,
        requestNotes: row.request_notes || "",
      })),
    };
  });

  fastify.get("/api/admin/abha/:patientId/history", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    if (!["admin", "front_desk"].includes(request.authUser.role)) {
      return reply.code(403).send({ error: "Forbidden." });
    }
    const patientId = Number(request.params?.patientId || 0);
    if (!patientId) return reply.code(400).send({ error: "Valid patient id is required." });
    const rows = await all(
      `SELECT id, abha_number, abha_address, action, status, source, notes, payload_json, created_at
       FROM abha_link_events
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 20`,
      [patientId],
    );
    return {
      history: rows.map((row) => ({
        id: row.id,
        abhaNumber: row.abha_number || "",
        abhaAddress: row.abha_address || "",
        action: row.action,
        status: row.status,
        source: row.source || "",
        notes: row.notes || "",
        payload: row.payload_json ? safeJsonParse(row.payload_json, {}) : {},
        createdAt: row.created_at,
      })),
    };
  });

  fastify.post("/api/abha/request-verification", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const targetUserId = request.authUser.id;
    const existing = await get(
      `SELECT abha_number, abha_address, abha_status, abha_verified_at, abha_link_source
       FROM profiles
       WHERE user_id = ?`,
      [targetUserId],
    );

    if (!existing) {
      return reply.code(400).send({ error: "Save your profile before requesting ABHA verification." });
    }

    const validation = validateAbhaIdentity({
      abhaNumber: existing.abha_number,
      abhaAddress: existing.abha_address,
    });
    if (!validation.ok) {
      return reply.code(400).send({ error: validation.error });
    }
    const { normalizedNumber: normalizedAbhaNumber, normalizedAddress: normalizedAbhaAddress } = validation;
    if (!normalizedAbhaNumber && !normalizedAbhaAddress) {
      return reply.code(400).send({ error: "Add ABHA number or ABHA address first." });
    }

    if (String(existing.abha_status || "").toLowerCase() === "verified") {
      return reply.code(409).send({ error: "ABHA is already verified for this profile." });
    }
    if (String(existing.abha_status || "").toLowerCase() === "pending_verification") {
      return reply.code(409).send({ error: "ABHA verification is already pending review." });
    }
    const conflictingProfile = await findConflictingAbhaIdentity({
      userId: targetUserId,
      abhaNumber: normalizedAbhaNumber,
      abhaAddress: normalizedAbhaAddress,
    });
    if (conflictingProfile) {
      return reply.code(409).send({
        error: "These ABHA details are already linked to another patient profile.",
      });
    }

    const createdAt = nowIso();
    await run(
      `UPDATE profiles
       SET abha_status = ?, abha_verified_at = ?, abha_link_source = ?, abha_last_synced_at = ?, abha_last_error = ?, updated_at = ?
       WHERE user_id = ?`,
      ["pending_verification", null, "verification_requested", null, null, createdAt, targetUserId],
    );

    await run(
      `INSERT INTO abha_link_events
       (user_id, abha_number, abha_address, action, status, source, notes, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        targetUserId,
        normalizedAbhaNumber || null,
        normalizedAbhaAddress || null,
        "verification_requested",
        "pending_verification",
        "patient_portal",
        "Verification requested. Hospital team can review the ABHA details and complete ABDM linkage later.",
        JSON.stringify({
          requestedBy: "patient",
        }),
        createdAt,
      ],
    );

    const reviewers = await all(
      `SELECT id
       FROM users
       WHERE role IN ('admin', 'front_desk')
         AND active = 1`,
      [],
    );
    await Promise.all(
      reviewers.map((reviewer) =>
        enqueueAndDeliverUserNotification
          ? enqueueAndDeliverUserNotification({
              userId: reviewer.id,
              type: "abha_review",
              title: "ABHA verification requested",
              message: `${request.authUser.name || "A patient"} requested ABHA verification.`,
              relatedId: targetUserId,
              eventKey: `abha-request-${targetUserId}-${createdAt}-${reviewer.id}`,
            })
          : Promise.resolve(),
      ),
    );

    const profile = await readPatientProfileByUserId(targetUserId);
    return {
      ok: true,
      message: "ABHA verification request submitted.",
      profile,
    };
  });

  fastify.post("/api/admin/abha/:patientId/review", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    if (!["admin", "front_desk"].includes(request.authUser.role)) {
      return reply.code(403).send({ error: "Forbidden." });
    }
    const patientId = Number(request.params?.patientId || 0);
    const decision = String(request.body?.decision || "").trim().toLowerCase();
    const note = String(request.body?.note || "").trim();
    if (!patientId) return reply.code(400).send({ error: "Valid patient id is required." });
    if (!["approve", "reject"].includes(decision)) {
      return reply.code(400).send({ error: "Decision must be approve or reject." });
    }

    const existing = await get(
      `SELECT abha_number, abha_address, abha_status
       FROM profiles
       WHERE user_id = ?`,
      [patientId],
    );
    if (!existing) {
      return reply.code(404).send({ error: "Patient profile not found." });
    }
    if (!String(existing.abha_number || "").trim() && !String(existing.abha_address || "").trim()) {
      return reply.code(400).send({ error: "Patient does not have ABHA details to review." });
    }
    const currentStatus = String(existing.abha_status || "").toLowerCase();
    if (currentStatus !== "pending_verification") {
      return reply.code(409).send({ error: "Only pending ABHA requests can be reviewed." });
    }
    if (decision === "reject" && !note) {
      return reply.code(400).send({ error: "Add a review note before rejecting ABHA details." });
    }
    const conflictingProfile = await findConflictingAbhaIdentity({
      userId: patientId,
      abhaNumber: normalizeAbhaNumber(existing.abha_number),
      abhaAddress: normalizeAbhaAddress(existing.abha_address),
    });
    if (decision === "approve" && conflictingProfile) {
      return reply.code(409).send({
        error: "These ABHA details already exist on another patient profile.",
      });
    }

    const createdAt = nowIso();
    if (decision === "approve") {
      await run(
        `UPDATE profiles
         SET abha_status = ?, abha_verified_at = ?, abha_link_source = ?, abha_last_synced_at = ?, abha_last_error = ?, updated_at = ?
         WHERE user_id = ?`,
        ["verified", createdAt, "ops_verified", createdAt, null, createdAt, patientId],
      );
      await run(
        `INSERT INTO abha_link_events
         (user_id, abha_number, abha_address, action, status, source, notes, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientId,
          existing.abha_number || null,
          existing.abha_address || null,
          "verification_approved",
          "verified",
          request.authUser.role,
          note || "ABHA details reviewed and marked verified by hospital operations.",
          JSON.stringify({
            reviewedByUserId: request.authUser.id,
            reviewedByName: request.authUser.name || "",
            reviewedByRole: request.authUser.role || "",
          }),
          createdAt,
        ],
      );
      await (enqueueAndDeliverUserNotification
        ? enqueueAndDeliverUserNotification({
            userId: patientId,
            type: "abha_review",
            title: "ABHA verified",
            message: "Your ABHA details were reviewed and marked verified.",
            relatedId: patientId,
            eventKey: `abha-review-approve-${patientId}-${createdAt}`,
          })
        : Promise.resolve());
    } else {
      await run(
        `UPDATE profiles
         SET abha_status = ?, abha_verified_at = ?, abha_link_source = ?, abha_last_synced_at = ?, abha_last_error = ?, updated_at = ?
         WHERE user_id = ?`,
        ["verification_rejected", null, "ops_rejected", null, note || "ABHA details need correction.", createdAt, patientId],
      );
      await run(
        `INSERT INTO abha_link_events
         (user_id, abha_number, abha_address, action, status, source, notes, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patientId,
          existing.abha_number || null,
          existing.abha_address || null,
          "verification_rejected",
          "verification_rejected",
          request.authUser.role,
          note || "ABHA details were reviewed and need correction before verification.",
          JSON.stringify({
            reviewedByUserId: request.authUser.id,
            reviewedByName: request.authUser.name || "",
            reviewedByRole: request.authUser.role || "",
          }),
          createdAt,
        ],
      );
      await (enqueueAndDeliverUserNotification
        ? enqueueAndDeliverUserNotification({
            userId: patientId,
            type: "abha_review",
            title: "ABHA needs correction",
            message: note || "Your ABHA details need correction before verification.",
            relatedId: patientId,
            eventKey: `abha-review-reject-${patientId}-${createdAt}`,
          })
        : Promise.resolve());
    }

    const profile = await readPatientProfileByUserId(patientId);
    return {
      ok: true,
      message: decision === "approve" ? "ABHA marked verified." : "ABHA sent back for correction.",
      profile,
    };
  });

  fastify.post("/api/profile", async (request, reply) => {
    const {
      userId,
      fullName = "",
      email = "",
      age,
      weightKg = null,
      heightCm = null,
      sex,
      conditions = [],
      allergies = [],
      region,
      phone = "",
      abhaNumber = "",
      abhaAddress = "",
      addressLine1 = "",
      addressLine2 = "",
      address = "",
      bloodGroup = "",
      dateOfBirth = "",
      emergencyContactName = "",
      emergencyContactPhone = "",
      aadhaarNo = "",
      maritalStatus = "",
      city = "",
      state = "",
      country = "India",
      pinCode = "",
      registrationMode = "opd",
      visitTime = "",
      unitDepartmentId = null,
      unitDoctorId = null,
    } = request.body || {};
    if (!requireAuth(request, reply)) return;
    const targetUserId =
      request.authUser?.role === "patient"
        ? request.authUser.id
        : userId || request.authUser.id;
    if (!targetUserId) return reply.code(400).send({ error: "User id required." });
    if (!canAccessUser(request, targetUserId)) return reply.code(403).send({ error: "Forbidden." });

    const normalizedName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const strictValidationErrors = validatePatientProfileCompleteness({
      fullName: normalizedName,
      email: normalizedEmail,
      registrationMode,
      visitTime,
      unitDepartmentId,
      unitDoctorId,
      weightKg,
      heightCm,
      sex,
      phone,
      abhaNumber,
      abhaAddress,
      addressLine1,
      addressLine2,
      aadhaarNo,
      maritalStatus,
      dateOfBirth,
      bloodGroup,
      city,
      state,
      country,
      pinCode,
      emergencyContactName,
      emergencyContactPhone,
    });
    if (Object.keys(strictValidationErrors).length > 0) {
      return reply.code(400).send({
        error: "Profile is incomplete. Fill all required fields before saving.",
        validationErrors: strictValidationErrors,
      });
    }
    const allowedVisitTypeCodes = await getAllowedVisitTypeCodes();
    const normalizedVisitTime = hospitalSettingsService.normalizeVisitTypeCode(visitTime);
    if (!allowedVisitTypeCodes.has(normalizedVisitTime)) {
      return reply.code(400).send({
        error: `visitTime must be one of: ${Array.from(allowedVisitTypeCodes).join(", ")}`,
      });
    }

    const emailInUse = await get(
      "SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?",
      [normalizedEmail, targetUserId],
    );
    if (emailInUse) {
      return reply.code(409).send({ error: "This email is already used by another account." });
    }

    const normalizedAddressLine1 = String(addressLine1 || "").trim();
    const normalizedAddressLine2 = String(addressLine2 || "").trim();
    const normalizedCity = String(city || "").trim();
    const normalizedState = String(state || "").trim();
    const normalizedCountry = String(country || "India").trim() || "India";
    const resolvedAddress = [
      normalizedAddressLine1,
      normalizedAddressLine2,
      normalizedCity,
      normalizedState,
      pinCode ? String(pinCode).trim() : "",
    ]
      .filter(Boolean)
      .join(", ");

    let departmentRow = null;
    let doctorRow = null;
    if (unitDepartmentId) {
      departmentRow = await get("SELECT id, name FROM departments WHERE id = ? AND active = 1", [Number(unitDepartmentId)]);
      if (!departmentRow) return reply.code(400).send({ error: "Valid unit department is required." });
    }
    if (unitDoctorId) {
      doctorRow = await get(
        `SELECT dp.doctor_id AS id, COALESCE(dp.display_name, u.name) AS name, dp.department_id
         FROM doctor_profiles dp
         JOIN users u ON u.id = dp.doctor_id
         WHERE dp.doctor_id = ? AND dp.active = 1`,
        [Number(unitDoctorId)],
      );
      if (!doctorRow) return reply.code(400).send({ error: "Valid unit doctor is required." });
      if (departmentRow && Number(doctorRow.department_id) !== Number(departmentRow.id)) {
        return reply.code(400).send({ error: "Selected doctor does not belong to selected unit department." });
      }
      if (!departmentRow && doctorRow.department_id) {
        departmentRow = await get("SELECT id, name FROM departments WHERE id = ? AND active = 1", [Number(doctorRow.department_id)]);
      }
    }

    await run("UPDATE users SET name = ?, email = ? WHERE id = ?", [normalizedName, normalizedEmail, targetUserId]);
    const existing = await get(
      `SELECT id, abha_number, abha_address, abha_status, abha_verified_at, abha_link_source, abha_last_synced_at
       FROM profiles WHERE user_id = ?`,
      [targetUserId],
    );
    const abhaValidation = validateAbhaIdentity({
      abhaNumber,
      abhaAddress,
    });
    if (!abhaValidation.ok) {
      return reply.code(400).send({ error: abhaValidation.error });
    }
    const normalizedAbhaNumber = abhaValidation.normalizedNumber;
    const normalizedAbhaAddress = abhaValidation.normalizedAddress;
    const hasAbhaIdentity = Boolean(normalizedAbhaNumber || normalizedAbhaAddress);
    const conflictingAbhaProfile = hasAbhaIdentity
      ? await findConflictingAbhaIdentity({
          userId: targetUserId,
          abhaNumber: normalizedAbhaNumber,
          abhaAddress: normalizedAbhaAddress,
        })
      : null;
    if (conflictingAbhaProfile) {
      return reply.code(409).send({
        error: "These ABHA details are already linked to another patient profile.",
      });
    }
    const preservingExistingIdentity =
      ["verified", "pending_verification"].includes(String(existing?.abha_status || "").toLowerCase()) &&
      String(existing?.abha_number || "") === normalizedAbhaNumber &&
      String(existing?.abha_address || "") === normalizedAbhaAddress;
    const resolvedAbhaStatus = hasAbhaIdentity
      ? preservingExistingIdentity
        ? String(existing?.abha_status || "").toLowerCase() === "verified"
          ? "verified"
          : "pending_verification"
        : "self_reported"
      : "not_linked";
    const resolvedAbhaVerifiedAt =
      String(existing?.abha_status || "").toLowerCase() === "verified" && preservingExistingIdentity
        ? existing?.abha_verified_at || nowIso()
        : null;
    const resolvedAbhaLinkSource = hasAbhaIdentity
      ? preservingExistingIdentity
        ? existing?.abha_link_source || (resolvedAbhaStatus === "verified" ? "abdm_verified" : "verification_requested")
        : "patient_self_reported"
      : null;
    const resolvedAbhaLastSyncedAt =
      String(existing?.abha_status || "").toLowerCase() === "verified" && preservingExistingIdentity
        ? existing?.abha_last_synced_at || nowIso()
        : null;
    const abhaChanged =
      String(existing?.abha_number || "") !== normalizedAbhaNumber ||
      String(existing?.abha_address || "") !== normalizedAbhaAddress ||
      String(existing?.abha_status || "") !== resolvedAbhaStatus;
    if (existing) {
      await run(
        `UPDATE profiles
         SET age = ?, sex = ?, conditions = ?, allergies = ?, region = ?, phone = ?, address = ?, blood_group = ?, date_of_birth = ?,
             address_line_1 = ?, address_line_2 = ?, weight_kg = ?, height_cm = ?,
             abha_number = ?, abha_address = ?, abha_status = ?, abha_verified_at = ?, abha_link_source = ?, abha_last_synced_at = ?, abha_last_error = ?,
             emergency_contact_name = ?, emergency_contact_phone = ?, updated_at = ?
         WHERE user_id = ?`,
        [
          age || null,
          sex || null,
          JSON.stringify(conditions),
          JSON.stringify(allergies),
          region || null,
          phone || null,
          resolvedAddress || null,
          bloodGroup || null,
          dateOfBirth || null,
          normalizedAddressLine1 || null,
          normalizedAddressLine2 || null,
          weightKg || null,
          heightCm || null,
          normalizedAbhaNumber || null,
          normalizedAbhaAddress || null,
          resolvedAbhaStatus,
          resolvedAbhaVerifiedAt,
          resolvedAbhaLinkSource,
          resolvedAbhaLastSyncedAt,
          preservingExistingIdentity ? null : null,
          emergencyContactName || null,
          emergencyContactPhone || null,
          nowIso(),
          targetUserId,
        ],
      );
    } else {
      await run(
        `INSERT INTO profiles
         (user_id, age, sex, conditions, allergies, region, phone, address, blood_group, date_of_birth,
          address_line_1, address_line_2, weight_kg, height_cm,
          abha_number, abha_address, abha_status, abha_verified_at, abha_link_source, abha_last_synced_at, abha_last_error,
          emergency_contact_name, emergency_contact_phone, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUserId,
          age || null,
          sex || null,
          JSON.stringify(conditions),
          JSON.stringify(allergies),
          region || null,
          phone || null,
          resolvedAddress || null,
          bloodGroup || null,
          dateOfBirth || null,
          normalizedAddressLine1 || null,
          normalizedAddressLine2 || null,
          weightKg || null,
          heightCm || null,
          normalizedAbhaNumber || null,
          normalizedAbhaAddress || null,
          resolvedAbhaStatus,
          resolvedAbhaVerifiedAt,
          resolvedAbhaLinkSource,
          resolvedAbhaLastSyncedAt,
          null,
          emergencyContactName || null,
          emergencyContactPhone || null,
          nowIso(),
        ],
      );
    }

    if (abhaChanged) {
      await run(
        `INSERT INTO abha_link_events
         (user_id, abha_number, abha_address, action, status, source, notes, payload_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUserId,
          normalizedAbhaNumber || null,
          normalizedAbhaAddress || null,
          hasAbhaIdentity ? "profile_updated" : "cleared",
          resolvedAbhaStatus,
          "patient_profile",
          hasAbhaIdentity
            ? resolvedAbhaStatus === "pending_verification"
              ? "ABHA details updated while verification is pending."
              : "ABHA details saved from patient profile. Live ABDM verification is pending."
            : "ABHA details cleared from patient profile.",
          JSON.stringify({
            preservingExistingIdentity,
            hasAbhaIdentity,
          }),
          nowIso(),
        ],
      );
    }

    await run("UPDATE users SET registration_mode = ? WHERE id = ?", [registrationMode === "pid" ? "pid" : "opd", targetUserId]);
    const existingReg = await get("SELECT id FROM patient_registration_details WHERE user_id = ?", [targetUserId]);
    if (existingReg) {
      await run(
        `UPDATE patient_registration_details
         SET visit_time = ?, unit_department_id = ?, unit_department_name = ?, unit_doctor_id = ?, unit_doctor_name = ?,
             aadhaar_no = ?, marital_status = ?, district = ?, city = ?, state = ?, country = ?, pin_code = ?, updated_at = ?
         WHERE user_id = ?`,
        [
          normalizedVisitTime,
          departmentRow?.id || null,
          departmentRow?.name || null,
          doctorRow?.id || null,
          doctorRow?.name || null,
          aadhaarNo || null,
          maritalStatus || null,
          null,
          normalizedCity || null,
          normalizedState || null,
          normalizedCountry || null,
          pinCode || null,
          nowIso(),
          targetUserId,
        ],
      );
    } else {
      await run(
        `INSERT INTO patient_registration_details
         (user_id, visit_time, unit_department_id, unit_department_name, unit_doctor_id, unit_doctor_name,
          aadhaar_no, marital_status, district, city, state, country, pin_code, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetUserId,
          normalizedVisitTime,
          departmentRow?.id || null,
          departmentRow?.name || null,
          doctorRow?.id || null,
          doctorRow?.name || null,
          aadhaarNo || null,
          maritalStatus || null,
          null,
          normalizedCity || null,
          normalizedState || null,
          normalizedCountry || null,
          pinCode || null,
          nowIso(),
        ],
      );
    }

    const updatedUser = await get("SELECT id, name, email, role FROM users WHERE id = ?", [targetUserId]);
    const savedProfile = await readPatientProfileByUserId(targetUserId);
    return {
      ok: true,
      user: updatedUser
        ? { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role || "patient" }
        : null,
      profile: savedProfile,
    };
  });

  fastify.post("/api/share-pass", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    await purgeExpiredSharePasses();
    const rl = checkRateLimit(`sharepass:${request.authUser.id}:${request.ip}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
    }
    const { userId, memberId, expiresInMinutes } = request.body || {};
    const targetUserId = userId || request.authUser.id;
    if (!targetUserId) return reply.code(400).send({ error: "User id required." });
    if (!canAccessUser(request, targetUserId)) return reply.code(403).send({ error: "Forbidden." });
    if (memberId) {
      const member = await getFamilyMember(request.authUser.id, memberId);
      if (!member) return reply.code(404).send({ error: "Selected family member not found." });
    }

    const user = await get("SELECT id FROM users WHERE id = ?", [targetUserId]);
    if (!user) return reply.code(404).send({ error: "User not found." });

    const existingPasses = await all(
      `SELECT code FROM share_passes
       WHERE user_id = ? AND ((member_id IS NULL AND ? IS NULL) OR member_id = ?)`,
      [targetUserId, memberId || null, memberId || null],
    );
    for (const row of existingPasses) {
      await run("DELETE FROM share_access_logs WHERE pass_code = ?", [row.code]);
    }
    await run(
      `DELETE FROM share_passes
       WHERE user_id = ? AND ((member_id IS NULL AND ? IS NULL) OR member_id = ?)`,
      [targetUserId, memberId || null, memberId || null],
    );

    const ttlMinutes = Math.max(5, Math.min(Number(expiresInMinutes) || 30, 240));
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
    let code = null;
    for (let i = 0; i < 5; i += 1) {
      const candidate = createShareCode();
      try {
        await run(
          "INSERT INTO share_passes (user_id, member_id, code, expires_at, is_used, created_at) VALUES (?, ?, ?, ?, 0, ?)",
          [targetUserId, memberId || null, candidate, expiresAt, nowIso()],
        );
        code = candidate;
        break;
      } catch (error) {
        if (!String(error?.message || "").includes("UNIQUE")) throw error;
      }
    }
    if (!code) return reply.code(500).send({ error: "Unable to generate unique share code." });
    await incrementMetric(metricDate(), "share_pass_generated");

    return { code, expiresAt, expiresInMinutes: ttlMinutes, doctorUrl: `/doctor-view/${code}` };
  });

  fastify.get("/api/share-passes", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    await purgeExpiredSharePasses();
    const rows = await all(
      `SELECT code, member_id, expires_at, is_used, created_at, revoked_at, revoked_by
       FROM share_passes
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [request.authUser.id],
    );
    return {
      passes: rows.map((row) => ({
        code: row.code,
        memberId: row.member_id,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        isUsed: Number(row.is_used) === 1,
        revokedAt: row.revoked_at || null,
        revokedBy: row.revoked_by || null,
        active:
          !row.revoked_at &&
          Number(row.is_used) !== 1 &&
          new Date(row.expires_at).getTime() > Date.now(),
      })),
    };
  });

  fastify.post("/api/share-pass/:code/revoke", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { code } = request.params;
    if (!code) return reply.code(400).send({ error: "Code required." });
    const pass = await get("SELECT user_id, revoked_at FROM share_passes WHERE code = ?", [code]);
    if (!pass) return reply.code(404).send({ error: "Share pass not found." });
    if (!canAccessUser(request, pass.user_id)) return reply.code(403).send({ error: "Forbidden." });
    if (pass.revoked_at) return { ok: true };
    await run("UPDATE share_passes SET revoked_at = ?, revoked_by = ?, is_used = 1 WHERE code = ?", [nowIso(), request.authUser.id, code]);
    return { ok: true };
  });

  fastify.get("/api/share-pass/:code", async (request, reply) => {
    await purgeExpiredSharePasses();
    const { code } = request.params;
    const doctorName = String(request.query.doctorName || "").trim();
    if (!code) return reply.code(400).send({ error: "Code required." });

    const pass = await get(
      `SELECT sp.user_id, sp.member_id, sp.expires_at, sp.is_used, sp.revoked_at, u.name, u.email
       FROM share_passes sp
       JOIN users u ON u.id = sp.user_id
       WHERE sp.code = ?`,
      [code],
    );
    if (!pass) return reply.code(404).send({ error: "Share pass not found." });
    if (new Date(pass.expires_at).getTime() < Date.now()) return reply.code(410).send({ error: "Share pass expired." });
    if (pass.revoked_at) return reply.code(410).send({ error: "Share pass revoked." });
    if (Number(pass.is_used) === 1) return reply.code(410).send({ error: "Share pass already used." });

    await incrementMetric(metricDate(), "doctor_view_opened");
    await run(
      `INSERT INTO share_access_logs (pass_code, user_id, member_id, doctor_name, viewed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [code, pass.user_id, pass.member_id || null, doctorName || null, nowIso()],
    );
    await run("UPDATE share_passes SET is_used = 1 WHERE code = ?", [code]);

    const profile = pass.member_id
      ? await get(
          `SELECT id, name, relation, age, sex, blood_type, conditions, allergies
           FROM family_members WHERE id = ? AND user_id = ?`,
          [pass.member_id, pass.user_id],
        )
      : await get("SELECT * FROM profiles WHERE user_id = ?", [pass.user_id]);
    const historyRows = await all(
      `SELECT payload, result, created_at FROM triage_logs
       WHERE user_id = ? AND (? IS NULL OR member_id = ?)
       ORDER BY created_at DESC LIMIT 5`,
      [pass.user_id, pass.member_id || null, pass.member_id || null],
    );
    const recordRows = await all(
      `SELECT id, file_name, mimetype, created_at
       FROM medical_records
       WHERE user_id = ? AND (? IS NULL OR member_id = ?)
       ORDER BY created_at DESC LIMIT 10`,
      [pass.user_id, pass.member_id || null, pass.member_id || null],
    );

    return {
      patient: {
        name: profile?.name || pass.name,
        email: pass.email,
        relation: profile?.relation || "self",
      },
      profile: profile
        ? {
            age: profile.age,
            sex: profile.sex,
            bloodType: profile.blood_type || null,
            region: profile.region || null,
            conditions: profile.conditions ? safeJsonParse(profile.conditions, []) : [],
            allergies: profile.allergies ? safeJsonParse(profile.allergies, []) : [],
          }
        : null,
      recentGuidance: historyRows.map((row) => ({
        createdAt: row.created_at,
        payload: row.payload ? safeJsonParse(row.payload, null) : null,
        result: row.result ? safeJsonParse(row.result, null) : null,
      })),
      records: recordRows.map((row) => ({
        ...row,
        downloadUrl: `/api/share-pass/${code}/records/${row.id}/download`,
      })),
      expiresAt: pass.expires_at,
    };
  });

  fastify.get("/api/share-pass/:code/records/:recordId/download", async (request, reply) => {
    const { code, recordId } = request.params;
    const pass = await get(
      `SELECT user_id, member_id, expires_at
       FROM share_passes
       WHERE code = ?`,
      [code],
    );
    if (!pass) return reply.code(404).send({ error: "Share pass not found." });
    if (new Date(pass.expires_at).getTime() < Date.now()) return reply.code(410).send({ error: "Share pass expired." });

    const accessLog = await get("SELECT id FROM share_access_logs WHERE pass_code = ? LIMIT 1", [code]);
    if (!accessLog) return reply.code(403).send({ error: "Open patient summary first." });

    const record = await get(
      `SELECT id, file_name, file_path, mimetype
       FROM medical_records
       WHERE id = ? AND user_id = ? AND (? IS NULL OR member_id = ?)`,
      [recordId, pass.user_id, pass.member_id || null, pass.member_id || null],
    );
    if (!record) return reply.code(404).send({ error: "Record not found." });
    if (!fs.existsSync(record.file_path)) return reply.code(404).send({ error: "Record file missing." });
    const attachmentName = String(record.file_name || "record").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    reply.header("Content-Type", record.mimetype || "application/octet-stream");
    reply.header("Content-Disposition", `attachment; filename="${attachmentName}"`);
    return reply.send(fs.createReadStream(record.file_path));
  });

  fastify.get("/api/share-history", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    await purgeExpiredSharePasses();
    const rows = await all(
      `SELECT code, member_id, expires_at, created_at, is_used, revoked_at
       FROM share_passes
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [request.authUser.id],
    );
    return {
      history: rows.map((row) => ({
        code: row.code,
        memberId: row.member_id,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        isUsed: Number(row.is_used) === 1,
        revokedAt: row.revoked_at || null,
        active:
          !row.revoked_at &&
          Number(row.is_used) !== 1 &&
          new Date(row.expires_at).getTime() > Date.now(),
      })),
    };
  });

  fastify.post("/api/share-pass/:code/rating", async (request, reply) => {
    await purgeExpiredSharePasses();
    const { code } = request.params;
    const { rating } = request.body || {};
    if (!code || !rating) return reply.code(400).send({ error: "Code and rating are required." });
    if (!["useful", "not_useful"].includes(rating)) return reply.code(400).send({ error: "Invalid rating value." });

    const pass = await get("SELECT user_id, expires_at FROM share_passes WHERE code = ?", [code]);
    if (!pass) return reply.code(404).send({ error: "Share pass not found." });
    if (new Date(pass.expires_at).getTime() < Date.now()) return reply.code(410).send({ error: "Share pass expired." });

    await run(
      `INSERT INTO doctor_ratings (share_code, user_id, rating, created_at)
       VALUES (?, ?, ?, ?)`,
      [code, pass.user_id, rating, nowIso()],
    );
    await run(
      `INSERT INTO analytics_events (user_id, event_name, event_payload, created_at)
       VALUES (?, ?, ?, ?)`,
      [pass.user_id, "doctor_quick_rating", JSON.stringify({ shareCode: code, rating }), nowIso()],
    );
    return { ok: true };
  });

  fastify.post("/api/consent", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { consentType, policyVersion, accepted } = request.body || {};
    if (!consentType || !policyVersion || typeof accepted !== "boolean") {
      return reply.code(400).send({ error: "consentType, policyVersion, and accepted(boolean) are required." });
    }
    await run(
      `INSERT INTO consent_logs (user_id, consent_type, policy_version, accepted, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [request.authUser.id, consentType, policyVersion, accepted ? 1 : 0, nowIso()],
    );
    return { ok: true };
  });

  fastify.post("/api/emergency-card", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { memberId = null } = request.body || {};
    if (memberId) {
      const member = await getFamilyMember(request.authUser.id, memberId);
      if (!member) return reply.code(404).send({ error: "Selected family member not found." });
    }
    const publicId = createPublicId();
    await run(
      `INSERT INTO emergency_cards (user_id, member_id, public_id, active, created_at)
       VALUES (?, ?, ?, 1, ?)`,
      [request.authUser.id, memberId || null, publicId, nowIso()],
    );
    return { publicId, publicUrl: `/emergency/${publicId}` };
  });

  fastify.get("/api/emergency/:publicId", async (request, reply) => {
    const { publicId } = request.params;
    const card = await get(
      `SELECT ec.user_id, ec.member_id, ec.active, u.name AS user_name
       FROM emergency_cards ec
       JOIN users u ON u.id = ec.user_id
       WHERE ec.public_id = ?`,
      [publicId],
    );
    if (!card || Number(card.active) !== 1) return reply.code(404).send({ error: "Emergency card not found." });

    const member = card.member_id
      ? await get(
          `SELECT name, relation, age, sex, blood_type, conditions, allergies
           FROM family_members WHERE id = ? AND user_id = ?`,
          [card.member_id, card.user_id],
        )
      : null;
    const profile = card.member_id ? null : await get("SELECT age, sex, conditions, allergies, region FROM profiles WHERE user_id = ?", [card.user_id]);

    return {
      patient: {
        name: member?.name || card.user_name,
        relation: member?.relation || "self",
        age: member?.age ?? profile?.age ?? null,
        sex: member?.sex || profile?.sex || null,
        bloodType: member?.blood_type || null,
        region: profile?.region || null,
        conditions: member?.conditions
          ? safeJsonParse(member.conditions, [])
          : profile?.conditions
            ? safeJsonParse(profile.conditions, [])
            : [],
        allergies: member?.allergies
          ? safeJsonParse(member.allergies, [])
          : profile?.allergies
            ? safeJsonParse(profile.allergies, [])
            : [],
      },
      disclaimer: "Emergency card is informational only. For urgent conditions seek immediate medical care.",
    };
  });

  fastify.post("/api/events", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { eventName, payload } = request.body || {};
    if (!eventName) return reply.code(400).send({ error: "eventName is required." });
    await run(
      `INSERT INTO analytics_events (user_id, event_name, event_payload, created_at)
       VALUES (?, ?, ?, ?)`,
      [request.authUser.id, eventName, payload ? JSON.stringify(payload) : null, nowIso()],
    );
    return { ok: true };
  });

  fastify.get("/api/privacy/export", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const userId = request.authUser.id;
    const user = await get("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [userId]);
    const profile = await get("SELECT * FROM profiles WHERE user_id = ?", [userId]);
    const triageLogs = await all(
      "SELECT payload, result, created_at FROM triage_logs WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
    const consents = await all(
      "SELECT consent_type, policy_version, accepted, created_at FROM consent_logs WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
    const events = await all(
      "SELECT event_name, event_payload, created_at FROM analytics_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
      [userId],
    );
    return {
      exportedAt: nowIso(),
      user,
      profile: profile
        ? {
            ...profile,
            conditions: profile.conditions ? safeJsonParse(profile.conditions, []) : [],
            allergies: profile.allergies ? safeJsonParse(profile.allergies, []) : [],
          }
        : null,
      triageLogs: triageLogs.map((row) => ({
        createdAt: row.created_at,
        payload: row.payload ? safeJsonParse(row.payload, null) : null,
        result: row.result ? safeJsonParse(row.result, null) : null,
      })),
      consentLogs: consents.map((row) => ({
        consentType: row.consent_type,
        policyVersion: row.policy_version,
        accepted: !!row.accepted,
        createdAt: row.created_at,
      })),
      analyticsEvents: events.map((row) => ({
        eventName: row.event_name,
        eventPayload: row.event_payload ? safeJsonParse(row.event_payload, null) : null,
        createdAt: row.created_at,
      })),
    };
  });

  fastify.delete("/api/privacy/me", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const userId = request.authUser.id;
    await run("DELETE FROM share_access_logs WHERE user_id = ?", [userId]);
    await run("DELETE FROM emergency_cards WHERE user_id = ?", [userId]);
    await run("DELETE FROM doctor_ratings WHERE user_id = ?", [userId]);
    await run("DELETE FROM medical_records WHERE user_id = ?", [userId]);
    await run("DELETE FROM family_members WHERE user_id = ?", [userId]);
    await run("DELETE FROM share_passes WHERE user_id = ?", [userId]);
    await run("DELETE FROM ward_listing WHERE patient_id = ?", [userId]);
    await run("DELETE FROM store_orders WHERE patient_id = ?", [userId]);
    await run("DELETE FROM direct_patient_indents WHERE patient_id = ?", [userId]);
    await run("DELETE FROM pharmacy_indent_issues WHERE patient_id = ?", [userId]);
    await run(
      "DELETE FROM marketplace_request_timeline WHERE request_id IN (SELECT id FROM marketplace_requests WHERE user_id = ?)",
      [userId],
    );
    await run("DELETE FROM marketplace_requests WHERE user_id = ?", [userId]);
    await run("DELETE FROM triage_logs WHERE user_id = ?", [userId]);
    await run("DELETE FROM consent_logs WHERE user_id = ?", [userId]);
    await run("DELETE FROM analytics_events WHERE user_id = ?", [userId]);
    await run("DELETE FROM profiles WHERE user_id = ?", [userId]);
    await run("DELETE FROM users WHERE id = ?", [userId]);
    return { ok: true };
  });
};

module.exports = { registerPatientRoutes };
