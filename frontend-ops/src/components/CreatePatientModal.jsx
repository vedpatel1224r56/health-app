export function CreatePatientModal({
  setShowCreatePatientModal,
  patientsStatus,
  createPatient,
  patientCreateForm,
  setPatientCreateForm,
  departments,
  unitDoctorsForCreate,
  activeVisitTypes,
}) {
  return (
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
              <select
                value={patientCreateForm.registrationMode}
                onChange={(event) =>
                  setPatientCreateForm((prev) => ({ ...prev, registrationMode: event.target.value }))
                }
              >
                <option value="opd">OPD</option>
                <option value="pid">PID</option>
              </select>
            </label>
            <label>
              First name
              <input
                type="text"
                value={patientCreateForm.firstName}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                required
              />
            </label>
            <label>
              Middle name
              <input
                type="text"
                value={patientCreateForm.middleName}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, middleName: event.target.value }))}
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={patientCreateForm.lastName}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Unit department
              <select
                value={patientCreateForm.unitDepartmentId}
                onChange={(event) =>
                  setPatientCreateForm((prev) => ({
                    ...prev,
                    unitDepartmentId: event.target.value,
                    unitDoctorId: '',
                  }))
                }
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={`new-patient-department-${department.id}`} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Unit doctor
              <select
                value={patientCreateForm.unitDoctorId}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, unitDoctorId: event.target.value }))}
              >
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
              <select
                value={patientCreateForm.visitTime}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, visitTime: event.target.value }))}
              >
                {activeVisitTypes.map((visitType) => (
                  <option key={`patient-create-visit-time-${visitType.code}`} value={visitType.code}>
                    {visitType.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Referred by (optional)
              <input
                type="text"
                value={patientCreateForm.referredBy}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, referredBy: event.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Contact no.
              <input
                type="tel"
                value={patientCreateForm.phone}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                required
              />
            </label>
            <label>
              Aadhaar no.
              <input
                type="text"
                value={patientCreateForm.aadhaarNo}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, aadhaarNo: event.target.value }))}
              />
            </label>
            <label>
              Marital status
              <select
                value={patientCreateForm.maritalStatus}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, maritalStatus: event.target.value }))}
              >
                <option value="">Select</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="widowed">Widowed</option>
                <option value="divorced">Divorced</option>
              </select>
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={patientCreateForm.dateOfBirth}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Weight (kg)
              <input
                type="number"
                min="0"
                step="0.1"
                value={patientCreateForm.weightKg}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, weightKg: event.target.value }))}
              />
            </label>
            <label>
              Height (cm)
              <input
                type="number"
                min="0"
                step="0.1"
                value={patientCreateForm.heightCm}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, heightCm: event.target.value }))}
              />
            </label>
            <label>
              Age
              <input
                type="number"
                min="0"
                max="120"
                value={patientCreateForm.age}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, age: event.target.value }))}
              />
            </label>
            <label>
              Sex
              <select
                value={patientCreateForm.sex}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, sex: event.target.value }))}
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label>
              Email (optional)
              <input
                type="email"
                value={patientCreateForm.email}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Address line 1
              <input
                type="text"
                value={patientCreateForm.addressLine1}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
              />
            </label>
            <label>
              Address line 2 (optional)
              <input
                type="text"
                value={patientCreateForm.addressLine2}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
              />
            </label>
            <label>
              City
              <input
                type="text"
                value={patientCreateForm.city}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </label>
            <label>
              State
              <input
                type="text"
                value={patientCreateForm.state}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, state: event.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Blood group
              <select
                value={patientCreateForm.bloodGroup}
                onChange={(event) => setPatientCreateForm((prev) => ({ ...prev, bloodGroup: event.target.value }))}
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
            <label>
              PIN code
              <input
                type="text"
                value={patientCreateForm.pinCode}
                onChange={(event) =>
                  setPatientCreateForm((prev) => ({ ...prev, pinCode: event.target.value }))
                }
              />
            </label>
            <label>
              Country
              <input
                type="text"
                value={patientCreateForm.country}
                onChange={(event) =>
                  setPatientCreateForm((prev) => ({ ...prev, country: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Emergency contact name
              <input
                type="text"
                value={patientCreateForm.emergencyContactName}
                onChange={(event) =>
                  setPatientCreateForm((prev) => ({ ...prev, emergencyContactName: event.target.value }))
                }
              />
            </label>
            <label>
              Emergency contact phone
              <input
                type="tel"
                value={patientCreateForm.emergencyContactPhone}
                onChange={(event) =>
                  setPatientCreateForm((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))
                }
              />
            </label>
          </div>
          <button className="primary" type="submit">Create patient</button>
        </form>
      </div>
    </div>
  )
}
