export function LegacyAdminFallbackSection(props) {
  const {
    user,
    adminOpsStatus,
    opsQueueStatus,
    adminOps,
    opsQueue,
    updateAppointmentStatus,
    billingDrafts,
    updateBillingDraft,
    saveBillingForAppointment,
    viewReceipt,
    loadAdminOps,
    loadOpsQueue,
    adminUsersStatus,
    loadAdminUsers,
    adminUsers,
    updateAdminUserDraft,
    adminSavingUserId,
    saveAdminUser,
    departments,
  } = props;

  return (
    <>
      {["admin", "front_desk"].includes(user?.role) && (
        <section className="grid" id="admin-ops">
          <div className="panel">
            <h2>Front-desk / admin dashboard</h2>
            <p className="panel-sub">Live view of today’s OPD flow for trial operations.</p>
            <div className="action-row">
              <button className="secondary" type="button" onClick={loadAdminOps}>
                Refresh dashboard
              </button>
              <button className="secondary" type="button" onClick={loadOpsQueue}>
                Refresh queue
              </button>
            </div>
            {(adminOpsStatus || opsQueueStatus) && <p className="micro">{adminOpsStatus || opsQueueStatus}</p>}
            {adminOps && (
              <>
                <div className="member-grid">
                  <div className="panel-mini">
                    <h3>Today total</h3>
                    <p className="metric-value">{adminOps.today?.total || 0}</p>
                  </div>
                  <div className="panel-mini">
                    <h3>Checked in</h3>
                    <p className="metric-value">{adminOps.today?.checkedIn || 0}</p>
                  </div>
                  <div className="panel-mini">
                    <h3>Completed</h3>
                    <p className="metric-value">{adminOps.today?.completed || 0}</p>
                  </div>
                  <div className="panel-mini">
                    <h3>No show</h3>
                    <p className="metric-value">{adminOps.today?.noShow || 0}</p>
                  </div>
                </div>
                <div className="grid">
                  <div className="panel result">
                    <h3>Upcoming appointments</h3>
                    <div className="history-list">
                      {(adminOps.upcomingAppointments || []).map((item) => (
                        <div key={`ops-appt-${item.id}`} className="history-card">
                          <p className="history-headline">{item.department_name || "Department"} • {item.status}</p>
                          <p className="micro">{item.doctor_name ? `Dr. ${item.doctor_name}` : "Unassigned doctor"}</p>
                          <p className="micro">{item.patient_name}</p>
                          <p className="micro">{item.reason}</p>
                          <p className="micro">{new Date(item.scheduled_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel result">
                    <h3>Department load today</h3>
                    <div className="history-list">
                      {(adminOps.departmentLoad || []).map((item, index) => (
                        <div key={`ops-dept-${index}`} className="history-card">
                          <p className="history-headline">{item.department_name}</p>
                          <p className="micro">{item.total} appointments</p>
                        </div>
                      ))}
                    </div>
                    <h3 style={{ marginTop: 16 }}>Doctor load today</h3>
                    <div className="history-list">
                      {(adminOps.doctorLoad || []).map((item, index) => (
                        <div key={`ops-doc-${index}`} className="history-card">
                          <p className="history-headline">{item.doctor_name}</p>
                          <p className="micro">{item.total} appointments</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="panel result" style={{ marginTop: 16 }}>
                  <h3>Today queue actions</h3>
                  <div className="history-list">
                    {opsQueue.map((item) => (
                      <div key={`queue-${item.id}`} className="history-card">
                        <p className="history-headline">
                          #{item.id} • {item.patient_name}
                          {item.member_name ? ` (${item.member_name})` : ""}
                        </p>
                        <p className="micro">
                          {item.department_name || "Department"} • {item.doctor_name ? `Dr. ${item.doctor_name}` : "No doctor"}
                        </p>
                        <p className="micro">{new Date(item.scheduled_at).toLocaleString()} • {item.status}</p>
                        <p className="micro">{item.reason}</p>
                        <div className="action-row">
                          <button className="secondary" type="button" onClick={() => updateAppointmentStatus(item.id, "checked_in")}>Check in</button>
                          <button className="secondary" type="button" onClick={() => updateAppointmentStatus(item.id, "completed")}>Complete</button>
                          <button className="secondary" type="button" onClick={() => updateAppointmentStatus(item.id, "no_show")}>No show</button>
                        </div>
                        <div className="form-row">
                          <label>
                            Fee
                            <input type="number" min="0" value={billingDrafts[item.id]?.amount ?? ""} onChange={(event) => updateBillingDraft(item.id, "amount", event.target.value)} />
                          </label>
                          <label>
                            Billing
                            <select value={billingDrafts[item.id]?.status || "unpaid"} onChange={(event) => updateBillingDraft(item.id, "status", event.target.value)}>
                              <option value="unpaid">Unpaid</option>
                              <option value="paid">Paid</option>
                              <option value="partial">Partial</option>
                              <option value="waived">Waived</option>
                            </select>
                          </label>
                          <label>
                            Method
                            <select value={billingDrafts[item.id]?.paymentMethod || ""} onChange={(event) => updateBillingDraft(item.id, "paymentMethod", event.target.value)}>
                              <option value="">Select</option>
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="card">Card</option>
                            </select>
                          </label>
                        </div>
                        <div className="action-row">
                          <button className="primary" type="button" onClick={() => saveBillingForAppointment(item.id)}>Save billing</button>
                          <button className="ghost" type="button" onClick={() => viewReceipt(item.id)}>View receipt</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {user?.role === "admin" && (
        <section className="grid" id="admin-users">
          <div className="panel">
            <h2>Admin user access</h2>
            <p className="panel-sub">Approve doctors, assign departments, and disable accounts before go-live.</p>
            <div className="action-row">
              <button className="secondary" type="button" onClick={loadAdminUsers}>Refresh users</button>
            </div>
            {adminUsersStatus && <p className="micro">{adminUsersStatus}</p>}
            <div className="history-list">
              {adminUsers.slice(0, 12).map((adminUser) => (
                <div key={adminUser.id} className="history-card">
                  <p className="history-headline">{adminUser.name} {adminUser.id === user.id ? "(You)" : ""}</p>
                  <p className="micro">{adminUser.email}</p>
                  <div className="form-row">
                    <label>
                      Role
                      <select value={adminUser.roleDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, "roleDraft", event.target.value)}>
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="front_desk">Front desk</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label>
                      Access
                      <select value={adminUser.activeDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, "activeDraft", event.target.value)}>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </label>
                  </div>
                  {(adminUser.roleDraft === "doctor" || adminUser.roleDraft === "admin") && (
                    <div className="form-row">
                      <label>
                        Department
                        <select value={adminUser.departmentIdDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, "departmentIdDraft", event.target.value)}>
                          <option value="">Select department</option>
                          {departments.map((department) => (
                            <option key={department.id} value={department.id}>{department.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Qualification
                        <input type="text" value={adminUser.qualificationDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, "qualificationDraft", event.target.value)} />
                      </label>
                    </div>
                  )}
                  <button className="primary" type="button" disabled={adminSavingUserId === adminUser.id} onClick={() => saveAdminUser(adminUser)}>
                    {adminSavingUserId === adminUser.id ? "Saving..." : "Save access"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
