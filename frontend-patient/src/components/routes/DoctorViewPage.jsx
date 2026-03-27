export function DoctorViewPage({
  t,
  doctorLang,
  setDoctorLang,
  doctorViewLoading,
  doctorViewData,
  handleDoctorQuickRating,
  doctorRatingStatus,
  apiBase,
}) {
  return (
    <div className="app">
      <main className="doctor-view">
        <section className="panel">
          <h1>{t("doctorViewTitle")}</h1>
          <div className="action-row">
            <label className="block">
              {t("doctorLanguage")}
              <select
                value={doctorLang}
                onChange={(e) => {
                  const lang = e.target.value;
                  setDoctorLang(lang);
                  const url = new URL(window.location.href);
                  url.searchParams.set("lang", lang);
                  window.history.replaceState({}, "", url.toString());
                }}
              >
                <option value="en">English</option>
                <option value="gu">Gujarati</option>
              </select>
            </label>
          </div>
          {doctorViewLoading ? (
            <p>{t("doctorViewLoading")}</p>
          ) : !doctorViewData ? (
            <p>{t("doctorViewExpired")}</p>
          ) : (
            <div className="doctor-grid">
              <div className="doctor-card">
                <h3>{t("doctorViewPatient")}</h3>
                <p>{doctorViewData.patient?.name || "-"}</p>
                <p className="micro">{doctorViewData.patient?.email || "-"}</p>
              </div>
              <div className="doctor-card">
                <h3>{t("doctorViewProfile")}</h3>
                <p className="micro">
                  Age: {doctorViewData.profile?.age || "-"} | Sex: {doctorViewData.profile?.sex || "-"}
                </p>
                <p className="micro">Region: {doctorViewData.profile?.region || "-"}</p>
                <p className="micro">
                  Conditions: {(doctorViewData.profile?.conditions || []).join(", ") || "-"}
                </p>
                <p className="micro">
                  Allergies: {(doctorViewData.profile?.allergies || []).join(", ") || "-"}
                </p>
              </div>
              <div className="doctor-card">
                <h3>{t("doctorViewRecent")}</h3>
                {(doctorViewData.recentGuidance || []).length === 0 ? (
                  <p className="micro">No recent guidance.</p>
                ) : (
                  (doctorViewData.recentGuidance || []).map((entry) => (
                    <div key={entry.createdAt} className="doctor-entry">
                      <p className="history-date">{new Date(entry.createdAt).toLocaleString()}</p>
                      <p>{entry.result?.headline || "-"}</p>
                      <p className="micro">{entry.result?.urgency || "-"}</p>
                      <p className="micro">
                        {t("doctorSymptoms")}: {(
                          entry.payload?.triageType === "dental"
                            ? entry.payload?.dentalSymptoms || []
                            : entry.payload?.symptoms || []
                        ).join(", ") || t("doctorNone")}
                      </p>
                      <p className="micro">
                        {t("doctorSeverity")}:{" "}
                        {entry.payload?.triageType === "dental"
                          ? `${entry.payload?.dentalPainScale || "-"} / 10`
                          : `${entry.payload?.severity || "-"} / 5`}
                      </p>
                      <p className="micro">
                        {t("doctorDuration")}: {entry.payload?.durationDays || "-"} {t("doctorDays")}
                      </p>
                      <p className="micro">
                        {t("doctorRedFlags")}: {(entry.payload?.redFlags || []).join(", ") || t("doctorNone")}
                      </p>
                      <p className="micro">
                        {t("doctorSource")}: {entry.result?.source || "fallback"}
                      </p>
                    </div>
                  ))
                )}
                <div className="doctor-rating">
                  <p className="micro">{t("doctorRatePrompt")}</p>
                  <div className="action-row">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleDoctorQuickRating("useful")}
                    >
                      {t("doctorRateUseful")}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => handleDoctorQuickRating("not_useful")}
                    >
                      {t("doctorRateNotUseful")}
                    </button>
                  </div>
                  {doctorRatingStatus && <p className="micro">{doctorRatingStatus}</p>}
                  <p className="micro">{t("recordsTitle")}</p>
                  {(doctorViewData.records || []).length === 0 ? (
                    <p className="micro">{t("doctorNone")}</p>
                  ) : (
                    (doctorViewData.records || []).map((rec) => (
                      <p key={rec.id} className="micro">
                        {rec.file_name} ({new Date(rec.created_at).toLocaleDateString()}){" "}
                        {rec.downloadUrl ? (
                          <a href={`${apiBase}${rec.downloadUrl}`} target="_blank" rel="noreferrer">
                            {t("doctorDownloadRecord")}
                          </a>
                        ) : null}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
