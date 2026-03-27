const createMigrationHelpers = ({ DB_PROVIDER, all, get, run, nowIso }) => {
  const ensureColumn = async (table, column, alterSql) => {
    let exists = false;
    if (DB_PROVIDER === "postgres") {
      const row = await get(
        `SELECT 1 AS found
         FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = ?
           AND column_name = ?
         LIMIT 1`,
        [table, column],
      );
      exists = Boolean(row?.found);
    } else {
      const columns = await all(`PRAGMA table_info(${table})`);
      exists = columns.some((col) => col.name === column);
    }
    if (!exists) {
      await run(alterSql);
    }
  };

  const ensureMigrationsTable = async () => {
    await run(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      )`,
    );
  };

  const applyMigration = async (name, fn) => {
    const exists = await get("SELECT id FROM schema_migrations WHERE name = ?", [name]);
    if (exists) return false;
    await fn();
    await run("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)", [name, nowIso()]);
    return true;
  };

  return {
    ensureColumn,
    ensureMigrationsTable,
    applyMigration,
  };
};

module.exports = { createMigrationHelpers };
