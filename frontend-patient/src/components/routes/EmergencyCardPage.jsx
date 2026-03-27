export function EmergencyCardPage({ t, emergencyLoading, emergencyData }) {
  return (
    <div className="app">
      <main className="doctor-view">
        <section className="panel">
          <h1>{t("emergencyCard")}</h1>
          {emergencyLoading ? (
            <p className="micro">Loading...</p>
          ) : !emergencyData ? (
            <p className="micro">Emergency card not found.</p>
          ) : (
            <div className="doctor-grid">
              <div className="doctor-card">
                <h3>{t("doctorViewPatient")}</h3>
                <p>{emergencyData.patient?.name || "-"}</p>
                <p className="micro">
                  {t("relation")}: {emergencyData.patient?.relation || "-"}
                </p>
              </div>
              <div className="doctor-card">
                <h3>{t("doctorViewProfile")}</h3>
                <p className="micro">
                  Age: {emergencyData.patient?.age || "-"} | Sex: {emergencyData.patient?.sex || "-"}
                </p>
                <p className="micro">{t("bloodType")}: {emergencyData.patient?.bloodType || "-"}</p>
                <p className="micro">
                  Conditions: {(emergencyData.patient?.conditions || []).join(", ") || "-"}
                </p>
                <p className="micro">
                  Allergies: {(emergencyData.patient?.allergies || []).join(", ") || "-"}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
