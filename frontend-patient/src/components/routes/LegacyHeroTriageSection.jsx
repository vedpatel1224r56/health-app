export function LegacyHeroTriageSection(props) {
  const {
    t,
    language,
    user,
    signOut,
    setAuthMode,
    scrollToSection,
    isOpsUser,
    profileSummary,
    profileCompletion,
    lastGuidance,
    sharePass,
    generateSharePass,
    openRecordUploader,
    triageType,
    setTriageType,
    submitTriage,
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
    handlePhotoChange,
    removeTriagePhoto,
    triageLoading,
    triageError,
    triageResult,
    downloadVisitPdf,
    handleGuidanceFeedback,
    handleVisitFollowup,
    feedbackStatus,
    authMode,
    handleAuth,
    authForm,
    updateAuthField,
    authError,
    resetForm,
    setResetForm,
    requestPasswordReset,
    confirmPasswordReset,
    resetStatus,
  } = props;

  return (
    <>
      {!isOpsUser && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{t("heroEyebrow")}</p>
            <h1>{t("heroTitle")}</h1>
            <p className="lead">{t("heroLead")}</p>
            <div className="hero-actions">
              <a className="primary" href="#triage">
                {t("heroStart")}
              </a>
              <a className="secondary" href="#how">
                {t("heroHow")}
              </a>
            </div>
            <p className="micro">{t("heroNotice")}</p>
          </div>
          <div className="hero-card">
            <h3>{t("safetyTitle")}</h3>
            <p>{profileSummary}</p>
            <div className="pill-row">
              <span className="pill">{t("pillOffline")}</span>
              <span className="pill">{language === "gu" ? "Gujarati" : "English"}</span>
              <span className="pill">{t("pillPrivacy")}</span>
              <span className="pill">{t("pillBharat")}</span>
            </div>
            <div className="hero-grid">
              <div>
                <p className="stat">4 min</p>
                <p className="stat-label">{t("statTime")}</p>
              </div>
              <div>
                <p className="stat">24/7</p>
                <p className="stat-label">{t("statAccess")}</p>
              </div>
              <div>
                <p className="stat">1 tap</p>
                <p className="stat-label">{t("statSave")}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {user && !isOpsUser && (
        <section className="member-zone">
          <div className="member-head">
            <h2>{t("memberTitle")}</h2>
            <p>{t("memberSubtitle")}</p>
          </div>
          <div className="member-grid">
            <article className="member-card">
              <h3>{t("memberCardProfile")}</h3>
              <p className="member-metric">{profileCompletion}%</p>
              <button type="button" className="secondary" onClick={() => scrollToSection("profile")}>
                {t("memberOpenProfile")}
              </button>
            </article>
            <article className="member-card">
              <h3>{t("memberCardLast")}</h3>
              <p className="member-metric">{lastGuidance?.result?.headline || t("memberNoTriage")}</p>
              <button type="button" className="secondary" onClick={() => scrollToSection("profile")}>
                {t("memberOpenHistory")}
              </button>
            </article>
            <article className="member-card">
              <h3>{t("memberCardPass")}</h3>
              <p className="member-metric">{sharePass?.code || "---- ----"}</p>
              <button type="button" className="secondary" onClick={generateSharePass}>
                {t("memberOpenPass")}
              </button>
            </article>
            <article className="member-card muted">
              <h3>{t("memberCardRecords")}</h3>
              <p className="member-metric">PDF / Lab / Rx</p>
              <button type="button" className="secondary" onClick={openRecordUploader}>
                {t("memberUploadDocs")}
              </button>
            </article>
          </div>
        </section>
      )}

      {!isOpsUser && (
        <section className="grid">
          <div className="panel">
            <h2 id="triage">{t("triageTitle")}</h2>
            <p className="panel-sub">{t("triageSubtitle")}</p>
            <form className="form" onSubmit={submitTriage}>
              <div className="action-row">
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
                    <input type="number" min="1" value={triageForm.durationDays} onChange={(event) => updateTriageField("durationDays", event.target.value)} />
                  </label>
                  <label className="block">
                    {t("severity")}
                    <input type="range" min="1" max="5" value={triageForm.severity} onChange={(event) => updateTriageField("severity", event.target.value)} />
                    <span className="range-label">{triageForm.severity} / 5</span>
                  </label>
                  <div className="checklist">
                    <p className="checklist-title">{t("commonSymptoms")}</p>
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
                  </div>
                  <label className="block">
                    {t("additionalSymptoms")}
                    <input
                      type="text"
                      placeholder={t("additionalPlaceholder")}
                      value={triageForm.additionalSymptoms}
                      onChange={(event) => updateTriageField("additionalSymptoms", event.target.value)}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    {t("duration")}
                    <input type="number" min="1" value={dentalForm.durationDays} onChange={(event) => updateDentalField("durationDays", event.target.value)} />
                  </label>
                  <label className="block">
                    {t("dentalPainScale")}
                    <input type="range" min="1" max="10" value={dentalForm.painScale} onChange={(event) => updateDentalField("painScale", event.target.value)} />
                    <span className="range-label">{dentalForm.painScale} / 10</span>
                  </label>
                  <div className="checklist">
                    <p className="checklist-title">{t("dentalSymptoms")}</p>
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
                  </div>
                  <label className="block">
                    <input type="checkbox" checked={dentalForm.hotColdTrigger} onChange={(event) => updateDentalField("hotColdTrigger", event.target.checked)} />{" "}
                    {t("dentalHotColdTrigger")}
                  </label>
                  <label className="block">
                    <input type="checkbox" checked={dentalForm.swelling} onChange={(event) => updateDentalField("swelling", event.target.checked)} />{" "}
                    {t("dentalSwelling")}
                  </label>
                </>
              )}

              <label className="block">
                Upload a photo (optional)
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
              {triageForm.photoPreview && (
                <div className="photo-preview">
                  <img src={triageForm.photoPreview} alt="Selected" />
                  <button type="button" className="remove-btn" onClick={removeTriagePhoto}>
                    {t("removePhoto")}
                  </button>
                </div>
              )}

              <div className="checklist warning">
                <p className="checklist-title">{triageType === "general" ? t("redFlags") : t("dentalRedFlags")}</p>
                <div className="chip-grid">
                  {(triageType === "general" ? redFlagOptions : dentalRedFlagOptions).map((flag) => (
                    <button
                      type="button"
                      key={flag}
                      className={(triageType === "general" ? triageForm.redFlags : dentalForm.redFlags).includes(flag) ? "chip danger" : "chip"}
                      onClick={() => (triageType === "general" ? toggleArrayValue("redFlags", flag) : toggleDentalArrayValue("redFlags", flag))}
                    >
                      {triageType === "general" ? translateSymptom(flag) : flag}
                    </button>
                  ))}
                </div>
              </div>

              <button className="primary full" type="submit">
                {triageLoading ? t("runningTriage") : t("getGuidance")}
              </button>
              {triageError && <p className="error">{triageError}</p>}
            </form>
          </div>

          <div className="panel result">
            <h2>{t("guidanceTitle")}</h2>
            {!triageResult ? (
              <div className="empty">
                <p>{t("guidanceEmpty")}</p>
                <p className="micro">{t("guidanceNote")}</p>
              </div>
            ) : (
              <div className={`result-card ${triageResult.level}`}>
                <p className="result-label">{triageResult.headline}</p>
                <p className="result-urgency">{triageResult.urgency}</p>
                <div className="result-list">
                  {triageResult.suggestions?.map((item) => (
                    <div key={item} className="result-item">
                      {item}
                    </div>
                  ))}
                </div>
                <p className="micro">
                  {t("triageSource")}:{" "}
                  {triageResult.source === "gemini"
                    ? t("sourceGemini")
                    : triageResult.source === "openai"
                      ? t("sourceOpenai")
                      : triageResult.source === "ml_local"
                        ? t("sourceLocalModel")
                        : t("sourceFallback")}
                </p>
                <p className="micro">{triageResult.disclaimer}</p>
                <button type="button" className="secondary" onClick={downloadVisitPdf}>
                  {t("downloadVisitPdf")}
                </button>
                {user && (
                  <div className="feedback-box">
                    <p className="micro">{t("feedbackPrompt")}</p>
                    <div className="action-row">
                      <button type="button" className="secondary" onClick={() => handleGuidanceFeedback(true)}>
                        {t("feedbackYes")}
                      </button>
                      <button type="button" className="secondary" onClick={() => handleGuidanceFeedback(false)}>
                        {t("feedbackNo")}
                      </button>
                    </div>
                    <p className="micro">{t("followupPrompt")}</p>
                    <div className="action-row">
                      <button type="button" className="secondary" onClick={() => handleVisitFollowup(true)}>
                        {t("followupYes")}
                      </button>
                      <button type="button" className="secondary" onClick={() => handleVisitFollowup(false)}>
                        {t("followupNo")}
                      </button>
                    </div>
                    {feedbackStatus && <p className="micro">{feedbackStatus}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="panel-mini" id="account">
              <h3>{t("account")}</h3>
              {user ? (
                <div className="account">
                  <p className="account-name">{user.name}</p>
                  <p className="account-email">{user.email}</p>
                  {(user.role === "doctor" || user.role === "admin") && (
                    <a className="secondary" href="/doctor-dashboard">
                      {t("continueAsDoctor")}
                    </a>
                  )}
                  <button className="ghost" onClick={signOut}>
                    {t("navSignOut")}
                  </button>
                </div>
              ) : (
                <div className="auth-card">
                  <form className="auth" onSubmit={handleAuth}>
                    <div className="auth-toggle">
                      <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
                        {t("signIn")}
                      </button>
                      <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>
                        {t("create")}
                      </button>
                    </div>
                    {authMode === "signup" && (
                      <label>
                        {t("name")}
                        <input type="text" value={authForm.name} onChange={(event) => updateAuthField("name", event.target.value)} />
                      </label>
                    )}
                    <label>
                      {t("email")}
                      <input type="email" value={authForm.email} onChange={(event) => updateAuthField("email", event.target.value)} />
                    </label>
                    <label>
                      {t("password")}
                      <input type="password" value={authForm.password} onChange={(event) => updateAuthField("password", event.target.value)} />
                    </label>
                    {authError && <p className="error">{authError}</p>}
                    <button className="primary full" type="submit">
                      {authMode === "signup" ? t("createAccount") : t("signIn")}
                    </button>
                  </form>
                  <div className="pass-card" style={{ marginTop: 12 }}>
                    <p className="micro"><strong>Forgot password</strong></p>
                    <label className="block">
                      {t("email")}
                      <input type="email" value={resetForm.email} onChange={(event) => setResetForm((prev) => ({ ...prev, email: event.target.value }))} />
                    </label>
                    <div className="action-row">
                      <button className="secondary" type="button" onClick={requestPasswordReset}>
                        Send OTP
                      </button>
                    </div>
                    <label className="block">
                      OTP
                      <input type="text" value={resetForm.token} onChange={(event) => setResetForm((prev) => ({ ...prev, token: event.target.value }))} />
                    </label>
                    <label className="block">
                      New password
                      <input type="password" value={resetForm.newPassword} onChange={(event) => setResetForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
                    </label>
                    <button className="primary full" type="button" onClick={confirmPasswordReset}>
                      Reset password
                    </button>
                    {resetStatus && <p className="micro">{resetStatus}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
