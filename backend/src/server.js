const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  NODE_ENV,
  PORT,
  DB_PROVIDER,
  DATABASE_URL,
  DB_PATH,
  UPLOAD_DIR,
  RECORDS_DIR,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
  MODEL_ENABLED,
  PYTHON_BIN,
  TRIAGE_MODEL_SCRIPT,
  TRIAGE_MODEL_FILE,
  TRIAGE_MODEL_META_FILE,
  CORS_ORIGINS,
  PASSWORD_RESET_BASE_URL,
  PASSWORD_RESET_OUTBOX_PATH,
  PASSWORD_RESET_OTP_OUTBOX_PATH,
  OTP_DELIVERY_WEBHOOK_URL,
  OTP_DELIVERY_WEBHOOK_AUTH,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  OTP_LENGTH,
  OTP_EXPIRES_MINUTES,
  LOGIN_RATE_LIMIT_PER_MIN,
  OTP_RATE_LIMIT_PER_MIN,
  IDEMPOTENCY_TTL_MINUTES,
  ALERT_WEBHOOK_URL,
  ALERT_WEBHOOK_AUTH,
  ALERT_COOLDOWN_SECONDS,
  UPTIME_HEARTBEAT_SECONDS,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  validateRuntimeConfig,
} = require("./config");
const { createDbHelpers, ensureDir } = require("./db");
const {
  registerAuthHooks,
  requireAuth,
  requireAdmin,
  requireOps,
  isDoctorRole,
  isOpsRole,
} = require("./auth");
const { createMigrationHelpers } = require("./db/migrations");
const { registerAuthRoutes } = require("./routes/authRoutes");
const { registerAdminRoutes } = require("./routes/adminRoutes");
const { registerAppointmentRoutes } = require("./routes/appointmentRoutes");
const { registerHospitalRoutes } = require("./routes/hospitalRoutes");
const { registerMarketplaceRoutes } = require("./routes/marketplaceRoutes");
const { registerPatientRoutes } = require("./routes/patientRoutes");
const { registerClinicalRoutes } = require("./routes/clinicalRoutes");
const { registerSystemRoutes } = require("./routes/systemRoutes");
const { registerTriageRoutes } = require("./routes/triageRoutes");
const { registerAnalyticsRoutes } = require("./routes/analyticsRoutes");
const {
  createPublicId,
  createShareCode,
  buildPatientUid,
  buildRequestNo,
  defaultHospitalPublicContent,
  mergeHospitalPublicContent,
} = require("./services/hospitalContent");
const { createHospitalSettingsService } = require("./services/hospitalSettingsService");
const { createPaymentGatewayService } = require("./services/paymentGatewayService");
const { createMetricsService } = require("./services/metricsService");
const { createPatientValidationService } = require("./services/patientValidationService");
const { createAuthSessionService } = require("./services/authSessionService");
const { createNotificationService } = require("./services/notificationService");
const { createMarketplaceService } = require("./services/marketplaceService");
const { createAccessService } = require("./services/accessService");
const { createScheduleService } = require("./services/scheduleService");
const { createTriageService } = require("./services/triageService");

const fastify = Fastify({ logger: true });

const { db, run, get, all } = createDbHelpers({
  provider: DB_PROVIDER,
  dbPath: DB_PATH,
  databaseUrl: DATABASE_URL,
  uploadDir: UPLOAD_DIR,
  recordsDir: RECORDS_DIR,
});
const rateBuckets = new Map();

const nowIso = () => new Date().toISOString();
const STARTED_AT = nowIso();
const alertCooldownMap = new Map();

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const hospitalSettingsService = createHospitalSettingsService({
  get,
  all,
  run,
  nowIso,
  safeJsonParse,
  defaultHospitalPublicContent,
  mergeHospitalPublicContent,
});
const paymentGatewayService = createPaymentGatewayService({
  fetch,
  crypto,
  razorpayKeyId: RAZORPAY_KEY_ID,
  razorpayKeySecret: RAZORPAY_KEY_SECRET,
});
const HOSPITAL_CONTENT_ASSETS_DIR = path.join(UPLOAD_DIR, "hospital-content");
ensureDir(HOSPITAL_CONTENT_ASSETS_DIR);

const checkRateLimit = (key, maxRequests, windowMs) => {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || now >= current.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  current.count += 1;
  if (current.count > maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
};

const { ensureColumn, ensureMigrationsTable, applyMigration } = createMigrationHelpers({
  DB_PROVIDER,
  all,
  get,
  run,
  nowIso,
});
const { metricDate, incrementMetric, markDailyActive } = createMetricsService({
  run,
  all,
});
const {
  getAllowedVisitTypeCodes,
  validatePatientProfileCompleteness,
  normalizeAppointmentStatus,
  canTransitionAppointmentStatus,
} = createPatientValidationService({
  hospitalSettingsService,
});
const normalizeRequestId = (value) => {
  if (!value) return null;
  const first = Array.isArray(value) ? value[0] : value;
  const str = String(first || "").trim();
  if (!str) return null;
  return str.slice(0, 128);
};

const shouldSendAlert = (key) => {
  const now = Date.now();
  const cooldownMs = ALERT_COOLDOWN_SECONDS * 1000;
  const last = alertCooldownMap.get(key) || 0;
  if (now - last < cooldownMs) return false;
  alertCooldownMap.set(key, now);
  return true;
};

const sendOpsAlert = async ({ key, severity = "error", message, context = {} }) => {
  if (!ALERT_WEBHOOK_URL) return;
  if (!shouldSendAlert(key || message || "generic-alert")) return;
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (ALERT_WEBHOOK_AUTH) {
      headers.Authorization = `Bearer ${ALERT_WEBHOOK_AUTH}`;
    }
    await fetch(ALERT_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "sehatsaathi-backend",
        severity,
        message,
        context,
        emittedAt: nowIso(),
      }),
    });
  } catch (error) {
    fastify.log.warn(
      {
        event: "ops_alert_failed",
        message: error.message,
      },
      "ops_alert_failed",
    );
  }
};

const { hashToken, signAuthToken, verifyAuthToken, generateOtpCode, queuePasswordResetOtpDelivery, issueSessionTokens, consumeIdempotencyKey } =
  createAuthSessionService({
    crypto,
    jwt,
    fs,
    path,
    run,
    get,
    nowIso,
    safeJsonParse,
    ensureDir,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_DAYS,
    PASSWORD_RESET_BASE_URL,
    PASSWORD_RESET_OUTBOX_PATH,
    PASSWORD_RESET_OTP_OUTBOX_PATH,
    OTP_DELIVERY_WEBHOOK_URL,
    OTP_DELIVERY_WEBHOOK_AUTH,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    OTP_LENGTH,
  });
const {
  enqueueAndDeliverUserNotification,
  processNotificationOutbox,
  createAppointmentTimeline,
  createMarketplaceRequestTimeline,
} = createNotificationService({
  run,
  get,
  all,
  nowIso,
  log: fastify.log,
});
const { buildMarketplaceFallbackOptions } = createMarketplaceService({
  all,
  get,
});


const { createInitDb } = require("./initDb");

const initDb = createInitDb({
  ensureMigrationsTable,
  applyMigration,
  run,
  get,
  all,
  ensureColumn,
  nowIso,
  bcrypt,
  buildPatientUid,
  defaultHospitalPublicContent,
});
const {
  validateTriagePayload,
  callConfiguredAiTriage,
  callLocalModelTriage,
  triageEngine,
  dentalTriageEngine,
} = createTriageService({
  fs,
  spawn,
  MODEL_ENABLED,
  PYTHON_BIN,
  TRIAGE_MODEL_SCRIPT,
  TRIAGE_MODEL_FILE,
});

fastify.register(cors, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    if (
      NODE_ENV !== "production" &&
      /^https?:\/\/((localhost|127\.0\.0\.1)|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/i.test(
        origin,
      )
    ) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"), false);
  },
});

fastify.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

registerAuthHooks({
  fastify,
  verifyAuthToken,
  getUserById: (userId) =>
    get("SELECT id, name, email, role, active, token_version FROM users WHERE id = ?", [userId]),
  markDailyActive,
  run,
  nowIso,
});

fastify.addHook("onRequest", async (request, reply) => {
  const incomingRequestId = normalizeRequestId(request.headers["x-request-id"]);
  request.requestId = incomingRequestId || request.id;
  request.requestStartedAt = process.hrtime.bigint();
  reply.header("x-request-id", request.requestId);
  request.log.info(
    {
      event: "request_start",
      requestId: request.requestId,
      method: request.method,
      path: request.routerPath || request.url || "",
      ip: request.ip || null,
      userAgent: request.headers["user-agent"] || null,
    },
    "request_start",
  );
});

fastify.addHook("onResponse", async (request, reply) => {
  const started = request.requestStartedAt || process.hrtime.bigint();
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const path = request.routerPath || request.url || "";
  const statusCode = reply.statusCode || 0;
  const userId = request.authUser?.id || null;
  try {
    await run(
      `INSERT INTO audit_logs (user_id, request_id, method, path, status_code, response_time_ms, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        request.requestId || request.id,
        request.method || null,
        path,
        statusCode,
        Number(durationMs.toFixed(3)),
        request.ip || null,
        request.headers["user-agent"] || null,
        nowIso(),
      ],
    );
  } catch (error) {
    request.log.error(
      {
        event: "audit_log_persist_failed",
        requestId: request.requestId || request.id,
        message: error.message,
      },
      "audit_log_persist_failed",
    );
  }

  const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
  request.log[level](
    {
      event: "request_end",
      requestId: request.requestId || request.id,
      method: request.method,
      path,
      statusCode,
      durationMs: Number(durationMs.toFixed(3)),
      userId,
    },
    "request_end",
  );
});
const {
  canAccessUser,
  canAccessConsult,
  canAccessEncounter,
  purgeExpiredSharePasses,
  purgeExpiredIdempotencyKeys,
  purgeExpiredSessions,
} = createAccessService({
  all,
  run,
  nowIso,
  IDEMPOTENCY_TTL_MINUTES,
  isDoctorRole,
});
const { getDoctorSchedules, buildDoctorSlots } = createScheduleService({
  all,
});

const getFamilyMember = async (userId, memberId) => {
  if (!memberId) return null;
  return get(
    `SELECT id, user_id, name, relation, age, sex, blood_type, conditions, allergies
     FROM family_members WHERE id = ? AND user_id = ?`,
    [memberId, userId],
  );
};

registerSystemRoutes(fastify, {
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
});

registerAuthRoutes(fastify, {
  bcrypt,
  crypto,
  LOGIN_RATE_LIMIT_PER_MIN,
  OTP_EXPIRES_MINUTES,
  OTP_RATE_LIMIT_PER_MIN,
  nowIso,
  run,
  get,
  all,
  requireAuth,
  checkRateLimit,
  buildPatientUid,
  issueSessionTokens,
  hashToken,
  generateOtpCode,
  queuePasswordResetOtpDelivery,
});

registerAdminRoutes(fastify, {
  requireOps,
  requireAdmin,
  all,
  get,
  run,
  nowIso,
  bcrypt,
  crypto,
  buildPatientUid,
  buildRequestNo,
  validatePatientProfileCompleteness,
  getAllowedVisitTypeCodes,
  hospitalSettingsService,
});

registerAppointmentRoutes(fastify, {
  requireAuth,
  requireAdmin,
  requireOps,
  all,
  get,
  run,
  nowIso,
  consumeIdempotencyKey,
  getFamilyMember,
  isDoctorRole,
  isOpsRole,
  canAccessConsult,
  getDoctorSchedules,
  buildDoctorSlots,
  normalizeAppointmentStatus,
  canTransitionAppointmentStatus,
  createAppointmentTimeline,
  enqueueAndDeliverUserNotification,
  hospitalSettingsService,
  getAllowedVisitTypeCodes,
  paymentGatewayService,
  safeJsonParse,
  crypto,
  verifyAuthToken,
  getUserById: (userId) =>
    get("SELECT id, name, email, role, active, token_version FROM users WHERE id = ?", [userId]),
  markDailyActive,
});

registerMarketplaceRoutes(fastify, {
  requireAuth,
  all,
  get,
  run,
  nowIso,
  safeJsonParse,
  consumeIdempotencyKey,
  getFamilyMember,
  isOpsRole,
  enqueueAndDeliverUserNotification,
  buildMarketplaceFallbackOptions,
  createMarketplaceRequestTimeline,
});

const saveUpload = async (part, options = {}) => {
  const { dir = UPLOAD_DIR, prefix = "upload" } = options;
  const ext = part.filename ? path.extname(part.filename) : "";
  const safeName = `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}${ext}`;
  const filePath = path.join(dir, safeName);

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    part.file.pipe(stream);
    part.file.on("end", resolve);
    part.file.on("error", reject);
    stream.on("error", reject);
  });

  return { filename: safeName, path: filePath, mimetype: part.mimetype };
};

registerHospitalRoutes(fastify, {
  requireOps,
  requireAdmin,
  all,
  nowIso,
  enqueueAndDeliverUserNotification,
  hospitalSettingsService,
  saveUpload,
  fs,
  path,
  hospitalContentAssetsDir: HOSPITAL_CONTENT_ASSETS_DIR,
});

registerPatientRoutes(fastify, {
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
});

registerClinicalRoutes(fastify, {
  requireAuth,
  all,
  get,
  run,
  nowIso,
  isDoctorRole,
  crypto,
  canAccessConsult,
});
registerTriageRoutes(fastify, {
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
});

registerAnalyticsRoutes(fastify, {
  requireAuth,
  requireAdmin,
  requireOps,
  all,
  get,
  nowIso,
  safeJsonParse,
});

fastify.setErrorHandler(async (error, request, reply) => {
  try {
    await run(
      `INSERT INTO error_logs (user_id, request_id, method, path, status_code, error_message, stack, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.authUser?.id || null,
        request.requestId || request.id,
        request.method || null,
        request.routerPath || request.url || null,
        error.statusCode || 500,
        error.message || "Unhandled error",
        error.stack || null,
        nowIso(),
      ],
    );
  } catch (persistErr) {
    request.log.error(persistErr);
  }

  request.log.error(error);
  if ((error.statusCode || 500) >= 500) {
    sendOpsAlert({
      key: `http-5xx:${request.method}:${request.routerPath || request.url || "unknown"}`,
      severity: "critical",
      message: "Unhandled server error",
      context: {
        requestId: request.requestId || request.id,
        method: request.method,
        path: request.routerPath || request.url || null,
        statusCode: error.statusCode || 500,
        errorCode: error.code || null,
        errorMessage: error.message || "Unhandled error",
      },
    });
  }
  if (reply.sent) return;
  const statusCode = error.statusCode || 500;
  const isClientError = statusCode < 500;
  const message = isClientError ? error.message : "Internal server error";
  reply.code(error.statusCode || 500).send({
    error: message,
    code: error.code || (isClientError ? "BAD_REQUEST" : "INTERNAL_ERROR"),
    requestId: request.requestId || request.id,
  });
});

const start = async () => {
  validateRuntimeConfig();
  await initDb();
  await purgeExpiredSharePasses();
  await purgeExpiredIdempotencyKeys();
  await purgeExpiredSessions();
  await processNotificationOutbox({ limit: 200 });
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    setInterval(async () => {
      const uptimeSec = Math.floor((Date.now() - Date.parse(STARTED_AT)) / 1000);
      const memory = process.memoryUsage();
      try {
        await get("SELECT 1 AS ok");
        fastify.log.info(
          {
            event: "service_heartbeat",
            uptimeSec,
            rssMb: Number((memory.rss / (1024 * 1024)).toFixed(2)),
            heapUsedMb: Number((memory.heapUsed / (1024 * 1024)).toFixed(2)),
            dbProvider: DB_PROVIDER,
          },
          "service_heartbeat",
        );
      } catch (error) {
        fastify.log.error(
          {
            event: "service_heartbeat_db_failed",
            message: error.message,
            dbProvider: DB_PROVIDER,
          },
          "service_heartbeat_db_failed",
        );
        sendOpsAlert({
          key: "heartbeat-db-failed",
          severity: "critical",
          message: "DB health check failed during heartbeat",
          context: {
            dbProvider: DB_PROVIDER,
            errorMessage: error.message,
          },
        });
      }
    }, UPTIME_HEARTBEAT_SECONDS * 1000).unref();

    setInterval(() => {
      purgeExpiredSharePasses().catch((err) => fastify.log.error(err));
      purgeExpiredIdempotencyKeys().catch((err) => fastify.log.error(err));
      purgeExpiredSessions().catch((err) => fastify.log.error(err));
    }, 5 * 60 * 1000).unref();

    setInterval(() => {
      processNotificationOutbox({ limit: 100 }).catch((err) => fastify.log.error(err));
    }, 15 * 1000).unref();
  } catch (err) {
    fastify.log.error(err);
    await sendOpsAlert({
      key: "startup-listen-failed",
      severity: "critical",
      message: "Backend failed to start listening",
      context: {
        errorMessage: err.message,
        port: PORT,
      },
    });
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  const message = reason && typeof reason === "object" ? reason.message : String(reason);
  fastify.log.error({ event: "unhandled_rejection", message }, "unhandled_rejection");
  sendOpsAlert({
    key: `unhandled-rejection:${message}`,
    severity: "critical",
    message: "Unhandled promise rejection",
    context: { message },
  });
});

process.on("uncaughtException", (error) => {
  fastify.log.error({ event: "uncaught_exception", message: error.message }, "uncaught_exception");
  sendOpsAlert({
    key: `uncaught-exception:${error.message}`,
    severity: "critical",
    message: "Uncaught exception",
    context: { message: error.message, stack: error.stack || null },
  });
});

if (require.main === module) {
  start();
}

module.exports = {
  fastify,
  start,
  initDb,
  nowIso,
};
