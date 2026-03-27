const registerAuthHooks = ({ fastify, verifyAuthToken, getUserById, markDailyActive, run, nowIso }) => {
  fastify.addHook("preHandler", async (request) => {
    const authHeader = request.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) return;
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAuthToken(token);
    if (!payload?.sub) return;
    const user = await getUserById(payload.sub);
    const tokenVersionMatches =
      payload.tver === undefined || Number(payload.tver) === Number(user?.token_version || 0);
    if (user && Number(user.active) === 1 && tokenVersionMatches) {
      request.authUser = user;
      await markDailyActive(user.id);
    }
  });

  fastify.addHook("onResponse", async (request, reply) => {
    try {
      await run(
        `INSERT INTO audit_logs (user_id, method, path, status_code, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          request.authUser?.id || null,
          request.method,
          request.routerPath || request.url,
          reply.statusCode,
          request.ip || "",
          request.headers["user-agent"] || "",
          nowIso(),
        ],
      );
    } catch (error) {
      request.log.error(error);
    }
  });
};

const requireAuth = (request, reply) => {
  if (!request.authUser) {
    reply.code(401).send({ error: "Authentication required." });
    return false;
  }
  return true;
};

const requireAdmin = (request, reply) => {
  if (!requireAuth(request, reply)) return false;
  if (request.authUser.role !== "admin") {
    reply.code(403).send({ error: "Admin access required." });
    return false;
  }
  return true;
};

const requireOps = (request, reply) => {
  if (!requireAuth(request, reply)) return false;
  if (!["admin", "front_desk"].includes(request.authUser.role)) {
    reply.code(403).send({ error: "Front desk or admin access required." });
    return false;
  }
  return true;
};

const isDoctorRole = (role) => role === "doctor" || role === "admin";
const isOpsRole = (role) => role === "admin" || role === "front_desk";

module.exports = {
  registerAuthHooks,
  requireAuth,
  requireAdmin,
  requireOps,
  isDoctorRole,
  isOpsRole,
};
