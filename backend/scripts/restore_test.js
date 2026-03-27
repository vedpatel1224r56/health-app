#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const sqlite3 = require("sqlite3").verbose();

const rootDir = path.resolve(__dirname, "..", "..");
const backupDir = process.env.BACKUP_DIR || path.join(rootDir, "database", "backups");
const providedBackupPath = process.argv[2] ? path.resolve(process.argv[2]) : null;

const fail = (message) => {
  console.error(`RESTORE_TEST_ERROR: ${message}`);
  process.exit(1);
};

const getLatestBackup = () => {
  if (!fs.existsSync(backupDir)) return null;
  const files = fs
    .readdirSync(backupDir)
    .filter((name) => /^health-\d{8}-\d{6}\.db\.gz$/.test(name))
    .map((name) => ({
      name,
      fullPath: path.join(backupDir, name),
      mtime: fs.statSync(path.join(backupDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0]?.fullPath || null;
};

const backupPath = providedBackupPath || getLatestBackup();
if (!backupPath) {
  fail(`No backup found in ${backupDir}`);
}
if (!fs.existsSync(backupPath)) {
  fail(`Backup file not found: ${backupPath}`);
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "health-restore-test-"));
const restorePath = path.join(tmpRoot, "restored.db");

try {
  const zipped = fs.readFileSync(backupPath);
  const dbBuffer = zlib.gunzipSync(zipped);
  fs.writeFileSync(restorePath, dbBuffer);
} catch (error) {
  fail(`Unable to extract backup: ${error.message}`);
}

const db = new sqlite3.Database(restorePath);

const get = (sql) =>
  new Promise((resolve, reject) => {
    db.get(sql, [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const closeDb = () =>
  new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

(async () => {
  try {
    const integrity = await get("PRAGMA integrity_check");
    if (!integrity || String(integrity.integrity_check || "").toLowerCase() !== "ok") {
      fail(`Integrity check failed: ${JSON.stringify(integrity || {})}`);
    }

    const users = await get("SELECT COUNT(*) AS count FROM users");
    const triage = await get("SELECT COUNT(*) AS count FROM triage_logs");
    const appts = await get("SELECT COUNT(*) AS count FROM appointments");

    console.log("RESTORE_TEST_OK");
    console.log(`Backup: ${backupPath}`);
    console.log(`Restored DB: ${restorePath}`);
    console.log(
      `Counts => users: ${users?.count || 0}, triage_logs: ${triage?.count || 0}, appointments: ${
        appts?.count || 0
      }`,
    );
  } catch (error) {
    fail(error.message);
  } finally {
    try {
      await closeDb();
    } catch (error) {
      // ignore
    }
  }
})();
