import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const MARKETPLACE_REFRESH_KEY = "health_marketplace_requests_refresh";

const copy = {
  en: {
    brandTitle: "SehatSaathi",
    brandSubtitle: "India-first health guidance",
    navCreate: "Create account",
    navStart: "Start triage",
    navSignOut: "Sign out",
    heroEyebrow: "Made for Bharat-first care",
    heroTitle: "Fast, clear, and safe guidance for every home in India.",
    heroLead:
      "SehatSaathi collects symptoms, checks for red flags, and shares next-step guidance without replacing a clinician.",
    heroStart: "Start triage",
    heroHow: "How it works",
    heroNotice: "This is not a diagnosis. In emergencies, seek care immediately.",
    safetyTitle: "Safety first",
    safetySummary:
      "Create an account to save your profile and triage history.",
    safetySummaryAuthed: "Welcome back, {name}. Your guidance and history are saved securely.",
    pillOffline: "Offline friendly",
    pillPrivacy: "Privacy focused",
    pillBharat: "Bharat-ready",
    statTime: "Avg. triage time",
    statAccess: "Always available",
    statSave: "To save guidance",
    triageTitle: "Smart symptom triage",
    triageSubtitle: "Share symptoms and get safe guidance within minutes.",
    age: "Age",
    sex: "Sex",
    duration: "Duration (days)",
    severity: "Severity",
    commonSymptoms: "Common symptoms",
    additionalSymptoms: "Additional symptoms (comma separated)",
    additionalPlaceholder: "Example: stomach pain, rash",
    redFlags: "Red-flag symptoms",
    getGuidance: "Get guidance",
    runningTriage: "Running triage...",
    guidanceTitle: "Your guidance",
    guidanceEmpty:
      "Complete the triage form to see guidance here.",
    guidanceNote:
      "Guidance is not a diagnosis and does not replace a clinician.",
    account: "Account",
    patientPortal: "Patient login",
    doctorPortal: "Doctor login",
    continueAsDoctor: "Open doctor dashboard",
    doctorNoAccess: "Doctor access is not enabled for this account yet.",
    doctorSignupInfo: "Doctor account created. Admin approval is required before console access.",
    signIn: "Sign in",
    create: "Create",
    name: "Name",
    email: "Email",
    password: "Password",
    createAccount: "Create account",
    profileTitle: "Profile",
    profileSubtitle: "Save health context for more reliable guidance.",
    region: "Region or district",
    regionPlaceholder: "Example: Nashik, Maharashtra",
    conditions: "Chronic conditions (comma separated)",
    conditionsPlaceholder: "Example: diabetes, asthma",
    allergies: "Allergies (comma separated)",
    allergiesPlaceholder: "Example: penicillin, peanuts",
    saveProfile: "Save profile",
    historyTitle: "History",
    historyEmpty: "No triage history yet.",
    historySignIn: "Sign in to view your recent guidance.",
    historyShowMore: "Show full history",
    historyShowLess: "Show less",
    directoryTitle: "Doctor directory (coming soon)",
    directoryDesc:
      "We are building a verified list of local doctors, clinics, and community health workers. This will go live after validation.",
    directoryCard1: "Primary care clinics",
    directoryCard1Desc: "Search by district and speciality.",
    directoryCard2: "Community health workers",
    directoryCard2Desc: "Connect with trusted local health guides.",
    directoryCard3: "Tele-consult partners",
    directoryCard3Desc: "Book calls after triage when needed.",
    teleTitle: "Connect doctor",
    teleSubtitle: "Book remote consults and share follow-up updates from home.",
    teleMode: "Consult type",
    teleModeVideo: "Video",
    teleModeAudio: "Audio",
    teleModeChat: "Chat",
    teleConcern: "Primary concern",
    teleConcernPlaceholder: "Describe symptoms, context, and what help you need.",
    teleSlot: "Preferred slot",
    telePhone: "Phone for callback",
    teleBook: "Book teleconsult",
    teleStatus: "Status",
    teleEmpty: "No teleconsult requests yet.",
    teleOpenThread: "Open thread",
    teleThreadTitle: "Consult thread",
    teleMessagePlaceholder: "Share update for doctor...",
    teleSend: "Send update",
    teleLoading: "Loading teleconsults...",
    teleBooked: "Teleconsult request submitted.",
    teleError: "Unable to process teleconsult request.",
    teleStatusRequested: "Requested",
    teleStatusScheduled: "Scheduled",
    teleStatusInProgress: "In progress",
    teleStatusCompleted: "Completed",
    teleStatusCancelled: "Cancelled",
    careRequestType: "Visit type",
    careRequestInPerson: "In-person appointment",
    careRequestFeedTitle: "Your doctor requests",
    apptTitle: "Appointments",
    apptBook: "Book appointment",
    apptDepartment: "Department",
    apptReason: "Reason",
    apptDateTime: "Preferred date/time",
    apptEmpty: "No appointments yet.",
    encounterTitle: "Doctor clinical records",
    encounterEmpty: "No doctor records yet.",
    encounterOpen: "Open record",
    encounterDoctor: "Doctor",
    encounterDiagnosis: "Diagnosis",
    encounterPlan: "Plan",
    encounterVitals: "Vitals",
    encounterNotes: "Doctor notes",
    encounterPrescription: "Prescription",
    encounterOrders: "Orders",
    doctorChartTitle: "Doctor charting",
    doctorChartCreate: "Create encounter",
    chiefComplaint: "Chief complaint",
    findings: "Findings",
    diagnosisCode: "Diagnosis",
    diagnosisText: "Diagnosis",
    planText: "Care plan",
    followupDate: "Follow-up date",
    addNote: "Add signed note",
    signature: "Signature",
    noteText: "Note text",
    addPrescription: "Add prescription",
    medicines: "Medicines",
    addOrder: "Add order",
    orderType: "Order type",
    orderItem: "Order item",
    destination: "Destination",
    saveEncounter: "Save encounter",
    howTitle: "How it works",
    howBody:
      "1. Share symptoms in under 4 minutes. 2. AI triage checks for red flags and urgency. 3. Receive safe guidance and next steps.",
    designedTitle: "Designed for India",
    designedBody:
      "Works on low bandwidth, supports offline guidance, and keeps sensitive data private by default. More languages and local doctor partners will follow after validation.",
    complianceTitle: "Compliance",
    complianceBody:
      "This app provides general information, not diagnosis. It is built to align with Indian telemedicine guidance and safety standards.",
    trustTitle: "Why families trust SehatSaathi",
    trustCard1: "Clinician-reviewed guidance",
    trustCard1Desc: "Medical advisors review our triage rules and safety alerts.",
    trustCard2: "Transparent triage logic",
    trustCard2Desc: "We explain why we suggest home care or clinic visits.",
    trustCard3: "Privacy first",
    trustCard3Desc: "We do not sell data. You control what you share.",
    proofTitle: "Live usage dashboard",
    proofLiveNote: "Live numbers from your production database.",
    proofUsersLabel: "Registered users",
    proofTriageLabel: "Triage sessions",
    proofDoctorViewsLabel: "Doctor summary opens",
    howDecideTitle: "How we decide",
    howDecideBody:
      "We check severity, duration, age risk, and red-flag symptoms to suggest next steps. You always choose what to do next.",
    advisorTitle: "Medical advisors",
    advisorRole1: "Family physician (advisor)",
    advisorRole2: "Community health specialist (advisor)",
    advisorRole3: "Telemedicine consultant (advisor)",
    footer: "SehatSaathi • General guidance only • Built for web and iOS",
    disclaimerTitle: "Safety notice",
    disclaimerBody:
      "SehatSaathi provides general health guidance, not a medical diagnosis. If you have severe symptoms or an emergency, seek immediate care.",
    disclaimerConfirm:
      "By continuing, you confirm you understand this limitation.",
    disclaimerCta: "I understand, continue",
    langComing: "Gujarati coming soon",
    healthPassTitle: "Health pass for doctors",
    healthPassBody:
      "Generate a 30-minute share code so a doctor or clinic can view your profile and recent guidance.",
    generatePass: "Generate health pass",
    passCode: "Share code",
    passExpires: "Expires",
    passOpenDoctorView: "Open doctor view",
    passGenerating: "Generating...",
    passFailed: "Unable to generate pass.",
    triageSource: "Guidance source",
    sourceFallback: "Fallback rules",
    sourceLocalModel: "Local ML model",
    sourceGemini: "Gemini AI",
    sourceOpenai: "OpenAI",
    doctorViewTitle: "Doctor summary view",
    doctorViewLoading: "Loading patient summary...",
    doctorViewExpired: "This health pass is invalid or expired.",
    doctorViewPatient: "Patient",
    doctorViewProfile: "Profile",
    doctorViewRecent: "Recent guidance",
    doctorSymptoms: "Symptoms",
    doctorSeverity: "Severity",
    doctorDuration: "Duration",
    doctorRedFlags: "Red flags",
    doctorSource: "Source",
    doctorNone: "None",
    doctorDays: "days",
    doctorRatePrompt: "Was this summary useful?",
    doctorRateUseful: "Useful",
    doctorRateNotUseful: "Not useful",
    doctorRateSaved: "Doctor rating saved.",
    feedbackPrompt: "Did this guidance help your decision?",
    feedbackYes: "Yes, helpful",
    feedbackNo: "No, not helpful",
    followupPrompt: "Did a clinic or doctor visit happen after this?",
    followupYes: "Yes, visit happened",
    followupNo: "No, not yet",
    feedbackSaved: "Feedback saved.",
    memberTitle: "Care command center",
    memberSubtitle: "Your fast controls for triage, doctor sharing, and health records.",
    memberCardProfile: "Profile completion",
    memberCardLast: "Last guidance",
    memberCardPass: "Doctor share pass",
    memberCardRecords: "Medical records",
    memberOpenProfile: "Open profile",
    memberOpenHistory: "Open history",
    memberOpenPass: "Generate pass",
    memberUploadDocs: "Upload soon",
    memberNoTriage: "No triage yet",
    chatTitle: "SehatSaathi Assistant",
    chatOpen: "Chat",
    chatPlaceholder: "Type your question...",
    chatSend: "Send",
    chatThinking: "Thinking...",
    chatGreeting: "Hi, I can help with symptoms, triage steps, and what to do before clinic visits.",
    familyTitle: "Family profiles",
    addMember: "Add member",
    relation: "Relation",
    bloodType: "Blood type",
    saveMember: "Save member",
    recordsTitle: "Medical records",
    uploadRecord: "Upload report (PDF/Image)",
    emergencyCard: "Emergency card",
    generateEmergencyCard: "Generate emergency card",
    openEmergencyCard: "Open emergency card",
    shareHistory: "Share history",
    downloadVisitPdf: "Download visit summary PDF",
    clinicTitle: "Clinic starter page",
    doctorConsoleTitle: "Doctor dashboard",
    doctorConsoleSubtitle: "Manage remote consult requests and respond to patients.",
    doctorConsoleSignIn: "Doctor/admin sign in required.",
    doctorConsoleNoAccess: "Your account does not have doctor access.",
    doctorConsoleUpdate: "Update consult",
    doctorConsoleMeetingUrl: "Meeting URL",
    doctorConsoleSave: "Save status",
    doctorConsoleSaved: "Consult status updated.",
    doctorConsoleOpen: "Open doctor dashboard",
    clinicCodePlaceholder: "Enter 6-digit code",
    clinicOpen: "Open patient summary",
    doctorLanguage: "Doctor language",
    qrReady: "QR ready",
    oneTimeCodeNote: "Code is one-time and expires in 30 minutes.",
    clinicScanStart: "Start QR scan",
    clinicScanStop: "Stop QR scan",
    clinicScanUnsupported: "QR camera scan is not supported on this browser. Use code entry.",
    clinicScannerActive: "Scanner active. Point camera at SehatSaathi QR.",
    clinicScanInvalid: "QR scanned, but no valid share code found.",
    doctorDownloadRecord: "Download record",
    removePhoto: "Remove photo",
    removeRecord: "Delete",
    triageModeGeneral: "General",
    triageModeDental: "Dental",
    dentalSymptoms: "Dental symptoms",
    dentalPainScale: "Dental pain scale (1-10)",
    dentalHotColdTrigger: "Pain triggered by hot/cold",
    dentalSwelling: "Visible facial/gum swelling",
    dentalRedFlags: "Dental red flags",
  },
  gu: {
    brandTitle: "સેહતસાથી",
    brandSubtitle: "ભારત માટે આરોગ્ય માર્ગદર્શન",
    navCreate: "એકાઉન્ટ બનાવો",
    navStart: "ટ્રાયેજ શરૂ કરો",
    navSignOut: "સાઇન આઉટ",
    heroEyebrow: "ભારત-ફર્સ્ટ કાળજી માટે બનાવેલ",
    heroTitle: "ભારતના દરેક ઘરમાં ઝડપી, સ્પષ્ટ અને સુરક્ષિત માર્ગદર્શન.",
    heroLead:
      "સેહતસાથી લક્ષણો એકત્ર કરે છે, રેડ ફ્લેગ ચેક કરે છે અને ડૉક્ટરને બદલી્યા વગર આગળ શું કરવું તે જણાવે છે.",
    heroStart: "ટ્રાયેજ શરૂ કરો",
    heroHow: "કેવી રીતે કામ કરે છે",
    heroNotice:
      "આ નિદાન નથી. ઇમર્જન્સીમાં તરત સારવાર લો.",
    safetyTitle: "સેફટી પ્રથમ",
    safetySummary:
      "તમારો પ્રોફાઇલ અને ટ્રાયેજ ઇતિહાસ સાચવવા એકાઉન્ટ બનાવો.",
    safetySummaryAuthed:
      "પાછા સ્વાગત, {name}. તમારું માર્ગદર્શન અને ઇતિહાસ સુરક્ષિત રીતે સાચવાયું છે.",
    pillOffline: "ઓફલાઇન-ફ્રેન્ડલી",
    pillPrivacy: "પ્રાઇવસી ફોકસ",
    pillBharat: "ભારત-રેડી",
    statTime: "સરેરાશ ટ્રાયેજ સમય",
    statAccess: "હંમેશા ઉપલબ્ધ",
    statSave: "માર્ગદર્શન સાચવવા",
    triageTitle: "સ્માર્ટ સિમ્પ્ટમ ટ્રાયેજ",
    triageSubtitle: "લક્ષણો શેર કરો અને મિનિટોમાં સુરક્ષિત માર્ગદર્શન મેળવો.",
    age: "વય",
    sex: "લિંગ",
    duration: "સમયગાળો (દિવસ)",
    severity: "તીવ્રતા",
    commonSymptoms: "સામાન્ય લક્ષણો",
    additionalSymptoms: "વધારાના લક્ષણો (કૉમા દ્વારા અલગ કરો)",
    additionalPlaceholder: "ઉદાહરણ: પેટમાં દુખાવો, ચામડી પર ચક્કા",
    redFlags: "રેડ-ફ્લેગ લક્ષણો",
    getGuidance: "માર્ગદર્શન મેળવો",
    runningTriage: "ટ્રાયેજ ચાલી રહ્યું છે...",
    guidanceTitle: "તમારું માર્ગદર્શન",
    guidanceEmpty: "માર્ગદર્શન જોવા માટે ટ્રાયેજ ફોર્મ ભરો.",
    guidanceNote:
      "આ નિદાન નથી અને ડૉક્ટરને બદલે નહીં.",
    account: "એકાઉન્ટ",
    patientPortal: "પેશન્ટ લોગિન",
    doctorPortal: "ડૉક્ટર લોગિન",
    continueAsDoctor: "ડૉક્ટર ડેશબોર્ડ ખોલો",
    doctorNoAccess: "આ એકાઉન્ટ માટે ડૉક્ટર ઍક્સેસ હજુ સક્રિય નથી.",
    doctorSignupInfo: "ડૉક્ટર એકાઉન્ટ બનાવાયું. કન્સોલ ઍક્સેસ માટે એડમિન મંજૂરી જરૂરી છે.",
    signIn: "સાઇન ઇન",
    create: "બનાવો",
    name: "નામ",
    email: "ઈમેલ",
    password: "પાસવર્ડ",
    createAccount: "એકાઉન્ટ બનાવો",
    profileTitle: "પ્રોફાઇલ",
    profileSubtitle: "વધુ વિશ્વસનીય માર્ગદર્શન માટે આરોગ્ય માહિતી સાચવો.",
    region: "પ્રદેશ અથવા જિલ્લા",
    regionPlaceholder: "ઉદાહરણ: રાજકોટ, ગુજરાત",
    conditions: "દીર્ઘકાળીન બીમારીઓ (કૉમા દ્વારા)",
    conditionsPlaceholder: "ઉદાહરણ: ડાયાબિટીસ, અસ્થમા",
    allergies: "એલર્જી (કૉમા દ્વારા)",
    allergiesPlaceholder: "ઉદાહરણ: પેનિસિલિન, મગફળી",
    saveProfile: "પ્રોફાઇલ સાચવો",
    historyTitle: "ઇતિહાસ",
    historyEmpty: "હજુ ટ્રાયેજ ઇતિહાસ નથી.",
    historySignIn: "તાજેતરનું માર્ગદર્શન જોવા સાઇન ઇન કરો.",
    historyShowMore: "પૂર્ણ ઇતિહાસ જુઓ",
    historyShowLess: "ઓછું બતાવો",
    directoryTitle: "ડૉક્ટર ડિરેક્ટરી (જલ્દી આવી રહી છે)",
    directoryDesc:
      "અમે સ્થાનિક ડૉક્ટરો, ક્લિનિક્સ અને સમુદાય આરોગ્ય કર્મીઓની ચકાસેલી સૂચિ બનાવી રહ્યા છીએ.",
    directoryCard1: "પ્રાથમિક કાળજી ક્લિનિક્સ",
    directoryCard1Desc: "જિલ્લા અને સ્પેશિયલિટી મુજબ શોધો.",
    directoryCard2: "સમુદાય આરોગ્ય કર્મીઓ",
    directoryCard2Desc: "વિશ્વસનીય સ્થાનિક આરોગ્ય માર્ગદર્શકો જોડાવો.",
    directoryCard3: "ટેલિ-કન્સલ્ટ પાર્ટનર્સ",
    directoryCard3Desc: "જરૂર પડે ત્યારે કોલ બુક કરો.",
    teleTitle: "ઘરેથી ડૉક્ટર કનેક્ટ",
    teleSubtitle: "ઘરે બેઠા ટેલિકન્સલ્ટ બુક કરો અને ફોલો-અપ અપડેટ મોકલો.",
    teleMode: "કન્સલ્ટ પ્રકાર",
    teleModeVideo: "વિડિયો",
    teleModeAudio: "ઑડિયો",
    teleModeChat: "ચેટ",
    teleConcern: "મુખ્ય સમસ્યા",
    teleConcernPlaceholder: "લક્ષણો અને જરૂરી મદદ ટૂંકમાં લખો.",
    teleSlot: "પસંદીદા સમય",
    telePhone: "કૉલબેક ફોન",
    teleBook: "ટેલિકન્સલ્ટ બુક કરો",
    teleStatus: "સ્થિતિ",
    teleEmpty: "હજુ સુધી ટેલિકન્સલ્ટ વિનંતી નથી.",
    teleOpenThread: "થ્રેડ ખોલો",
    teleThreadTitle: "કન્સલ્ટ થ્રેડ",
    teleMessagePlaceholder: "ડૉક્ટર માટે અપડેટ લખો...",
    teleSend: "મોકલો",
    teleLoading: "ટેલિકન્સલ્ટ લોડ થઈ રહ્યું છે...",
    teleBooked: "ટેલિકન્સલ્ટ વિનંતી મોકલાઈ.",
    teleError: "ટેલિકન્સલ્ટ વિનંતી પ્રક્રિયા થઈ શકી નહીં.",
    teleStatusRequested: "વિનંતી મોકલાઈ",
    teleStatusScheduled: "શેડ્યૂલ",
    teleStatusInProgress: "ચાલુ",
    teleStatusCompleted: "પૂર્ણ",
    teleStatusCancelled: "રદ",
    careRequestType: "વિઝિટ પ્રકાર",
    careRequestInPerson: "સામે-સામે અપોઇન્ટમેન્ટ",
    careRequestFeedTitle: "તમારી ડૉક્ટર વિનંતીઓ",
    howTitle: "કેવી રીતે કામ કરે છે",
    howBody:
      "1. 4 મિનિટમાં લક્ષણો શેર કરો. 2. ટ્રાયેજ રેડ ફ્લેગ અને તાત્કાલિકતા ચેક કરે છે. 3. સુરક્ષિત માર્ગદર્શન મેળવો.",
    designedTitle: "ભારત માટે ડિઝાઇન",
    designedBody:
      "લો બૅન્ડવિડ્થ પર ચાલે છે, ઓફલાઇન માર્ગદર્શન સપોર્ટ કરે છે અને ડેટા પ્રાઇવસી રાખે છે.",
    complianceTitle: "કમ્પ્લાયન્સ",
    complianceBody:
      "આ એપ સામાન્ય માહિતી આપે છે, નિદાન નથી. તે ભારતીય ટેલિમેડિસિન માર્ગદર્શિકા સાથે સુસંગત છે.",
    trustTitle: "પરિવારો કેમ વિશ્વાસ કરે છે",
    trustCard1: "ક્લિનિશિયન સમીક્ષિત માર્ગદર્શન",
    trustCard1Desc: "અમારા ટ્રાયેજ નિયમો અને સેફટી એલર્ટ ડૉક્ટરો ચકાસે છે.",
    trustCard2: "પારદર્શક ટ્રાયેજ લોજિક",
    trustCard2Desc: "અમે ઘરે સંભાળ કે ક્લિનિક ભલામણ કેમ કરીએ તે જણાવીએ છીએ.",
    trustCard3: "પ્રાઇવસી પ્રથમ",
    trustCard3Desc: "અમે ડેટા વેચતા નથી. તમે શું શેર કરવું તે તમે નક્કી કરો.",
    proofTitle: "લાઇવ યુઝેજ ડેશબોર્ડ",
    proofLiveNote: "તમારા પ્રોડક્શન ડેટાબેઝમાંથી લાઇવ આંકડા.",
    proofUsersLabel: "રજિસ્ટર્ડ યુઝર્સ",
    proofTriageLabel: "ટ્રાયેજ સેશન્સ",
    proofDoctorViewsLabel: "ડૉક્ટર સમરી ઓપન",
    howDecideTitle: "અમે કેવી રીતે નક્કી કરીએ",
    howDecideBody:
      "અમે તીવ્રતા, સમયગાળો, વય જોખમ અને રેડ-ફ્લેગ લક્ષણો તપાસી આગળ શું કરવું તે સૂચવીએ છીએ.",
    advisorTitle: "મેડિકલ એડવાઇઝર્સ",
    advisorRole1: "ફેમિલી ફિઝિશિયન (એડવાઇઝર)",
    advisorRole2: "કોમ્યુનિટી હેલ્થ સ્પેશ્યાલિસ્ટ (એડવાઇઝર)",
    advisorRole3: "ટેલિમેડિસિન કન્સલ્ટન્ટ (એડવાઇઝર)",
    footer: "સેહતસાથી • સામાન્ય માર્ગદર્શન માત્ર • વેબ અને iOS માટે બનાવેલ",
    disclaimerTitle: "સેફટી સૂચના",
    disclaimerBody:
      "સેહતસાથી સામાન્ય આરોગ્ય માર્ગદર્શન આપે છે, નિદાન નથી. ગંભીર લક્ષણો હોય તો તરત સારવાર લો.",
    disclaimerConfirm:
      "આગળ વધતાં તમે આ મર્યાદા સમજો છો તે સ્વીકારો છો.",
    disclaimerCta: "હું સમજ્યો, આગળ વધો",
    langComing: "ગુજરાતી ટૂંક સમયમાં",
    healthPassTitle: "ડૉક્ટર માટે હેલ્થ પાસ",
    healthPassBody:
      "30 મિનિટ માટે શેર કોડ બનાવો જેથી ડૉક્ટર અથવા ક્લિનિક તમારી પ્રોફાઇલ અને તાજેતરનું માર્ગદર્શન જોઈ શકે.",
    generatePass: "હેલ્થ પાસ બનાવો",
    passCode: "શેર કોડ",
    passExpires: "સમાપ્તિ સમય",
    passOpenDoctorView: "ડૉક્ટર વ્યૂ ખોલો",
    passGenerating: "બનાવી રહ્યું છે...",
    passFailed: "હેલ્થ પાસ બનાવી શકાયો નહીં.",
    triageSource: "માર્ગદર્શન સ્ત્રોત",
    sourceFallback: "ફોલબેક નિયમો",
    sourceLocalModel: "લોકલ ML મોડલ",
    sourceGemini: "Gemini AI",
    sourceOpenai: "OpenAI",
    doctorViewTitle: "ડૉક્ટર સમરી વ્યૂ",
    doctorViewLoading: "પેશન્ટ સમરી લોડ થઈ રહી છે...",
    doctorViewExpired: "આ હેલ્થ પાસ અમાન્ય છે અથવા સમાપ્ત થયો છે.",
    doctorViewPatient: "પેશન્ટ",
    doctorViewProfile: "પ્રોફાઇલ",
    doctorViewRecent: "તાજેતરનું માર્ગદર્શન",
    doctorSymptoms: "લક્ષણો",
    doctorSeverity: "તીવ્રતા",
    doctorDuration: "સમયગાળો",
    doctorRedFlags: "રેડ ફ્લેગ્સ",
    doctorSource: "સ્ત્રોત",
    doctorNone: "નથી",
    doctorDays: "દિવસ",
    doctorRatePrompt: "આ સમરી ઉપયોગી હતી?",
    doctorRateUseful: "ઉપયોગી",
    doctorRateNotUseful: "ઉપયોગી નહોતી",
    doctorRateSaved: "ડૉક્ટર રેટિંગ સેવ થયું.",
    feedbackPrompt: "આ માર્ગદર્શનથી નિર્ણયમાં મદદ મળી?",
    feedbackYes: "હા, મદદ મળી",
    feedbackNo: "ના, મદદ મળી નહીં",
    followupPrompt: "પછી ક્લિનિક/ડૉક્ટર મુલાકાત થઈ?",
    followupYes: "હા, મુલાકાત થઈ",
    followupNo: "ના, હજુ નહીં",
    feedbackSaved: "ફીડબેક સેવ થયું.",
    memberTitle: "કેર કમાન્ડ સેન્ટર",
    memberSubtitle: "ટ્રાયેજ, ડૉક્ટર શેરિંગ અને હેલ્થ રેકોર્ડ્સ માટે ઝડપી નિયંત્રણો.",
    memberCardProfile: "પ્રોફાઇલ પૂર્ણતા",
    memberCardLast: "છેલ્લું માર્ગદર્શન",
    memberCardPass: "ડૉક્ટર શેર પાસ",
    memberCardRecords: "મેડિકલ રેકોર્ડ્સ",
    memberOpenProfile: "પ્રોફાઇલ ખોલો",
    memberOpenHistory: "ઇતિહાસ ખોલો",
    memberOpenPass: "પાસ બનાવો",
    memberUploadDocs: "જલ્દી અપલોડ",
    memberNoTriage: "હજુ ટ્રાયેજ નથી",
    chatTitle: "સેહતસાથી સહાયક",
    chatOpen: "ચેટ",
    chatPlaceholder: "તમારો પ્રશ્ન લખો...",
    chatSend: "મોકલો",
    chatThinking: "જવાબ તૈયાર થઈ રહ્યો છે...",
    chatGreeting: "નમસ્તે, હું લક્ષણો, ટ્રાયેજ પગલાં અને ક્લિનિક મુલાકાત પહેલા શું કરવું તેમાં મદદ કરી શકું છું.",
    familyTitle: "કુટુંબ પ્રોફાઇલ્સ",
    addMember: "સભ્ય ઉમેરો",
    relation: "સંબંધ",
    bloodType: "બ્લડ ગ્રુપ",
    saveMember: "સભ્ય સેવ કરો",
    recordsTitle: "મેડિકલ રેકોર્ડ્સ",
    uploadRecord: "રિપોર્ટ અપલોડ કરો (PDF/Image)",
    emergencyCard: "ઇમરજન્સી કાર્ડ",
    generateEmergencyCard: "ઇમરજન્સી કાર્ડ બનાવો",
    openEmergencyCard: "ઇમરજન્સી કાર્ડ ખોલો",
    shareHistory: "શેર ઇતિહાસ",
    downloadVisitPdf: "વિઝિટ સમરી PDF ડાઉનલોડ કરો",
    clinicTitle: "ક્લિનિક સ્ટાર્ટર પેજ",
    doctorConsoleTitle: "ડૉક્ટર ડેશબોર્ડ",
    doctorConsoleSubtitle: "રિમોટ કન્સલ્ટ વિનંતીઓ મેનેજ કરો અને દર્દીને જવાબ આપો.",
    doctorConsoleSignIn: "ડૉક્ટર/એડમિન સાઇન ઇન જરૂરી.",
    doctorConsoleNoAccess: "તમારા એકાઉન્ટ પાસે ડૉક્ટર ઍક્સેસ નથી.",
    doctorConsoleUpdate: "કન્સલ્ટ અપડેટ",
    doctorConsoleMeetingUrl: "મીટિંગ URL",
    doctorConsoleSave: "સ્થિતિ સાચવો",
    doctorConsoleSaved: "કન્સલ્ટ સ્થિતિ અપડેટ થઈ.",
    doctorConsoleOpen: "ડૉક્ટર ડેશબોર્ડ ખોલો",
    clinicCodePlaceholder: "6-અંક કોડ દાખલ કરો",
    clinicOpen: "પેશન્ટ સમરી ખોલો",
    doctorLanguage: "ડૉક્ટર ભાષા",
    qrReady: "QR તૈયાર",
    oneTimeCodeNote: "કોડ એક વખત માટે છે અને 30 મિનિટમાં સમાપ્ત થાય છે.",
    clinicScanStart: "QR સ્કેન શરૂ કરો",
    clinicScanStop: "QR સ્કેન બંધ કરો",
    clinicScanUnsupported: "આ બ્રાઉઝરમાં QR કેમેરા સ્કેન સપોર્ટેડ નથી. કોડ દાખલ કરો.",
    clinicScannerActive: "સ્કેનર ચાલુ છે. કેમેરા QR પર લાવો.",
    clinicScanInvalid: "QR વાંચાયું, પરંતુ માન્ય શેર કોડ મળ્યો નથી.",
    doctorDownloadRecord: "રેકોર્ડ ડાઉનલોડ કરો",
    removePhoto: "ફોટો દૂર કરો",
    removeRecord: "ડિલીટ",
    triageModeGeneral: "જનરલ",
    triageModeDental: "ડેન્ટલ",
    dentalSymptoms: "ડેન્ટલ લક્ષણો",
    dentalPainScale: "ડેન્ટલ પેઇન સ્કેલ (1-10)",
    dentalHotColdTrigger: "ગરમ/ઠંડાથી દુખાવો વધે છે",
    dentalSwelling: "ચહેરા/મસૂડામાં સોજો દેખાય છે",
    dentalRedFlags: "ડેન્ટલ રેડ ફ્લેગ્સ",
  },
};

const commonSymptoms = [
  "Fever",
  "Cough",
  "Sore throat",
  "Headache",
  "Body ache",
  "Fatigue",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Dizziness",
];

const redFlagOptions = [
  "Chest pain",
  "Trouble breathing",
  "Uncontrolled bleeding",
  "Loss of consciousness",
  "Seizure",
  "Severe allergic reaction",
  "Stroke-like symptoms",
  "Suicidal thoughts",
];

const dentalSymptomsOptions = [
  "Tooth pain",
  "Gum swelling",
  "Bleeding gums",
  "Tooth sensitivity",
  "Broken tooth",
  "Wisdom tooth pain",
  "Mouth ulcer",
  "Bad breath",
  "Jaw pain",
];

const dentalRedFlagOptions = [
  "Facial swelling with fever",
  "Difficulty swallowing",
  "Difficulty breathing",
  "Uncontrolled oral bleeding",
  "Trauma with severe bleeding",
];

const symptomTranslations = {
  gu: {
    Fever: "તાવ",
    Cough: "ખાંસી",
    "Sore throat": "ગળામાં દુખાવો",
    Headache: "માથાનો દુખાવો",
    "Body ache": "શરીરમાં દુખાવો",
    Fatigue: "થાક",
    Nausea: "મતલાબ",
    Vomiting: "ઉલટી",
    Diarrhea: "દસ્ત",
    Dizziness: "ચક્કર",
    "Chest pain": "છાતીમાં દુખાવો",
    "Trouble breathing": "શ્વાસ લેવામાં મુશ્કેલી",
    "Uncontrolled bleeding": "નિયંત્રણ વગરનું રક્તસ્ત્રાવ",
    "Loss of consciousness": "બેભાન થવું",
    Seizure: "ઝટકા",
    "Severe allergic reaction": "ગંભીર એલર્જીક પ્રતિક્રિયા",
    "Stroke-like symptoms": "સ્ટ્રોક જેવા લક્ષણો",
    "Suicidal thoughts": "આપઘાતી વિચારો",
  },
};

const fallbackTriage = (payload) => {
  const severity = Number(payload.severity || 3);
  const durationDays = Number(payload.durationDays || 1);
  const redFlags = payload.redFlags || [];
  const hasRedFlags = redFlags.length > 0;

  if (hasRedFlags) {
    return {
      level: "emergency",
      headline: "Seek emergency care now",
      urgency: "Go to the nearest emergency facility or call local emergency services.",
      suggestions: ["Do not delay.", "Ask someone to help you reach care quickly."],
      disclaimer:
        "This is general guidance, not a medical diagnosis. For emergencies, seek immediate care.",
    };
  }

  if (severity >= 4 || durationDays >= 7) {
    return {
      level: "urgent",
      headline: "Talk to a clinician soon",
      urgency: "Consider a local clinic visit within 24-48 hours.",
      suggestions: [
        "Track symptoms over the next 24 hours.",
        "Hydrate and rest.",
        "Seek care if symptoms worsen.",
      ],
      disclaimer:
        "This is general guidance, not a medical diagnosis. For emergencies, seek immediate care.",
    };
  }

  return {
    level: "self_care",
    headline: "Likely manageable with home care",
    urgency: "Monitor symptoms and practice self-care.",
    suggestions: ["Rest, hydrate, and avoid strenuous activity."],
    disclaimer:
      "This is general guidance, not a medical diagnosis. For emergencies, seek immediate care.",
  };
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [language, setLanguage] = useState("en");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [portalType, setPortalType] = useState("patient");
  const [doctorAuthMode, setDoctorAuthMode] = useState("login");
  const [doctorAuthError, setDoctorAuthError] = useState("");
  const [doctorAuthForm, setDoctorAuthForm] = useState({
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
  const [resetTokenPreview, setResetTokenPreview] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersStatus, setAdminUsersStatus] = useState("");
  const [adminSavingUserId, setAdminSavingUserId] = useState(null);
  const [adminOps, setAdminOps] = useState(null);
  const [adminOpsStatus, setAdminOpsStatus] = useState("");
  const [opsQueue, setOpsQueue] = useState([]);
  const [opsQueueStatus, setOpsQueueStatus] = useState("");
  const [billingDrafts, setBillingDrafts] = useState({});

  const [profileForm, setProfileForm] = useState({
    age: "",
    sex: "Female",
    conditions: "",
    allergies: "",
    region: "",
  });
  const [profileStatus, setProfileStatus] = useState("");

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
  const [shareHistory, setShareHistory] = useState([]);
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
  const [consultMessageText, setConsultMessageText] = useState("");
  const [consultMessageStatus, setConsultMessageStatus] = useState("");
  const [doctorConsoleForm, setDoctorConsoleForm] = useState({
    status: "requested",
    meetingUrl: "",
  });
  const [doctorConsoleStatus, setDoctorConsoleStatus] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsStatus, setAppointmentsStatus] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentDoctors, setDepartmentDoctors] = useState([]);
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
  const [pharmacyMode, setPharmacyMode] = useState("home_delivery");
  const [labListings, setLabListings] = useState([]);
  const [pharmacyListings, setPharmacyListings] = useState([]);
  const [marketplaceRequests, setMarketplaceRequests] = useState([]);
  const [marketplaceStatus, setMarketplaceStatus] = useState("");
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
  const labsPageMode = useMemo(() => currentPath === "/labs", [currentPath]);
  const pharmacyPageMode = useMemo(() => currentPath === "/pharmacy", [currentPath]);
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
    if (lang === "gu" || lang === "en") {
      setLanguage(lang);
      setDoctorLang(lang);
    }
    setScannerSupported(
      Boolean(window.BarcodeDetector) && Boolean(navigator?.mediaDevices?.getUserMedia),
    );
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("health_user");
    const savedToken = localStorage.getItem("health_token");
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
        if (!response.ok) throw new Error("invalid");
        const data = await response.json();
        if (active && data.user) {
          setUser(data.user);
          localStorage.setItem("health_user", JSON.stringify(data.user));
        }
      } catch (error) {
        if (active) {
          setAuthToken("");
          setUser(null);
          localStorage.removeItem("health_user");
          localStorage.removeItem("health_token");
        }
      }
    };
    validateSession();
    return () => {
      active = false;
    };
  }, [authToken]);

  const t = (key) => copy[language][key] || copy.en[key] || key;
  const formatNumber = (value) => new Intl.NumberFormat(language === "gu" ? "gu-IN" : "en-IN").format(value || 0);
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
  const renderMarketplacePage = (type) => {
    const isLabs = type === "labs";
    const title = isLabs ? "Labs marketplace" : "Pharmacy marketplace";
    const subtitle = isLabs
      ? "Compare nearby lab packages by price, speed, and visit mode."
      : "Compare nearby pharmacies by delivery fee, speed, and fulfilment mode.";
    const items = isLabs ? labListings : pharmacyListings;

    return (
      <div className="app">
        <main className="doctor-view">
          <section className="panel">
            <div className="action-row">
              <h1>{title}</h1>
              <a className="secondary" href="/">
                Back to patient portal
              </a>
            </div>
            {!sessionReady || (authToken && !user) ? (
              <p className="micro">Loading...</p>
            ) : !user ? (
              <p className="micro">Sign in as a patient first, then open this page again.</p>
            ) : isOpsUser ? (
              <p className="micro">This marketplace is available only in the patient portal.</p>
            ) : (
              <>
                <p className="panel-sub">{subtitle}</p>
                <label className="block">
                  {isLabs ? "Collection mode" : "Fulfilment mode"}
                  <select
                    value={isLabs ? labMode : pharmacyMode}
                    onChange={(event) =>
                      isLabs ? setLabMode(event.target.value) : setPharmacyMode(event.target.value)
                    }
                  >
                    {isLabs ? (
                      <>
                        <option value="home">Home visit</option>
                        <option value="all">In-person / Any</option>
                      </>
                    ) : (
                      <>
                        <option value="home_delivery">Home delivery</option>
                        <option value="pickup">Pickup / In-store</option>
                      </>
                    )}
                  </select>
                </label>
                <div className="history-list">
                  {items.map((item) =>
                    isLabs ? (
                      <div key={`lab-page-${item.id}`} className="history-card">
                        <p className="history-headline">
                          {item.package_name} • Rs {item.effective_price}
                        </p>
                        <p className="micro">
                          {item.partner_name} • {item.area_label || "Nearby"}
                        </p>
                        <p className="micro">
                          {item.distance_km} km • {item.eta_minutes} min
                          {item.home_collection_available ? " • Home visit available" : " • In-person only"}
                        </p>
                        <div className="action-row">
                          {item.home_collection_available && (
                            <button
                              className="secondary"
                              type="button"
                              onClick={() =>
                                createMarketplaceRequest({
                                  requestType: "lab",
                                  partnerId: item.id,
                                  serviceName: item.package_name,
                                  fulfillmentMode: "home_visit",
                                  listedPrice:
                                    item.home_visit_price !== null ? item.home_visit_price : item.price,
                                  notes: `${item.partner_name} • home collection`,
                                })
                              }
                            >
                              Book home visit
                            </button>
                          )}
                          <button
                            className="primary"
                            type="button"
                            onClick={() =>
                              createMarketplaceRequest({
                                requestType: "lab",
                                partnerId: item.id,
                                serviceName: item.package_name,
                                fulfillmentMode: "in_person",
                                listedPrice: item.price,
                                notes: `${item.partner_name} • in-person`,
                              })
                            }
                          >
                            Book in-person
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={`pharmacy-page-${item.id}`} className="history-card">
                        <p className="history-headline">{item.partner_name}</p>
                        <p className="micro">
                          {item.area_label || "Nearby"} • {item.distance_km} km • {item.eta_minutes} min
                        </p>
                        <p className="micro">{item.medicine_price_note}</p>
                        <p className="micro">
                          Delivery fee: Rs {item.delivery_fee}
                          {item.home_delivery_available ? " • Home delivery" : ""}
                          {item.pickup_available ? " • Pickup" : ""}
                        </p>
                        <div className="action-row">
                          {item.home_delivery_available && (
                            <button
                              className="secondary"
                              type="button"
                              onClick={() =>
                                createMarketplaceRequest({
                                  requestType: "pharmacy",
                                  partnerId: item.id,
                                  serviceName: "Prescription fulfilment",
                                  fulfillmentMode: "home_delivery",
                                  listedPrice: item.delivery_fee,
                                  notes: `${item.partner_name} • home delivery`,
                                })
                              }
                            >
                              Order home delivery
                            </button>
                          )}
                          {item.pickup_available && (
                            <button
                              className="primary"
                              type="button"
                              onClick={() =>
                                createMarketplaceRequest({
                                  requestType: "pharmacy",
                                  partnerId: item.id,
                                  serviceName: "Prescription pickup",
                                  fulfillmentMode: "pickup",
                                  listedPrice: 0,
                                  notes: `${item.partner_name} • pickup`,
                                })
                              }
                            >
                              Reserve pickup
                            </button>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
                {marketplaceStatus && <p className="micro">{marketplaceStatus}</p>}
                <h3 style={{ marginTop: 16 }}>Your service requests</h3>
                <div className="history-list">
                  {marketplaceRequests.length === 0 ? (
                    <p className="micro">No lab or pharmacy requests yet.</p>
                  ) : (
                    marketplaceRequests.slice(0, 6).map((item) => (
                      <div key={`marketplace-page-${item.id}`} className="history-card">
                        <p className="history-headline">
                          {item.request_type} • {item.status}
                        </p>
                        <p className="micro">{item.service_name}</p>
                        <p className="micro">
                          {item.fulfillment_mode} • Rs {item.listed_price}
                        </p>
                        <p className="micro">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    );
  };

  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length > 1) return prev;
      return [{ role: "assistant", content: t("chatGreeting") }];
    });
  }, [language]);

  const profileSummary = useMemo(() => {
    if (!user) return t("safetySummary");
    return format(t("safetySummaryAuthed"), { name: user.name });
  }, [user, language]);
  const isOpsUser = user && (user.role === "admin" || user.role === "front_desk");

  const profileCompletion = useMemo(() => {
    const checks = [
      !!profileForm.age,
      !!profileForm.sex,
      !!profileForm.region,
      !!profileForm.conditions,
      !!profileForm.allergies,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profileForm]);

  const lastGuidance = history.length > 0 ? history[0] : null;
  const visibleHistory = historyExpanded ? history : history.slice(0, 3);
  const activeConsult = useMemo(
    () => teleconsults.find((consult) => consult.id === activeConsultId) || null,
    [teleconsults, activeConsultId],
  );

  useEffect(() => {
    if (!activeConsult) return;
    setDoctorConsoleForm({
      status: activeConsult.status || "requested",
      meetingUrl: activeConsult.meetingUrl || "",
    });
  }, [activeConsult]);

  const updateAuthField = (key, value) =>
    setAuthForm((prev) => ({ ...prev, [key]: value }));
  const updateDoctorAuthField = (key, value) =>
    setDoctorAuthForm((prev) => ({ ...prev, [key]: value }));

  const updateTriageField = (key, value) =>
    setTriageForm((prev) => ({ ...prev, [key]: value }));
  const updateDentalField = (key, value) =>
    setDentalForm((prev) => ({ ...prev, [key]: value }));

  const updateProfileField = (key, value) =>
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  const updateTeleField = (key, value) =>
    setTeleForm((prev) => ({ ...prev, [key]: value }));

  const apiFetch = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return fetch(url, { ...options, headers });
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
        setProfileForm({
          age: "",
          sex: "Female",
          conditions: "",
          allergies: "",
          region: "",
        });
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const profile = data.profile || {};
      setProfileForm({
        age: profile.age || "",
        sex: profile.sex || "Female",
        conditions: (profile.conditions || []).join(", "),
        allergies: (profile.allergies || []).join(", "),
        region: profile.region || "",
      });
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
      if (items.length > 0) {
        setActiveConsultId((prev) => prev || items[0].id);
      }
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

  const loadLabListings = async (mode = labMode) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/marketplace/labs?mode=${encodeURIComponent(mode)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceStatus(data.error || "Unable to load labs.");
        return;
      }
      setLabListings(data.labs || []);
    } catch (error) {
      setMarketplaceStatus("Unable to load labs.");
    }
  };

  const loadPharmacyListings = async (mode = pharmacyMode) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/marketplace/pharmacies?mode=${encodeURIComponent(mode)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceStatus(data.error || "Unable to load pharmacies.");
        return;
      }
      setPharmacyListings(data.pharmacies || []);
    } catch (error) {
      setMarketplaceStatus("Unable to load pharmacies.");
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

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!appointmentForm.departmentId) {
      setDepartmentDoctors([]);
      return;
    }
    loadDoctorsForDepartment(appointmentForm.departmentId);
  }, [appointmentForm.departmentId]);

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
      loadTeleconsults();
      loadAppointments();
      loadEncounters();
      loadMarketplaceRequests();
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
      setProfileForm({
        age: "",
        sex: "Female",
        conditions: "",
        allergies: "",
        region: "",
      });
      setHistory([]);
      setFamilyMembers([]);
      setRecords([]);
      setTeleconsults([]);
      setConsultMessages([]);
      setActiveConsultId(null);
      setAppointments([]);
      setEncounters([]);
      setEncounterDetail(null);
      setActiveEncounterId(null);
      setAdminUsers([]);
      setAdminOps(null);
      setOpsQueue([]);
    }
  }, [user, authToken]);

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
    loadRecords(activeMemberId);
  }, [activeMemberId]);

  useEffect(() => {
    if (!activeConsultId) {
      setConsultMessages([]);
      return;
    }
    loadConsultMessages(activeConsultId);
  }, [activeConsultId, authToken]);

  useEffect(() => {
    if (!activeEncounterId) {
      setEncounterDetail(null);
      return;
    }
    loadEncounterDetail(activeEncounterId);
  }, [activeEncounterId, authToken]);

  useEffect(() => {
    if (!user || isOpsUser || !authToken) return;

    const refreshMarketplace = () => {
      loadMarketplaceRequests();
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
    loadLabListings(labMode);
  }, [labMode]);

  useEffect(() => {
    if (!user || isOpsUser) return;
    loadPharmacyListings(pharmacyMode);
  }, [pharmacyMode]);

  useEffect(() => {
    if (doctorConsoleMode) {
      setAuthMode("login");
    }
  }, [doctorConsoleMode]);

  const handleAuth = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      const endpoint =
        authMode === "signup" ? "/api/auth/register" : "/api/auth/login";

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

      setUser(data.user);
      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem("health_token", data.token);
      }
      localStorage.setItem("health_user", JSON.stringify(data.user));
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError("Network error. Check backend connection.");
    }
  };

  const handleDoctorAuth = async (event) => {
    event.preventDefault();
    setDoctorAuthError("");

    try {
      const endpoint =
        doctorAuthMode === "signup" ? "/api/auth/register" : "/api/auth/login";

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorAuthForm),
      });

      const data = await response.json();
      if (!response.ok) {
        setDoctorAuthError(data.error || "Unable to authenticate.");
        return;
      }

      if (doctorAuthMode === "signup") {
        setDoctorAuthForm({ name: "", email: "", password: "" });
        setDoctorAuthMode("login");
        setDoctorAuthError(t("doctorSignupInfo"));
        return;
      }

      if (!data.user || (data.user.role !== "doctor" && data.user.role !== "admin")) {
        setDoctorAuthError(t("doctorNoAccess"));
        return;
      }

      setUser(data.user);
      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem("health_token", data.token);
      }
      localStorage.setItem("health_user", JSON.stringify(data.user));
      setDoctorAuthForm({ name: "", email: "", password: "" });
      window.location.href = "/doctor-dashboard";
    } catch (error) {
      setDoctorAuthError("Network error. Check backend connection.");
    }
  };

  const requestPasswordReset = async () => {
    setResetStatus("");
    setResetTokenPreview("");
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
        setResetStatus(data.error || "Unable to issue reset token.");
        return;
      }
      if (data.resetToken) {
        setResetTokenPreview(data.resetToken);
        setResetForm((prev) => ({ ...prev, token: data.resetToken }));
        setResetStatus("Reset token generated. Use it below to set a new password.");
      } else {
        setResetStatus(data.message || "If the account exists, a reset token has been issued.");
      }
    } catch (error) {
      setResetStatus("Unable to issue reset token.");
    }
  };

  const confirmPasswordReset = async () => {
    setResetStatus("");
    if (!resetForm.email || !resetForm.token || !resetForm.newPassword) {
      setResetStatus("Email, reset token, and new password are required.");
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
      setResetStatus(data.message || "Password updated successfully.");
      setResetTokenPreview("");
      setResetForm((prev) => ({ ...prev, token: "", newPassword: "" }));
    } catch (error) {
      setResetStatus("Unable to reset password.");
    }
  };

  const updateAdminUserDraft = (userId, key, value) => {
    setAdminUsers((prev) =>
      prev.map((item) => (item.id === userId ? { ...item, [key]: value } : item)),
    );
  };

  const saveAdminUser = async (adminUser) => {
    setAdminUsersStatus("");
    setAdminSavingUserId(adminUser.id);
    try {
      const response = await apiFetch(`${API_BASE}/api/admin/users/${adminUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: adminUser.roleDraft,
          active: adminUser.activeDraft === "active",
          departmentId:
            adminUser.roleDraft === "doctor" || adminUser.roleDraft === "admin"
              ? adminUser.departmentIdDraft || null
              : null,
          qualification:
            adminUser.roleDraft === "doctor" || adminUser.roleDraft === "admin"
              ? adminUser.qualificationDraft
              : "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAdminUsersStatus(data.error || "Unable to save user.");
        return;
      }
      setAdminUsersStatus(`Updated ${data.user?.name || adminUser.name}.`);
      await loadAdminUsers();
      if (user?.id === adminUser.id) {
        const meResponse = await apiFetch(`${API_BASE}/api/auth/me`);
        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData.user) {
            setUser(meData.user);
            localStorage.setItem("health_user", JSON.stringify(meData.user));
          }
        }
      }
    } catch (error) {
      setAdminUsersStatus("Unable to save user.");
    } finally {
      setAdminSavingUserId(null);
    }
  };

  const updateBillingDraft = (appointmentId, key, value) => {
    setBillingDrafts((prev) => ({
      ...prev,
      [appointmentId]: {
        ...(prev[appointmentId] || { amount: "", status: "unpaid", paymentMethod: "" }),
        [key]: value,
      },
    }));
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    setOpsQueueStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOpsQueueStatus(data.error || "Unable to update appointment.");
        return;
      }
      setOpsQueueStatus(`Appointment #${appointmentId} updated to ${status}.`);
      await loadOpsQueue();
      await loadAdminOps();
      await loadAppointments();
    } catch (error) {
      setOpsQueueStatus("Unable to update appointment.");
    }
  };

  const saveBillingForAppointment = async (appointmentId) => {
    const draft = billingDrafts[appointmentId] || {};
    setOpsQueueStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/appointments/${appointmentId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: draft.amount === "" ? 0 : Number(draft.amount),
          status: draft.status || "unpaid",
          paymentMethod: draft.paymentMethod || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setOpsQueueStatus(data.error || "Unable to save billing.");
        return;
      }
      setOpsQueueStatus(`Billing saved for appointment #${appointmentId}.`);
      await loadOpsQueue();
      await loadAdminOps();
      await loadAppointments();
    } catch (error) {
      setOpsQueueStatus("Unable to save billing.");
    }
  };

  const viewReceipt = async (appointmentId) => {
    setOpsQueueStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/appointments/${appointmentId}/receipt`);
      const data = await response.json();
      if (!response.ok) {
        setOpsQueueStatus(data.error || "Unable to load receipt.");
        return;
      }
      const receipt = data.receipt;
      window.alert(
        [
          `Receipt for appointment #${receipt.appointmentId}`,
          `Patient: ${receipt.patientName}`,
          `Department: ${receipt.department || "-"}`,
          `Doctor: ${receipt.doctorName || "-"}`,
          `Amount: Rs ${receipt.amount || 0}`,
          `Billing: ${receipt.billingStatus}`,
          `Payment method: ${receipt.paymentMethod || "-"}`,
          `Appointment: ${new Date(receipt.scheduledAt).toLocaleString()}`,
        ].join("\n"),
      );
    } catch (error) {
      setOpsQueueStatus("Unable to load receipt.");
    }
  };

  const updateScheduleRow = (index, key, value) => {
    setScheduleForm((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: key === "weekday" || key === "slotMinutes" ? Number(value) : value } : item,
      ),
    );
  };

  const addScheduleRow = () => {
    setScheduleForm((prev) => [
      ...prev,
      { weekday: 1, startTime: "10:00", endTime: "13:00", slotMinutes: 20 },
    ]);
  };

  const removeScheduleRow = (index) => {
    setScheduleForm((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveDoctorSchedule = async () => {
    if (!user || !(user.role === "doctor" || user.role === "admin")) {
      setScheduleStatus("Doctor or admin access required.");
      return;
    }
    setScheduleStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/doctors/${user.id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules: scheduleForm }),
      });
      const data = await response.json();
      if (!response.ok) {
        setScheduleStatus(data.error || "Unable to save schedule.");
        return;
      }
      setScheduleStatus("Doctor availability saved.");
      if (data.schedules) {
        setScheduleForm(
          data.schedules.map((item) => ({
            weekday: Number(item.weekday),
            startTime: item.start_time,
            endTime: item.end_time,
            slotMinutes: Number(item.slot_minutes),
          })),
        );
      }
    } catch (error) {
      setScheduleStatus("Unable to save schedule.");
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!user?.id) {
      setProfileStatus("Sign in to save your profile.");
      return;
    }

    setProfileStatus("Saving...");
    const payload = {
      userId: user.id,
      age: profileForm.age ? Number(profileForm.age) : null,
      sex: profileForm.sex,
      conditions: profileForm.conditions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      allergies: profileForm.allergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      region: profileForm.region,
    };

    try {
      const response = await apiFetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Save failed");
      }
      setProfileStatus("Profile saved.");
    } catch (error) {
      setProfileStatus("Unable to save profile.");
    }
  };

  useEffect(() => {
    return () => {
      if (triageForm.photoPreview) {
        URL.revokeObjectURL(triageForm.photoPreview);
      }
    };
  }, [triageForm.photoPreview]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      updateTriageField("photoFile", null);
      updateTriageField("photoPreview", "");
      return;
    }
    const preview = URL.createObjectURL(file);
    updateTriageField("photoFile", file);
    updateTriageField("photoPreview", preview);
  };

  const removeTriagePhoto = () => {
    if (triageForm.photoPreview) {
      URL.revokeObjectURL(triageForm.photoPreview);
    }
    updateTriageField("photoFile", null);
    updateTriageField("photoPreview", "");
  };

  const submitTriage = async (event) => {
    event.preventDefault();
    setTriageError("");
    if (showDisclaimer) {
      setShowDisclaimer(true);
      return;
    }
    if (!user || !authToken) {
      setTriageError("Sign in is required before triage.");
      return;
    }
    setTriageLoading(true);

    const payload =
      triageType === "dental"
        ? {
            triageType: "dental",
            age: triageForm.age,
            sex: triageForm.sex,
            durationDays: Number(dentalForm.durationDays),
            memberId: activeMemberId || null,
            userId: user?.id,
            dentalPainScale: Number(dentalForm.painScale),
            dentalSymptoms: dentalForm.symptoms,
            dentalRedFlags: dentalForm.redFlags,
            dentalHotColdTrigger: dentalForm.hotColdTrigger,
            dentalSwelling: dentalForm.swelling,
          }
        : {
            triageType: "general",
            ...triageForm,
            memberId: activeMemberId || null,
            symptoms: [
              ...triageForm.symptoms,
              ...triageForm.additionalSymptoms
                .split(",")
                .map((symptom) => symptom.trim())
                .filter(Boolean),
            ],
            userId: user?.id,
          };

    try {
      let response;
      if (triageForm.photoFile) {
        const form = new FormData();
        form.append("triageType", payload.triageType || "general");
        form.append("age", payload.age || "");
        form.append("sex", payload.sex || "");
        form.append("durationDays", payload.durationDays || "");
        form.append("severity", payload.severity || "");
        form.append("symptoms", JSON.stringify(payload.symptoms || []));
        form.append("redFlags", JSON.stringify(payload.redFlags || []));
        form.append("additionalSymptoms", payload.additionalSymptoms || "");
        form.append("dentalPainScale", String(payload.dentalPainScale || ""));
        form.append("dentalSymptoms", JSON.stringify(payload.dentalSymptoms || []));
        form.append("dentalRedFlags", JSON.stringify(payload.dentalRedFlags || []));
        form.append("dentalHotColdTrigger", String(!!payload.dentalHotColdTrigger));
        form.append("dentalSwelling", String(!!payload.dentalSwelling));
        if (payload.memberId) {
          form.append("memberId", String(payload.memberId));
        }
        if (payload.userId) {
          form.append("userId", String(payload.userId));
        }
        form.append("photo", triageForm.photoFile);
        response = await apiFetch(`${API_BASE}/api/triage`, {
          method: "POST",
          body: form,
        });
      } else {
        response = await apiFetch(`${API_BASE}/api/triage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setTriageError("Session expired. Please sign in again.");
          setTriageLoading(false);
          return;
        }
        throw new Error(data.error || "Triage failed.");
      }
      setTriageResult(data);
      if (user?.id) {
        loadHistory(user.id);
      }
    } catch (error) {
      setTriageError(error.message || "Triage failed.");
    } finally {
      setTriageLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setAuthToken("");
    localStorage.removeItem("health_user");
    localStorage.removeItem("health_token");
  };

  const acceptDisclaimer = async () => {
    localStorage.setItem("health_disclaimer_accepted", "true");
    setShowDisclaimer(false);
    if (user && authToken) {
      try {
        await apiFetch(`${API_BASE}/api/consent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consentType: "medical_disclaimer",
            policyVersion: "v1",
            accepted: true,
          }),
        });
      } catch (error) {
        // Non-blocking: UX should not fail if consent logging endpoint is unavailable.
      }
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openRecordUploader = () => {
    scrollToSection("records");
    window.setTimeout(() => {
      recordsInputRef.current?.click();
    }, 250);
  };

  const generateSharePass = async () => {
    if (!user?.id) return;
    setSharePassStatus(t("passGenerating"));
    try {
      const response = await apiFetch(`${API_BASE}/api/share-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, memberId: activeMemberId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "failed");
      const passData = {
        ...data,
        doctorUrl: `${window.location.origin}${data.doctorUrl}`,
      };
      setSharePass(passData);
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        passData.doctorUrl,
      )}`;
      setShareQr(qr);
      setSharePassStatus("");
      await loadShareHistory();
    } catch (error) {
      setSharePassStatus(t("passFailed"));
    }
  };

  const createTeleconsult = async (event, overrideMode = null) => {
    event?.preventDefault?.();
    setTeleStatus("");
    if (!user || !authToken) {
      setTeleStatus(t("teleError"));
      return;
    }
    if (!teleForm.concern.trim() || teleForm.concern.trim().length < 10) {
      setTeleStatus("Please enter at least 10 characters in concern.");
      return;
    }

    try {
      const payload = {
        memberId: activeMemberId || null,
        mode: overrideMode || teleForm.mode,
        concern: teleForm.concern.trim(),
        preferredSlot: teleForm.preferredSlot
          ? new Date(teleForm.preferredSlot).toISOString()
          : "",
        phone: teleForm.phone.trim(),
        triageLogId: lastGuidance?.id || null,
      };
      const response = await apiFetch(`${API_BASE}/api/teleconsults`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("teleError"));
      setTeleForm({
        mode: "video",
        concern: "",
        preferredSlot: "",
        phone: teleForm.phone,
      });
      setTeleStatus(t("teleBooked"));
      await loadTeleconsults();
      if (data.consult?.id) {
        setActiveConsultId(data.consult.id);
      }
    } catch (error) {
      setTeleStatus(error.message || t("teleError"));
    }
  };

  const createAppointment = async (event) => {
    event?.preventDefault?.();
    setAppointmentsStatus("");
    if (
      !appointmentForm.departmentId ||
      !appointmentForm.doctorId ||
      !appointmentForm.reason.trim() ||
      !appointmentForm.appointmentDate ||
      !appointmentForm.slotTime
    ) {
      setAppointmentsStatus("Department, doctor, reason, date, and slot are required.");
      return;
    }
    try {
      const scheduledAt = new Date(
        `${appointmentForm.appointmentDate}T${appointmentForm.slotTime}:00`,
      ).toISOString();
      const response = await apiFetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: activeMemberId || null,
          departmentId: Number(appointmentForm.departmentId),
          doctorId: Number(appointmentForm.doctorId),
          reason: appointmentForm.reason.trim(),
          scheduledAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to book appointment.");
      setAppointmentForm((prev) => ({
        ...prev,
        doctorId: "",
        reason: "",
        appointmentDate: "",
        slotTime: "",
      }));
      setAvailableSlots([]);
      setAppointmentsStatus("Appointment booked.");
      await loadAppointments();
      await loadDoctorsForDepartment(appointmentForm.departmentId);
    } catch (error) {
      setAppointmentsStatus(error.message || "Unable to book appointment.");
    }
  };

  const submitCareRequest = async (event) => {
    event.preventDefault();
    if (careRequestMode === "in_person") {
      await createAppointment();
      return;
    }
    await createTeleconsult(null, careRequestMode);
  };

  const createMarketplaceRequest = async (payload) => {
    setMarketplaceStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/marketplace/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          memberId: activeMemberId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMarketplaceStatus(data.error || "Unable to place request.");
        return;
      }
      setMarketplaceStatus("Request placed successfully.");
      localStorage.setItem(MARKETPLACE_REFRESH_KEY, String(Date.now()));
      await loadMarketplaceRequests();
    } catch (error) {
      setMarketplaceStatus("Unable to place request.");
    }
  };

  const createEncounterFromDoctor = async (event) => {
    event.preventDefault();
    setDoctorChartStatus("");
    if (!doctorChartForm.appointmentId) {
      setDoctorChartStatus("Select an appointment to create encounter.");
      return;
    }
    try {
      const response = await apiFetch(`${API_BASE}/api/encounters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(doctorChartForm.appointmentId),
          chiefComplaint: doctorChartForm.chiefComplaint,
          findings: doctorChartForm.findings,
          diagnosisCode: "",
          diagnosisText: doctorChartForm.diagnosis,
          planText: doctorChartForm.planText,
          followupDate: doctorChartForm.followupDate || null,
          vitals: doctorChartForm.vitals,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create encounter.");
      setDoctorChartStatus("Encounter created.");
      setDoctorChartForm((prev) => ({
        ...prev,
        chiefComplaint: "",
        findings: "",
        diagnosis: "",
        planText: "",
        followupDate: "",
        vitals: "",
      }));
      setActiveEncounterId(data.encounterId);
      await loadEncounters();
    } catch (error) {
      setDoctorChartStatus(error.message || "Unable to create encounter.");
    }
  };

  const addDoctorNote = async (event) => {
    event.preventDefault();
    if (!activeEncounterId) return;
    setDoctorChartStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/encounters/${activeEncounterId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: noteForm.note,
          signature: noteForm.signature,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add note.");
      setNoteForm({ note: "", signature: "" });
      setDoctorChartStatus(`Signed note added (${data.noteHash.slice(0, 10)}...)`);
      await loadEncounterDetail(activeEncounterId);
      await loadEncounters();
    } catch (error) {
      setDoctorChartStatus(error.message || "Unable to add note.");
    }
  };

  const addPrescription = async (event) => {
    event.preventDefault();
    if (!activeEncounterId) return;
    setDoctorChartStatus("");
    try {
      const items = prescriptionForm.itemsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [medicine, dose = "", frequency = "", duration = ""] = line
            .split("|")
            .map((s) => s.trim());
          return { medicine, dose, frequency, duration };
        });
      const response = await apiFetch(
        `${API_BASE}/api/encounters/${activeEncounterId}/prescriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructions: prescriptionForm.instructions,
            items,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add prescription.");
      setPrescriptionForm({ instructions: "", itemsText: "" });
      setDoctorChartStatus(`Prescription created (#${data.prescriptionId}).`);
      await loadEncounterDetail(activeEncounterId);
      await loadEncounters();
    } catch (error) {
      setDoctorChartStatus(error.message || "Unable to add prescription.");
    }
  };

  const addOrder = async (event) => {
    event.preventDefault();
    if (!activeEncounterId) return;
    setDoctorChartStatus("");
    try {
      const response = await apiFetch(`${API_BASE}/api/encounters/${activeEncounterId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: orderForm.orderType,
          itemName: orderForm.itemName,
          destination: orderForm.destination,
          notes: orderForm.notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add order.");
      setOrderForm({ orderType: "lab", itemName: "", destination: "", notes: "" });
      setDoctorChartStatus(`Order created (#${data.orderId}).`);
      await loadEncounterDetail(activeEncounterId);
      await loadEncounters();
    } catch (error) {
      setDoctorChartStatus(error.message || "Unable to add order.");
    }
  };

  const sendConsultMessage = async (event) => {
    event.preventDefault();
    setConsultMessageStatus("");
    const message = consultMessageText.trim();
    if (!activeConsultId || !message) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${activeConsultId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("teleError"));
      setConsultMessages((prev) => [...prev, data.message]);
      setConsultMessageText("");
      await loadTeleconsults();
    } catch (error) {
      setConsultMessageStatus(error.message || t("teleError"));
    }
  };

  const updateConsultStatus = async (event) => {
    event.preventDefault();
    setDoctorConsoleStatus("");
    if (!activeConsultId) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/teleconsults/${activeConsultId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: doctorConsoleForm.status,
          meetingUrl: doctorConsoleForm.meetingUrl.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("teleError"));
      setDoctorConsoleStatus(t("doctorConsoleSaved"));
      await loadTeleconsults();
    } catch (error) {
      setDoctorConsoleStatus(error.message || t("teleError"));
    }
  };

  const saveFamilyMember = async (event) => {
    event.preventDefault();
    setFamilyStatus("");
    if (!memberForm.name.trim()) {
      setFamilyStatus("Name is required.");
      return;
    }
    try {
      const payload = {
        ...memberForm,
        age: memberForm.age ? Number(memberForm.age) : null,
        conditions: memberForm.conditions
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        allergies: memberForm.allergies
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };
      const response = await apiFetch(`${API_BASE}/api/family`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "failed");
      setMemberForm({
        name: "",
        relation: "",
        age: "",
        sex: "Female",
        bloodType: "",
        conditions: "",
        allergies: "",
      });
      setFamilyStatus("Member saved.");
      await loadFamilyMembers();
      if (data.id) setActiveMemberId(data.id);
    } catch (error) {
      setFamilyStatus(error.message || "Unable to save member.");
    }
  };

  const uploadRecord = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRecordStatus("Uploading...");
    try {
      const form = new FormData();
      form.append("record", file);
      const response = activeMemberId
        ? await apiFetch(`${API_BASE}/api/family/${activeMemberId}/records`, {
            method: "POST",
            body: form,
          })
        : await apiFetch(`${API_BASE}/api/records`, {
            method: "POST",
            body: form,
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "upload failed");
      setRecordStatus("Record uploaded.");
      await loadRecords(activeMemberId);
      event.target.value = "";
    } catch (error) {
      setRecordStatus(error.message || "Unable to upload record.");
    }
  };

  const deleteRecord = async (recordId) => {
    if (!recordId) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/records/${recordId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "delete failed");
      setRecordStatus("Record deleted.");
      await loadRecords(activeMemberId);
    } catch (error) {
      setRecordStatus(error.message || "Unable to delete record.");
    }
  };

  const generateEmergencyCard = async () => {
    try {
      const response = await apiFetch(`${API_BASE}/api/emergency-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: activeMemberId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "failed");
      setEmergencyCard({
        ...data,
        url: `${window.location.origin}${data.publicUrl}`,
      });
    } catch (error) {
      setFamilyStatus(error.message || "Unable to generate emergency card.");
    }
  };

  const downloadVisitPdf = () => {
    if (!triageResult) return;
    const symptoms = (triageForm.symptoms || []).join(", ") || "-";
    const html = `
      <html><head><title>Visit Summary</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>SehatSaathi Visit Summary</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>User:</strong> ${user?.name || "-"}</p>
        <p><strong>Headline:</strong> ${triageResult.headline || "-"}</p>
        <p><strong>Urgency:</strong> ${triageResult.urgency || "-"}</p>
        <p><strong>Symptoms:</strong> ${symptoms}</p>
        <p><strong>Severity:</strong> ${triageForm.severity}/5</p>
        <p><strong>Duration:</strong> ${triageForm.durationDays} days</p>
        <p><strong>Source:</strong> ${triageResult.source || "fallback"}</p>
        <p><strong>Disclaimer:</strong> ${triageResult.disclaimer || ""}</p>
      </body></html>
    `;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const extractShareCodeFromScan = (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return "";
    const exactCode = value.match(/\b\d{6}\b/);
    if (exactCode) return exactCode[0];
    try {
      const parsed = new URL(value);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "doctor-view" && /^\d{6}$/.test(parts[1] || "")) {
        return parts[1];
      }
    } catch (error) {
      return "";
    }
    return "";
  };

  const stopScanner = () => {
    if (scannerIntervalRef.current) {
      window.clearInterval(scannerIntervalRef.current);
      scannerIntervalRef.current = null;
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    setScannerActive(false);
  };

  const startScanner = async () => {
    if (!scannerSupported) {
      setClinicStatus(t("clinicScanUnsupported"));
      return;
    }
    try {
      setClinicStatus("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      scannerStreamRef.current = stream;
      if (clinicVideoRef.current) {
        clinicVideoRef.current.srcObject = stream;
        await clinicVideoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      scannerIntervalRef.current = window.setInterval(async () => {
        if (!clinicVideoRef.current) return;
        try {
          const codes = await detector.detect(clinicVideoRef.current);
          if (!codes.length) return;
          const scannedCode = extractShareCodeFromScan(codes[0].rawValue);
          if (!scannedCode) {
            setClinicStatus(t("clinicScanInvalid"));
            return;
          }
          setClinicCode(scannedCode);
          stopScanner();
          window.location.href = `/doctor-view/${scannedCode}?lang=${doctorLang}`;
        } catch (error) {
          // keep scanner running
        }
      }, 450);
      setScannerActive(true);
      setClinicStatus(t("clinicScannerActive"));
    } catch (error) {
      setClinicStatus(error.message || t("clinicScanUnsupported"));
      stopScanner();
    }
  };

  const openClinicSummary = () => {
    const code = clinicCode.trim();
    if (!code) {
      setClinicStatus("Enter a valid code.");
      return;
    }
    window.location.href = `/doctor-view/${code}?lang=${doctorLang}`;
  };

  const submitEvent = async (eventName, payload) => {
    if (!user || !authToken) return;
    try {
      await apiFetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, payload }),
      });
    } catch (error) {
      // Event logging should not break user flow.
    }
  };

  const handleGuidanceFeedback = async (helpful) => {
    if (!triageResult) return;
    await submitEvent("triage_helpfulness_feedback", {
      helpful,
      headline: triageResult.headline,
      source: triageResult.source || "fallback",
    });
    setFeedbackStatus(t("feedbackSaved"));
  };

  const handleVisitFollowup = async (visitHappened) => {
    await submitEvent("visit_happened_followup", { visitHappened });
    setFeedbackStatus(t("feedbackSaved"));
  };

  const handleDoctorQuickRating = async (rating) => {
    if (!doctorCode) return;
    try {
      const response = await fetch(`${API_BASE}/api/share-pass/${doctorCode}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "rating failed");
      setDoctorRatingStatus(t("doctorRateSaved"));
    } catch (error) {
      setDoctorRatingStatus(error.message || "Unable to save rating.");
    }
  };

  const sendChatMessage = async (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    const nextMessages = [...chatMessages, { role: "user", content: message }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await apiFetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: nextMessages.slice(-10),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat failed");

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "No response available." },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I am having trouble right now. Please try again, or use symptom triage for structured guidance.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!doctorCode) return;
    let alive = true;
    const loadDoctorView = async () => {
      setDoctorViewLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/share-pass/${doctorCode}?doctorName=${encodeURIComponent("Clinic Viewer")}`,
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "expired");
        if (alive) setDoctorViewData(data);
      } catch (error) {
        if (alive) setDoctorViewData(null);
      } finally {
        if (alive) setDoctorViewLoading(false);
      }
    };
    loadDoctorView();
    return () => {
      alive = false;
    };
  }, [doctorCode]);

  useEffect(
    () => () => {
      stopScanner();
    },
    [],
  );

  useEffect(() => {
    if (!emergencyPublicId) return;
    let active = true;
    const loadEmergency = async () => {
      setEmergencyLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/emergency/${emergencyPublicId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "not found");
        if (active) setEmergencyData(data);
      } catch (error) {
        if (active) setEmergencyData(null);
      } finally {
        if (active) setEmergencyLoading(false);
      }
    };
    loadEmergency();
    return () => {
      active = false;
    };
  }, [emergencyPublicId]);

  if (doctorConsoleMode) {
    const hasDoctorAccess = user && (user.role === "doctor" || user.role === "admin");
    return (
      <div className="app">
        <main className="doctor-view">
          <section className="panel">
            <h1>{t("doctorConsoleTitle")}</h1>
            <p className="panel-sub">{t("doctorConsoleSubtitle")}</p>
            {!sessionReady || (authToken && !user) ? (
              <p className="micro">Loading dashboard...</p>
            ) : !user ? (
              <>
                <p className="micro">{t("doctorConsoleSignIn")}</p>
                <form className="auth" onSubmit={handleAuth}>
                  <label className="block">
                    {t("email")}
                    <input
                      type="email"
                      required
                      value={authForm.email}
                      onChange={(event) => updateAuthField("email", event.target.value)}
                    />
                  </label>
                  <label className="block">
                    {t("password")}
                    <input
                      type="password"
                      required
                      value={authForm.password}
                      onChange={(event) => updateAuthField("password", event.target.value)}
                    />
                  </label>
                  {authError && <p className="error">{authError}</p>}
                  <button className="primary" type="submit">
                    {t("signIn")}
                  </button>
                </form>
              </>
            ) : !hasDoctorAccess ? (
              <>
                <p className="error">{t("doctorConsoleNoAccess")}</p>
                <button className="secondary" type="button" onClick={signOut}>
                  {t("navSignOut")}
                </button>
              </>
            ) : (
              <>
                <div className="action-row">
                  <button
                    className="secondary"
                    type="button"
                    onClick={async () => {
                      await loadTeleconsults();
                      await loadAppointments();
                      await loadEncounters();
                      await loadDoctorSchedule(user.id);
                    }}
                  >
                    Refresh
                  </button>
                  <button className="ghost" type="button" onClick={signOut}>
                    {t("navSignOut")}
                  </button>
                </div>
                <div className="pass-card" style={{ marginBottom: 16 }}>
                  <h3>Doctor availability</h3>
                  <p className="micro">Define OPD timings and slot length used for appointment booking.</p>
                  {scheduleForm.map((slot, index) => (
                    <div className="form-row" key={`schedule-${index}`}>
                      <label>
                        Day
                        <select
                          value={slot.weekday}
                          onChange={(event) =>
                            updateScheduleRow(index, "weekday", event.target.value)
                          }
                        >
                          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                            <option key={day} value={day}>
                              {weekdayLabel(day)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Start
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(event) =>
                            updateScheduleRow(index, "startTime", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        End
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(event) =>
                            updateScheduleRow(index, "endTime", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Slot (min)
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={slot.slotMinutes}
                          onChange={(event) =>
                            updateScheduleRow(index, "slotMinutes", event.target.value)
                          }
                        />
                      </label>
                      <button className="ghost" type="button" onClick={() => removeScheduleRow(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="action-row">
                    <button className="secondary" type="button" onClick={addScheduleRow}>
                      Add day
                    </button>
                    <button className="primary" type="button" onClick={saveDoctorSchedule}>
                      Save schedule
                    </button>
                  </div>
                  {scheduleStatus && <p className="micro">{scheduleStatus}</p>}
                </div>
                {teleLoading ? (
                  <p className="micro">{t("teleLoading")}</p>
                ) : teleconsults.length === 0 ? (
                  <p className="micro">{t("teleEmpty")}</p>
                ) : (
                  <>
                    <div className="member-list">
                      {teleconsults.map((consult) => (
                        <button
                          key={consult.id}
                          type="button"
                          className={consult.id === activeConsultId ? "chip active" : "chip"}
                          onClick={() => setActiveConsultId(consult.id)}
                        >
                          #{consult.id} • {consult.patientName || "Patient"} •{" "}
                          {teleStatusLabel(consult.status)}
                        </button>
                      ))}
                    </div>
                    {activeConsult && (
                      <div className="pass-card consult-card">
                        <h3>
                          {activeConsult.patientName || "-"}{" "}
                          {activeConsult.memberName ? `(${activeConsult.memberName})` : ""}
                        </h3>
                        <p className="micro">
                          {activeConsult.patientEmail || "-"} • {activeConsult.phone || "No phone"}
                        </p>
                        <p className="micro">{activeConsult.concern}</p>
                        <p className="micro">
                          Requested: {new Date(activeConsult.createdAt).toLocaleString()}
                        </p>
                        <form className="form" onSubmit={updateConsultStatus}>
                          <div className="form-row">
                            <label>
                              {t("teleStatus")}
                              <select
                                value={doctorConsoleForm.status}
                                onChange={(event) =>
                                  setDoctorConsoleForm((prev) => ({
                                    ...prev,
                                    status: event.target.value,
                                  }))
                                }
                              >
                                <option value="requested">{t("teleStatusRequested")}</option>
                                <option value="scheduled">{t("teleStatusScheduled")}</option>
                                <option value="in_progress">{t("teleStatusInProgress")}</option>
                                <option value="completed">{t("teleStatusCompleted")}</option>
                                <option value="cancelled">{t("teleStatusCancelled")}</option>
                              </select>
                            </label>
                            <label>
                              {t("doctorConsoleMeetingUrl")}
                              <input
                                type="url"
                                value={doctorConsoleForm.meetingUrl}
                                placeholder="https://meet.google.com/..."
                                onChange={(event) =>
                                  setDoctorConsoleForm((prev) => ({
                                    ...prev,
                                    meetingUrl: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          </div>
                          <button className="primary" type="submit">
                            {t("doctorConsoleSave")}
                          </button>
                        </form>
                        {doctorConsoleStatus && <p className="micro">{doctorConsoleStatus}</p>}
                        <div className="consult-thread">
                          {consultMessages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`chat-msg ${msg.senderRole === "doctor" ? "bot" : "user"}`}
                            >
                              <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                              <p>{msg.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <hr />
                <h2>{t("doctorChartTitle")}</h2>
                <form className="form" onSubmit={createEncounterFromDoctor}>
                  <div className="form-row">
                    <label>
                      Appointment
                      <select
                        value={doctorChartForm.appointmentId}
                        onChange={(event) =>
                          setDoctorChartForm((prev) => ({
                            ...prev,
                            appointmentId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Select appointment</option>
                        {appointments.map((appointment) => (
                          <option key={appointment.id} value={appointment.id}>
                            #{appointment.id} • {appointment.patient_name || appointment.patientName || "Patient"} •{" "}
                            {appointment.department_name || appointment.department || "Department"} •{" "}
                            {new Date(appointment.scheduled_at).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    {t("chiefComplaint")}
                    <textarea
                      rows={2}
                      value={doctorChartForm.chiefComplaint}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({
                          ...prev,
                          chiefComplaint: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    {t("findings")}
                    <textarea
                      rows={2}
                      value={doctorChartForm.findings}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({
                          ...prev,
                          findings: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label className="block">
                      {t("diagnosisText")}
                      <input
                        type="text"
                        value={doctorChartForm.diagnosis}
                        onChange={(event) =>
                          setDoctorChartForm((prev) => ({
                            ...prev,
                            diagnosis: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className="block">
                    {t("encounterVitals")}
                    <textarea
                      rows={2}
                      placeholder="BP: 152/70, Pulse: 84, Temp: 99F"
                      value={doctorChartForm.vitals}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({ ...prev, vitals: event.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    {t("planText")}
                    <textarea
                      rows={2}
                      value={doctorChartForm.planText}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({ ...prev, planText: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {t("followupDate")}
                    <input
                      type="date"
                      value={doctorChartForm.followupDate}
                      onChange={(event) =>
                        setDoctorChartForm((prev) => ({
                          ...prev,
                          followupDate: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button className="primary" type="submit">
                    {t("doctorChartCreate")}
                  </button>
                </form>
                <div className="member-list">
                  {encounters.map((encounter) => (
                    <button
                      key={encounter.id}
                      type="button"
                      className={encounter.id === activeEncounterId ? "chip active" : "chip"}
                      onClick={() => setActiveEncounterId(encounter.id)}
                    >
                      #{encounter.id} • {encounter.patient_name || "-"} • {encounter.status}
                    </button>
                  ))}
                </div>
                {activeEncounterId && (
                  <>
                    <form className="form" onSubmit={addDoctorNote}>
                      <label className="block">
                        {t("noteText")}
                        <textarea
                          rows={2}
                          value={noteForm.note}
                          onChange={(event) =>
                            setNoteForm((prev) => ({ ...prev, note: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        {t("signature")}
                        <input
                          type="text"
                          value={noteForm.signature}
                          onChange={(event) =>
                            setNoteForm((prev) => ({ ...prev, signature: event.target.value }))
                          }
                        />
                      </label>
                      <button className="secondary" type="submit">
                        {t("addNote")}
                      </button>
                    </form>
                    <form className="form" onSubmit={addPrescription}>
                      <label className="block">
                        Instructions
                        <textarea
                          rows={2}
                          value={prescriptionForm.instructions}
                          onChange={(event) =>
                            setPrescriptionForm((prev) => ({
                              ...prev,
                              instructions: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        {t("medicines")} (one per line: medicine|dose|frequency|duration)
                        <textarea
                          rows={3}
                          value={prescriptionForm.itemsText}
                          onChange={(event) =>
                            setPrescriptionForm((prev) => ({
                              ...prev,
                              itemsText: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button className="secondary" type="submit">
                        {t("addPrescription")}
                      </button>
                    </form>
                    <form className="form" onSubmit={addOrder}>
                      <div className="form-row">
                        <label>
                          {t("orderType")}
                          <select
                            value={orderForm.orderType}
                            onChange={(event) =>
                              setOrderForm((prev) => ({
                                ...prev,
                                orderType: event.target.value,
                              }))
                            }
                          >
                            <option value="lab">lab</option>
                            <option value="radiology">radiology</option>
                            <option value="pharmacy">pharmacy</option>
                            <option value="procedure">procedure</option>
                          </select>
                        </label>
                        <label>
                          {t("orderItem")}
                          <input
                            type="text"
                            value={orderForm.itemName}
                            onChange={(event) =>
                              setOrderForm((prev) => ({ ...prev, itemName: event.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <div className="form-row">
                        <label>
                          {t("destination")}
                          <input
                            type="text"
                            value={orderForm.destination}
                            onChange={(event) =>
                              setOrderForm((prev) => ({
                                ...prev,
                                destination: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          Notes
                          <input
                            type="text"
                            value={orderForm.notes}
                            onChange={(event) =>
                              setOrderForm((prev) => ({ ...prev, notes: event.target.value }))
                            }
                          />
                        </label>
                      </div>
                      <button className="secondary" type="submit">
                        {t("addOrder")}
                      </button>
                    </form>
                  </>
                )}
                {doctorChartStatus && <p className="micro">{doctorChartStatus}</p>}
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (clinicMode) {
    return (
      <div className="app">
        <main className="doctor-view">
          <section className="panel">
            <h1>{t("clinicTitle")}</h1>
            <label className="block">
              {t("doctorLanguage")}
              <select value={doctorLang} onChange={(e) => setDoctorLang(e.target.value)}>
                <option value="en">English</option>
                <option value="gu">Gujarati</option>
              </select>
            </label>
            <label className="block">
              Code
              <input
                type="text"
                value={clinicCode}
                onChange={(e) => setClinicCode(e.target.value)}
                placeholder={t("clinicCodePlaceholder")}
              />
            </label>
            <button type="button" className="primary" onClick={openClinicSummary}>
              {t("clinicOpen")}
            </button>
            <div className="action-row">
              {!scannerActive ? (
                <button type="button" className="secondary" onClick={startScanner}>
                  {t("clinicScanStart")}
                </button>
              ) : (
                <button type="button" className="secondary" onClick={stopScanner}>
                  {t("clinicScanStop")}
                </button>
              )}
            </div>
            {scannerActive && (
              <div className="scanner-box">
                <video ref={clinicVideoRef} className="scanner-video" muted playsInline />
              </div>
            )}
            {clinicStatus && <p className="micro">{clinicStatus}</p>}
          </section>
        </main>
      </div>
    );
  }

  if (labsPageMode) {
    return renderMarketplacePage("labs");
  }

  if (pharmacyPageMode) {
    return renderMarketplacePage("pharmacy");
  }

  if (emergencyPublicId) {
    return (
      <div className="app">
        <main className="doctor-view">
          <section className="panel">
            <h1>{t("emergencyCard")}</h1>
            {emergencyLoading ? (
              <p className="micro">Loading...</p>
            ) : !emergencyData ? (
              <p className="micro">Emergency card not found.</p>
            ) : (
              <div className="doctor-grid">
                <div className="doctor-card">
                  <h3>{t("doctorViewPatient")}</h3>
                  <p>{emergencyData.patient?.name || "-"}</p>
                  <p className="micro">{t("relation")}: {emergencyData.patient?.relation || "-"}</p>
                </div>
                <div className="doctor-card">
                  <h3>{t("doctorViewProfile")}</h3>
                  <p className="micro">Age: {emergencyData.patient?.age || "-"} | Sex: {emergencyData.patient?.sex || "-"}</p>
                  <p className="micro">{t("bloodType")}: {emergencyData.patient?.bloodType || "-"}</p>
                  <p className="micro">Conditions: {(emergencyData.patient?.conditions || []).join(", ") || "-"}</p>
                  <p className="micro">Allergies: {(emergencyData.patient?.allergies || []).join(", ") || "-"}</p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (doctorCode) {
    return (
      <div className="app">
        <main className="doctor-view">
          <section className="panel">
            <h1>{t("doctorViewTitle")}</h1>
            <div className="action-row">
              <label className="block">
                {t("doctorLanguage")}
                <select
                  value={doctorLang}
                  onChange={(e) => {
                    const lang = e.target.value;
                    setDoctorLang(lang);
                    setLanguage(lang);
                    const url = new URL(window.location.href);
                    url.searchParams.set("lang", lang);
                    window.history.replaceState({}, "", url.toString());
                  }}
                >
                  <option value="en">English</option>
                  <option value="gu">Gujarati</option>
                </select>
              </label>
            </div>
            {doctorViewLoading ? (
              <p>{t("doctorViewLoading")}</p>
            ) : !doctorViewData ? (
              <p>{t("doctorViewExpired")}</p>
            ) : (
              <div className="doctor-grid">
                <div className="doctor-card">
                  <h3>{t("doctorViewPatient")}</h3>
                  <p>{doctorViewData.patient?.name || "-"}</p>
                  <p className="micro">{doctorViewData.patient?.email || "-"}</p>
                </div>
                <div className="doctor-card">
                  <h3>{t("doctorViewProfile")}</h3>
                  <p className="micro">
                    Age: {doctorViewData.profile?.age || "-"} | Sex: {doctorViewData.profile?.sex || "-"}
                  </p>
                  <p className="micro">Region: {doctorViewData.profile?.region || "-"}</p>
                  <p className="micro">
                    Conditions: {(doctorViewData.profile?.conditions || []).join(", ") || "-"}
                  </p>
                  <p className="micro">
                    Allergies: {(doctorViewData.profile?.allergies || []).join(", ") || "-"}
                  </p>
                </div>
                <div className="doctor-card">
                  <h3>{t("doctorViewRecent")}</h3>
                  {(doctorViewData.recentGuidance || []).length === 0 ? (
                    <p className="micro">No recent guidance.</p>
                  ) : (
                    (doctorViewData.recentGuidance || []).map((entry) => (
                      <div key={entry.createdAt} className="doctor-entry">
                        <p className="history-date">{new Date(entry.createdAt).toLocaleString()}</p>
                        <p>{entry.result?.headline || "-"}</p>
                        <p className="micro">{entry.result?.urgency || "-"}</p>
                        <p className="micro">
                          {t("doctorSymptoms")}: {(
                            entry.payload?.triageType === "dental"
                              ? entry.payload?.dentalSymptoms || []
                              : entry.payload?.symptoms || []
                          ).join(", ") || t("doctorNone")}
                        </p>
                        <p className="micro">
                          {t("doctorSeverity")}:{" "}
                          {entry.payload?.triageType === "dental"
                            ? `${entry.payload?.dentalPainScale || "-"} / 10`
                            : `${entry.payload?.severity || "-"} / 5`}
                        </p>
                        <p className="micro">
                          {t("doctorDuration")}: {entry.payload?.durationDays || "-"} {t("doctorDays")}
                        </p>
                        <p className="micro">
                          {t("doctorRedFlags")}: {(entry.payload?.redFlags || []).join(", ") || t("doctorNone")}
                        </p>
                        <p className="micro">
                          {t("doctorSource")}: {entry.result?.source || "fallback"}
                        </p>
                      </div>
                    ))
                  )}
                  <div className="doctor-rating">
                    <p className="micro">{t("doctorRatePrompt")}</p>
                    <div className="action-row">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleDoctorQuickRating("useful")}
                      >
                        {t("doctorRateUseful")}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleDoctorQuickRating("not_useful")}
                      >
                        {t("doctorRateNotUseful")}
                      </button>
                    </div>
                    {doctorRatingStatus && <p className="micro">{doctorRatingStatus}</p>}
                    <p className="micro">{t("recordsTitle")}</p>
                    {(doctorViewData.records || []).length === 0 ? (
                      <p className="micro">{t("doctorNone")}</p>
                    ) : (
                      (doctorViewData.records || []).map((rec) => (
                        <p key={rec.id} className="micro">
                          {rec.file_name} ({new Date(rec.created_at).toLocaleDateString()}){" "}
                          {rec.downloadUrl ? (
                            <a
                              href={`${API_BASE}${rec.downloadUrl}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("doctorDownloadRecord")}
                            </a>
                          ) : null}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          <div className="logo-mark">S</div>
          <div>
            <p className="brand-title">{t("brandTitle")}</p>
            <p className="brand-subtitle">{t("brandSubtitle")}</p>
          </div>
        </div>
        <div className="nav-actions">
          <div className="lang-toggle">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={language === "gu" ? "active" : ""}
              onClick={() => setLanguage("gu")}
              title={t("langComing")}
            >
              GU
            </button>
          </div>
          {user ? (
            <button className="ghost" onClick={signOut}>
              {t("navSignOut")}
            </button>
          ) : (
            <button
              className="ghost"
              onClick={() => {
                setAuthMode("signup");
                scrollToSection("account");
              }}
            >
              {t("navCreate")}
            </button>
          )}
        </div>
      </header>

      <main>
        {!isOpsUser && (
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">{t("heroEyebrow")}</p>
              <h1>
                {t("heroTitle")}
              </h1>
              <p className="lead">
                {t("heroLead")}
              </p>
              <div className="hero-actions">
                <a className="primary" href="#triage">
                  {t("heroStart")}
                </a>
                <a className="secondary" href="#how">
                  {t("heroHow")}
                </a>
              </div>
              <p className="micro">
                {t("heroNotice")}
              </p>
            </div>
            <div className="hero-card">
              <h3>{t("safetyTitle")}</h3>
              <p>{profileSummary}</p>
              <div className="pill-row">
                <span className="pill">{t("pillOffline")}</span>
                <span className="pill">{language === "gu" ? "Gujarati" : "English"}</span>
                <span className="pill">{t("pillPrivacy")}</span>
                <span className="pill">{t("pillBharat")}</span>
              </div>
              <div className="hero-grid">
                <div>
                  <p className="stat">4 min</p>
                  <p className="stat-label">{t("statTime")}</p>
                </div>
                <div>
                  <p className="stat">24/7</p>
                  <p className="stat-label">{t("statAccess")}</p>
                </div>
                <div>
                  <p className="stat">1 tap</p>
                  <p className="stat-label">{t("statSave")}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {user && !isOpsUser && (
          <section className="member-zone">
            <div className="member-head">
              <h2>{t("memberTitle")}</h2>
              <p>{t("memberSubtitle")}</p>
            </div>
            <div className="member-grid">
              <article className="member-card">
                <h3>{t("memberCardProfile")}</h3>
                <p className="member-metric">{profileCompletion}%</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => scrollToSection("profile")}
                >
                  {t("memberOpenProfile")}
                </button>
              </article>
              <article className="member-card">
                <h3>{t("memberCardLast")}</h3>
                <p className="member-metric">
                  {lastGuidance?.result?.headline || t("memberNoTriage")}
                </p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => scrollToSection("profile")}
                >
                  {t("memberOpenHistory")}
                </button>
              </article>
              <article className="member-card">
                <h3>{t("memberCardPass")}</h3>
                <p className="member-metric">
                  {sharePass?.code || "---- ----"}
                </p>
                <button type="button" className="secondary" onClick={generateSharePass}>
                  {t("memberOpenPass")}
                </button>
              </article>
              <article className="member-card muted">
                <h3>{t("memberCardRecords")}</h3>
                <p className="member-metric">PDF / Lab / Rx</p>
                <button type="button" className="secondary" onClick={openRecordUploader}>
                  {t("memberUploadDocs")}
                </button>
              </article>
            </div>
          </section>
        )}

        {!isOpsUser && (
        <section className="grid">
          <div className="panel">
            <h2 id="triage">{t("triageTitle")}</h2>
            <p className="panel-sub">
              {t("triageSubtitle")}
            </p>
            <form className="form" onSubmit={submitTriage}>
              <div className="action-row">
                <button
                  type="button"
                  className={triageType === "general" ? "chip active" : "chip"}
                  onClick={() => setTriageType("general")}
                >
                  {t("triageModeGeneral")}
                </button>
                <button
                  type="button"
                  className={triageType === "dental" ? "chip active" : "chip"}
                  onClick={() => setTriageType("dental")}
                >
                  {t("triageModeDental")}
                </button>
              </div>
              <div className="form-row">
                <label>
                  {t("age")}
                  <input
                    type="number"
                    min="0"
                    value={triageForm.age}
                    onChange={(event) =>
                      updateTriageField("age", event.target.value)
                    }
                  />
                </label>
                <label>
                  {t("sex")}
                  <select
                    value={triageForm.sex}
                    onChange={(event) =>
                      updateTriageField("sex", event.target.value)
                    }
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>
              </div>

              {triageType === "general" ? (
                <>
                  <label className="block">
                    {t("duration")}
                    <input
                      type="number"
                      min="1"
                      value={triageForm.durationDays}
                      onChange={(event) =>
                        updateTriageField("durationDays", event.target.value)
                      }
                    />
                  </label>

                  <label className="block">
                    {t("severity")}
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={triageForm.severity}
                      onChange={(event) =>
                        updateTriageField("severity", event.target.value)
                      }
                    />
                    <span className="range-label">
                      {triageForm.severity} / 5
                    </span>
                  </label>

                  <div className="checklist">
                    <p className="checklist-title">{t("commonSymptoms")}</p>
                    <div className="chip-grid">
                      {commonSymptoms.map((symptom) => (
                        <button
                          type="button"
                          key={symptom}
                          className={
                            triageForm.symptoms.includes(symptom)
                              ? "chip active"
                              : "chip"
                          }
                          onClick={() => toggleArrayValue("symptoms", symptom)}
                        >
                          {translateSymptom(symptom)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    {t("additionalSymptoms")}
                    <input
                      type="text"
                      placeholder={t("additionalPlaceholder")}
                      value={triageForm.additionalSymptoms}
                      onChange={(event) =>
                        updateTriageField("additionalSymptoms", event.target.value)
                      }
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    {t("duration")}
                    <input
                      type="number"
                      min="1"
                      value={dentalForm.durationDays}
                      onChange={(event) =>
                        updateDentalField("durationDays", event.target.value)
                      }
                    />
                  </label>
                  <label className="block">
                    {t("dentalPainScale")}
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={dentalForm.painScale}
                      onChange={(event) =>
                        updateDentalField("painScale", event.target.value)
                      }
                    />
                    <span className="range-label">
                      {dentalForm.painScale} / 10
                    </span>
                  </label>
                  <div className="checklist">
                    <p className="checklist-title">{t("dentalSymptoms")}</p>
                    <div className="chip-grid">
                      {dentalSymptomsOptions.map((symptom) => (
                        <button
                          type="button"
                          key={symptom}
                          className={dentalForm.symptoms.includes(symptom) ? "chip active" : "chip"}
                          onClick={() => toggleDentalArrayValue("symptoms", symptom)}
                        >
                          {symptom}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <input
                      type="checkbox"
                      checked={dentalForm.hotColdTrigger}
                      onChange={(event) => updateDentalField("hotColdTrigger", event.target.checked)}
                    />{" "}
                    {t("dentalHotColdTrigger")}
                  </label>
                  <label className="block">
                    <input
                      type="checkbox"
                      checked={dentalForm.swelling}
                      onChange={(event) => updateDentalField("swelling", event.target.checked)}
                    />{" "}
                    {t("dentalSwelling")}
                  </label>
                </>
              )}

              <label className="block">
                Upload a photo (optional)
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
              {triageForm.photoPreview && (
                <div className="photo-preview">
                  <img src={triageForm.photoPreview} alt="Selected" />
                  <button type="button" className="remove-btn" onClick={removeTriagePhoto}>
                    {t("removePhoto")}
                  </button>
                </div>
              )}

              <div className="checklist warning">
                <p className="checklist-title">
                  {triageType === "general" ? t("redFlags") : t("dentalRedFlags")}
                </p>
                <div className="chip-grid">
                  {(triageType === "general" ? redFlagOptions : dentalRedFlagOptions).map((flag) => (
                    <button
                      type="button"
                      key={flag}
                      className={
                        (triageType === "general" ? triageForm.redFlags : dentalForm.redFlags).includes(flag)
                          ? "chip danger"
                          : "chip"
                      }
                      onClick={() =>
                        triageType === "general"
                          ? toggleArrayValue("redFlags", flag)
                          : toggleDentalArrayValue("redFlags", flag)
                      }
                    >
                      {triageType === "general" ? translateSymptom(flag) : flag}
                    </button>
                  ))}
                </div>
              </div>

              <button className="primary full" type="submit">
                {triageLoading ? t("runningTriage") : t("getGuidance")}
              </button>
              {triageError && <p className="error">{triageError}</p>}
            </form>
          </div>

          <div className="panel result">
            <h2>{t("guidanceTitle")}</h2>
            {!triageResult ? (
              <div className="empty">
                <p>{t("guidanceEmpty")}</p>
                <p className="micro">
                  {t("guidanceNote")}
                </p>
              </div>
            ) : (
              <div className={`result-card ${triageResult.level}`}>
                <p className="result-label">{triageResult.headline}</p>
                <p className="result-urgency">{triageResult.urgency}</p>
                <div className="result-list">
                  {triageResult.suggestions?.map((item) => (
                    <div key={item} className="result-item">
                      {item}
                    </div>
                  ))}
                </div>
                <p className="micro">
                  {t("triageSource")}:{" "}
                  {triageResult.source === "gemini"
                    ? t("sourceGemini")
                    : triageResult.source === "openai"
                      ? t("sourceOpenai")
                      : triageResult.source === "ml_local"
                        ? t("sourceLocalModel")
                      : t("sourceFallback")}
                </p>
                <p className="micro">{triageResult.disclaimer}</p>
                <button type="button" className="secondary" onClick={downloadVisitPdf}>
                  {t("downloadVisitPdf")}
                </button>
                {user && (
                  <div className="feedback-box">
                    <p className="micro">{t("feedbackPrompt")}</p>
                    <div className="action-row">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleGuidanceFeedback(true)}
                      >
                        {t("feedbackYes")}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleGuidanceFeedback(false)}
                      >
                        {t("feedbackNo")}
                      </button>
                    </div>
                    <p className="micro">{t("followupPrompt")}</p>
                    <div className="action-row">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleVisitFollowup(true)}
                      >
                        {t("followupYes")}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleVisitFollowup(false)}
                      >
                        {t("followupNo")}
                      </button>
                    </div>
                    {feedbackStatus && <p className="micro">{feedbackStatus}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="panel-mini" id="account">
              <h3>{t("account")}</h3>
              {user ? (
                <div className="account">
                  <p className="account-name">{user.name}</p>
                  <p className="account-email">{user.email}</p>
                  {(user.role === "doctor" || user.role === "admin") && (
                    <a className="secondary" href="/doctor-dashboard">
                      {t("continueAsDoctor")}
                    </a>
                  )}
                  <button className="ghost" onClick={signOut}>
                    {t("navSignOut")}
                  </button>
                </div>
              ) : (
                <div className="auth-card">
                  <label className="block">
                    Portal
                    <select
                      value={portalType}
                      onChange={(event) => setPortalType(event.target.value)}
                    >
                      <option value="patient">{t("patientPortal")}</option>
                      <option value="doctor">{t("doctorPortal")}</option>
                    </select>
                  </label>
                  {portalType === "patient" ? (
                    <form className="auth" onSubmit={handleAuth}>
                      <div className="auth-toggle">
                        <button
                          type="button"
                          className={authMode === "login" ? "active" : ""}
                          onClick={() => setAuthMode("login")}
                        >
                          {t("signIn")}
                        </button>
                        <button
                          type="button"
                          className={authMode === "signup" ? "active" : ""}
                          onClick={() => setAuthMode("signup")}
                        >
                          {t("create")}
                        </button>
                      </div>
                      {authMode === "signup" && (
                        <label>
                          {t("name")}
                          <input
                            type="text"
                            value={authForm.name}
                            onChange={(event) =>
                              updateAuthField("name", event.target.value)
                            }
                          />
                        </label>
                      )}
                      <label>
                        {t("email")}
                        <input
                          type="email"
                          value={authForm.email}
                          onChange={(event) =>
                            updateAuthField("email", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        {t("password")}
                        <input
                          type="password"
                          value={authForm.password}
                          onChange={(event) =>
                            updateAuthField("password", event.target.value)
                          }
                        />
                      </label>
                      {authError && <p className="error">{authError}</p>}
                      <button className="primary full" type="submit">
                        {authMode === "signup" ? t("createAccount") : t("signIn")}
                      </button>
                    </form>
                  ) : (
                    <form className="auth" onSubmit={handleDoctorAuth}>
                      <div className="auth-toggle">
                        <button
                          type="button"
                          className={doctorAuthMode === "login" ? "active" : ""}
                          onClick={() => setDoctorAuthMode("login")}
                        >
                          {t("signIn")}
                        </button>
                        <button
                          type="button"
                          className={doctorAuthMode === "signup" ? "active" : ""}
                          onClick={() => setDoctorAuthMode("signup")}
                        >
                          {t("create")}
                        </button>
                      </div>
                      {doctorAuthMode === "signup" && (
                        <label>
                          {t("name")}
                          <input
                            type="text"
                            value={doctorAuthForm.name}
                            onChange={(event) =>
                              updateDoctorAuthField("name", event.target.value)
                            }
                          />
                        </label>
                      )}
                      <label>
                        {t("email")}
                        <input
                          type="email"
                          value={doctorAuthForm.email}
                          onChange={(event) =>
                            updateDoctorAuthField("email", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        {t("password")}
                        <input
                          type="password"
                          value={doctorAuthForm.password}
                          onChange={(event) =>
                            updateDoctorAuthField("password", event.target.value)
                          }
                        />
                      </label>
                      {doctorAuthError && <p className="error">{doctorAuthError}</p>}
                      <button className="primary full" type="submit">
                        {doctorAuthMode === "signup" ? t("createAccount") : t("signIn")}
                      </button>
                    </form>
                  )}
                  <div className="pass-card" style={{ marginTop: 12 }}>
                    <p className="micro"><strong>Forgot password</strong></p>
                    <label className="block">
                      {t("email")}
                      <input
                        type="email"
                        value={resetForm.email}
                        onChange={(event) =>
                          setResetForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                      />
                    </label>
                    <div className="action-row">
                      <button className="secondary" type="button" onClick={requestPasswordReset}>
                        Get reset token
                      </button>
                    </div>
                    <label className="block">
                      Reset token
                      <input
                        type="text"
                        value={resetForm.token}
                        onChange={(event) =>
                          setResetForm((prev) => ({ ...prev, token: event.target.value }))
                        }
                      />
                    </label>
                    <label className="block">
                      New password
                      <input
                        type="password"
                        value={resetForm.newPassword}
                        onChange={(event) =>
                          setResetForm((prev) => ({ ...prev, newPassword: event.target.value }))
                        }
                      />
                    </label>
                    <button className="primary full" type="button" onClick={confirmPasswordReset}>
                      Reset password
                    </button>
                    {resetTokenPreview && (
                      <p className="micro">Demo token: <code>{resetTokenPreview}</code></p>
                    )}
                    {resetStatus && <p className="micro">{resetStatus}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {["admin", "front_desk"].includes(user?.role) && (
          <section className="grid" id="admin-ops">
            <div className="panel">
              <h2>Front-desk / admin dashboard</h2>
              <p className="panel-sub">
                Live view of today’s OPD flow for trial operations.
              </p>
              <div className="action-row">
                <button className="secondary" type="button" onClick={loadAdminOps}>
                  Refresh dashboard
                </button>
                <button className="secondary" type="button" onClick={loadOpsQueue}>
                  Refresh queue
                </button>
              </div>
              {(adminOpsStatus || opsQueueStatus) && <p className="micro">{adminOpsStatus || opsQueueStatus}</p>}
              {adminOps && (
                <>
                  <div className="member-grid">
                    <div className="panel-mini">
                      <h3>Today total</h3>
                      <p className="metric-value">{adminOps.today?.total || 0}</p>
                    </div>
                    <div className="panel-mini">
                      <h3>Checked in</h3>
                      <p className="metric-value">{adminOps.today?.checkedIn || 0}</p>
                    </div>
                    <div className="panel-mini">
                      <h3>Completed</h3>
                      <p className="metric-value">{adminOps.today?.completed || 0}</p>
                    </div>
                    <div className="panel-mini">
                      <h3>No show</h3>
                      <p className="metric-value">{adminOps.today?.noShow || 0}</p>
                    </div>
                  </div>
                  <div className="grid">
                    <div className="panel result">
                      <h3>Upcoming appointments</h3>
                      <div className="history-list">
                        {(adminOps.upcomingAppointments || []).map((item) => (
                          <div key={`ops-appt-${item.id}`} className="history-card">
                            <p className="history-headline">
                              {item.department_name || "Department"} • {item.status}
                            </p>
                            <p className="micro">
                              {item.doctor_name ? `Dr. ${item.doctor_name}` : "Unassigned doctor"}
                            </p>
                            <p className="micro">{item.patient_name}</p>
                            <p className="micro">{item.reason}</p>
                            <p className="micro">{new Date(item.scheduled_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="panel result">
                      <h3>Department load today</h3>
                      <div className="history-list">
                        {(adminOps.departmentLoad || []).map((item, index) => (
                          <div key={`ops-dept-${index}`} className="history-card">
                            <p className="history-headline">{item.department_name}</p>
                            <p className="micro">{item.total} appointments</p>
                          </div>
                        ))}
                      </div>
                      <h3 style={{ marginTop: 16 }}>Doctor load today</h3>
                      <div className="history-list">
                        {(adminOps.doctorLoad || []).map((item, index) => (
                          <div key={`ops-doc-${index}`} className="history-card">
                            <p className="history-headline">{item.doctor_name}</p>
                            <p className="micro">{item.total} appointments</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="panel result" style={{ marginTop: 16 }}>
                    <h3>Today queue actions</h3>
                    <div className="history-list">
                      {opsQueue.map((item) => (
                        <div key={`queue-${item.id}`} className="history-card">
                          <p className="history-headline">
                            #{item.id} • {item.patient_name}
                            {item.member_name ? ` (${item.member_name})` : ""}
                          </p>
                          <p className="micro">
                            {item.department_name || "Department"} • {item.doctor_name ? `Dr. ${item.doctor_name}` : "No doctor"}
                          </p>
                          <p className="micro">
                            {new Date(item.scheduled_at).toLocaleString()} • {item.status}
                          </p>
                          <p className="micro">{item.reason}</p>
                          <div className="action-row">
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => updateAppointmentStatus(item.id, "checked_in")}
                            >
                              Check in
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => updateAppointmentStatus(item.id, "completed")}
                            >
                              Complete
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              onClick={() => updateAppointmentStatus(item.id, "no_show")}
                            >
                              No show
                            </button>
                          </div>
                          <div className="form-row">
                            <label>
                              Fee
                              <input
                                type="number"
                                min="0"
                                value={billingDrafts[item.id]?.amount ?? ""}
                                onChange={(event) =>
                                  updateBillingDraft(item.id, "amount", event.target.value)
                                }
                              />
                            </label>
                            <label>
                              Billing
                              <select
                                value={billingDrafts[item.id]?.status || "unpaid"}
                                onChange={(event) =>
                                  updateBillingDraft(item.id, "status", event.target.value)
                                }
                              >
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="waived">Waived</option>
                              </select>
                            </label>
                            <label>
                              Method
                              <select
                                value={billingDrafts[item.id]?.paymentMethod || ""}
                                onChange={(event) =>
                                  updateBillingDraft(item.id, "paymentMethod", event.target.value)
                                }
                              >
                                <option value="">Select</option>
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card</option>
                              </select>
                            </label>
                          </div>
                          <div className="action-row">
                            <button
                              className="primary"
                              type="button"
                              onClick={() => saveBillingForAppointment(item.id)}
                            >
                              Save billing
                            </button>
                            <button
                              className="ghost"
                              type="button"
                              onClick={() => viewReceipt(item.id)}
                            >
                              View receipt
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {user?.role === "admin" && (
          <section className="grid" id="admin-users">
            <div className="panel">
              <h2>Admin user access</h2>
              <p className="panel-sub">
                Approve doctors, assign departments, and disable accounts before go-live.
              </p>
              <div className="action-row">
                <button className="secondary" type="button" onClick={loadAdminUsers}>
                  Refresh users
                </button>
              </div>
              {adminUsersStatus && <p className="micro">{adminUsersStatus}</p>}
              <div className="history-list">
                {adminUsers.slice(0, 12).map((adminUser) => (
                  <div key={adminUser.id} className="history-card">
                    <p className="history-headline">
                      {adminUser.name} {adminUser.id === user.id ? "(You)" : ""}
                    </p>
                    <p className="micro">{adminUser.email}</p>
                    <div className="form-row">
                      <label>
                        Role
                        <select
                          value={adminUser.roleDraft}
                          onChange={(event) =>
                            updateAdminUserDraft(adminUser.id, "roleDraft", event.target.value)
                          }
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Doctor</option>
                          <option value="front_desk">Front desk</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <label>
                        Access
                        <select
                          value={adminUser.activeDraft}
                          onChange={(event) =>
                            updateAdminUserDraft(adminUser.id, "activeDraft", event.target.value)
                          }
                        >
                          <option value="active">Active</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </label>
                    </div>
                    {(adminUser.roleDraft === "doctor" || adminUser.roleDraft === "admin") && (
                      <>
                        <div className="form-row">
                          <label>
                            Department
                            <select
                              value={adminUser.departmentIdDraft}
                              onChange={(event) =>
                                updateAdminUserDraft(
                                  adminUser.id,
                                  "departmentIdDraft",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Select department</option>
                              {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                  {department.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Qualification
                            <input
                              type="text"
                              value={adminUser.qualificationDraft}
                              onChange={(event) =>
                                updateAdminUserDraft(
                                  adminUser.id,
                                  "qualificationDraft",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </div>
                      </>
                    )}
                    <button
                      className="primary"
                      type="button"
                      disabled={adminSavingUserId === adminUser.id}
                      onClick={() => saveAdminUser(adminUser)}
                    >
                      {adminSavingUserId === adminUser.id ? "Saving..." : "Save access"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {user && !isOpsUser && (
          <section className="grid" id="profile">
            <div className="panel">
              <h2>{t("profileTitle")}</h2>
              <p className="panel-sub">
                {t("profileSubtitle")}
              </p>
              <form className="form" onSubmit={saveProfile}>
                <div className="form-row">
                  <label>
                    {t("age")}
                    <input
                      type="number"
                      min="0"
                      value={profileForm.age}
                      onChange={(event) =>
                        updateProfileField("age", event.target.value)
                      }
                    />
                  </label>
                  <label>
                    {t("sex")}
                    <select
                      value={profileForm.sex}
                      onChange={(event) =>
                        updateProfileField("sex", event.target.value)
                      }
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  {t("region")}
                  <input
                    type="text"
                    placeholder={t("regionPlaceholder")}
                    value={profileForm.region}
                    onChange={(event) =>
                      updateProfileField("region", event.target.value)
                    }
                  />
                </label>
                <label className="block">
                  {t("conditions")}
                  <input
                    type="text"
                    placeholder={t("conditionsPlaceholder")}
                    value={profileForm.conditions}
                    onChange={(event) =>
                      updateProfileField("conditions", event.target.value)
                    }
                  />
                </label>
                <label className="block">
                  {t("allergies")}
                  <input
                    type="text"
                    placeholder={t("allergiesPlaceholder")}
                    value={profileForm.allergies}
                    onChange={(event) =>
                      updateProfileField("allergies", event.target.value)
                    }
                  />
                </label>
                {profileStatus && <p className="micro">{profileStatus}</p>}
                <button className="primary full" type="submit">
                  {t("saveProfile")}
                </button>
              </form>
            </div>
            <div className="panel result">
              <h2>{t("historyTitle")}</h2>
              {history.length === 0 ? (
                <p className="micro">{t("historyEmpty")}</p>
              ) : (
                <div className="history-list">
                  {visibleHistory.map((item) => (
                    <div key={item.id} className="history-card">
                      <p className="history-date">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                      <p className="history-headline">
                        {item.result?.headline || "Guidance result"}
                      </p>
                      <p className="micro">
                        {item.result?.urgency || "Saved guidance"}
                      </p>
                    </div>
                  ))}
                  {history.length > 3 && (
                    <button
                      type="button"
                      className="ghost full"
                      onClick={() => setHistoryExpanded((prev) => !prev)}
                    >
                      {historyExpanded ? t("historyShowLess") : t("historyShowMore")}
                    </button>
                  )}
                </div>
              )}
              {historyStatus && <p className="micro">{historyStatus}</p>}
            </div>
          </section>
        )}

        {user && !isOpsUser && (
          <section className="grid" id="family">
            <div className="panel">
              <h2>{t("familyTitle")}</h2>
              <form className="form" onSubmit={saveFamilyMember}>
                <div className="form-row">
                  <label>
                    {t("name")}
                    <input
                      type="text"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </label>
                  <label>
                    {t("relation")}
                    <input
                      type="text"
                      value={memberForm.relation}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, relation: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    {t("age")}
                    <input
                      type="number"
                      value={memberForm.age}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, age: e.target.value }))}
                    />
                  </label>
                  <label>
                    {t("sex")}
                    <select
                      value={memberForm.sex}
                      onChange={(e) => setMemberForm((prev) => ({ ...prev, sex: e.target.value }))}
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  {t("bloodType")}
                  <input
                    type="text"
                    value={memberForm.bloodType}
                    onChange={(e) => setMemberForm((prev) => ({ ...prev, bloodType: e.target.value }))}
                  />
                </label>
                <label className="block">
                  {t("conditions")}
                  <input
                    type="text"
                    value={memberForm.conditions}
                    onChange={(e) => setMemberForm((prev) => ({ ...prev, conditions: e.target.value }))}
                  />
                </label>
                <label className="block">
                  {t("allergies")}
                  <input
                    type="text"
                    value={memberForm.allergies}
                    onChange={(e) => setMemberForm((prev) => ({ ...prev, allergies: e.target.value }))}
                  />
                </label>
                <button className="primary full" type="submit">
                  {t("addMember")}
                </button>
                {familyStatus && <p className="micro">{familyStatus}</p>}
              </form>
              <div className="member-list">
                <button
                  type="button"
                  className={activeMemberId === null ? "chip active" : "chip"}
                  onClick={() => setActiveMemberId(null)}
                >
                  Self
                </button>
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={activeMemberId === member.id ? "chip active" : "chip"}
                    onClick={() => setActiveMemberId(member.id)}
                  >
                    {member.name} ({member.relation || "family"})
                  </button>
                ))}
              </div>
            </div>
            <div className="panel result">
              <h2 id="records">{t("recordsTitle")}</h2>
              <label className="block">
                {t("uploadRecord")}
                <input
                  ref={recordsInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={uploadRecord}
                />
              </label>
              {recordStatus && <p className="micro">{recordStatus}</p>}
              <div className="history-list">
                {records.map((r) => (
                  <div key={r.id} className="history-card">
                    <p className="history-headline">{r.file_name}</p>
                    <p className="micro">{new Date(r.created_at).toLocaleString()}</p>
                    <button
                      type="button"
                      className="remove-link"
                      onClick={() => deleteRecord(r.id)}
                    >
                      {t("removeRecord")}
                    </button>
                  </div>
                ))}
              </div>
              <div className="action-row">
                <button type="button" className="secondary" onClick={generateEmergencyCard}>
                  {t("generateEmergencyCard")}
                </button>
              </div>
              {emergencyCard && (
                <div className="pass-card">
                  <p>
                    <strong>{t("openEmergencyCard")}:</strong>{" "}
                    <a href={emergencyCard.url} target="_blank" rel="noreferrer">
                      {emergencyCard.url}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {user && !isOpsUser && (
          <section className="panel health-pass">
            <h2>{t("healthPassTitle")}</h2>
            <p className="panel-sub">{t("healthPassBody")}</p>
            <button className="primary" type="button" onClick={generateSharePass}>
              {t("generatePass")}
            </button>
            {sharePassStatus && <p className="micro">{sharePassStatus}</p>}
            {sharePass && (
              <div className="pass-card">
                <p>
                  <strong>{t("passCode")}:</strong> {sharePass.code}
                </p>
                <p>
                  <strong>{t("passExpires")}:</strong>{" "}
                  {new Date(sharePass.expiresAt).toLocaleString()}
                </p>
                <p className="micro">{t("oneTimeCodeNote")}</p>
                <a className="secondary" href={sharePass.doctorUrl} target="_blank" rel="noreferrer">
                  {t("passOpenDoctorView")}
                </a>
                {shareQr && (
                  <div className="qr-box">
                    <img src={shareQr} alt="Health pass QR" />
                    <p className="micro">{t("qrReady")}</p>
                  </div>
                )}
              </div>
            )}
            <h3>{t("shareHistory")}</h3>
            <div className="history-list">
              {shareHistory.map((h, idx) => (
                <div key={`${h.code}-${idx}`} className="history-card">
                  <p className="history-headline">{h.code}</p>
                  <p className="micro">
                    Active until {new Date(h.expiresAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {user && !isOpsUser && (
          <section className="grid" id="teleconsult">
            <div className="panel">
              <h2>{t("teleTitle")}</h2>
              <p className="panel-sub">{t("teleSubtitle")}</p>
              <form className="form" onSubmit={submitCareRequest}>
                <label className="block">
                  {t("careRequestType")}
                  <select
                    value={careRequestMode}
                    onChange={(event) => setCareRequestMode(event.target.value)}
                  >
                    <option value="in_person">{t("careRequestInPerson")}</option>
                    <option value="video">{t("teleModeVideo")}</option>
                    <option value="audio">{t("teleModeAudio")}</option>
                    <option value="chat">{t("teleModeChat")}</option>
                  </select>
                </label>
                {careRequestMode === "in_person" ? (
                  <>
                    <label className="block">
                      {t("apptDepartment")}
                      <select
                        value={appointmentForm.departmentId}
                        onChange={(event) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            departmentId: event.target.value,
                            doctorId: "",
                          }))
                        }
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      Doctor
                      <select
                        value={appointmentForm.doctorId}
                        onChange={(event) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            doctorId: event.target.value,
                            slotTime: "",
                          }))
                        }
                        disabled={!appointmentForm.departmentId || departmentDoctors.length === 0}
                      >
                        <option value="">
                          {appointmentForm.departmentId
                            ? departmentDoctors.length > 0
                              ? "Select doctor"
                              : "No doctors available"
                            : "Select department first"}
                        </option>
                        {departmentDoctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                            {doctor.qualification ? ` • ${doctor.qualification}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      {t("apptReason")}
                      <textarea
                        rows={3}
                        value={appointmentForm.reason}
                        onChange={(event) =>
                          setAppointmentForm((prev) => ({ ...prev, reason: event.target.value }))
                        }
                      />
                    </label>
                    <label className="block">
                      Appointment date
                      <input
                        type="date"
                        value={appointmentForm.appointmentDate}
                        onChange={(event) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            appointmentDate: event.target.value,
                            slotTime: "",
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      Available slot
                      <select
                        value={appointmentForm.slotTime}
                        onChange={(event) =>
                          setAppointmentForm((prev) => ({ ...prev, slotTime: event.target.value }))
                        }
                        disabled={!appointmentForm.appointmentDate || availableSlots.length === 0}
                      >
                        <option value="">
                          {appointmentForm.appointmentDate
                            ? availableSlots.length > 0
                              ? "Select slot"
                              : "No slots available"
                            : "Select date first"}
                        </option>
                        {availableSlots.map((slot) => (
                          <option key={slot.dateTime} value={slot.time}>
                            {slot.time}
                          </option>
                        ))}
                      </select>
                    </label>
                    {slotStatus && <p className="micro">{slotStatus}</p>}
                    <button className="primary full" type="submit">
                      {t("apptBook")}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="block">
                      {t("teleSlot")}
                      <input
                        type="datetime-local"
                        value={teleForm.preferredSlot}
                        onChange={(event) => updateTeleField("preferredSlot", event.target.value)}
                      />
                    </label>
                    <label className="block">
                      {t("telePhone")}
                      <input
                        type="text"
                        value={teleForm.phone}
                        onChange={(event) => updateTeleField("phone", event.target.value)}
                        placeholder="+91..."
                      />
                    </label>
                    <label className="block">
                      {t("teleConcern")}
                      <textarea
                        rows={4}
                        value={teleForm.concern}
                        onChange={(event) => updateTeleField("concern", event.target.value)}
                        placeholder={t("teleConcernPlaceholder")}
                      />
                    </label>
                    <button type="submit" className="primary full">
                      {t("teleBook")}
                    </button>
                  </>
                )}
              </form>
              {(teleStatus || appointmentsStatus) && (
                <p className="micro">{teleStatus || appointmentsStatus}</p>
              )}
            </div>
            <div className="panel result">
              <h2>{t("careRequestFeedTitle")}</h2>
              {teleLoading ? (
                <p className="micro">{t("teleLoading")}</p>
              ) : teleconsults.length === 0 && appointments.length === 0 ? (
                <p className="micro">{t("teleEmpty")}</p>
              ) : (
                <>
                  {appointments.length > 0 && (
                    <div className="history-list">
                      {appointments.slice(0, 5).map((appointment) => (
                        <div key={`appt-${appointment.id}`} className="history-card">
                          <p className="history-headline">
                            {t("careRequestInPerson")} • {appointment.status}
                          </p>
                          <p className="micro">
                            {appointment.department_name || appointment.department}
                            {appointment.doctor_name ? ` • Dr. ${appointment.doctor_name}` : ""}
                          </p>
                          <p className="micro">{appointment.reason}</p>
                          <p className="micro">
                            {new Date(appointment.scheduled_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {teleconsults.length > 0 && (
                    <>
                      <div className="member-list">
                    {teleconsults.map((consult) => (
                      <button
                        key={consult.id}
                        type="button"
                        className={consult.id === activeConsultId ? "chip active" : "chip"}
                        onClick={() => setActiveConsultId(consult.id)}
                      >
                        #{consult.id} • {teleStatusLabel(consult.status)}
                      </button>
                    ))}
                      </div>
                      {activeConsult && (
                        <div className="pass-card consult-card">
                          <p className="history-headline">
                            {teleStatusLabel(activeConsult.status)} • {activeConsult.mode}
                          </p>
                          <p className="micro">{activeConsult.concern}</p>
                          {activeConsult.preferredSlot && (
                            <p className="micro">
                              {t("teleSlot")}: {new Date(activeConsult.preferredSlot).toLocaleString()}
                            </p>
                          )}
                          {activeConsult.meetingUrl && (
                            <a
                              className="secondary"
                              href={activeConsult.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Join consult link
                            </a>
                          )}
                          <div className="consult-thread">
                            {consultMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`chat-msg ${msg.senderRole === "doctor" ? "bot" : "user"}`}
                              >
                                <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                                <p>{msg.message}</p>
                              </div>
                            ))}
                          </div>
                          <form className="chat-form" onSubmit={sendConsultMessage}>
                            <input
                              type="text"
                              value={consultMessageText}
                              placeholder={t("teleMessagePlaceholder")}
                              onChange={(event) => setConsultMessageText(event.target.value)}
                            />
                            <button className="primary" type="submit">
                              {t("teleSend")}
                            </button>
                          </form>
                          {consultMessageStatus && <p className="micro">{consultMessageStatus}</p>}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {user && !isOpsUser && (
          <section className="grid" id="appointments">
            <div className="panel result">
              <h2>{t("encounterTitle")}</h2>
              {encounters.length === 0 ? (
                <p className="micro">{t("encounterEmpty")}</p>
              ) : (
                <>
                  <div className="member-list">
                    {encounters.map((encounter) => (
                      <button
                        key={encounter.id}
                        type="button"
                        className={encounter.id === activeEncounterId ? "chip active" : "chip"}
                        onClick={() => setActiveEncounterId(encounter.id)}
                      >
                        #{encounter.id} • {encounter.status}
                      </button>
                    ))}
                  </div>
                  {encounterDetail && (
                    <div className="pass-card consult-card">
                      <p className="history-headline">
                        {t("encounterDoctor")}: {encounterDetail.encounter.doctor_name || "-"}
                      </p>
                      <p className="micro">
                        {t("encounterDiagnosis")}:{" "}
                        {encounterDetail.encounter.diagnosis_text ||
                          encounterDetail.encounter.diagnosis_code ||
                          "-"}
                      </p>
                      <p className="micro">
                        {t("encounterPlan")}: {encounterDetail.encounter.plan_text || "-"}
                      </p>
                      <p className="micro">
                        {t("encounterVitals")}:{" "}
                        {encounterDetail.encounter.vitals?.summary ||
                          JSON.stringify(encounterDetail.encounter.vitals || {})}
                      </p>
                      <h4>{t("encounterNotes")}</h4>
                      <div className="history-list">
                        {(encounterDetail.notes || []).map((note) => (
                          <div key={note.id} className="history-card">
                            <p className="micro">{new Date(note.created_at).toLocaleString()}</p>
                            <p>{note.note_text}</p>
                            <p className="micro">{note.signature_text}</p>
                          </div>
                        ))}
                      </div>
                      <h4>{t("encounterPrescription")}</h4>
                      <div className="history-list">
                        {(encounterDetail.prescriptions || []).map((rx) => (
                          <div key={rx.id} className="history-card">
                            <p className="micro">{new Date(rx.created_at).toLocaleString()}</p>
                            <p>{rx.instructions || "-"}</p>
                            <ul>
                              {(rx.items || []).map((item) => (
                                <li key={item.id}>
                                  {item.medicine} {item.dose ? `| ${item.dose}` : ""}{" "}
                                  {item.frequency ? `| ${item.frequency}` : ""}{" "}
                                  {item.duration ? `| ${item.duration}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <h4>{t("encounterOrders")}</h4>
                      <div className="history-list">
                        {(encounterDetail.orders || []).map((order) => (
                          <div key={order.id} className="history-card">
                            <p className="history-headline">
                              {order.order_type} • {order.status}
                            </p>
                            <p className="micro">
                              {order.item_name} {order.destination ? `• ${order.destination}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {encounterStatus && <p className="micro">{encounterStatus}</p>}
            </div>
            <div className="panel result">
              <h2>Labs & Pharmacy</h2>
              <p className="panel-sub">
                Open dedicated tabs to compare nearby options by price, speed, and visit mode.
              </p>
              <div className="action-row">
                <a className="secondary" href="/labs" target="_blank" rel="noreferrer">
                  Open labs
                </a>
                <a className="secondary" href="/pharmacy" target="_blank" rel="noreferrer">
                  Open pharmacy
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="trust">
          <div className="trust-header">
            <h2>{t("trustTitle")}</h2>
            <p>{t("howDecideBody")}</p>
          </div>
          <div className="trust-grid">
            <div className="trust-card">
              <h3>{t("trustCard1")}</h3>
              <p>{t("trustCard1Desc")}</p>
            </div>
            <div className="trust-card">
              <h3>{t("trustCard2")}</h3>
              <p>{t("trustCard2Desc")}</p>
            </div>
            <div className="trust-card">
              <h3>{t("trustCard3")}</h3>
              <p>{t("trustCard3Desc")}</p>
            </div>
          </div>
        </section>

        <section className="proof">
          <div>
            <h2>{t("proofTitle")}</h2>
            <p className="micro">{t("proofLiveNote")}</p>
          </div>
          <div className="proof-grid">
            <div className="proof-card">
              <p className="proof-metric">{formatNumber(liveStats.users)}</p>
              <p className="proof-label">{t("proofUsersLabel")}</p>
            </div>
            <div className="proof-card">
              <p className="proof-metric">{formatNumber(liveStats.triageCompleted)}</p>
              <p className="proof-label">{t("proofTriageLabel")}</p>
            </div>
            <div className="proof-card">
              <p className="proof-metric">{formatNumber(liveStats.doctorViews)}</p>
              <p className="proof-label">{t("proofDoctorViewsLabel")}</p>
            </div>
          </div>
        </section>

        <section className="advisors">
          <h2>{t("advisorTitle")}</h2>
          <div className="advisor-grid">
            <div className="advisor-card">
              <div className="avatar">A</div>
              <div>
                <p className="advisor-name">Dr. Ananya Rao</p>
                <p className="micro">{t("advisorRole1")}</p>
              </div>
            </div>
            <div className="advisor-card">
              <div className="avatar">M</div>
              <div>
                <p className="advisor-name">Dr. Mehul Patel</p>
                <p className="micro">{t("advisorRole2")}</p>
              </div>
            </div>
            <div className="advisor-card">
              <div className="avatar">S</div>
              <div>
                <p className="advisor-name">Dr. Sana Qureshi</p>
                <p className="micro">{t("advisorRole3")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel directory" id="doctors">
          <div className="directory-header">
            <h2>{t("directoryTitle")}</h2>
            <p>
              {t("directoryDesc")}
            </p>
          </div>
          <div className="directory-grid">
            <div className="directory-card">
              <h3>{t("directoryCard1")}</h3>
              <p>{t("directoryCard1Desc")}</p>
            </div>
            <div className="directory-card">
              <h3>{t("directoryCard2")}</h3>
              <p>{t("directoryCard2Desc")}</p>
            </div>
            <div className="directory-card">
              <h3>{t("directoryCard3")}</h3>
              <p>{t("directoryCard3Desc")}</p>
            </div>
          </div>
          <div className="action-row">
            <a className="secondary" href="/clinic">
              {t("clinicTitle")}
            </a>
            <a className="secondary" href="/doctor-dashboard">
              {t("doctorConsoleOpen")}
            </a>
          </div>
        </section>

        <section className="info" id="how">
          <div>
            <h2>{t("howTitle")}</h2>
            <p>{t("howBody")}</p>
          </div>
          <div>
            <h2>{t("designedTitle")}</h2>
            <p>{t("designedBody")}</p>
          </div>
          <div>
            <h2>{t("complianceTitle")}</h2>
            <p>{t("complianceBody")}</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>{t("footer")}</p>
      </footer>

      {showDisclaimer && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>{t("disclaimerTitle")}</h2>
            <p>
              {t("disclaimerBody")}
            </p>
            <p className="micro">
              {t("disclaimerConfirm")}
            </p>
            <button className="primary full" onClick={acceptDisclaimer}>
              {t("disclaimerCta")}
            </button>
          </div>
        </div>
      )}

      <div className={`chat-widget ${chatOpen ? "open" : ""}`}>
        <button
          type="button"
          className="chat-toggle"
          onClick={() => setChatOpen((prev) => !prev)}
        >
          {t("chatOpen")}
        </button>
        {chatOpen && (
          <div className="chat-panel">
            <p className="chat-title">{t("chatTitle")}</p>
            <div className="chat-body">
              {chatMessages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={msg.role === "assistant" ? "chat-msg bot" : "chat-msg user"}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && <p className="micro">{t("chatThinking")}</p>}
            </div>
            <form className="chat-form" onSubmit={sendChatMessage}>
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={t("chatPlaceholder")}
              />
              <button type="submit" className="primary">
                {t("chatSend")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
