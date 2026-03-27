const registerSystemRoutes = (fastify, deps) => {
  const {
    NODE_ENV,
    STARTED_AT,
    DB_PROVIDER,
    nowIso,
    requireAuth,
    MODEL_ENABLED,
    TRIAGE_MODEL_SCRIPT,
    TRIAGE_MODEL_FILE,
    TRIAGE_MODEL_META_FILE,
    safeJsonParse,
    fs,
    get,
  } = deps;

  fastify.get("/", async () => ({
    service: "SehatSaathi API",
    status: "ok",
    environment: NODE_ENV,
    startedAt: STARTED_AT,
  }));

  fastify.get("/api/health", async () => ({
    status: "ok",
    startedAt: STARTED_AT,
    uptimeSec: Math.floor((Date.now() - Date.parse(STARTED_AT)) / 1000),
    dbProvider: DB_PROVIDER,
    timestamp: nowIso(),
  }));

  fastify.get("/api/ops/uptime", async () => ({
    status: "ok",
    startedAt: STARTED_AT,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: nowIso(),
  }));

  fastify.get("/api/triage/model/status", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    if (request.authUser.role !== "admin") {
      return reply.code(403).send({ error: "Admin access required." });
    }

    const ready = MODEL_ENABLED && fs.existsSync(TRIAGE_MODEL_SCRIPT) && fs.existsSync(TRIAGE_MODEL_FILE);
    const metadata = fs.existsSync(TRIAGE_MODEL_META_FILE)
      ? safeJsonParse(fs.readFileSync(TRIAGE_MODEL_META_FILE, "utf8"), null)
      : null;
    return {
      enabled: MODEL_ENABLED,
      ready,
      scriptPath: TRIAGE_MODEL_SCRIPT,
      modelPath: TRIAGE_MODEL_FILE,
      metadata,
    };
  });

  fastify.get("/api/stats/live", async () => {
    const [users, triage, doctorViews, activeToday] = await Promise.all([
      get("SELECT COUNT(*) AS count FROM users"),
      get("SELECT COUNT(*) AS count FROM triage_logs"),
      get("SELECT COUNT(*) AS count FROM share_access_logs"),
      get(
        `SELECT COALESCE(daily_active_users, 0) AS count
         FROM pilot_metrics_daily
         WHERE metric_date = date('now')
         LIMIT 1`,
      ),
    ]);

    return {
      generatedAt: nowIso(),
      totals: {
        users: users?.count || 0,
        triageCompleted: triage?.count || 0,
        doctorViews: doctorViews?.count || 0,
        activeUsersToday: activeToday?.count || 0,
      },
    };
  });
};

module.exports = { registerSystemRoutes };
