const formatPatientDisplayId = (patient) => patient?.patient_uid || `PID${String(patient?.id || '').padStart(6, '0')}`

export function VisitRegistrationModal({
  activeVisitPatient,
  setActiveVisitPatientId,
  visitCreateStatus,
  createVisitForPatient,
  visitCreateForm,
  setVisitCreateForm,
  departments,
  visitDoctors,
  activeVisitTypes,
}) {
  return (
    <div className="modal-backdrop" onClick={() => setActiveVisitPatientId(null)}>
      <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Visit registration</p>
            <h2>Add visit • {activeVisitPatient.nameDraft || activeVisitPatient.name}</h2>
            <p className="panel-sub">{formatPatientDisplayId(activeVisitPatient)}</p>
          </div>
          <button className="ghost" type="button" onClick={() => setActiveVisitPatientId(null)}>Close</button>
        </div>
        {visitCreateStatus && <p className="micro">{visitCreateStatus}</p>}
        <form className="auth" onSubmit={createVisitForPatient}>
          <div className="form-row">
            <label>
              Department
              <select
                value={visitCreateForm.departmentId}
                onChange={(event) =>
                  setVisitCreateForm((prev) => ({
                    ...prev,
                    departmentId: event.target.value,
                    doctorId: '',
                  }))
                }
                required
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={`visit-department-${department.id}`} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Doctor
              <select
                value={visitCreateForm.doctorId}
                onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, doctorId: event.target.value }))}
                required
              >
                <option value="">Select doctor</option>
                {visitDoctors.map((doctor) => (
                  <option key={`visit-doctor-${doctor.id}`} value={doctor.id}>
                    Dr. {doctor.name}{doctor.department_name ? ` (${doctor.department_name})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Visit type
              <select
                value={visitCreateForm.visitType}
                onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, visitType: event.target.value }))}
              >
                {activeVisitTypes.map((visitType) => (
                  <option key={`visit-create-type-${visitType.code}`} value={visitType.code}>
                    {visitType.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Scheduled date & time
              <input
                type="datetime-local"
                value={visitCreateForm.scheduledAt}
                onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                required
              />
            </label>
            <label>
              Follow-up
              <select
                value={visitCreateForm.isFollowUp ? 'yes' : 'no'}
                onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, isFollowUp: event.target.value === 'yes' }))}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
          <label>
            Visit reason
            <input
              type="text"
              value={visitCreateForm.reason}
              onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, reason: event.target.value }))}
              placeholder="Follow-up consultation, review reports, etc."
              required
            />
          </label>
          <div className="action-row">
            <button className="primary" type="submit">Create visit</button>
          </div>
        </form>
      </div>
    </div>
  )
}
