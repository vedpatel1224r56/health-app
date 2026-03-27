export function DoctorConsolePage({
  t,
  user,
  sessionReady,
  authToken,
  handleAuth,
  authForm,
  updateAuthField,
  authError,
  signOut,
  loadTeleconsults,
  loadAppointments,
  loadEncounters,
  loadDoctorSchedule,
  scheduleForm,
  updateScheduleRow,
  weekdayLabel,
  removeScheduleRow,
  addScheduleRow,
  saveDoctorSchedule,
  scheduleStatus,
  teleLoading,
  teleconsults,
  activeConsultId,
  setActiveConsultId,
  activeConsult,
  doctorConsoleForm,
  setDoctorConsoleForm,
  updateConsultStatus,
  doctorConsoleStatus,
  consultMessages,
  appointments,
  doctorChartForm,
  setDoctorChartForm,
  createEncounterFromDoctor,
  encounters,
  activeEncounterId,
  setActiveEncounterId,
  noteForm,
  setNoteForm,
  addDoctorNote,
  prescriptionForm,
  setPrescriptionForm,
  addPrescription,
  orderForm,
  setOrderForm,
  addOrder,
  doctorChartStatus,
  teleStatusLabel,
}) {
  const hasDoctorAccess = user && (user.role === "doctor" || user.role === "admin");

  return (
    <div className="app">
      <main className="doctor-view">
        <section className="panel">
          <h1>{t("doctorConsoleTitle")}</h1>
          <p className="panel-sub">{t("doctorConsoleSubtitle")}</p>
          {!sessionReady || (authToken && !user) ? (
            <p className="micro">Loading dashboard...</p>
          ) : !user ? (
            <>
              <p className="micro">{t("doctorConsoleSignIn")}</p>
              <form className="auth" onSubmit={handleAuth}>
                <label className="block">
                  {t("email")}
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                  />
                </label>
                <label className="block">
                  {t("password")}
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(event) => updateAuthField("password", event.target.value)}
                  />
                </label>
                {authError && <p className="error">{authError}</p>}
                <button className="primary" type="submit">
                  {t("signIn")}
                </button>
              </form>
            </>
          ) : !hasDoctorAccess ? (
            <>
              <p className="error">{t("doctorConsoleNoAccess")}</p>
              <button className="secondary" type="button" onClick={signOut}>
                {t("navSignOut")}
              </button>
            </>
          ) : (
            <>
              <div className="action-row">
                <button
                  className="secondary"
                  type="button"
                  onClick={async () => {
                    await loadTeleconsults();
                    await loadAppointments();
                    await loadEncounters();
                    await loadDoctorSchedule(user.id);
                  }}
                >
                  Refresh
                </button>
                <button className="ghost" type="button" onClick={signOut}>
                  {t("navSignOut")}
                </button>
              </div>
              <div className="pass-card" style={{ marginBottom: 16 }}>
                <h3>Doctor availability</h3>
                <p className="micro">
                  Define OPD timings and slot length used for appointment booking.
                </p>
                {scheduleForm.map((slot, index) => (
                  <div className="form-row" key={`schedule-${index}`}>
                    <label>
                      Day
                      <select
                        value={slot.weekday}
                        onChange={(event) => updateScheduleRow(index, "weekday", event.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                          <option key={day} value={day}>
                            {weekdayLabel(day)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Start
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(event) => updateScheduleRow(index, "startTime", event.target.value)}
                      />
                    </label>
                    <label>
                      End
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(event) => updateScheduleRow(index, "endTime", event.target.value)}
                      />
                    </label>
                    <label>
                      Slot (min)
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={slot.slotMinutes}
                        onChange={(event) => updateScheduleRow(index, "slotMinutes", event.target.value)}
                      />
                    </label>
                    <button className="ghost" type="button" onClick={() => removeScheduleRow(index)}>
                      Remove
                    </button>
                  </div>
                ))}
                <div className="action-row">
                  <button className="secondary" type="button" onClick={addScheduleRow}>
                    Add day
                  </button>
                  <button className="primary" type="button" onClick={saveDoctorSchedule}>
                    Save schedule
                  </button>
                </div>
                {scheduleStatus && <p className="micro">{scheduleStatus}</p>}
              </div>
              {teleLoading ? (
                <p className="micro">{t("teleLoading")}</p>
              ) : teleconsults.length === 0 ? (
                <p className="micro">{t("teleEmpty")}</p>
              ) : (
                <>
                  <div className="member-list">
                    {teleconsults.map((consult) => (
                      <button
                        key={consult.id}
                        type="button"
                        className={consult.id === activeConsultId ? "chip active" : "chip"}
                        onClick={() => setActiveConsultId(consult.id)}
                      >
                        #{consult.id} • {consult.patientName || "Patient"} •{" "}
                        {teleStatusLabel(consult.status)}
                      </button>
                    ))}
                  </div>
                  {activeConsult && (
                    <div className="pass-card consult-card">
                      <h3>
                        {activeConsult.patientName || "-"}{" "}
                        {activeConsult.memberName ? `(${activeConsult.memberName})` : ""}
                      </h3>
                      <p className="micro">
                        {activeConsult.patientEmail || "-"} • {activeConsult.phone || "No phone"}
                      </p>
                      <p className="micro">{activeConsult.concern}</p>
                      <p className="micro">
                        Requested: {new Date(activeConsult.createdAt).toLocaleString()}
                      </p>
                      <form className="form" onSubmit={updateConsultStatus}>
                        <div className="form-row">
                          <label>
                            {t("teleStatus")}
                            <select
                              value={doctorConsoleForm.status}
                              onChange={(event) =>
                                setDoctorConsoleForm((prev) => ({
                                  ...prev,
                                  status: event.target.value,
                                }))
                              }
                            >
                              <option value="requested">{t("teleStatusRequested")}</option>
                              <option value="scheduled">{t("teleStatusScheduled")}</option>
                              <option value="in_progress">{t("teleStatusInProgress")}</option>
                              <option value="completed">{t("teleStatusCompleted")}</option>
                              <option value="cancelled">{t("teleStatusCancelled")}</option>
                            </select>
                          </label>
                          <label>
                            {t("doctorConsoleMeetingUrl")}
                            <input
                              type="url"
                              value={doctorConsoleForm.meetingUrl}
                              placeholder="https://meet.google.com/..."
                              onChange={(event) =>
                                setDoctorConsoleForm((prev) => ({
                                  ...prev,
                                  meetingUrl: event.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>
                        <button className="primary" type="submit">
                          {t("doctorConsoleSave")}
                        </button>
                      </form>
                      {doctorConsoleStatus && <p className="micro">{doctorConsoleStatus}</p>}
                      <div className="consult-thread">
                        {consultMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`chat-msg ${msg.senderRole === "doctor" ? "bot" : "user"}`}
                          >
                            <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                            <p>{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <hr />
              <h2>{t("doctorChartTitle")}</h2>
              <form className="form" onSubmit={createEncounterFromDoctor}>
                <div className="form-row">
                  <label>
                    Appointment
                    <select
                      value={doctorChartForm.appointmentId}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({
                          ...prev,
                          appointmentId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Select appointment</option>
                      {appointments.map((appointment) => (
                        <option key={appointment.id} value={appointment.id}>
                          #{appointment.id} • {appointment.patient_name || appointment.patientName || "Patient"} •{" "}
                          {appointment.department_name || appointment.department || "Department"} •{" "}
                          {new Date(appointment.scheduled_at).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  {t("chiefComplaint")}
                  <textarea
                    rows={2}
                    value={doctorChartForm.chiefComplaint}
                    onChange={(event) =>
                      setDoctorChartForm((prev) => ({
                        ...prev,
                        chiefComplaint: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block">
                  {t("findings")}
                  <textarea
                    rows={2}
                    value={doctorChartForm.findings}
                    onChange={(event) =>
                      setDoctorChartForm((prev) => ({
                        ...prev,
                        findings: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="form-row">
                  <label className="block">
                    {t("diagnosisText")}
                    <input
                      type="text"
                      value={doctorChartForm.diagnosis}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({
                          ...prev,
                          diagnosis: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="block">
                  {t("encounterVitals")}
                  <textarea
                    rows={2}
                    placeholder="BP: 152/70, Pulse: 84, Temp: 99F"
                    value={doctorChartForm.vitals}
                    onChange={(event) =>
                      setDoctorChartForm((prev) => ({ ...prev, vitals: event.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  {t("planText")}
                  <textarea
                    rows={2}
                    value={doctorChartForm.planText}
                    onChange={(event) =>
                      setDoctorChartForm((prev) => ({ ...prev, planText: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t("followupDate")}
                  <input
                    type="date"
                    value={doctorChartForm.followupDate}
                    onChange={(event) =>
                      setDoctorChartForm((prev) => ({
                        ...prev,
                        followupDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <button className="primary" type="submit">
                  {t("doctorChartCreate")}
                </button>
              </form>
              <div className="member-list">
                {encounters.map((encounter) => (
                  <button
                    key={encounter.id}
                    type="button"
                    className={encounter.id === activeEncounterId ? "chip active" : "chip"}
                    onClick={() => setActiveEncounterId(encounter.id)}
                  >
                    #{encounter.id} • {encounter.status}
                  </button>
                ))}
              </div>
              {activeEncounterId && (
                <>
                  <form className="form" onSubmit={addDoctorNote}>
                    <label className="block">
                      {t("noteText")}
                      <textarea
                        rows={2}
                        value={noteForm.note}
                        onChange={(event) =>
                          setNoteForm((prev) => ({ ...prev, note: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      {t("signature")}
                      <input
                        type="text"
                        value={noteForm.signature}
                        onChange={(event) =>
                          setNoteForm((prev) => ({ ...prev, signature: event.target.value }))
                        }
                      />
                    </label>
                    <button className="secondary" type="submit">
                      {t("addNote")}
                    </button>
                  </form>
                  <form className="form" onSubmit={addPrescription}>
                    <label className="block">
                      Instructions
                      <textarea
                        rows={2}
                        value={prescriptionForm.instructions}
                        onChange={(event) =>
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            instructions: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      {t("medicines")} (one per line: medicine|dose|frequency|duration)
                      <textarea
                        rows={3}
                        value={prescriptionForm.itemsText}
                        onChange={(event) =>
                          setPrescriptionForm((prev) => ({
                            ...prev,
                            itemsText: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <button className="secondary" type="submit">
                      {t("addPrescription")}
                    </button>
                  </form>
                  <form className="form" onSubmit={addOrder}>
                    <div className="form-row">
                      <label>
                        {t("orderType")}
                        <select
                          value={orderForm.orderType}
                          onChange={(event) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              orderType: event.target.value,
                            }))
                          }
                        >
                          <option value="lab">lab</option>
                          <option value="radiology">radiology</option>
                          <option value="pharmacy">pharmacy</option>
                          <option value="procedure">procedure</option>
                        </select>
                      </label>
                      <label>
                        {t("orderItem")}
                        <input
                          type="text"
                          value={orderForm.itemName}
                          onChange={(event) =>
                            setOrderForm((prev) => ({ ...prev, itemName: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        {t("destination")}
                        <input
                          type="text"
                          value={orderForm.destination}
                          onChange={(event) =>
                            setOrderForm((prev) => ({
                              ...prev,
                              destination: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Notes
                        <input
                          type="text"
                          value={orderForm.notes}
                          onChange={(event) =>
                            setOrderForm((prev) => ({ ...prev, notes: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <button className="secondary" type="submit">
                      {t("addOrder")}
                    </button>
                  </form>
                </>
              )}
              {doctorChartStatus && <p className="micro">{doctorChartStatus}</p>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
