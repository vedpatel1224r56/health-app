#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envPath = path.resolve(__dirname, "..", ".env");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.resolve(__dirname, "..", `.env.backup.${timestamp}`);

if (!fs.existsSync(envPath)) {
  console.error(`Cannot rotate JWT secret: missing ${envPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/);
const newSecret = crypto.randomBytes(48).toString("base64url");
let replaced = false;

const nextLines = lines.map((line) => {
  if (/^\s*JWT_SECRET=/.test(line)) {
    replaced = true;
    return `JWT_SECRET=${newSecret}`;
  }
  return line;
});

if (!replaced) {
  nextLines.push(`JWT_SECRET=${newSecret}`);
}

fs.writeFileSync(backupPath, raw, "utf8");
fs.writeFileSync(envPath, `${nextLines.join("\n").replace(/\n+$/g, "")}\n`, "utf8");

console.log(`JWT secret rotated.`);
console.log(`Backup created: ${backupPath}`);
console.log(`Restart backend so new secret is active.`);
