import { ProfileSnapshotCard } from "./ProfileSnapshotCard";

export function ProfileInlineEditor({
  t,
  profileEditMode,
  setProfileEditMode,
  profileForm,
  departments,
  profileDepartmentDoctors,
  saveProfile,
  requestAbhaVerification,
  updateProfileField,
  setProfileForm,
  profileStatus,
  abhaHistory = [],
}) {
  const abhaStatus = String(profileForm.abhaStatus || "not_linked").toLowerCase();
  return (
    <div className="panel">
      <h2>{t("profileTitle")}</h2>
      <p className="panel-sub">{t("profileSubtitle")}</p>
      <div className="action-row">
        <button className="secondary" type="button" onClick={() => setProfileEditMode((prev) => !prev)}>
          {profileEditMode ? "Close profile edit" : "Edit profile"}
        </button>
      </div>
      {!profileEditMode ? (
        <ProfileSnapshotCard
          profileForm={profileForm}
          departments={departments}
          profileDepartmentDoctors={profileDepartmentDoctors}
        />
      ) : null}
      {profileEditMode ? (
        <form className="form" onSubmit={saveProfile}>
          <div className="form-row">
            <label>
              {t("age")}
              <input type="number" min="0" value={profileForm.age} onChange={(event) => updateProfileField("age", event.target.value)} />
            </label>
            <label>
              Weight (kg)
              <input type="number" min="0" step="0.1" value={profileForm.weightKg} onChange={(event) => updateProfileField("weightKg", event.target.value)} />
            </label>
            <label>
              Height (cm)
              <input type="number" min="0" step="0.1" value={profileForm.heightCm} onChange={(event) => updateProfileField("heightCm", event.target.value)} />
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
          <div className="form-row">
            <label>
              Registration
              <select value={profileForm.registrationMode} onChange={(event) => updateProfileField("registrationMode", event.target.value)}>
                <option value="opd">OPD</option>
                <option value="pid">PID</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Contact no.
              <input type="tel" value={profileForm.phone} onChange={(event) => updateProfileField("phone", event.target.value)} />
            </label>
            <label>
              ABHA no. (optional)
              <input type="text" value={profileForm.abhaNumber} onChange={(event) => updateProfileField("abhaNumber", event.target.value)} />
            </label>
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
          </div>
          <div className="form-row">
            <label>
              ABHA address (optional)
              <input type="text" placeholder="name@abdm" value={profileForm.abhaAddress} onChange={(event) => updateProfileField("abhaAddress", event.target.value)} />
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
                    ? "ABHA details need correction. Update them, then request verification again."
                  : "Save ABHA details, then request verification from the portal."}
            </p>
            <div className="action-row">
              <button
                type="button"
                className="secondary"
                onClick={() => requestAbhaVerification?.()}
                disabled={!(profileForm.abhaNumber || profileForm.abhaAddress) || ["verified", "pending_verification"].includes(abhaStatus)}
              >
                {abhaStatus === "pending_verification" ? "Verification pending" : abhaStatus === "verification_rejected" ? "Request again" : "Request verification"}
              </button>
            </div>
            {abhaHistory.length ? (
              <p className="micro">
                Latest: {String(abhaHistory[0].action || "").replace(/_/g, " ")} • {new Date(abhaHistory[0].createdAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="form-row">
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
            <label>
              PIN code
              <input type="text" value={profileForm.pinCode} onChange={(event) => updateProfileField("pinCode", event.target.value)} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Emergency contact name
              <input type="text" value={profileForm.emergencyContactName} onChange={(event) => updateProfileField("emergencyContactName", event.target.value)} />
            </label>
            <label>
              Emergency contact phone
              <input type="tel" value={profileForm.emergencyContactPhone} onChange={(event) => updateProfileField("emergencyContactPhone", event.target.value)} />
            </label>
          </div>
          <label className="block">
            {t("conditions")}
            <input type="text" placeholder={t("conditionsPlaceholder")} value={profileForm.conditions} onChange={(event) => updateProfileField("conditions", event.target.value)} />
          </label>
          <label className="block">
            {t("allergies")}
            <input type="text" placeholder={t("allergiesPlaceholder")} value={profileForm.allergies} onChange={(event) => updateProfileField("allergies", event.target.value)} />
          </label>
          {profileStatus && <p className="micro">{profileStatus}</p>}
          <button className="primary full" type="submit">{t("saveProfile")}</button>
        </form>
      ) : null}
    </div>
  );
}
