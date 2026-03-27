const registerHospitalRoutes = (fastify, deps) => {
  const {
    requireOps,
    requireAdmin,
    all,
    nowIso,
    enqueueAndDeliverUserNotification,
    hospitalSettingsService,
    saveUpload,
    fs,
    path,
    hospitalContentAssetsDir,
  } = deps;

  const getAssetContentType = (filePath) => {
    const ext = String(path.extname(filePath || "") || "").toLowerCase();
    if (ext === ".png") return "image/png";
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".webp") return "image/webp";
    if (ext === ".gif") return "image/gif";
    if (ext === ".svg") return "image/svg+xml";
    if (ext === ".heic") return "image/heic";
    return "application/octet-stream";
  };

  fastify.get("/api/admin/hospital-profile", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    return {
      profile: (await hospitalSettingsService.getHospitalProfile()) || null,
    };
  });

  fastify.put("/api/admin/hospital-profile", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const result = await hospitalSettingsService.upsertHospitalProfile(request.body || {});
    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }
    return result;
  });

  fastify.get("/api/admin/hospital-content", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    return hospitalSettingsService.getHospitalContentAdmin();
  });

  fastify.put("/api/admin/hospital-content", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const result = await hospitalSettingsService.saveHospitalContent(request.body?.content);
    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }
    const patientRows = await all(
      `SELECT id
       FROM users
       WHERE role = 'patient' AND active = 1
       ORDER BY id ASC`,
    );
    const notificationTitle = "Hospital information updated";
    const notificationMessage =
      "The hospital updated patient-side guidance, seasonal advice, or public service information. Open the Hospital section to review the latest update.";
    const eventSuffix = (result.updatedAt || nowIso()).replace(/[^0-9A-Za-z]/g, "");
    for (const row of patientRows) {
      await enqueueAndDeliverUserNotification({
        userId: row.id,
        type: "hospital_update",
        title: notificationTitle,
        message: notificationMessage,
        eventKey: `hospital-content-update:${eventSuffix}:user:${row.id}`,
      });
    }
    return result;
  });

  fastify.post("/api/admin/hospital-content/assets", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    if (!request.isMultipart()) return reply.code(400).send({ error: "multipart form-data required." });

    let fileMeta = null;
    for await (const part of request.parts()) {
      if (part.type !== "file") continue;
      if (!part.mimetype || !part.mimetype.startsWith("image/")) {
        return reply.code(400).send({ error: "Upload a JPG, PNG, WEBP, GIF, or HEIC image." });
      }
      fileMeta = await saveUpload(part, {
        dir: hospitalContentAssetsDir,
        prefix: "hospital_update",
      });
      break;
    }

    if (!fileMeta) {
      return reply.code(400).send({ error: "Image file is required." });
    }

    return {
      filename: fileMeta.filename,
      url: `/api/hospital-content/assets/${encodeURIComponent(fileMeta.filename)}`,
    };
  });

  fastify.get("/api/hospital/content", async () => hospitalSettingsService.getPublicHospitalContent());

  fastify.get("/api/hospital-content/assets/:filename", async (request, reply) => {
    const filename = String(request.params?.filename || "").replace(/[^a-zA-Z0-9._-]/g, "");
    if (!filename) return reply.code(400).send({ error: "Invalid asset name." });
    const filePath = path.join(hospitalContentAssetsDir, filename);
    if (!fs.existsSync(filePath)) return reply.code(404).send({ error: "Asset not found." });
    reply.header("Content-Type", getAssetContentType(filePath));
    return reply.send(fs.createReadStream(filePath));
  });

  fastify.get("/api/admin/visit-types", async (request, reply) => {
    if (!requireOps(request, reply)) return;
    return { visitTypes: await hospitalSettingsService.readVisitTypes() };
  });

  fastify.put("/api/admin/visit-types", async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const items = Array.isArray(request.body?.visitTypes) ? request.body.visitTypes : null;
    const result = await hospitalSettingsService.saveVisitTypes(items);
    if (result.error) {
      return reply.code(400).send({ error: result.error });
    }
    return result;
  });
};

module.exports = { registerHospitalRoutes };
