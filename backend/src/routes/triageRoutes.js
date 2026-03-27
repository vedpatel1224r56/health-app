const registerTriageRoutes = (fastify, deps) => {
  const {
    requireAuth,
    checkRateLimit,
    getFamilyMember,
    validateTriagePayload,
    consumeIdempotencyKey,
    callLocalModelTriage,
    callConfiguredAiTriage,
    triageEngine,
    dentalTriageEngine,
    run,
    nowIso,
    incrementMetric,
    metricDate,
    canAccessUser,
    safeJsonParse,
    saveUpload,
    UPLOAD_DIR,
    all,
  } = deps;

  const parseMultipart = async (request) => {
    const payload = {};
    let photoMeta = null;

    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (!part.mimetype || !part.mimetype.startsWith("image/")) {
          throw new Error("Only image uploads are allowed.");
        }
        photoMeta = await saveUpload(part, { dir: UPLOAD_DIR, prefix: "triage" });
      } else {
        payload[part.fieldname] = part.value;
      }
    }

    const parseJsonArray = (value) => {
      if (!value) return [];
      try {
        return JSON.parse(value);
      } catch (error) {
        return [];
      }
    };

    return {
      ...payload,
      triageType: payload.triageType || "general",
      age: payload.age ? Number(payload.age) : undefined,
      durationDays: payload.durationDays ? Number(payload.durationDays) : undefined,
      severity: payload.severity ? Number(payload.severity) : undefined,
      dentalPainScale: payload.dentalPainScale ? Number(payload.dentalPainScale) : undefined,
      dentalHotColdTrigger: payload.dentalHotColdTrigger === "true",
      dentalSwelling: payload.dentalSwelling === "true",
      memberId: payload.memberId ? Number(payload.memberId) : undefined,
      symptoms: parseJsonArray(payload.symptoms),
      redFlags: parseJsonArray(payload.redFlags),
      dentalSymptoms: parseJsonArray(payload.dentalSymptoms),
      dentalRedFlags: parseJsonArray(payload.dentalRedFlags),
      userId: payload.userId ? Number(payload.userId) : undefined,
      photo: photoMeta,
    };
  };

  fastify.post("/api/triage", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const idempotencyKey = request.headers["idempotency-key"];
    const rl = checkRateLimit(`triage:${request.authUser.id}:${request.ip}`, 40, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many triage requests. Retry in ${rl.retryAfterSec}s.` });
    }
    let payload = request.body || {};
    if (request.isMultipart()) {
      try {
        payload = await parseMultipart(request);
      } catch (error) {
        return reply.code(400).send({ error: error.message });
      }
    }
    if (payload.memberId) {
      const member = await getFamilyMember(request.authUser.id, payload.memberId);
      if (!member) {
        return reply.code(404).send({ error: "Selected family member not found." });
      }
    }
    const payloadErrors = validateTriagePayload(payload);
    if (payloadErrors.length > 0) {
      return reply.code(400).send({ error: payloadErrors[0] });
    }
    const executed = await consumeIdempotencyKey({
      userId: request.authUser.id,
      routeKey: "triage:run",
      idempotencyKey,
      execute: async () => {
        let result;
        let source = "local_rules";
        try {
          result = await callLocalModelTriage(payload);
          if (result) {
            source = "ml_local";
          } else {
            result = await callConfiguredAiTriage(payload);
          }
          if (result && source !== "ml_local") {
            const provider = (process.env.AI_PROVIDER || "").toLowerCase();
            if (provider === "gemini") source = "gemini";
            else if (provider === "openai") source = "openai";
            else source = process.env.GEMINI_API_KEY ? "gemini" : "openai";
          }
        } catch (error) {
          fastify.log.error(error);
        }
        if (!result) {
          result = payload.triageType === "dental" ? dentalTriageEngine(payload) : triageEngine(payload);
          source = "local_rules";
        }

        result = { ...result, source };

        const actorUserId = request.authUser?.id || payload.userId || null;
        if (actorUserId) {
          await run(
            "INSERT INTO triage_logs (user_id, member_id, payload, result, created_at) VALUES (?, ?, ?, ?, ?)",
            [
              actorUserId,
              payload.memberId || null,
              JSON.stringify(payload),
              JSON.stringify(result),
              nowIso(),
            ],
          );
          await incrementMetric(metricDate(), "triage_completed");
        }
        return result;
      },
    });
    return executed.payload;
  });

  fastify.get("/api/triage/history/:userId", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const { userId } = request.params;
    if (!userId) {
      return reply.code(400).send({ error: "User id required." });
    }
    if (!canAccessUser(request, userId)) {
      return reply.code(403).send({ error: "Forbidden." });
    }

    const rows = await all(
      "SELECT id, payload, result, created_at FROM triage_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
      [userId],
    );

    const history = rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      payload: row.payload ? safeJsonParse(row.payload, null) : null,
      result: row.result ? safeJsonParse(row.result, null) : null,
    }));

    return { history };
  });
};

module.exports = { registerTriageRoutes };
