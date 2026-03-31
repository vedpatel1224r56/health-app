function getQuickStarts(departmentKey = 'general') {
  if (departmentKey === 'pediatrics') {
    return ['fever since 2 days', 'loose stools', 'poor weight gain', 'wheeze', 'vaccine due']
  }
  if (departmentKey === 'surgery') {
    return ['post-op dressing stable', 'pre-op review', 'wound discharge', 'hernia swelling', 'acute abdomen']
  }
  return ['fever since 3 days', 'BP follow-up', 'sugar follow-up', 'burning urine', 'low back pain', 'acidity']
}

export function DoctorAssistPanel({
  title = 'Clinical templates',
  subtitle = '',
  departmentKey = 'general',
  noteAssistQuery,
  setNoteAssistQuery,
  noteAssistSuggestions = [],
  noteAssistStatus = '',
  noteAssistLoading = false,
  loadNoteAssistSuggestions,
  applyNoteAssistSuggestion,
  applyAssistComplaintTemplate,
  applyAssistDiagnosisSuggestion,
  stageAssistOrderSuggestion,
  applyAssistPrescriptionTemplate,
  dismissNoteAssistSuggestion,
}) {
  const quickStarts = getQuickStarts(departmentKey)

  return (
    <div className="doctor-note-assist-panel">
      <div className="doctor-note-assist-head">
        <div>
          <p className="micro strong doctor-note-assist-kicker">{title}</p>
          <p className="micro doctor-note-assist-subtitle">{subtitle}</p>
        </div>
        <span className="doctor-note-assist-badge">{quickStarts.length} quick starts</span>
      </div>

      <div className="doctor-assist-quickstart-block">
        <div className="doctor-assist-quickstart-head">
          <p className="micro strong">Common clinic prompts</p>
          <p className="micro">Tap one to load a doctor-style draft quickly.</p>
        </div>
        <div className="doctor-assist-quickstarts">
        {quickStarts.map((item) => (
          <button
            key={item}
            type="button"
            className="doctor-assist-quickstart"
            onClick={() => {
              setNoteAssistQuery(item)
              loadNoteAssistSuggestions(item)
            }}
          >
            {item}
          </button>
        ))}
        </div>
      </div>

      <div className="doctor-note-assist-search-card">
        <div className="doctor-note-assist-search">
          <input
            type="text"
            value={noteAssistQuery}
            onChange={(event) => setNoteAssistQuery(event.target.value)}
            placeholder="Type complaint, shorthand, or OPD follow-up..."
          />
          <button
            className="ghost"
            type="button"
            onClick={() => loadNoteAssistSuggestions(noteAssistQuery)}
            disabled={noteAssistLoading || String(noteAssistQuery || '').trim().length < 2}
          >
            {noteAssistLoading ? 'Loading…' : 'Get suggestions'}
          </button>
        </div>
        <p className="micro doctor-note-assist-search-hint">Useful for fever follow-up, OPD shorthand, chronic review visits, and common medicine drafts.</p>
      </div>

      {noteAssistStatus ? <p className="micro doctor-note-assist-status">{noteAssistStatus}</p> : null}

      {noteAssistSuggestions.length ? (
        <div className="doctor-note-assist-list">
          {noteAssistSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="doctor-note-assist-card">
              <div className="doctor-note-assist-meta">
                <div>
                  <p className="micro strong">{suggestion.label}</p>
                  {suggestion.reason ? <p className="micro">{suggestion.reason}</p> : null}
                </div>
                <span className="doctor-note-assist-score">{Math.round((suggestion.score || 0) * 100)}% fit</span>
              </div>

              <p className="doctor-note-assist-preview">{suggestion.noteText}</p>

              <div className="action-row doctor-note-assist-actions">
                <button type="button" className="ghost" onClick={() => applyNoteAssistSuggestion(suggestion)}>
                  Load note
                </button>
                <button type="button" className="ghost" onClick={() => applyNoteAssistSuggestion(suggestion, { applySummary: true })}>
                  Load note + summary
                </button>
                <button type="button" className="secondary" onClick={() => dismissNoteAssistSuggestion(suggestion.id)}>
                  Dismiss
                </button>
              </div>

              {suggestion.complaintTemplate ? (
                <div className="doctor-assist-section">
                  <div className="doctor-assist-section-head">
                    <div>
                      <p className="micro strong">Complaint template</p>
                      <p className="micro">{suggestion.complaintTemplate.title}</p>
                    </div>
                    <button type="button" className="ghost" onClick={() => applyAssistComplaintTemplate(suggestion)}>
                      Load complaint
                    </button>
                  </div>
                  <div className="doctor-assist-template-card">
                    <p className="doctor-assist-template-complaint">{suggestion.complaintTemplate.complaint}</p>
                    {Array.isArray(suggestion.complaintTemplate.prompts) && suggestion.complaintTemplate.prompts.length ? (
                      <ul className="doctor-assist-template-list">
                        {suggestion.complaintTemplate.prompts.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {Array.isArray(suggestion.diagnoses) && suggestion.diagnoses.length ? (
                <div className="doctor-assist-section">
                  <div className="doctor-assist-section-head">
                    <div>
                      <p className="micro strong">Likely working diagnoses</p>
                    </div>
                  </div>
                  <div className="doctor-assist-pills">
                    {suggestion.diagnoses.map((diagnosis) => (
                      <div key={`${suggestion.id}-${diagnosis.label}`} className="doctor-assist-pill-card">
                        <div className="doctor-note-assist-meta">
                          <p className="micro strong">{diagnosis.label}</p>
                          <span className="doctor-note-assist-score">{Math.round((diagnosis.confidence || 0) * 100)}% likely</span>
                        </div>
                        {diagnosis.rationale ? <p className="micro">{diagnosis.rationale}</p> : null}
                        <button type="button" className="ghost" onClick={() => applyAssistDiagnosisSuggestion(diagnosis)}>
                          Add diagnosis
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(suggestion.orders) && suggestion.orders.length ? (
                <div className="doctor-assist-section">
                  <div className="doctor-assist-section-head">
                    <div>
                      <p className="micro strong">Suggested orders</p>
                    </div>
                  </div>
                  <div className="doctor-assist-pills">
                    {suggestion.orders.map((order) => (
                      <div key={`${suggestion.id}-${order.itemName}`} className="doctor-assist-pill-card">
                        <p className="micro strong">{order.itemName}</p>
                        <p className="micro">{order.destination || order.orderType || 'Suggested order'}</p>
                        {order.why ? <p className="micro">{order.why}</p> : null}
                        <button type="button" className="ghost" onClick={() => stageAssistOrderSuggestion(order)}>
                          Add to orders
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(suggestion.prescriptions) && suggestion.prescriptions.length ? (
                <div className="doctor-assist-section">
                  <div className="doctor-assist-section-head">
                    <div>
                      <p className="micro strong">Prescription templates</p>
                    </div>
                  </div>
                  <div className="doctor-assist-pills">
                    {suggestion.prescriptions.map((prescriptionTemplate) => (
                      <div key={`${suggestion.id}-${prescriptionTemplate.label}`} className="doctor-assist-pill-card">
                        <p className="micro strong">{prescriptionTemplate.label}</p>
                        {prescriptionTemplate.instructions ? <p className="micro">{prescriptionTemplate.instructions}</p> : null}
                        <button type="button" className="ghost" onClick={() => applyAssistPrescriptionTemplate(prescriptionTemplate)}>
                          Load Rx
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(suggestion.redFlags) && suggestion.redFlags.length ? (
                <div className="doctor-assist-section">
                  <div className="doctor-assist-section-head">
                    <div>
                      <p className="micro strong">Red flags to ask / document</p>
                    </div>
                  </div>
                  <div className="doctor-assist-redflags">
                    {suggestion.redFlags.map((item) => (
                      <span key={`${suggestion.id}-${item}`} className="doctor-assist-redflag-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
