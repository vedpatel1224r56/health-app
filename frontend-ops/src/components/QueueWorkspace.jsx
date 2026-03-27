export function QueueWorkspace({
  queueStatus,
  queue,
  updateQueueStatus,
  billingDrafts,
  updateBillingDraft,
  saveBilling,
  openReceipt,
}) {
  const checkedInCount = queue.filter((item) => item.status === 'checked_in').length
  const requestedCount = queue.filter((item) => item.status === 'requested' || item.status === 'approved').length
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Queue Command</p>
            <h2>Today queue actions</h2>
            <p className="panel-sub">Move patients through check-in, completion, and billing without leaving the queue board.</p>
          </div>
        </div>
        {queueStatus && <p className="micro">{queueStatus}</p>}
        <div className="queue-summary-strip">
          <article className="queue-summary-card">
            <span className="mini-label">Total queue</span>
            <strong>{queue.length}</strong>
            <span className="micro">Appointments in today's queue</span>
          </article>
          <article className="queue-summary-card">
            <span className="mini-label">Waiting</span>
            <strong>{requestedCount}</strong>
            <span className="micro">Still not checked in</span>
          </article>
          <article className="queue-summary-card">
            <span className="mini-label">Checked in</span>
            <strong>{checkedInCount}</strong>
            <span className="micro">Ready for clinical action</span>
          </article>
        </div>
        <div className="history-list">
          {queue.map((item) => (
            <div key={item.id} className="history-card queue-card queue-card-polished">
              <div className="queue-card-top">
                <p className="history-headline">#{item.id} • {item.patient_name}{item.member_name ? ` (${item.member_name})` : ''}</p>
                <span className={`status-pill ${item.status}`}>{String(item.status).replace('_', ' ')}</span>
              </div>
              <p className="micro">{item.department_name || 'Department'} • {item.doctor_name ? `Dr. ${item.doctor_name}` : 'No doctor'}</p>
              <p className="micro">{new Date(item.scheduled_at).toLocaleString()}</p>
              <div className="action-row">
                <button className="secondary" type="button" onClick={() => updateQueueStatus(item.id, 'checked_in')}>Check in</button>
                <button className="secondary" type="button" onClick={() => updateQueueStatus(item.id, 'completed')}>Complete</button>
                <button className="secondary" type="button" onClick={() => updateQueueStatus(item.id, 'no_show')}>No show</button>
              </div>
              <div className="form-row">
                <label>
                  Fee
                  <input
                    type="number"
                    min="0"
                    value={billingDrafts[item.id]?.amount ?? ''}
                    onChange={(event) => updateBillingDraft(item.id, 'amount', event.target.value)}
                  />
                </label>
                <label>
                  Billing
                  <select
                    value={billingDrafts[item.id]?.status || 'unpaid'}
                    onChange={(event) => updateBillingDraft(item.id, 'status', event.target.value)}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="waived">Waived</option>
                  </select>
                </label>
                <label>
                  Method
                  <select
                    value={billingDrafts[item.id]?.paymentMethod || ''}
                    onChange={(event) => updateBillingDraft(item.id, 'paymentMethod', event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </label>
              </div>
              <div className="action-row">
                <button className="primary" type="button" onClick={() => saveBilling(item.id)}>Save billing</button>
                <button className="ghost" type="button" onClick={() => openReceipt(item.id)}>View receipt</button>
              </div>
            </div>
          ))}
          {queue.length === 0 && <p className="micro">No appointments queued for today.</p>}
        </div>
      </div>
    </section>
  )
}
