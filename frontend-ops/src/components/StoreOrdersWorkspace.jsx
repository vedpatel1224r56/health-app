export function StoreOrdersWorkspace({ loadStoreOrders, createStoreOrder, storeOrderForm, setStoreOrderForm, storeOrdersStatus, storeOrders }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Inventory order store</p>
            <h2>Store orders</h2>
          </div>
          <button className="secondary" type="button" onClick={loadStoreOrders}>Refresh orders</button>
        </div>
        <form className="auth" onSubmit={createStoreOrder}>
          <div className="form-row">
            <label>Patient ID<input value={storeOrderForm.patientId} onChange={(e) => setStoreOrderForm((p) => ({ ...p, patientId: e.target.value }))} /></label>
            <label>Visit no<input value={storeOrderForm.appointmentId} onChange={(e) => setStoreOrderForm((p) => ({ ...p, appointmentId: e.target.value }))} /></label>
            <label>Status<select value={storeOrderForm.status} onChange={(e) => setStoreOrderForm((p) => ({ ...p, status: e.target.value }))}><option value="requested">requested</option><option value="approved">approved</option><option value="issued">issued</option></select></label>
          </div>
          <div className="form-row">
            <label>Item summary<input value={storeOrderForm.itemSummary} onChange={(e) => setStoreOrderForm((p) => ({ ...p, itemSummary: e.target.value }))} required /></label>
            <label>From store<input value={storeOrderForm.fromStore} onChange={(e) => setStoreOrderForm((p) => ({ ...p, fromStore: e.target.value }))} /></label>
            <label>To store<input value={storeOrderForm.toStore} onChange={(e) => setStoreOrderForm((p) => ({ ...p, toStore: e.target.value }))} /></label>
            <label>Net amount<input type="number" value={storeOrderForm.netAmount} onChange={(e) => setStoreOrderForm((p) => ({ ...p, netAmount: e.target.value }))} /></label>
          </div>
          <div className="action-row"><button className="primary" type="submit">Create store order</button></div>
        </form>
        {storeOrdersStatus && <p className="micro">{storeOrdersStatus}</p>}
        <div className="table-shell">
          <div className="admin-table simple-five-head"><span>Request no</span><span>Patient</span><span>Item summary</span><span>Status</span><span>Net amount</span></div>
          {storeOrders.map((item) => (
            <div key={`store-order-${item.id}`} className="admin-table simple-five-row">
              <span>{item.request_no}</span>
              <span>{item.patient_name || '-'} {item.patient_uid ? `(${item.patient_uid})` : ''}</span>
              <span>{item.item_summary}</span>
              <span>{item.status}</span>
              <span>Rs {item.net_amount || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
