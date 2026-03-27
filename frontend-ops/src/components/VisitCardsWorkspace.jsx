export function VisitCardsWorkspace({ visitCards, visitCardsStatus, loadVisitCards }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reception / Billing</p>
            <h2>Visit cards</h2>
            <p className="panel-sub">Patient ID, visit details, doctor, status, diagnosis, and discharge tracking.</p>
          </div>
          <button className="secondary" type="button" onClick={() => loadVisitCards()}>Refresh visit cards</button>
        </div>
        {visitCardsStatus && <p className="micro">{visitCardsStatus}</p>}
        <div className="table-shell">
          <div className="admin-table visit-card-head">
            <span>Patient ID</span><span>Patient name</span><span>Age/Gender</span><span>Unit</span><span>Visit no</span><span>Visit date</span><span>Visit doctor</span><span>Visit type</span><span>Status</span><span>Doctor in charge</span><span>Final diagnosis</span>
          </div>
          {visitCards.map((item) => (
            <div key={`visit-card-${item.appointment_id}`} className="admin-table visit-card-row">
              <span className="table-cell strong">{item.patient_uid || `PID${item.patient_id}`}</span>
              <span className="table-cell">{item.patient_name || '-'}</span>
              <span className="table-cell">{item.age || '-'} / {item.gender || '-'}</span>
              <span className="table-cell">{item.unit_name || '-'}</span>
              <span className="table-cell">{item.visit_no || '-'}</span>
              <span className="table-cell">{item.visit_date ? new Date(item.visit_date).toLocaleString() : '-'}</span>
              <span className="table-cell">{item.visit_doctor || '-'}</span>
              <span className="table-cell">{item.visit_type || '-'}</span>
              <span className="table-cell">{item.visit_status || '-'}</span>
              <span className="table-cell">{item.doctor_in_charge || '-'}</span>
              <span className="table-cell">{item.final_diagnosis || '-'}</span>
            </div>
          ))}
          {visitCards.length === 0 && <p className="micro">No visit cards found.</p>}
        </div>
      </div>
    </section>
  )
}
