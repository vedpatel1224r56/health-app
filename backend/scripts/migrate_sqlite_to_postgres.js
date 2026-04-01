#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const { createDbHelpers } = require("../src/db");
const { createMigrationHelpers } = require("../src/db/migrations");
const { createInitDb } = require("../src/initDb");
const {
  buildPatientUid,
  defaultHospitalPublicContent,
} = require("../src/services/hospitalContent");

const parseArgs = (argv) => {
  const args = {
    sqlitePath: process.env.SQLITE_SOURCE_PATH || process.env.DB_PATH || "",
    databaseUrl: process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || "",
    truncate: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--sqlite" && argv[index + 1]) {
      args.sqlitePath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--database-url" && argv[index + 1]) {
      args.databaseUrl = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--no-truncate") {
      args.truncate = false;
    }
  }

  return args;
};

const quoteIdent = (value) => `"${String(value).replace(/"/g, "\"\"")}"`;

const nowIso = () => new Date().toISOString();

const getSqliteTables = async (all) => {
  const rows = await all(
    `SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
  );
  return rows
    .map((row) => row.name)
    .filter((name) => name !== "schema_migrations");
};

const getTableColumns = async (all, table) => {
  const rows = await all(`PRAGMA table_info(${quoteIdent(table)})`);
  return rows.map((row) => row.name);
};

const getTableDependencies = async (all, table) => {
  const rows = await all(`PRAGMA foreign_key_list(${quoteIdent(table)})`);
  return [...new Set(rows.map((row) => row.table).filter(Boolean))];
};

const sortTablesByDependencies = async (all, tables) => {
  const dependencyMap = new Map();
  const inboundCount = new Map();
  const reverseMap = new Map();

  for (const table of tables) {
    const deps = (await getTableDependencies(all, table)).filter((dep) => tables.includes(dep));
    dependencyMap.set(table, deps);
    inboundCount.set(table, deps.length);
    for (const dep of deps) {
      const reverse = reverseMap.get(dep) || [];
      reverse.push(table);
      reverseMap.set(dep, reverse);
    }
  }

  const queue = tables.filter((table) => (inboundCount.get(table) || 0) === 0).sort();
  const ordered = [];

  while (queue.length) {
    const current = queue.shift();
    ordered.push(current);
    const dependents = reverseMap.get(current) || [];
    for (const dependent of dependents) {
      const nextCount = (inboundCount.get(dependent) || 0) - 1;
      inboundCount.set(dependent, nextCount);
      if (nextCount === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }

  if (ordered.length !== tables.length) {
    // Fallback if there is an unexpected cycle.
    const remaining = tables.filter((table) => !ordered.includes(table)).sort();
    return [...ordered, ...remaining];
  }

  return ordered;
};

const buildInsertSql = (table, columns) => {
  const columnSql = columns.map(quoteIdent).join(", ");
  const valueSql = columns.map((_, index) => `$${index + 1}`).join(", ");
  return `INSERT INTO ${quoteIdent(table)} (${columnSql}) VALUES (${valueSql})`;
};

const truncateTarget = async (db, tables) => {
  if (!tables.length) return;
  const joined = tables.map(quoteIdent).join(", ");
  await db.query(`TRUNCATE TABLE ${joined} RESTART IDENTITY CASCADE`);
};

const syncSequences = async (db, all, tables) => {
  for (const table of tables) {
    const columns = await all(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = ?`,
      [table],
    );
    const hasId = columns.some((row) => row.column_name === "id");
    if (!hasId) continue;
    await db.query(
      `SELECT setval(
         pg_get_serial_sequence($1, 'id'),
         COALESCE((SELECT MAX(id) FROM ${quoteIdent(table)}), 1),
         EXISTS(SELECT 1 FROM ${quoteIdent(table)})
       )`,
      [table],
    );
  }
};

const main = async () => {
  const { sqlitePath, databaseUrl, truncate } = parseArgs(process.argv.slice(2));

  if (!sqlitePath) {
    throw new Error("Provide a SQLite source path with --sqlite or SQLITE_SOURCE_PATH.");
  }
  if (!databaseUrl) {
    throw new Error("Provide a target Postgres DATABASE_URL with --database-url or TARGET_DATABASE_URL.");
  }

  const source = createDbHelpers({
    provider: "sqlite",
    dbPath: sqlitePath,
  });
  const target = createDbHelpers({
    provider: "postgres",
    databaseUrl,
  });

  const { ensureColumn, ensureMigrationsTable, applyMigration } = createMigrationHelpers({
    DB_PROVIDER: "postgres",
    all: target.all,
    get: target.get,
    run: target.run,
    nowIso,
  });

  const initDb = createInitDb({
    ensureMigrationsTable,
    applyMigration,
    run: target.run,
    get: target.get,
    all: target.all,
    ensureColumn,
    nowIso,
    bcrypt,
    buildPatientUid,
    defaultHospitalPublicContent,
  });

  await initDb();

  const tables = await getSqliteTables(source.all);
  const orderedTables = await sortTablesByDependencies(source.all, tables);

  if (truncate) {
    await truncateTarget(target.db, [...orderedTables].reverse());
  }

  for (const table of orderedTables) {
    const columns = await getTableColumns(source.all, table);
    if (!columns.length) continue;
    const rows = await source.all(`SELECT * FROM ${quoteIdent(table)}`);
    if (!rows.length) continue;

    const insertSql = buildInsertSql(table, columns);
    for (const row of rows) {
      const values = columns.map((column) => row[column]);
      await target.db.query(insertSql, values);
    }
    process.stdout.write(`Imported ${rows.length} rows into ${table}\n`);
  }

  await syncSequences(target.db, target.all, orderedTables);
  await new Promise((resolve, reject) => {
    source.db.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  await target.db.end();
  process.stdout.write("SQLite to Postgres migration complete.\n");
};

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
