const registerAnalyticsRoutes = (fastify, deps) => {
  const {
    requireAuth,
    requireAdmin,
    requireOps,
    all,
    get,
    nowIso,
    safeJsonParse,
  } = deps;

  fastify.get("/api/audit/me", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const rows = await all(
      `SELECT request_id, method, path, status_code, response_time_ms, ip, user_agent, created_at
       FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      [request.authUser.id],
    );
    return {
      logs: rows.map((row) => ({
        requestId: row.request_id || null,
        method: row.method,
        path: row.path,
        statusCode: row.status_code,
        responseTimeMs: row.response_time_ms,
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

  fastify.get("/api/admin/ops/dashboard", async (request, reply) => {
    if (!requireOps(request, reply)) return;

    const [
      todayCounts,
      upcomingAppointments,
      departmentLoad,
      doctorLoad,
      financeSummary,
      marketplaceLoad,
    ] = await Promise.all([
      get(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) AS requested,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
           SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) AS checkedIn,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
           SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS noShow
         FROM appointments
         WHERE date(scheduled_at) = date('now')`,
      ),
      all(
        `SELECT a.id, a.status, a.reason, a.scheduled_at, p.name AS patient_name,
                d.name AS doctor_name, dep.name AS department_name
         FROM appointments a
         JOIN users p ON p.id = a.user_id
         LEFT JOIN users d ON d.id = a.doctor_id
         LEFT JOIN departments dep ON dep.id = a.department_id
         WHERE datetime(a.scheduled_at) >= datetime('now')
         ORDER BY a.scheduled_at ASC
         LIMIT 12`,
      ),
      all(
        `SELECT COALESCE(dep.name, a.department) AS department_name, COUNT(*) AS total
         FROM appointments a
         LEFT JOIN departments dep ON dep.id = a.department_id
         WHERE date(a.scheduled_at) = date('now')
         GROUP BY COALESCE(dep.name, a.department)
         ORDER BY total DESC, department_name ASC`,
      ),
      all(
        `SELECT COALESCE(d.name, 'Unassigned') AS doctor_name, COUNT(*) AS total
         FROM appointments a
         LEFT JOIN users d ON d.id = a.doctor_id
         WHERE date(a.scheduled_at) = date('now')
         GROUP BY COALESCE(d.name, 'Unassigned')
         ORDER BY total DESC, doctor_name ASC`,
      ),
      get(
        `SELECT
           COALESCE(SUM(
             CASE
               WHEN COALESCE(b.status, 'unpaid') IN ('paid', 'partial') THEN COALESCE(b.amount, 0)
               ELSE 0
             END
           ), 0) AS revenue_today,
           SUM(
             CASE
               WHEN COALESCE(b.status, 'unpaid') IN ('unpaid', 'partial')
                 AND a.status NOT IN ('cancelled', 'no_show')
               THEN 1
               ELSE 0
             END
           ) AS pending_bills
         FROM appointments a
         LEFT JOIN appointment_billing b ON b.appointment_id = a.id
         WHERE date(a.scheduled_at) = date('now')`,
      ),
      all(
        `SELECT request_type, COUNT(*) AS total
         FROM marketplace_requests
         WHERE status NOT IN ('completed', 'cancelled', 'fulfilled', 'rejected', 'unavailable')
         GROUP BY request_type`,
      ),
    ]);

    const marketplaceSummary = {
      lab: 0,
      pharmacy: 0,
    };
    for (const row of marketplaceLoad) {
      if (row.request_type === "lab") marketplaceSummary.lab = Number(row.total || 0);
      if (row.request_type === "pharmacy") marketplaceSummary.pharmacy = Number(row.total || 0);
    }

    return {
      today: {
        total: Number(todayCounts?.total || 0),
        requested: Number(todayCounts?.requested || 0),
        approved: Number(todayCounts?.approved || 0),
        waiting: Number(todayCounts?.requested || 0) + Number(todayCounts?.approved || 0),
        checkedIn: Number(todayCounts?.checkedIn || 0),
        completed: Number(todayCounts?.completed || 0),
        cancelled: Number(todayCounts?.cancelled || 0),
        noShow: Number(todayCounts?.noShow || 0),
      },
      finance: {
        revenueToday: Number(financeSummary?.revenue_today || 0),
        pendingBills: Number(financeSummary?.pending_bills || 0),
      },
      marketplace: {
        activeLabRequests: marketplaceSummary.lab,
        activePharmacyRequests: marketplaceSummary.pharmacy,
      },
      upcomingAppointments,
      departmentLoad,
      doctorLoad,
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
      `SELECT request_id, method, path, status_code, error_message, created_at
       FROM error_logs ORDER BY created_at DESC LIMIT 100`,
    );
    return {
      errors: rows.map((row) => ({
        requestId: row.request_id || null,
        method: row.method,
        path: row.path,
        statusCode: row.status_code,
        errorMessage: row.error_message,
        createdAt: row.created_at,
      })),
    };
  });
};

module.exports = { registerAnalyticsRoutes };
