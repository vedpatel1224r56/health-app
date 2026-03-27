const crypto = require("crypto");

const createPublicId = () => crypto.randomBytes(8).toString("hex");
const createShareCode = () => String(Math.floor(100000 + Math.random() * 900000));
const buildPatientUid = (userId) => `PID${String(userId).padStart(6, "0")}`;
const buildRequestNo = (prefix = "REQ") => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${datePart}-${rand}`;
};

const normalizePatientUpdate = (item = {}, defaults = {}) => ({
  id: String(item.id || defaults.id || createPublicId()),
  title: String(item.title || defaults.title || "").trim(),
  summary: String(item.summary || defaults.summary || "").trim(),
  body: String(item.body || defaults.body || "").trim(),
  imageUrl: String(item.imageUrl || defaults.imageUrl || "").trim(),
  seasonTag: String(item.seasonTag || defaults.seasonTag || "").trim(),
  audience: String(item.audience || defaults.audience || "all").trim() || "all",
  startDate: String(item.startDate || defaults.startDate || "").trim(),
  endDate: String(item.endDate || defaults.endDate || "").trim(),
  active: item.active !== false,
});

const defaultHospitalPublicContent = () => ({
  cashless: {
    title: "Cashless Facility Available",
    cashlessFacilityList: [
      "UNITED INDIA INS. CO. LTD. (All TPA)",
      "THE NEW INDIA ASS. CO. LTD. (All TPA)",
      "NATIONAL INS. (VIPUL, MD INDIA TPA, MEDSAVE)",
      "IFFCO-TOKIO-PARAMOUNT, MEDSAVE TPA (Corporate policy only)",
      "SBI GEN. INS. CO. LTD.",
      "BHARTI AXA GEN. INS. CO. LTD. (PARAMOUNT, HEALTH INDIA INS. TPA)",
      "TATA AIG GEN. INS. CO. LTD.",
      "MAGMA HDI GEN. INS. (FHPL & HEALTH INDIA TPA)",
      "KOTAK MAHINDRA GEN. INS. (FHPL TPA)",
      "LIBERTY GEN. INS. (MEDI ASSIST)",
      "BAJAJ ALLIANZ GEN. INS.",
      "GO DIGIT GEN. INS. CO. LTD. (PARAMOUNT)",
      "CHOLAMANDALAM MS GEN. INS. CO. LTD (MEDI ASSIST)",
      "ACKO GEN. INS. (FHPL & MEDI ASSIST TPA)",
      "ICICI LOMBARD (RAKSHA & PARAMOUNT)",
      "ROYAL SUNDARAM (PARAMOUNT/RAKSHA/HEALTH INDIA/FHPL)",
      "NATIONAL (HERITAGE TPA)",
    ],
    tpaList: [
      "United Health Care Parekh Insurance TPA",
      "Medi Assist Insurance TPA",
      "MDIndia Health Insurance TPA",
      "Paramount Health Services & Insurance TPA",
      "Heritage Health Insurance TPA",
      "Family Health Plan Insurance",
      "TPA Raksha Health Insurance",
      "TPA Medsave Health Insurance",
      "TPA Genins India Insurance",
      "TPA Health India Insurance TPA",
      "Vipul (Vidal Health) Medcorp Insurance TPA",
      "Health Insurance TPA",
      "East West Assist Insurance (VOLVO TPA)",
    ],
    corporateList: [
      "CGHS - Central Government Health Scheme",
      "VMSS - Vadodara Mahanagar Seva Sadan",
      "CENTRAL UNIVERSITY OF GUJARAT",
      "RAILWAY",
      "AIRPORT AUTHORITY OF INDIA LTD",
      "GSFC",
      "GACL",
      "GAIL",
      "VOITH HYDRO",
      "APOLLO TYRE",
      "SCHNEIDER ELECTRICALS",
      "PGP Glass Pvt. Ltd. - Jambusar",
      "GUVNL",
      "GSECL",
      "GETCO",
      "MGVCL",
      "UGVCL",
      "PGVCL",
      "DGVCL",
    ],
    tpaQueryPhone: "6359688442",
  },
  scopeOfServices: {
    title: "Scope of Services",
    clinicalServices: [
      "Cardiology And Cardiothoracic Department",
      "Laparoscopic, Endoscopic & General Surgery Department",
      "Trauma, Joint, Ortho, Spine & Arthroscopic Surgery",
      "Neurology And Neurosurgery Department",
      "Nephrology and Uro Surgery Department",
      "General Medicine & Advance Critical Care Department",
      "Gynaecology Department",
      "ENT Department",
      "Advanced Pediatric Department (8 Bedded NICU)",
      "Pulmonology Department",
      "Dermatology Department",
      "Psychiatric Department",
      "Radiology & CT Scan Imaging Center",
      "Vascular Department",
      "Ophthalmology Department",
      "Dental Department",
      "Physiotherapy Department",
      "Plastic And Reconstructive Surgery Department",
      "Oncology And Onco-surgery Department",
      "Gastroenterology and GI Surgery Department",
      "Dietary Department",
    ],
    stateOfTheArt: [
      "Cath Lab | CTOT",
      "CT Scan",
      "ICCU | CCU",
      "NICU | PICU",
      "Dialysis Unit",
      "Modular operation theatres",
      "All categories of rooms",
    ],
    services24x7: [
      "Emergency and Trauma Unit",
      "Dialysis Unit",
      "ICCU | CCU",
      "NICU | PICU",
      "Laboratory",
      "Radiology",
      "Pharmacy",
      "ICU on Wheels",
    ],
    appointmentPhones: ["6359688442", "7575048844"],
  },
  healthCheckup: {
    title: "Health Check-up",
    plans: [
      {
        name: "Standard Plan",
        price: "Rs. 1999/-",
        includes: [
          "CBC (24 parameters)",
          "RBS",
          "Sr. Creatinine",
          "Blood Group",
          "Lipid Profile (8 parameters)",
          "SGPT",
          "Urine R/M",
          "ECG",
          "Orthopedic Physician Consultation",
          "Free online/offline consultation on any one specialist doctor",
        ],
      },
      {
        name: "Executive Check-up",
        price: "Rs. 3999/-",
        includes: [
          "CBC (24 parameters)",
          "RBS",
          "Sr. Creatinine",
          "Blood Group",
          "Lipid Profile (8 parameters)",
          "LFT",
          "T3/T4/TSH",
          "Vitamin B12",
          "Vitamin D3",
          "Urine R/M",
          "ECG",
          "USG whole abdomen",
          "Orthopedic Physician / General Surgeon Consultation",
          "Free online/offline specialist consultation within 30 days",
        ],
      },
      {
        name: "Healthy Heart Check-up",
        price: "Rs. 1099/-",
        includes: [
          "CBC",
          "RBS",
          "Lipid Profile",
          "ECG",
          "2D Echo screening",
        ],
      },
      {
        name: "Coronary Angiography",
        price: "Rs. 4999/-",
        includes: ["Coronary angiography consultation package"],
      },
      {
        name: "Dental Care Check-up",
        price: "Rs. 500/-",
        includes: ["Dental consultation", "Scaling", "Polishing"],
      },
    ],
  },
  ayushman: {
    title: "Ayushman Card",
    bullets: [
      "Ayushman card holders can avail treatment without direct cash payment.",
      "Card activation required before admission or major procedure.",
      "Bring Ayushman card, Aadhaar card, and patient photo ID.",
      "Eligibility and package approval depends on scheme rules.",
      "Hospital desk assists with scheme verification and onboarding.",
    ],
    helpPhones: ["7575048844", "6359688440", "6359688442"],
  },
  superSpecialities: {
    title: "Our Super-Specialities",
    departments: [
      {
        name: "Cardiology Department",
        points: [
          "ECG / ECHO",
          "Angiography and angioplasty support",
          "Cardiac surgery and advanced management",
        ],
      },
      {
        name: "Kidney Department",
        points: ["Dialysis and critical renal care", "Kidney surgery and advanced treatment", "Stone and prostate surgery"],
      },
      {
        name: "Joint Replacement / Arthroscopic Department",
        points: ["Knee and hip replacement (TKR/THR)", "Arthroscopy and sports injury treatment"],
      },
      {
        name: "Spine Department",
        points: ["Slip disc and complex spine disorder treatment"],
      },
      {
        name: "Laparoscopic and General Surgery",
        points: ["Complex minimally invasive surgeries", "All categories of general surgical procedures"],
      },
      {
        name: "ICU / Trauma / Emergency",
        points: ["ICU ventilator and advanced emergency support", "Critical care for severe trauma and emergencies"],
      },
      {
        name: "Neurology and Neurosurgery",
        points: ["EEG/NCV", "Stroke and seizure management", "Brain and spine neuro-surgical care"],
      },
    ],
    contactPhone: "7575048844",
  },
  patientUpdates: [],
});

const mergeHospitalPublicContent = (incoming = {}) => {
  const defaults = defaultHospitalPublicContent();
  return {
    cashless: {
      ...defaults.cashless,
      ...(incoming.cashless || {}),
      cashlessFacilityList:
        Array.isArray(incoming?.cashless?.cashlessFacilityList)
          ? incoming.cashless.cashlessFacilityList
          : defaults.cashless.cashlessFacilityList,
      tpaList: Array.isArray(incoming?.cashless?.tpaList) ? incoming.cashless.tpaList : defaults.cashless.tpaList,
      corporateList:
        Array.isArray(incoming?.cashless?.corporateList) ? incoming.cashless.corporateList : defaults.cashless.corporateList,
    },
    scopeOfServices: {
      ...defaults.scopeOfServices,
      ...(incoming.scopeOfServices || {}),
      clinicalServices:
        Array.isArray(incoming?.scopeOfServices?.clinicalServices)
          ? incoming.scopeOfServices.clinicalServices
          : defaults.scopeOfServices.clinicalServices,
      stateOfTheArt:
        Array.isArray(incoming?.scopeOfServices?.stateOfTheArt)
          ? incoming.scopeOfServices.stateOfTheArt
          : defaults.scopeOfServices.stateOfTheArt,
      services24x7:
        Array.isArray(incoming?.scopeOfServices?.services24x7)
          ? incoming.scopeOfServices.services24x7
          : defaults.scopeOfServices.services24x7,
      appointmentPhones:
        Array.isArray(incoming?.scopeOfServices?.appointmentPhones)
          ? incoming.scopeOfServices.appointmentPhones
          : defaults.scopeOfServices.appointmentPhones,
    },
    healthCheckup: {
      ...defaults.healthCheckup,
      ...(incoming.healthCheckup || {}),
      plans: Array.isArray(incoming?.healthCheckup?.plans) ? incoming.healthCheckup.plans : defaults.healthCheckup.plans,
    },
    ayushman: {
      ...defaults.ayushman,
      ...(incoming.ayushman || {}),
      bullets: Array.isArray(incoming?.ayushman?.bullets) ? incoming.ayushman.bullets : defaults.ayushman.bullets,
      helpPhones:
        Array.isArray(incoming?.ayushman?.helpPhones) ? incoming.ayushman.helpPhones : defaults.ayushman.helpPhones,
    },
    superSpecialities: {
      ...defaults.superSpecialities,
      ...(incoming.superSpecialities || {}),
      departments:
        Array.isArray(incoming?.superSpecialities?.departments)
          ? incoming.superSpecialities.departments
          : defaults.superSpecialities.departments,
    },
    patientUpdates: Array.isArray(incoming?.patientUpdates)
      ? incoming.patientUpdates.map((item) => normalizePatientUpdate(item))
      : defaults.patientUpdates.map((item) => normalizePatientUpdate(item)),
  };
};

module.exports = {
  createPublicId,
  createShareCode,
  buildPatientUid,
  buildRequestNo,
  defaultHospitalPublicContent,
  mergeHospitalPublicContent,
};
