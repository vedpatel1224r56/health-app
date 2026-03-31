export function ProfileEditModal({
  user,
  setProfileEditMode,
  saveProfile,
  profileWizardStep,
  setProfileWizardStep,
  profileForm,
  updateProfileField,
  setProfileForm,
  departments,
  profileDepartmentDoctors,
  profileValidationErrors,
  profileStepReady,
  profileStatus,
  abhaHistory,
  requestAbhaVerification,
  t,
}) {
  const abhaStatus = String(profileForm.abhaStatus || "not_linked").toLowerCase();
  const canRequestVerification =
    (profileForm.abhaNumber || profileForm.abhaAddress) &&
    !["verified", "pending_verification"].includes(abhaStatus);
  return (
    <div className="modal-backdrop" onClick={() => setProfileEditMode(false)}>
      <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Edit profile</h2>
            <p className="panel-sub">{user?.name || "-"} • {user?.email || "-"}</p>
          </div>
          <button className="ghost" type="button" onClick={() => setProfileEditMode(false)}>
            Close
          </button>
        </div>
        <form className="form" onSubmit={saveProfile}>
          <p className="micro">Step {profileWizardStep} of 4</p>
          {profileWizardStep === 1 && (
            <>
              <div className="form-row">
                <label>
                  Full name
                  <input type="text" value={profileForm.fullName} onChange={(event) => updateProfileField("fullName", event.target.value)} required />
                </label>
                <label>
                  {t("email")}
                  <input type="email" value={profileForm.email} onChange={(event) => updateProfileField("email", event.target.value)} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Registration
                  <select value={profileForm.registrationMode} onChange={(event) => updateProfileField("registrationMode", event.target.value)}>
                    <option value="opd">OPD</option>
                    <option value="pid">PID</option>
                  </select>
                </label>
              </div>
            </>
          )}
          {profileWizardStep === 2 && (
            <>
              <div className="form-row">
                <label>
                  {t("age")}
                  <input type="number" min="0" value={profileForm.age} onChange={(event) => updateProfileField("age", event.target.value)} />
                </label>
                <label>
                  Weight (kg)
                  <input type="number" min="0" step="0.1" value={profileForm.weightKg} onChange={(event) => updateProfileField("weightKg", event.target.value)} />
                  {profileValidationErrors.weightKg ? <span className="error">{profileValidationErrors.weightKg}</span> : null}
                </label>
                <label>
                  Height (cm)
                  <input type="number" min="0" step="0.1" value={profileForm.heightCm} onChange={(event) => updateProfileField("heightCm", event.target.value)} />
                  {profileValidationErrors.heightCm ? <span className="error">{profileValidationErrors.heightCm}</span> : null}
                </label>
              </div>
              <div className="form-row">
                <label>
                  {t("sex")}
                  <select value={profileForm.sex} onChange={(event) => updateProfileField("sex", event.target.value)}>
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </label>
              </div>
            </>
          )}
          {profileWizardStep === 3 && (
            <>
              <div className="form-row">
                <label>
                  Contact no.
                  <input type="tel" value={profileForm.phone} onChange={(event) => updateProfileField("phone", event.target.value)} />
                  {profileValidationErrors.phone ? <span className="error">{profileValidationErrors.phone}</span> : null}
                </label>
                <label>
                  ABHA no. (optional)
                  <input type="text" value={profileForm.abhaNumber} onChange={(event) => updateProfileField("abhaNumber", event.target.value)} />
                  {profileValidationErrors.abhaNumber ? <span className="error">{profileValidationErrors.abhaNumber}</span> : null}
                </label>
              </div>
              <div className="form-row">
                <label>
                  ABHA address (optional)
                  <input type="text" placeholder="name@abdm" value={profileForm.abhaAddress} onChange={(event) => updateProfileField("abhaAddress", event.target.value)} />
                  {profileValidationErrors.abhaAddress ? <span className="error">{profileValidationErrors.abhaAddress}</span> : null}
                </label>
                <label>
                  ABHA status
                  <input type="text" value={String(profileForm.abhaStatus || "not_linked").replace(/_/g, " ")} readOnly />
                </label>
              </div>
              <div className="history-card">
                <p className="history-headline">ABHA verification</p>
                <p className="micro">
                  {abhaStatus === "verified"
                    ? "ABHA is marked verified on this profile."
                    : abhaStatus === "pending_verification"
                      ? "Verification request is pending hospital review."
                      : abhaStatus === "verification_rejected"
                        ? "ABHA details need correction. Update the fields if needed, then request verification again."
                      : "Save ABHA details, then request verification so the hospital team can review it."}
                </p>
                <div className="action-row">
                  <button
                    type="button"
                    className="secondary"
                    onClick={requestAbhaVerification}
                    disabled={!canRequestVerification}
                  >
                    {abhaStatus === "pending_verification" ? "Verification pending" : abhaStatus === "verification_rejected" ? "Request again" : "Request verification"}
                  </button>
                </div>
                {abhaHistory?.length ? (
                  <div className="history-list compact-list" style={{ marginTop: 12 }}>
                    {abhaHistory.slice(0, 3).map((event) => (
                      <div key={event.id} className="history-card">
                        <p className="history-headline">
                          {String(event.action || "").replace(/_/g, " ")}
                        </p>
                        <p className="micro">
                          {new Date(event.createdAt).toLocaleString()} • {String(event.status || "").replace(/_/g, " ")}
                        </p>
                        {event.notes ? <p className="micro">{event.notes}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="form-row">
                <label>
                  Marital status
                  <select value={profileForm.maritalStatus} onChange={(event) => updateProfileField("maritalStatus", event.target.value)}>
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </label>
                <label>
                  Date of birth
                  <input type="date" value={profileForm.dateOfBirth} onChange={(event) => updateProfileField("dateOfBirth", event.target.value)} />
                </label>
                <label>
                  Blood group
                  <select value={profileForm.bloodGroup} onChange={(event) => updateProfileField("bloodGroup", event.target.value)}>
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
            </>
          )}
          {profileWizardStep === 4 && (
            <>
              <div className="form-row">
                <label>
                  Address line 1
                  <input type="text" value={profileForm.addressLine1} onChange={(event) => updateProfileField("addressLine1", event.target.value)} />
                </label>
                <label>
                  Address line 2 (optional)
                  <input type="text" value={profileForm.addressLine2} onChange={(event) => updateProfileField("addressLine2", event.target.value)} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  City
                  <input type="text" value={profileForm.city} onChange={(event) => updateProfileField("city", event.target.value)} />
                </label>
                <label>
                  State
                  <input type="text" value={profileForm.state} onChange={(event) => updateProfileField("state", event.target.value)} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  PIN code
                  <input type="text" value={profileForm.pinCode} onChange={(event) => updateProfileField("pinCode", event.target.value)} />
                  {profileValidationErrors.pinCode ? <span className="error">{profileValidationErrors.pinCode}</span> : null}
                </label>
                <label>
                  Emergency contact name
                  <input type="text" value={profileForm.emergencyContactName} onChange={(event) => updateProfileField("emergencyContactName", event.target.value)} />
                </label>
                <label>
                  Emergency contact phone
                  <input type="tel" value={profileForm.emergencyContactPhone} onChange={(event) => updateProfileField("emergencyContactPhone", event.target.value)} />
                  {profileValidationErrors.emergencyContactPhone ? <span className="error">{profileValidationErrors.emergencyContactPhone}</span> : null}
                </label>
              </div>
              <label className="block">
                {t("conditions")}
                <input type="text" value={profileForm.conditions} onChange={(event) => updateProfileField("conditions", event.target.value)} />
              </label>
              <label className="block">
                {t("allergies")}
                <input type="text" value={profileForm.allergies} onChange={(event) => updateProfileField("allergies", event.target.value)} />
              </label>
            </>
          )}
          <div className="action-row">
            <button type="button" className="ghost" onClick={() => setProfileWizardStep((prev) => Math.max(1, prev - 1))} disabled={profileWizardStep === 1}>
              Back
            </button>
            {profileWizardStep < 4 ? (
              <button type="button" className="secondary" onClick={() => setProfileWizardStep((prev) => Math.min(4, prev + 1))} disabled={!profileStepReady}>
                Next
              </button>
            ) : (
              <button className="primary" type="submit" disabled={!profileStepReady}>
                {t("saveProfile")}
              </button>
            )}
          </div>
          {profileStatus && <p className="micro">{profileStatus}</p>}
        </form>
      </div>
    </div>
  );
}
