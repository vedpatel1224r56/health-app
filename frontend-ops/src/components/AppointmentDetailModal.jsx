import { appointmentStatusLabel, getAllowedAppointmentStatuses, normalizeAppointmentStatus } from '../opsConfig'

export function AppointmentDetailModal({
  activeAppointment,
  setActiveAppointmentId,
  appointmentAdminStatus,
  appointmentDrafts,
  updateAppointmentDraft,
  departments,
  allDoctors,
  saveAppointmentAdmin,
  loadAppointmentTimeline,
  appointmentTimelineStatus,
  appointmentTimelines,
}) {
  return (
    <div className="modal-backdrop" onClick={() => setActiveAppointmentId(null)}>
      <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Appointment detail</p>
            <h2>#{activeAppointment.id} • {activeAppointment.patient_name || 'Patient'}</h2>
            <p className="panel-sub">
              {activeAppointment.patient_email || 'No email'}
              {activeAppointment.member_name ? ` • ${activeAppointment.member_name}` : ''}
            </p>
          </div>
          <button className="ghost" type="button" onClick={() => setActiveAppointmentId(null)}>Close</button>
        </div>

        {appointmentAdminStatus && <p className="micro">{appointmentAdminStatus}</p>}

        <div className="form-row">
          <label>
            Department
            <select
              value={appointmentDrafts[activeAppointment.id]?.departmentId || ''}
              onChange={(event) => updateAppointmentDraft(activeAppointment.id, 'departmentId', event.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={`modal-dep-${activeAppointment.id}-${department.id}`} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Doctor
            <select
              value={appointmentDrafts[activeAppointment.id]?.doctorId || ''}
              onChange={(event) => updateAppointmentDraft(activeAppointment.id, 'doctorId', event.target.value)}
            >
              <option value="">Select doctor</option>
              {allDoctors
                .filter((doctor) =>
                  !appointmentDrafts[activeAppointment.id]?.departmentId ||
                  String(doctor.department_id) === String(appointmentDrafts[activeAppointment.id]?.departmentId),
                )
                .map((doctor) => (
                  <option key={`modal-doc-${activeAppointment.id}-${doctor.id}`} value={doctor.id}>
                    Dr. {doctor.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={normalizeAppointmentStatus(appointmentDrafts[activeAppointment.id]?.status || activeAppointment.status)}
              onChange={(event) => updateAppointmentDraft(activeAppointment.id, 'status', event.target.value)}
            >
              {getAllowedAppointmentStatuses(appointmentDrafts[activeAppointment.id]?.status || activeAppointment.status).map((status) => (
                <option key={`appointment-status-${status}`} value={status}>
                  {appointmentStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Reschedule
            <input
              type="datetime-local"
              value={appointmentDrafts[activeAppointment.id]?.scheduledAt || ''}
              onChange={(event) => updateAppointmentDraft(activeAppointment.id, 'scheduledAt', event.target.value)}
            />
          </label>
          <label>
            Reason
            <input
              type="text"
              value={appointmentDrafts[activeAppointment.id]?.reason || ''}
              onChange={(event) => updateAppointmentDraft(activeAppointment.id, 'reason', event.target.value)}
            />
          </label>
        </div>

        <div className="action-row">
          <button className="primary" type="button" onClick={() => saveAppointmentAdmin(activeAppointment.id)}>
            Save changes
          </button>
          <button className="secondary" type="button" onClick={() => loadAppointmentTimeline(activeAppointment.id)}>
            Refresh timeline
          </button>
        </div>

        {appointmentTimelineStatus[activeAppointment.id] ? (
          <p className="micro">{appointmentTimelineStatus[activeAppointment.id]}</p>
        ) : null}

        <div className="history-list">
          {(appointmentTimelines[activeAppointment.id] || []).map((event) => (
            <div key={`timeline-${activeAppointment.id}-${event.id}`} className="history-card">
              <p className="history-headline">
                {event.event_type.replace('_', ' ')}
                {event.to_status ? ` • ${String(event.to_status).replace('_', ' ')}` : ''}
              </p>
              <p className="micro">
                {event.actor_name ? `${event.actor_name} (${event.actor_role || 'user'})` : 'System'} •{' '}
                {new Date(event.created_at).toLocaleString()}
              </p>
              {event.note ? <p className="micro">{event.note}</p> : null}
            </div>
          ))}
          {(appointmentTimelines[activeAppointment.id] || []).length === 0 ? (
            <p className="micro">No timeline events loaded yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
