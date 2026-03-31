const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs/promises");

const bootstrap = async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "health-app-telemedicine-test-"));
  process.env.NODE_ENV = "test";
  process.env.DB_PROVIDER = "sqlite";
  process.env.DATABASE_URL = "";
  process.env.DB_PATH = path.join(tmpRoot, "health.db");
  process.env.UPLOAD_DIR = path.join(tmpRoot, "uploads");
  process.env.PASSWORD_RESET_OTP_OUTBOX_PATH = path.join(tmpRoot, "outbox", "otp.log");
  process.env.PASSWORD_RESET_OUTBOX_PATH = path.join(tmpRoot, "outbox", "reset.log");
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.CORS_ORIGINS = "http://localhost:5173,http://localhost:5174";

  const { fastify, initDb } = require("../src/server");
  await initDb();
  await fastify.ready();

  const call = async (method, url, payload, token, headers = {}) => {
    const hasJsonBody = payload !== undefined && payload !== null;
    const response = await fastify.inject({
      method,
      url,
      headers: {
        ...(hasJsonBody ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      payload: hasJsonBody ? JSON.stringify(payload) : undefined,
    });

    let body = {};
    try {
      body = response.json();
    } catch {
      body = { raw: response.body };
    }

    return {
      status: response.statusCode,
      body,
    };
  };

  const cleanup = async () => {
    await fastify.close();
  };

  return { call, cleanup };
};

const nextIndiaSlotIso = ({ weekday, hour, minute = 0 }) => {
  const now = new Date();
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const parts = Object.fromEntries(nowParts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentWeekday = weekdayMap[parts.weekday];
  const [year, month, day] = [parts.year, parts.month, parts.day].map(Number);
  const indiaTodayUtc = new Date(Date.UTC(year, month - 1, day));
  let delta = (weekday - currentWeekday + 7) % 7;
  if (delta === 0) delta = 1;
  indiaTodayUtc.setUTCDate(indiaTodayUtc.getUTCDate() + delta);
  const targetYear = indiaTodayUtc.getUTCFullYear();
  const targetMonth = String(indiaTodayUtc.getUTCMonth() + 1).padStart(2, "0");
  const targetDay = String(indiaTodayUtc.getUTCDate()).padStart(2, "0");
  const targetHour = String(hour).padStart(2, "0");
  const targetMinute = String(minute).padStart(2, "0");
  return new Date(`${targetYear}-${targetMonth}-${targetDay}T${targetHour}:${targetMinute}:00+05:30`).toISOString();
};

test("telemedicine audio and video workflow is end-to-end sane", async () => {
  const { call, cleanup } = await bootstrap();
  try {
    const adminLogin = await call("POST", "/api/auth/login", {
      email: "admin@sehatsaathi.local",
      password: "Admin@12345",
    });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.body.token;

    const departmentsResponse = await call("GET", "/api/departments");
    assert.equal(departmentsResponse.status, 200);
    assert.ok(Array.isArray(departmentsResponse.body.departments));
    assert.ok(departmentsResponse.body.departments.length > 0);
    const generalDepartment = departmentsResponse.body.departments[0];

    const doctorEmail = "tele.doctor@example.com";
    const doctorPassword = "Doctor@12345";
    const createDoctor = await call(
      "POST",
      "/api/admin/doctors",
      {
        name: "Tele Test Doctor",
        email: doctorEmail,
        password: doctorPassword,
        departmentId: generalDepartment.id,
        qualification: "MBBS",
        inPersonFee: 300,
        chatFee: 250,
        videoFee: 400,
        audioFee: 350,
      },
      adminToken,
    );
    assert.equal(createDoctor.status, 201);
    const doctorId = createDoctor.body.doctor.id;

    const setAvailability = await call(
      "PUT",
      `/api/doctors/${doctorId}/availability`,
      {
        schedules: [
          { weekday: 1, startTime: "10:00", endTime: "12:00", slotMinutes: 30 },
          { weekday: 2, startTime: "10:00", endTime: "12:00", slotMinutes: 30 },
        ],
      },
      adminToken,
    );
    assert.equal(setAvailability.status, 200);

    const patientRegister = await call("POST", "/api/auth/register", {
      name: "Tele Test Patient",
      email: "tele.patient@example.com",
      password: "Patient@123",
    });
    assert.equal(patientRegister.status, 200);
    const patientToken = patientRegister.body.token;

    const doctorLogin = await call("POST", "/api/auth/login", {
      email: doctorEmail,
      password: doctorPassword,
    });
    assert.equal(doctorLogin.status, 200);
    const doctorToken = doctorLogin.body.token;

    const modes = [
      { mode: "video", iso: nextIndiaSlotIso({ weekday: 1, hour: 10, minute: 0 }) },
      { mode: "audio", iso: nextIndiaSlotIso({ weekday: 2, hour: 10, minute: 30 }) },
    ];

    for (const entry of modes) {
      const createConsult = await call(
        "POST",
        "/api/teleconsults",
        {
          doctorId,
          departmentId: generalDepartment.id,
          mode: entry.mode,
          concern: `${entry.mode} consult for fever follow up and medication review`,
          preferredSlot: entry.iso,
          phone: "9876543210",
        },
        patientToken,
      );
      assert.equal(createConsult.status, 200, `teleconsult create failed for ${entry.mode}`);

      const consultId = createConsult.body.consult.id;
      const createdMeetingUrl = createConsult.body.consult.meetingUrl;
      assert.ok(createdMeetingUrl, `${entry.mode} consult should have a meeting URL`);
      assert.match(createdMeetingUrl, new RegExp(`SehatSaathi-Consult-${consultId}`));
      if (entry.mode === "audio") {
        assert.match(createdMeetingUrl, /startWithVideoMuted=true/);
      } else {
        assert.doesNotMatch(createdMeetingUrl, /startWithVideoMuted=true/);
      }

      const patientConsultList = await call("GET", "/api/teleconsults", null, patientToken);
      assert.equal(patientConsultList.status, 200);
      const patientConsult = patientConsultList.body.consults.find((item) => item.id === consultId);
      assert.ok(patientConsult, `patient should see ${entry.mode} consult`);
      assert.equal(patientConsult.meetingUrl, createdMeetingUrl);
      assert.equal(patientConsult.status, "requested");

      const scheduleConsult = await call(
        "PATCH",
        `/api/teleconsults/${consultId}/status`,
        { status: "scheduled" },
        adminToken,
      );
      assert.equal(scheduleConsult.status, 200);
      assert.equal(scheduleConsult.body.consult.meeting_url, createdMeetingUrl);

      const patientConsent = await call(
        "POST",
        `/api/teleconsults/${consultId}/consent`,
        { accepted: true, policyVersion: "teleconsult_chat_v1" },
        patientToken,
      );
      assert.equal(patientConsent.status, 200);

      const doctorConsent = await call(
        "POST",
        `/api/teleconsults/${consultId}/consent`,
        { accepted: true, policyVersion: "teleconsult_chat_v1" },
        doctorToken,
      );
      assert.equal(doctorConsent.status, 200);

      const doctorConsultList = await call("GET", "/api/teleconsults", null, doctorToken);
      assert.equal(doctorConsultList.status, 200);
      const doctorConsult = doctorConsultList.body.consults.find((item) => item.id === consultId);
      assert.ok(doctorConsult, `doctor should see ${entry.mode} consult`);
      assert.equal(doctorConsult.meetingUrl, createdMeetingUrl);
      assert.equal(doctorConsult.status, "scheduled");

      const patientMessage = await call(
        "POST",
        `/api/teleconsults/${consultId}/messages`,
        { message: `Patient hello on ${entry.mode}` },
        patientToken,
      );
      assert.equal(patientMessage.status, 200);

      const doctorMessage = await call(
        "POST",
        `/api/teleconsults/${consultId}/messages`,
        { message: `Doctor hello on ${entry.mode}` },
        doctorToken,
      );
      assert.equal(doctorMessage.status, 200);

      const messageList = await call("GET", `/api/teleconsults/${consultId}/messages`, null, doctorToken);
      assert.equal(messageList.status, 200);
      assert.equal(messageList.body.messages.length, 2);
      assert.deepEqual(
        messageList.body.messages.map((item) => item.senderRole),
        ["patient", "doctor"],
      );

      const openEncounter = await call("POST", `/api/teleconsults/${consultId}/encounter`, {}, doctorToken);
      assert.ok([200, 201].includes(openEncounter.status));
      const encounterId = openEncounter.body.encounterId;
      assert.ok(encounterId);

      const encounterDetail = await call("GET", `/api/teleconsults/${consultId}/encounter`, null, doctorToken);
      assert.equal(encounterDetail.status, 200);
      assert.ok(encounterDetail.body.encounter);
      assert.equal(
        encounterDetail.body.encounter.chief_complaint,
        `${entry.mode} consult for fever follow up and medication review`,
      );

      const markInProgress = await call(
        "PATCH",
        `/api/encounters/${encounterId}`,
        {
          chiefComplaint: `${entry.mode} consult for fever follow up and medication review`,
          findings: "Stable on room entry.",
          diagnosisText: "Viral upper respiratory infection",
          planText: "Hydration, monitoring, review if worsening.",
          status: "in_progress",
        },
        doctorToken,
      );
      assert.equal(markInProgress.status, 200);

      const patientInProgressList = await call("GET", "/api/teleconsults", null, patientToken);
      const inProgressConsult = patientInProgressList.body.consults.find((item) => item.id === consultId);
      assert.equal(inProgressConsult.status, "in_progress");
      assert.equal(inProgressConsult.meetingUrl, createdMeetingUrl);

      const addNote = await call(
        "POST",
        `/api/encounters/${encounterId}/notes`,
        { note: `Clinical note for ${entry.mode} consult`, signature: "Signed by Dr. Tele Test Doctor" },
        doctorToken,
      );
      assert.equal(addNote.status, 200);

      const addPrescription = await call(
        "POST",
        `/api/encounters/${encounterId}/prescriptions`,
        {
          instructions: "Take after food",
          items: [{ medicine: "Paracetamol", dose: "500 mg", frequency: "BD", duration: "3 days", route: "Oral" }],
        },
        doctorToken,
      );
      assert.equal(addPrescription.status, 200);

      const addOrder = await call(
        "POST",
        `/api/encounters/${encounterId}/orders`,
        { orderType: "lab", itemName: "CBC", destination: "Internal lab", notes: "Check CBC in 2 days if fever persists." },
        doctorToken,
      );
      assert.equal(addOrder.status, 200);

      const markCompleted = await call(
        "PATCH",
        `/api/encounters/${encounterId}`,
        {
          chiefComplaint: `${entry.mode} consult for fever follow up and medication review`,
          findings: "Improving symptoms.",
          diagnosisText: "Viral upper respiratory infection",
          planText: "Continue supportive care.",
          status: "completed",
        },
        doctorToken,
      );
      assert.equal(markCompleted.status, 200);

      const patientCompletedList = await call("GET", "/api/teleconsults", null, patientToken);
      const completedConsult = patientCompletedList.body.consults.find((item) => item.id === consultId);
      assert.equal(completedConsult.status, "completed");
      assert.equal(completedConsult.meetingUrl, createdMeetingUrl);
    }
  } finally {
    await cleanup();
  }
});
