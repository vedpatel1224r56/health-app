const formatPatientDisplayId = (patient) => patient?.patient_uid || `PID${String(patient?.id || '').padStart(6, '0')}`

export function PatientDetailModal({
  activePatient,
  setActivePatientId,
  activePatientPanel,
  setActivePatientPanel,
  patientsStatus,
  patientPanelStatus,
  loadPatientProfileView,
  loadPatientHistoryView,
  loadPatientDocumentsView,
  patientProfileData,
  patientHistoryData,
  patientDocumentsData,
  downloadAdminRecord,
  patientAbhaHistoryData,
  abhaReviewNotes,
  setAbhaReviewNotes,
  loadPatientAbhaHistory,
  reviewPatientAbha,
  handlePatientQuickAction,
  updatePatientDraft,
  savePatient,
  user,
  patients,
  mergePatient,
}) {
  return (
    <div className="modal-backdrop" onClick={() => setActivePatientId(null)}>
      <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Patient detail</p>
            <h2>{formatPatientDisplayId(activePatient)} • {activePatient.nameDraft || activePatient.name}</h2>
            <p className="panel-sub">
              {activePatient.created_at ? `Registered ${new Date(activePatient.created_at).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button className="ghost" type="button" onClick={() => setActivePatientId(null)}>Close</button>
        </div>

        <div className="action-row">
          <button className={activePatientPanel === 'view' ? 'primary' : 'ghost'} type="button" onClick={() => setActivePatientPanel('view')}>View</button>
          <button className={activePatientPanel === 'edit' ? 'primary' : 'ghost'} type="button" onClick={() => setActivePatientPanel('edit')}>Edit</button>
          <button className={activePatientPanel === 'profile' ? 'primary' : 'ghost'} type="button" onClick={() => { setActivePatientPanel('profile'); void Promise.all([loadPatientProfileView(activePatient.id), loadPatientAbhaHistory(activePatient.id)]) }}>Profile</button>
          <button className={activePatientPanel === 'records' ? 'primary' : 'ghost'} type="button" onClick={() => { setActivePatientPanel('records'); void loadPatientHistoryView(activePatient.id) }}>Records</button>
          <button className={activePatientPanel === 'documents' ? 'primary' : 'ghost'} type="button" onClick={() => { setActivePatientPanel('documents'); void loadPatientDocumentsView(activePatient.id) }}>Documents</button>
          <button className={activePatientPanel === 'more' ? 'primary' : 'ghost'} type="button" onClick={() => setActivePatientPanel('more')}>More</button>
        </div>

        {(patientsStatus || patientPanelStatus) && <p className="micro">{patientPanelStatus || patientsStatus}</p>}

        {activePatientPanel === 'view' ? (
          <div className="history-list">
            <div className="history-card">
              <p className="history-headline">Patient overview</p>
              <p className="micro">Name: {activePatient.nameDraft || activePatient.name || '-'}</p>
              <p className="micro">Patient ID: {formatPatientDisplayId(activePatient)}</p>
              <p className="micro">DOB: {activePatient.dateOfBirthDraft || '-'}</p>
              <p className="micro">Age: {activePatient.ageDraft === '' || activePatient.ageDraft == null ? '-' : `${activePatient.ageDraft}y 0m`}</p>
            </div>
          </div>
        ) : null}

        {activePatientPanel === 'profile' ? (
          <div className="history-list">
            <div className="history-card">
              <p className="history-headline">Profile snapshot</p>
              {patientProfileData[activePatient.id] ? (
                <>
                  <p className="micro">ABHA status: {String(patientProfileData[activePatient.id].abha_status || 'not_linked').replace(/_/g, ' ')}</p>
                  <p className="micro">ABHA no.: {patientProfileData[activePatient.id].abha_number || '-'}</p>
                  <p className="micro">ABHA address: {patientProfileData[activePatient.id].abha_address || '-'}</p>
                  {patientProfileData[activePatient.id].abha_last_error ? (
                    <p className="micro">Review note: {patientProfileData[activePatient.id].abha_last_error}</p>
                  ) : null}
                  <p className="micro">Sex: {patientProfileData[activePatient.id].sex || '-'}</p>
                  <p className="micro">Body metrics: {[patientProfileData[activePatient.id].weight_kg ? `${patientProfileData[activePatient.id].weight_kg} kg` : '', patientProfileData[activePatient.id].height_cm ? `${patientProfileData[activePatient.id].height_cm} cm` : ''].filter(Boolean).join(' • ') || '-'}</p>
                  <p className="micro">Conditions: {(patientProfileData[activePatient.id].conditions || []).join(', ') || '-'}</p>
                  <p className="micro">Allergies: {(patientProfileData[activePatient.id].allergies || []).join(', ') || '-'}</p>
                  {String(patientProfileData[activePatient.id].abha_status || '').toLowerCase() === 'pending_verification' ? (
                    <div className="history-card subtle">
                      <p className="history-headline">ABHA review action</p>
                      <textarea
                        rows={3}
                        placeholder="Explain what the patient should correct if you reject this request."
                        value={abhaReviewNotes[activePatient.id] || ''}
                        onChange={(event) => setAbhaReviewNotes((prev) => ({ ...prev, [activePatient.id]: event.target.value }))}
                      />
                      <div className="action-row">
                        <button className="primary" type="button" onClick={() => void reviewPatientAbha(activePatient.id, 'approve')}>
                          Approve ABHA
                        </button>
                        <button
                          className="ghost"
                          type="button"
                          onClick={() =>
                            void reviewPatientAbha(
                              activePatient.id,
                              'reject',
                              (abhaReviewNotes[activePatient.id] || '').trim() || 'Please review and correct ABHA details.',
                            )
                          }
                        >
                          Reject ABHA
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="history-card subtle">
                    <div className="section-head compact">
                      <div>
                        <p className="history-headline">ABHA review timeline</p>
                        <p className="micro">Recent ABHA actions and review notes for this patient.</p>
                      </div>
                      <button className="ghost" type="button" onClick={() => void loadPatientAbhaHistory(activePatient.id)}>
                        Refresh
                      </button>
                    </div>
                    <div className="history-list compact-list">
                      {(patientAbhaHistoryData[activePatient.id] || []).map((item) => (
                        <div key={`patient-abha-history-${activePatient.id}-${item.id}`} className="history-card">
                          <p className="history-headline">{String(item.action || '').replace(/_/g, ' ')}</p>
                          <p className="micro">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'} • {String(item.status || '').replace(/_/g, ' ')}
                          </p>
                          {item.payload?.reviewedByName ? (
                            <p className="micro">
                              Reviewed by {item.payload.reviewedByName}
                              {item.payload.reviewedByRole ? ` • ${String(item.payload.reviewedByRole).replace(/_/g, ' ')}` : ''}
                            </p>
                          ) : null}
                          {item.notes ? <p className="micro">{item.notes}</p> : null}
                        </div>
                      ))}
                      {(!patientAbhaHistoryData[activePatient.id] || patientAbhaHistoryData[activePatient.id].length === 0) ? (
                        <p className="micro">No ABHA history available yet.</p>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <p className="micro">No profile snapshot found.</p>
              )}
            </div>
          </div>
        ) : null}

        {activePatientPanel === 'records' ? (
          <div className="history-list">
            {(patientHistoryData[activePatient.id] || []).map((item) => (
              <div key={`patient-record-${activePatient.id}-${item.id}`} className="history-card">
                <p className="history-headline">{item?.result?.headline || 'Guidance entry'}</p>
                <p className="micro">{item?.result?.urgency || item?.result?.level || '-'}</p>
                <p className="micro">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
              </div>
            ))}
            {(!patientHistoryData[activePatient.id] || patientHistoryData[activePatient.id].length === 0) && (
              <p className="micro">No triage records found.</p>
            )}
          </div>
        ) : null}

        {activePatientPanel === 'documents' ? (
          <div className="history-list">
            {(patientDocumentsData[activePatient.id] || []).map((doc) => (
              <div key={`patient-doc-${activePatient.id}-${doc.id}`} className="history-card">
                <p className="history-headline">{doc.file_name || `Document #${doc.id}`}</p>
                <p className="micro">{doc.mimetype || '-'}</p>
                <p className="micro">{doc.created_at ? new Date(doc.created_at).toLocaleString() : '-'}</p>
                <button className="secondary" type="button" onClick={() => void downloadAdminRecord(doc.id, doc.file_name || 'record')}>
                  Download
                </button>
              </div>
            ))}
            {(!patientDocumentsData[activePatient.id] || patientDocumentsData[activePatient.id].length === 0) && (
              <p className="micro">No uploaded documents found.</p>
            )}
          </div>
        ) : null}

        {activePatientPanel === 'more' ? (
          <div className="history-list">
            <div className="history-card">
              <p className="history-headline">Reception action options</p>
              <div className="action-row">
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('edit', activePatient)}>Edit patient</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('view', activePatient)}>View patient</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('bill', activePatient)}>Bill</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('visit', activePatient)}>Visit</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('addVisit', activePatient)}>Add visit</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('visitCasePaperPrint', activePatient)}>Visit case paper print</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('addEstimate', activePatient)}>Add estimate</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('relief', activePatient)}>Relief</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('addInvestigation', activePatient)}>Add investigation</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('addPayment', activePatient)}>Add payment</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('patientIcard', activePatient)}>Patient I card</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('patientYojanaCard', activePatient)}>Patient Yojana card</button>
                <button className="secondary" type="button" onClick={() => void handlePatientQuickAction('ssiInquiry', activePatient)}>S/SI inquiry</button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="form-row">
          <label>
            Registration
            <select
              value={activePatient.registrationModeDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'registrationModeDraft', event.target.value)}
            >
              <option value="opd">OPD</option>
              <option value="pid">PID</option>
            </select>
          </label>
          <label>
            Name
            <input
              type="text"
              value={activePatient.nameDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'nameDraft', event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={activePatient.emailDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'emailDraft', event.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              value={activePatient.phoneDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'phoneDraft', event.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Age
            <input
              type="number"
              min="0"
              max="120"
              value={activePatient.ageDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'ageDraft', event.target.value)}
            />
          </label>
          <label>
            Date of birth
            <input
              type="date"
              value={activePatient.dateOfBirthDraft || ''}
              onChange={(event) => updatePatientDraft(activePatient.id, 'dateOfBirthDraft', event.target.value)}
            />
          </label>
          <label>
            Sex
            <select
              value={activePatient.sexDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'sexDraft', event.target.value)}
            >
              <option value="">Select</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={activePatient.activeDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'activeDraft', event.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            Blood group
            <select
              value={activePatient.bloodGroupDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'bloodGroupDraft', event.target.value)}
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Weight (kg)
            <input
              type="number"
              min="0"
              step="0.1"
              value={activePatient.weightKgDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'weightKgDraft', event.target.value)}
            />
          </label>
          <label>
            Height (cm)
            <input
              type="number"
              min="0"
              step="0.1"
              value={activePatient.heightCmDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'heightCmDraft', event.target.value)}
            />
          </label>
          <label>
            Conditions
            <input
              type="text"
              value={activePatient.conditionsDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'conditionsDraft', event.target.value)}
            />
          </label>
          <label>
            Allergies
            <input
              type="text"
              value={activePatient.allergiesDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'allergiesDraft', event.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Address line 1
            <input
              type="text"
              value={activePatient.addressLine1Draft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'addressLine1Draft', event.target.value)}
            />
          </label>
          <label>
            Address line 2 (optional)
            <input
              type="text"
              value={activePatient.addressLine2Draft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'addressLine2Draft', event.target.value)}
            />
          </label>
          <label>
            City
            <input
              type="text"
              value={activePatient.cityDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'cityDraft', event.target.value)}
            />
          </label>
          <label>
            State
            <input
              type="text"
              value={activePatient.stateDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'stateDraft', event.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            PIN code
            <input
              type="text"
              value={activePatient.pinCodeDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'pinCodeDraft', event.target.value)}
            />
          </label>
          <label>
            Country
            <input
              type="text"
              value={activePatient.countryDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'countryDraft', event.target.value)}
            />
          </label>
          <label>
            Emergency contact name
            <input
              type="text"
              value={activePatient.emergencyContactNameDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'emergencyContactNameDraft', event.target.value)}
            />
          </label>
          <label>
            Emergency contact phone
            <input
              type="tel"
              value={activePatient.emergencyContactPhoneDraft}
              onChange={(event) => updatePatientDraft(activePatient.id, 'emergencyContactPhoneDraft', event.target.value)}
            />
          </label>
        </div>

        <div className="action-row">
          <button className="primary" type="button" onClick={() => savePatient(activePatient)}>
            Save patient
          </button>
          {user.role === 'admin' ? (
            <>
              <select
                value={activePatient.mergeTargetId}
                onChange={(event) => updatePatientDraft(activePatient.id, 'mergeTargetId', event.target.value)}
              >
                <option value="">Merge into...</option>
                {patients
                  .filter((candidate) => candidate.id !== activePatient.id)
                  .map((candidate) => (
                    <option key={`merge-modal-${activePatient.id}-${candidate.id}`} value={candidate.id}>
                      {formatPatientDisplayId(candidate)} • {candidate.nameDraft || candidate.name}
                    </option>
                  ))}
              </select>
              <button
                className="ghost"
                type="button"
                onClick={() => mergePatient(activePatient.id, activePatient.mergeTargetId)}
              >
                Merge duplicate
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
