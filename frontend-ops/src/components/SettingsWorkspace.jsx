export function SettingsWorkspace({
  settingsStatus,
  loadHospitalSettings,
  activeSettingsPanel,
  setActiveSettingsPanel,
  hospitalProfileForm,
  setHospitalProfileForm,
  saveHospitalProfile,
  visitTypes,
  setVisitTypes,
  saveVisitTypes,
  newDepartmentForm,
  setNewDepartmentForm,
  createDepartment,
  departmentConfigs,
  updateDepartmentDraft,
  saveDepartmentConfig,
  newDoctorForm,
  setNewDoctorForm,
  createDoctorConfig,
  settingsDoctors,
  updateDoctorDraft,
  saveDoctorConfig,
  hospitalContentForm,
  setHospitalContentForm,
  saveHospitalContent,
  addHospitalPatientUpdate,
  updateHospitalPatientUpdate,
  removeHospitalPatientUpdate,
  uploadHospitalPatientUpdateImage,
  resolveHospitalAssetUrl,
}) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Configuration</p>
            <h2>Hospital profile and masters</h2>
            <p className="panel-sub">Configure profile, departments, doctors, OPD/IPD visit types, and public patient content from one place.</p>
          </div>
          <button className="secondary" type="button" onClick={loadHospitalSettings}>Refresh settings</button>
        </div>
        {settingsStatus && <p className="micro">{settingsStatus}</p>}
        <div className="settings-layout">
          <aside className="settings-sidebar">
            {[
              { key: 'profile', icon: '🏥', label: 'Hospital profile' },
              { key: 'visitTypes', icon: '🕒', label: 'Visit types' },
              { key: 'departments', icon: '🏢', label: 'Departments' },
              { key: 'doctors', icon: '🩺', label: 'Doctors' },
              { key: 'publicContent', icon: '📣', label: 'Patient app content' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`settings-nav-btn ${activeSettingsPanel === item.key ? 'active' : ''}`}
                onClick={() => setActiveSettingsPanel(item.key)}
              >
                <span className="settings-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </aside>

          <div className="settings-content">
            {activeSettingsPanel === 'profile' && (
              <div className="panel result settings-focus-panel">
                <h3>Hospital profile</h3>
                <div className="form-row">
                  <label>Hospital name<input type="text" value={hospitalProfileForm.hospitalName} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, hospitalName: event.target.value }))} /></label>
                  <label>Hospital code<input type="text" value={hospitalProfileForm.hospitalCode} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, hospitalCode: event.target.value }))} /></label>
                  <label>Contact phone<input type="text" value={hospitalProfileForm.contactPhone} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, contactPhone: event.target.value }))} /></label>
                  <label>Contact email<input type="email" value={hospitalProfileForm.contactEmail} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, contactEmail: event.target.value }))} /></label>
                </div>
                <div className="form-row">
                  <label>Address line<input type="text" value={hospitalProfileForm.addressLine} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, addressLine: event.target.value }))} /></label>
                  <label>Taluka<input type="text" value={hospitalProfileForm.taluka} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, taluka: event.target.value }))} /></label>
                  <label>District<input type="text" value={hospitalProfileForm.district} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, district: event.target.value }))} /></label>
                  <label>City<input type="text" value={hospitalProfileForm.city} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, city: event.target.value }))} /></label>
                  <label>State<input type="text" value={hospitalProfileForm.state} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, state: event.target.value }))} /></label>
                  <label>Country<input type="text" value={hospitalProfileForm.country} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, country: event.target.value }))} /></label>
                  <label>PIN code<input type="text" value={hospitalProfileForm.pinCode} onChange={(event) => setHospitalProfileForm((prev) => ({ ...prev, pinCode: event.target.value }))} /></label>
                </div>
                <div className="action-row"><button className="primary" type="button" onClick={saveHospitalProfile}>Save hospital profile</button></div>
              </div>
            )}

            {activeSettingsPanel === 'visitTypes' && (
              <div className="panel result">
                <h3>Visit types</h3>
                <div className="table-shell settings-visit-shell">
                  <div className="admin-table admin-table-head settings-visit-head"><span>Code</span><span>Label</span><span>Active</span></div>
                  {visitTypes.map((item) => (
                    <div key={`visit-type-${item.id || item.code}`} className="admin-table admin-table-row settings-visit-row">
                      <span className="table-cell strong">{item.code}</span>
                      <span className="table-cell"><input type="text" value={item.label} onChange={(event) => setVisitTypes((prev) => prev.map((row) => row.code === item.code ? { ...row, label: event.target.value } : row))} /></span>
                      <span className="table-cell"><select value={item.active ? 'active' : 'inactive'} onChange={(event) => setVisitTypes((prev) => prev.map((row) => row.code === item.code ? { ...row, active: event.target.value === 'active' } : row))}><option value="active">Active</option><option value="inactive">Inactive</option></select></span>
                    </div>
                  ))}
                  {visitTypes.length === 0 && <p className="micro">No visit types configured.</p>}
                </div>
                <div className="action-row"><button className="primary" type="button" onClick={saveVisitTypes}>Save visit types</button></div>
              </div>
            )}

            {activeSettingsPanel === 'departments' && (
              <div className="panel result">
                <h3>Departments</h3>
                <div className="table-shell">
                  <div className="admin-table admin-table-head settings-department-head">
                    <span>Name</span>
                    <span>Description</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>
                  <div className="admin-table admin-table-row settings-department-row settings-department-new-row">
                    <span className="table-cell">
                      <input type="text" value={newDepartmentForm.name} onChange={(event) => setNewDepartmentForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="New department" />
                    </span>
                    <span className="table-cell">
                      <input type="text" value={newDepartmentForm.description} onChange={(event) => setNewDepartmentForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Department description" />
                    </span>
                    <span className="table-cell">
                      <select value={newDepartmentForm.active ? 'active' : 'inactive'} onChange={(event) => setNewDepartmentForm((prev) => ({ ...prev, active: event.target.value === 'active' }))}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </span>
                    <span className="table-cell">
                      <button className="secondary" type="button" onClick={createDepartment}>Add</button>
                    </span>
                  </div>
                  {departmentConfigs.map((item) => (
                    <div key={`settings-department-${item.id}`} className="admin-table admin-table-row settings-department-row">
                      <span className="table-cell"><input type="text" value={item.name} onChange={(event) => updateDepartmentDraft(item.id, 'name', event.target.value)} /></span>
                      <span className="table-cell"><input type="text" value={item.description || ''} onChange={(event) => updateDepartmentDraft(item.id, 'description', event.target.value)} /></span>
                      <span className="table-cell"><select value={item.active ? 'active' : 'inactive'} onChange={(event) => updateDepartmentDraft(item.id, 'active', event.target.value === 'active')}><option value="active">Active</option><option value="inactive">Inactive</option></select></span>
                      <span className="table-cell"><button className="primary" type="button" onClick={() => saveDepartmentConfig(item)}>Save</button></span>
                    </div>
                  ))}
                  {departmentConfigs.length === 0 && <p className="micro">No departments configured.</p>}
                </div>
              </div>
            )}

            {activeSettingsPanel === 'doctors' && (
              <div className="panel result">
                <h3>Doctors</h3>
                <div className="settings-group-card">
                  <p className="settings-group-title">Add doctor profile</p>
                  <p className="micro">Required: doctor name, doctor email, and department. Temporary password is optional and will auto-generate if left blank.</p>
                  <div className="form-row">
                    <label>Doctor name<input type="text" value={newDoctorForm.name} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Dr. Full Name" /></label>
                    <label>Doctor email<input type="email" value={newDoctorForm.email} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="doctor@hospital.com" /></label>
                    <label>Temporary password<input type="password" value={newDoctorForm.password} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Minimum 8 characters" /></label>
                    <label>Department<select value={newDoctorForm.departmentId} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, departmentId: event.target.value }))}><option value="">Select department</option>{departmentConfigs.filter((department) => department.active).map((department) => (<option key={`new-doc-dep-${department.id}`} value={department.id}>{department.name}</option>))}</select></label>
                    <label>Qualification<input type="text" value={newDoctorForm.qualification} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, qualification: event.target.value }))} placeholder="MBBS, MD..." /></label>
                    <label>In-person fee (Rs)<input type="number" min="0" value={newDoctorForm.inPersonFee} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, inPersonFee: event.target.value }))} placeholder="500" /></label>
                    <label>Chat fee (Rs)<input type="number" min="0" value={newDoctorForm.chatFee} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, chatFee: event.target.value }))} placeholder="300" /></label>
                    <label>Video fee (Rs)<input type="number" min="0" value={newDoctorForm.videoFee} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, videoFee: event.target.value }))} placeholder="0" /></label>
                    <label>Audio fee (Rs)<input type="number" min="0" value={newDoctorForm.audioFee} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, audioFee: event.target.value }))} placeholder="0" /></label>
                    <label>Status<select value={newDoctorForm.active ? 'active' : 'inactive'} onChange={(event) => setNewDoctorForm((prev) => ({ ...prev, active: event.target.value === 'active' }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                  </div>
                  <div className="action-row"><button className="secondary" type="button" onClick={createDoctorConfig}>Add doctor</button></div>
                  {settingsStatus ? <p className="micro">{settingsStatus}</p> : null}
                </div>
                <div className="table-shell">
                  <div className="admin-table admin-table-head settings-doctor-head"><span>Name</span><span>Department</span><span>Qualification</span><span>In-person</span><span>Chat</span><span>Video</span><span>Audio</span><span>Status</span><span>Action</span></div>
                  {settingsDoctors.map((doctor) => (
                    <div key={`settings-doctor-${doctor.id}`} className="admin-table admin-table-row settings-doctor-row">
                      <span className="table-cell"><input type="text" value={doctor.displayNameDraft || doctor.name || ''} onChange={(event) => updateDoctorDraft(doctor.id, 'displayNameDraft', event.target.value)} /></span>
                      <span className="table-cell"><select value={doctor.departmentIdDraft || ''} onChange={(event) => updateDoctorDraft(doctor.id, 'departmentIdDraft', event.target.value)}><option value="">Select department</option>{departmentConfigs.filter((department) => department.active).map((department) => (<option key={`settings-doctor-department-${doctor.id}-${department.id}`} value={department.id}>{department.name}</option>))}</select></span>
                      <span className="table-cell"><input type="text" value={doctor.qualificationDraft || ''} onChange={(event) => updateDoctorDraft(doctor.id, 'qualificationDraft', event.target.value)} /></span>
                      <span className="table-cell"><input type="number" min="0" value={doctor.inPersonFeeDraft ?? ''} onChange={(event) => updateDoctorDraft(doctor.id, 'inPersonFeeDraft', event.target.value)} /></span>
                      <span className="table-cell"><input type="number" min="0" value={doctor.chatFeeDraft ?? ''} onChange={(event) => updateDoctorDraft(doctor.id, 'chatFeeDraft', event.target.value)} /></span>
                      <span className="table-cell"><input type="number" min="0" value={doctor.videoFeeDraft ?? ''} onChange={(event) => updateDoctorDraft(doctor.id, 'videoFeeDraft', event.target.value)} /></span>
                      <span className="table-cell"><input type="number" min="0" value={doctor.audioFeeDraft ?? ''} onChange={(event) => updateDoctorDraft(doctor.id, 'audioFeeDraft', event.target.value)} /></span>
                      <span className="table-cell"><select value={doctor.activeDraft || 'active'} onChange={(event) => updateDoctorDraft(doctor.id, 'activeDraft', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></span>
                      <span className="table-cell"><button className="primary" type="button" onClick={() => saveDoctorConfig(doctor)}>Save</button></span>
                    </div>
                  ))}
                  {settingsDoctors.length === 0 && <p className="micro">No doctor profiles configured.</p>}
                </div>
              </div>
            )}

            {activeSettingsPanel === 'publicContent' && (
              <div className="panel result">
                <h3>Patient app public content</h3>
                <p className="panel-sub">These details are shown directly in Patient Ops. One line = one item.</p>
                <div className="form-row">
                  <label>Cashless title<input type="text" value={hospitalContentForm.cashlessTitle} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, cashlessTitle: event.target.value }))} /></label>
                  <label>TPA query phone<input type="text" value={hospitalContentForm.tpaQueryPhone} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, tpaQueryPhone: event.target.value }))} /></label>
                  <label>Scope title<input type="text" value={hospitalContentForm.scopeTitle} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, scopeTitle: event.target.value }))} /></label>
                  <label>Health check-up title<input type="text" value={hospitalContentForm.healthCheckupTitle} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, healthCheckupTitle: event.target.value }))} /></label>
                  <label>Ayushman title<input type="text" value={hospitalContentForm.ayushmanTitle} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, ayushmanTitle: event.target.value }))} /></label>
                  <label>Super-specialities title<input type="text" value={hospitalContentForm.superSpecialitiesTitle} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, superSpecialitiesTitle: event.target.value }))} /></label>
                  <label>Super-specialities contact<input type="text" value={hospitalContentForm.superSpecialitiesContact} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, superSpecialitiesContact: event.target.value }))} /></label>
                </div>
                <div className="form-row">
                  <label>Cashless facility list<textarea rows={5} value={hospitalContentForm.cashlessFacilityListText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, cashlessFacilityListText: event.target.value }))} /></label>
                  <label>TPA list<textarea rows={5} value={hospitalContentForm.tpaListText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, tpaListText: event.target.value }))} /></label>
                  <label>Corporate list<textarea rows={5} value={hospitalContentForm.corporateListText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, corporateListText: event.target.value }))} /></label>
                  <label>Clinical services<textarea rows={8} value={hospitalContentForm.clinicalServicesText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, clinicalServicesText: event.target.value }))} /></label>
                  <label>State of the art facilities<textarea rows={8} value={hospitalContentForm.stateOfTheArtText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, stateOfTheArtText: event.target.value }))} /></label>
                  <label>24x7 services<textarea rows={8} value={hospitalContentForm.services24x7Text} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, services24x7Text: event.target.value }))} /></label>
                  <label>Appointment phone numbers<textarea rows={4} value={hospitalContentForm.appointmentPhonesText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, appointmentPhonesText: event.target.value }))} /></label>
                  <label>Health check-up plans<textarea rows={8} value={hospitalContentForm.healthCheckupPlansText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, healthCheckupPlansText: event.target.value }))} /></label>
                  <label>Ayushman bullets<textarea rows={8} value={hospitalContentForm.ayushmanBulletsText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, ayushmanBulletsText: event.target.value }))} /></label>
                  <label>Ayushman help phones<textarea rows={4} value={hospitalContentForm.ayushmanPhonesText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, ayushmanPhonesText: event.target.value }))} /></label>
                  <label>Super-specialities departments<textarea rows={8} value={hospitalContentForm.superSpecialitiesText} onChange={(event) => setHospitalContentForm((prev) => ({ ...prev, superSpecialitiesText: event.target.value }))} /></label>
                </div>
                <div className="settings-update-stack">
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">Seasonal guidance</p>
                      <h3>Patient update cards</h3>
                      <p className="panel-sub">Publish seasonal advice, camp notices, or simple hospital guidance with an image.</p>
                    </div>
                    <button className="secondary" type="button" onClick={addHospitalPatientUpdate}>Add update card</button>
                  </div>
                  {(hospitalContentForm.patientUpdates || []).map((item) => (
                    <article key={item.id} className="history-card subtle settings-update-card">
                      <div className="section-head">
                        <div>
                          <p className="micro strong">{item.title || "New patient update"}</p>
                          <p className="micro">This card appears on patient Home and in the Hospital feed.</p>
                        </div>
                        <button className="ghost" type="button" onClick={() => removeHospitalPatientUpdate(item.id)}>Remove</button>
                      </div>
                      <div className="form-row">
                        <label>Title<input type="text" value={item.title} onChange={(event) => updateHospitalPatientUpdate(item.id, 'title', event.target.value)} /></label>
                        <label>Season tag<input type="text" value={item.seasonTag} onChange={(event) => updateHospitalPatientUpdate(item.id, 'seasonTag', event.target.value)} placeholder="Summer, Monsoon, Camp..." /></label>
                        <label>Audience<select value={item.audience || 'all'} onChange={(event) => updateHospitalPatientUpdate(item.id, 'audience', event.target.value)}><option value="all">All patients</option><option value="pediatrics">Pediatrics</option><option value="women">Women</option><option value="elderly">Elderly</option><option value="diabetes">Diabetes</option></select></label>
                        <label>Status<select value={item.active === false ? 'inactive' : 'active'} onChange={(event) => updateHospitalPatientUpdate(item.id, 'active', event.target.value === 'active')}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                        <label>Start date<input type="date" value={item.startDate || ''} onChange={(event) => updateHospitalPatientUpdate(item.id, 'startDate', event.target.value)} /></label>
                        <label>End date<input type="date" value={item.endDate || ''} onChange={(event) => updateHospitalPatientUpdate(item.id, 'endDate', event.target.value)} /></label>
                      </div>
                      <div className="form-row">
                        <label>Summary<textarea rows={3} value={item.summary} onChange={(event) => updateHospitalPatientUpdate(item.id, 'summary', event.target.value)} /></label>
                        <label>Full guidance<textarea rows={5} value={item.body} onChange={(event) => updateHospitalPatientUpdate(item.id, 'body', event.target.value)} /></label>
                      </div>
                      <div className="form-row">
                        <label>
                          Add photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) uploadHospitalPatientUpdateImage(item.id, file)
                              event.target.value = ''
                            }}
                          />
                        </label>
                        <label>Image URL<input type="text" value={item.imageUrl || ''} onChange={(event) => updateHospitalPatientUpdate(item.id, 'imageUrl', event.target.value)} placeholder="/api/hospital-content/assets/..." /></label>
                      </div>
                      {item.imageUrl ? (
                        <div className="action-row">
                          <button className="ghost" type="button" onClick={() => updateHospitalPatientUpdate(item.id, 'imageUrl', '')}>
                            Remove photo
                          </button>
                        </div>
                      ) : null}
                      {item.imageUrl ? (
                        <div className="settings-update-preview">
                          <img src={resolveHospitalAssetUrl(item.imageUrl)} alt={item.title || 'Patient update preview'} className="settings-update-image" />
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {!(hospitalContentForm.patientUpdates || []).length ? (
                    <p className="micro">No patient update cards yet. Add one for seasonal care, camps, or hospital notices.</p>
                  ) : null}
                </div>
                <div className="action-row"><button className="primary" type="button" onClick={saveHospitalContent}>Save public content</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
