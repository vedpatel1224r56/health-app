export function ScheduleWorkspace({
  loadDoctorSchedule,
  doctorSchedules,
  updateScheduleRow,
  removeScheduleRow,
  addScheduleRow,
  saveDoctorSchedule,
  doctorScheduleStatus,
  appointments,
  weekdayLabel,
  appointmentStatusLabel,
}) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Clinical Schedule</p>
            <h2>Doctor availability</h2>
          </div>
          <button className="secondary" type="button" onClick={loadDoctorSchedule}>Refresh</button>
        </div>
        <div className="history-list">
          {doctorSchedules.map((slot, index) => (
            <div key={`schedule-${index}`} className="history-card">
              <div className="form-row">
                <label>
                  Day
                  <select value={slot.weekday} onChange={(event) => updateScheduleRow(index, 'weekday', event.target.value)}>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                      <option key={day} value={day}>{weekdayLabel(day)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Start
                  <input type="time" value={slot.startTime} onChange={(event) => updateScheduleRow(index, 'startTime', event.target.value)} />
                </label>
                <label>
                  End
                  <input type="time" value={slot.endTime} onChange={(event) => updateScheduleRow(index, 'endTime', event.target.value)} />
                </label>
                <label>
                  Slot (min)
                  <input type="number" min="5" max="120" value={slot.slotMinutes} onChange={(event) => updateScheduleRow(index, 'slotMinutes', event.target.value)} />
                </label>
              </div>
              <button className="ghost" type="button" onClick={() => removeScheduleRow(index)}>Remove</button>
            </div>
          ))}
        </div>
        <div className="action-row">
          <button className="secondary" type="button" onClick={addScheduleRow}>Add day</button>
          <button className="primary" type="button" onClick={saveDoctorSchedule}>Save schedule</button>
        </div>
        {doctorScheduleStatus && <p className="micro">{doctorScheduleStatus}</p>}
      </div>
      <div className="panel result">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Assigned Consults</p>
            <h2>Doctor appointments</h2>
          </div>
        </div>
        <div className="history-list">
          {appointments.map((appointment) => (
            <div key={`doctor-appt-${appointment.id}`} className="history-card elevated">
              <p className="history-headline">#{appointment.id} • {appointment.patient_name || 'Patient'}</p>
              <p className="micro">{appointment.department_name || appointment.department}</p>
              <p className="micro">{new Date(appointment.scheduled_at).toLocaleString()} • {appointmentStatusLabel(appointment.status)}</p>
              <p className="micro">{appointment.reason}</p>
            </div>
          ))}
          {appointments.length === 0 && <p className="micro">No appointments assigned yet.</p>}
        </div>
      </div>
    </section>
  )
}
