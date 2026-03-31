const registerAuthRoutes = (fastify, deps) => {
  const {
    bcrypt,
    crypto,
    LOGIN_RATE_LIMIT_PER_MIN,
    OTP_EXPIRES_MINUTES,
    OTP_RATE_LIMIT_PER_MIN,
    passwordResetEmailConfigured = false,
    nowIso,
    run,
    get,
    all,
    requireAuth,
    checkRateLimit,
    buildPatientUid,
    issueSessionTokens,
    hashToken,
    generateOtpCode,
    queuePasswordResetOtpDelivery,
  } = deps;

  fastify.post("/api/auth/register", async (request, reply) => {
    const rl = checkRateLimit(`register:${request.ip}`, 8, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
    }
    const { name, email, password } = request.body || {};
    if (!name || !email || !password) {
      return reply.code(400).send({ error: "Name, email, and password required." });
    }

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedName || normalizedName.length < 2) {
      return reply.code(400).send({ error: "Name must be at least 2 characters." });
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return reply.code(400).send({ error: "Valid email is required." });
    }

    const existing = await get("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing) {
      return reply.code(409).send({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = nowIso();
    const result = await run(
      "INSERT INTO users (name, email, password_hash, role, registration_mode, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [normalizedName, normalizedEmail, passwordHash, "patient", "opd", createdAt],
    );
    const patientUid = buildPatientUid(result.lastID);
    await run("UPDATE users SET patient_uid = ? WHERE id = ?", [patientUid, result.lastID]);
    await run(
      `INSERT INTO profiles
       (user_id, age, sex, conditions, allergies, region, phone, address, blood_group, date_of_birth, emergency_contact_name, emergency_contact_phone, updated_at)
       VALUES (?, NULL, NULL, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)`,
      [result.lastID, JSON.stringify([]), JSON.stringify([]), createdAt],
    );
    await run(
      `INSERT INTO patient_registration_details
       (user_id, first_name, middle_name, last_name, aadhaar_no, marital_status, referred_by, visit_time,
        unit_department_id, unit_department_name, unit_doctor_id, unit_doctor_name, taluka, district, city, country, pin_code, updated_at)
       VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?)`,
      [result.lastID, createdAt],
    );
    const user = { id: result.lastID, name: normalizedName, email: normalizedEmail, role: "patient" };
    const session = await issueSessionTokens(
      { ...user, token_version: 0 },
      {
        userAgent: request.headers["user-agent"] || "",
        ip: request.ip || "",
      },
    );
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: session.accessToken,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt,
    };
  });

  fastify.post("/api/auth/login", async (request, reply) => {
    const rl = checkRateLimit(`login:${request.ip}`, LOGIN_RATE_LIMIT_PER_MIN, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
    }
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password required." });
    }

    const user = await get(
      `SELECT u.id, u.name, u.email, u.role, u.active, u.password_hash, u.token_version,
              dp.department_id, d.name AS department_name, dp.qualification
       FROM users u
       LEFT JOIN doctor_profiles dp ON dp.doctor_id = u.id
       LEFT JOIN departments d ON d.id = dp.department_id
       WHERE u.email = ?`,
      [email],
    );
    if (!user) {
      return reply.code(401).send({ error: "Invalid credentials." });
    }
    if (Number(user.active) !== 1) {
      return reply.code(403).send({ error: "This account is disabled. Contact admin." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: "Invalid credentials." });
    }

    const cleanUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "patient",
      token_version: user.token_version || 0,
    };
    const session = await issueSessionTokens(cleanUser, {
      userAgent: request.headers["user-agent"] || "",
      ip: request.ip || "",
    });
    return {
      user: {
        id: cleanUser.id,
        name: cleanUser.name,
        email: cleanUser.email,
        role: cleanUser.role,
        department_id: user.department_id || null,
        department_name: user.department_name || '',
        qualification: user.qualification || '',
      },
      token: session.accessToken,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt,
    };
  });

  fastify.get("/api/auth/me", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    return { user: request.authUser };
  });

  fastify.post("/api/auth/refresh", async (request, reply) => {
    const rl = checkRateLimit(`refresh:${request.ip}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
    }
    const { refreshToken } = request.body || {};
    if (!refreshToken) return reply.code(400).send({ error: "refreshToken required." });
    const tokenHash = hashToken(refreshToken);
    const session = await get(
      `SELECT s.id, s.user_id, s.expires_at, s.revoked_at, u.id AS uid, u.name, u.email, u.role, u.active, u.token_version
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.refresh_token_hash = ?`,
      [tokenHash],
    );
    if (!session) return reply.code(401).send({ error: "Invalid refresh token." });
    if (session.revoked_at) return reply.code(401).send({ error: "Session revoked." });
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await run("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE id = ?", [
        nowIso(),
        nowIso(),
        session.id,
      ]);
      return reply.code(401).send({ error: "Refresh token expired." });
    }
    if (Number(session.active) !== 1) {
      return reply.code(403).send({ error: "This account is disabled. Contact admin." });
    }
    const doctorProfile = await get(
      `SELECT dp.department_id, d.name AS department_name, dp.qualification
       FROM doctor_profiles dp
       LEFT JOIN departments d ON d.id = dp.department_id
       WHERE dp.doctor_id = ?`,
      [session.uid],
    );
    const cleanUser = {
      id: session.uid,
      name: session.name,
      email: session.email,
      role: session.role || "patient",
      token_version: session.token_version || 0,
      department_id: doctorProfile?.department_id || null,
      department_name: doctorProfile?.department_name || '',
      qualification: doctorProfile?.qualification || '',
    };
    await run("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE id = ?", [
      nowIso(),
      nowIso(),
      session.id,
    ]);
    const next = await issueSessionTokens(cleanUser, {
      userAgent: request.headers["user-agent"] || "",
      ip: request.ip || "",
    });
    return {
      user: {
        id: cleanUser.id,
        name: cleanUser.name,
        email: cleanUser.email,
        role: cleanUser.role,
        department_id: cleanUser.department_id,
        department_name: cleanUser.department_name,
        qualification: cleanUser.qualification,
      },
      token: next.accessToken,
      refreshToken: next.refreshToken,
      refreshExpiresAt: next.refreshExpiresAt,
    };
  });

  fastify.post("/api/auth/logout", async (request, reply) => {
    const { refreshToken } = request.body || {};
    if (!refreshToken) return { ok: true };
    const tokenHash = hashToken(refreshToken);
    await run("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE refresh_token_hash = ?", [
      nowIso(),
      nowIso(),
      tokenHash,
    ]);
    return { ok: true };
  });

  fastify.post("/api/auth/logout-all", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    await run("UPDATE users SET token_version = token_version + 1 WHERE id = ?", [request.authUser.id]);
    await run("UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE user_id = ? AND revoked_at IS NULL", [
      nowIso(),
      nowIso(),
      request.authUser.id,
    ]);
    return { ok: true };
  });

  fastify.get("/api/notifications", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const limit = Math.max(1, Math.min(Number(request.query?.limit) || 20, 50));
    const notifications = await all(
      `SELECT id, type, title, message, related_id, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [request.authUser.id, limit],
    );
    return {
      notifications: notifications.map((item) => ({
        ...item,
        is_read: Number(item.is_read) === 1,
      })),
    };
  });

  fastify.post("/api/notifications/read-all", async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    await run("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [
      request.authUser.id,
    ]);
    return { ok: true };
  });

  fastify.post("/api/auth/forgot-password", async (request, reply) => {
    const rl = checkRateLimit(`forgot:${request.ip}`, OTP_RATE_LIMIT_PER_MIN, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
    }
    if (!passwordResetEmailConfigured) {
      return reply.code(503).send({
        error: "Password reset email is not configured yet. Please contact support.",
      });
    }
    const { email } = request.body || {};
    if (!email) {
      return reply.code(400).send({ error: "Email is required." });
    }

    const responseBody = {
      ok: true,
      message: "If the account exists, an OTP has been sent.",
    };
    const user = await get("SELECT id, email, active FROM users WHERE email = ?", [email]);
    if (!user || Number(user.active) !== 1) {
      return responseBody;
    }

    const otp = generateOtpCode();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000).toISOString();
    await run("DELETE FROM password_reset_otps WHERE user_id = ? OR expires_at <= ?", [
      user.id,
      nowIso(),
    ]);
    await run(
      `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, attempts, max_attempts, created_at)
       VALUES (?, ?, ?, 0, 5, ?)`,
      [user.id, otpHash, expiresAt, nowIso()],
    );
    const delivery = await queuePasswordResetOtpDelivery({ email: user.email, otp, expiresAt });
    if (!delivery.resendDelivered && !delivery.webhookDelivered) {
      return reply.code(502).send({
        error: "Unable to send OTP email right now. Please try again in a few minutes.",
      });
    }
    responseBody.delivery = delivery.resendDelivered
      ? "email"
      : delivery.webhookDelivered
        ? "webhook"
        : "outbox";
    responseBody.message = "If the account exists, an OTP has been sent to the email address.";
    return responseBody;
  });

  fastify.post("/api/auth/reset-password", async (request, reply) => {
    const rl = checkRateLimit(`reset:${request.ip}`, OTP_RATE_LIMIT_PER_MIN, 60 * 1000);
    if (!rl.allowed) {
      return reply.code(429).send({ error: `Too many requests. Retry in ${rl.retryAfterSec}s.` });
    }
    const { email, token, otp, newPassword } = request.body || {};
    const providedOtp = String(otp || token || "").trim();
    if (!email || !providedOtp || !newPassword) {
      return reply.code(400).send({ error: "Email, OTP, and newPassword are required." });
    }
    if (String(newPassword).length < 8) {
      return reply.code(400).send({ error: "Password must be at least 8 characters." });
    }

    const user = await get("SELECT id, active FROM users WHERE email = ?", [email]);
    if (!user || Number(user.active) !== 1) {
      return reply.code(400).send({ error: "Invalid or expired reset token." });
    }

    const otpHash = crypto.createHash("sha256").update(providedOtp).digest("hex");
    const resetRow = await get(
      `SELECT id, user_id, otp_hash, expires_at, used_at, attempts, max_attempts
       FROM password_reset_otps
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );
    if (!resetRow || resetRow.used_at || resetRow.expires_at <= nowIso()) {
      return reply.code(400).send({ error: "Invalid or expired OTP." });
    }
    if (Number(resetRow.attempts || 0) >= Number(resetRow.max_attempts || 5)) {
      return reply.code(400).send({ error: "OTP attempt limit reached. Request a new OTP." });
    }
    const matches = resetRow.otp_hash === otpHash;
    if (!matches) {
      await run("UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?", [resetRow.id]);
      return reply.code(400).send({ error: "Invalid OTP." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await run("UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?", [
      passwordHash,
      user.id,
    ]);
    await run(
      "UPDATE auth_sessions SET revoked_at = ?, updated_at = ? WHERE user_id = ? AND revoked_at IS NULL",
      [nowIso(), nowIso(), user.id],
    );
    await run("UPDATE password_reset_otps SET used_at = ? WHERE id = ?", [nowIso(), resetRow.id]);
    return { ok: true, message: "Password updated successfully." };
  });
};

module.exports = { registerAuthRoutes };
