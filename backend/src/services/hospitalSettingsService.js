const createHospitalSettingsService = ({
  get,
  all,
  run,
  nowIso,
  safeJsonParse,
  defaultHospitalPublicContent,
  mergeHospitalPublicContent,
}) => {
  const normalizeVisitTypeCode = (value) => String(value || "").trim().toUpperCase();
  const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
  const normalizePinCode = (value) => String(value || "").replace(/\D/g, "");

  const validateHospitalProfile = (payload = {}) => {
    const errors = {};
    const name = String(payload.hospitalName || "").trim();
    const phone = normalizePhone(payload.contactPhone);
    const email = String(payload.contactEmail || "").trim().toLowerCase();
    const pinCode = normalizePinCode(payload.pinCode);

    if (!name) {
      errors.hospitalName = "Hospital name is required.";
    }
    if (phone && phone.length !== 10) {
      errors.contactPhone = "Contact phone must be 10 digits.";
    }
    if (email && !email.includes("@")) {
      errors.contactEmail = "Contact email must be valid.";
    }
    if (pinCode && pinCode.length !== 6) {
      errors.pinCode = "PIN code must be 6 digits.";
    }
    return errors;
  };

  const validateHospitalContent = (content = {}) => {
    const errors = {};
    const appointmentPhones = Array.isArray(content?.scopeOfServices?.appointmentPhones)
      ? content.scopeOfServices.appointmentPhones
      : [];
    const healthPlans = Array.isArray(content?.healthCheckup?.plans) ? content.healthCheckup.plans : [];
    const superSpecialityDepartments = Array.isArray(content?.superSpecialities?.departments)
      ? content.superSpecialities.departments
      : [];

    appointmentPhones.forEach((phone, index) => {
      const normalized = normalizePhone(phone);
      if (normalized && normalized.length !== 10) {
        errors[`appointmentPhones.${index}`] = "Appointment phone must be 10 digits.";
      }
    });

    healthPlans.forEach((plan, index) => {
      if (!String(plan?.name || "").trim()) {
        errors[`healthCheckup.plans.${index}.name`] = "Plan name is required.";
      }
      const price = String(plan?.price || "").trim();
      if (price && Number.isNaN(Number(price.replace(/[^\d.]/g, "")))) {
        errors[`healthCheckup.plans.${index}.price`] = "Plan price must be numeric.";
      }
    });

    superSpecialityDepartments.forEach((department, index) => {
      if (!String(department?.name || "").trim()) {
        errors[`superSpecialities.departments.${index}.name`] = "Department name is required.";
      }
    });

    return errors;
  };

  const readVisitTypes = async ({ activeOnly = false } = {}) => {
    const rows = await all(
      `SELECT id, code, label, active, created_at, updated_at
       FROM visit_types
       ${activeOnly ? "WHERE active = 1" : ""}
       ORDER BY id ASC`,
    );
    return rows.map((row) => ({
      ...row,
      code: normalizeVisitTypeCode(row.code),
      label: row.label || normalizeVisitTypeCode(row.code),
      active: Number(row.active) === 1,
    }));
  };

  const getHospitalProfile = async () =>
    get(
      `SELECT id, hospital_name, hospital_code, contact_phone, contact_email, address_line,
              taluka, district, city, state, country, pin_code, updated_at, created_at
       FROM hospital_profile
       WHERE id = 1
       LIMIT 1`,
    );

  const upsertHospitalProfile = async (payload = {}) => {
    const {
      hospitalName = "",
      hospitalCode = "",
      contactPhone = "",
      contactEmail = "",
      addressLine = "",
      taluka = "",
      district = "",
      city = "",
      state = "",
      country = "",
      pinCode = "",
    } = payload;
    const validationErrors = validateHospitalProfile(payload);
    if (Object.keys(validationErrors).length > 0) {
      return { error: "Hospital profile validation failed.", validationErrors };
    }
    const name = String(hospitalName || "").trim();
    const timestamp = nowIso();
    await run(
      `INSERT INTO hospital_profile
       (id, hospital_name, hospital_code, contact_phone, contact_email, address_line, taluka, district, city, state, country, pin_code, updated_at, created_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         hospital_name = excluded.hospital_name,
         hospital_code = excluded.hospital_code,
         contact_phone = excluded.contact_phone,
         contact_email = excluded.contact_email,
         address_line = excluded.address_line,
         taluka = excluded.taluka,
         district = excluded.district,
         city = excluded.city,
         state = excluded.state,
         country = excluded.country,
         pin_code = excluded.pin_code,
         updated_at = excluded.updated_at`,
      [
        name,
        String(hospitalCode || "").trim(),
        String(contactPhone || "").trim(),
        String(contactEmail || "").trim(),
        String(addressLine || "").trim(),
        String(taluka || "").trim(),
        String(district || "").trim(),
        String(city || "").trim(),
        String(state || "").trim(),
        String(country || "").trim() || "India",
        String(pinCode || "").trim(),
        timestamp,
        timestamp,
      ],
    );
    return { profile: await getHospitalProfile() };
  };

  const getHospitalContentAdmin = async () => {
    const row = await get(
      `SELECT id, content_json, updated_at, created_at
       FROM hospital_public_content
       WHERE id = 1
       LIMIT 1`,
    );
    return {
      content: row?.content_json
        ? mergeHospitalPublicContent(safeJsonParse(row.content_json, defaultHospitalPublicContent()))
        : defaultHospitalPublicContent(),
      updatedAt: row?.updated_at || null,
    };
  };

  const saveHospitalContent = async (content) => {
    if (!content || typeof content !== "object") {
      return { error: "content object is required." };
    }
    const validationErrors = validateHospitalContent(content);
    if (Object.keys(validationErrors).length > 0) {
      return { error: "Hospital content validation failed.", validationErrors };
    }
    const timestamp = nowIso();
    const merged = mergeHospitalPublicContent(content);
    await run(
      `INSERT INTO hospital_public_content (id, content_json, updated_at, created_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         content_json = excluded.content_json,
         updated_at = excluded.updated_at`,
      [JSON.stringify(merged), timestamp, timestamp],
    );
    return { ok: true, updatedAt: timestamp };
  };

  const getPublicHospitalContent = async () => {
    const [profileRow, contentRow] = await Promise.all([
      get(
        `SELECT hospital_name, hospital_code, contact_phone, contact_email, address_line,
                taluka, district, city, state, country, pin_code
         FROM hospital_profile
         WHERE id = 1
         LIMIT 1`,
      ),
      get(
        `SELECT content_json, updated_at
         FROM hospital_public_content
         WHERE id = 1
         LIMIT 1`,
      ),
    ]);

    return {
      profile: profileRow || null,
      content: contentRow?.content_json
        ? mergeHospitalPublicContent(safeJsonParse(contentRow.content_json, defaultHospitalPublicContent()))
        : defaultHospitalPublicContent(),
      updatedAt: contentRow?.updated_at || null,
    };
  };

  const saveVisitTypes = async (items) => {
    if (!items || items.length === 0) {
      return { error: "visitTypes list is required." };
    }
    const timestamp = nowIso();
    for (const item of items) {
      const code = normalizeVisitTypeCode(item?.code);
      const label = String(item?.label || code).trim();
      const active = item?.active === undefined ? true : Boolean(item.active);
      if (!code) {
        return { error: "visitTypes.code is required." };
      }
      await run(
        `INSERT INTO visit_types (code, label, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET
           label = excluded.label,
           active = excluded.active,
           updated_at = excluded.updated_at`,
        [code, label || code, active ? 1 : 0, timestamp, timestamp],
      );
    }
    return { visitTypes: await readVisitTypes() };
  };

  return {
    normalizeVisitTypeCode,
    validateHospitalProfile,
    validateHospitalContent,
    readVisitTypes,
    getHospitalProfile,
    upsertHospitalProfile,
    getHospitalContentAdmin,
    saveHospitalContent,
    getPublicHospitalContent,
    saveVisitTypes,
  };
};

module.exports = { createHospitalSettingsService };
