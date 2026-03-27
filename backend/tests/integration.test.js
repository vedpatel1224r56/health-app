const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs/promises");

const bootstrap = async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "health-app-test-"));
  process.env.NODE_ENV = "test";
  process.env.DB_PROVIDER = "sqlite";
  process.env.DATABASE_URL = "";
  process.env.DB_PATH = path.join(tmpRoot, "health.db");
  process.env.UPLOAD_DIR = path.join(tmpRoot, "uploads");
  process.env.PASSWORD_RESET_OTP_OUTBOX_PATH = path.join(tmpRoot, "outbox", "otp.log");
  process.env.PASSWORD_RESET_OUTBOX_PATH = path.join(tmpRoot, "outbox", "reset.log");
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.CORS_ORIGINS = "http://localhost:5173";

  const { fastify, initDb } = require("../src/server");
  await initDb();
  await fastify.ready();

  const call = async (method, url, payload, token, headers = {}) => {
    const baseHeaders = payload ? { "content-type": "application/json" } : {};
    const response = await fastify.inject({
      method,
      url,
      headers: {
        ...baseHeaders,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      payload: payload ? JSON.stringify(payload) : undefined,
    });
    return {
      status: response.statusCode,
      body: response.json(),
    };
  };

  const cleanup = async () => {
    await fastify.close();
  };

  return { call, cleanup };
};

test("auth refresh, logout-all invalidation, and idempotent marketplace create", async () => {
  const { call, cleanup } = await bootstrap();
  try {
    const register = await call("POST", "/api/auth/register", {
      name: "Test Patient",
      email: "test.patient@example.com",
      password: "Patient@123",
    });
    assert.equal(register.status, 200);
    assert.ok(register.body.token);
    assert.ok(register.body.refreshToken);

    const login = await call("POST", "/api/auth/login", {
      email: "test.patient@example.com",
      password: "Patient@123",
    });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    assert.ok(login.body.refreshToken);

    const refresh = await call("POST", "/api/auth/refresh", {
      refreshToken: login.body.refreshToken,
    });
    assert.equal(refresh.status, 200);
    assert.ok(refresh.body.token);
    assert.ok(refresh.body.refreshToken);

    const meBefore = await call("GET", "/api/auth/me", null, login.body.token);
    assert.equal(meBefore.status, 200);

    const req1 = await call(
      "POST",
      "/api/marketplace/requests",
      {
        requestType: "pharmacy",
        partnerId: 1,
        serviceName: "Prescription fulfilment",
        fulfillmentMode: "home_delivery",
        listedPrice: 25,
      },
      refresh.body.token,
      { "idempotency-key": "test-marketplace-1", "content-type": "application/json" },
    );
    assert.equal(req1.status, 200);
    assert.ok(req1.body.request?.id);

    const req2 = await call(
      "POST",
      "/api/marketplace/requests",
      {
        requestType: "pharmacy",
        partnerId: 1,
        serviceName: "Prescription fulfilment",
        fulfillmentMode: "home_delivery",
        listedPrice: 25,
      },
      refresh.body.token,
      { "idempotency-key": "test-marketplace-1", "content-type": "application/json" },
    );
    assert.equal(req2.status, 200);
    assert.equal(req1.body.request.id, req2.body.request.id);

    const forbidden = await call("GET", "/api/admin/users", null, refresh.body.token);
    assert.equal(forbidden.status, 403);

    const logoutAll = await call("POST", "/api/auth/logout-all", null, login.body.token);
    assert.equal(logoutAll.status, 200);

    const meAfter = await call("GET", "/api/auth/me", null, login.body.token);
    assert.equal(meAfter.status, 401);
  } finally {
    await cleanup();
  }
});
