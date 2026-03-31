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
  abhaHistory,
  requestAbhaVerification,
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
  const abhaStatus = String(profileForm?.abhaStatus || "not_linked").toLowerCase();
  const abhaStatusLabel =
    abhaStatus === "verified"
      ? "Verified"
      : abhaStatus === "pending_verification"
        ? "Pending verification"
      : abhaStatus === "verification_rejected"
        ? "Needs correction"
      : abhaStatus === "self_reported"
        ? "Self reported"
        : "Not linked";
  const abhaSummary =
    profileForm?.abhaNumber || profileForm?.abhaAddress
      ? [profileForm?.abhaNumber, profileForm?.abhaAddress].filter(Boolean).join(" • ")
      : "Add ABHA number or ABHA address in profile.";
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
          <h2>Hi {String(user.name || "").split(" ")[0] || "there"}, your care dashboard is ready</h2>
          <p className="panel-sub">{profileSummary}</p>
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
          <p className="history-headline">ABHA link status</p>
          <p className={`member-metric abha-status-value is-${abhaStatus}`}>{abhaStatusLabel}</p>
          <p className="micro">{abhaSummary}</p>
          <div className="action-row">
            <button type="button" className="ghost" onClick={openProfileEditor}>
              Manage ABHA
            </button>
            {abhaStatus !== "verified" ? (
              <button
                type="button"
                className="secondary"
                onClick={requestAbhaVerification}
                disabled={!(profileForm?.abhaNumber || profileForm?.abhaAddress) || abhaStatus === "pending_verification"}
              >
                {abhaStatus === "pending_verification" ? "Pending" : abhaStatus === "verification_rejected" ? "Request again" : "Request verification"}
              </button>
            ) : null}
          </div>
          {abhaHistory?.[0]?.notes ? <p className="micro">{abhaHistory[0].notes}</p> : null}
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
