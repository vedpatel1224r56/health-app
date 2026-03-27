const createMetricsService = ({ run, all }) => {
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

  return {
    metricDate,
    incrementMetric,
    recomputeSevenDayRetention,
    markDailyActive,
  };
};

module.exports = { createMetricsService };
