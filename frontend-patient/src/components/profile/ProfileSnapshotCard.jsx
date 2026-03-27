export function ProfileSnapshotCard({ profileForm, departments, profileDepartmentDoctors }) {
  return (
    <div className="history-card">
      <p className="history-headline">Profile snapshot</p>
      <p className="micro">Registration: {(profileForm.registrationMode || "opd").toUpperCase()}</p>
      <p className="micro">ABHA status: {String(profileForm.abhaStatus || "not_linked").replace(/_/g, " ")}</p>
      <p className="micro">ABHA no.: {profileForm.abhaNumber || "-"}</p>
      <p className="micro">ABHA address: {profileForm.abhaAddress || "-"}</p>
    </div>
  );
}
