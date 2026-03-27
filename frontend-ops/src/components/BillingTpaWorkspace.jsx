export function BillingTpaWorkspace({ loadVisitCards, visitCards }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Billing and TPA</p>
            <h2>Patient visit card ledger</h2>
            <p className="panel-sub">Visit card mirror for billing/TPA review.</p>
          </div>
          <button className="secondary" type="button" onClick={() => loadVisitCards()}>Refresh</button>
        </div>
        <div className="table-shell">
          <div className="admin-table simple-six-head"><span>Patient ID</span><span>Patient name</span><span>Visit no</span><span>Visit type</span><span>Status</span><span>Doctor in charge</span></div>
          {visitCards.map((item) => (
            <div key={`billing-visit-${item.appointment_id}`} className="admin-table simple-six-row">
              <span>{item.patient_uid || `PID${item.patient_id}`}</span>
              <span>{item.patient_name || '-'}</span>
              <span>{item.visit_no || '-'}</span>
              <span>{item.visit_type || '-'}</span>
              <span>{item.visit_status || '-'}</span>
              <span>{item.doctor_in_charge || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
