export const resolveApiBase = () => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol || "http:";
    const host = window.location.hostname || "localhost";
    return `${protocol}//${host}:8080`;
  }
  return "http://localhost:8080";
};

export const weekdayLabel = (day) =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(day)] || String(day);

export const initialPatientSearch = {
  firstName: "",
  lastName: "",
  patientId: "",
  dob: "",
  registrationDate: "",
};

export const initialVisitCreateForm = {
  departmentId: "",
  doctorId: "",
  scheduledAt: "",
  reason: "",
  visitType: "OPD",
  isFollowUp: true,
};

export const initialPatientCreateForm = {
  registrationMode: "opd",
  firstName: "",
  middleName: "",
  lastName: "",
  name: "",
  email: "",
  age: "",
  weightKg: "",
  heightCm: "",
  dateOfBirth: "",
  aadhaarNo: "",
  maritalStatus: "",
  referredBy: "",
  visitTime: "OPD",
  unitDepartmentId: "",
  unitDoctorId: "",
  sex: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
  bloodGroup: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export const initialHospitalProfileForm = {
  hospitalName: "",
  hospitalCode: "",
  contactPhone: "",
  contactEmail: "",
  addressLine: "",
  taluka: "",
  district: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
};

export const initialNewDepartmentForm = {
  name: "",
  description: "",
  active: true,
};

export const initialNewDoctorForm = {
  name: "",
  email: "",
  password: "",
  departmentId: "",
  qualification: "",
  inPersonFee: "",
  chatFee: "",
  videoFee: "",
  audioFee: "",
  active: true,
};

export const initialHospitalContentForm = {
  cashlessTitle: "",
  cashlessFacilityListText: "",
  tpaListText: "",
  corporateListText: "",
  tpaQueryPhone: "",
  scopeTitle: "",
  clinicalServicesText: "",
  stateOfTheArtText: "",
  services24x7Text: "",
  appointmentPhonesText: "",
  healthCheckupTitle: "",
  healthCheckupPlansText: "",
  ayushmanTitle: "",
  ayushmanBulletsText: "",
  ayushmanPhonesText: "",
  superSpecialitiesTitle: "",
  superSpecialitiesText: "",
  superSpecialitiesContact: "",
  patientUpdates: [],
};

export const initialStoreOrderForm = {
  patientId: "",
  appointmentId: "",
  itemSummary: "",
  fromStore: "",
  toStore: "",
  requestedBy: "",
  status: "requested",
  netAmount: "",
  notes: "",
};

export const initialDirectIndentForm = {
  patientId: "",
  appointmentId: "",
  indentSummary: "",
  fromStore: "",
  toStore: "",
  requestedBy: "",
  status: "requested",
  netAmount: "",
};

export const initialPharmacyIssueForm = {
  materialInOut: "out",
  inOutDate: "",
  supplierName: "",
  inOutType: "",
  patientId: "",
  appointmentId: "",
  status: "requested",
  requestedDate: "",
  requestedBy: "",
  fromStore: "",
  toStore: "",
  netAmount: "",
};

export const APPOINTMENT_STATUS_LABELS = {
  requested: "Requested",
  approved: "Scheduled",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const APPOINTMENT_STATUS_TRANSITIONS = {
  requested: ["approved", "cancelled"],
  approved: ["checked_in", "cancelled", "no_show"],
  checked_in: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export const normalizeAppointmentStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "scheduled") return "approved";
  return normalized || "requested";
};

export const appointmentStatusLabel = (value) =>
  APPOINTMENT_STATUS_LABELS[normalizeAppointmentStatus(value)] || String(value || "requested");

export const getAllowedAppointmentStatuses = (value) => {
  const current = normalizeAppointmentStatus(value);
  return [current, ...(APPOINTMENT_STATUS_TRANSITIONS[current] || [])];
};

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

export const validatePatientCreateDraft = (payload = {}) => {
  const errors = {};
  if (!String(payload.firstName || payload.name || "").trim()) errors.firstName = "First name is required.";
  if (!String(payload.lastName || "").trim()) errors.lastName = "Last name is required.";
  if (!String(payload.sex || "").trim()) errors.sex = "Sex is required.";
  if (!String(payload.unitDepartmentId || "").trim()) errors.unitDepartmentId = "Unit department is required.";
  if (!String(payload.unitDoctorId || "").trim()) errors.unitDoctorId = "Unit doctor is required.";
  if (!String(payload.visitTime || "").trim()) errors.visitTime = "Visit time is required.";
  if (digitsOnly(payload.phone).length !== 10) errors.phone = "Contact number must be 10 digits.";
  if (digitsOnly(payload.emergencyContactPhone).length !== 10) errors.emergencyContactPhone = "Emergency contact phone must be 10 digits.";
  if (digitsOnly(payload.aadhaarNo).length !== 12) errors.aadhaarNo = "Aadhaar must be 12 digits.";
  if (digitsOnly(payload.pinCode).length !== 6) errors.pinCode = "PIN code must be 6 digits.";
  if (!String(payload.maritalStatus || "").trim()) errors.maritalStatus = "Marital status is required.";
  if (!String(payload.dateOfBirth || "").trim()) errors.dateOfBirth = "Date of birth is required.";
  if (!String(payload.bloodGroup || "").trim()) errors.bloodGroup = "Blood group is required.";
  if (!String(payload.addressLine1 || payload.address || "").trim()) errors.addressLine1 = "Address line 1 is required.";
  if (!String(payload.city || "").trim()) errors.city = "City is required.";
  if (!String(payload.state || "").trim()) errors.state = "State is required.";
  if (!String(payload.emergencyContactName || "").trim()) errors.emergencyContactName = "Emergency contact name is required.";
  return errors;
};

export const validateHospitalProfileDraft = (payload = {}) => {
  const errors = {};
  if (!String(payload.hospitalName || "").trim()) errors.hospitalName = "Hospital name is required.";
  const contactPhone = digitsOnly(payload.contactPhone);
  if (contactPhone && contactPhone.length !== 10) errors.contactPhone = "Contact phone must be 10 digits.";
  const pinCode = digitsOnly(payload.pinCode);
  if (pinCode && pinCode.length !== 6) errors.pinCode = "PIN code must be 6 digits.";
  const email = String(payload.contactEmail || "").trim();
  if (email && !email.includes("@")) errors.contactEmail = "Contact email must be valid.";
  return errors;
};

export const validateHospitalContentDraft = (payload = {}) => {
  const errors = {};
  String(payload.healthCheckupPlansText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const [name = "", price = ""] = line.split(";");
      if (!name.trim()) errors[`healthPlan:${index}`] = "Health plan name is required.";
      if (price.trim() && Number.isNaN(Number(price.trim().replace(/[^\d.]/g, "")))) {
        errors[`healthPlanPrice:${index}`] = "Health plan price must be numeric.";
      }
    });
  String(payload.superSpecialitiesText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const [name = ""] = line.split(";");
      if (!name.trim()) errors[`superSpeciality:${index}`] = "Super-speciality department name is required.";
    });
  return errors;
};
