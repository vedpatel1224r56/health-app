import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  computeProfileCompletion,
  sortLabs,
  sortPharmacies,
  formatMarketplaceStatus as formatMarketplaceStatusLabel,
  normalizeHospitalContent,
  normalizeLabListings,
  normalizePharmacyListings,
} from "./patientOpsUtils";
import {
  resolveApiBase,
  MARKETPLACE_REFRESH_KEY,
  defaultProfileForm,
  copy,
  commonSymptoms,
  redFlagOptions,
  dentalSymptomsOptions,
  dentalRedFlagOptions,
  symptomTranslations,
  fallbackTriage,
} from "./patientOpsConfig";
import { MarketplaceView } from "./components/marketplace/MarketplaceView";
import { HospitalContentView } from "./components/hospital-content/HospitalContentView";
import { PatientHomePanel } from "./components/patient-shell/PatientHomePanel";
import { AppointmentsPanel } from "./components/patient-shell/AppointmentsPanel";
import { AppointmentDetailModal } from "./components/patient-shell/AppointmentDetailModal";
import { TeleconsultRoomModal } from "./components/patient-shell/TeleconsultRoomModal";
import { TriagePanel } from "./components/patient-shell/TriagePanel";
import { AlertsPanel } from "./components/patient-shell/AlertsPanel";
import { ReportsPanel } from "./components/patient-shell/ReportsPanel";
import { ClinicalRecordsPanel } from "./components/patient-shell/ClinicalRecordsPanel";
import { ProfileEditModal } from "./components/profile/ProfileEditModal";
import { ProfileInlineEditor } from "./components/profile/ProfileInlineEditor";
import { GuestLanding } from "./components/routes/GuestLanding";
import { ClinicPage } from "./components/routes/ClinicPage";
import { ResetPasswordPage } from "./components/routes/ResetPasswordPage";
import { EmergencyCardPage } from "./components/routes/EmergencyCardPage";
import { DoctorViewPage } from "./components/routes/DoctorViewPage";
import { DoctorConsolePage } from "./components/routes/DoctorConsolePage";
import { LegacyPortalShell } from "./components/routes/LegacyPortalShell";
import { useProfileSectionActions } from "./hooks/useProfileSectionActions";
import { useTriageSectionActions } from "./hooks/useTriageSectionActions";

const API_BASE = resolveApiBase();
let razorpayScriptPromise = null;

const ensureRazorpayScript = () => {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [activePatientTab, setActivePatientTab] = useState("home");
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [appointmentsViewTab, setAppointmentsViewTab] = useState("future");
  const [authToken, setAuthToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [language, setLanguage] = useState("en");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showTriageDisclaimer, setShowTriageDisclaimer] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [resetForm, setResetForm] = useState({
    email: "",
    token: "",
    newPassword: "",
  });
  const [resetStatus, setResetStatus] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersStatus, setAdminUsersStatus] = useState("");
  const [adminSavingUserId, setAdminSavingUserId] = useState(null);
  const [adminOps, setAdminOps] = useState(null);
  const [adminOpsStatus, setAdminOpsStatus] = useState("");
  const [opsQueue, setOpsQueue] = useState([]);
  const [opsQueueStatus, setOpsQueueStatus] = useState("");
  const [billingDrafts, setBillingDrafts] = useState({});

  const [profileForm, setProfileForm] = useState(defaultProfileForm());
  const [profileStatus, setProfileStatus] = useState("");
  const [profileEditMode, setProfileEditMode] = useState(false);
  const mapProfilePayloadToForm = (profile = {}, account = user) => ({
    fullName: profile.name || account?.name || "",
    email: profile.email || account?.email || "",
    age: profile.age || "",
    weightKg: profile.weight_kg || "",
    heightCm: profile.height_cm || "",
    sex: String(profile.sex || "").trim().toLowerCase(),
    conditions: (profile.conditions || []).join(", "),
    allergies: (profile.allergies || []).join(", "),
    region: profile.region || "",
    phone: profile.phone || "",
    abhaNumber: profile.abha_number || "",
    abhaAddress: profile.abha_address || "",
    abhaStatus: profile.abha_status || "not_linked",
    aadhaarNo: profile.aadhaar_no || "",
    maritalStatus: profile.marital_status || "",
    dateOfBirth: profile.date_of_birth || "",
    bloodGroup: profile.blood_group || "",
    addressLine1: profile.address_line_1 || profile.address || "",
    addressLine2: profile.address_line_2 || "",
    city: profile.city || "",
    state: profile.state || "",
    country: profile.country || "India",
    pinCode: profile.pin_code || "",
    emergencyContactName: profile.emergency_contact_name || "",
    emergencyContactPhone: profile.emergency_contact_phone || "",
    registrationMode: profile.registration_mode || "opd",
    visitTime: profile.visit_time || "OPD",
    unitDepartmentId: profile.unit_department_id ? String(profile.unit_department_id) : "",
    unitDoctorId: profile.unit_doctor_id ? String(profile.unit_doctor_id) : "",
  });

  const [triageForm, setTriageForm] = useState({
    age: "",
    sex: "Female",
    durationDays: 0,
    severity: 0,
    symptoms: [],
    additionalSymptoms: "",
    redFlags: [],
    photoFile: null,
    photoPreview: "",
  });
  const [triageType, setTriageType] = useState("general");
  const [dentalForm, setDentalForm] = useState({
    durationDays: 0,
    painScale: 0,
    symptoms: [],
    redFlags: [],
    hotColdTrigger: false,
    swelling: false,
  });

  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [sharePass, setSharePass] = useState(null);
  const [sharePassStatus, setSharePassStatus] = useState("");
  const [doctorViewData, setDoctorViewData] = useState(null);
  const [doctorViewLoading, setDoctorViewLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [doctorRatingStatus, setDoctorRatingStatus] = useState("");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [activeMemberId, setActiveMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    relation: "",
    age: "",
    sex: "Female",
    bloodType: "",
    conditions: "",
    allergies: "",
  });
  const [familyStatus, setFamilyStatus] = useState("");
  const [records, setRecords] = useState([]);
  const [recordStatus, setRecordStatus] = useState("");
  const [reportCatalog, setReportCatalog] = useState([]);
  const [reportExtractionCapabilities, setReportExtractionCapabilities] = useState(null);
  const [reportInsights, setReportInsights] = useState(null);
  const [reportInsightsStatus, setReportInsightsStatus] = useState("");
  const [reportInsightsMonths, setReportInsightsMonths] = useState(6);
  const [recordAnalysisDrafts, setRecordAnalysisDrafts] = useState({});
  const [activeAnalysisRecordId, setActiveAnalysisRecordId] = useState(null);
  const [shareHistory, setShareHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teleconsults, setTeleconsults] = useState([]);
  const [teleLoading, setTeleLoading] = useState(false);
  const [teleStatus, setTeleStatus] = useState("");
  const [teleForm, setTeleForm] = useState({
    mode: "video",
    concern: "",
    preferredSlot: "",
    phone: "",
  });
  const [careRequestMode, setCareRequestMode] = useState("in_person");
  const [activeConsultId, setActiveConsultId] = useState(null);
  const [consultMessages, setConsultMessages] = useState([]);
  const [consultCallEvents, setConsultCallEvents] = useState([]);
  const [consultMessageText, setConsultMessageText] = useState("");
  const [consultConsentSummary, setConsultConsentSummary] = useState(null);
  const [consultMessageStatus, setConsultMessageStatus] = useState("");
  const [paymentGatewayConfig, setPaymentGatewayConfig] = useState({ enabled: false, provider: "razorpay", keyId: "" });
  const [consultPaymentStatus, setConsultPaymentStatus] = useState("");
  const [paymentLoadingKey, setPaymentLoadingKey] = useState("");
  const [teleconsultRoomOpen, setTeleconsultRoomOpen] = useState(false);
  const [doctorConsoleForm, setDoctorConsoleForm] = useState({
    status: "requested",
    meetingUrl: "",
  });
  const [doctorConsoleStatus, setDoctorConsoleStatus] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsStatus, setAppointmentsStatus] = useState("");
  const [appointmentDetail, setAppointmentDetail] = useState(null);
  const [appointmentTimeline, setAppointmentTimeline] = useState([]);
  const [appointmentActionStatus, setAppointmentActionStatus] = useState("");
  const [appointmentRescheduleForm, setAppointmentRescheduleForm] = useState({
    scheduledAt: "",
    reason: "",
  });
  const [departments, setDepartments] = useState([]);
  const [departmentDoctors, setDepartmentDoctors] = useState([]);
  const [profileDepartmentDoctors, setProfileDepartmentDoctors] = useState([]);
  const [appointmentForm, setAppointmentForm] = useState({
    departmentId: "",
    doctorId: "",
    reason: "",
    appointmentDate: "",
    slotTime: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotStatus, setSlotStatus] = useState("");
  const [encounters, setEncounters] = useState([]);
  const [encounterStatus, setEncounterStatus] = useState("");
  const [activeEncounterId, setActiveEncounterId] = useState(null);
  const [encounterDetail, setEncounterDetail] = useState(null);
  const [labMode, setLabMode] = useState("home");
  const [labArea, setLabArea] = useState("all");
  const [labAreas, setLabAreas] = useState([]);
  const [activeLabId, setActiveLabId] = useState(null);
  const [labSort, setLabSort] = useState("cheapest");
  const [labAreaSearch, setLabAreaSearch] = useState("");
  const [pharmacyMode, setPharmacyMode] = useState("home_delivery");
  const [pharmacySort, setPharmacySort] = useState("fastest");
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [labListings, setLabListings] = useState([]);
  const [pharmacyListings, setPharmacyListings] = useState([]);
  const [marketplaceRequests, setMarketplaceRequests] = useState([]);
  const [marketplaceAnalytics, setMarketplaceAnalytics] = useState({
    overall: { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
    lab: { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
    pharmacy: { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
  });
  const [marketplaceTimelineByRequest, setMarketplaceTimelineByRequest] = useState({});
  const [marketplaceTimelineLoadingByRequest, setMarketplaceTimelineLoadingByRequest] = useState({});
  const [marketplaceTimelineOpenByRequest, setMarketplaceTimelineOpenByRequest] = useState({});
  const [marketplaceStatus, setMarketplaceStatus] = useState("");
  const [marketplaceActionStatus, setMarketplaceActionStatus] = useState("");
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [labRequestsView, setLabRequestsView] = useState("present");
  const [pharmacyRequestsView, setPharmacyRequestsView] = useState("present");
  const [hospitalContent, setHospitalContent] = useState(null);
  const [hospitalContentStatus, setHospitalContentStatus] = useState('');
  const [activeHospitalSection, setActiveHospitalSection] = useState("updates");
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingActionQueue, setPendingActionQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [doctorChartForm, setDoctorChartForm] = useState({
    appointmentId: "",
    chiefComplaint: "",
    findings: "",
    diagnosis: "",
    planText: "",
    followupDate: "",
    vitals: "",
  });
  const [doctorChartStatus, setDoctorChartStatus] = useState("");
  const [scheduleForm, setScheduleForm] = useState([
    { weekday: 1, startTime: "10:00", endTime: "13:00", slotMinutes: 20 },
    { weekday: 2, startTime: "10:00", endTime: "13:00", slotMinutes: 20 },
    { weekday: 3, startTime: "10:00", endTime: "13:00", slotMinutes: 20 },
    { weekday: 4, startTime: "10:00", endTime: "13:00", slotMinutes: 20 },
    { weekday: 5, startTime: "10:00", endTime: "13:00", slotMinutes: 20 },
  ]);
  const [scheduleStatus, setScheduleStatus] = useState("");
  const [noteForm, setNoteForm] = useState({ note: "", signature: "" });
  const [prescriptionForm, setPrescriptionForm] = useState({
    instructions: "",
    itemsText: "",
  });
  const [orderForm, setOrderForm] = useState({
    orderType: "lab",
    itemName: "",
    destination: "",
    notes: "",
  });
  const [clinicCode, setClinicCode] = useState("");
  const [clinicStatus, setClinicStatus] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [shareQr, setShareQr] = useState("");
  const [emergencyCard, setEmergencyCard] = useState(null);
  const [doctorLang, setDoctorLang] = useState("en");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [liveStats, setLiveStats] = useState({
    users: 0,
    triageCompleted: 0,
    doctorViews: 0,
    activeUsersToday: 0,
  });
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I can help with symptoms, triage steps, and what to do before clinic visits.",
    },
  ]);
  const [triageHistoryQuery, setTriageHistoryQuery] = useState("");
  const [triageHistoryLevel, setTriageHistoryLevel] = useState("all");
  const [triageDraftStatus, setTriageDraftStatus] = useState("");
  const [sharePasses, setSharePasses] = useState([]);
  const [sharePassExpiresMinutes, setSharePassExpiresMinutes] = useState(30);
  const [profileWizardStep, setProfileWizardStep] = useState(1);

  const currentPath = useMemo(() => window.location.pathname.replace(/\/+$/, "") || "/", []);
  const doctorCode = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "doctor-view" && parts[1]) return parts[1];
    return null;
  }, []);
  const clinicMode = useMemo(() => currentPath === "/clinic", [currentPath]);
  const doctorConsoleMode = useMemo(
    () => currentPath === "/doctor-console" || currentPath === "/doctor-dashboard",
    [currentPath],
  );
  const resetPasswordPageMode = useMemo(() => currentPath === "/reset-password", [currentPath]);
  const emergencyPublicId = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "emergency" && parts[1]) return parts[1];
    return null;
  }, []);
  const [emergencyData, setEmergencyData] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const clinicVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerIntervalRef = useRef(null);
  const recordsInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    const resetEmail = params.get("email");
    const resetToken = params.get("token") || params.get("otp");
    if (lang === "gu" || lang === "en") {
      setLanguage(lang);
      setDoctorLang(lang);
    }
    if (resetEmail || resetToken) {
      setResetForm((prev) => ({
        ...prev,
        email: resetEmail || prev.email,
        token: resetToken || prev.token,
      }));
    }
    setScannerSupported(
      Boolean(window.BarcodeDetector) && Boolean(navigator?.mediaDevices?.getUserMedia),
    );
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("health_triage_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.triageForm) {
        setTriageForm((prev) => ({
          ...prev,
          ...parsed.triageForm,
          photoFile: null,
          photoPreview: "",
        }));
      }
      if (parsed?.dentalForm) {
        setDentalForm((prev) => ({ ...prev, ...parsed.dentalForm }));
      }
      if (parsed?.triageType) setTriageType(parsed.triageType);
    } catch (error) {
      // ignore corrupted draft
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("health_pending_actions");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPendingActionQueue(parsed);
      }
    } catch (error) {
      // ignore invalid queue payload
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("health_pending_actions", JSON.stringify(pendingActionQueue));
  }, [pendingActionQueue]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const payload = {
      triageForm: {
        age: triageForm.age,
        sex: triageForm.sex,
        durationDays: triageForm.durationDays,
        severity: triageForm.severity,
        symptoms: triageForm.symptoms,
        additionalSymptoms: triageForm.additionalSymptoms,
        redFlags: triageForm.redFlags,
      },
      dentalForm,
      triageType,
    };
    localStorage.setItem("health_triage_draft", JSON.stringify(payload));
  }, [triageForm, dentalForm, triageType]);

  useEffect(() => {
    const saved = localStorage.getItem("health_user");
    const savedToken = localStorage.getItem("health_token");
    const savedRefreshToken = localStorage.getItem("health_refresh_token");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (error) {
        localStorage.removeItem("health_user");
      }
    }
    if (savedToken) {
      setAuthToken(savedToken);
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    const accepted = localStorage.getItem("health_disclaimer_accepted");
    if (!accepted) {
      setShowDisclaimer(true);
    }
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!authToken) return;
    let active = true;
    const validateSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) {
          const refreshedToken = await refreshAccessToken();
          if (!refreshedToken) throw new Error("invalid");
          const retry = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${refreshedToken}` },
          });
          if (!retry.ok) throw new Error("invalid");
          const retryData = await retry.json();
          if (active && retryData.user) {
            setUser(retryData.user);
            localStorage.setItem("health_user", JSON.stringify(retryData.user));
          }
          return;
        }
        const data = await response.json();
        if (active && data.user) {
          setUser(data.user);
          localStorage.setItem("health_user", JSON.stringify(data.user));
        }
      } catch (error) {
        if (active) {
          setAuthToken("");
          setRefreshToken("");
          setUser(null);
          localStorage.removeItem("health_user");
          localStorage.removeItem("health_token");
          localStorage.removeItem("health_refresh_token");
        }
      }
    };
    validateSession();
    return () => {
      active = false;
    };
  }, [authToken, refreshToken]);

  const t = (key) => copy[language][key] || copy.en[key] || key;
  const formatNumber = (value) => new Intl.NumberFormat(language === "gu" ? "gu-IN" : "en-IN").format(value || 0);
  const formatPriceLastUpdated = (value) => {
    if (!value) return "N/A";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "N/A";
    return dt.toLocaleDateString();
  };
  const translateSymptom = (label) =>
    symptomTranslations[language]?.[label] || label;
  const format = (text, params = {}) =>
    text.replace(/\{(\w+)\}/g, (_, key) => params[key] || "");
  const teleStatusLabel = (status) => {
    const map = {
      requested: t("teleStatusRequested"),
      scheduled: t("teleStatusScheduled"),
      in_progress: t("teleStatusInProgress"),
      completed: t("teleStatusCompleted"),
      cancelled: t("teleStatusCancelled"),
    };
    return map[status] || status;
  };
  const weekdayLabel = (weekday) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday] ||
    String(weekday);
  const formatMarketplaceStatus = formatMarketplaceStatusLabel;
  const formatFulfillmentTime = (minutes) => {
    const value = Number(minutes || 0);
    if (!value) return "-";
    if (value < 60) return `${value} min`;
    const h = Math.floor(value / 60);
    const m = value % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };
  const formatMarketplaceTimelineEvent = (event = {}) => {
    if (event.fromStatus && event.toStatus) {
      return `${formatMarketplaceStatus(event.fromStatus)} -> ${formatMarketplaceStatus(event.toStatus)}`;
    }
    if (event.toStatus) return formatMarketplaceStatus(event.toStatus);
    if (event.eventType === "created") return "Request created";
    return String(event.eventType || "Updated");
  };
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.listedPrice || 0), 0),
    [cartItems],
  );
  const enqueuePendingAction = (action) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setPendingActionQueue((prev) => [...prev, { ...action, id, createdAt: new Date().toISOString() }]);
  };
  const removePendingAction = (actionId) => {
    setPendingActionQueue((prev) => prev.filter((item) => item.id !== actionId));
  };
  const addToCart = (item) => {
    setCartItems((prev) => [
      ...prev,
      {
        ...item,
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      },
    ]);
  };
  const removeCartItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };
  const checkoutCart = async () => {
    if (!authToken) {
      setCheckoutStatus("Sign in first.");
      return;
    }
    if (!cartItems.length) {
      setCheckoutStatus("Your cart is empty.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutStatus("");
    try {
      for (const item of cartItems) {
        const response = await apiFetch(`${API_BASE}/api/marketplace/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: item.requestType,
            partnerId: item.partnerId,
            serviceName: item.serviceName,
            fulfillmentMode: item.fulfillmentMode,
            listedPrice: item.listedPrice,
            notes: [item.notes, checkoutAddress ? `Address: ${checkoutAddress}` : "", checkoutNotes]
              .filter(Boolean)
              .join(" • "),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to place order.");
        }
      }

      setCheckoutStatus("Orders placed successfully.");
      setCartItems([]);
      setCheckoutAddress("");
      setCheckoutNotes("");
      setCartOpen(false);
      await Promise.all([loadMarketplaceRequests(), loadMarketplaceAnalytics()]);
    } catch (error) {
      setCheckoutStatus(error.message || "Network error. Check backend connection.");
    } finally {
      setCheckoutLoading(false);
    }
  };
  const renderLabBookingActions = (lab, item) => (
    <div className="action-row">
      {item.homeCollectionAvailable && (
        <button
          className="secondary"
          type="button"
          onClick={() =>
            addToCart({
              requestType: "lab",
              partnerId: lab.id,
              partnerName: lab.partnerName,
              serviceName: item.serviceName,
              fulfillmentMode: "home_visit",
              listedPrice: item.homeVisitPrice !== null ? item.homeVisitPrice : item.price,
              notes: `${lab.partnerName} • ${item.serviceName} • home collection`,
            })
          }
        >
          Add home visit • Rs {item.homeVisitPrice !== null ? item.homeVisitPrice : item.price}
        </button>
      )}
      <button
        className="primary"
        type="button"
        onClick={() =>
          addToCart({
            requestType: "lab",
            partnerId: lab.id,
            partnerName: lab.partnerName,
            serviceName: item.serviceName,
            fulfillmentMode: "in_person",
            listedPrice: item.price,
            notes: `${lab.partnerName} • ${item.serviceName} • in-person`,
          })
        }
      >
        Add in-person • Rs {item.price}
      </button>
    </div>
  );

  const profileCompletion = useMemo(() => computeProfileCompletion(profileForm), [profileForm]);
  const isOpsUser = user?.role === "admin" || user?.role === "front_desk";
  const profileSummary = user
    ? format(t("safetySummaryAuthed"), { name: user.name || "User" })
    : t("safetySummary");

  const lastGuidance = history.length > 0 ? history[0] : null;
  const visibleHistory = historyExpanded ? history : history.slice(0, 3);
  const activeConsult = useMemo(
    () => teleconsults.find((consult) => consult.id === activeConsultId) || null,
    [teleconsults, activeConsultId],
  );
  const nowTs = Date.now();
  const requestedAppointments = useMemo(
    () =>
      appointments.filter((appointment) => String(appointment.status || "").toLowerCase() === "requested"),
    [appointments],
  );
  const futureAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const at = Date.parse(appointment.scheduled_at || "");
        return (
          !Number.isNaN(at) &&
          at >= nowTs &&
          ["approved", "checked_in"].includes(String(appointment.status || "").toLowerCase())
        );
      }),
    [appointments, nowTs],
  );
  const pastAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const at = Date.parse(appointment.scheduled_at || "");
        const status = String(appointment.status || "").toLowerCase();
        return (
          ["completed", "cancelled", "no_show"].includes(status) ||
          (!Number.isNaN(at) && at < nowTs)
        );
      }),
    [appointments, nowTs],
  );
  const requestedCare = useMemo(
    () =>
      teleconsults.filter((consult) =>
        ["requested", "scheduled", "in_progress"].includes(consult.status || "requested"),
      ),
    [teleconsults],
  );
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => Number(item.is_read) !== 1).length,
    [notifications],
  );
  const pendingServiceRequests = useMemo(
    () =>
      marketplaceRequests.filter((item) =>
        ["requested", "accepted", "sample_collected", "processing", "out_for_delivery", "ready_for_pickup"].includes(
          item.status,
        ),
      ),
    [marketplaceRequests],
  );
  const hospitalSections = useMemo(
    () => [
      {
        key: "updates",
        label: hospitalContent?.patientUpdates?.length ? "Hospital updates" : "Guidance",
      },
      {
        key: "cashless",
        label: hospitalContent?.sections?.cashless?.title || "Cashless Facility",
      },
      {
        key: "services",
        label: hospitalContent?.sections?.services?.title || "Scope of Services",
      },
      {
        key: "healthCheckup",
        label: hospitalContent?.sections?.healthCheckup?.title || "Health Check-up",
      },
      {
        key: "ayushman",
        label: hospitalContent?.sections?.ayushman?.title || "Ayushman Support",
      },
      {
        key: "specialities",
        label: hospitalContent?.sections?.specialities?.title || "Super-Specialities",
      },
    ],
    [hospitalContent],
  );
  const nextAppointment = useMemo(
    () => futureAppointments[0] || requestedAppointments[0] || null,
    [futureAppointments, requestedAppointments],
  );
  const latestHospitalUpdate = useMemo(
    () => hospitalContent?.patientUpdates?.[0] || null,
    [hospitalContent],
  );
  const followupDue = useMemo(() => {
    const now = Date.now();
    const due = encounters.find((encounter) => {
      const ts = Date.parse(encounter.followup_date || "");
      return !Number.isNaN(ts) && ts >= now;
    });
    return due || null;
  }, [encounters]);
  const filteredHistory = useMemo(() => {
    const query = triageHistoryQuery.trim().toLowerCase();
    return (history || []).filter((item) => {
      const levelMatch =
        triageHistoryLevel === "all" || String(item.result?.level || "unknown") === triageHistoryLevel;
      if (!levelMatch) return false;
      if (!query) return true;
      const haystack = [
        item.result?.headline || "",
        item.result?.urgency || "",
        (item.payload?.symptoms || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [history, triageHistoryLevel, triageHistoryQuery]);
  const profileValidationErrors = useMemo(() => {
    const errors = {};
    if (profileForm.phone && !/^\d{10}$/.test(String(profileForm.phone).replace(/\D/g, ""))) {
      errors.phone = "Contact number must be 10 digits.";
    }
    if (
      profileForm.emergencyContactPhone &&
      !/^\d{10}$/.test(String(profileForm.emergencyContactPhone).replace(/\D/g, ""))
    ) {
      errors.emergencyContactPhone = "Emergency contact phone must be 10 digits.";
    }
    if (profileForm.abhaNumber && !/^\d{14}$/.test(String(profileForm.abhaNumber).replace(/\D/g, ""))) {
      errors.abhaNumber = "ABHA number must be 14 digits.";
    }
    if (
      profileForm.abhaAddress &&
      !/^[a-z0-9][a-z0-9._-]{1,98}@[a-z][a-z0-9._-]{1,48}$/i.test(String(profileForm.abhaAddress).trim())
    ) {
      errors.abhaAddress = "ABHA address must look like name@abdm.";
    }
    if (profileForm.pinCode && !/^\d{6}$/.test(String(profileForm.pinCode).replace(/\D/g, ""))) {
      errors.pinCode = "PIN code must be 6 digits.";
    }
    if (profileForm.weightKg) {
      const weight = Number(profileForm.weightKg);
      if (Number.isNaN(weight) || weight <= 0 || weight > 500) {
        errors.weightKg = "Weight must be a valid value in kg.";
      }
    }
    if (profileForm.heightCm) {
      const height = Number(profileForm.heightCm);
      if (Number.isNaN(height) || height <= 0 || height > 300) {
        errors.heightCm = "Height must be a valid value in cm.";
      }
    }
    return errors;
  }, [profileForm.phone, profileForm.emergencyContactPhone, profileForm.abhaNumber, profileForm.abhaAddress, profileForm.pinCode, profileForm.weightKg, profileForm.heightCm]);
  const profileStepReady = useMemo(() => {
    if (profileWizardStep === 1) {
      return Boolean(
        profileForm.fullName.trim() &&
          profileForm.email.trim() &&
          profileForm.registrationMode,
      );
    }
    if (profileWizardStep === 2) {
      return Boolean(profileForm.sex && !profileValidationErrors.weightKg && !profileValidationErrors.heightCm);
    }
    if (profileWizardStep === 3) {
      return Boolean(
        profileForm.phone.trim() &&
          profileForm.maritalStatus &&
          profileForm.dateOfBirth &&
          profileForm.bloodGroup &&
          !profileValidationErrors.phone &&
          !profileValidationErrors.emergencyContactPhone &&
          !profileValidationErrors.pinCode,
      );
    }
    if (profileWizardStep === 4) {
      return Boolean(
        profileForm.addressLine1.trim() &&
          profileForm.city.trim() &&
          profileForm.state.trim() &&
          profileForm.pinCode.trim() &&
          profileForm.emergencyContactName.trim() &&
          profileForm.emergencyContactPhone.trim() &&
          !profileValidationErrors.emergencyContactPhone &&
          !profileValidationErrors.pinCode,
      );
    }
    return true;
  }, [profileWizardStep, profileForm, profileValidationErrors]);

  useEffect(() => {
    if (!activeConsult) return;
    setDoctorConsoleForm({
      status: activeConsult.status || "requested",
      meetingUrl: activeConsult.meetingUrl || "",
    });
  }, [activeConsult]);

  const signOut = () => {
    setAuthToken("");
    setRefreshToken("");
    setUser(null);
    setAuthError("");
    localStorage.removeItem("health_user");
    localStorage.removeItem("health_token");
    localStorage.removeItem("health_refresh_token");
  };

  const scrollToSection = (id) => {
    if (typeof document === "undefined") return;
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openProfileEditor = () => {
    setProfileEditMode(true);
  };

  const acceptDisclaimer = () => {
    localStorage.setItem("health_disclaimer_accepted", "true");
    setShowDisclaimer(false);
  };

  const openPatientTab = (tabKey) => {
    if (tabKey === "labs") {
      setActivePatientTab("home");
      return;
    }
    setActivePatientTab(tabKey);
    if (tabKey === "triage") {
      setShowTriageDisclaimer(true);
    }
  };

  const updateAuthField = (key, value) =>
    setAuthForm((prev) => ({ ...prev, [key]: value }));

  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      const endpoint = authMode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || "Unable to authenticate.");
        return;
      }

      if (!data.user) {
        setAuthError("Unable to authenticate.");
        return;
      }

      setUser(data.user);
      localStorage.setItem("health_user", JSON.stringify(data.user));

      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem("health_token", data.token);
      }

      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        localStorage.setItem("health_refresh_token", data.refreshToken);
      }

      setAuthForm({ name: "", email: "", password: "" });
      if (authMode === "signup") {
        setAuthMode("login");
      }
    } catch (error) {
      setAuthError("Network error. Check backend connection.");
    }
  };

  const requestPasswordReset = async () => {
    setResetStatus("");
    if (!resetForm.email) {
      setResetStatus("Enter your email first.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetForm.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResetStatus(data.error || "Unable to send OTP.");
        return;
      }
      setResetStatus(data.message || "OTP sent.");
    } catch (error) {
      setResetStatus("Network error. Check backend connection.");
    }
  };

  const confirmPasswordReset = async () => {
    setResetStatus("");
    if (!resetForm.email || !resetForm.token || !resetForm.newPassword) {
      setResetStatus("Enter email, OTP, and new password.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetForm.email,
          token: resetForm.token,
          newPassword: resetForm.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResetStatus(data.error || "Unable to reset password.");
        return;
      }
      setResetStatus(data.message || "Password reset successful.");
      setResetForm((prev) => ({ ...prev, token: "", newPassword: "" }));
    } catch (error) {
      setResetStatus("Network error. Check backend connection.");
    }
  };

  const openAppointmentDetail = async (appointment) => {
    if (!appointment) return;
    setAppointmentDetail(appointment);
    setAppointmentActionStatus("");
    setAppointmentRescheduleForm({
      scheduledAt: appointment.scheduled_at
        ? new Date(appointment.scheduled_at).toISOString().slice(0, 16)
        : "",
      reason: "",
    });
    setAppointmentTimeline([]);
    await loadAppointmentTimeline(appointment.id);
  };

  const closeAppointmentDetail = () => {
    setAppointmentDetail(null);
    setAppointmentTimeline([]);
    setAppointmentActionStatus("");
    setAppointmentRescheduleForm({ scheduledAt: "", reason: "" });
  };

  const rescheduleAppointmentFromDetail = async () => {
    if (!appointmentDetail?.id || !appointmentRescheduleForm.scheduledAt) {
      setAppointmentActionStatus("Select a new date and time first.");
      return;
    }

    try {
      const response = await apiFetch(`${API_BASE}/api/appointments/${appointmentDetail.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: appointmentRescheduleForm.scheduledAt,
          reason: appointmentRescheduleForm.reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAppointmentActionStatus(data.error || "Unable to reschedule appointment.");
        return;
      }
      setAppointmentActionStatus("Appointment rescheduled.");
      setAppointmentDetail(data.appointment || appointmentDetail);
      await Promise.all([loadAppointments(), loadAppointmentTimeline(appointmentDetail.id)]);
    } catch (error) {
      setAppointmentActionStatus("Network error. Check backend connection.");
    }
  };

  const cancelAppointmentFromDetail = async () => {
    if (!appointmentDetail?.id) return;

    try {
      const response = await apiFetch(`${API_BASE}/api/appointments/${appointmentDetail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAppointmentActionStatus(data.error || "Unable to cancel appointment.");
        return;
      }
      setAppointmentActionStatus("Appointment cancelled.");
      setAppointmentDetail(data.appointment || { ...appointmentDetail, status: "cancelled" });
      await Promise.all([loadAppointments(), loadAppointmentTimeline(appointmentDetail.id)]);
    } catch (error) {
      setAppointmentActionStatus("Network error. Check backend connection.");
    }
  };

  const updateProfileField = (key, value) =>
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  const updateTeleField = (key, value) =>
    setTeleForm((prev) => ({ ...prev, [key]: value }));
  const openTeleconsultRoom = (consult) => {
    if (!consult?.id) return;
    setActiveConsultId(consult.id);
    setTeleconsultRoomOpen(true);
  };
  const closeTeleconsultRoom = () => {
    setTeleconsultRoomOpen(false);
    setConsultMessageText("");
    setConsultMessageStatus("");
  };
  const submitCareRequest = async (event) => {
    event.preventDefault();
    if (!authToken) {
      setAppointmentsStatus("Sign in first.");
      return;
    }

    if (careRequestMode === "in_person") {
      if (
        !appointmentForm.departmentId ||
        !appointmentForm.doctorId ||
        !appointmentForm.appointmentDate ||
        !appointmentForm.slotTime ||
        !appointmentForm.reason?.trim()
      ) {
        setAppointmentsStatus("Complete department, doctor, date, slot, and reason.");
        return;
      }

      try {
        setAppointmentsStatus("");
        const response = await apiFetch(`${API_BASE}/api/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departmentId: Number(appointmentForm.departmentId),
            doctorId: Number(appointmentForm.doctorId),
            reason: appointmentForm.reason,
            scheduledAt: new Date(
              `${appointmentForm.appointmentDate}T${appointmentForm.slotTime}:00`,
            ).toISOString(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setAppointmentsStatus(data.error || "Unable to book appointment.");
          return;
        }
        setAppointmentsStatus("Appointment request submitted.");
        setAppointmentForm({
          departmentId: "",
          doctorId: "",
          reason: "",
          appointmentDate: "",
          slotTime: "",
        });
        setAvailableSlots([]);
        await loadAppointments();
      } catch (error) {
        setAppointmentsStatus("Network error. Check backend connection.");
      }
      return;
    }

    if (
      !appointmentForm.departmentId ||
      !appointmentForm.doctorId ||
      !appointmentForm.appointmentDate ||
      !appointmentForm.slotTime
    ) {
      setTeleStatus("Select department, doctor, date, and slot.");
      return;
    }

    if (!teleForm.concern?.trim() || teleForm.concern.trim().length < 10) {
      setTeleStatus("Concern must be at least 10 characters.");
      return;
    }

    try {
      setTeleStatus("");
      const response = await apiFetch(`${API_BASE}/api/teleconsults`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: Number(appointmentForm.doctorId),
          departmentId: Number(appointmentForm.departmentId),
          mode: careRequestMode,
          concern: teleForm.concern,
          preferredSlot: new Date(
            `${appointmentForm.appointmentDate}T${appointmentForm.slotTime}:00`,
          ).toISOString(),
          phone: teleForm.phone || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setTeleStatus(data.error || "Unable to create care request.");
        return;
      }
      setTeleStatus("Teleconsult request submitted.");
      setTeleForm({
        mode: "video",
        concern: "",
        phone: "",
      });
      setAppointmentForm({
        departmentId: "",
        doctorId: "",
        reason: "",
        appointmentDate: "",
        slotTime: "",
      });
      setAvailableSlots([]);
      await loadTeleconsults();
    } catch (error) {
      setTeleStatus("Network error. Check backend connection.");
    }
  };

  const updateMarketplaceRequestStatus = async (requestId, status) => {
    if (!requestId) return;
    try {
      setMarketplaceActionStatus("");
      const response = await apiFetch(`${API_BASE}/api/marketplace/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceActionStatus(data.error || "Unable to update request.");
        return;
      }
      setMarketplaceActionStatus("Request updated.");
      await Promise.all([
        loadMarketplaceRequests(),
        loadMarketplaceAnalytics(),
        loadMarketplaceTimeline(requestId),
      ]);
    } catch (error) {
      setMarketplaceActionStatus("Network error. Check backend connection.");
    }
  };

  const apiFetch = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return fetch(url, { ...options, headers });
  };

  const loadPaymentGatewayConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/payments/config`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      setPaymentGatewayConfig(data.paymentGateway || { enabled: false, provider: "razorpay", keyId: "" });
    } catch (error) {
      setPaymentGatewayConfig({ enabled: false, provider: "razorpay", keyId: "" });
    }
  };

  const launchRazorpayPayment = async ({
    createOrderUrl,
    verifyUrl,
    key,
    description,
    onSuccess,
    onErrorMessage,
  }) => {
    const loaded = await ensureRazorpayScript();
    if (!loaded || !window.Razorpay) {
      throw new Error("Payment checkout could not be loaded.");
    }
    const createResponse = await apiFetch(createOrderUrl, { method: "POST" });
    const orderData = await createResponse.json();
    if (!createResponse.ok) {
      throw new Error(orderData.error || onErrorMessage);
    }
    const order = orderData.order || {};
    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: order.keyId || paymentGatewayConfig.keyId || key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SehatSaathi",
        description,
        order_id: order.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: profileForm.phone || "",
        },
        theme: {
          color: "#147d74",
        },
        handler: async (responsePayload) => {
          try {
            const verifyResponse = await apiFetch(verifyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(responsePayload),
            });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }
            await onSuccess?.(verifyData);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment was cancelled.")),
        },
      });
      checkout.open();
    });
  };

  const payForAppointment = async (appointment) => {
    if (!appointment?.id) return;
    setConsultPaymentStatus("");
    setPaymentLoadingKey(`appointment-${appointment.id}`);
    try {
      await launchRazorpayPayment({
        createOrderUrl: `${API_BASE}/api/appointments/${appointment.id}/payment-order`,
        verifyUrl: `${API_BASE}/api/appointments/${appointment.id}/payment-verify`,
        description: "Appointment consultation fee",
        onErrorMessage: "Unable to start appointment payment.",
        onSuccess: async (verifyData) => {
          const billing = verifyData?.billing || null;
          if (billing) {
            setAppointmentDetail((prev) =>
              prev && prev.id === appointment.id
                ? {
                    ...prev,
                    bill_amount: billing.amount,
                    bill_status: billing.status,
                    bill_payment_method: billing.payment_method,
                  }
                : prev,
            );
          }
          setConsultPaymentStatus("Appointment payment completed.");
          await Promise.all([loadAppointments(), loadAppointmentTimeline(appointment.id)]);
        },
      });
    } catch (error) {
      setConsultPaymentStatus(error?.message || "Unable to complete appointment payment.");
    } finally {
      setPaymentLoadingKey("");
    }
  };

  const payForTeleconsult = async (consult) => {
    if (!consult?.id) return;
    setConsultPaymentStatus("");
    setPaymentLoadingKey(`teleconsult-${consult.id}`);
    try {
      await launchRazorpayPayment({
        createOrderUrl: `${API_BASE}/api/teleconsults/${consult.id}/payment-order`,
        verifyUrl: `${API_BASE}/api/teleconsults/${consult.id}/payment-verify`,
        description: "Remote consultation fee",
        onErrorMessage: "Unable to start consultation payment.",
        onSuccess: async () => {
          setConsultPaymentStatus("Consult payment completed.");
          await loadTeleconsults();
        },
      });
    } catch (error) {
      setConsultPaymentStatus(error?.message || "Unable to complete consult payment.");
    } finally {
      setPaymentLoadingKey("");
    }
  };

  const retryPendingActions = async () => {
    if (!isOnline || !authToken || pendingActionQueue.length === 0) return;
    for (const action of pendingActionQueue) {
      try {
        if (action.type === "marketplace_request") {
          const response = await apiFetch(`${API_BASE}/api/marketplace/requests`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": action.idempotencyKey || `retry-${action.id}`,
            },
            body: JSON.stringify(action.payload),
          });
          if (!response.ok) continue;
        } else if (action.type === "appointment_create") {
          const response = await apiFetch(`${API_BASE}/api/appointments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": action.idempotencyKey || `retry-${action.id}`,
            },
            body: JSON.stringify(action.payload),
          });
          if (!response.ok) continue;
        } else if (action.type === "profile_save") {
          const response = await apiFetch(`${API_BASE}/api/profile/${action.userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action.payload),
          });
          if (!response.ok) continue;
        }
        removePendingAction(action.id);
      } catch (error) {
        // keep in queue
      }
    }
    await Promise.all([
      loadAppointments(),
      loadMarketplaceRequests(),
      loadMarketplaceAnalytics(),
      user?.id ? loadProfile(user.id) : Promise.resolve(),
    ]);
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json();
      if (!response.ok || !data?.token) return null;
      setAuthToken(data.token);
      localStorage.setItem("health_token", data.token);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        localStorage.setItem("health_refresh_token", data.refreshToken);
      }
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("health_user", JSON.stringify(data.user));
      }
      return data.token;
    } catch (error) {
      return null;
    }
  };

  const toggleArrayValue = (key, value) => {
    setTriageForm((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };

  const toggleDentalArrayValue = (key, value) => {
    setDentalForm((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };

  const loadProfile = async (userId) => {
    try {
      const response = await apiFetch(`${API_BASE}/api/profile/${userId}`);
      if (response.status === 404) {
        setProfileForm(defaultProfileForm(user));
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const profile = data.profile || {};
      setProfileForm(mapProfilePayloadToForm(profile));
    } catch (error) {
      setProfileStatus("Unable to load profile.");
    }
  };

  const loadHistory = async (userId) => {
    setHistoryStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/triage/history/${userId}`);
      if (!response.ok) {
        setHistoryStatus("Unable to load history.");
        return;
      }
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      setHistoryStatus("Unable to load history.");
    }
  };

  const loadFamilyMembers = async () => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/family`);
      if (!response.ok) return;
      const data = await response.json();
      const members = data.members || [];
      setFamilyMembers(members);
      if (members.length > 0 && !activeMemberId) {
        setActiveMemberId(members[0].id);
      }
    } catch (error) {
      setFamilyStatus("Unable to load family members.");
    }
  };

  const loadRecords = async (memberId) => {
    try {
      const response = memberId
        ? await apiFetch(`${API_BASE}/api/family/${memberId}/records`)
        : await apiFetch(`${API_BASE}/api/records`);
      if (!response.ok) return;
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      setRecordStatus("Unable to load records.");
    }
  };

  const loadReportInsights = async (memberId, months = reportInsightsMonths) => {
    try {
      setReportInsightsStatus("");
      const params = new URLSearchParams();
      if (memberId) params.set("memberId", String(memberId));
      if (months) params.set("months", String(months));
      const response = await apiFetch(`${API_BASE}/api/records/insights?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        setReportInsightsStatus(data.error || "Unable to load report insights.");
        return;
      }
      setReportCatalog(data.catalog || []);
      setReportExtractionCapabilities(data.extractionCapabilities || null);
      setReportInsights(data.insights || null);
      setRecords(data.records || []);
      setRecordAnalysisDrafts((prev) => {
        const next = { ...prev };
        (data.records || []).forEach((record) => {
          const analysis = record.analysis;
          const metrics = {};
          const sourceMetrics = (analysis?.metrics || []).length ? analysis.metrics : record.extraction?.suggested_metrics || [];
          sourceMetrics.forEach((metric) => {
            metrics[metric.metricKey] = metric.valueNum;
          });
          const metricConfidences = {};
          (record.extraction?.suggested_metrics || []).forEach((metric) => {
            metricConfidences[metric.metricKey] = metric.confidence;
          });
          next[record.id] = {
            reportType: analysis?.reportType || record.extraction?.suggested_report_type || "",
            reportDate: analysis?.reportDate || record.extraction?.suggested_report_date || record.created_at?.slice(0, 10) || "",
            notes: analysis?.notes || "",
            extractedText: "",
            autoSuggestionMeta: record.extraction
              ? {
                  overallConfidence: record.extraction.overall_confidence,
                  needsReview: Boolean(record.extraction.needs_review),
                  detectedLabSource: record.extraction.detected_lab_source || "",
                  detectedSections: record.extraction.detected_sections || [],
                  source: record.extraction.extractor || "",
                  metricConfidences,
                }
              : null,
            metrics,
          };
        });
        return next;
      });
    } catch (error) {
      setReportInsightsStatus("Unable to load report insights.");
    }
  };

  const updateRecordAnalysisDraft = (recordId, patch) => {
    setRecordAnalysisDrafts((prev) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || { reportType: "", reportDate: "", notes: "", extractedText: "", metrics: {}, autoSuggestionMeta: null }),
        ...patch,
      },
    }));
  };

  const saveRecordAnalysis = async (recordId) => {
    const draft = recordAnalysisDrafts[recordId] || {};
    const catalogItem = reportCatalog.find((item) => item.key === draft.reportType);
    const metrics = (catalogItem?.metrics || [])
      .map((metric) => ({
        metricKey: metric.key,
        valueNum: draft.metrics?.[metric.key],
      }))
      .filter((item) => item.valueNum !== "" && item.valueNum !== null && item.valueNum !== undefined);
    setReportInsightsStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/records/${recordId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: draft.reportType,
          reportDate: draft.reportDate,
          notes: draft.notes || "",
          metrics,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setReportInsightsStatus(data.error || "Unable to save report values.");
        return;
      }
      setReportInsightsStatus("Report values saved.");
      await loadReportInsights(activeMemberId, reportInsightsMonths);
      setActiveAnalysisRecordId(null);
    } catch (error) {
      setReportInsightsStatus("Unable to save report values.");
    }
  };

  const autoSuggestRecordAnalysis = async (recordId) => {
    const draft = recordAnalysisDrafts[recordId] || {};
    setReportInsightsStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/records/${recordId}/analysis/auto-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportText: draft.extractedText || "",
          hintedReportType: draft.reportType || "",
          reportDate: draft.reportDate || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setReportInsightsStatus(data.error || "Unable to auto-suggest report values.");
        return;
      }
      const suggestion = data.suggestion || {};
      const nextMetrics = {};
      (suggestion.metrics || []).forEach((metric) => {
        nextMetrics[metric.metricKey] = metric.valueNum;
      });
      updateRecordAnalysisDraft(recordId, {
        reportType: suggestion.reportType || draft.reportType || "",
        reportDate: suggestion.reportDate || draft.reportDate || "",
        metrics: {
          ...(draft.metrics || {}),
          ...nextMetrics,
        },
        autoSuggestionMeta: {
          overallConfidence: suggestion.overallConfidence ?? null,
          needsReview: Boolean(suggestion.needsReview),
          detectedLabSource: suggestion.detectedLabSource?.label || "",
          source: suggestion.source || "parsed_text",
          metricConfidences: Object.fromEntries((suggestion.metrics || []).map((metric) => [metric.metricKey, metric.confidence])),
        },
      });
      setReportInsightsStatus(suggestion.summary || "Suggested values applied.");
    } catch (error) {
      setReportInsightsStatus("Unable to auto-suggest report values.");
    }
  };

  const loadShareHistory = async () => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/share-history`);
      if (!response.ok) return;
      const data = await response.json();
      setShareHistory(data.history || []);
    } catch (error) {
      // non-blocking
    }
  };

  const loadSharePasses = async () => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/share-passes`);
      if (!response.ok) return;
      const data = await response.json();
      setSharePasses(data.passes || []);
    } catch (error) {
      // non-blocking
    }
  };

  const {
    openRecordUploader,
    saveProfile,
    uploadRecord,
    deleteRecord,
    generateSharePass,
  } = useProfileSectionActions({
    apiBase: API_BASE,
    apiFetch,
    authToken,
    user,
    profileForm,
    setProfileForm,
    setProfileStatus,
    setUser,
    setProfileEditMode,
    setActivePatientTab,
    loadProfile,
    activeMemberId,
    recordsInputRef,
    loadRecords,
    loadReportInsights,
    setRecordStatus,
    loadSharePasses,
    loadShareHistory,
    setSharePassStatus,
    setSharePass,
    setShareQr,
    mapProfilePayloadToForm,
  });

  const {
    updateTriageField,
    updateDentalField,
    saveTriageDraftNow,
    clearTriageDraft,
    submitTriage,
  } = useTriageSectionActions({
    apiBase: API_BASE,
    apiFetch,
    triageType,
    triageForm,
    dentalForm,
    setTriageForm,
    setDentalForm,
    setTriageType,
    setTriageDraftStatus,
    setTriageLoading,
    setTriageError,
    setTriageResult,
    loadHistory,
    user,
    fallbackTriage,
  });

  const loadNotifications = async () => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/notifications?limit=8`);
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      // non-blocking
    }
  };

  const markNotificationsRead = async () => {
    if (!authToken || notifications.length === 0) return;
    try {
      await apiFetch(`${API_BASE}/api/notifications/read-all`, {
        method: "POST",
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      // non-blocking
    }
  };

  const loadTeleconsults = async () => {
    if (!authToken) return;
    setTeleLoading(true);
    setTeleStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults`);
      if (!response.ok) {
        setTeleStatus(t("teleError"));
        return;
      }
      const data = await response.json();
      const items = data.consults || [];
      setTeleconsults(items);
      setActiveConsultId((prev) => {
        if (prev && items.some((item) => item.id === prev)) return prev;
        return items[0]?.id || null;
      });
    } catch (error) {
      setTeleStatus(t("teleError"));
    } finally {
      setTeleLoading(false);
    }
  };

  const loadConsultMessages = async (consultId) => {
    if (!consultId || !authToken) return;
    setConsultMessageStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${consultId}/messages`);
      if (!response.ok) {
        setConsultMessageStatus(t("teleError"));
        return;
      }
      const data = await response.json();
      setConsultMessages(data.messages || []);
    } catch (error) {
      setConsultMessageStatus(t("teleError"));
    }
  };

  const loadConsultCallEvents = async (consultId) => {
    if (!consultId || !authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${consultId}/call-events`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setConsultMessageStatus(data.error || "Unable to load audio call state.");
        setConsultCallEvents([]);
        return;
      }
      const data = await response.json();
      setConsultCallEvents(data.events || []);
    } catch {
      setConsultMessageStatus("Unable to load audio call state.");
      setConsultCallEvents([]);
    }
  };

  const loadConsultConsent = async (consultId) => {
    if (!consultId || !authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${consultId}/consent`);
      if (!response.ok) return;
      const data = await response.json();
      setConsultConsentSummary(data.summary || null);
    } catch (error) {
      // non-blocking
    }
  };

  const acceptConsultConsent = async () => {
    if (!authToken || !activeConsultId) return;
    try {
      setConsultMessageStatus("");
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${activeConsultId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true, policyVersion: "teleconsult_chat_v1" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setConsultMessageStatus(data.error || "Unable to record teleconsult acknowledgement.");
        return;
      }
      await loadConsultConsent(activeConsultId);
      setConsultMessageStatus("Teleconsult acknowledgement recorded.");
    } catch (error) {
      setConsultMessageStatus("Unable to record teleconsult acknowledgement.");
    }
  };

  const sendConsultMessage = async (event) => {
    event?.preventDefault?.();
    if (!authToken || !activeConsultId) return;
    if (!consultConsentSummary?.patientAccepted) {
      setConsultMessageStatus("Please accept the teleconsult notice before using chat.");
      return;
    }
    if (!String(consultMessageText || "").trim()) {
      setConsultMessageStatus("Type a message first.");
      return;
    }
    try {
      setConsultMessageStatus("");
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${activeConsultId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: consultMessageText }),
      });
      const data = await response.json();
      if (!response.ok) {
        setConsultMessageStatus(data.error || "Unable to send message.");
        return;
      }
      setConsultMessageText("");
      await loadTeleconsults();
    } catch (error) {
      setConsultMessageStatus("Network error. Check backend connection.");
    }
  };

  const sendConsultCallEvent = async ({ consultId = null, sessionId, eventType, payload = null }) => {
    const targetConsultId = Number(consultId || activeConsultId || 0);
    if (!authToken || !targetConsultId) return { ok: false, error: "Consult not ready." };
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${targetConsultId}/call-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, eventType, payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || "Unable to send audio signal." };
      }
      return { ok: true, event: data.event };
    } catch {
      return { ok: false, error: "Unable to send audio signal." };
    }
  };

  const updateConsultStatus = async (event) => {
    event?.preventDefault?.();
    if (!authToken || !activeConsultId || !["doctor", "admin"].includes(user?.role)) return;
    try {
      setDoctorConsoleStatus("");
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${activeConsultId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: doctorConsoleForm.status,
          meetingUrl: doctorConsoleForm.meetingUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDoctorConsoleStatus(data.error || "Unable to save consult state.");
        return;
      }
      setDoctorConsoleStatus("Consult state updated.");
      await loadTeleconsults();
    } catch (error) {
      setDoctorConsoleStatus("Network error. Check backend connection.");
    }
  };

  const loadAppointments = async () => {
    if (!authToken) return;
    setAppointmentsStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/appointments`);
      if (!response.ok) {
        setAppointmentsStatus("Unable to load appointments.");
        return;
      }
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      setAppointmentsStatus("Unable to load appointments.");
    }
  };

  const loadAppointmentTimeline = async (appointmentId) => {
    if (!authToken || !appointmentId) return;
    try {
      const response = await apiFetch(
        `${API_BASE}/api/appointments/${appointmentId}/timeline`,
      );
      const data = await response.json();
      if (!response.ok) {
        setAppointmentActionStatus(data.error || "Unable to load appointment timeline.");
        return;
      }
      setAppointmentTimeline(data.timeline || []);
    } catch (error) {
      setAppointmentActionStatus("Unable to load appointment timeline.");
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/departments`);
      if (!response.ok) return;
      const data = await response.json();
      const items = data.departments || [];
      setDepartments(items);
      setAppointmentForm((prev) => {
        if (prev.departmentId || items.length === 0) {
          return prev;
        }
        return {
          ...prev,
          departmentId: String(items[0].id),
          doctorId: "",
        };
      });
    } catch (error) {
      // Non-blocking at startup.
    }
  };

  const loadDoctorsForDepartment = async (departmentId) => {
    if (!departmentId) {
      setDepartmentDoctors([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/api/doctors?departmentId=${encodeURIComponent(departmentId)}`,
      );
      if (!response.ok) {
        setDepartmentDoctors([]);
        return;
      }
      const data = await response.json();
      const items = data.doctors || [];
      setDepartmentDoctors(items);
      setAppointmentForm((prev) => {
        if (String(prev.departmentId) !== String(departmentId)) {
          return prev;
        }
        const selectedDoctorStillValid = items.some(
          (doctor) => String(doctor.id) === String(prev.doctorId),
        );
        return {
          ...prev,
          doctorId: selectedDoctorStillValid ? prev.doctorId : "",
        };
      });
    } catch (error) {
      setDepartmentDoctors([]);
    }
  };

  const loadProfileDoctorsForDepartment = async (departmentId) => {
    if (!departmentId) {
      setProfileDepartmentDoctors([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/api/doctors?departmentId=${encodeURIComponent(departmentId)}`,
      );
      if (!response.ok) {
        setProfileDepartmentDoctors([]);
        return;
      }
      const data = await response.json();
      const items = data.doctors || [];
      setProfileDepartmentDoctors(items);
      setProfileForm((prev) => {
        if (String(prev.unitDepartmentId) !== String(departmentId)) {
          return prev;
        }
        const selectedDoctorStillValid = items.some(
          (doctor) => String(doctor.id) === String(prev.unitDoctorId),
        );
        return {
          ...prev,
          unitDoctorId: selectedDoctorStillValid ? prev.unitDoctorId : "",
        };
      });
    } catch (error) {
      setProfileDepartmentDoctors([]);
    }
  };

  const loadAdminUsers = async () => {
    if (!authToken || user?.role !== "admin") return;
    setAdminUsersStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/admin/users`);
      if (!response.ok) {
        setAdminUsersStatus("Unable to load admin users.");
        return;
      }
      const data = await response.json();
      setAdminUsers(
        (data.users || []).map((item) => ({
          ...item,
          roleDraft: item.role || "patient",
          departmentIdDraft: item.department_id ? String(item.department_id) : "",
          qualificationDraft: item.qualification || "",
          activeDraft: item.active ? "active" : "disabled",
        })),
      );
    } catch (error) {
      setAdminUsersStatus("Unable to load admin users.");
    }
  };

  const loadAdminOps = async () => {
    if (!authToken || !["admin", "front_desk"].includes(user?.role)) return;
    setAdminOpsStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/admin/ops/dashboard`);
      if (!response.ok) {
        setAdminOpsStatus("Unable to load operations dashboard.");
        return;
      }
      const data = await response.json();
      setAdminOps(data);
    } catch (error) {
      setAdminOpsStatus("Unable to load operations dashboard.");
    }
  };

  const loadOpsQueue = async () => {
    if (!authToken || !["admin", "front_desk"].includes(user?.role)) return;
    setOpsQueueStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/ops/queue`);
      const data = await response.json();
      if (!response.ok) {
        setOpsQueueStatus(data.error || "Unable to load front desk queue.");
        return;
      }
      const queue = data.queue || [];
      setOpsQueue(queue);
      setBillingDrafts((prev) => {
        const next = { ...prev };
        queue.forEach((item) => {
          if (!next[item.id]) {
            next[item.id] = {
              amount: item.bill_amount ?? "",
              status: item.bill_status || "unpaid",
              paymentMethod: item.bill_payment_method || "",
            };
          }
        });
        return next;
      });
    } catch (error) {
      setOpsQueueStatus("Unable to load front desk queue.");
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      setSlotStatus("");
      return;
    }
    setSlotStatus("");
    try {
      const response = await fetch(
        `${API_BASE}/api/appointment-slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setAvailableSlots([]);
        setSlotStatus(data.error || "Unable to load slots.");
        return;
      }
      setAvailableSlots(data.slots || []);
      if (!data.slots || data.slots.length === 0) {
        setSlotStatus("No slots available for this date.");
      }
    } catch (error) {
      setAvailableSlots([]);
      setSlotStatus("Unable to load slots.");
    }
  };

  const loadDoctorSchedule = async (doctorId) => {
    if (!doctorId || !authToken) return;
    setScheduleStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/doctors/${doctorId}/availability`);
      if (!response.ok) {
        setScheduleStatus("Unable to load schedule.");
        return;
      }
      const data = await response.json();
      const schedules = data.schedules || [];
      if (schedules.length > 0) {
        setScheduleForm(
          schedules.map((item) => ({
            weekday: Number(item.weekday),
            startTime: item.start_time,
            endTime: item.end_time,
            slotMinutes: Number(item.slot_minutes),
          })),
        );
      }
    } catch (error) {
      setScheduleStatus("Unable to load schedule.");
    }
  };

  const loadEncounters = async () => {
    if (!authToken) return;
    setEncounterStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/encounters`);
      if (!response.ok) {
        setEncounterStatus("Unable to load clinical records.");
        return;
      }
      const data = await response.json();
      const items = data.encounters || [];
      setEncounters(items);
      if (items.length > 0) {
        setActiveEncounterId((prev) => prev || items[0].id);
      }
    } catch (error) {
      setEncounterStatus("Unable to load clinical records.");
    }
  };

  const loadEncounterDetail = async (encounterId) => {
    if (!encounterId || !authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/encounters/${encounterId}`);
      if (!response.ok) {
        setEncounterStatus("Unable to load record detail.");
        return;
      }
      const data = await response.json();
      setEncounterDetail(data);
    } catch (error) {
      setEncounterStatus("Unable to load record detail.");
    }
  };

  const loadLabListings = async (mode = labMode, area = labArea) => {
    setMarketplaceLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/marketplace/labs?mode=${encodeURIComponent(mode)}&area=${encodeURIComponent(area)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceStatus(data.error || "Unable to load labs.");
        return;
      }
      setLabListings(normalizeLabListings(data.labs || []));
      setLabAreas(data.areas || []);
      setActiveLabId(null);
    } catch (error) {
      setMarketplaceStatus("Unable to load labs.");
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const loadPharmacyListings = async (mode = pharmacyMode) => {
    setMarketplaceLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/marketplace/pharmacies?mode=${encodeURIComponent(mode)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceStatus(data.error || "Unable to load pharmacies.");
        return;
      }
      setPharmacyListings(normalizePharmacyListings(data.pharmacies || []));
    } catch (error) {
      setMarketplaceStatus("Unable to load pharmacies.");
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const loadMarketplaceRequests = async () => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/marketplace/requests`);
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceStatus(data.error || "Unable to load marketplace requests.");
        return;
      }
      setMarketplaceRequests(data.requests || []);
    } catch (error) {
      setMarketplaceStatus("Unable to load marketplace requests.");
    }
  };

  const loadMarketplaceAnalytics = async () => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/marketplace/analytics`);
      const data = await response.json();
      if (!response.ok) {
        return;
      }
      setMarketplaceAnalytics({
        overall: data.overall || { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
        lab: data.lab || { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
        pharmacy: data.pharmacy || { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
      });
    } catch (error) {
      // keep previous analytics
    }
  };

  const loadMarketplaceRequestTimeline = async (requestId) => {
    if (!authToken || !requestId) return;
    setMarketplaceTimelineLoadingByRequest((prev) => ({ ...prev, [requestId]: true }));
    try {
      const response = await apiFetch(`${API_BASE}/api/marketplace/requests/${requestId}/timeline`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load request timeline.");
      setMarketplaceTimelineByRequest((prev) => ({
        ...prev,
        [requestId]: data.timeline || [],
      }));
    } catch (error) {
      setMarketplaceActionStatus(error.message || "Unable to load request timeline.");
    } finally {
      setMarketplaceTimelineLoadingByRequest((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const loadHospitalContent = async () => {
    setHospitalContentStatus('');
    try {
      const response = await fetch(`${API_BASE}/api/hospital/content`);
      const data = await response.json();
      if (!response.ok) {
        setHospitalContentStatus(data.error || 'Unable to load hospital details.');
        return;
      }
      setHospitalContent(normalizeHospitalContent(data || {}, API_BASE));
    } catch (error) {
      setHospitalContentStatus('Unable to load hospital details.');
    }
  };

  const toggleMarketplaceRequestTimeline = async (requestId) => {
    const willOpen = !marketplaceTimelineOpenByRequest[requestId];
    setMarketplaceTimelineOpenByRequest((prev) => ({ ...prev, [requestId]: willOpen }));
    if (willOpen && !marketplaceTimelineByRequest[requestId]) {
      await loadMarketplaceRequestTimeline(requestId);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadHospitalContent();
  }, []);

  useEffect(() => {
    if (!appointmentForm.departmentId) {
      setDepartmentDoctors([]);
      return;
    }
    loadDoctorsForDepartment(appointmentForm.departmentId);
  }, [appointmentForm.departmentId]);

  useEffect(() => {
    if (!profileForm.unitDepartmentId) {
      setProfileDepartmentDoctors([]);
      return;
    }
    loadProfileDoctorsForDepartment(profileForm.unitDepartmentId);
  }, [profileForm.unitDepartmentId]);

  useEffect(() => {
    if (!appointmentForm.doctorId || !appointmentForm.appointmentDate) {
      setAvailableSlots([]);
      setSlotStatus("");
      return;
    }
    loadAvailableSlots(appointmentForm.doctorId, appointmentForm.appointmentDate);
  }, [appointmentForm.doctorId, appointmentForm.appointmentDate]);

  useEffect(() => {
    if (user && (user.role === "doctor" || user.role === "admin")) {
      loadDoctorSchedule(user.id);
    }
  }, [user?.id, user?.role, authToken]);

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id);
      loadHistory(user.id);
      loadFamilyMembers();
      loadShareHistory();
      loadSharePasses();
      loadNotifications();
      loadTeleconsults();
      loadAppointments();
      loadEncounters();
      loadMarketplaceRequests();
      loadMarketplaceAnalytics();
      loadLabListings();
      loadPharmacyListings();
      if (user.role === "admin") {
        loadAdminUsers();
      } else {
        setAdminUsers([]);
      }
      if (["admin", "front_desk"].includes(user.role)) {
        loadAdminOps();
        loadOpsQueue();
      } else {
        setAdminOps(null);
        setOpsQueue([]);
      }
    } else {
      setProfileForm(defaultProfileForm());
      setHistory([]);
      setFamilyMembers([]);
      setRecords([]);
      setNotifications([]);
      setTeleconsults([]);
      setConsultMessages([]);
      setActiveConsultId(null);
      setAppointments([]);
      setEncounters([]);
      setEncounterDetail(null);
      setActiveEncounterId(null);
      setMarketplaceAnalytics({
        overall: { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
        lab: { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
        pharmacy: { totalRequests: 0, conversionRate: 0, cancelRate: 0, avgFulfillmentMinutes: 0 },
      });
      setAdminUsers([]);
      setAdminOps(null);
      setOpsQueue([]);
      setSharePasses([]);
    }
  }, [user, authToken]);

  useEffect(() => {
    loadPaymentGatewayConfig();
  }, []);

  useEffect(() => {
    if (activePatientTab === "labs") {
      setActivePatientTab("home");
    }
  }, [activePatientTab]);

  useEffect(() => {
    let active = true;
    const loadLiveStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/stats/live`);
        if (!response.ok) return;
        const data = await response.json();
        if (active && data?.totals) {
          setLiveStats({
            users: Number(data.totals.users || 0),
            triageCompleted: Number(data.totals.triageCompleted || 0),
            doctorViews: Number(data.totals.doctorViews || 0),
            activeUsersToday: Number(data.totals.activeUsersToday || 0),
          });
        }
      } catch (error) {
        // keep default zeros
      }
    };
    loadLiveStats();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authToken || !user) {
      setRecords([]);
      setReportInsights(null);
      return;
    }
    loadReportInsights(activeMemberId, reportInsightsMonths);
  }, [activeMemberId, authToken, user, reportInsightsMonths]);

  useEffect(() => {
    if (!activeConsultId) {
      setConsultMessages([]);
      setConsultCallEvents([]);
      setConsultConsentSummary(null);
      return;
    }
    loadConsultMessages(activeConsultId);
    if (String(activeConsult?.mode || "").toLowerCase() === "audio") {
      loadConsultCallEvents(activeConsultId);
    } else {
      setConsultCallEvents([]);
    }
    loadConsultConsent(activeConsultId);
  }, [activeConsultId, authToken, activeConsult?.mode]);

  useEffect(() => {
    if (!authToken || !activeConsultId || !teleconsultRoomOpen) return undefined;
    const stream = new EventSource(`${API_BASE}/api/teleconsults/${activeConsultId}/events?token=${encodeURIComponent(authToken)}`);
    const handleMessageCreated = (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        const nextMessage = payload.message;
        if (!nextMessage) return;
        setConsultMessages((prev) => (prev.some((item) => item.id === nextMessage.id) ? prev : [...prev, nextMessage]));
      } catch {
        // ignore malformed events
      }
    };
    const handleConsultUpdated = (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        const nextConsult = payload.consult;
        if (!nextConsult) return;
        setTeleconsults((prev) => prev.map((item) => (item.id === nextConsult.id ? { ...item, ...nextConsult } : item)));
      } catch {
        // ignore malformed events
      }
    };
    const handleConsentUpdated = (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        setConsultConsentSummary((prev) => ({
          ...(prev || {}),
          ...(payload.summary || {}),
        }));
      } catch {
        // ignore malformed events
      }
    };
    const handleCallEvent = (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        const nextEvent = payload.callEvent;
        if (!nextEvent) return;
        setConsultCallEvents((prev) => (prev.some((item) => item.id === nextEvent.id) ? prev : [...prev, nextEvent]));
      } catch {
        // ignore malformed events
      }
    };
    stream.addEventListener("message_created", handleMessageCreated);
    stream.addEventListener("consult_updated", handleConsultUpdated);
    stream.addEventListener("consent_updated", handleConsentUpdated);
    stream.addEventListener("call_event", handleCallEvent);
    stream.onerror = () => {
      setConsultMessageStatus((prev) => prev || "Live consult updates were interrupted. Reopen the consult if needed.");
    };
    return () => stream.close();
  }, [authToken, activeConsultId, teleconsultRoomOpen]);

  useEffect(() => {
    if (!activeEncounterId) {
      setEncounterDetail(null);
      return;
    }
    loadEncounterDetail(activeEncounterId);
  }, [activeEncounterId, authToken]);

  useEffect(() => {
    if (!user || isOpsUser || !authToken) return;
    loadNotifications();
    if (activePatientTab === "alerts") {
      markNotificationsRead();
    }
  }, [activePatientTab, user?.id, user?.role, authToken]);

  useEffect(() => {
    if (!user || isOpsUser || !authToken) return undefined;
    const intervalId = window.setInterval(() => {
      loadAppointments();
      loadNotifications();
      loadHospitalContent();
    }, 20000);
    return () => window.clearInterval(intervalId);
  }, [user?.id, user?.role, authToken, isOpsUser]);

  useEffect(() => {
    if (!user || isOpsUser || !authToken) return;

    const refreshMarketplace = () => {
      loadMarketplaceRequests();
      loadMarketplaceAnalytics();
    };

    const handleStorage = (event) => {
      if (event.key === MARKETPLACE_REFRESH_KEY) {
        refreshMarketplace();
      }
    };

    window.addEventListener("focus", refreshMarketplace);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", refreshMarketplace);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user?.id, user?.role, authToken]);

  useEffect(() => {
    if (!user || isOpsUser) return;
    loadLabListings(labMode, labArea);
  }, [labMode, labArea]);

  useEffect(() => {
    if (!user || isOpsUser) return;
    loadPharmacyListings(pharmacyMode);
  }, [pharmacyMode]);

  useEffect(() => {
    if (activePatientTab === "pharmacy") {
      setActivePatientTab("home");
    }
  }, [activePatientTab]);

  useEffect(() => {
    if (!isOnline || pendingActionQueue.length === 0) return;
    retryPendingActions();
  }, [isOnline, pendingActionQueue.length, authToken]);

  useEffect(() => {
    if (doctorConsoleMode) {
      loadTeleconsults();
      loadAppointments();
      loadEncounters();
      if (user?.id) {
        loadDoctorSchedule(user.id);
      }
    }
  }, [doctorConsoleMode, user?.id]);

  if (doctorConsoleMode) {
    return (
      <DoctorConsolePage
        t={t}
        user={user}
        sessionReady={sessionReady}
        authToken={authToken}
        handleAuth={handleAuth}
        authForm={authForm}
        updateAuthField={updateAuthField}
        authError={authError}
        signOut={signOut}
        loadTeleconsults={loadTeleconsults}
        loadAppointments={loadAppointments}
        loadEncounters={loadEncounters}
        loadDoctorSchedule={loadDoctorSchedule}
        scheduleForm={scheduleForm}
        updateScheduleRow={updateScheduleRow}
        weekdayLabel={weekdayLabel}
        removeScheduleRow={removeScheduleRow}
        addScheduleRow={addScheduleRow}
        saveDoctorSchedule={saveDoctorSchedule}
        scheduleStatus={scheduleStatus}
        teleLoading={teleLoading}
        teleconsults={teleconsults}
        activeConsultId={activeConsultId}
        setActiveConsultId={setActiveConsultId}
        activeConsult={activeConsult}
        doctorConsoleForm={doctorConsoleForm}
        setDoctorConsoleForm={setDoctorConsoleForm}
        updateConsultStatus={updateConsultStatus}
        doctorConsoleStatus={doctorConsoleStatus}
        consultMessages={consultMessages}
        appointments={appointments}
        doctorChartForm={doctorChartForm}
        setDoctorChartForm={setDoctorChartForm}
        createEncounterFromDoctor={createEncounterFromDoctor}
        encounters={encounters}
        activeEncounterId={activeEncounterId}
        setActiveEncounterId={setActiveEncounterId}
        noteForm={noteForm}
        setNoteForm={setNoteForm}
        addDoctorNote={addDoctorNote}
        prescriptionForm={prescriptionForm}
        setPrescriptionForm={setPrescriptionForm}
        addPrescription={addPrescription}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        addOrder={addOrder}
        doctorChartStatus={doctorChartStatus}
        teleStatusLabel={teleStatusLabel}
      />
    );
  }

  if (clinicMode) {
    return (
      <ClinicPage
        t={t}
        doctorLang={doctorLang}
        setDoctorLang={setDoctorLang}
        clinicCode={clinicCode}
        setClinicCode={setClinicCode}
        openClinicSummary={openClinicSummary}
        scannerActive={scannerActive}
        startScanner={startScanner}
        stopScanner={stopScanner}
        clinicVideoRef={clinicVideoRef}
        clinicStatus={clinicStatus}
      />
    );
  }

  if (resetPasswordPageMode) {
    return (
      <ResetPasswordPage
        t={t}
        resetForm={resetForm}
        setResetForm={setResetForm}
        confirmPasswordReset={confirmPasswordReset}
        resetStatus={resetStatus}
      />
    );
  }

  if (emergencyPublicId) {
    return (
      <EmergencyCardPage
        t={t}
        emergencyLoading={emergencyLoading}
        emergencyData={emergencyData}
      />
    );
  }

  if (doctorCode) {
    return (
      <DoctorViewPage
        t={t}
        doctorLang={doctorLang}
        setDoctorLang={(lang) => {
          setDoctorLang(lang);
          setLanguage(lang);
        }}
        doctorViewLoading={doctorViewLoading}
        doctorViewData={doctorViewData}
        handleDoctorQuickRating={handleDoctorQuickRating}
        doctorRatingStatus={doctorRatingStatus}
        apiBase={API_BASE}
      />
    );
  }

  if (!user) {
    return (
      <GuestLanding
        t={t}
        authMode={authMode}
        setAuthMode={setAuthMode}
        handleAuth={handleAuth}
        authForm={authForm}
        updateAuthField={updateAuthField}
        authError={authError}
        resetForm={resetForm}
        setResetForm={setResetForm}
        requestPasswordReset={requestPasswordReset}
        resetStatus={resetStatus}
      />
    );
  }

  if (user && !isOpsUser) {
    const primaryPatientTabs = [
      { key: "home", label: "Home", icon: "⌂" },
      { key: "appointments", label: "Visits", icon: "🗓" },
      { key: "triage", label: "Triage", icon: "🩺" },
      { key: "clinical", label: "Records", icon: "📋" },
      { key: "hospital", label: "Hospital", icon: "🏥" },
    ];
    const menuTabs = [
      { key: "alerts", label: `Notifications${unreadNotificationsCount ? ` (${unreadNotificationsCount})` : ""}` },
      { key: "reports", label: "Reports" },
    ];

    return (
      <div className="app mobile-app-shell">
        <header className="nav patient-topbar">
          <button
            type="button"
            className="ghost menu-trigger"
            onClick={() => setPatientMenuOpen(true)}
            aria-label="Open more menu"
          >
            ☰
          </button>
          <div className="patient-topbar-center" aria-label="SehatSaathi">
            <div className="patient-topbar-brand">
              <div className="logo-mark">S</div>
              <span>SehatSaathi</span>
            </div>
          </div>
          <button className="ghost patient-signout-btn" onClick={signOut}>
            {t("navSignOut")}
          </button>
        </header>

        {patientMenuOpen ? (
          <div className="patient-menu-backdrop" onClick={() => setPatientMenuOpen(false)}>
            <aside className="patient-menu-drawer" onClick={(event) => event.stopPropagation()}>
              <div className="section-head compact">
                <div>
                  <p className="eyebrow">More</p>
                  <h3>Account & updates</h3>
                </div>
                <button className="ghost" type="button" onClick={() => setPatientMenuOpen(false)}>
                  Close
                </button>
              </div>
              <div className="patient-menu-list">
                {menuTabs.map((tab) => (
                  <button
                    key={`menu-${tab.key}`}
                    type="button"
                    className={activePatientTab === tab.key ? "active" : ""}
                    onClick={() => {
                      openPatientTab(tab.key);
                      setPatientMenuOpen(false);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    openProfileEditor();
                    setPatientMenuOpen(false);
                  }}
                >
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        {!isOnline ? (
          <div className="network-banner">Offline mode: actions will be queued and retried automatically.</div>
        ) : null}
        {pendingActionQueue.length > 0 ? (
          <div className="network-banner subtle">
            Pending sync actions: {pendingActionQueue.length}
          </div>
        ) : null}

        {showTriageDisclaimer ? (
          <div className="modal-backdrop" onClick={() => setShowTriageDisclaimer(false)}>
            <div className="modal triage-disclaimer-modal" onClick={(event) => event.stopPropagation()}>
              <div className="section-head compact">
                <div>
                  <p className="eyebrow">Important</p>
                  <h2>Triage safety notice</h2>
                  <p className="panel-sub">
                    This triage is only general health guidance. It is not medical advice, not a diagnosis, and not a substitute for a doctor&apos;s examination or treatment.
                  </p>
                </div>
              </div>
              <div className="history-list compact-list">
                <div className="history-card">
                  <p className="micro">
                    If symptoms are severe, worsening, or feel urgent, please contact a doctor or visit a hospital immediately.
                  </p>
                </div>
              </div>
              <div className="action-row" style={{ marginTop: 16 }}>
                <button type="button" className="ghost" onClick={() => {
                  setShowTriageDisclaimer(false);
                  setActivePatientTab("home");
                }}>
                  Go back
                </button>
                <button type="button" className="primary" onClick={() => setShowTriageDisclaimer(false)}>
                  I understand
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <main className="patient-mobile-main">
          {activePatientTab === "home" && (
            <PatientHomePanel
              user={user}
              profileForm={profileForm}
              profileSummary={profileSummary}
              profileCompletion={profileCompletion}
              pendingServiceRequests={pendingServiceRequests}
              unreadNotificationsCount={unreadNotificationsCount}
              setActivePatientTab={openPatientTab}
              nextAppointment={nextAppointment}
              latestHospitalUpdate={latestHospitalUpdate}
              lastGuidance={lastGuidance}
              t={t}
              openProfileEditor={openProfileEditor}
              sharePass={sharePass}
              sharePassStatus={sharePassStatus}
              shareQr={shareQr}
              generateSharePass={generateSharePass}
            />
          )}

          {activePatientTab === "appointments" && (
            <AppointmentsPanel
              t={t}
              teleStatusLabel={teleStatusLabel}
              submitCareRequest={submitCareRequest}
              careRequestMode={careRequestMode}
              setCareRequestMode={setCareRequestMode}
              appointmentForm={appointmentForm}
              setAppointmentForm={setAppointmentForm}
              departments={departments}
              departmentDoctors={departmentDoctors}
              availableSlots={availableSlots}
              slotStatus={slotStatus}
              teleForm={teleForm}
              updateTeleField={updateTeleField}
              teleStatus={teleStatus}
              appointmentsStatus={appointmentsStatus}
              appointmentsViewTab={appointmentsViewTab}
              setAppointmentsViewTab={setAppointmentsViewTab}
              futureAppointments={futureAppointments}
              pastAppointments={pastAppointments}
              requestedAppointments={requestedAppointments}
              requestedCare={requestedCare}
              openAppointmentDetail={openAppointmentDetail}
              openTeleconsultRoom={openTeleconsultRoom}
              paymentGatewayConfig={paymentGatewayConfig}
              payForAppointment={payForAppointment}
              payForTeleconsult={payForTeleconsult}
              paymentLoadingKey={paymentLoadingKey}
              consultPaymentStatus={consultPaymentStatus}
            />
          )}

          {activePatientTab === "clinical" && (
            <ClinicalRecordsPanel
              encounters={encounters}
              activeEncounterId={activeEncounterId}
              setActiveEncounterId={setActiveEncounterId}
              encounterDetail={encounterDetail}
              encounterStatus={encounterStatus}
            />
          )}

          {activePatientTab === "reports" && (
            <ReportsPanel
              records={records}
              reportCatalog={reportCatalog}
              reportExtractionCapabilities={reportExtractionCapabilities}
              reportInsights={reportInsights}
              reportInsightsStatus={reportInsightsStatus}
              reportInsightsMonths={reportInsightsMonths}
              setReportInsightsMonths={setReportInsightsMonths}
              activeAnalysisRecordId={activeAnalysisRecordId}
              setActiveAnalysisRecordId={setActiveAnalysisRecordId}
              recordAnalysisDrafts={recordAnalysisDrafts}
              updateRecordAnalysisDraft={updateRecordAnalysisDraft}
              autoSuggestRecordAnalysis={autoSuggestRecordAnalysis}
              saveRecordAnalysis={saveRecordAnalysis}
              openRecordUploader={openRecordUploader}
              recordsInputRef={recordsInputRef}
              uploadRecord={uploadRecord}
              recordStatus={recordStatus}
              apiBase={API_BASE}
              deleteRecord={deleteRecord}
              t={t}
            />
          )}

          {activePatientTab === "triage" && (
            <TriagePanel
              t={t}
              submitTriage={submitTriage}
              triageType={triageType}
              setTriageType={setTriageType}
              triageForm={triageForm}
              updateTriageField={updateTriageField}
              dentalForm={dentalForm}
              updateDentalField={updateDentalField}
              commonSymptoms={commonSymptoms}
              dentalSymptomsOptions={dentalSymptomsOptions}
              redFlagOptions={redFlagOptions}
              dentalRedFlagOptions={dentalRedFlagOptions}
              toggleArrayValue={toggleArrayValue}
              toggleDentalArrayValue={toggleDentalArrayValue}
              translateSymptom={translateSymptom}
              triageLoading={triageLoading}
              triageError={triageError}
              triageResult={triageResult}
              history={history}
              saveTriageDraftNow={saveTriageDraftNow}
              clearTriageDraft={clearTriageDraft}
              triageDraftStatus={triageDraftStatus}
              triageHistoryQuery={triageHistoryQuery}
              setTriageHistoryQuery={setTriageHistoryQuery}
              triageHistoryLevel={triageHistoryLevel}
              setTriageHistoryLevel={setTriageHistoryLevel}
              filteredHistory={filteredHistory}
            />
          )}

          {activePatientTab === "pharmacy" && (
            <section className="panel">
              <h2>Pharmacy</h2>
              <p className="panel-sub">Compare nearby pharmacies by speed and fulfilment mode.</p>
              <MarketplaceView
                type="pharmacy"
                labListings={labListings}
                pharmacyListings={pharmacyListings}
                labAreaSearch={labAreaSearch}
                setLabAreaSearch={setLabAreaSearch}
                labArea={labArea}
                setLabArea={setLabArea}
                labAreas={labAreas}
                labMode={labMode}
                setLabMode={setLabMode}
                activeLabId={activeLabId}
                setActiveLabId={setActiveLabId}
                labSort={labSort}
                setLabSort={setLabSort}
                pharmacySearch={pharmacySearch}
                setPharmacySearch={setPharmacySearch}
                pharmacyMode={pharmacyMode}
                setPharmacyMode={setPharmacyMode}
                pharmacySort={pharmacySort}
                setPharmacySort={setPharmacySort}
                cartItems={cartItems}
                cartTotal={cartTotal}
                setCartOpen={setCartOpen}
                marketplaceLoading={marketplaceLoading}
                marketplaceRequests={marketplaceRequests}
                marketplaceTimelineOpenByRequest={marketplaceTimelineOpenByRequest}
                toggleMarketplaceRequestTimeline={toggleMarketplaceRequestTimeline}
                updateMarketplaceRequestStatus={updateMarketplaceRequestStatus}
                marketplaceTimelineByRequest={marketplaceTimelineByRequest}
                marketplaceTimelineLoadingByRequest={marketplaceTimelineLoadingByRequest}
                marketplaceStatus={marketplaceStatus}
                marketplaceAnalytics={marketplaceAnalytics}
                labRequestsView={labRequestsView}
                setLabRequestsView={setLabRequestsView}
                pharmacyRequestsView={pharmacyRequestsView}
                setPharmacyRequestsView={setPharmacyRequestsView}
                sortLabs={sortLabs}
                sortPharmacies={sortPharmacies}
                formatPriceLastUpdated={formatPriceLastUpdated}
                formatFulfillmentTime={formatFulfillmentTime}
                formatMarketplaceStatus={formatMarketplaceStatus}
                addToCart={addToCart}
              />
            </section>
          )}

          {activePatientTab === "hospital" && (
            <HospitalContentView
              hospitalContent={hospitalContent}
              hospitalContentStatus={hospitalContentStatus}
              hospitalSections={hospitalSections}
              activeHospitalSection={activeHospitalSection}
              setActiveHospitalSection={setActiveHospitalSection}
            />
          )}

          {activePatientTab === "alerts" && (
            <AlertsPanel
              notifications={notifications}
              markAllAndRefresh={async () => {
                await markNotificationsRead();
                await loadNotifications();
              }}
              loadNotifications={loadNotifications}
            />
          )}

          {cartOpen ? (
            <div className="modal-backdrop" onClick={() => setCartOpen(false)}>
              <div className="modal appointment-modal" onClick={(event) => event.stopPropagation()}>
                <div className="section-head compact">
                  <div>
                    <p className="eyebrow">Checkout</p>
                    <h2>Confirm your requests</h2>
                    <p className="panel-sub">{cartItems.length} items in cart</p>
                  </div>
                  <button className="ghost" type="button" onClick={() => setCartOpen(false)}>
                    Close
                  </button>
                </div>
                {cartItems.length === 0 ? (
                  <p className="micro">Your cart is empty.</p>
                ) : (
                  <div className="marketplace-cart-list">
                    {cartItems.map((item) => (
                      <div key={`cart-${item.id}`} className="marketplace-cart-row">
                        <div>
                          <p className="history-headline">{item.serviceName}</p>
                          <p className="micro">{item.partnerName || "Partner"}</p>
                          <p className="micro">{item.fulfillmentMode}</p>
                        </div>
                        <div className="marketplace-cart-side">
                          <strong className="marketplace-cart-price">Rs {item.listedPrice}</strong>
                          <button type="button" className="ghost" onClick={() => removeCartItem(item.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="marketplace-checkout-fields">
                  <label className="block">
                    Delivery / visit address
                    <textarea
                      rows={3}
                      value={checkoutAddress}
                      onChange={(event) => setCheckoutAddress(event.target.value)}
                      placeholder="House, street, landmark, city"
                    />
                  </label>
                  <label className="block">
                    Notes for partner
                    <input
                      type="text"
                      value={checkoutNotes}
                      onChange={(event) => setCheckoutNotes(event.target.value)}
                      placeholder="Optional instructions"
                    />
                  </label>
                </div>
                <div className="action-row">
                  <button
                    className="primary"
                    type="button"
                    onClick={checkoutCart}
                    disabled={checkoutLoading || cartItems.length === 0}
                  >
                    {checkoutLoading ? "Processing..." : `Place order • Rs ${cartTotal}`}
                  </button>
                </div>
                {checkoutStatus ? <p className="micro">{checkoutStatus}</p> : null}
              </div>
            </div>
          ) : null}

      {appointmentDetail ? (
        <AppointmentDetailModal
              appointmentDetail={appointmentDetail}
              closeAppointmentDetail={closeAppointmentDetail}
              appointmentRescheduleForm={appointmentRescheduleForm}
              setAppointmentRescheduleForm={setAppointmentRescheduleForm}
              rescheduleAppointmentFromDetail={rescheduleAppointmentFromDetail}
              cancelAppointmentFromDetail={cancelAppointmentFromDetail}
              appointmentActionStatus={appointmentActionStatus}
              appointmentTimeline={appointmentTimeline}
              paymentGatewayConfig={paymentGatewayConfig}
              payForAppointment={payForAppointment}
              paymentLoadingKey={paymentLoadingKey}
              consultPaymentStatus={consultPaymentStatus}
            />
      ) : null}

      {teleconsultRoomOpen && activeConsult ? (
        <TeleconsultRoomModal
          consult={activeConsult}
          authToken={authToken}
          apiBase={API_BASE}
          currentUserId={user?.id}
          closeTeleconsultRoom={closeTeleconsultRoom}
          teleStatusLabel={teleStatusLabel}
          consultMessages={consultMessages}
          consultCallEvents={consultCallEvents}
          consultConsentSummary={consultConsentSummary}
          acceptConsultConsent={acceptConsultConsent}
          consultMessageText={consultMessageText}
          setConsultMessageText={setConsultMessageText}
          sendConsultMessage={sendConsultMessage}
          sendConsultCallEvent={sendConsultCallEvent}
          consultMessageStatus={consultMessageStatus}
        />
      ) : null}

        {profileEditMode ? (
          <ProfileEditModal
            user={user}
            setProfileEditMode={setProfileEditMode}
            saveProfile={saveProfile}
            profileWizardStep={profileWizardStep}
            setProfileWizardStep={setProfileWizardStep}
            profileForm={profileForm}
            updateProfileField={updateProfileField}
            setProfileForm={setProfileForm}
            departments={departments}
            profileDepartmentDoctors={profileDepartmentDoctors}
            profileValidationErrors={profileValidationErrors}
            profileStepReady={profileStepReady}
            profileStatus={profileStatus}
            t={t}
          />
        ) : null}
        </main>

        <nav className="patient-bottom-nav">
          {primaryPatientTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activePatientTab === tab.key ? "active" : ""}
              onClick={() => openPatientTab(tab.key)}
              title={tab.label}
              aria-label={tab.label}
            >
              <span className="tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  }

  const legacyShellProps = {
    shell: {
      t,
      language,
      setLanguage,
      user,
      signOut,
      setAuthMode,
      scrollToSection,
    },
    heroTriage: {
      t,
      language,
      user,
      signOut,
      setAuthMode,
      scrollToSection,
      isOpsUser,
      profileSummary,
      profileCompletion,
      lastGuidance,
      sharePass,
      generateSharePass,
      openRecordUploader,
      triageType,
      setTriageType,
      submitTriage,
      triageForm,
      updateTriageField,
      dentalForm,
      updateDentalField,
      commonSymptoms,
      dentalSymptomsOptions,
      redFlagOptions,
      dentalRedFlagOptions,
      toggleArrayValue,
      toggleDentalArrayValue,
      translateSymptom,
      handlePhotoChange,
      removeTriagePhoto,
      triageLoading,
      triageError,
      triageResult,
      downloadVisitPdf,
      handleGuidanceFeedback,
      handleVisitFollowup,
      feedbackStatus,
      authMode,
      handleAuth,
      authForm,
      updateAuthField,
      authError,
      resetForm,
      setResetForm,
      requestPasswordReset,
      confirmPasswordReset,
      resetStatus,
    },
    adminFallback: {
      user,
      adminOpsStatus,
      opsQueueStatus,
      adminOps,
      opsQueue,
      updateAppointmentStatus,
      billingDrafts,
      updateBillingDraft,
      saveBillingForAppointment,
      viewReceipt,
      loadAdminOps,
      loadOpsQueue,
      adminUsersStatus,
      loadAdminUsers,
      adminUsers,
      updateAdminUserDraft,
      adminSavingUserId,
      saveAdminUser,
      departments,
    },
    patientFlows: {
      t,
      user,
      isOpsUser,
      profileEditMode,
      setProfileEditMode,
      profileForm,
      departments,
      profileDepartmentDoctors,
      saveProfile,
      updateProfileField,
      setProfileForm,
      profileStatus,
      history,
      visibleHistory,
      historyExpanded,
      setHistoryExpanded,
      historyStatus,
      memberForm,
      setMemberForm,
      saveFamilyMember,
      familyStatus,
      activeMemberId,
      setActiveMemberId,
      familyMembers,
      recordsInputRef,
      uploadRecord,
      recordStatus,
      records,
      deleteRecord,
      generateEmergencyCard,
      emergencyCard,
      sharePassStatus,
      sharePass,
      generateSharePass,
      shareQr,
      shareHistory,
      careRequestMode,
      setCareRequestMode,
      submitCareRequest,
      appointmentForm,
      setAppointmentForm,
      departmentDoctors,
      availableSlots,
      slotStatus,
      teleForm,
      updateTeleField,
      teleStatus,
      appointmentsStatus,
      teleLoading,
      teleconsults,
      appointments,
      activeConsultId,
      setActiveConsultId,
      teleStatusLabel,
      activeConsult,
      consultMessages,
      sendConsultMessage,
      consultMessageText,
      setConsultMessageText,
      consultMessageStatus,
      encounters,
      activeEncounterId,
      setActiveEncounterId,
      encounterDetail,
      encounterStatus,
    },
    publicInfo: {
      t,
      formatNumber,
      liveStats,
      showDisclaimer,
      acceptDisclaimer,
      chatOpen,
      setChatOpen,
      chatMessages,
      chatLoading,
      sendChatMessage,
      chatInput,
      setChatInput,
    },
  };

  return (
    <LegacyPortalShell {...legacyShellProps} />
  );
}

export default App;
