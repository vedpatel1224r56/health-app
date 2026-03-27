export function PharmacyIssueWorkspace({ loadPharmacyIssues, createPharmacyIssue, pharmacyIssueForm, setPharmacyIssueForm, pharmacyIssuesStatus, pharmacyIssues, updatePharmacyIssueStatus }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Pharmacy indent issue</p>
            <h2>Material in / out</h2>
          </div>
          <button className="secondary" type="button" onClick={loadPharmacyIssues}>Refresh issues</button>
        </div>
        <form className="auth" onSubmit={createPharmacyIssue}>
          <div className="form-row">
            <label>Material in/out<select value={pharmacyIssueForm.materialInOut} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, materialInOut: e.target.value }))}><option value="in">in</option><option value="out">out</option></select></label>
            <label>In/out date<input type="datetime-local" value={pharmacyIssueForm.inOutDate} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, inOutDate: e.target.value }))} required /></label>
            <label>Supplier name<input value={pharmacyIssueForm.supplierName} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, supplierName: e.target.value }))} /></label>
            <label>In/out type<input value={pharmacyIssueForm.inOutType} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, inOutType: e.target.value }))} /></label>
          </div>
          <div className="form-row">
            <label>Patient ID<input value={pharmacyIssueForm.patientId} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, patientId: e.target.value }))} /></label>
            <label>Request status<select value={pharmacyIssueForm.status} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, status: e.target.value }))}><option value="requested">requested</option><option value="approved">approved</option><option value="issued">issued</option><option value="cancelled">cancelled</option></select></label>
            <label>From store<input value={pharmacyIssueForm.fromStore} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, fromStore: e.target.value }))} /></label>
            <label>To store<input value={pharmacyIssueForm.toStore} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, toStore: e.target.value }))} /></label>
            <label>Net amount<input type="number" value={pharmacyIssueForm.netAmount} onChange={(e) => setPharmacyIssueForm((p) => ({ ...p, netAmount: e.target.value }))} /></label>
          </div>
          <div className="action-row"><button className="primary" type="submit">Create pharmacy issue</button></div>
        </form>
        {pharmacyIssuesStatus && <p className="micro">{pharmacyIssuesStatus}</p>}
        <div className="table-shell">
          <div className="admin-table pharmacy-issue-head"><span>In/Out date</span><span>Supplier</span><span>Type</span><span>Patient</span><span>Status</span><span>Request no</span><span>Requested by</span><span>Stores</span><span>Net amount</span><span>Action</span></div>
          {pharmacyIssues.map((item) => (
            <div key={`pharmacy-issue-${item.id}`} className="admin-table pharmacy-issue-row">
              <span>{item.in_out_date ? new Date(item.in_out_date).toLocaleString() : '-'}</span>
              <span>{item.supplier_name || '-'}</span>
              <span>{item.in_out_type || item.material_in_out || '-'}</span>
              <span>{item.patient_name || '-'} {item.patient_uid ? `(${item.patient_uid})` : ''}</span>
              <span>{item.status || '-'}</span>
              <span>{item.request_no}</span>
              <span>{item.requested_by || '-'}</span>
              <span>{item.from_store || '-'} → {item.to_store || '-'}</span>
              <span>Rs {item.net_amount || 0}</span>
              <span><button className="ghost" type="button" onClick={() => updatePharmacyIssueStatus(item.id, 'issued', item.net_amount)}>Mark issued</button></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
