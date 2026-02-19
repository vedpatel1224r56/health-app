const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const dotenv = require("dotenv");
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const DB_PATH =
  process.env.DB_PATH ||
  path.resolve(__dirname, "..", "..", "database", "health.db");
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  path.resolve(__dirname, "..", "..", "database", "uploads");
const RECORDS_DIR = path.join(UPLOAD_DIR, "records");
const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-jwt-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const fastify = Fastify({ logger: true });

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(path.dirname(DB_PATH));
ensureDir(UPLOAD_DIR);
ensureDir(RECORDS_DIR);
const db = new sqlite3.Database(DB_PATH);
const rateBuckets = new Map();

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

const nowIso = () => new Date().toISOString();
const STARTED_AT = nowIso();

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

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

const ensureColumn = async (table, column, alterSql) => {
  const columns = await all(`PRAGMA table_info(${table})`);
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    await run(alterSql);
  }
};

const metricDate = (date = new Date()) => date.toISOString().slice(0, 10);

const incrementMetric = async (dateKey, column) => {
  await run(
    `INSERT INTO pilot_metrics_daily (metric_date) VALUES (?)
     ON CONFLICT(metric_date) DO NOTHING`,
    [dateKey],
  );
  await run(`UPDATE pilot_metrics_daily SET ${column} = ${column} + 1 WHERE metric_date = ?`, [
    dateKey,
  ]);
};

const recomputeSevenDayRetention = async (dateKey) => {
  const currentUsers = await all(
    "SELECT DISTINCT user_id FROM pilot_user_activity_daily WHERE metric_date = ?",
    [dateKey],
  );
  const sevenAgo = new Date(`${dateKey}T00:00:00.000Z`);
  sevenAgo.setUTCDate(sevenAgo.getUTCDate() - 7);
  const priorKey = metricDate(sevenAgo);
  const priorUsers = await all(
    "SELECT DISTINCT user_id FROM pilot_user_activity_daily WHERE metric_date = ?",
    [priorKey],
  );
  const priorSet = new Set(priorUsers.map((row) => row.user_id));
  const retained = currentUsers.filter((row) => priorSet.has(row.user_id)).length;
  const ratio = priorUsers.length === 0 ? 0 : Number(((retained / priorUsers.length) * 100).toFixed(2));
  await run(
    `INSERT INTO pilot_metrics_daily (metric_date, seven_day_retention)
     VALUES (?, ?)
     ON CONFLICT(metric_date) DO UPDATE SET seven_day_retention = excluded.seven_day_retention`,
    [dateKey, ratio],
  );
};

const createPublicId = () => crypto.randomBytes(8).toString("hex");

const createShareCode = () => String(Math.floor(100000 + Math.random() * 900000));

const markDailyActive = async (userId) => {
  if (!userId) return;
  const dateKey = metricDate();
  const inserted = await run(
    `INSERT OR IGNORE INTO pilot_user_activity_daily (metric_date, user_id)
     VALUES (?, ?)`,
    [dateKey, userId],
  );
  if (inserted.changes > 0) {
    await incrementMetric(dateKey, "daily_active_users");
    await recomputeSevenDayRetention(dateKey);
  }
};

const signAuthToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role || "patient", email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const verifyAuthToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const initDb = async () => {
  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'patient',
      created_at TEXT NOT NULL
    )`,
  );
  await ensureColumn(
    "users",
    "role",
    "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'patient'",
  );

  await run(
    `CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      age INTEGER,
      sex TEXT,
      conditions TEXT,
      allergies TEXT,
      region TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS triage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      member_id INTEGER,
      payload TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );
  await ensureColumn("triage_logs", "member_id", "ALTER TABLE triage_logs ADD COLUMN member_id INTEGER");

  await run(
    `CREATE TABLE IF NOT EXISTS share_passes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      member_id INTEGER,
      code TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      is_used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );
  await ensureColumn("share_passes", "member_id", "ALTER TABLE share_passes ADD COLUMN member_id INTEGER");
  await ensureColumn("share_passes", "is_used", "ALTER TABLE share_passes ADD COLUMN is_used INTEGER NOT NULL DEFAULT 0");

  await run(
    `CREATE TABLE IF NOT EXISTS consent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      consent_type TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      accepted INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_name TEXT NOT NULL,
      event_payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS pilot_metrics_daily (
      metric_date TEXT PRIMARY KEY,
      daily_active_users INTEGER NOT NULL DEFAULT 0,
      triage_completed INTEGER NOT NULL DEFAULT 0,
      share_pass_generated INTEGER NOT NULL DEFAULT 0,
      doctor_view_opened INTEGER NOT NULL DEFAULT 0,
      seven_day_retention REAL NOT NULL DEFAULT 0
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS pilot_user_activity_daily (
      metric_date TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY(metric_date, user_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      method TEXT,
      path TEXT,
      status_code INTEGER,
      error_message TEXT NOT NULL,
      stack TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS doctor_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      share_code TEXT NOT NULL,
      user_id INTEGER,
      rating TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      relation TEXT,
      age INTEGER,
      sex TEXT,
      blood_type TEXT,
      conditions TEXT,
      allergies TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      member_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mimetype TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS emergency_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      member_id INTEGER,
      public_id TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );

  await run(
    `CREATE TABLE IF NOT EXISTS share_access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pass_code TEXT NOT NULL,
      user_id INTEGER,
      member_id INTEGER,
      doctor_name TEXT,
      viewed_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
  );
};

const buildTriagePrompt = (payload) => {
  const sanitized = {
    age: payload?.age || null,
    sex: payload?.sex || null,
    durationDays: payload?.durationDays || null,
    severity: payload?.severity || null,
    symptoms: payload?.symptoms || [],
    redFlags: payload?.redFlags || [],
    additionalContext: payload?.additionalContext || "",
  };

  return `Patient intake (JSON):\n${JSON.stringify(sanitized, null, 2)}\n\nReturn ONLY valid JSON with keys: level, headline, urgency, suggestions, disclaimer.\n- level must be one of: emergency, urgent, self_care.\n- headline: short sentence.\n- urgency: 1-2 sentences.\n- suggestions: array of 3-5 short actionable tips.\n- disclaimer: include that this is general guidance, not diagnosis, and to seek immediate care for emergencies.\nDo not provide a medical diagnosis, do not give medication dosages, and do not replace a clinician.`;
};

const extractOutputText = (response) => {
  if (!response || !Array.isArray(response.output)) return "";
  const parts = [];
  for (const item of response.output) {
    if (item.type === "message" && item.role === "assistant") {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) {
          parts.push(content.text);
        }
      }
    }
  }
  return parts.join("\n").trim();
};

const safeParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const isValidAiResult = (result) => {
  if (!result) return false;
  const levels = new Set(["emergency", "urgent", "self_care"]);
  return (
    levels.has(result.level) &&
    typeof result.headline === "string" &&
    typeof result.urgency === "string" &&
    Array.isArray(result.suggestions) &&
    typeof result.disclaimer === "string"
  );
};

const callOpenAiTriage = async (payload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions:
        "You are a cautious medical triage assistant. Provide general health guidance only. Do not diagnose, do not prescribe medication dosages, and encourage seeking professional care for severe or red-flag symptoms. Keep output concise.",
      input: buildTriagePrompt(payload),
      temperature: 0.2,
      max_output_tokens: 400,
      text: { format: { type: "text" } },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI request failed.");
  }

  const outputText = extractOutputText(data);
  const parsed = safeParseJson(outputText);
  return isValidAiResult(parsed) ? parsed : null;
};

const callGeminiTriage = async (payload) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 400,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildTriagePrompt(payload) }],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are a cautious medical triage assistant. Provide general health guidance only. Do not diagnose, do not prescribe medication dosages, and encourage seeking professional care for severe or red-flag symptoms. Keep output concise and return valid JSON only.",
          },
        ],
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed.");
  }

  const outputText =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || "";
  const parsed = safeParseJson(outputText);
  return isValidAiResult(parsed) ? parsed : null;
};

const callConfiguredAiTriage = async (payload) => {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "local" || provider === "none" || provider === "offline") return null;

  if (provider === "gemini") return callGeminiTriage(payload);
  if (provider === "openai") return callOpenAiTriage(payload);

  if (process.env.GEMINI_API_KEY) return callGeminiTriage(payload);
  return callOpenAiTriage(payload);
};

const fallbackChatReply = (message) => {
  const text = (message || "").toLowerCase();
  if (text.includes("chest pain") || text.includes("breath") || text.includes("bleeding")) {
    return "Your symptoms may be serious. Please seek urgent medical care immediately.";
  }
  if (text.includes("fever")) {
    return "For fever, stay hydrated, rest, and monitor temperature. If fever is high or persistent, visit a clinician.";
  }
  if (text.includes("cough")) {
    return "For cough, rest and hydrate. If breathing difficulty, chest pain, or prolonged symptoms occur, seek medical care.";
  }
  return "I can help with general health guidance, triage steps, and preparing for clinic visits. Share symptoms and duration for better guidance.";
};

const callOpenAiChat = async (message, history = []) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const convo = history
    .slice(-8)
    .map((item) => `${item.role === "assistant" ? "Assistant" : "User"}: ${item.content}`)
    .join("\n");

  const input = `${convo}\nUser: ${message}\nAssistant:`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions:
        "You are SehatSaathi assistant for India. Provide concise, safe, non-diagnostic health guidance. Escalate emergencies. Avoid medication dosages. Keep replies under 120 words.",
      input,
      temperature: 0.3,
      max_output_tokens: 220,
      text: { format: { type: "text" } },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI chat request failed.");
  }
  const text = extractOutputText(data);
  return text || null;
};

const callGeminiChat = async (message, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const convo = history.slice(-8).map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));
  convo.push({ role: "user", parts: [{ text: message }] });

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature: 0.3, maxOutputTokens: 220 },
      systemInstruction: {
        parts: [
          {
            text: "You are SehatSaathi assistant for India. Provide concise, safe, non-diagnostic health guidance. Escalate emergencies. Avoid medication dosages. Keep replies under 120 words.",
          },
        ],
      },
      contents: convo,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini chat request failed.");
  }
  const outputText =
    data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || "";
  return outputText || null;
};

const callConfiguredAiChat = async (message, history = []) => {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "local" || provider === "none" || provider === "offline") return null;
  if (provider === "gemini") return callGeminiChat(message, history);
  if (provider === "openai") return callOpenAiChat(message, history);
  if (process.env.GEMINI_API_KEY) return callGeminiChat(message, history);
  return callOpenAiChat(message, history);
};

const triageEngine = (payload) => {
  const {
    symptoms = [],
    severity = 3,
    durationDays = 1,
    redFlags = [],
    age,
    photo,
  } = payload || {};

  const normalizedSymptoms = symptoms.map((s) => s.toLowerCase());
  const normalizedRedFlags = redFlags.map((s) => s.toLowerCase());

  const redFlagKeywords = [
    "chest pain",
    "trouble breathing",
    "severe breathlessness",
    "uncontrolled bleeding",
    "fainting",
    "loss of consciousness",
    "stroke",
    "seizure",
    "severe allergic reaction",
    "suicidal thoughts",
  ];

  const symptomRedFlagHit = normalizedSymptoms.some((symptom) =>
    redFlagKeywords.some((flag) => symptom.includes(flag)),
  );

  const redFlagHit =
    symptomRedFlagHit ||
    normalizedRedFlags.some((flag) =>
      redFlagKeywords.some((keyword) => flag.includes(keyword)),
    );

  const highRiskAge = age && Number(age) >= 65;
  const veryYoungAge = age && Number(age) <= 5;
  const longDuration = durationDays && Number(durationDays) >= 7;
  const highSeverity = Number(severity) >= 4;
  const severeSymptoms = Number(severity) >= 5;
  const multipleSymptoms = normalizedSymptoms.length >= 5;

  let level = "self_care";
  let headline = "Likely manageable with home care";
  let urgency = "Monitor symptoms and practice self-care.";
  let confidence = "medium";
  const reasons = [];

  let riskScore = 0;
  if (highSeverity) riskScore += 2;
  if (severeSymptoms) riskScore += 2;
  if (longDuration) riskScore += 2;
  if (highRiskAge || veryYoungAge) riskScore += 2;
  if (multipleSymptoms) riskScore += 1;
  riskScore += Math.min(normalizedRedFlags.length, 2) * 2;

  if (highRiskAge) reasons.push("Older age risk (65+).");
  if (veryYoungAge) reasons.push("Young child requires cautious escalation.");
  if (longDuration) reasons.push("Symptoms present for 7+ days.");
  if (highSeverity) reasons.push("Reported symptom severity is high.");
  if (multipleSymptoms) reasons.push("Multiple symptoms reported.");

  if (redFlagHit) {
    level = "emergency";
    headline = "Seek emergency care now";
    urgency = "Go to the nearest emergency facility or call local emergency services.";
    confidence = "high";
    reasons.push("Red-flag symptom detected.");
  } else if (riskScore >= 4) {
    level = "urgent";
    headline = "Talk to a clinician soon";
    urgency = "Consider a local clinic visit within 24-48 hours.";
    confidence = "high";
  } else if (riskScore >= 2) {
    confidence = "medium";
    reasons.push("Monitor closely due to moderate risk indicators.");
  } else {
    confidence = "medium";
  }

  const suggestions = [
    "Rest, hydrate, and avoid strenuous activity.",
    "Track your symptoms and note any changes.",
    "If symptoms worsen, seek medical care.",
  ];

  if (normalizedSymptoms.some((s) => s.includes("fever"))) {
    suggestions.push("Check temperature twice daily and keep fluids up.");
  }
  if (normalizedSymptoms.some((s) => s.includes("cough"))) {
    suggestions.push("Warm fluids can soothe throat irritation.");
  }
  if (normalizedSymptoms.some((s) => s.includes("diarrhea"))) {
    suggestions.push("Use oral rehydration salts if available.");
  }
  if (photo) {
    suggestions.push(
      "If a visible issue is present, share the photo with a clinician for proper evaluation.",
    );
  }

  return {
    level,
    headline,
    urgency,
    suggestions,
    confidence,
    reasons,
    disclaimer:
      "This is general guidance, not a medical diagnosis. For emergencies, seek immediate care.",
  };
};

const validateTriagePayload = (payload) => {
  const errors = [];
  if (payload.age !== undefined && payload.age !== null) {
    if (Number.isNaN(Number(payload.age)) || Number(payload.age) < 0 || Number(payload.age) > 120) {
      errors.push("Age must be between 0 and 120.");
    }
  }
  if (
    payload.durationDays !== undefined &&
    payload.durationDays !== null &&
    (Number.isNaN(Number(payload.durationDays)) ||
      Number(payload.durationDays) < 0 ||
      Number(payload.durationDays) > 90)
  ) {
    errors.push("Duration must be between 0 and 90 days.");
  }
  if (
    payload.severity !== undefined &&
    payload.severity !== null &&
    (Number.isNaN(Number(payload.severity)) || Number(payload.severity) < 1 || Number(payload.severity) > 5)
  ) {
    errors.push("Severity must be between 1 and 5.");
  }
  if (payload.symptoms && (!Array.isArray(payload.symptoms) || payload.symptoms.length > 20)) {
    errors.push("Symptoms must be an array with up to 20 items.");
  }
  if (payload.redFlags && (!Array.isArray(payload.redFlags) || payload.redFlags.length > 10)) {
    errors.push("Red flags must be an array with up to 10 items.");
  }
  if (
    payload.additionalSymptoms &&
    typeof payload.additionalSymptoms === "string" &&
    payload.additionalSymptoms.length > 500
  ) {
    errors.push("Additional symptoms text is too long.");
  }
  return errors;
};

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

    if (NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"), false);
  },
});

fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

fastify.addHook("preHandler", async (request) => {
  const authHeader = request.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return;
  const token = authHeader.slice("Bearer ".length);
  const payload = verifyAuthToken(token);
  if (!payload?.sub) return;
  const user = await get("SELECT id, name, email, role FROM users WHERE id = ?", [
    payload.sub,
  ]);
  if (user) {
    request.authUser = user;
    await markDailyActive(user.id);
  }
});

fastify.addHook("onResponse", async (request, reply) => {
  try {
    await run(
      `INSERT INTO audit_logs (user_id, method, path, status_code, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        request.authUser?.id || null,
        request.method,
        request.routerPath || request.url,
        reply.statusCode,
        request.ip || "",
        request.headers["user-agent"] || "",
        nowIso(),
      ],
    );
  } catch (error) {
    request.log.error(error);
  }
});

const requireAuth = (request, reply) => {
  if (!request.authUser) {
    reply.code(401).send({ error: "Authentication required." });
    return false;
  }
  return true;
};

const requireAdmin = (request, reply) => {
  if (!requireAuth(request, reply)) return false;
  if (request.authUser.role !== "admin") {
    reply.code(403).send({ error: "Admin access required." });
    return false;
  }
  return true;
};

const canAccessUser = (request, userId) =>
  request.authUser &&
  (request.authUser.role === "admin" || request.authUser.id === Number(userId));

const getFamilyMember = async (userId, memberId) => {
  if (!memberId) return null;
  return get(
    `SELECT id, user_id, name, relation, age, sex, blood_type, conditions, allergies
     FROM family_members WHERE id = ? AND user_id = ?`,
    [memberId, userId],
  );
};

fastify.get("/api/health", async () => ({ status: "ok" }));
fastify.get("/api/ops/uptime", async () => ({
  status: "ok",
  startedAt: STARTED_AT,
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: nowIso(),
}));
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

fastify.post("/api/auth/register", async (request, reply) => {
  const rl = checkRateLimit(`register:${request.ip}`, 8, 60 * 1000);
  if (!rl.allowed) {
    return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
  }
  const { name, email, password } = request.body || {};
  if (!name || !email || !password) {
    return reply.code(400).send({ error: "Name, email, and password required." });
  }

  const existing = await get("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) {
    return reply.code(409).send({ error: "Email already registered." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await run(
    "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
    [name, email, passwordHash, "patient", nowIso()],
  );
  const user = { id: result.lastID, name, email, role: "patient" };
  const token = signAuthToken(user);
  return {
    user,
    token,
  };
});

fastify.post("/api/auth/login", async (request, reply) => {
  const rl = checkRateLimit(`login:${request.ip}`, 12, 60 * 1000);
  if (!rl.allowed) {
    return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
  }
  const { email, password } = request.body || {};
  if (!email || !password) {
    return reply.code(400).send({ error: "Email and password required." });
  }

  const user = await get(
    "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
    [email],
  );
  if (!user) {
    return reply.code(401).send({ error: "Invalid credentials." });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return reply.code(401).send({ error: "Invalid credentials." });
  }

  const cleanUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "patient",
  };
  return { user: cleanUser, token: signAuthToken(cleanUser) };
});

fastify.get("/api/auth/me", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  return { user: request.authUser };
});

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
  await run("DELETE FROM family_members WHERE id = ? AND user_id = ?", [
    memberId,
    request.authUser.id,
  ]);
  await run("DELETE FROM medical_records WHERE member_id = ? AND user_id = ?", [
    memberId,
    request.authUser.id,
  ]);
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

fastify.post("/api/family/:memberId/records", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const { memberId } = request.params;
  const member = await getFamilyMember(request.authUser.id, memberId);
  if (!member) return reply.code(404).send({ error: "Member not found." });
  if (!request.isMultipart()) {
    return reply.code(400).send({ error: "multipart form-data required." });
  }

  let fileMeta = null;
  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (!part.mimetype || (!part.mimetype.startsWith("image/") && part.mimetype !== "application/pdf")) {
        return reply.code(400).send({ error: "Only image and PDF records are allowed." });
      }
      fileMeta = await saveUpload(part, { dir: RECORDS_DIR, prefix: "record" });
    }
  }
  if (!fileMeta) {
    return reply.code(400).send({ error: "record file is required." });
  }

  const result = await run(
    `INSERT INTO medical_records (user_id, member_id, file_name, file_path, mimetype, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      request.authUser.id,
      memberId,
      fileMeta.filename,
      fileMeta.path,
      fileMeta.mimetype,
      nowIso(),
    ],
  );
  return { id: result.lastID };
});

fastify.post("/api/records", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  if (!request.isMultipart()) {
    return reply.code(400).send({ error: "multipart form-data required." });
  }
  let fileMeta = null;
  for await (const part of request.parts()) {
    if (part.type === "file") {
      if (!part.mimetype || (!part.mimetype.startsWith("image/") && part.mimetype !== "application/pdf")) {
        return reply.code(400).send({ error: "Only image and PDF records are allowed." });
      }
      fileMeta = await saveUpload(part, { dir: RECORDS_DIR, prefix: "record" });
    }
  }
  if (!fileMeta) {
    return reply.code(400).send({ error: "record file is required." });
  }
  const result = await run(
    `INSERT INTO medical_records (user_id, member_id, file_name, file_path, mimetype, created_at)
     VALUES (?, NULL, ?, ?, ?, ?)`,
    [
      request.authUser.id,
      fileMeta.filename,
      fileMeta.path,
      fileMeta.mimetype,
      nowIso(),
    ],
  );
  return { id: result.lastID };
});

fastify.get("/api/records/:recordId/download", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const { recordId } = request.params;
  const record = await get(
    `SELECT id, file_name, file_path, mimetype FROM medical_records
     WHERE id = ? AND user_id = ?`,
    [recordId, request.authUser.id],
  );
  if (!record) {
    return reply.code(404).send({ error: "Record not found." });
  }
  if (!fs.existsSync(record.file_path)) {
    return reply.code(404).send({ error: "Record file missing." });
  }
  const attachmentName = String(record.file_name || "record")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  reply.header("Content-Type", record.mimetype || "application/octet-stream");
  reply.header("Content-Disposition", `attachment; filename="${attachmentName}"`);
  return reply.send(fs.createReadStream(record.file_path));
});

fastify.get("/api/profile/:userId", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const { userId } = request.params;
  if (!canAccessUser(request, userId)) {
    return reply.code(403).send({ error: "Forbidden." });
  }
  const profile = await get("SELECT * FROM profiles WHERE user_id = ?", [
    userId,
  ]);
  if (!profile) {
    return reply.code(404).send({ error: "Profile not found." });
  }

  return {
    profile: {
      ...profile,
      conditions: profile.conditions ? safeJsonParse(profile.conditions, []) : [],
      allergies: profile.allergies ? safeJsonParse(profile.allergies, []) : [],
    },
  };
});

fastify.post("/api/profile", async (request, reply) => {
  const { userId, age, sex, conditions = [], allergies = [], region } =
    request.body || {};
  if (!requireAuth(request, reply)) return;
  const targetUserId = userId || request.authUser.id;
  if (!targetUserId) {
    return reply.code(400).send({ error: "User id required." });
  }
  if (!canAccessUser(request, targetUserId)) {
    return reply.code(403).send({ error: "Forbidden." });
  }

  const existing = await get("SELECT id FROM profiles WHERE user_id = ?", [
    targetUserId,
  ]);

  if (existing) {
    await run(
      `UPDATE profiles
       SET age = ?, sex = ?, conditions = ?, allergies = ?, region = ?, updated_at = ?
       WHERE user_id = ?`,
      [
        age || null,
        sex || null,
        JSON.stringify(conditions),
        JSON.stringify(allergies),
        region || null,
        nowIso(),
        targetUserId,
      ],
    );
  } else {
    await run(
      `INSERT INTO profiles (user_id, age, sex, conditions, allergies, region, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        targetUserId,
        age || null,
        sex || null,
        JSON.stringify(conditions),
        JSON.stringify(allergies),
        region || null,
        nowIso(),
      ],
    );
  }

  return { ok: true };
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
    age: payload.age ? Number(payload.age) : undefined,
    durationDays: payload.durationDays ? Number(payload.durationDays) : undefined,
    severity: payload.severity ? Number(payload.severity) : undefined,
    memberId: payload.memberId ? Number(payload.memberId) : undefined,
    symptoms: parseJsonArray(payload.symptoms),
    redFlags: parseJsonArray(payload.redFlags),
    userId: payload.userId ? Number(payload.userId) : undefined,
    photo: photoMeta,
  };
};

fastify.post("/api/triage", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
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
  let result;
  let source = "local_rules";
  try {
    result = await callConfiguredAiTriage(payload);
    if (result) {
      const provider = (process.env.AI_PROVIDER || "").toLowerCase();
      if (provider === "gemini") source = "gemini";
      else if (provider === "openai") source = "openai";
      else source = process.env.GEMINI_API_KEY ? "gemini" : "openai";
    }
  } catch (error) {
    fastify.log.error(error);
  }
  if (!result) {
    result = triageEngine(payload);
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

  const rows = await new Promise((resolve, reject) => {
    db.all(
      "SELECT id, payload, result, created_at FROM triage_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
      [userId],
      (err, data) => {
        if (err) reject(err);
        else resolve(data || []);
      },
    );
  });

  const history = rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    payload: row.payload ? safeJsonParse(row.payload, null) : null,
    result: row.result ? safeJsonParse(row.result, null) : null,
  }));

  return { history };
});

fastify.post("/api/share-pass", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const rl = checkRateLimit(`sharepass:${request.authUser.id}:${request.ip}`, 20, 60 * 1000);
  if (!rl.allowed) {
    return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
  }
  const { userId, memberId } = request.body || {};
  const targetUserId = userId || request.authUser.id;
  if (!targetUserId) {
    return reply.code(400).send({ error: "User id required." });
  }
  if (!canAccessUser(request, targetUserId)) {
    return reply.code(403).send({ error: "Forbidden." });
  }
  if (memberId) {
    const member = await getFamilyMember(request.authUser.id, memberId);
    if (!member) {
      return reply.code(404).send({ error: "Selected family member not found." });
    }
  }

  const user = await get("SELECT id FROM users WHERE id = ?", [targetUserId]);
  if (!user) {
    return reply.code(404).send({ error: "User not found." });
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
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
  if (!code) {
    return reply.code(500).send({ error: "Unable to generate unique share code." });
  }
  await incrementMetric(metricDate(), "share_pass_generated");

  return {
    code,
    expiresAt,
    doctorUrl: `/doctor-view/${code}`,
  };
});

fastify.get("/api/share-pass/:code", async (request, reply) => {
  const { code } = request.params;
  const doctorName = String(request.query.doctorName || "").trim();
  if (!code) {
    return reply.code(400).send({ error: "Code required." });
  }

  const pass = await get(
    `SELECT sp.user_id, sp.member_id, sp.expires_at, sp.is_used, u.name, u.email
     FROM share_passes sp
     JOIN users u ON u.id = sp.user_id
     WHERE sp.code = ?`,
    [code],
  );

  if (!pass) {
    return reply.code(404).send({ error: "Share pass not found." });
  }

  if (new Date(pass.expires_at).getTime() < Date.now()) {
    return reply.code(410).send({ error: "Share pass expired." });
  }
  if (Number(pass.is_used) === 1) {
    return reply.code(410).send({ error: "Share pass already used." });
  }
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
  if (!pass) {
    return reply.code(404).send({ error: "Share pass not found." });
  }
  if (new Date(pass.expires_at).getTime() < Date.now()) {
    return reply.code(410).send({ error: "Share pass expired." });
  }

  const accessLog = await get(
    "SELECT id FROM share_access_logs WHERE pass_code = ? LIMIT 1",
    [code],
  );
  if (!accessLog) {
    return reply.code(403).send({ error: "Open patient summary first." });
  }

  const record = await get(
    `SELECT id, file_name, file_path, mimetype
     FROM medical_records
     WHERE id = ? AND user_id = ? AND (? IS NULL OR member_id = ?)`,
    [recordId, pass.user_id, pass.member_id || null, pass.member_id || null],
  );
  if (!record) {
    return reply.code(404).send({ error: "Record not found." });
  }
  if (!fs.existsSync(record.file_path)) {
    return reply.code(404).send({ error: "Record file missing." });
  }

  const attachmentName = String(record.file_name || "record")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  reply.header("Content-Type", record.mimetype || "application/octet-stream");
  reply.header("Content-Disposition", `attachment; filename="${attachmentName}"`);
  return reply.send(fs.createReadStream(record.file_path));
});

fastify.get("/api/share-history", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const rows = await all(
    `SELECT pass_code, member_id, doctor_name, viewed_at
     FROM share_access_logs
     WHERE user_id = ?
     ORDER BY viewed_at DESC
     LIMIT 100`,
    [request.authUser.id],
  );
  return { history: rows };
});

fastify.post("/api/share-pass/:code/rating", async (request, reply) => {
  const { code } = request.params;
  const { rating } = request.body || {};
  if (!code || !rating) {
    return reply.code(400).send({ error: "Code and rating are required." });
  }
  if (!["useful", "not_useful"].includes(rating)) {
    return reply.code(400).send({ error: "Invalid rating value." });
  }

  const pass = await get(
    "SELECT user_id, expires_at FROM share_passes WHERE code = ?",
    [code],
  );
  if (!pass) {
    return reply.code(404).send({ error: "Share pass not found." });
  }
  if (new Date(pass.expires_at).getTime() < Date.now()) {
    return reply.code(410).send({ error: "Share pass expired." });
  }

  await run(
    `INSERT INTO doctor_ratings (share_code, user_id, rating, created_at)
     VALUES (?, ?, ?, ?)`,
    [code, pass.user_id, rating, nowIso()],
  );
  await run(
    `INSERT INTO analytics_events (user_id, event_name, event_payload, created_at)
     VALUES (?, ?, ?, ?)`,
    [
      pass.user_id,
      "doctor_quick_rating",
      JSON.stringify({ shareCode: code, rating }),
      nowIso(),
    ],
  );
  return { ok: true };
});

fastify.post("/api/consent", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const { consentType, policyVersion, accepted } = request.body || {};
  if (!consentType || !policyVersion || typeof accepted !== "boolean") {
    return reply.code(400).send({
      error: "consentType, policyVersion, and accepted(boolean) are required.",
    });
  }

  await run(
    `INSERT INTO consent_logs (user_id, consent_type, policy_version, accepted, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      request.authUser.id,
      consentType,
      policyVersion,
      accepted ? 1 : 0,
      nowIso(),
    ],
  );

  return { ok: true };
});

fastify.post("/api/emergency-card", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const { memberId = null } = request.body || {};
  if (memberId) {
    const member = await getFamilyMember(request.authUser.id, memberId);
    if (!member) {
      return reply.code(404).send({ error: "Selected family member not found." });
    }
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
  if (!card || Number(card.active) !== 1) {
    return reply.code(404).send({ error: "Emergency card not found." });
  }

  const member = card.member_id
    ? await get(
        `SELECT name, relation, age, sex, blood_type, conditions, allergies
         FROM family_members WHERE id = ? AND user_id = ?`,
        [card.member_id, card.user_id],
      )
    : null;
  const profile = card.member_id
    ? null
    : await get(
        "SELECT age, sex, conditions, allergies, region FROM profiles WHERE user_id = ?",
        [card.user_id],
      );

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
    disclaimer:
      "Emergency card is informational only. For urgent conditions seek immediate medical care.",
  };
});

fastify.post("/api/events", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const { eventName, payload } = request.body || {};
  if (!eventName) {
    return reply.code(400).send({ error: "eventName is required." });
  }

  await run(
    `INSERT INTO analytics_events (user_id, event_name, event_payload, created_at)
     VALUES (?, ?, ?, ?)`,
    [
      request.authUser.id,
      eventName,
      payload ? JSON.stringify(payload) : null,
      nowIso(),
    ],
  );
  return { ok: true };
});

fastify.post("/api/chat", async (request, reply) => {
  const actor = request.authUser?.id || request.ip;
  const rl = checkRateLimit(`chat:${actor}`, 60, 60 * 1000);
  if (!rl.allowed) {
    return reply.code(429).send({ error: `Too many chat requests. Retry in ${rl.retryAfterSec}s.` });
  }
  const { message, history = [] } = request.body || {};
  if (!message || typeof message !== "string") {
    return reply.code(400).send({ error: "message is required." });
  }

  let responseText = null;
  let source = "fallback";
  try {
    responseText = await callConfiguredAiChat(message, Array.isArray(history) ? history : []);
    if (responseText) {
      const provider = (process.env.AI_PROVIDER || "").toLowerCase();
      if (provider === "gemini") source = "gemini";
      else if (provider === "openai") source = "openai";
      else source = process.env.GEMINI_API_KEY ? "gemini" : "openai";
    }
  } catch (error) {
    request.log.error(error);
  }

  if (!responseText) {
    responseText = fallbackChatReply(message);
  }

  if (request.authUser?.id) {
    await run(
      `INSERT INTO analytics_events (user_id, event_name, event_payload, created_at)
       VALUES (?, ?, ?, ?)`,
      [
        request.authUser.id,
        "chat_message",
        JSON.stringify({ source, messageLength: message.length }),
        nowIso(),
      ],
    );
  }

  return { reply: responseText, source };
});

fastify.get("/api/privacy/export", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const userId = request.authUser.id;

  const user = await get("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [
    userId,
  ]);
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
  await run("DELETE FROM triage_logs WHERE user_id = ?", [userId]);
  await run("DELETE FROM consent_logs WHERE user_id = ?", [userId]);
  await run("DELETE FROM analytics_events WHERE user_id = ?", [userId]);
  await run("DELETE FROM profiles WHERE user_id = ?", [userId]);
  await run("DELETE FROM users WHERE id = ?", [userId]);

  return { ok: true };
});

fastify.get("/api/audit/me", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const rows = await all(
    `SELECT method, path, status_code, ip, user_agent, created_at
     FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    [request.authUser.id],
  );
  return {
    logs: rows.map((row) => ({
      method: row.method,
      path: row.path,
      statusCode: row.status_code,
      ip: row.ip,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    })),
  };
});

fastify.get("/api/admin/analytics/overview", async (request, reply) => {
  if (!requireAdmin(request, reply)) return;

  const [userTotals, triageTotals, shareTotals, doctorViewTotals, ratingTotals, errorTotals] =
    await Promise.all([
      get("SELECT COUNT(*) AS count FROM users"),
      get("SELECT COUNT(*) AS count FROM triage_logs"),
      get("SELECT COUNT(*) AS count FROM share_passes"),
      get("SELECT COUNT(*) AS count FROM share_access_logs"),
      get("SELECT COUNT(*) AS count FROM doctor_ratings"),
      get(
        `SELECT COUNT(*) AS count FROM error_logs
         WHERE datetime(created_at) >= datetime('now', '-7 day')`,
      ),
    ]);

  const latestKpis = await get(
    `SELECT
      COALESCE(SUM(daily_active_users), 0) AS dau30,
      COALESCE(SUM(triage_completed), 0) AS triage30,
      COALESCE(SUM(share_pass_generated), 0) AS sharePass30,
      COALESCE(SUM(doctor_view_opened), 0) AS doctorViews30,
      COALESCE(AVG(seven_day_retention), 0) AS retentionAvg30
     FROM pilot_metrics_daily
     WHERE metric_date >= date('now', '-29 day')`,
  );

  const dailySeries = await all(
    `SELECT metric_date, daily_active_users, triage_completed, share_pass_generated,
            doctor_view_opened, seven_day_retention
     FROM pilot_metrics_daily
     WHERE metric_date >= date('now', '-29 day')
     ORDER BY metric_date ASC`,
  );

  const doctorRatingsBreakdown = await all(
    `SELECT rating, COUNT(*) AS count
     FROM doctor_ratings
     GROUP BY rating`,
  );

  const feedbackEvents = await all(
    `SELECT event_name, event_payload
     FROM analytics_events
     WHERE event_name IN ('triage_helpfulness_feedback', 'visit_happened_followup')
       AND datetime(created_at) >= datetime('now', '-30 day')`,
  );

  const feedback = {
    helpful: 0,
    notHelpful: 0,
    visitHappened: 0,
    noVisitYet: 0,
  };
  for (const row of feedbackEvents) {
    let payload = {};
    if (row.event_payload) {
      payload = safeJsonParse(row.event_payload, {});
    }
    if (row.event_name === "triage_helpfulness_feedback") {
      if (payload.helpful === true) feedback.helpful += 1;
      if (payload.helpful === false) feedback.notHelpful += 1;
    }
    if (row.event_name === "visit_happened_followup") {
      if (payload.visitHappened === true) feedback.visitHappened += 1;
      if (payload.visitHappened === false) feedback.noVisitYet += 1;
    }
  }

  return {
    generatedAt: nowIso(),
    totals: {
      users: userTotals?.count || 0,
      triageSessions: triageTotals?.count || 0,
      sharePasses: shareTotals?.count || 0,
      doctorViews: doctorViewTotals?.count || 0,
      doctorRatings: ratingTotals?.count || 0,
      serverErrorsLast7d: errorTotals?.count || 0,
    },
    pilotKpis30d: {
      dailyActiveUsers: latestKpis?.dau30 || 0,
      triageCompleted: latestKpis?.triage30 || 0,
      sharePassGenerated: latestKpis?.sharePass30 || 0,
      doctorViewOpened: latestKpis?.doctorViews30 || 0,
      sevenDayRetentionAvg: Number(Number(latestKpis?.retentionAvg30 || 0).toFixed(2)),
    },
    feedback30d: feedback,
    doctorRatingsBreakdown,
    dailySeries,
  };
});

fastify.get("/api/metrics/pilot", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const rows = await all(
    `SELECT metric_date, daily_active_users, triage_completed, share_pass_generated,
            doctor_view_opened, seven_day_retention
     FROM pilot_metrics_daily
     ORDER BY metric_date DESC
     LIMIT 30`,
  );
  return { metrics: rows };
});

fastify.get("/api/ops/errors", async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const rows = await all(
    `SELECT method, path, status_code, error_message, created_at
     FROM error_logs ORDER BY created_at DESC LIMIT 100`,
  );
  return { errors: rows };
});

fastify.setErrorHandler(async (error, request, reply) => {
  try {
    await run(
      `INSERT INTO error_logs (user_id, method, path, status_code, error_message, stack, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        request.authUser?.id || null,
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
  if (reply.sent) return;
  reply.code(error.statusCode || 500).send({
    error: error.statusCode && error.statusCode < 500 ? error.message : "Internal server error",
  });
});

const start = async () => {
  await initDb();
  if (NODE_ENV === "production" && CORS_ORIGINS.length === 0) {
    fastify.log.warn("CORS_ORIGINS is empty in production. Browser clients will be blocked.");
  }
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
