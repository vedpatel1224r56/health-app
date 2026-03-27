export function TriagePanel({
  t,
  submitTriage,
  triageType,
  setTriageType,
  triageForm,
  updateTriageField,
  dentalForm,
  updateDentalField,
  commonSymptoms,
  dentalSymptomsOptions,
  redFlagOptions,
  dentalRedFlagOptions,
  toggleArrayValue,
  toggleDentalArrayValue,
  translateSymptom,
  triageLoading,
  triageError,
  triageResult,
  history,
  saveTriageDraftNow,
  clearTriageDraft,
  triageDraftStatus,
  triageHistoryQuery,
  setTriageHistoryQuery,
  triageHistoryLevel,
  setTriageHistoryLevel,
  filteredHistory,
}) {
  const latestHistory = filteredHistory?.[0] || history?.[0] || null
  return (
    <section className="panel">
      <div className="triage-shell-hero">
        <div>
          <p className="eyebrow">Triage</p>
          <h2>{t("triageTitle")}</h2>
          <p className="panel-sub">{t("triageSubtitle")}</p>
        </div>
        <div className="triage-shell-stats">
          <article className="triage-shell-stat">
            <span className="mini-label">Mode</span>
            <strong>{triageType === "general" ? t("triageModeGeneral") : t("triageModeDental")}</strong>
            <span className="micro">Choose the flow that matches the concern</span>
          </article>
          <article className="triage-shell-stat">
            <span className="mini-label">Saved checks</span>
            <strong>{history.length}</strong>
            <span className="micro">Previous triage entries in history</span>
          </article>
          <article className="triage-shell-stat">
            <span className="mini-label">Latest</span>
            <strong>{latestHistory?.createdAt ? new Date(latestHistory.createdAt).toLocaleDateString() : "-"}</strong>
            <span className="micro">{latestHistory?.result?.headline || "No recent triage yet"}</span>
          </article>
        </div>
      </div>
      <form className="form" onSubmit={submitTriage}>
        <div className="action-row triage-mode-strip">
          <button type="button" className={triageType === "general" ? "chip active" : "chip"} onClick={() => setTriageType("general")}>
            {t("triageModeGeneral")}
          </button>
          <button type="button" className={triageType === "dental" ? "chip active" : "chip"} onClick={() => setTriageType("dental")}>
            {t("triageModeDental")}
          </button>
        </div>
        <div className="form-row">
          <label>
            {t("age")}
            <input type="number" min="0" value={triageForm.age} onChange={(event) => updateTriageField("age", event.target.value)} />
          </label>
          <label>
            {t("sex")}
            <select value={triageForm.sex} onChange={(event) => updateTriageField("sex", event.target.value)}>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </select>
          </label>
        </div>
        {triageType === "general" ? (
          <>
            <label className="block">
              {t("duration")}
              <input type="number" min="0" value={triageForm.durationDays} onChange={(event) => updateTriageField("durationDays", event.target.value)} />
            </label>
            <label className="block">
              {t("severity")}
              <input type="range" min="0" max="5" value={triageForm.severity} onChange={(event) => updateTriageField("severity", event.target.value)} />
              <span className="range-label">{triageForm.severity} / 5</span>
            </label>
            <div className="chip-grid">
              {commonSymptoms.map((symptom) => (
                <button
                  type="button"
                  key={symptom}
                  className={triageForm.symptoms.includes(symptom) ? "chip active" : "chip"}
                  onClick={() => toggleArrayValue("symptoms", symptom)}
                >
                  {translateSymptom(symptom)}
                </button>
              ))}
            </div>
            <label className="block">
              {t("additionalSymptoms")}
              <input type="text" value={triageForm.additionalSymptoms} onChange={(event) => updateTriageField("additionalSymptoms", event.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className="block">
              {t("duration")}
              <input type="number" min="0" value={dentalForm.durationDays} onChange={(event) => updateDentalField("durationDays", event.target.value)} />
            </label>
            <label className="block">
              {t("dentalPainScale")}
              <input type="range" min="0" max="10" value={dentalForm.painScale} onChange={(event) => updateDentalField("painScale", event.target.value)} />
              <span className="range-label">{dentalForm.painScale} / 10</span>
            </label>
            <div className="chip-grid">
              {dentalSymptomsOptions.map((symptom) => (
                <button
                  type="button"
                  key={symptom}
                  className={dentalForm.symptoms.includes(symptom) ? "chip active" : "chip"}
                  onClick={() => toggleDentalArrayValue("symptoms", symptom)}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="chip-grid">
          {(triageType === "general" ? redFlagOptions : dentalRedFlagOptions).map((flag) => (
            <button
              type="button"
              key={flag}
              className={((triageType === "general" ? triageForm.redFlags : dentalForm.redFlags).includes(flag)) ? "chip danger" : "chip"}
              onClick={() => triageType === "general" ? toggleArrayValue("redFlags", flag) : toggleDentalArrayValue("redFlags", flag)}
            >
              {triageType === "general" ? translateSymptom(flag) : flag}
            </button>
          ))}
        </div>
        <button className="primary full" type="submit">{triageLoading ? t("runningTriage") : t("getGuidance")}</button>
        {triageError && <p className="error">{triageError}</p>}
      </form>
      <div className="pass-card triage-result-shell" style={{ marginTop: 16 }}>
        {!triageResult ? (
          <p className="micro">{t("guidanceEmpty")}</p>
        ) : (
          <>
            <p className="history-headline">{triageResult.headline}</p>
            <p className="micro">{triageResult.urgency}</p>
            <div className="result-list">
              {triageResult.suggestions?.map((item) => (
                <div key={item} className="result-item">{item}</div>
              ))}
            </div>
            {history[1]?.result ? (
              <p className="micro">
                Change since last: {triageResult.level === history[1].result.level ? "Urgency level is similar to your previous triage." : `Level changed from ${history[1].result.level} to ${triageResult.level}.`}
              </p>
            ) : null}
          </>
        )}
      </div>
      <div className="action-row" style={{ marginTop: 12 }}>
        <button className="secondary" type="button" onClick={saveTriageDraftNow}>Save draft</button>
        <button className="ghost" type="button" onClick={clearTriageDraft}>Clear draft</button>
      </div>
      {triageDraftStatus && <p className="micro">{triageDraftStatus}</p>}
      <h3 className="triage-history-title" style={{ marginTop: 16 }}>{t("historyTitle")}</h3>
      <div className="form-row">
        <label>
          Search history
          <input type="search" value={triageHistoryQuery} onChange={(event) => setTriageHistoryQuery(event.target.value)} placeholder="Search by symptom or headline" />
        </label>
        <label>
          Level
          <select value={triageHistoryLevel} onChange={(event) => setTriageHistoryLevel(event.target.value)}>
            <option value="all">All</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="self_care">Self care</option>
          </select>
        </label>
      </div>
      <div className="history-list">
        {(filteredHistory || []).slice(0, 20).map((item) => (
          <div key={`triage-history-${item.id}`} className="history-card">
            <p className="history-date">{new Date(item.createdAt).toLocaleString()}</p>
            <p className="history-headline">{item.result?.headline || "Guidance result"}</p>
            <p className="micro">{item.result?.urgency || "Saved guidance"}</p>
            <p className="micro">Symptoms: {(item.payload?.symptoms || []).slice(0, 6).join(", ") || "Not listed"}</p>
          </div>
        ))}
        {(!filteredHistory || filteredHistory.length === 0) && <p className="micro">{t("historyEmpty")}</p>}
      </div>
    </section>
  );
}
