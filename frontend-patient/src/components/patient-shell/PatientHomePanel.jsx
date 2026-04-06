export function PatientHomePanel({
  user,
  profileForm,
  profileSummary,
  profileCompletion,
  pendingServiceRequests,
  unreadNotificationsCount,
  setActivePatientTab,
  nextAppointment,
  latestHospitalUpdate,
  lastGuidance,
  t,
  openProfileEditor,
  sharePass,
  sharePassStatus,
  shareQr,
  generateSharePass,
}) {
  const formatDoctorName = (name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return "";
    return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
  };
  const nextAppointmentStatus = String(nextAppointment?.status || "").toLowerCase();
  const nextAppointmentLabel =
    nextAppointmentStatus === "requested" ? "Pending appointment request" : "Next appointment";
  const nextAppointmentStatusLabel =
    nextAppointmentStatus === "approved"
      ? "Scheduled"
      : String(nextAppointment?.status || "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
  const firstName = String(user.name || "").split(" ")[0] || "there";
  const pendingRequests = Number(pendingServiceRequests || 0);
  const careReadinessLabel =
    profileCompletion >= 85 ? "Ready for visits" : profileCompletion >= 55 ? "Needs a few details" : "Profile setup pending";
  const quickActions = [
    {
      key: "triage",
      title: "Start triage",
      sub: "Check symptoms in minutes",
      icon: "🩺",
      eyebrow: "Self-check",
    },
    {
      key: "appointments",
      title: "Book appointment",
      sub: "In-person or tele-consult",
      icon: "🗓",
      eyebrow: "Visits",
    },
    {
      key: "clinical",
      title: "Clinical records",
      sub: "Prescriptions, orders, and visit notes",
      icon: "📋",
      eyebrow: "History",
    },
  ];

  return (
    <section className="panel patient-home-panel">
      <div className="patient-home-hero">
        <div className="patient-home-copy">
          <p className="patient-home-eyebrow">SehatSaathi Home</p>
          <h2>Hi {firstName}, your care dashboard is ready</h2>
          <p className="panel-sub">{profileSummary}</p>
          <div className="patient-home-callouts">
            <div className="patient-callout-pill">
              <span className="patient-callout-label">Care status</span>
              <strong>{careReadinessLabel}</strong>
            </div>
            <div className="patient-callout-pill">
              <span className="patient-callout-label">Pending requests</span>
              <strong>{pendingRequests}</strong>
            </div>
          </div>
          <div className="action-row patient-home-actions">
            <button type="button" className="primary" onClick={() => setActivePatientTab("appointments")}>
              Book a visit
            </button>
            <button type="button" className="ghost" onClick={() => setActivePatientTab("clinical")}>
              Open records
            </button>
          </div>
        </div>
        <div className="patient-home-kpis">
          <article className="patient-kpi-card">
            <p className="kpi-label">Profile completion</p>
            <p className="kpi-value">{profileCompletion}%</p>
            <p className="kpi-note">Keep profile ready for faster registration</p>
          </article>
          <article className="patient-kpi-card is-updates">
            <p className="kpi-label">Updates</p>
            <p className="kpi-value">{unreadNotificationsCount}</p>
            <p className="kpi-note">{unreadNotificationsCount ? "New hospital updates and care notifications" : "You are caught up on care updates"}</p>
          </article>
          <article className="patient-kpi-card is-visit">
            <p className="kpi-label">{nextAppointment ? "Next visit" : "Visit status"}</p>
            <p className="kpi-value kpi-value-compact">{nextAppointment ? nextAppointmentStatusLabel : "No visit"}</p>
            <p className="kpi-note">
              {nextAppointment
                ? `${nextAppointment.department_name || nextAppointment.department}${nextAppointment.doctor_name ? ` • ${formatDoctorName(nextAppointment.doctor_name)}` : ""}`
                : "Book your next appointment when needed."}
            </p>
          </article>
        </div>
      </div>

      <div className="patient-home-quick-grid">
        {quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            className="patient-quick-card"
            onClick={() => setActivePatientTab(action.key)}
          >
            <span className="quick-icon">{action.icon}</span>
            <span className="quick-eyebrow">{action.eyebrow}</span>
            <span className="quick-title">{action.title}</span>
            <span className="quick-sub">{action.sub}</span>
          </button>
        ))}
      </div>

      <div className="patient-home-grid">
        <article className="pass-card patient-surface-card">
          <p className="history-headline">{nextAppointment ? nextAppointmentLabel : "Next appointment"}</p>
          <p className="member-metric">
            {nextAppointment ? new Date(nextAppointment.scheduled_at).toLocaleString() : "No upcoming visit"}
          </p>
          <p className="micro">
            {nextAppointment
              ? `${nextAppointment.department_name || nextAppointment.department}${nextAppointment.doctor_name ? ` • ${formatDoctorName(nextAppointment.doctor_name)}` : ""}${nextAppointment.status ? ` • ${nextAppointmentStatusLabel}` : ""}`
              : "Book a visit from Appointments."}
          </p>
        </article>

        <article className="pass-card patient-surface-card">
          <p className="history-headline">Profile</p>
          <p className="member-metric">{profileCompletion}% complete</p>
          <p className="micro">Keep your profile updated for faster registration and cleaner hospital records.</p>
          <div className="action-row">
            <button type="button" className="primary" onClick={openProfileEditor}>
              Edit profile
            </button>
          </div>
        </article>

        <article className="pass-card patient-surface-card patient-share-card">
          <p className="history-headline">Digital health pass</p>
          <p className="member-metric">{sharePass?.code || "Ready on request"}</p>
          <p className="micro">
            Generate a temporary pass to share your latest records quickly during a visit.
          </p>
          <div className="action-row">
            <button type="button" className="ghost" onClick={generateSharePass}>
              {sharePass ? "Refresh pass" : "Generate pass"}
            </button>
          </div>
          {sharePassStatus ? <p className="micro">{sharePassStatus}</p> : null}
        </article>

        {latestHospitalUpdate ? (
          <article className="pass-card patient-surface-card patient-update-card">
            <p className="history-headline">
              {latestHospitalUpdate.seasonTag ? `${latestHospitalUpdate.seasonTag} guidance` : "Hospital update"}
            </p>
            <p className="member-metric">{latestHospitalUpdate.title}</p>
            <p className="micro">
              {latestHospitalUpdate.summary || latestHospitalUpdate.body || "Open Hospital to read the latest patient guidance."}
            </p>
            <div className="action-row">
              <button type="button" className="ghost" onClick={() => setActivePatientTab("hospital")}>
                Open hospital updates
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
