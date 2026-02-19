import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
    directoryTitle: "Doctor directory (coming soon)",
    directoryDesc:
      "We are building a verified list of local doctors, clinics, and community health workers. This will go live after validation.",
    directoryCard1: "Primary care clinics",
    directoryCard1Desc: "Search by district and speciality.",
    directoryCard2: "Community health workers",
    directoryCard2Desc: "Connect with trusted local health guides.",
    directoryCard3: "Tele-consult partners",
    directoryCard3Desc: "Book calls after triage when needed.",
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
    printHealthCard: "Print health card",
    downloadVisitPdf: "Download visit summary PDF",
    clinicTitle: "Clinic starter page",
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
    directoryTitle: "ડૉક્ટર ડિરેક્ટરી (જલ્દી આવી રહી છે)",
    directoryDesc:
      "અમે સ્થાનિક ડૉક્ટરો, ક્લિનિક્સ અને સમુદાય આરોગ્ય કર્મીઓની ચકાસેલી સૂચિ બનાવી રહ્યા છીએ.",
    directoryCard1: "પ્રાથમિક કાળજી ક્લિનિક્સ",
    directoryCard1Desc: "જિલ્લા અને સ્પેશિયલિટી મુજબ શોધો.",
    directoryCard2: "સમુદાય આરોગ્ય કર્મીઓ",
    directoryCard2Desc: "વિશ્વસનીય સ્થાનિક આરોગ્ય માર્ગદર્શકો જોડાવો.",
    directoryCard3: "ટેલિ-કન્સલ્ટ પાર્ટનર્સ",
    directoryCard3Desc: "જરૂર પડે ત્યારે કોલ બુક કરો.",
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
    printHealthCard: "હેલ્થ કાર્ડ પ્રિન્ટ કરો",
    downloadVisitPdf: "વિઝિટ સમરી PDF ડાઉનલોડ કરો",
    clinicTitle: "ક્લિનિક સ્ટાર્ટર પેજ",
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
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

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
    durationDays: 2,
    severity: 3,
    symptoms: [],
    additionalSymptoms: "",
    redFlags: [],
    photoFile: null,
    photoPreview: "",
  });

  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyStatus, setHistoryStatus] = useState("");
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

  const doctorCode = useMemo(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "doctor-view" && parts[1]) return parts[1];
    return null;
  }, []);
  const clinicMode = useMemo(
    () => window.location.pathname.replace(/\/+$/, "") === "/clinic",
    [],
  );
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

  const updateAuthField = (key, value) =>
    setAuthForm((prev) => ({ ...prev, [key]: value }));

  const updateTriageField = (key, value) =>
    setTriageForm((prev) => ({ ...prev, [key]: value }));

  const updateProfileField = (key, value) =>
    setProfileForm((prev) => ({ ...prev, [key]: value }));

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

  const loadProfile = async (userId) => {
    try {
      const response = await apiFetch(`${API_BASE}/api/profile/${userId}`);
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

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id);
      loadHistory(user.id);
      loadFamilyMembers();
      loadShareHistory();
    } else {
      setHistory([]);
      setFamilyMembers([]);
      setRecords([]);
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

    const payload = {
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
        form.append("age", payload.age || "");
        form.append("sex", payload.sex || "");
        form.append("durationDays", payload.durationDays || "");
        form.append("severity", payload.severity || "");
        form.append("symptoms", JSON.stringify(payload.symptoms || []));
        form.append("redFlags", JSON.stringify(payload.redFlags || []));
        form.append("additionalSymptoms", payload.additionalSymptoms || "");
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

  const printHealthCard = () => window.print();

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
                          {t("doctorSymptoms")}: {(entry.payload?.symptoms || []).join(", ") || t("doctorNone")}
                        </p>
                        <p className="micro">
                          {t("doctorSeverity")}: {entry.payload?.severity || "-"} / 5
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
            <button className="ghost" onClick={() => setAuthMode("signup")}>
              {t("navCreate")}
            </button>
          )}
          <a className="primary" href="#triage">
            {t("navStart")}
          </a>
        </div>
      </header>

      <main>
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

        {user && (
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
                <button type="button" className="secondary">
                  {t("memberUploadDocs")}
                </button>
              </article>
            </div>
          </section>
        )}

        <section className="grid">
          <div className="panel">
            <h2 id="triage">{t("triageTitle")}</h2>
            <p className="panel-sub">
              {t("triageSubtitle")}
            </p>
            <form className="form" onSubmit={submitTriage}>
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

              <label className="block">
                Upload a photo (optional)
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
              {triageForm.photoPreview && (
                <div className="photo-preview">
                  <img src={triageForm.photoPreview} alt="Selected" />
                </div>
              )}

              <div className="checklist warning">
                <p className="checklist-title">{t("redFlags")}</p>
                <div className="chip-grid">
                  {redFlagOptions.map((flag) => (
                    <button
                      type="button"
                      key={flag}
                      className={
                        triageForm.redFlags.includes(flag)
                          ? "chip danger"
                          : "chip"
                      }
                      onClick={() => toggleArrayValue("redFlags", flag)}
                    >
                      {translateSymptom(flag)}
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

            <div className="panel-mini">
              <h3>{t("account")}</h3>
              {user ? (
                <div className="account">
                  <p className="account-name">{user.name}</p>
                  <p className="account-email">{user.email}</p>
                  <button className="ghost" onClick={signOut}>
                    {t("navSignOut")}
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </section>

        {user && (
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
                  {history.map((item) => (
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
                </div>
              )}
              {historyStatus && <p className="micro">{historyStatus}</p>}
            </div>
          </section>
        )}

        {user && (
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
              <h2>{t("recordsTitle")}</h2>
              <label className="block">
                {t("uploadRecord")}
                <input type="file" accept="image/*,application/pdf" onChange={uploadRecord} />
              </label>
              {recordStatus && <p className="micro">{recordStatus}</p>}
              <div className="history-list">
                {records.map((r) => (
                  <div key={r.id} className="history-card">
                    <p className="history-headline">{r.file_name}</p>
                    <p className="micro">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="action-row">
                <button type="button" className="secondary" onClick={generateEmergencyCard}>
                  {t("generateEmergencyCard")}
                </button>
                <button type="button" className="secondary" onClick={printHealthCard}>
                  {t("printHealthCard")}
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

        {user && (
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
                <div key={`${h.pass_code}-${idx}`} className="history-card">
                  <p className="history-headline">{h.pass_code}</p>
                  <p className="micro">
                    {h.doctor_name || "Clinic"} • {new Date(h.viewed_at).toLocaleString()}
                  </p>
                </div>
              ))}
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
