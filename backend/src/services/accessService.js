const createAccessService = ({ all, run, nowIso, IDEMPOTENCY_TTL_MINUTES, isDoctorRole }) => {
  const sameUserId = (left, right) => Number(left) === Number(right);

  const canAccessUser = (request, userId) =>
    request.authUser &&
    (request.authUser.role === "admin" || sameUserId(request.authUser.id, userId));

  const canAccessConsult = (request, consult) =>
    request.authUser &&
    (
      request.authUser.role === "admin" ||
      sameUserId(request.authUser.id, consult.user_id) ||
      (request.authUser.role === "doctor" && sameUserId(consult.doctor_id, request.authUser.id))
    );

  const canAccessEncounter = (request, encounter) =>
    request.authUser &&
    (isDoctorRole(request.authUser.role) || sameUserId(request.authUser.id, encounter.user_id));

  const purgeExpiredSharePasses = async () => {
    const expiredCodes = await all("SELECT code FROM share_passes WHERE expires_at <= ?", [nowIso()]);
    if (expiredCodes.length > 0) {
      await run("DELETE FROM share_passes WHERE expires_at <= ?", [nowIso()]);
    }
    for (const row of expiredCodes) {
      await run("DELETE FROM share_access_logs WHERE pass_code = ?", [row.code]);
    }
  };

  const purgeExpiredIdempotencyKeys = async () => {
    const cutoff = new Date(Date.now() - IDEMPOTENCY_TTL_MINUTES * 60 * 1000).toISOString();
    await run("DELETE FROM idempotency_keys WHERE created_at < ?", [cutoff]);
  };

  const purgeExpiredSessions = async () => {
    await run(
      "UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE revoked_at IS NULL AND expires_at <= ?",
      [nowIso(), nowIso(), nowIso()],
    );
  };

  return {
    canAccessUser,
    canAccessConsult,
    canAccessEncounter,
    purgeExpiredSharePasses,
    purgeExpiredIdempotencyKeys,
    purgeExpiredSessions,
  };
};

module.exports = { createAccessService };
