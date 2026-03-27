import { useCallback } from "react";

export function useTriageSectionActions({
  apiBase,
  apiFetch,
  triageType,
  triageForm,
  dentalForm,
  setTriageForm,
  setDentalForm,
  setTriageType,
  setTriageDraftStatus,
  setTriageLoading,
  setTriageError,
  setTriageResult,
  loadHistory,
  user,
  fallbackTriage,
}) {
  const updateTriageField = useCallback((key, value) => {
    setTriageForm((prev) => ({ ...prev, [key]: value }));
  }, [setTriageForm]);

  const updateDentalField = useCallback((key, value) => {
    setDentalForm((prev) => ({ ...prev, [key]: value }));
  }, [setDentalForm]);

  const saveTriageDraftNow = useCallback(() => {
    try {
      const payload = {
        triageForm: {
          age: triageForm.age,
          sex: triageForm.sex,
          durationDays: triageForm.durationDays,
          severity: triageForm.severity,
          symptoms: triageForm.symptoms,
          additionalSymptoms: triageForm.additionalSymptoms,
          redFlags: triageForm.redFlags,
        },
        dentalForm,
        triageType,
      };
      localStorage.setItem("health_triage_draft", JSON.stringify(payload));
      setTriageDraftStatus("Draft saved.");
    } catch (error) {
      setTriageDraftStatus("Unable to save draft.");
    }
  }, [dentalForm, setTriageDraftStatus, triageForm, triageType]);

  const clearTriageDraft = useCallback(() => {
    localStorage.removeItem("health_triage_draft");
    setTriageForm({
      age: "",
      sex: "Female",
      durationDays: 0,
      severity: 0,
      symptoms: [],
      additionalSymptoms: "",
      redFlags: [],
      photoFile: null,
      photoPreview: "",
    });
    setDentalForm({
      durationDays: 0,
      painScale: 0,
      symptoms: [],
      redFlags: [],
      hotColdTrigger: false,
      swelling: false,
    });
    setTriageType("general");
    setTriageDraftStatus("Draft cleared.");
  }, [setDentalForm, setTriageDraftStatus, setTriageForm, setTriageType]);

  const submitTriage = useCallback(async (event) => {
    event.preventDefault();
    setTriageLoading(true);
    setTriageError("");

    const payload =
      triageType === "dental"
        ? {
            type: "dental",
            age: Number(triageForm.age || 0),
            sex: triageForm.sex,
            durationDays: Number(dentalForm.durationDays || 0),
            painScale: Number(dentalForm.painScale || 0),
            symptoms: dentalForm.symptoms,
            redFlags: dentalForm.redFlags,
            hotColdTrigger: Boolean(dentalForm.hotColdTrigger),
            swelling: Boolean(dentalForm.swelling),
          }
        : {
            type: "general",
            age: Number(triageForm.age || 0),
            sex: triageForm.sex,
            durationDays: Number(triageForm.durationDays || 0),
            severity: Number(triageForm.severity || 0),
            symptoms: triageForm.symptoms,
            additionalSymptoms: triageForm.additionalSymptoms,
            redFlags: triageForm.redFlags,
          };

    try {
      const response = await apiFetch(`${apiBase}/api/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setTriageError(data.error || "Unable to generate guidance.");
        return;
      }
      setTriageResult(data.result || fallbackTriage(payload));
      await loadHistory(user?.id);
    } catch (error) {
      setTriageError("Network error. Check backend connection.");
    } finally {
      setTriageLoading(false);
    }
  }, [
    apiBase,
    apiFetch,
    dentalForm,
    fallbackTriage,
    loadHistory,
    setTriageError,
    setTriageLoading,
    setTriageResult,
    triageForm,
    triageType,
    user?.id,
  ]);

  return {
    updateTriageField,
    updateDentalField,
    saveTriageDraftNow,
    clearTriageDraft,
    submitTriage,
  };
}
