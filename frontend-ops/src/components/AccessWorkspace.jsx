export function AccessWorkspace({
  adminUsersStatus,
  loadAdminUsers,
  adminUsers,
  updateAdminUserDraft,
  departments,
  saveAdminUser,
}) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Access Control</p>
            <h2>Admin user access</h2>
          </div>
          <button className="secondary" type="button" onClick={loadAdminUsers}>Refresh users</button>
        </div>
        {adminUsersStatus && <p className="micro">{adminUsersStatus}</p>}
        <div className="history-list">
          {adminUsers
            .filter((adminUser) => adminUser.role === 'admin' || adminUser.role === 'doctor')
            .map((adminUser) => (
              <div key={adminUser.id} className="history-card">
                <p className="history-headline">{adminUser.name}</p>
                <p className="micro">{adminUser.email}</p>
                <div className="form-row">
                  <label>
                    Role
                    <select value={adminUser.roleDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, 'roleDraft', event.target.value)}>
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="front_desk">Front desk</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label>
                    Access
                    <select value={adminUser.activeDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, 'activeDraft', event.target.value)}>
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </label>
                </div>
                {(adminUser.roleDraft === 'doctor' || adminUser.roleDraft === 'admin') && (
                  <div className="form-row">
                    <label>
                      Department
                      <select value={adminUser.departmentIdDraft} onChange={(event) => updateAdminUserDraft(adminUser.id, 'departmentIdDraft', event.target.value)}>
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>{department.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Qualification
                      <input
                        type="text"
                        value={adminUser.qualificationDraft}
                        onChange={(event) => updateAdminUserDraft(adminUser.id, 'qualificationDraft', event.target.value)}
                      />
                    </label>
                  </div>
                )}
                <button className="primary" type="button" onClick={() => saveAdminUser(adminUser)}>Save access</button>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
