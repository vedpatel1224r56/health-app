export function PartnerRequestsWorkspace({
  partnerRequestsStatus,
  partnerRequestFilter,
  setPartnerRequestFilter,
  loadPartnerRequests,
  partnerRequests,
  updatePartnerRequestStatus,
  openPartnerRequestDrawer,
}) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Partner routing</p>
            <h2>Marketplace partner requests</h2>
            <p className="panel-sub">Review lab and pharmacy requests, inspect timelines, and update status with full context.</p>
          </div>
          <button className="secondary" type="button" onClick={() => loadPartnerRequests()}>
            Refresh requests
          </button>
        </div>
        {partnerRequestsStatus && <p className="micro">{partnerRequestsStatus}</p>}
        <div className="form-row">
          <label>
            Request type
            <select
              value={partnerRequestFilter.requestType}
              onChange={(event) => setPartnerRequestFilter((prev) => ({ ...prev, requestType: event.target.value }))}
            >
              <option value="all">All</option>
              <option value="lab">Lab</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={partnerRequestFilter.status}
              onChange={(event) => setPartnerRequestFilter((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="all">All</option>
              <option value="requested">Requested</option>
              <option value="accepted">Accepted</option>
              <option value="sample_collected">Sample collected</option>
              <option value="processing">Processing</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="ready_for_pickup">Ready for pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          <div className="action-row">
            <button className="primary" type="button" onClick={() => loadPartnerRequests()}>
              Apply filters
            </button>
          </div>
        </div>
        <div className="table-shell">
          <div className="admin-table admin-table-head partner-request-head">
            <span>Patient</span>
            <span>Type</span>
            <span>Service</span>
            <span>Mode</span>
            <span>Status</span>
            <span>Created</span>
            <span>Action</span>
          </div>
          {partnerRequests.map((item) => (
            <div key={`partner-request-${item.id}`} className="admin-table admin-table-row partner-request-row">
              <span className="table-cell">
                <strong>{item.patient_name}</strong>
                <span className="micro">{item.patient_uid || item.patient_email || '-'}</span>
              </span>
              <span className="table-cell">{item.request_type}</span>
              <span className="table-cell">
                <strong>{item.service_name}</strong>
                <span className="micro">Partner #{item.partner_id}</span>
              </span>
              <span className="table-cell">{item.fulfillment_mode}</span>
              <span className="table-cell">
                <span className={`status-pill ${String(item.status || '').toLowerCase()}`}>{String(item.status || '').replaceAll('_', ' ')}</span>
              </span>
              <span className="table-cell">{new Date(item.created_at).toLocaleString()}</span>
              <span className="table-cell action-cluster">
                <button className="secondary" type="button" onClick={() => openPartnerRequestDrawer(item.id)}>
                  Timeline
                </button>
                {item.status === 'requested' && (
                  <button className="secondary" type="button" onClick={() => updatePartnerRequestStatus(item.id, 'accepted', 'Accepted by operations.')}>Accept</button>
                )}
                {['accepted', 'sample_collected', 'processing', 'out_for_delivery', 'ready_for_pickup'].includes(item.status) && (
                  <button className="secondary" type="button" onClick={() => updatePartnerRequestStatus(item.id, 'completed', 'Completed by operations.')}>Complete</button>
                )}
                {['requested', 'accepted', 'sample_collected', 'processing'].includes(item.status) && (
                  <button className="ghost" type="button" onClick={() => updatePartnerRequestStatus(item.id, 'unavailable', 'Marked unavailable by operations.')}>Unavailable</button>
                )}
                {['requested', 'accepted', 'sample_collected', 'processing'].includes(item.status) && (
                  <button className="ghost" type="button" onClick={() => updatePartnerRequestStatus(item.id, 'rejected', 'Rejected by operations.')}>Reject</button>
                )}
              </span>
            </div>
          ))}
          {partnerRequests.length === 0 && <p className="micro">No partner requests found for the selected filters.</p>}
        </div>
      </div>
    </section>
  )
}
