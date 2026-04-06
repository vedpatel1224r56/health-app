export function ProfileSnapshotCard({ profileForm, departments, profileDepartmentDoctors }) {
  return (
    <div className="history-card">
      <p className="history-headline">Profile snapshot</p>
      <p className="micro">Registration: {(profileForm.registrationMode || "opd").toUpperCase()}</p>
    </div>
  );
}
