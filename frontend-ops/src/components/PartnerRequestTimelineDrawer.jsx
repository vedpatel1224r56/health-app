export function PartnerRequestTimelineDrawer({ activePartnerRequest, closePartnerRequestDrawer, partnerRequestTimeline, partnerRequestTimelineStatus }) {
  if (!activePartnerRequest) return null

  return (
    <div className="modal-backdrop" onClick={closePartnerRequestDrawer}>
      <div className="modal appointment-modal partner-request-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Partner request</p>
            <h2>{activePartnerRequest.service_name}</h2>
            <p className="panel-sub">{activePartnerRequest.request_type} • {activePartnerRequest.fulfillment_mode} • #{activePartnerRequest.id}</p>
          </div>
          <button className="ghost" type="button" onClick={closePartnerRequestDrawer}>Close</button>
        </div>
        <div className="history-list">
          {partnerRequestTimelineStatus ? <p className="micro">{partnerRequestTimelineStatus}</p> : null}
          {(partnerRequestTimeline || []).map((event) => (
            <div key={`partner-timeline-${event.id}`} className="history-card">
              <p className="history-headline">{String(event.eventType || '').replaceAll('_', ' ') || 'Event'}{event.toStatus ? ` • ${String(event.toStatus).replaceAll('_', ' ')}` : ''}</p>
              <p className="micro">{event.actorName ? `${event.actorName} (${event.actorRole || 'user'})` : 'System'} • {new Date(event.createdAt).toLocaleString()}</p>
              {event.note ? <p className="micro">{event.note}</p> : null}
              {Array.isArray(event.metadata?.fallbackOptions) && event.metadata.fallbackOptions.length > 0 ? (
                <div className="fallback-chip-list">
                  {event.metadata.fallbackOptions.map((option, index) => (
                    <span key={`fallback-${event.id}-${index}`} className="pill">{option.partner_name || option.partnerName || `Fallback ${index + 1}`}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {(partnerRequestTimeline || []).length === 0 && !partnerRequestTimelineStatus ? <p className="micro">No timeline events loaded yet.</p> : null}
        </div>
      </div>
    </div>
  )
}
