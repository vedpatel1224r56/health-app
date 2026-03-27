export function AppointmentDetailModal({
  appointmentDetail,
  closeAppointmentDetail,
  appointmentRescheduleForm,
  setAppointmentRescheduleForm,
  rescheduleAppointmentFromDetail,
  cancelAppointmentFromDetail,
  appointmentActionStatus,
  appointmentTimeline,
  paymentGatewayConfig,
  payForAppointment,
  paymentLoadingKey,
  consultPaymentStatus,
}) {
  if (!appointmentDetail) return null;

  const allowLocalPaymentBypass = Boolean(import.meta.env.DEV);
  const appointmentStatus = String(appointmentDetail.status || "").toLowerCase();
  const scheduledAtTs = Date.parse(appointmentDetail.scheduled_at || "");
  const hasScheduledTimePassed = !Number.isNaN(scheduledAtTs) && scheduledAtTs < Date.now();
  const canReschedule =
    !hasScheduledTimePassed &&
    !["cancelled", "completed", "no_show"].includes(appointmentStatus);
  const canCancel =
    !hasScheduledTimePassed &&
    !["cancelled", "completed", "no_show"].includes(appointmentStatus);

  return (
    <div className="modal-backdrop" onClick={closeAppointmentDetail}>
      <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Appointment</p>
            <h2>Visit details</h2>
            <p className="panel-sub">#{appointmentDetail.id} • {appointmentDetail.status}</p>
          </div>
          <button className="ghost" type="button" onClick={closeAppointmentDetail}>Close</button>
        </div>
        <div className="history-card">
          <p className="micro">Department: {appointmentDetail.department_name || appointmentDetail.department || "-"}</p>
          <p className="micro">Doctor: {appointmentDetail.doctor_name ? `Dr. ${appointmentDetail.doctor_name}` : "-"}</p>
          <p className="micro">Reason: {appointmentDetail.reason || "-"}</p>
          <p className="micro">Scheduled: {new Date(appointmentDetail.scheduled_at).toLocaleString()}</p>
          <p className="micro">Consultation fee: Rs {Number(appointmentDetail.bill_amount || 0)}</p>
          <p className="micro">Billing: {String(appointmentDetail.bill_status || "unpaid").replace(/_/g, " ")}</p>
          {!allowLocalPaymentBypass && paymentGatewayConfig?.enabled && Number(appointmentDetail.bill_amount || 0) > 0 && !["paid", "waived"].includes(String(appointmentDetail.bill_status || "").toLowerCase()) ? (
            <div className="action-row" style={{ marginTop: 12 }}>
              <button
                className="primary"
                type="button"
                onClick={() => payForAppointment(appointmentDetail)}
                disabled={paymentLoadingKey === `appointment-${appointmentDetail.id}`}
              >
                {paymentLoadingKey === `appointment-${appointmentDetail.id}` ? "Opening payment..." : `Pay Rs ${Number(appointmentDetail.bill_amount || 0)}`}
              </button>
            </div>
          ) : null}
        </div>
        {canReschedule ? (
          <>
            <div className="form-row">
              <label>
                New date/time
                <input
                  type="datetime-local"
                  value={appointmentRescheduleForm.scheduledAt}
                  onChange={(event) => setAppointmentRescheduleForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                />
              </label>
            </div>
            <label className="block">
              Reschedule reason
              <textarea
                rows={2}
                value={appointmentRescheduleForm.reason}
                onChange={(event) => setAppointmentRescheduleForm((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="Why are you changing this appointment?"
              />
            </label>
            <div className="action-row">
              <button className="secondary" type="button" onClick={rescheduleAppointmentFromDetail}>
                Save reschedule
              </button>
              <button className="ghost" type="button" onClick={cancelAppointmentFromDetail} disabled={!canCancel}>
                Cancel appointment
              </button>
            </div>
          </>
        ) : (
          <div className="history-card" style={{ marginTop: 12 }}>
            <p className="micro">
              Reschedule is only available before the scheduled appointment time.
            </p>
          </div>
        )}
        {(appointmentActionStatus || consultPaymentStatus) && <p className="micro">{appointmentActionStatus || consultPaymentStatus}</p>}
        <h3 style={{ marginTop: 8 }}>Status timeline</h3>
        <div className="history-list">
          {appointmentTimeline.length === 0 ? (
            <p className="micro">No timeline events yet.</p>
          ) : (
            appointmentTimeline.map((item) => (
              <div key={`timeline-${item.id}`} className="history-card">
                <p className="history-date">{new Date(item.createdAt).toLocaleString()}</p>
                <p className="history-headline">{item.eventType.replace(/_/g, " ")}</p>
                <p className="micro">{item.fromStatus || "-"} → {item.toStatus || "-"} • {item.actorName}</p>
                {item.note ? <p className="micro">{item.note}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
