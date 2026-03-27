export function PatientAdministrationWorkspace({
  patientsStatus,
  patients,
  patientSearch,
  setPatientSearch,
  loadPatients,
  setShowCreatePatientModal,
  handlePatientQuickAction,
  activePatient,
  activePatientPanel,
  setActivePatientPanel,
  patientPanelStatus,
  patientProfileData,
  patientHistoryData,
  patientDocumentsData,
  loadPatientProfileView,
  loadPatientHistoryView,
  loadPatientDocumentsView,
  downloadAdminRecord,
  updatePatientDraft,
  savePatient,
  user,
  mergePatient,
  setActivePatientId,
  activeVisitPatient,
  setActiveVisitPatientId,
  visitCreateStatus,
  createVisitForPatient,
  visitCreateForm,
  setVisitCreateForm,
  departments,
  visitDoctors,
  activeVisitTypes,
  showCreatePatientModal,
  patientCreateForm,
  setPatientCreateForm,
  createPatient,
  unitDoctorsForCreate,
}) {
  const activeCount = patients.filter((patient) => patient.activeDraft === 'active').length
  const opdCount = patients.filter((patient) => String(patient.registrationModeDraft || '').toLowerCase() === 'opd').length
  const pidCount = patients.filter((patient) => String(patient.registrationModeDraft || '').toLowerCase() === 'pid').length
  return (
    <>
      <section className="grid">
        <div className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Patient Registry</p>
              <h2>Patient administration</h2>
              <p className="panel-sub">Search patients, register new ones, edit core profile data, and manage active status.</p>
            </div>
            <div className="action-row">
              <button className="secondary" type="button" onClick={() => loadPatients()}>Refresh patients</button>
              <button className="primary" type="button" onClick={() => setShowCreatePatientModal(true)}>Add patient</button>
            </div>
          </div>
          {patientsStatus && <p className="micro">{patientsStatus}</p>}
          <div className="patient-admin-stat-strip">
            <article className="patient-admin-stat-card">
              <span className="mini-label">Visible patients</span>
              <strong>{patients.length}</strong>
              <span className="micro">Current filtered results</span>
            </article>
            <article className="patient-admin-stat-card">
              <span className="mini-label">Active</span>
              <strong>{activeCount}</strong>
              <span className="micro">Profiles currently marked active</span>
            </article>
            <article className="patient-admin-stat-card">
              <span className="mini-label">OPD / PID split</span>
              <strong>{opdCount} / {pidCount}</strong>
              <span className="micro">Registration mix in the current view</span>
            </article>
          </div>
          <div className="grid nested-grid">
            <div className="panel result">
              <div className="section-head compact">
                <div>
                  <h3>Patient Search {patients.length}</h3>
                  <p className="panel-sub">Find OPD/PID patients by name, patient ID, DOB, or registration date.</p>
                </div>
              </div>
              <div className="patient-search-grid patient-search-grid-polished">
                <label>
                  First Name
                  <input
                    type="search"
                    placeholder="First name"
                    value={patientSearch.firstName}
                    onChange={(event) => setPatientSearch((prev) => ({ ...prev, firstName: event.target.value }))}
                  />
                </label>
                <label>
                  Last Name
                  <input
                    type="search"
                    placeholder="Last name"
                    value={patientSearch.lastName}
                    onChange={(event) => setPatientSearch((prev) => ({ ...prev, lastName: event.target.value }))}
                  />
                </label>
                <label>
                  Patient ID
                  <input
                    type="search"
                    placeholder="PID/UHID"
                    value={patientSearch.patientId}
                    onChange={(event) => setPatientSearch((prev) => ({ ...prev, patientId: event.target.value }))}
                  />
                </label>
                <label>
                  Date Of Birth
                  <input
                    type="date"
                    value={patientSearch.dob}
                    onChange={(event) => setPatientSearch((prev) => ({ ...prev, dob: event.target.value }))}
                  />
                </label>
                <label>
                  Registration Date
                  <input
                    type="date"
                    value={patientSearch.registrationDate}
                    onChange={(event) => setPatientSearch((prev) => ({ ...prev, registrationDate: event.target.value }))}
                  />
                </label>
              </div>
              <div className="action-row">
                <button className="secondary" type="button" onClick={() => loadPatients(patientSearch)}>Search</button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    const cleared = {
                      firstName: '',
                      lastName: '',
                      patientId: '',
                      dob: '',
                      registrationDate: '',
                    }
                    setPatientSearch(cleared)
                    loadPatients(cleared)
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="table-shell patient-table-shell">
                <div className="admin-table patient-table-head">
                  <span>Patient Name</span>
                  <span>Patient ID</span>
                  <span>Date Of Birth</span>
                  <span>Registration Date</span>
                  <span>Age</span>
                  <span>Registration</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {patients.map((patient) => (
                  <div key={`patient-${patient.id}`} className="admin-table patient-table-row">
                    <span className="table-cell">{patient.nameDraft || patient.name || '-'}</span>
                    <span className="table-cell strong">{patient.patient_uid || `PID${patient.id}`}</span>
                    <span className="table-cell">{patient.dateOfBirthDraft || '-'}</span>
                    <span className="table-cell">{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '-'}</span>
                    <span className="table-cell">{patient.ageDraft === '' || patient.ageDraft == null ? '-' : `${patient.ageDraft}y 0m`}</span>
                    <span className="table-cell">{(patient.registrationModeDraft || 'pid').toUpperCase()}</span>
                    <span className="table-cell">
                      <span className={`status-pill ${patient.activeDraft === 'active' ? 'scheduled' : 'cancelled'}`}>
                        {patient.activeDraft}
                      </span>
                    </span>
                    <span className="table-cell">
                      <div className="table-actions" aria-label={`Actions for ${patient.nameDraft || patient.name}`}>
                        <button className="icon-action" type="button" title="Edit patient" onClick={() => void handlePatientQuickAction('edit', patient)}>ED</button>
                        <button className="icon-action" type="button" title="View patient" onClick={() => void handlePatientQuickAction('view', patient)}>VW</button>
                        <button className="icon-action" type="button" title="Bill" onClick={() => void handlePatientQuickAction('bill', patient)}>BL</button>
                        <button className="icon-action" type="button" title="Visit" onClick={() => void handlePatientQuickAction('visit', patient)}>VT</button>
                        <button className="icon-action" type="button" title="More actions" onClick={() => void handlePatientQuickAction('more', patient)}>MR</button>
                      </div>
                    </span>
                  </div>
                ))}
                {patients.length === 0 && <p className="micro">No patients found for the current search.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeVisitPatient ? (
        <div className="modal-backdrop" onClick={() => setActiveVisitPatientId(null)}>
          <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Visit registration</p>
                <h2>Add visit • {activeVisitPatient.nameDraft || activeVisitPatient.name}</h2>
                <p className="panel-sub">{activeVisitPatient.patient_uid || `PID${activeVisitPatient.id}`}</p>
              </div>
              <button className="ghost" type="button" onClick={() => setActiveVisitPatientId(null)}>Close</button>
            </div>
            {visitCreateStatus && <p className="micro">{visitCreateStatus}</p>}
            <form className="auth" onSubmit={createVisitForPatient}>
              <div className="form-row">
                <label>
                  Department
                  <select
                    value={visitCreateForm.departmentId}
                    onChange={(event) =>
                      setVisitCreateForm((prev) => ({
                        ...prev,
                        departmentId: event.target.value,
                        doctorId: '',
                      }))
                    }
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={`visit-department-${department.id}`} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Doctor
                  <select
                    value={visitCreateForm.doctorId}
                    onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, doctorId: event.target.value }))}
                    required
                  >
                    <option value="">Select doctor</option>
                    {visitDoctors.map((doctor) => (
                      <option key={`visit-doctor-${doctor.id}`} value={doctor.id}>
                        Dr. {doctor.name}{doctor.department_name ? ` (${doctor.department_name})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Visit type
                  <select
                    value={visitCreateForm.visitType}
                    onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, visitType: event.target.value }))}
                  >
                    {activeVisitTypes.map((visitType) => (
                      <option key={`visit-create-type-${visitType.code}`} value={visitType.code}>{visitType.code}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Scheduled date & time
                  <input
                    type="datetime-local"
                    value={visitCreateForm.scheduledAt}
                    onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Follow-up
                  <select
                    value={visitCreateForm.isFollowUp ? 'yes' : 'no'}
                    onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, isFollowUp: event.target.value === 'yes' }))}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <label>
                Visit reason
                <input
                  type="text"
                  value={visitCreateForm.reason}
                  onChange={(event) => setVisitCreateForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Follow-up consultation, review reports, etc."
                  required
                />
              </label>
              <div className="action-row">
                <button className="primary" type="submit">Create visit</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {activePatient ? (
        <div className="modal-backdrop" onClick={() => setActivePatientId(null)}>
          <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Patient detail</p>
                <h2>{activePatient.patient_uid || `PID${activePatient.id}`} • {activePatient.nameDraft || activePatient.name}</h2>
                <p className="panel-sub">{activePatient.created_at ? `Registered ${new Date(activePatient.created_at).toLocaleDateString()}` : ''}</p>
              </div>
              <button className="ghost" type="button" onClick={() => setActivePatientId(null)}>Close</button>
            </div>

            <div className="action-row">
              <button className={activePatientPanel === 'view' ? 'primary' : 'ghost'} type="button" onClick={() => setActivePatientPanel('view')}>View</button>
              <button className={activePatientPanel === 'edit' ? 'primary' : 'ghost'} type="button" onClick={() => setActivePatientPanel('edit')}>Edit</button>
              <button className={activePatientPanel === 'profile' ? 'primary' : 'ghost'} type="button" onClick={() => { setActivePatientPanel('profile'); void loadPatientProfileView(activePatient.id) }}>Profile</button>
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
                  <p className="micro">Patient ID: {activePatient.patient_uid || `PID${activePatient.id}`}</p>
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
                      <p className="micro">Sex: {patientProfileData[activePatient.id].sex || '-'}</p>
                      <p className="micro">Body metrics: {[patientProfileData[activePatient.id].weight_kg ? `${patientProfileData[activePatient.id].weight_kg} kg` : '', patientProfileData[activePatient.id].height_cm ? `${patientProfileData[activePatient.id].height_cm} cm` : ''].filter(Boolean).join(' • ') || '-'}</p>
                      <p className="micro">Conditions: {(patientProfileData[activePatient.id].conditions || []).join(', ') || '-'}</p>
                      <p className="micro">Allergies: {(patientProfileData[activePatient.id].allergies || []).join(', ') || '-'}</p>
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
                    <button className="secondary" type="button" onClick={() => void downloadAdminRecord(doc.id, doc.file_name || 'record')}>Download</button>
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
                <select value={activePatient.registrationModeDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'registrationModeDraft', event.target.value)}>
                  <option value="opd">OPD</option>
                  <option value="pid">PID</option>
                </select>
              </label>
              <label>
                Name
                <input type="text" value={activePatient.nameDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'nameDraft', event.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={activePatient.emailDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'emailDraft', event.target.value)} />
              </label>
              <label>
                Phone
                <input type="tel" value={activePatient.phoneDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'phoneDraft', event.target.value)} />
              </label>
            </div>

            <div className="form-row">
              <label>
                Age
                <input type="number" min="0" max="120" value={activePatient.ageDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'ageDraft', event.target.value)} />
              </label>
              <label>
                Date of birth
                <input type="date" value={activePatient.dateOfBirthDraft || ''} onChange={(event) => updatePatientDraft(activePatient.id, 'dateOfBirthDraft', event.target.value)} />
              </label>
              <label>
                Sex
                <select value={activePatient.sexDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'sexDraft', event.target.value)}>
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              <label>
                Status
                <select value={activePatient.activeDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'activeDraft', event.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                Blood group
                <select value={activePatient.bloodGroupDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'bloodGroupDraft', event.target.value)}>
                  <option value="">Select</option>
                  <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Weight (kg)
                <input type="number" min="0" step="0.1" value={activePatient.weightKgDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'weightKgDraft', event.target.value)} />
              </label>
              <label>
                Height (cm)
                <input type="number" min="0" step="0.1" value={activePatient.heightCmDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'heightCmDraft', event.target.value)} />
              </label>
              <label>
                Conditions
                <input type="text" value={activePatient.conditionsDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'conditionsDraft', event.target.value)} />
              </label>
              <label>
                Allergies
                <input type="text" value={activePatient.allergiesDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'allergiesDraft', event.target.value)} />
              </label>
            </div>

            <div className="form-row">
              <label>
                Address line 1
                <input type="text" value={activePatient.addressLine1Draft} onChange={(event) => updatePatientDraft(activePatient.id, 'addressLine1Draft', event.target.value)} />
              </label>
              <label>
                Address line 2 (optional)
                <input type="text" value={activePatient.addressLine2Draft} onChange={(event) => updatePatientDraft(activePatient.id, 'addressLine2Draft', event.target.value)} />
              </label>
              <label>
                City
                <input type="text" value={activePatient.cityDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'cityDraft', event.target.value)} />
              </label>
              <label>
                State
                <input type="text" value={activePatient.stateDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'stateDraft', event.target.value)} />
              </label>
            </div>

            <div className="form-row">
              <label>
                PIN code
                <input type="text" value={activePatient.pinCodeDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'pinCodeDraft', event.target.value)} />
              </label>
              <label>
                Country
                <input type="text" value={activePatient.countryDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'countryDraft', event.target.value)} />
              </label>
              <label>
                Emergency contact name
                <input type="text" value={activePatient.emergencyContactNameDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'emergencyContactNameDraft', event.target.value)} />
              </label>
              <label>
                Emergency contact phone
                <input type="tel" value={activePatient.emergencyContactPhoneDraft} onChange={(event) => updatePatientDraft(activePatient.id, 'emergencyContactPhoneDraft', event.target.value)} />
              </label>
            </div>

            <div className="action-row">
              <button className="primary" type="button" onClick={() => savePatient(activePatient)}>Save patient</button>
              {user.role === 'admin' ? (
                <>
                  <select value={activePatient.mergeTargetId} onChange={(event) => updatePatientDraft(activePatient.id, 'mergeTargetId', event.target.value)}>
                    <option value="">Merge into...</option>
                    {patients.filter((candidate) => candidate.id !== activePatient.id).map((candidate) => (
                      <option key={`merge-modal-${activePatient.id}-${candidate.id}`} value={candidate.id}>
                        {candidate.patient_uid || `PID${candidate.id}`} • {candidate.nameDraft || candidate.name}
                      </option>
                    ))}
                  </select>
                  <button className="ghost" type="button" onClick={() => mergePatient(activePatient.id, activePatient.mergeTargetId)}>Merge duplicate</button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showCreatePatientModal ? (
        <div className="modal-backdrop" onClick={() => setShowCreatePatientModal(false)}>
          <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Patient registration</p>
                <h2>Add patient</h2>
              </div>
              <button className="ghost" type="button" onClick={() => setShowCreatePatientModal(false)}>Close</button>
            </div>

            {patientsStatus && <p className="micro">{patientsStatus}</p>}

            <form className="auth" onSubmit={async (event) => {
              const created = await createPatient(event)
              if (created) setShowCreatePatientModal(false)
            }}>
              <div className="form-row">
                <label>
                  Registration
                  <select value={patientCreateForm.registrationMode} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, registrationMode: event.target.value }))}>
                    <option value="opd">OPD</option>
                    <option value="pid">PID</option>
                  </select>
                </label>
                <label>
                  First name
                  <input type="text" value={patientCreateForm.firstName} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, firstName: event.target.value }))} required />
                </label>
                <label>
                  Middle name
                  <input type="text" value={patientCreateForm.middleName} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, middleName: event.target.value }))} />
                </label>
                <label>
                  Last name
                  <input type="text" value={patientCreateForm.lastName} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, lastName: event.target.value }))} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Unit department
                  <select
                    value={patientCreateForm.unitDepartmentId}
                    onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, unitDepartmentId: event.target.value, unitDoctorId: '' }))}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={`new-patient-department-${department.id}`} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Unit doctor
                  <select value={patientCreateForm.unitDoctorId} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, unitDoctorId: event.target.value }))}>
                    <option value="">Select doctor</option>
                    {unitDoctorsForCreate.map((doctor) => (
                      <option key={`new-patient-doctor-${doctor.id}`} value={doctor.id}>
                        Dr. {doctor.name}{doctor.department_name ? ` (${doctor.department_name})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Visit time
                  <select value={patientCreateForm.visitTime} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, visitTime: event.target.value }))}>
                    {activeVisitTypes.map((visitType) => (
                      <option key={`patient-create-visit-time-${visitType.code}`} value={visitType.code}>{visitType.code}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Referred by (optional)
                  <input type="text" value={patientCreateForm.referredBy} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, referredBy: event.target.value }))} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Contact no.
                  <input type="tel" value={patientCreateForm.phone} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, phone: event.target.value }))} required />
                </label>
                <label>
                  Aadhaar no.
                  <input type="text" value={patientCreateForm.aadhaarNo} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, aadhaarNo: event.target.value }))} />
                </label>
                <label>
                  Marital status
                  <select value={patientCreateForm.maritalStatus} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, maritalStatus: event.target.value }))}>
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </label>
                <label>
                  Date of birth
                  <input type="date" value={patientCreateForm.dateOfBirth} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Weight (kg)
                  <input type="number" min="0" step="0.1" value={patientCreateForm.weightKg} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, weightKg: event.target.value }))} />
                </label>
                <label>
                  Height (cm)
                  <input type="number" min="0" step="0.1" value={patientCreateForm.heightCm} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, heightCm: event.target.value }))} />
                </label>
                <label>
                  Age
                  <input type="number" min="0" max="120" value={patientCreateForm.age} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, age: event.target.value }))} />
                </label>
                <label>
                  Sex
                  <select value={patientCreateForm.sex} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, sex: event.target.value }))}>
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
                <label>
                  Email (optional)
                  <input type="email" value={patientCreateForm.email} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, email: event.target.value }))} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Address line 1
                  <input type="text" value={patientCreateForm.addressLine1} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, addressLine1: event.target.value }))} />
                </label>
                <label>
                  Address line 2 (optional)
                  <input type="text" value={patientCreateForm.addressLine2} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, addressLine2: event.target.value }))} />
                </label>
                <label>
                  City
                  <input type="text" value={patientCreateForm.city} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, city: event.target.value }))} />
                </label>
                <label>
                  State
                  <input type="text" value={patientCreateForm.state} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, state: event.target.value }))} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Blood group
                  <select value={patientCreateForm.bloodGroup} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}>
                    <option value="">Select</option>
                    <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </label>
                <label>
                  PIN code
                  <input type="text" value={patientCreateForm.pinCode} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, pinCode: event.target.value }))} />
                </label>
                <label>
                  Emergency contact name
                  <input type="text" value={patientCreateForm.emergencyContactName} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))} />
                </label>
                <label>
                  Emergency contact phone
                  <input type="tel" value={patientCreateForm.emergencyContactPhone} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))} />
                </label>
                <label>
                  Country
                  <input type="text" value={patientCreateForm.country} onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, country: event.target.value }))} />
                </label>
              </div>
              <button className="primary" type="submit">Create patient</button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
