export function ResetPasswordPage({ t, resetForm, setResetForm, confirmPasswordReset, resetStatus }) {
  return (
    <div className="app">
      <main className="doctor-view">
        <section className="panel">
          <h1>Reset password</h1>
          <p className="panel-sub">Enter the OTP received on your email to set a new password.</p>
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
            <label className="block">
              OTP
              <input
                type="text"
                value={resetForm.token}
                onChange={(event) =>
                  setResetForm((prev) => ({ ...prev, token: event.target.value }))
                }
              />
            </label>
            <label className="block">
              New password
              <input
                type="password"
                value={resetForm.newPassword}
                onChange={(event) =>
                  setResetForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
              />
            </label>
            <button className="primary full" type="button" onClick={confirmPasswordReset}>
              Reset password
            </button>
            {resetStatus && <p className="micro">{resetStatus}</p>}
            <a className="secondary" href="/">
              Back to app
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
