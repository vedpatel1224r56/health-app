import { appointmentStatusLabel } from '../opsConfig'

const formatAppointmentRef = (appointmentId) => String(appointmentId || '').padStart(3, '0')

export function AppointmentsWorkspace({
  appointmentAdminStatus,
  appointmentFilters,
  setAppointmentFilters,
  departments,
  filteredAppointments,
  appointmentDrafts,
  allDoctors,
  openAppointmentModal,
}) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Approvals</p>
            <h2>All appointments</h2>
            <p className="panel-sub">Search, filter, and manage appointments before they move through the OPD queue.</p>
          </div>
        </div>
        <div className="appointment-filter-bar">
          <label>
            Search
            <input
              type="text"
              value={appointmentFilters.search}
              onChange={(event) => setAppointmentFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Patient, doctor, reason, ID"
            />
          </label>
          <label>
            Status
            <select
              value={appointmentFilters.status}
              onChange={(event) => setAppointmentFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="all">All</option>
              <option value="requested">Requested</option>
              <option value="approved">Scheduled</option>
              <option value="checked_in">Checked in</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </select>
          </label>
          <label>
            Department
            <select
              value={appointmentFilters.departmentId}
              onChange={(event) => setAppointmentFilters((prev) => ({ ...prev, departmentId: event.target.value }))}
            >
              <option value="all">All</option>
              {departments.map((department) => (
                <option key={`appointment-filter-${department.id}`} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={appointmentFilters.date}
              onChange={(event) => setAppointmentFilters((prev) => ({ ...prev, date: event.target.value }))}
            />
          </label>
        </div>
        {appointmentAdminStatus && <p className="micro">{appointmentAdminStatus}</p>}
        <div className="table-shell">
          <div className="admin-table admin-table-head">
            <span>Ref</span>
            <span>Patient</span>
            <span>Status</span>
            <span>Department</span>
            <span>Doctor</span>
            <span>Reason</span>
            <span>Time</span>
            <span>Action</span>
          </div>
          {filteredAppointments.map((appointment) => {
            const draft = appointmentDrafts[appointment.id] || {}
            const selectedDepartment =
              departments.find((department) => String(department.id) === String(draft.departmentId)) || null
            const selectedDoctor =
              allDoctors.find((doctor) => String(doctor.id) === String(draft.doctorId)) || null
            const displayStatus = draft.status || appointment.status
            const displayScheduledAt = draft.scheduledAt
              ? new Date(draft.scheduledAt).toLocaleString()
              : new Date(appointment.scheduled_at).toLocaleString()
            const displayReason = draft.reason || appointment.reason
            const displayDepartment =
              selectedDepartment?.name || appointment.department_name || appointment.department
            const displayDoctor = selectedDoctor?.name || appointment.doctor_name || ''
            return (
              <div key={`admin-appt-${appointment.id}`} className="admin-table admin-table-row">
                <span className="table-cell strong">{formatAppointmentRef(appointment.id)}</span>
                <span className="table-cell">
                  {appointment.patient_name || 'Patient'}
                  {appointment.member_name ? ` (${appointment.member_name})` : ''}
                </span>
                <span className="table-cell">
                  <span className={`status-pill ${String(displayStatus).toLowerCase()}`}>{appointmentStatusLabel(displayStatus)}</span>
                </span>
                <span className="table-cell">{displayDepartment || '-'}</span>
                <span className="table-cell">{displayDoctor ? `Dr. ${displayDoctor}` : 'No doctor'}</span>
                <span className="table-cell table-cell-ellipsis" title={displayReason}>{displayReason}</span>
                <span className="table-cell">{displayScheduledAt}</span>
                <span className="table-cell">
                  <button className="primary" type="button" onClick={() => openAppointmentModal(appointment.id)}>
                    Manage
                  </button>
                </span>
              </div>
            )
          })}
          {filteredAppointments.length === 0 && <p className="micro">No appointments match the current filters.</p>}
        </div>
      </div>
    </section>
  )
}
