import { useEffect, useMemo, useState } from 'react'
import { PEDIATRIC_VACCINE_CATALOG } from './DoctorConsoleWorkspace'
import { DoctorAssistPanel } from './DoctorAssistPanel'

function formatTeleStatus(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'in_progress') return 'In progress'
  if (!normalized) return '-'
  return normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function resolveTeleconsultJoinUrl(consult) {
  const saved = String(consult?.meetingUrl || '').trim()
  if (saved) return saved
  return ''
}

function formatSnapshotStatus(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'scheduled') return 'Scheduled'
  if (normalized === 'in_progress') return 'In progress'
  if (!normalized) return '-'
  return normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDoctorName(name) {
  const cleaned = String(name || '').trim().replace(/^dr\.?\s*/i, '')
  return cleaned ? `Dr. ${cleaned}` : 'No doctor'
}

function normalizeSearchValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function toInitials(value) {
  return normalizeSearchValue(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

function hasMeaningfulDepartmentValue(value) {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  return String(value).trim().length > 0
}

export function RemoteConsultWorkspace({
  userRole,
  remoteConsultsStatus,
  remoteConsultsLoading,
  remoteConsults,
  activeRemoteConsult,
  activeRemoteConsultId,
  setActiveRemoteConsultId,
  remoteConsultDraft,
  setRemoteConsultDraft,
  saveRemoteConsultStatus,
  remoteConsultMessages,
  remoteConsultMessageText,
  setRemoteConsultMessageText,
  sendRemoteConsultMessage,
  remoteConsultMessageStatus,
  activeRemoteConsultHistory,
  remoteConsultConsentSummary,
  acceptRemoteConsultConsent,
  activeEncounterDetail,
  encounterForm,
  setEncounterForm,
  saveEncounterSummary,
  noteDraft,
  setNoteDraft,
  signatureDraft,
  setSignatureDraft,
  submitEncounterNote,
  prescriptionDraft,
  setPrescriptionDraft,
  addPrescriptionItem,
  removePrescriptionItem,
  updatePrescriptionItem,
  submitPrescription,
  orderDraft,
  setOrderDraft,
  submitEncounterOrder,
  doctorConsoleStatus,
  activeDoctorConsoleKind,
  departmentConsoleForm = {},
  setDepartmentConsoleForm,
  saveDepartmentConsoleForm,
  noteAssistQuery,
  setNoteAssistQuery,
  noteAssistSuggestions,
  noteAssistStatus,
  noteAssistLoading,
  dismissedNoteAssistIds,
  loadNoteAssistSuggestions,
  applyNoteAssistSuggestion,
  applyAssistComplaintTemplate,
  applyAssistDiagnosisSuggestion,
  stageAssistOrderSuggestion,
  applyAssistPrescriptionTemplate,
  dismissNoteAssistSuggestion,
  noteRefineLoading,
  noteRefineStatus,
  refineDoctorNoteDraft,
  recordPediatricImmunization,
}) {
  const [activeTab, setActiveTab] = useState('chat')
  const [showPediatricTracker, setShowPediatricTracker] = useState(false)
  const [manualVaccineDraft, setManualVaccineDraft] = useState({
    code: '',
    vaccineName: '',
    doseLabel: '',
    administeredDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const isDoctorView = userRole === 'doctor'
  const activeMode = String(activeRemoteConsult?.mode || '').toLowerCase()
  const isChatMode = activeMode === 'chat'
  const isPediatricConsole = activeDoctorConsoleKind === 'pediatrics'
  const joinUrl = resolveTeleconsultJoinUrl({
    ...activeRemoteConsult,
    meetingUrl: remoteConsultDraft.meetingUrl,
  })
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const remoteWorklistSummary = {
    waiting: remoteConsults.filter((consult) => String(consult.status || '').toLowerCase() === 'requested').length,
    today: remoteConsults.filter((consult) => {
      const slot = String(consult.preferredSlot || '').slice(0, 10)
      return slot === todayKey && ['scheduled', 'in_progress'].includes(String(consult.status || '').toLowerCase())
    }).length,
    future: remoteConsults.filter((consult) => {
      const slot = String(consult.preferredSlot || '').slice(0, 10)
      return slot > todayKey && ['requested', 'scheduled'].includes(String(consult.status || '').toLowerCase())
    }).length,
  }
  const patient = activeRemoteConsultHistory?.patient || null
  const history = Array.isArray(activeRemoteConsultHistory?.history) ? activeRemoteConsultHistory.history : []
  const encounterId = activeEncounterDetail?.encounter?.teleconsult_id === activeRemoteConsultId ? activeEncounterDetail?.encounter?.id : null
  const remoteNotesCount = Array.isArray(activeEncounterDetail?.notes) && encounterId ? activeEncounterDetail.notes.length : 0
  const remotePrescriptionsCount = Array.isArray(activeEncounterDetail?.prescriptions) && encounterId ? activeEncounterDetail.prescriptions.length : 0
  const remoteOrdersCount = Array.isArray(activeEncounterDetail?.orders) && encounterId ? activeEncounterDetail.orders.length : 0
  const remoteImmunizations = Array.isArray(activeEncounterDetail?.immunizations) ? activeEncounterDetail.immunizations : []
  const doctorConsentAccepted = Boolean(remoteConsultConsentSummary?.doctorAccepted)
  const visibleNoteAssistSuggestions = (noteAssistSuggestions || []).filter(
    (item) => !dismissedNoteAssistIds?.includes(item.id),
  )
  const selectedPediatricSchedule = String(departmentConsoleForm.immunizationSchedule || '').trim().toUpperCase()
  const pediatricVaccineSuggestions = useMemo(() => {
    const combined = []
    const seen = new Set()
    const appendSuggestion = (item, source) => {
      const vaccineName = String(item.vaccineName || item.vaccine_name || '').trim()
      const doseLabel = String(item.doseLabel || item.dose_label || '').trim()
      const code = String(item.code || item.vaccineCode || item.vaccine_code || '').trim()
      if (!vaccineName || !doseLabel) return
      if (
        selectedPediatricSchedule &&
        selectedPediatricSchedule !== 'BOTH' &&
        String(item.schedule || '').trim() &&
        String(item.schedule).trim().toUpperCase() !== selectedPediatricSchedule &&
        String(item.schedule).trim().toUpperCase() !== 'BOTH'
      ) {
        return
      }
      const key = `${code || vaccineName.toLowerCase()}::${doseLabel.toLowerCase()}`
      if (seen.has(key)) return
      seen.add(key)
      combined.push({
        code: code || `${vaccineName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${doseLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        vaccineName,
        doseLabel,
        schedule: item.schedule || '',
        source,
      })
    }
    PEDIATRIC_VACCINE_CATALOG.forEach((item) => appendSuggestion(item, item.schedule || 'catalog'))
    remoteImmunizations.forEach((item) => appendSuggestion(item, 'recorded'))
    const query = normalizeSearchValue(manualVaccineDraft.vaccineName)
    const queryInitials = toInitials(manualVaccineDraft.vaccineName)
    if (!query && !queryInitials) {
      return combined.slice(0, 16)
    }
    return combined.filter((item) => {
      const haystacks = [
        normalizeSearchValue(item.vaccineName),
        normalizeSearchValue(item.doseLabel),
        normalizeSearchValue(item.schedule),
        toInitials(item.vaccineName),
      ]
      return haystacks.some((value) => value.includes(query) || (queryInitials && value.includes(queryInitials)))
    }).slice(0, 12)
  }, [manualVaccineDraft.vaccineName, remoteImmunizations, selectedPediatricSchedule])
  const departmentFormHasContent = Object.values(departmentConsoleForm || {}).some(hasMeaningfulDepartmentValue)
  const remoteTabConfig = [
    { key: 'chat', label: 'Chat', count: remoteConsultMessages.length || 0 },
    { key: 'summary', label: 'Summary', count: encounterId ? 1 : 0 },
    ...(isPediatricConsole ? [{ key: 'pathway', label: 'Pediatric pathway', count: departmentFormHasContent ? 1 : 0 }] : []),
    ...(isPediatricConsole ? [{ key: 'vaccination', label: 'Vaccination', count: remoteImmunizations.length || 0 }] : []),
    { key: 'notes', label: 'Notes', count: remoteNotesCount || (noteDraft ? 1 : 0) },
    { key: 'prescription', label: 'Prescription', count: remotePrescriptionsCount || (prescriptionDraft?.items || []).filter((item) => Object.values(item || {}).some(Boolean)).length },
    { key: 'orders', label: 'Orders', count: remoteOrdersCount || 0 },
  ]
  const consultOptions = remoteConsults.map((consult) => {
    const when = consult.preferredSlot ? new Date(consult.preferredSlot).toLocaleString() : '-'
    return {
      id: consult.id,
      label: `#${consult.id} • ${consult.patientName || 'Patient'} • ${consult.departmentName || '-'} • ${when}`,
    }
  })

  useEffect(() => {
    if (!isPediatricConsole && ['pathway', 'vaccination'].includes(activeTab)) {
      setActiveTab('chat')
    }
  }, [activeTab, isPediatricConsole])

  useEffect(() => {
    setShowPediatricTracker(false)
    setManualVaccineDraft({
      code: '',
      vaccineName: '',
      doseLabel: '',
      administeredDate: new Date().toISOString().slice(0, 10),
      notes: '',
    })
  }, [activeRemoteConsultId])

  const applyManualVaccineSuggestion = (suggestion) => {
    if (!suggestion) return
    setManualVaccineDraft((prev) => ({
      ...prev,
      code: suggestion.code || prev.code,
      vaccineName: suggestion.vaccineName || prev.vaccineName,
      doseLabel: suggestion.doseLabel || prev.doseLabel,
    }))
  }

  const saveManualPediatricImmunization = () => {
    if (!manualVaccineDraft.vaccineName || !manualVaccineDraft.doseLabel || !recordPediatricImmunization) return
    recordPediatricImmunization({
      code: manualVaccineDraft.code || manualVaccineDraft.vaccineName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      vaccineName: manualVaccineDraft.vaccineName,
      doseLabel: manualVaccineDraft.doseLabel,
      administeredDate: manualVaccineDraft.administeredDate,
      notes: manualVaccineDraft.notes,
      source: 'console_manual',
    })
    setManualVaccineDraft({
      code: '',
      vaccineName: '',
      doseLabel: '',
      administeredDate: new Date().toISOString().slice(0, 10),
      notes: '',
    })
  }

  if (!isDoctorView) {
    return (
      <section className="grid">
        <div className="panel remote-consult-shell">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Telemedicine</p>
              <h2>Remote consult management</h2>
              <p className="panel-sub">Manage remote consult intake, scheduling, and patient status updates.</p>
            </div>
          </div>

          {remoteConsultsStatus ? <p className="micro">{remoteConsultsStatus}</p> : null}

          <div className="doctor-worklist-box">
            <span className="micro strong">Remote consult queue</span>
            <div className="doctor-worklist-summary">
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Waiting</span>
                <strong className="doctor-worklist-chip-value">{remoteWorklistSummary.waiting}</strong>
              </span>
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Today</span>
                <strong className="doctor-worklist-chip-value">{remoteWorklistSummary.today}</strong>
              </span>
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Future</span>
                <strong className="doctor-worklist-chip-value">{remoteWorklistSummary.future}</strong>
              </span>
            </div>
          </div>

          <div className="table-shell">
            <div className="admin-table admin-table-head">
              <span>ID</span>
              <span>Patient</span>
              <span>Status</span>
              <span>Department</span>
              <span>Doctor</span>
              <span>Reason</span>
              <span>Time</span>
              <span>Action</span>
            </div>
            {remoteConsultsLoading ? <p className="micro">Loading remote consults…</p> : null}
            {!remoteConsultsLoading &&
              remoteConsults.map((consult) => (
                <div key={`remote-consult-row-${consult.id}`} className="admin-table admin-table-row">
                  <span className="table-cell strong">#{consult.id}</span>
                  <span className="table-cell">
                    {consult.patientName || 'Patient'}
                    {consult.memberName ? ` (${consult.memberName})` : ''}
                  </span>
                  <span className="table-cell">
                    <span className={`status-pill ${String(consult.status || '').toLowerCase()}`}>{formatTeleStatus(consult.status)}</span>
                  </span>
                  <span className="table-cell">{consult.departmentName || '-'}</span>
                  <span className="table-cell">{formatDoctorName(consult.doctorName)}</span>
                  <span className="table-cell table-cell-ellipsis" title={consult.concern || 'Remote consult'}>
                    {consult.concern || 'Remote consult'}
                  </span>
                  <span className="table-cell">{consult.preferredSlot ? new Date(consult.preferredSlot).toLocaleString() : '-'}</span>
                  <span className="table-cell">
                    <button className="primary" type="button" onClick={() => setActiveRemoteConsultId(consult.id)}>
                      Manage
                    </button>
                  </span>
                </div>
              ))}
            {!remoteConsultsLoading && remoteConsults.length === 0 ? <p className="micro">No remote consults yet.</p> : null}
          </div>

          {activeRemoteConsult ? (
            <div className="modal-backdrop" onClick={() => setActiveRemoteConsultId(null)}>
              <div className="modal appointment-modal remote-consult-modal" onClick={(event) => event.stopPropagation()}>
                <div className="section-head compact">
                  <div>
                    <p className="eyebrow">Remote consult detail</p>
                    <h2>#{activeRemoteConsult.id} • {activeRemoteConsult.patientName || 'Patient'}</h2>
                    <p className="panel-sub">
                      {activeRemoteConsult.departmentName || '-'} • {activeRemoteConsult.concern || 'Remote consult'}
                    </p>
                  </div>
                  <button className="ghost" type="button" onClick={() => setActiveRemoteConsultId(null)}>Close</button>
                </div>

                {remoteConsultsStatus ? <p className="micro">{remoteConsultsStatus}</p> : null}

                <div className="form-row">
                  <label>
                    Status
                    <select
                      value={remoteConsultDraft.status}
                      onChange={(event) => setRemoteConsultDraft((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="requested">Requested</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label>
                    Meeting URL
                    <input
                      type="url"
                      value={remoteConsultDraft.meetingUrl}
                      placeholder={isChatMode ? 'Optional meeting URL' : 'Coming soon for video/audio'}
                      disabled={!isChatMode}
                      onChange={(event) => setRemoteConsultDraft((prev) => ({ ...prev, meetingUrl: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Patient
                    <input type="text" value={activeRemoteConsult.patientName || 'Patient'} disabled />
                  </label>
                  <label>
                    Scheduled time
                    <input
                      type="text"
                      value={activeRemoteConsult.preferredSlot ? new Date(activeRemoteConsult.preferredSlot).toLocaleString() : '-'}
                      disabled
                    />
                  </label>
                </div>

                <div className="action-row">
                  <button className="primary" type="button" onClick={saveRemoteConsultStatus}>
                    Save consult state
                  </button>
                  <button className="secondary" type="button" onClick={() => setActiveRemoteConsultId(null)}>
                    Close
                  </button>
                </div>

                {patient ? (
                  <div className="history-list compact-list">
                    <div className="history-card">
                      <p className="micro"><strong>Phone:</strong> {patient.phone || 'No phone'}</p>
                      <p className="micro"><strong>Email:</strong> {patient.email || '-'}</p>
                      <p className="micro"><strong>Conditions:</strong> {patient.conditions || 'None added'}</p>
                      <p className="micro"><strong>Allergies:</strong> {patient.allergies || 'None added'}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

        </div>
      </section>
    )
  }

  return (
    <section className="doctor-console-shell-wide">
      <div className="panel doctor-console-surface remote-console-surface">
        <div className="doctor-console-header">
          <div>
            <p className="eyebrow">Remote consult console</p>
            <h2>{activeRemoteConsult ? (activeRemoteConsult.patientName || 'Remote consult workspace') : 'Remote consult workspace'}</h2>
            <p className="panel-sub">
              {activeRemoteConsult
                ? `${activeRemoteConsult.departmentName || '-'} • ${activeRemoteConsult.concern || 'Remote consult'}`
                : 'Manage remote consults with the same patient context and worklist clarity as the in-person console.'}
            </p>
          </div>
          <div className="doctor-worklist-box">
            <span className="micro strong">Remote consult worklist</span>
            <div className="doctor-worklist-summary">
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Waiting</span>
                <strong className="doctor-worklist-chip-value">{remoteWorklistSummary.waiting}</strong>
              </span>
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Today</span>
                <strong className="doctor-worklist-chip-value">{remoteWorklistSummary.today}</strong>
              </span>
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Future</span>
                <strong className="doctor-worklist-chip-value">{remoteWorklistSummary.future}</strong>
              </span>
            </div>
            <select value={activeRemoteConsultId || ''} onChange={(event) => setActiveRemoteConsultId(Number(event.target.value) || null)}>
              <option value="">Select consult</option>
              {consultOptions.map((option) => (
                <option key={`remote-consult-option-${option.id}`} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {remoteConsultsStatus ? <div className="doctor-console-banner">{remoteConsultsStatus}</div> : null}

        {!activeRemoteConsult ? (
          <div className="history-card">
            <p className="micro">Select a remote consult to manage status, chat, and patient context.</p>
          </div>
        ) : (
          <>
            <div className="doctor-consult-strip">
              <div className="doctor-consult-metadata">
                <div className="doctor-consult-title-row">
                  <h3>{activeRemoteConsult.patientName || 'Patient'}{activeRemoteConsult.memberName ? ` (${activeRemoteConsult.memberName})` : ''}</h3>
                  <span className={`status-pill ${String(activeRemoteConsult.status || '').replace(/\s+/g, '_')}`}>
                    {formatSnapshotStatus(activeRemoteConsult.status)}
                  </span>
                </div>
                <p className="doctor-consult-subtitle">
                  {(activeRemoteConsult.departmentName || activeRemoteConsult.department || '-')} • {activeRemoteConsult.concern || 'Remote consult'}
                </p>
                <div className="doctor-consult-quick-notes">
                  <span className="doctor-consult-pill">{remoteNotesCount} notes</span>
                  <span className="doctor-consult-pill">{remotePrescriptionsCount} prescriptions</span>
                  <span className="doctor-consult-pill">{remoteOrdersCount} orders</span>
                  {patient?.abhaNumber || patient?.abhaAddress ? (
                    <span className="doctor-consult-pill emphasis">ABHA linked</span>
                  ) : null}
                </div>
              </div>
              <div className="doctor-consult-facts">
                <div className="doctor-fact-chip">
                  <span className="mini-label">Consult</span>
                  <strong>#{activeRemoteConsult.id}</strong>
                </div>
                <div className="doctor-fact-chip">
                  <span className="mini-label">Time</span>
                  <strong>{activeRemoteConsult.preferredSlot ? new Date(activeRemoteConsult.preferredSlot).toLocaleString() : '-'}</strong>
                </div>
                <div className="doctor-fact-chip">
                  <span className="mini-label">Encounter</span>
                  <strong>{encounterId ? `#${encounterId}` : 'Pending'}</strong>
                </div>
                <div className="doctor-fact-chip">
                  <span className="mini-label">History</span>
                  <strong>{patient?.previousVisitCount || 0} visits</strong>
                </div>
              </div>
            </div>

            <div className="remote-console-layout">
              <div className="remote-console-main">
                <div className="doctor-console-tabs doctor-console-tabs-wide">
                  {remoteTabConfig.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`doctor-console-tab ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <span>{tab.label}</span>
                      {tab.count ? <span className="doctor-console-tab-count">{tab.count}</span> : null}
                    </button>
                  ))}
                </div>

                {activeTab === 'chat' ? (
                  <div className="doctor-workspace-card remote-console-chat-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Consult chat</p>
                        <p className="micro">Use chat for the full consult thread and quick patient coordination.</p>
                      </div>
                    </div>
                    {!doctorConsentAccepted ? (
                      <div className="doctor-console-banner subtle">
                        Acknowledge the remote consult notice before using chat or documenting care.
                        <div className="action-row">
                          <button className="secondary" type="button" onClick={acceptRemoteConsultConsent}>
                            Acknowledge teleconsult
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="consult-thread">
                      {remoteConsultMessages.length === 0 ? (
                        <p className="micro">No chat messages yet.</p>
                      ) : (
                        remoteConsultMessages.map((msg) => (
                          <div
                            key={`remote-consult-message-${msg.id}`}
                            className={`chat-msg ${msg.senderRole === userRole ? 'user' : 'bot'}`}
                          >
                            <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                            <p>{msg.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {isDoctorView && isChatMode ? (
                      <form className="chat-form" onSubmit={sendRemoteConsultMessage}>
                        <input
                          type="text"
                          value={remoteConsultMessageText}
                          placeholder="Type a message to the patient..."
                          disabled={!doctorConsentAccepted}
                          onChange={(event) => setRemoteConsultMessageText(event.target.value)}
                        />
                        <button className="primary" type="submit" disabled={!doctorConsentAccepted}>Send</button>
                      </form>
                    ) : null}
                    {remoteConsultMessageStatus ? <p className="micro">{remoteConsultMessageStatus}</p> : null}
                  </div>
                ) : null}

                {activeTab === 'summary' ? (
                  <div className="doctor-workspace-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Remote encounter summary</p>
                        <p className="micro">Capture the same core clinical summary as an in-person consult.</p>
                      </div>
                    </div>
                    <div className="doctor-form-grid-two">
                      <label>
                        Chief complaint
                        <input
                          type="text"
                          value={encounterForm.chiefComplaint}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))}
                        />
                      </label>
                      <label>
                        Vitals
                        <input
                          type="text"
                          value={encounterForm.vitalsText}
                          placeholder="BP 120/80, PR 82, SpO2 99%"
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, vitalsText: event.target.value }))}
                        />
                      </label>
                      <label>
                        Diagnosis code
                        <input
                          type="text"
                          value={encounterForm.diagnosisCode}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, diagnosisCode: event.target.value }))}
                        />
                      </label>
                      <label>
                        Follow-up date
                        <input
                          type="date"
                          value={encounterForm.followupDate}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, followupDate: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Findings
                        <textarea
                          rows="3"
                          value={encounterForm.findings}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, findings: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Diagnosis
                        <textarea
                          rows="3"
                          value={encounterForm.diagnosisText}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, diagnosisText: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Plan
                        <textarea
                          rows="3"
                          value={encounterForm.planText}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, planText: event.target.value }))}
                        />
                      </label>
                      <label>
                        Encounter status
                        <select
                          value={encounterForm.status}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>
                    </div>
                    <div className="action-row">
                      <button className="primary" type="button" onClick={saveEncounterSummary} disabled={!doctorConsentAccepted}>
                        Save summary
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'pathway' && isPediatricConsole ? (
                  <div className="doctor-workspace-card doctor-department-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Pediatric pathway</p>
                        <p className="micro">Capture child growth context, guardian details, and pediatric follow-up directly in the remote consult.</p>
                      </div>
                    </div>
                    <div className="doctor-form-grid doctor-form-grid-pediatrics">
                      <label>
                        Child DOB
                        <input
                          type="date"
                          value={departmentConsoleForm.dateOfBirth || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                        />
                      </label>
                      <label>
                        Child sex
                        <select
                          value={departmentConsoleForm.sex || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, sex: event.target.value }))}
                        >
                          <option value="">Select sex</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </label>
                      <label>
                        Guardian name
                        <input
                          type="text"
                          value={departmentConsoleForm.guardianName || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, guardianName: event.target.value }))}
                        />
                      </label>
                      <label>
                        Weight (kg)
                        <input
                          type="text"
                          value={departmentConsoleForm.weightKg || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                        />
                      </label>
                      <label>
                        Height (cm)
                        <input
                          type="text"
                          value={departmentConsoleForm.heightCm || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                        />
                      </label>
                      <label>
                        Head circumference (cm)
                        <input
                          type="text"
                          value={departmentConsoleForm.headCircumferenceCm || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, headCircumferenceCm: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Pediatric dosing context
                        <textarea
                          rows="3"
                          value={departmentConsoleForm.pediatricDoseNotes || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, pediatricDoseNotes: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Development notes
                        <textarea
                          rows="4"
                          value={departmentConsoleForm.developmentNotes || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, developmentNotes: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Growth notes
                        <textarea
                          rows="4"
                          value={departmentConsoleForm.growthNotes || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, growthNotes: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Follow-up pediatric notes
                        <textarea
                          rows="4"
                          value={departmentConsoleForm.followUpPediatricNotes || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, followUpPediatricNotes: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="action-row">
                      <button className="primary" type="button" onClick={saveDepartmentConsoleForm} disabled={!doctorConsentAccepted}>
                        Save pediatrics details
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'vaccination' && isPediatricConsole ? (
                  <div className="doctor-workspace-card pediatric-vaccine-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Vaccination</p>
                        <p className="micro">Pick from the vaccine master list, record doses quickly, and keep the child immunization trail in the same consult.</p>
                      </div>
                      <button className="ghost" type="button" onClick={() => setShowPediatricTracker((prev) => !prev)}>
                        {showPediatricTracker ? 'Hide recorded vaccines' : 'Show recorded vaccines'}
                      </button>
                    </div>
                    <label>
                      Immunization context
                      <textarea
                        rows="4"
                        value={departmentConsoleForm.immunizationContext || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, immunizationContext: event.target.value }))}
                      />
                    </label>
                    <div className="doctor-form-grid doctor-form-grid-four">
                      <label>
                        Schedule
                        <select
                          value={departmentConsoleForm.immunizationSchedule || ''}
                          onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, immunizationSchedule: event.target.value }))}
                        >
                          <option value="">Choose schedule</option>
                          <option value="UIP">India UIP</option>
                          <option value="IAP">IAP / private</option>
                        </select>
                      </label>
                      <label>
                        Vaccine name
                        <div className="pediatric-vaccine-picker">
                          <input
                            type="text"
                            value={manualVaccineDraft.vaccineName}
                            onChange={(event) =>
                              setManualVaccineDraft((prev) => ({
                                ...prev,
                                code: '',
                                vaccineName: event.target.value,
                              }))
                            }
                            placeholder="Type initials like BCG, OPV, MMR, Hep..."
                            list="remote-pediatric-vaccine-options"
                            autoComplete="off"
                          />
                          <datalist id="remote-pediatric-vaccine-options">
                            {pediatricVaccineSuggestions.map((item) => (
                              <option key={`remote-vaccine-option-${item.code}-${item.doseLabel}`} value={item.vaccineName}>
                                {`${item.doseLabel}${item.source ? ` • ${item.source}` : ''}`}
                              </option>
                            ))}
                          </datalist>
                          {manualVaccineDraft.vaccineName && pediatricVaccineSuggestions.length ? (
                            <div className="pediatric-vaccine-suggestion-list">
                              {pediatricVaccineSuggestions.map((item) => (
                                <button
                                  key={`remote-vaccine-suggestion-${item.code}-${item.doseLabel}`}
                                  className="pediatric-vaccine-suggestion"
                                  type="button"
                                  onClick={() => applyManualVaccineSuggestion(item)}
                                >
                                  <strong>{item.vaccineName}</strong>
                                  <span>{item.doseLabel}{item.source ? ` • ${item.source}` : ''}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                          <p className="micro">Type initials or a short vaccine name and pick from suggestions, or enter your own custom one.</p>
                        </div>
                      </label>
                      <label>
                        Dose label
                        <input
                          type="text"
                          value={manualVaccineDraft.doseLabel}
                          onChange={(event) => setManualVaccineDraft((prev) => ({ ...prev, doseLabel: event.target.value }))}
                          placeholder="Dose 1 / Booster / Birth dose"
                        />
                      </label>
                      <label>
                        Given date
                        <input
                          type="date"
                          value={manualVaccineDraft.administeredDate}
                          onChange={(event) => setManualVaccineDraft((prev) => ({ ...prev, administeredDate: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Notes
                        <input
                          type="text"
                          value={manualVaccineDraft.notes}
                          onChange={(event) => setManualVaccineDraft((prev) => ({ ...prev, notes: event.target.value }))}
                          placeholder="Batch / site / reaction"
                        />
                      </label>
                    </div>
                    <div className="action-row">
                      <button className="primary" type="button" onClick={saveManualPediatricImmunization} disabled={!doctorConsentAccepted}>
                        Record vaccine
                      </button>
                      <button className="ghost" type="button" onClick={saveDepartmentConsoleForm} disabled={!doctorConsentAccepted}>
                        Save vaccination details
                      </button>
                    </div>
                    {showPediatricTracker ? (
                      <div className="history-list compact-list">
                        <p className="micro strong">Recorded immunizations</p>
                        <div className="pediatric-vaccine-stack">
                          {remoteImmunizations.slice(0, 8).map((record) => (
                            <div key={`remote-recorded-vaccine-${record.id}`} className="pediatric-vaccine-item recorded">
                              <strong>{record.vaccine_name}</strong>
                              <p className="micro">{record.dose_label} • Given {record.administered_date || '-'}</p>
                            </div>
                          ))}
                          {remoteImmunizations.length === 0 ? <p className="micro">No vaccine has been recorded for this remote consult yet.</p> : null}
                        </div>
                      </div>
                    ) : (
                      <p className="micro">Recorded vaccines stay tucked away until you open the tracker. Manual vaccine entry is always available above.</p>
                    )}
                  </div>
                ) : null}

                {activeTab === 'notes' ? (
                  <div className="doctor-workspace-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Doctor note</p>
                        <p className="micro">Finalize the consult note directly from the remote workspace.</p>
                      </div>
                    </div>
                    <DoctorAssistPanel
                      title={
                        activeDoctorConsoleKind === 'pediatrics'
                          ? 'Pediatric clinic assist'
                          : activeDoctorConsoleKind === 'surgery'
                            ? 'Surgical OPD assist'
                            : 'Clinical template assist'
                      }
                      subtitle={
                        activeDoctorConsoleKind === 'pediatrics'
                          ? 'Use child-visit templates for fever, wheeze, growth, nutrition, abdominal pain, vaccine review, and caregiver-facing note drafting during the live consult.'
                          : activeDoctorConsoleKind === 'surgery'
                            ? 'Use surgical OPD templates for post-op review, wound care, acute abdomen, hernia, piles/fissure, and sharper procedure-facing notes during the live consult.'
                            : 'Use the same note, diagnosis, order, and medicine templates here while the remote consult is live.'
                      }
                      departmentKey={activeDoctorConsoleKind}
                      noteAssistQuery={noteAssistQuery}
                      setNoteAssistQuery={setNoteAssistQuery}
                      noteAssistSuggestions={visibleNoteAssistSuggestions}
                      noteAssistStatus={noteAssistStatus}
                      noteAssistLoading={noteAssistLoading}
                      loadNoteAssistSuggestions={loadNoteAssistSuggestions}
                      applyNoteAssistSuggestion={applyNoteAssistSuggestion}
                      applyAssistComplaintTemplate={applyAssistComplaintTemplate}
                      applyAssistDiagnosisSuggestion={applyAssistDiagnosisSuggestion}
                      stageAssistOrderSuggestion={stageAssistOrderSuggestion}
                      applyAssistPrescriptionTemplate={applyAssistPrescriptionTemplate}
                      dismissNoteAssistSuggestion={dismissNoteAssistSuggestion}
                    />
                    <label>
                      Note
                      <textarea rows="5" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                    </label>
                    <div className="doctor-note-refine-bar">
                      <div>
                        <p className="micro strong">Refine current draft</p>
                        <p className="micro">Polish the note into a cleaner clinical, concise, or caregiver-friendly version.</p>
                      </div>
                      <div className="action-row doctor-note-refine-actions">
                        <button
                          type="button"
                          className="ghost"
                          disabled={noteRefineLoading || !String(noteDraft || '').trim()}
                          onClick={() => refineDoctorNoteDraft('clinical')}
                        >
                          {noteRefineLoading ? 'Refining…' : 'Clinical polish'}
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          disabled={noteRefineLoading || !String(noteDraft || '').trim()}
                          onClick={() => refineDoctorNoteDraft('concise')}
                        >
                          Concise
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          disabled={noteRefineLoading || !String(noteDraft || '').trim()}
                          onClick={() => refineDoctorNoteDraft(isPediatricConsole ? 'caregiver' : 'clinical')}
                        >
                          {isPediatricConsole ? 'Caregiver-friendly' : 'Patient-friendly'}
                        </button>
                      </div>
                    </div>
                    {noteRefineStatus ? <p className="micro doctor-note-assist-status">{noteRefineStatus}</p> : null}
                    <label>
                      Signature
                      <input type="text" value={signatureDraft} onChange={(event) => setSignatureDraft(event.target.value)} />
                    </label>
                    <div className="action-row">
                      <button className="secondary" type="button" onClick={submitEncounterNote} disabled={!doctorConsentAccepted}>
                        Save doctor note
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'prescription' ? (
                  <div className="doctor-workspace-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Prescription</p>
                      </div>
                    </div>
                    <label>
                      Instructions
                      <textarea
                        rows="3"
                        value={prescriptionDraft.instructions}
                        onChange={(event) => setPrescriptionDraft((prev) => ({ ...prev, instructions: event.target.value }))}
                      />
                    </label>
                    <div className="history-list compact-list">
                      {prescriptionDraft.items.map((item, index) => (
                        <div key={`remote-rx-${index}`} className="history-card">
                          <div className="doctor-form-grid-two">
                            <label>
                              Medicine
                              <input
                                type="text"
                                value={item.medicine}
                                onChange={(event) => updatePrescriptionItem(index, 'medicine', event.target.value)}
                              />
                            </label>
                            <label>
                              Dose
                              <input
                                type="text"
                                value={item.dose}
                                onChange={(event) => updatePrescriptionItem(index, 'dose', event.target.value)}
                              />
                            </label>
                            <label>
                              Frequency
                              <input
                                type="text"
                                value={item.frequency}
                                onChange={(event) => updatePrescriptionItem(index, 'frequency', event.target.value)}
                              />
                            </label>
                            <label>
                              Duration
                              <input
                                type="text"
                                value={item.duration}
                                onChange={(event) => updatePrescriptionItem(index, 'duration', event.target.value)}
                              />
                            </label>
                          </div>
                          {prescriptionDraft.items.length > 1 ? (
                            <div className="action-row">
                              <button className="ghost" type="button" onClick={() => removePrescriptionItem(index)}>
                                Remove item
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="action-row">
                      <button className="ghost" type="button" onClick={addPrescriptionItem}>Add medicine</button>
                      <button className="secondary" type="button" onClick={submitPrescription} disabled={!doctorConsentAccepted}>
                        Save prescription
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'orders' ? (
                  <div className="doctor-workspace-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Orders</p>
                      </div>
                    </div>
                    <div className="doctor-form-grid-two">
                      <label>
                        Order type
                        <select
                          value={orderDraft.orderType}
                          onChange={(event) => setOrderDraft((prev) => ({ ...prev, orderType: event.target.value }))}
                        >
                          <option value={activeDoctorConsoleKind === 'pediatrics' ? 'vaccine' : activeDoctorConsoleKind === 'surgery' ? 'procedure' : 'lab'}>
                            Default
                          </option>
                          <option value="lab">Lab</option>
                          <option value="pharmacy">Pharmacy</option>
                          <option value="radiology">Radiology</option>
                          <option value="procedure">Procedure</option>
                          <option value="vaccine">Vaccine</option>
                          <option value="referral">Referral</option>
                        </select>
                      </label>
                      <label>
                        Item
                        <input
                          type="text"
                          value={orderDraft.itemName}
                          onChange={(event) => setOrderDraft((prev) => ({ ...prev, itemName: event.target.value }))}
                        />
                      </label>
                      <label>
                        Destination
                        <input
                          type="text"
                          value={orderDraft.destination}
                          onChange={(event) => setOrderDraft((prev) => ({ ...prev, destination: event.target.value }))}
                        />
                      </label>
                      <label className="doctor-form-span-full">
                        Notes
                        <textarea
                          rows="3"
                          value={orderDraft.notes}
                          onChange={(event) => setOrderDraft((prev) => ({ ...prev, notes: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="action-row">
                      <button className="secondary" type="button" onClick={submitEncounterOrder} disabled={!doctorConsentAccepted}>
                        Create order
                      </button>
                    </div>
                  </div>
                ) : null}
                {doctorConsoleStatus ? <p className="micro">{doctorConsoleStatus}</p> : null}
              </div>

              <aside className="remote-console-sidebar">
                <div className="doctor-workspace-card remote-console-sidebar-card">
                  <div className="section-head compact">
                    <div>
                      <p className="micro strong">Consult snapshot</p>
                      <p className="micro">Scheduling, patient context, and recent visit history.</p>
                    </div>
                  </div>

                  <div className="remote-consult-manage-grid">
                    <label>
                      Status
                      <select
                        value={remoteConsultDraft.status}
                        onChange={(event) => setRemoteConsultDraft((prev) => ({ ...prev, status: event.target.value }))}
                      >
                        <option value="requested">Requested</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                    <label>
                      Meeting URL
                      <input
                        type="url"
                        value={remoteConsultDraft.meetingUrl}
                        placeholder="Leave blank to use the built-in meeting room"
                        onChange={(event) => setRemoteConsultDraft((prev) => ({ ...prev, meetingUrl: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="action-row">
                    <button className="secondary" type="button" onClick={saveRemoteConsultStatus}>
                      Save consult state
                    </button>
                  </div>
                  <div className="history-list compact-list">
                    <div className="history-card">
                      <p className="micro"><strong>Teleconsult consent:</strong> {doctorConsentAccepted ? `Doctor acknowledged at ${new Date(remoteConsultConsentSummary.doctorAcceptedAt).toLocaleString()}` : 'Doctor acknowledgement pending'}</p>
                      <p className="micro"><strong>Patient consent:</strong> {remoteConsultConsentSummary?.patientAccepted ? `Accepted at ${new Date(remoteConsultConsentSummary.patientAcceptedAt).toLocaleString()}` : 'Pending'}</p>
                    </div>
                  </div>

                  {patient ? (
                    <div className="history-list compact-list">
                      <div className="history-card">
                        <p className="history-headline">{patient.name || 'Patient'}</p>
                        <p className="micro">
                          {patient.age ? `${patient.age} yrs` : 'Age not added'}
                          {patient.sex ? ` • ${patient.sex}` : ''}
                          {patient.bloodGroup ? ` • ${patient.bloodGroup}` : ''}
                        </p>
                        <p className="micro">
                          {patient.phone || 'No phone'}
                          {patient.email ? ` • ${patient.email}` : ''}
                        </p>
                      </div>
                      <div className="history-card">
                        <p className="micro"><strong>Conditions:</strong> {patient.conditions || 'None added'}</p>
                        <p className="micro"><strong>Allergies:</strong> {patient.allergies || 'None added'}</p>
                        <p className="micro">
                          <strong>Body metrics:</strong>{' '}
                          {patient.weightKg || patient.heightCm
                            ? `${patient.weightKg || '-'} kg • ${patient.heightCm || '-'} cm`
                            : 'Not added'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="history-list compact-list">
                    <p className="micro strong">Recent history</p>
                    {history.length ? history.slice(0, 4).map((item) => (
                      <div key={`remote-history-${item.id}`} className="history-card">
                        <p className="history-headline">
                          {item.department || 'Visit'}{item.doctor_name ? ` • Dr. ${item.doctor_name}` : ''}
                        </p>
                        <p className="micro">
                          {(item.scheduled_at || item.created_at) ? new Date(item.scheduled_at || item.created_at).toLocaleString() : '-'}
                        </p>
                        <p className="micro"><strong>Complaint:</strong> {item.chief_complaint || '-'}</p>
                        <p className="micro"><strong>Assessment:</strong> {item.diagnosis_text || '-'}</p>
                        <p className="micro"><strong>Plan:</strong> {item.plan_text || '-'}</p>
                      </div>
                    )) : <p className="micro">No previous visits yet.</p>}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
