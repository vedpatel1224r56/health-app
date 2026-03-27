const createNotificationService = ({ run, get, all, nowIso, log }) => {
  const createUserNotification = async ({ userId, type, title, message, relatedId = null }) => {
    if (!userId || !title || !message) return;
    await run(
      `INSERT INTO notifications (user_id, type, title, message, related_id, source_event_key, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
      [userId, type || "system", title, message, relatedId, nowIso()],
    );
  };

  const enqueueUserNotification = async ({
    userId,
    type,
    title,
    message,
    relatedId = null,
    eventKey,
  }) => {
    if (!userId || !title || !message || !eventKey) return false;
    await run(
      `INSERT INTO notification_outbox
       (event_key, user_id, type, title, message, related_id, status, attempts, next_attempt_at, last_error, created_at, processed_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, ?, NULL)
       ON CONFLICT(event_key) DO NOTHING`,
      [eventKey, userId, type || "system", title, message, relatedId, nowIso(), nowIso()],
    );
    return true;
  };

  const processNotificationOutbox = async ({ userId = null, limit = 50 } = {}) => {
    const rows = userId
      ? await all(
          `SELECT id, event_key, user_id, type, title, message, related_id, attempts
           FROM notification_outbox
           WHERE status = 'pending'
             AND user_id = ?
             AND next_attempt_at <= ?
           ORDER BY created_at ASC, id ASC
           LIMIT ?`,
          [Number(userId), nowIso(), limit],
        )
      : await all(
          `SELECT id, event_key, user_id, type, title, message, related_id, attempts
           FROM notification_outbox
           WHERE status = 'pending'
             AND next_attempt_at <= ?
           ORDER BY created_at ASC, id ASC
           LIMIT ?`,
          [nowIso(), limit],
        );

    for (const item of rows) {
      try {
        const existing = await get(
          "SELECT id FROM notifications WHERE source_event_key = ? LIMIT 1",
          [item.event_key],
        );
        if (!existing) {
          await run(
            `INSERT INTO notifications (user_id, type, title, message, related_id, source_event_key, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              item.user_id,
              item.type || "system",
              item.title,
              item.message,
              item.related_id || null,
              item.event_key,
              nowIso(),
            ],
          );
        }
        await run(
          `UPDATE notification_outbox
           SET status = 'processed', processed_at = ?, last_error = NULL
           WHERE id = ?`,
          [nowIso(), item.id],
        );
      } catch (error) {
        const attempts = Number(item.attempts || 0) + 1;
        const backoffSec = Math.min(300, Math.pow(2, Math.min(attempts, 7)));
        const nextAttemptAt = new Date(Date.now() + backoffSec * 1000).toISOString();
        await run(
          `UPDATE notification_outbox
           SET attempts = ?, last_error = ?, next_attempt_at = ?
           WHERE id = ?`,
          [attempts, String(error.message || "notification_delivery_failed"), nextAttemptAt, item.id],
        );
        log.error(
          {
            event: "notification_delivery_failed",
            outboxId: item.id,
            eventKey: item.event_key,
            userId: item.user_id,
            attempts,
            message: error.message,
          },
          "notification_delivery_failed",
        );
      }
    }
  };

  const enqueueAndDeliverUserNotification = async ({
    userId,
    type,
    title,
    message,
    relatedId = null,
    eventKey,
  }) => {
    const queued = await enqueueUserNotification({
      userId,
      type,
      title,
      message,
      relatedId,
      eventKey,
    });
    if (!queued) return;
    await processNotificationOutbox({ userId: Number(userId), limit: 20 });
  };

  const createAppointmentTimeline = async ({
    appointmentId,
    actorUserId = null,
    eventType,
    fromStatus = null,
    toStatus = null,
    note = "",
    metadata = null,
  }) => {
    if (!appointmentId || !eventType) return;
    await run(
      `INSERT INTO appointment_timeline
       (appointment_id, actor_user_id, event_type, from_status, to_status, note, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentId,
        actorUserId,
        eventType,
        fromStatus,
        toStatus,
        note || null,
        metadata ? JSON.stringify(metadata) : null,
        nowIso(),
      ],
    );
  };

  const createMarketplaceRequestTimeline = async ({
    requestId,
    actorUserId = null,
    eventType,
    fromStatus = null,
    toStatus = null,
    note = "",
    metadata = null,
  }) => {
    if (!requestId || !eventType) return;
    await run(
      `INSERT INTO marketplace_request_timeline
       (request_id, actor_user_id, event_type, from_status, to_status, note, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        actorUserId,
        eventType,
        fromStatus,
        toStatus,
        note || null,
        metadata ? JSON.stringify(metadata) : null,
        nowIso(),
      ],
    );
  };

  return {
    createUserNotification,
    enqueueUserNotification,
    processNotificationOutbox,
    enqueueAndDeliverUserNotification,
    createAppointmentTimeline,
    createMarketplaceRequestTimeline,
  };
};

module.exports = { createNotificationService };
