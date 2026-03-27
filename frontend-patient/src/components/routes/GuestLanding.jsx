import { useState } from "react";

export function GuestLanding({
  t,
  authMode,
  setAuthMode,
  handleAuth,
  authForm,
  updateAuthField,
  authError,
  resetForm,
  setResetForm,
  requestPasswordReset,
  resetStatus,
}) {
  const [showResetModal, setShowResetModal] = useState(false);
  const featureHighlights = [
    { title: "Appointments", text: "Book OPD or tele-consults and keep your follow-ups in one place." },
    { title: "Triage", text: "Check symptoms quickly before deciding home care or doctor review." },
    { title: "Lab reports", text: "Upload reports, track metrics, and review insights with your doctor." },
  ];

  const trustPoints = [
    "Fast patient intake",
    "Safer follow-up continuity",
    "One login for reports and visits",
  ];

  return (
    <div className="app guest-shell">
      <header className="guest-nav">
        <div className="brand guest-brand">
          <div className="logo-mark guest-logo">S</div>
          <p className="brand-title guest-brand-title">{t("brandTitle")}</p>
        </div>
        <div className="guest-nav-actions">
          <button className="ghost" type="button" onClick={() => setAuthMode("login")}>
            {t("signIn")}
          </button>
          <button className="primary" type="button" onClick={() => setAuthMode("signup")}>
            {t("navCreate")}
          </button>
        </div>
      </header>
      <main className="guest-main">
        <section className="guest-hero">
          <div className="guest-copy">
            <p className="guest-eyebrow">SEHATSAATHI PATIENT OPS</p>
            <h1>One patient app for visits, reports, and follow-up care.</h1>
            <p>
              A calmer patient experience for appointments, symptom checks, reports, and hospital updates.
            </p>
            <div className="guest-trust-row">
              {trustPoints.map((item) => (
                <span key={item} className="guest-trust-pill">{item}</span>
              ))}
            </div>
          </div>
          <div className="guest-visual">
            <div className="guest-showcase">
              <div className="guest-showcase-grid">
                {featureHighlights.map((item) => (
                  <div key={item.title} className="guest-showcase-card">
                    <p className="guest-showcase-label">{item.title}</p>
                    <strong>{item.text}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="guest-auth-section">
          <div className={`guest-auth-layout guest-auth-layout-${authMode}`}>
            <div className={`guest-auth-card guest-auth-card-${authMode}`}>
              <p className="guest-auth-kicker">{authMode === "signup" ? "New patient access" : "Welcome back"}</p>
              <h2>{authMode === "signup" ? "Create your account" : "Sign in to SehatSaathi"}</h2>
              <p className="panel-sub">
                {authMode === "signup"
                  ? "Create your patient account to access visits, triage, reports, and hospital updates."
                  : "Sign in to continue with appointments, reports, and your patient timeline."}
              </p>
              <form className={`auth guest-auth-form guest-auth-form-${authMode}`} onSubmit={handleAuth}>
                <div className="auth-toggle">
                  <button
                    type="button"
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => setAuthMode("login")}
                  >
                    {t("signIn")}
                  </button>
                  <button
                    type="button"
                    className={authMode === "signup" ? "active" : ""}
                    onClick={() => setAuthMode("signup")}
                  >
                    {t("create")}
                  </button>
                </div>
                {authMode === "signup" && (
                  <label>
                    {t("name")}
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(event) => updateAuthField("name", event.target.value)}
                      required
                    />
                  </label>
                )}
                <label>
                  {t("email")}
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    required
                  />
                </label>
                <label>
                  {t("password")}
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => updateAuthField("password", event.target.value)}
                    required
                  />
                </label>
                <button className="guest-reset-trigger" type="button" onClick={() => setShowResetModal(true)}>
                  Forgot password?
                </button>
                {authError && <p className="error">{authError}</p>}
                <button className="primary full" type="submit">
                  {authMode === "signup" ? t("createAccount") : t("signIn")}
                </button>
              </form>
            </div>
          </div>
          <div className="guest-bottom-note">
            <span>Built for faster intake</span>
            <span>Secure account access</span>
            <span>Patient records in one place</span>
          </div>
        </section>
      </main>
      {showResetModal ? (
        <div className="modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="modal appointment-modal guest-reset-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Account recovery</p>
                <h2>Reset password</h2>
                <p className="panel-sub">Send an OTP to your email, then continue to the reset screen.</p>
              </div>
              <button className="ghost" type="button" onClick={() => setShowResetModal(false)}>
                Close
              </button>
            </div>
            <div className="form">
              <label className="block">
                {t("email")}
                <input
                  type="email"
                  value={resetForm.email}
                  onChange={(event) =>
                    setResetForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>
              <div className="action-row">
                <button className="secondary" type="button" onClick={requestPasswordReset}>
                  Send OTP
                </button>
                <a className="ghost" href="/reset-password">
                  Enter OTP
                </a>
              </div>
              {resetStatus && <p className="micro">{resetStatus}</p>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
