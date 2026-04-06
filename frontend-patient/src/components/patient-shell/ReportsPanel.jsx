import { useMemo, useState } from "react";
import { ReportTrendChart } from "./ReportTrendChart";

const REPORT_GROUPS = [
  { key: "diabetes", title: "Diabetes panel", metricKeys: ["hba1c", "estimated_average_glucose", "fbs", "ppbs", "rbs"] },
  { key: "thyroid", title: "Thyroid panel", metricKeys: ["tsh", "t3", "t4"] },
  { key: "liver", title: "Liver panel", metricKeys: ["bilirubin_total", "sgpt_alt", "sgot_ast"] },
  { key: "lipid", title: "Lipid panel", metricKeys: ["total_cholesterol", "ldl", "hdl", "triglycerides"] },
  { key: "ckd", title: "Kidney panel", metricKeys: ["creatinine", "urea", "uric_acid"] },
  { key: "anemia", title: "Anemia / CBC panel", metricKeys: ["hemoglobin", "rbc_count", "pcv", "mcv", "mch", "mchc", "rdw", "wbc", "esr", "platelets"] },
  { key: "anthropometry", title: "Body metrics panel", metricKeys: ["weight", "bmi"] },
];

export function ReportsPanel({
  records,
  reportCatalog,
  reportExtractionCapabilities,
  reportInsights,
  reportInsightsStatus,
  reportInsightsMonths,
  setReportInsightsMonths,
  activeAnalysisRecordId,
  setActiveAnalysisRecordId,
  recordAnalysisDrafts,
  updateRecordAnalysisDraft,
  autoSuggestRecordAnalysis,
  saveRecordAnalysis,
  openRecordUploader,
  seedDemoReports,
  isLocalDemoHost,
  recordsInputRef,
  uploadRecord,
  recordStatus,
  apiBase,
  deleteRecord,
  t,
}) {
  const catalogMap = new Map((reportCatalog || []).map((item) => [item.key, item]));
  const [reportViewMode, setReportViewMode] = useState("condition");
  const [focusReviewFields, setFocusReviewFields] = useState({});
  const formatMetricValue = (metric) => {
    if (!metric) return "";
    const number = Number(metric.valueNum);
    if (!Number.isFinite(number)) return "";
    const value = Number.isInteger(number) ? String(number) : String(number);
    return `${metric.metricLabel}: ${value}${metric.unit ? ` ${metric.unit}` : ""}`;
  };
  const groupedPanels = useMemo(() => {
    const trendMap = new Map((reportInsights?.trends || []).map((trend) => [trend.metricKey, trend]));
    const summaryMap = new Map((reportInsights?.conditionSummaries || []).map((item) => [item.key, item]));
    return REPORT_GROUPS.map((group) => {
      const trends = group.metricKeys.map((metricKey) => trendMap.get(metricKey)).filter(Boolean);
      return {
        ...group,
        trends,
        summary: summaryMap.get(group.key) || null,
      };
    }).filter((group) => group.trends.length || group.summary);
  }, [reportInsights]);
  const latestRecordDate = records[0]?.created_at ? new Date(records[0].created_at).toLocaleDateString() : "-";
  const reviewTrendCount = (reportInsights?.trends || []).filter((trend) => trend.needsReview).length;

  return (
    <section className="panel">
      <div className="report-shell-hero">
        <div>
          <p className="eyebrow">Lab reports</p>
          <h2>Your test insights in one place</h2>
          <p className="panel-sub">Upload reports, capture key values, and view trend summaries over time.</p>
        </div>
        <div className="report-shell-stats">
          <article className="report-shell-stat">
            <span className="mini-label">Reports</span>
            <strong>{records.length}</strong>
            <span className="micro">Uploaded to your health record</span>
          </article>
          <article className="report-shell-stat">
            <span className="mini-label">Latest upload</span>
            <strong>{latestRecordDate}</strong>
            <span className="micro">Most recent lab document</span>
          </article>
          <article className="report-shell-stat">
            <span className="mini-label">Review flags</span>
            <strong>{reviewTrendCount}</strong>
            <span className="micro">Values that may need confirmation</span>
          </article>
        </div>
      </div>
      <div className="report-insights-topbar">
        <div className="action-row">
          <button type="button" className="primary" onClick={openRecordUploader}>Upload your lab reports</button>
          {isLocalDemoHost ? (
            <button type="button" className="secondary" onClick={seedDemoReports}>Load demo reports</button>
          ) : null}
        </div>
        <label className="report-month-filter">
          Trend window
          <select value={String(reportInsightsMonths)} onChange={(event) => setReportInsightsMonths(Number(event.target.value))}>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
          </select>
        </label>
      </div>
      <input ref={recordsInputRef} type="file" accept="image/*,application/pdf" onChange={uploadRecord} style={{ display: "none" }} />
      {recordStatus && <p className="micro">{recordStatus}</p>}
      {reportInsightsStatus && <p className="micro">{reportInsightsStatus}</p>}
      {reportExtractionCapabilities ? (
        <p className="micro report-support-note">
          Auto-detect on this server:
          {" "}
          {reportExtractionCapabilities.pdftotext || reportExtractionCapabilities.swiftVisionOcr ? "PDF supported" : "PDF extractor unavailable"}
          {" • "}
          {reportExtractionCapabilities.tesseract || reportExtractionCapabilities.swiftVisionOcr ? "Image OCR supported" : "Image OCR unavailable"}
        </p>
      ) : null}
      <p className="micro report-support-note">
        Supported uploads: clear PDF reports or sharp images. Blurry, dark, or unsupported report formats will be rejected so inaccurate insights are not shown.
      </p>

      <div className="report-insight-summary panel-subsection">
        <div className="section-head compact">
          <div>
            <p className="micro strong">Insight summary</p>
            <p className="micro">{reportInsights?.patientSummary || "Upload and annotate reports to start seeing summaries."}</p>
          </div>
        </div>
        <div className="report-trend-grid">
          {(reportInsights?.badges || []).map((badge) => (
            <div key={badge.key} className={`report-badge report-zone-${badge.zone}`}>{badge.label}</div>
          ))}
        </div>
        <div className="history-list compact-list report-condition-summary-list">
          {(reportInsights?.conditionSummaries || []).map((item) => (
            <div key={item.key} className="history-card">
              <p className="history-headline">{item.title}</p>
              <p className={`micro report-zone-${item.zone}`}>{item.summary}</p>
            </div>
          ))}
        </div>
        <div className="report-view-switch">
          <button
            type="button"
            className={reportViewMode === "condition" ? "active" : ""}
            onClick={() => setReportViewMode("condition")}
          >
            Condition view
          </button>
          <button
            type="button"
            className={reportViewMode === "metrics" ? "active" : ""}
            onClick={() => setReportViewMode("metrics")}
          >
            All metrics view
          </button>
        </div>
        {reportViewMode === "condition" ? (
          <div className="report-condition-stack">
            {groupedPanels.length ? groupedPanels.map((panel) => (
              <article key={panel.key} className="report-condition-panel">
                <div className="report-condition-head">
                  <div>
                    <p className="micro strong">{panel.title}</p>
                    <h3>{panel.summary?.title || panel.title}</h3>
                  </div>
                  {panel.summary ? (
                    <span className={`report-badge report-zone-${panel.summary.zone}`}>{panel.summary.zone === "high" ? "Needs attention" : panel.summary.zone === "low" ? "Watch trend" : "Stable"}</span>
                  ) : null}
                </div>
                <p className="micro report-panel-summary">{panel.summary?.summary || "Tracked metrics grouped together for easier comparison."}</p>
                <div className="report-trend-grid report-trend-grid-condensed">
                  {panel.trends.map((trend) => (
                    <ReportTrendChart
                      key={trend.metricKey}
                      title={trend.metricLabel}
                      unit={trend.unit}
                      points={trend.points}
                      zone={trend.zone}
                      needsReview={trend.needsReview}
                    />
                  ))}
                </div>
              </article>
            )) : <p className="micro">No grouped condition trends yet.</p>}
          </div>
        ) : (
          <div className="report-trend-grid">
            {(reportInsights?.trends || []).map((trend) => (
              <ReportTrendChart
                key={trend.metricKey}
                title={trend.metricLabel}
                unit={trend.unit}
                points={trend.points}
                zone={trend.zone}
                needsReview={trend.needsReview}
              />
            ))}
            {!(reportInsights?.trends || []).length ? <p className="micro">No structured trends yet.</p> : null}
          </div>
        )}
      </div>

      <div className="history-list">
        {records.length === 0 ? (
          <p className="micro">No reports uploaded yet.</p>
        ) : (
          records.map((r) => {
            const draft = recordAnalysisDrafts[r.id] || { reportType: "", reportDate: "", notes: "", metrics: {} };
            const hasStructuredAnalysis = Boolean(r.analysis || (Array.isArray(r.analyses) && r.analyses.length > 0));
            const primaryAnalysis = r.analysis || (Array.isArray(r.analyses) ? r.analyses[0] : null);
            const selectedCatalog = catalogMap.get(draft.reportType);
            const isOpen = activeAnalysisRecordId === r.id;
            const reviewMetricKeys = new Set(
              (selectedCatalog?.metrics || [])
                .filter((metric) => {
                  const confidence = Number(draft.autoSuggestionMeta?.metricConfidences?.[metric.key]);
                  const hasValue =
                    draft.metrics?.[metric.key] !== "" &&
                    draft.metrics?.[metric.key] !== null &&
                    draft.metrics?.[metric.key] !== undefined;
                  return !hasValue || !Number.isFinite(confidence) || confidence < 0.88;
                })
                .map((metric) => metric.key),
            );
            const metricsToRender =
              focusReviewFields[r.id] && reviewMetricKeys.size
                ? (selectedCatalog?.metrics || []).filter((metric) => reviewMetricKeys.has(metric.key))
                : selectedCatalog?.metrics || [];
            return (
              <div key={r.id} className="history-card report-record-card">
                <div className="report-record-head">
                  <div>
                    <p className="history-headline">{r.file_name}</p>
                    <p className="micro">{new Date(r.created_at).toLocaleString()}{r.mimetype ? ` • ${r.mimetype}` : ""}</p>
                  </div>
                  <span className={`report-record-status ${hasStructuredAnalysis ? "is-processed" : "is-pending"}`}>
                    {hasStructuredAnalysis ? "Insights ready" : "Needs values"}
                  </span>
                </div>
                {primaryAnalysis ? (
                  <p className="micro">
                    {catalogMap.get(primaryAnalysis.reportType)?.label || primaryAnalysis.reportType}
                    {primaryAnalysis.reportDate ? ` • ${primaryAnalysis.reportDate}` : ""}
                    {Array.isArray(r.analyses) && r.analyses.length > 1 ? ` • ${r.analyses.length} sections detected` : ""}
                  </p>
                ) : (
                  <p className="micro">No values captured yet for this report.</p>
                )}
                {Array.isArray(r.analyses) && r.analyses.length ? (
                  <div className="history-list compact-list">
                    <p className="micro strong">Detected sections</p>
                    {r.analyses.map((analysis) => (
                      <div key={`${r.id}-${analysis.id}`} className="history-card">
                        <p className="history-headline">
                          {analysis.sectionLabel || catalogMap.get(analysis.reportType)?.label || analysis.reportType}
                        </p>
                        <p className="micro">
                          {analysis.reportDate}
                          {analysis.pageNumber ? ` • Page ${analysis.pageNumber}` : ""}
                          {analysis.metrics?.length ? ` • ${analysis.metrics.length} value${analysis.metrics.length === 1 ? "" : "s"}` : ""}
                        </p>
                        {analysis.metrics?.length ? (
                          <p className="micro">
                            {analysis.metrics.slice(0, 3).map(formatMetricValue).join(" • ")}
                            {analysis.metrics.length > 3 ? ` • +${analysis.metrics.length - 3} more` : ""}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                {r.extraction?.suggested_report_type && !r.analysis ? (
                  <p className="micro">
                    Suggested: {catalogMap.get(r.extraction.suggested_report_type)?.label || r.extraction.suggested_report_type}
                    {r.extraction.detected_lab_source ? ` • ${r.extraction.detected_lab_source}` : ""}
                  </p>
                ) : null}
                <div className="action-row">
                  {r.downloadUrl ? (
                    <a className="secondary" href={`${apiBase}${r.downloadUrl}`} target="_blank" rel="noreferrer">Download</a>
                  ) : null}
                  <button type="button" className="ghost" onClick={() => setActiveAnalysisRecordId(isOpen ? null : r.id)}>
                    {isOpen ? "Close values" : r.analysis ? "Edit values" : "Add values"}
                  </button>
                  <button type="button" className="ghost" onClick={() => deleteRecord(r.id)}>
                    {t("removeRecord")}
                  </button>
                </div>
                {isOpen ? (
                  <div className="report-analysis-editor">
                    {draft.autoSuggestionMeta ? (
                      <div className="history-card">
                        <p className="history-headline">Extraction review</p>
                        <p className="micro">
                          Confidence: {draft.autoSuggestionMeta.overallConfidence != null ? `${Math.round(Number(draft.autoSuggestionMeta.overallConfidence) * 100)}%` : "Not available"}
                          {draft.autoSuggestionMeta.detectedLabSource ? ` • ${draft.autoSuggestionMeta.detectedLabSource}` : ""}
                        </p>
                        <p className={`micro ${draft.autoSuggestionMeta.needsReview ? "report-zone-low" : "report-zone-normal"}`}>
                          {draft.autoSuggestionMeta.needsReview
                            ? "Needs review before final save. Please confirm extracted values."
                            : "Extraction confidence is strong. You can still review and edit before saving."}
                        </p>
                        {(draft.autoSuggestionMeta.detectedSections || []).length ? (
                          <div className="history-list compact-list">
                            {draft.autoSuggestionMeta.detectedSections.map((section) => (
                              <div key={`${r.id}-${section.key}`} className="history-card">
                                <p className="history-headline">{section.label}</p>
                                <p className="micro">
                                  {section.metricCount} matched value{section.metricCount === 1 ? "" : "s"}
                                  {section.matchedMetrics?.length ? ` • ${section.matchedMetrics.join(", ")}` : ""}
                                </p>
                                <p className="micro">{section.excerpt || "No section preview available."}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="report-analysis-grid">
                      <label>
                        Report type
                        <select
                          value={draft.reportType}
                          onChange={(event) => updateRecordAnalysisDraft(r.id, { reportType: event.target.value })}
                        >
                          <option value="">Select report type</option>
                          {(reportCatalog || []).map((item) => (
                            <option key={`report-type-${item.key}`} value={item.key}>{item.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Report date
                        <input
                          type="date"
                          value={draft.reportDate}
                          onChange={(event) => updateRecordAnalysisDraft(r.id, { reportDate: event.target.value })}
                        />
                      </label>
                      <label>
                        Notes
                        <input
                          type="text"
                          value={draft.notes}
                          onChange={(event) => updateRecordAnalysisDraft(r.id, { notes: event.target.value })}
                          placeholder="Optional report note"
                        />
                      </label>
                      <label className="report-analysis-wide">
                        Paste report text / OCR text
                        <textarea
                          value={draft.extractedText || ""}
                          onChange={(event) => updateRecordAnalysisDraft(r.id, { extractedText: event.target.value })}
                          placeholder="Paste report text here, or leave blank and use the file auto-detect path."
                          rows={5}
                        />
                      </label>
                    </div>
                    {selectedCatalog ? (
                    <div className="report-analysis-grid report-metric-grid">
                        {reviewMetricKeys.size ? (
                          <div className="report-analysis-wide history-card">
                            <p className="history-headline">Review fields</p>
                            <p className="micro">
                              {reviewMetricKeys.size} field{reviewMetricKeys.size === 1 ? "" : "s"} need review because the value is missing or OCR confidence is low.
                            </p>
                            <div className="action-row">
                              <button
                                type="button"
                                className={focusReviewFields[r.id] ? "primary" : "secondary"}
                                onClick={() =>
                                  setFocusReviewFields((prev) => ({
                                    ...prev,
                                    [r.id]: !prev[r.id],
                                  }))
                                }
                              >
                                {focusReviewFields[r.id] ? "Show all fields" : "Focus review fields"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {metricsToRender.map((metric) => (
                          <label key={`${r.id}-${metric.key}`}>
                            {metric.label} ({metric.unit})
                            <input
                              type="number"
                              step="any"
                              value={draft.metrics?.[metric.key] ?? ""}
                              onChange={(event) =>
                                updateRecordAnalysisDraft(r.id, {
                                  metrics: {
                                    ...(draft.metrics || {}),
                                    [metric.key]: event.target.value,
                                  },
                                })
                              }
                            />
                            {draft.autoSuggestionMeta?.metricConfidences?.[metric.key] != null ? (
                              <span className={`micro ${Number(draft.autoSuggestionMeta.metricConfidences[metric.key]) < 0.88 ? "report-zone-low" : "report-zone-normal"}`}>
                                Confidence: {Math.round(Number(draft.autoSuggestionMeta.metricConfidences[metric.key]) * 100)}%
                                {Number(draft.autoSuggestionMeta.metricConfidences[metric.key]) < 0.88 ? " • Needs review" : ""}
                              </span>
                            ) : null}
                          </label>
                        ))}
                      </div>
                    ) : null}
                    <div className="action-row">
                      <button type="button" className="secondary" onClick={() => autoSuggestRecordAnalysis(r.id)}>
                        Auto-detect values
                      </button>
                      <button type="button" className="primary" onClick={() => saveRecordAnalysis(r.id)}>
                        Save report values
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
