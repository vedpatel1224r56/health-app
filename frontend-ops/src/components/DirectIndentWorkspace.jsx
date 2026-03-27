export function DirectIndentWorkspace({ loadDirectIndents, createDirectIndent, directIndentForm, setDirectIndentForm, directIndentsStatus, directIndents }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Store keeper</p>
            <h2>Direct patient indent</h2>
          </div>
          <button className="secondary" type="button" onClick={loadDirectIndents}>Refresh direct indents</button>
        </div>
        <form className="auth" onSubmit={createDirectIndent}>
          <div className="form-row">
            <label>Patient ID<input value={directIndentForm.patientId} onChange={(e) => setDirectIndentForm((p) => ({ ...p, patientId: e.target.value }))} required /></label>
            <label>Visit no<input value={directIndentForm.appointmentId} onChange={(e) => setDirectIndentForm((p) => ({ ...p, appointmentId: e.target.value }))} /></label>
            <label>Status<select value={directIndentForm.status} onChange={(e) => setDirectIndentForm((p) => ({ ...p, status: e.target.value }))}><option value="requested">requested</option><option value="approved">approved</option><option value="issued">issued</option></select></label>
          </div>
          <div className="form-row">
            <label>Indent summary<input value={directIndentForm.indentSummary} onChange={(e) => setDirectIndentForm((p) => ({ ...p, indentSummary: e.target.value }))} required /></label>
            <label>From store<input value={directIndentForm.fromStore} onChange={(e) => setDirectIndentForm((p) => ({ ...p, fromStore: e.target.value }))} /></label>
            <label>To store<input value={directIndentForm.toStore} onChange={(e) => setDirectIndentForm((p) => ({ ...p, toStore: e.target.value }))} /></label>
            <label>Net amount<input type="number" value={directIndentForm.netAmount} onChange={(e) => setDirectIndentForm((p) => ({ ...p, netAmount: e.target.value }))} /></label>
          </div>
          <div className="action-row"><button className="primary" type="submit">Create direct indent</button></div>
        </form>
        {directIndentsStatus && <p className="micro">{directIndentsStatus}</p>}
        <div className="table-shell">
          <div className="admin-table simple-five-head"><span>Request no</span><span>Patient</span><span>Indent summary</span><span>Status</span><span>Net amount</span></div>
          {directIndents.map((item) => (
            <div key={`direct-indent-${item.id}`} className="admin-table simple-five-row">
              <span>{item.request_no}</span>
              <span>{item.patient_name || '-'} {item.patient_uid ? `(${item.patient_uid})` : ''}</span>
              <span>{item.indent_summary}</span>
              <span>{item.status}</span>
              <span>Rs {item.net_amount || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
