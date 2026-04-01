const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const addPostgresConflictDoNothing = (sql) => {
  if (!/^\s*INSERT OR IGNORE INTO/i.test(sql)) return sql;
  let normalized = sql.replace(/^\s*INSERT OR IGNORE INTO/i, "INSERT INTO");
  if (!/ON\s+CONFLICT/i.test(normalized)) {
    normalized = `${normalized.trimEnd()} ON CONFLICT DO NOTHING`;
  }
  return normalized;
};

const toPostgresSql = (sql) => {
  if (!sql) return sql;
  let transformed = sql;
  transformed = transformed.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "BIGSERIAL PRIMARY KEY");
  transformed = transformed.replace(/\bAUTOINCREMENT\b/gi, "");
  transformed = addPostgresConflictDoNothing(transformed);
  return transformed;
};

const toPostgresParams = (sql, params = []) => {
  let index = 0;
  const converted = sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
  return { sql: converted, params };
};

const maybeAttachReturningId = (sql) => {
  if (!/^\s*INSERT\s+INTO/i.test(sql)) return { sql, attempted: false };
  if (/RETURNING\s+/i.test(sql)) return { sql, attempted: false };
  return { sql: `${sql.trimEnd()} RETURNING id`, attempted: true };
};

const createSqliteHelpers = (dbPath, uploadDir, recordsDir) => {
  ensureDir(path.dirname(dbPath));
  ensureDir(uploadDir);
  ensureDir(recordsDir);

  const db = new sqlite3.Database(dbPath);

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

  return { db, run, get, all, ensureDir };
};

const buildPostgresPoolOptions = (databaseUrl) => {
  const options = { connectionString: databaseUrl };
  try {
    const parsed = new URL(databaseUrl);
    const sslMode = (parsed.searchParams.get("sslmode") || process.env.PGSSLMODE || "").toLowerCase();
    const sslRequired =
      sslMode === "require" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full" ||
      /render\.com$/i.test(parsed.hostname || "");
    if (sslRequired) {
      options.ssl = { rejectUnauthorized: false };
    }
  } catch (error) {
    // Ignore URL parsing issues and let pg handle malformed URLs.
  }
  return options;
};

const createPostgresHelpers = (databaseUrl) => {
  // Lazy-load pg so sqlite-only development does not require postgres packages.
  const { Pool } = require("pg");
  const db = new Pool(buildPostgresPoolOptions(databaseUrl));

  const query = async (sql, params = []) => {
    const transformed = toPostgresSql(sql);
    const pgQuery = toPostgresParams(transformed, params);
    return db.query(pgQuery.sql, pgQuery.params);
  };

  const run = async (sql, params = []) => {
    const transformed = toPostgresSql(sql);
    const withReturning = maybeAttachReturningId(transformed);
    if (withReturning.attempted) {
      try {
        const pgQuery = toPostgresParams(withReturning.sql, params);
        const result = await db.query(pgQuery.sql, pgQuery.params);
        const firstRow = result.rows?.[0] || null;
        return {
          changes: result.rowCount || 0,
          lastID: firstRow?.id || null,
          rowCount: result.rowCount || 0,
        };
      } catch (error) {
        // Fallback for tables that do not have an `id` column or for statements
        // where RETURNING is not valid.
        if (!/column\s+"?id"?\s+does not exist/i.test(String(error.message || ""))) {
          throw error;
        }
      }
    }
    const pgQuery = toPostgresParams(transformed, params);
    const result = await db.query(pgQuery.sql, pgQuery.params);
    return {
      changes: result.rowCount || 0,
      lastID: null,
      rowCount: result.rowCount || 0,
    };
  };

  const get = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows?.[0] || undefined;
  };

  const all = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows || [];
  };

  return { db, run, get, all, ensureDir };
};

const createDbHelpers = (options) => {
  const {
    provider = "sqlite",
    dbPath,
    databaseUrl,
    uploadDir,
    recordsDir,
  } = options || {};
  if (uploadDir) ensureDir(uploadDir);
  if (recordsDir) ensureDir(recordsDir);
  if (provider === "postgres") {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required when DB_PROVIDER=postgres.");
    }
    return createPostgresHelpers(databaseUrl);
  }
  return createSqliteHelpers(dbPath, uploadDir, recordsDir);
};

module.exports = { createDbHelpers, ensureDir };
