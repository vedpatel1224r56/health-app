export function AlertsPanel({ notifications, markAllAndRefresh, loadNotifications }) {
  return (
    <section className="panel">
      <h2>Notifications</h2>
      <p className="panel-sub">Appointment updates, lab/pharmacy updates, and important care alerts.</p>
      <div className="action-row">
        <button type="button" className="secondary" onClick={markAllAndRefresh}>
          Mark all as read
        </button>
        <button type="button" className="ghost" onClick={loadNotifications}>
          Refresh
        </button>
      </div>
      <div className="history-list">
        {notifications.length === 0 ? (
          <p className="micro">No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <div key={`alerts-tab-${item.id}`} className="history-card">
              <p className="history-headline">{item.title} {Number(item.is_read) !== 1 ? "• Unread" : ""}</p>
              <p className="micro">{item.message}</p>
              <p className="history-date">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
