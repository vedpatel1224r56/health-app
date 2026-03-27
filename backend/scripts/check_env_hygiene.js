#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");

const fail = (message) => {
  console.error(`ENV_HYGIENE_ERROR: ${message}`);
  process.exit(1);
};

if (!fs.existsSync(envPath)) {
  fail(`Missing .env file at ${envPath}`);
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/);
const invalidLines = [];

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  if (!trimmed.includes("=")) {
    invalidLines.push({ line: i + 1, value: trimmed });
  }
}

if (invalidLines.length > 0) {
  const details = invalidLines.map((item) => `line ${item.line}: "${item.value}"`).join("; ");
  fail(`Invalid .env entries without "=" -> ${details}`);
}

const placeholderPatterns = [/change_me/i, /change_this/i, /replace_me/i, /paste_/i, /your_.+_here/i, /<.+>/];
const suspectKeys = ["JWT_SECRET", "DATABASE_URL", "GEMINI_API_KEY", "OPENAI_API_KEY", "RESEND_API_KEY"];
const env = Object.fromEntries(
  lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    }),
);

const issues = [];
for (const key of suspectKeys) {
  const value = String(env[key] || "").trim();
  if (!value) continue;
  if (placeholderPatterns.some((pattern) => pattern.test(value))) {
    issues.push(`${key} appears to be placeholder`);
  }
}

if (issues.length > 0) {
  fail(issues.join(" | "));
}

console.log("ENV_HYGIENE_OK");
