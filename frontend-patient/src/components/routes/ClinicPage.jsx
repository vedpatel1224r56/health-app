export function ClinicPage({
  t,
  doctorLang,
  setDoctorLang,
  clinicCode,
  setClinicCode,
  openClinicSummary,
  scannerActive,
  startScanner,
  stopScanner,
  clinicVideoRef,
  clinicStatus,
}) {
  return (
    <div className="app">
      <main className="doctor-view">
        <section className="panel">
          <h1>{t("clinicTitle")}</h1>
          <label className="block">
            {t("doctorLanguage")}
            <select value={doctorLang} onChange={(e) => setDoctorLang(e.target.value)}>
              <option value="en">English</option>
              <option value="gu">Gujarati</option>
            </select>
          </label>
          <label className="block">
            Code
            <input
              type="text"
              value={clinicCode}
              onChange={(e) => setClinicCode(e.target.value)}
              placeholder={t("clinicCodePlaceholder")}
            />
          </label>
          <button type="button" className="primary" onClick={openClinicSummary}>
            {t("clinicOpen")}
          </button>
          <div className="action-row">
            {!scannerActive ? (
              <button type="button" className="secondary" onClick={startScanner}>
                {t("clinicScanStart")}
              </button>
            ) : (
              <button type="button" className="secondary" onClick={stopScanner}>
                {t("clinicScanStop")}
              </button>
            )}
          </div>
          {scannerActive && (
            <div className="scanner-box">
              <video ref={clinicVideoRef} className="scanner-video" muted playsInline />
            </div>
          )}
          {clinicStatus && <p className="micro">{clinicStatus}</p>}
        </section>
      </main>
    </div>
  );
}
