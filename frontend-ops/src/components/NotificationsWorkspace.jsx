export function NotificationsWorkspace({
  notifications,
  notificationsStatus,
  unreadNotificationsCount,
  loadNotifications,
  markNotificationsRead,
}) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Notifications</p>
            <h2>Appointment updates and reminders</h2>
            <p className="panel-sub">
              Keep track of booking updates, remote consult changes, and upcoming appointment reminders.
            </p>
          </div>
          <div className="action-row">
            <button type="button" className="ghost" onClick={loadNotifications}>
              Refresh
            </button>
            <button type="button" className="secondary" onClick={markNotificationsRead}>
              Mark all read
            </button>
          </div>
        </div>

        <div className="doctor-worklist-summary" style={{ marginBottom: 16 }}>
          <span className="doctor-worklist-chip">
            <span className="doctor-worklist-chip-label">Unread</span>
            <strong className="doctor-worklist-chip-value">{unreadNotificationsCount}</strong>
          </span>
          <span className="doctor-worklist-chip">
            <span className="doctor-worklist-chip-label">Loaded</span>
            <strong className="doctor-worklist-chip-value">{notifications.length}</strong>
          </span>
          <span className="doctor-worklist-chip">
            <span className="doctor-worklist-chip-label">Channel</span>
            <strong className="doctor-worklist-chip-value">In-app</strong>
          </span>
        </div>

        {notificationsStatus ? <p className="micro">{notificationsStatus}</p> : null}

        <div className="history-list">
          {notifications.length === 0 ? (
            <p className="micro">No notifications yet.</p>
          ) : (
            notifications.map((item) => (
              <div key={`ops-notification-${item.id}`} className="history-card">
                <p className="history-headline">
                  {item.title}
                  {!item.is_read ? ' • New' : ''}
                </p>
                <p className="micro">{item.message}</p>
                <p className="micro">{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
