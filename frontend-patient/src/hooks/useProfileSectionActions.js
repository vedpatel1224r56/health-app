import { useCallback } from "react";

function firstValidationMessage(validationErrors = {}) {
  return Object.values(validationErrors || {}).find(Boolean) || "";
}

export function useProfileSectionActions({
  apiBase,
  apiFetch,
  authToken,
  user,
  profileForm,
  setProfileForm,
  setProfileStatus,
  setUser,
  setProfileEditMode,
  setActivePatientTab,
  loadProfile,
  activeMemberId,
  recordsInputRef,
  loadRecords,
  loadReportInsights,
  setRecordStatus,
  loadSharePasses,
  loadShareHistory,
  setSharePassStatus,
  setSharePass,
  setShareQr,
  mapProfilePayloadToForm,
  loadAbhaHistory,
}) {
  const openRecordUploader = useCallback(() => {
    recordsInputRef.current?.click();
  }, [recordsInputRef]);

  const saveProfile = useCallback(
    async (event) => {
      event.preventDefault();
      setProfileStatus("");
      try {
        const normalizedPhone = String(profileForm.phone || "").replace(/\D/g, "");
        const normalizedEmergencyPhone = String(profileForm.emergencyContactPhone || "").replace(/\D/g, "");
        const normalizedAadhaar = String(profileForm.aadhaarNo || "").replace(/\D/g, "");
        const normalizedAbhaNumber = String(profileForm.abhaNumber || "").replace(/\D/g, "");
        const normalizedAbhaAddress = String(profileForm.abhaAddress || "").trim().toLowerCase();
        const normalizedPinCode = String(profileForm.pinCode || "").replace(/\D/g, "");
        const normalizedAddressLine1 = String(profileForm.addressLine1 || "").trim();
        const normalizedAddressLine2 = String(profileForm.addressLine2 || "").trim();
        const response = await apiFetch(`${apiBase}/api/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            fullName: profileForm.fullName,
            email: profileForm.email,
            age: profileForm.age ? Number(profileForm.age) : null,
            weightKg: profileForm.weightKg ? Number(profileForm.weightKg) : null,
            heightCm: profileForm.heightCm ? Number(profileForm.heightCm) : null,
            sex: profileForm.sex,
            conditions: String(profileForm.conditions || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            allergies: String(profileForm.allergies || "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            region: profileForm.region,
            phone: normalizedPhone,
            abhaNumber: normalizedAbhaNumber,
            abhaAddress: normalizedAbhaAddress,
            addressLine1: normalizedAddressLine1,
            addressLine2: normalizedAddressLine2,
            address: [normalizedAddressLine1, normalizedAddressLine2].filter(Boolean).join(", "),
            bloodGroup: profileForm.bloodGroup,
            dateOfBirth: profileForm.dateOfBirth,
            emergencyContactName: profileForm.emergencyContactName,
            emergencyContactPhone: normalizedEmergencyPhone,
            aadhaarNo: normalizedAadhaar,
            maritalStatus: profileForm.maritalStatus,
            city: profileForm.city,
            state: profileForm.state,
            country: profileForm.country || "India",
            pinCode: normalizedPinCode,
            registrationMode: profileForm.registrationMode,
            visitTime: profileForm.visitTime,
            // Patient profile editing no longer exposes unit assignment fields,
            // so do not re-submit hidden stale doctor/department ids.
            unitDepartmentId: null,
            unitDoctorId: null,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setProfileStatus(firstValidationMessage(data.validationErrors) || data.error || "Unable to save profile.");
          return;
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("health_user", JSON.stringify(data.user));
        }
        if (data.profile) {
          setProfileForm(mapProfilePayloadToForm(data.profile, data.user || user));
        }
        await Promise.all([
          loadProfile(user?.id),
          loadAbhaHistory ? loadAbhaHistory() : Promise.resolve(),
        ]);
        setProfileStatus("Profile saved.");
        setProfileEditMode(false);
        setActivePatientTab("home");
      } catch (error) {
        setProfileStatus("Network error. Check backend connection.");
      }
    },
    [
      apiBase,
      apiFetch,
      loadProfile,
      mapProfilePayloadToForm,
      profileForm,
      setProfileForm,
      setActivePatientTab,
      setProfileEditMode,
      setProfileStatus,
      setUser,
      user?.id,
    ],
  );

  const uploadRecord = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setRecordStatus("");
      if (!file.type || (!file.type.startsWith("image/") && file.type !== "application/pdf")) {
        setRecordStatus("Unsupported format. Upload a PDF or a clear image file.");
        if (event.target) event.target.value = "";
        return;
      }
      try {
        const formData = new FormData();
        formData.append("record", file);
        const response = await apiFetch(`${apiBase}/api/records`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          setRecordStatus(data.error || "Unable to upload record.");
          return;
        }
        setRecordStatus(data.message || "Record uploaded.");
        await Promise.all([loadRecords(activeMemberId), loadReportInsights(activeMemberId)]);
      } catch (error) {
        setRecordStatus("Network error. Check backend connection.");
      } finally {
        if (event.target) {
          event.target.value = "";
        }
      }
    },
    [activeMemberId, apiBase, apiFetch, loadRecords, loadReportInsights, setRecordStatus],
  );

  const deleteRecord = useCallback(
    async (recordId) => {
      if (!recordId) return;
      setRecordStatus("");
      try {
        const response = await apiFetch(`${apiBase}/api/records/${recordId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (!response.ok) {
          setRecordStatus(data.error || "Unable to delete record.");
          return;
        }
        setRecordStatus("Record deleted.");
        await Promise.all([loadRecords(activeMemberId), loadReportInsights(activeMemberId)]);
      } catch (error) {
        setRecordStatus("Network error. Check backend connection.");
      }
    },
    [activeMemberId, apiBase, apiFetch, loadRecords, loadReportInsights, setRecordStatus],
  );

  const generateSharePass = useCallback(async () => {
    if (!authToken || !user?.id) {
      setSharePassStatus("Sign in first.");
      return;
    }

    setSharePassStatus("");
    try {
      const response = await apiFetch(`${apiBase}/api/share-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSharePassStatus(data.error || "Unable to generate health pass.");
        return;
      }

      const doctorUrl = data.doctorUrl ? `${window.location.origin}${data.doctorUrl}` : "";
      setSharePass({
        code: data.code,
        expiresAt: data.expiresAt,
        doctorUrl,
      });
      setShareQr(
        doctorUrl
          ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
              doctorUrl,
            )}`
          : "",
      );
      setSharePassStatus("Health pass generated.");
      await Promise.all([loadSharePasses(), loadShareHistory()]);
    } catch (error) {
      setSharePassStatus("Network error. Check backend connection.");
    }
  }, [
    apiBase,
    apiFetch,
    authToken,
    loadShareHistory,
    loadSharePasses,
    setSharePass,
    setSharePassStatus,
    setShareQr,
    user?.id,
  ]);

  const requestAbhaVerification = useCallback(async () => {
    if (!authToken || !user?.id) {
      setProfileStatus("Sign in first.");
      return;
    }

    setProfileStatus("");
    try {
      const response = await apiFetch(`${apiBase}/api/abha/request-verification`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setProfileStatus(data.error || "Unable to request ABHA verification.");
        return;
      }
      if (data.profile) {
        setProfileForm(mapProfilePayloadToForm(data.profile, user));
      } else {
        await loadProfile(user.id);
      }
      await loadAbhaHistory();
      setProfileStatus(data.message || "ABHA verification request submitted.");
    } catch (error) {
      setProfileStatus("Network error. Check backend connection.");
    }
  }, [
    apiBase,
    apiFetch,
    authToken,
    loadAbhaHistory,
    loadProfile,
    mapProfilePayloadToForm,
    setProfileForm,
    setProfileStatus,
    user,
  ]);

  return {
    openRecordUploader,
    saveProfile,
    uploadRecord,
    deleteRecord,
    generateSharePass,
    requestAbhaVerification,
  };
}
