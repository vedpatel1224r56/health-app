export function WardWorkspace({ wardStatus, wardListing, loadWardListing, updateWardDraft, saveWardRow }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Nursing Ward</p>
            <h2>Ward listing</h2>
            <p className="panel-sub">Location (bed), patient, visit no, age, admission date, bed status, and doctor in charge.</p>
          </div>
          <button className="secondary" type="button" onClick={loadWardListing}>Refresh ward</button>
        </div>
        {wardStatus && <p className="micro">{wardStatus}</p>}
        <div className="table-shell">
          <div className="admin-table ward-head">
            <span>Location (bed)</span><span>Patient ID</span><span>Patient name</span><span>Visit no</span><span>Age</span><span>Admission date</span><span>Bed status</span><span>Unit doctor in charge</span><span>Action</span>
          </div>
          {wardListing.map((item) => (
            <div key={`ward-row-${item.id}`} className="admin-table ward-row">
              <span className="table-cell"><input value={item.location_bed || ''} onChange={(e) => updateWardDraft(item.id, 'location_bed', e.target.value)} /></span>
              <span className="table-cell">{item.patient_uid || '-'}</span>
              <span className="table-cell">{item.patient_name || '-'}</span>
              <span className="table-cell">{item.visit_no || '-'}</span>
              <span className="table-cell">{item.age || '-'}</span>
              <span className="table-cell"><input type="datetime-local" value={item.admission_date ? new Date(new Date(item.admission_date).getTime() - new Date(item.admission_date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => updateWardDraft(item.id, 'admission_date', e.target.value ? new Date(e.target.value).toISOString() : '')} /></span>
              <span className="table-cell">
                <select value={item.bed_status || 'available'} onChange={(e) => updateWardDraft(item.id, 'bed_status', e.target.value)}>
                  <option value="available">available</option><option value="occupied">occupied</option><option value="reserved">reserved</option><option value="cleaning">cleaning</option>
                </select>
              </span>
              <span className="table-cell"><input value={item.unit_doctor_in_charge || ''} onChange={(e) => updateWardDraft(item.id, 'unit_doctor_in_charge', e.target.value)} /></span>
              <span className="table-cell"><button className="primary" type="button" onClick={() => saveWardRow(item)}>Save</button></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
