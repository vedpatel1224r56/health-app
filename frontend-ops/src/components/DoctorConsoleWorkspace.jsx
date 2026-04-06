import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PediatricGrowthChart } from './PediatricGrowthChart'
import { ReportTrendChart } from './ReportTrendChart'
import { DoctorAssistPanel } from './DoctorAssistPanel'
import {
  WHO_UNDER5_MAX_MONTHS,
  WHO_OLDER_CHILD_MAX_MONTHS,
  WHO_BMI_MIN_MONTHS,
  WHO_HEAD_CIRCUMFERENCE_EMPHASIS_MAX_MONTHS,
  WHO_GROSS_MOTOR_MILESTONES,
  normalizeGrowthSex,
  classifyGrowthMeasurement,
  buildMeasurementHistory,
  buildDraftMeasurement,
  buildChartSeries,
  summarizeGrowthAssessment,
  assessDevelopmentMilestone,
} from '../pediatricsGrowth'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPrintableDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function formatConsultLabel(appointment) {
  const when = appointment?.scheduled_at ? new Date(appointment.scheduled_at).toLocaleString() : '-'
  const modePrefix = appointment?.sourceType === 'remote' ? `${String(appointment?.mode || 'chat').toUpperCase()} • ` : ''
  return `${modePrefix}#${appointment?.id || '-'} • ${appointment?.patient_name || 'Patient'} • ${appointment?.department_name || appointment?.department || '-'} • ${when}`
}

function resolveRemoteConsultJoinUrl(consult) {
  const saved = String(consult?.meetingUrl || '').trim()
  if (saved) return saved
  return ''
}

const DEFAULT_RTC_CONFIGURATION = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
}

async function requestUserMedia(constraints) {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints)
  }
  const legacyGetUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
  if (!legacyGetUserMedia) {
    throw new Error('Camera or microphone access is not available in this browser.')
  }
  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(navigator, constraints, resolve, reject)
  })
}

function serializeSessionDescription(description) {
  if (!description) return null
  return { type: description.type, sdp: description.sdp }
}

function serializeIceCandidate(candidate) {
  if (!candidate) return null
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  }
}

function formatStatus(status) {
  if (status === 'approved') return 'Scheduled'
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'in_progress') return 'In progress'
  if (!status) return '-'
  return status.replace(/_/g, ' ')
}

function buildWorklistSectionSummary(appointments = []) {
  const counts = { waiting: 0, today: 0, future: 0 }
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  appointments.forEach((appointment) => {
    const status = String(appointment?.status || '').toLowerCase()
    const normalizedStatus = status === 'approved' ? 'scheduled' : status
    const scheduledAt = appointment?.scheduled_at ? new Date(appointment.scheduled_at) : null
    if (normalizedStatus === 'requested') {
      counts.waiting += 1
      return
    }
    if (['cancelled', 'completed', 'no_show'].includes(normalizedStatus)) return
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return
    if (scheduledAt >= todayStart && scheduledAt < tomorrowStart) {
      counts.today += 1
      return
    }
    if (scheduledAt >= tomorrowStart) {
      counts.future += 1
    }
  })
  return counts
}

const REPORT_GROUPS = [
  { key: 'diabetes', title: 'Diabetes panel', metricKeys: ['hba1c', 'estimated_average_glucose', 'fbs', 'ppbs', 'rbs'] },
  { key: 'thyroid', title: 'Thyroid panel', metricKeys: ['tsh', 't3', 't4'] },
  { key: 'liver', title: 'Liver panel', metricKeys: ['bilirubin_total', 'sgpt_alt', 'sgot_ast'] },
  { key: 'lipid', title: 'Lipid panel', metricKeys: ['total_cholesterol', 'ldl', 'hdl', 'triglycerides'] },
  { key: 'ckd', title: 'Kidney panel', metricKeys: ['creatinine', 'urea', 'uric_acid'] },
  { key: 'anemia', title: 'Anemia / CBC panel', metricKeys: ['hemoglobin', 'rbc_count', 'pcv', 'mcv', 'mch', 'mchc', 'rdw', 'wbc', 'esr', 'platelets'] },
  { key: 'anthropometry', title: 'Body metrics panel', metricKeys: ['weight', 'bmi'] },
]

function getEncounterVitalsDisplay(encounter, draftText = '') {
  if (encounter?.vitals?.summary) return encounter.vitals.summary
  if (encounter?.vitals_json) {
    try {
      const parsed = JSON.parse(encounter.vitals_json)
      if (parsed?.summary) return parsed.summary
      const formatted = Object.entries(parsed || {})
        .filter(([, value]) => String(value || '').trim())
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
      if (formatted) return formatted
    } catch {
      // ignore broken saved vitals json
    }
  }
  return String(draftText || '').trim() || '-'
}

const PEDIATRIC_MILESTONE_FIELDS = [
  {
    key: 'sittingWithoutSupport',
    statusField: 'milestoneSittingStatus',
    dateField: 'milestoneSittingDate',
  },
  {
    key: 'standingWithAssistance',
    statusField: 'milestoneStandingAssistStatus',
    dateField: 'milestoneStandingAssistDate',
  },
  {
    key: 'handsAndKneesCrawling',
    statusField: 'milestoneCrawlingStatus',
    dateField: 'milestoneCrawlingDate',
  },
  {
    key: 'walkingWithAssistance',
    statusField: 'milestoneWalkingAssistStatus',
    dateField: 'milestoneWalkingAssistDate',
  },
  {
    key: 'standingAlone',
    statusField: 'milestoneStandingAloneStatus',
    dateField: 'milestoneStandingAloneDate',
  },
  {
    key: 'walkingAlone',
    statusField: 'milestoneWalkingAloneStatus',
    dateField: 'milestoneWalkingAloneDate',
  },
]

export const PEDIATRIC_VACCINE_CATALOG = [
  { code: 'bcg', vaccineName: 'BCG', doseLabel: 'Birth dose', schedule: 'Both' },
  { code: 'hep_b_birth', vaccineName: 'Hepatitis B', doseLabel: 'Birth dose', schedule: 'Both' },
  { code: 'opv_0', vaccineName: 'OPV / bOPV', doseLabel: 'Zero dose', schedule: 'Both' },
  { code: 'opv_1', vaccineName: 'OPV / bOPV', doseLabel: 'Dose 1', schedule: 'UIP' },
  { code: 'opv_2', vaccineName: 'OPV / bOPV', doseLabel: 'Dose 2', schedule: 'UIP' },
  { code: 'opv_3', vaccineName: 'OPV / bOPV', doseLabel: 'Dose 3', schedule: 'UIP' },
  { code: 'opv_booster', vaccineName: 'OPV / bOPV', doseLabel: 'Booster', schedule: 'Both' },
  { code: 'rvv_1', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 1', schedule: 'Both' },
  { code: 'rvv_2', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 2', schedule: 'Both' },
  { code: 'rvv_3', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 3', schedule: 'Both' },
  { code: 'pentavalent_1', vaccineName: 'Pentavalent vaccine', doseLabel: 'Dose 1', schedule: 'UIP' },
  { code: 'pentavalent_2', vaccineName: 'Pentavalent vaccine', doseLabel: 'Dose 2', schedule: 'UIP' },
  { code: 'pentavalent_3', vaccineName: 'Pentavalent vaccine', doseLabel: 'Dose 3', schedule: 'UIP' },
  { code: 'hexa_1', vaccineName: 'DTaP + IPV + Hib ± Hep B', doseLabel: 'Dose 1', schedule: 'IAP' },
  { code: 'hexa_2', vaccineName: 'DTaP + IPV + Hib ± Hep B', doseLabel: 'Dose 2', schedule: 'IAP' },
  { code: 'hexa_3', vaccineName: 'DTaP + IPV + Hib ± Hep B', doseLabel: 'Dose 3', schedule: 'IAP' },
  { code: 'fipv_1', vaccineName: 'fIPV', doseLabel: 'Dose 1', schedule: 'UIP' },
  { code: 'fipv_2', vaccineName: 'fIPV', doseLabel: 'Dose 2', schedule: 'UIP' },
  { code: 'ipv_booster_1', vaccineName: 'IPV', doseLabel: 'Booster', schedule: 'IAP' },
  { code: 'pcv_1', vaccineName: 'PCV', doseLabel: 'Dose 1', schedule: 'Both' },
  { code: 'pcv_2', vaccineName: 'PCV', doseLabel: 'Dose 2', schedule: 'Both' },
  { code: 'pcv_3', vaccineName: 'PCV', doseLabel: 'Dose 3', schedule: 'IAP' },
  { code: 'pcv_booster', vaccineName: 'PCV', doseLabel: 'Booster', schedule: 'Both' },
  { code: 'influenza_1', vaccineName: 'Influenza', doseLabel: 'Dose 1', schedule: 'IAP' },
  { code: 'influenza_2', vaccineName: 'Influenza', doseLabel: 'Dose 2', schedule: 'IAP' },
  { code: 'mr_1', vaccineName: 'MR', doseLabel: 'Dose 1', schedule: 'UIP' },
  { code: 'mr_2', vaccineName: 'MR', doseLabel: 'Dose 2', schedule: 'UIP' },
  { code: 'mmr_1', vaccineName: 'MMR', doseLabel: 'Dose 1', schedule: 'IAP' },
  { code: 'mmr_2', vaccineName: 'MMR', doseLabel: 'Dose 2', schedule: 'IAP' },
  { code: 'mmr_3', vaccineName: 'MMR', doseLabel: 'Dose 3', schedule: 'IAP' },
  { code: 'je_1', vaccineName: 'JE', doseLabel: 'Dose 1', schedule: 'UIP' },
  { code: 'je_2', vaccineName: 'JE', doseLabel: 'Dose 2', schedule: 'UIP' },
  { code: 'dpt_booster_1', vaccineName: 'DPT', doseLabel: 'Booster 1', schedule: 'UIP' },
  { code: 'dpt_booster_2', vaccineName: 'DPT', doseLabel: 'Booster 2', schedule: 'UIP' },
  { code: 'dtap_booster_1', vaccineName: 'DTaP booster', doseLabel: 'Booster 1', schedule: 'IAP' },
  { code: 'dtap_booster_2', vaccineName: 'DTaP booster', doseLabel: 'Booster 2', schedule: 'IAP' },
  { code: 'hib_booster', vaccineName: 'Hib', doseLabel: 'Booster', schedule: 'IAP' },
  { code: 'hep_a_1', vaccineName: 'Hepatitis A', doseLabel: 'Dose 1', schedule: 'IAP' },
  { code: 'hep_a_2', vaccineName: 'Hepatitis A', doseLabel: 'Dose 2', schedule: 'IAP' },
  { code: 'varicella_1', vaccineName: 'Varicella', doseLabel: 'Dose 1', schedule: 'IAP' },
  { code: 'varicella_2', vaccineName: 'Varicella', doseLabel: 'Dose 2', schedule: 'IAP' },
  { code: 'typhoid_tcv', vaccineName: 'Typhoid conjugate vaccine', doseLabel: 'Single dose', schedule: 'IAP' },
  { code: 'hpv_1', vaccineName: 'HPV', doseLabel: 'Dose 1', schedule: 'IAP' },
  { code: 'hpv_2', vaccineName: 'HPV', doseLabel: 'Dose 2', schedule: 'IAP' },
  { code: 'td_10y', vaccineName: 'Td', doseLabel: '10 years', schedule: 'UIP' },
  { code: 'td_16y', vaccineName: 'Td', doseLabel: '16 years', schedule: 'UIP' },
  { code: 'tdap_10y', vaccineName: 'Tdap/Td', doseLabel: '10 years', schedule: 'IAP' },
  { code: 'tdap_16y', vaccineName: 'Tdap/Td', doseLabel: '16 years', schedule: 'IAP' },
  { code: 'dtwp_1', vaccineName: 'DTwP', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'dtwp_2', vaccineName: 'DTwP', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'dtwp_3', vaccineName: 'DTwP', doseLabel: 'Dose 3', schedule: 'Private' },
  { code: 'dtap_1', vaccineName: 'DTaP', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'dtap_2', vaccineName: 'DTaP', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'dtap_3', vaccineName: 'DTaP', doseLabel: 'Dose 3', schedule: 'Private' },
  { code: 'dtap_booster', vaccineName: 'DTaP', doseLabel: 'Booster', schedule: 'Private' },
  { code: 'ipv_1', vaccineName: 'IPV', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'ipv_2', vaccineName: 'IPV', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'ipv_3', vaccineName: 'IPV', doseLabel: 'Dose 3', schedule: 'Private' },
  { code: 'hib_1', vaccineName: 'Hib', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'hib_2', vaccineName: 'Hib', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'hib_3', vaccineName: 'Hib', doseLabel: 'Dose 3', schedule: 'Private' },
  { code: 'hep_b_2', vaccineName: 'Hepatitis B', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'hep_b_3', vaccineName: 'Hepatitis B', doseLabel: 'Dose 3', schedule: 'Private' },
  { code: 'hep_b_booster', vaccineName: 'Hepatitis B', doseLabel: 'Booster', schedule: 'Private' },
  { code: 'hep_a_live', vaccineName: 'Hepatitis A', doseLabel: 'Single live dose', schedule: 'Private' },
  { code: 'hep_a_booster', vaccineName: 'Hepatitis A', doseLabel: 'Booster', schedule: 'Private' },
  { code: 'influenza_annual', vaccineName: 'Influenza', doseLabel: 'Annual dose', schedule: 'Private' },
  { code: 'typhoid_booster', vaccineName: 'Typhoid conjugate vaccine', doseLabel: 'Booster', schedule: 'Private' },
  { code: 'menacwy_1', vaccineName: 'Meningococcal ACWY', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'menacwy_booster', vaccineName: 'Meningococcal ACWY', doseLabel: 'Booster', schedule: 'Private' },
  { code: 'menb_1', vaccineName: 'Meningococcal B', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'menb_2', vaccineName: 'Meningococcal B', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'rabies_pre_1', vaccineName: 'Rabies', doseLabel: 'Pre-exposure dose 1', schedule: 'Private' },
  { code: 'rabies_pre_2', vaccineName: 'Rabies', doseLabel: 'Pre-exposure dose 2', schedule: 'Private' },
  { code: 'rabies_post_1', vaccineName: 'Rabies', doseLabel: 'Post-exposure dose 1', schedule: 'Private' },
  { code: 'rabies_post_2', vaccineName: 'Rabies', doseLabel: 'Post-exposure dose 2', schedule: 'Private' },
  { code: 'rabies_post_3', vaccineName: 'Rabies', doseLabel: 'Post-exposure dose 3', schedule: 'Private' },
  { code: 'rabies_post_4', vaccineName: 'Rabies', doseLabel: 'Post-exposure dose 4', schedule: 'Private' },
  { code: 'cholera_oral_1', vaccineName: 'Oral cholera vaccine', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'cholera_oral_2', vaccineName: 'Oral cholera vaccine', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'covid_19_1', vaccineName: 'COVID-19', doseLabel: 'Dose 1', schedule: 'Private' },
  { code: 'covid_19_2', vaccineName: 'COVID-19', doseLabel: 'Dose 2', schedule: 'Private' },
  { code: 'covid_19_booster', vaccineName: 'COVID-19', doseLabel: 'Booster', schedule: 'Private' },
  { code: 'ppsv23', vaccineName: 'PPSV23', doseLabel: 'Single dose', schedule: 'Private' },
]

function normalizeSearchValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function toInitials(value) {
  return normalizeSearchValue(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
}

function getConsoleCopy(consoleKind) {
  if (consoleKind === 'surgery') {
    return {
      eyebrow: 'Surgery console',
      subtitle: 'Review surgical consults, capture procedure planning, record pre-op and post-op notes, and manage follow-up review in one workspace.',
      worklistLabel: 'Surgical worklist',
      detailTitle: 'Surgical pathway',
      consultReasonLabel: 'Procedure pathway',
      prescriptionTitle: 'Discharge and post-op medication plan',
      prescriptionSubtitle: 'Capture discharge medication, post-op instructions, and follow-up medicine schedule for surgical care.',
      prescriptionInstructionsLabel: 'Discharge / post-op instructions',
      prescriptionMedicineLabel: 'Medication',
      prescriptionDoseLabel: 'Strength',
      prescriptionFrequencyLabel: 'Timing',
      prescriptionDurationLabel: 'Days',
      addMedicineLabel: 'Add medication',
      savePrescriptionLabel: 'Save surgical Rx',
      ordersTitle: 'Surgical orders',
      ordersSubtitle: 'Create procedure requests, pre-op investigations, and post-op care orders for this surgical visit.',
      orderTypeLabel: 'Order lane',
      orderTypeOptions: [
        { value: 'procedure', label: 'Procedure / OT' },
        { value: 'pre_op_lab', label: 'Pre-op lab' },
        { value: 'post_op_order', label: 'Post-op order' },
        { value: 'radiology', label: 'Imaging' },
      ],
      itemNameLabel: 'Procedure / order name',
      destinationLabel: 'Destination / team',
      orderNotesLabel: 'Surgical order notes',
      createOrderLabel: 'Create surgical order',
      existingOrdersTitle: 'Surgical order trail',
      existingOrdersSubtitle: 'Track procedures, pre-op requests, and post-op orders created from this consult.',
    }
  }
  if (consoleKind === 'pediatrics') {
    return {
      eyebrow: 'Pediatrics console',
      subtitle: 'Open child consults, capture guardian and growth context, maintain pediatric prescription detail, and track follow-up notes cleanly.',
      worklistLabel: 'Child visit worklist',
      detailTitle: 'Pediatric pathway',
      consultReasonLabel: 'Child visit reason',
      prescriptionTitle: 'Pediatric medication plan',
      prescriptionSubtitle: 'Prescribe with child context, weight-aware dosing notes, and parent-friendly instructions.',
      prescriptionInstructionsLabel: 'Parent / guardian instructions',
      prescriptionMedicineLabel: 'Medicine',
      prescriptionDoseLabel: 'Dose / ml / mg',
      prescriptionFrequencyLabel: 'Frequency',
      prescriptionDurationLabel: 'Course',
      addMedicineLabel: 'Add pediatric medicine',
      savePrescriptionLabel: 'Save pediatric Rx',
      ordersTitle: 'Child-care orders',
      ordersSubtitle: 'Send vaccines, pediatric labs, and child-specific referrals in a structured way.',
      orderTypeLabel: 'Order lane',
      orderTypeOptions: [
        { value: 'vaccine', label: 'Vaccine' },
        { value: 'lab', label: 'Pediatric lab' },
        { value: 'referral', label: 'Child referral' },
        { value: 'pharmacy', label: 'Child medication' },
      ],
      itemNameLabel: 'Order item',
      destinationLabel: 'Destination / center',
      orderNotesLabel: 'Parent / pediatric notes',
      createOrderLabel: 'Create pediatric order',
      existingOrdersTitle: 'Child-care order trail',
      existingOrdersSubtitle: 'Track vaccines, labs, referrals, and other pediatric orders from this consult.',
    }
  }
  return {
    eyebrow: 'Doctor console',
    subtitle: 'Use the worklist to open one consult at a time, then complete summary, notes, prescription, and orders in the same view.',
    worklistLabel: 'Clinical worklist',
    detailTitle: 'Clinical pathway',
    consultReasonLabel: 'Visit reason',
    prescriptionTitle: 'Prescription',
    prescriptionSubtitle: 'Build the prescription digitally and keep the medicine list structured.',
    prescriptionInstructionsLabel: 'Instructions',
    prescriptionMedicineLabel: 'Medicine',
    prescriptionDoseLabel: 'Dose',
    prescriptionFrequencyLabel: 'Frequency',
    prescriptionDurationLabel: 'Duration',
    addMedicineLabel: 'Add medicine',
    savePrescriptionLabel: 'Save prescription',
    ordersTitle: 'Clinical orders',
    ordersSubtitle: 'Send lab, radiology, pharmacy, or procedure orders digitally.',
    orderTypeLabel: 'Order type',
    orderTypeOptions: [
      { value: 'lab', label: 'Lab' },
      { value: 'radiology', label: 'Radiology' },
      { value: 'pharmacy', label: 'Pharmacy' },
      { value: 'procedure', label: 'Procedure' },
    ],
    itemNameLabel: 'Item name',
    destinationLabel: 'Destination',
    orderNotesLabel: 'Notes',
    createOrderLabel: 'Create order',
    existingOrdersTitle: 'Existing orders',
    existingOrdersSubtitle: 'Track the order list created from this consult.',
  }
}

function DoctorMediaConsultPanel({
  consult,
  apiBase,
  authToken,
  currentUserId,
  doctorConsentAccepted,
  updateRemoteConsultStatus,
  openStandaloneLiveConsult,
  standaloneLiveMode = false,
  autoStartStandalone = false,
}) {
  const roomReady = ['scheduled', 'in_progress'].includes(String(consult?.status || '').toLowerCase())
  const [callStatus, setCallStatus] = useState('Start the live consult here, then keep documenting in this console.')
  const consultMode = String(consult?.mode || '').toLowerCase()
  const sessionId = useMemo(() => `teleconsult-${consult?.id || 'room'}`, [consult?.id])
  const isVideo = consultMode === 'video'
  const roomUnlocked = doctorConsentAccepted && roomReady
  const peerRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const localMediaRef = useRef(null)
  const remoteMediaRef = useRef(null)
  const lastEventIdRef = useRef(0)
  const processedEventIdsRef = useRef(new Set())
  const pendingCandidatesRef = useRef([])
  const [busy, setBusy] = useState(false)
  const [callStarted, setCallStarted] = useState(false)
  const [remoteConnected, setRemoteConnected] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [rtcConfiguration, setRtcConfiguration] = useState(DEFAULT_RTC_CONFIGURATION)

  const teardownCall = useCallback((message = '') => {
    if (peerRef.current) {
      try {
        peerRef.current.ontrack = null
        peerRef.current.onicecandidate = null
        peerRef.current.onconnectionstatechange = null
        peerRef.current.close()
      } catch {
        // ignore close issues
      }
      peerRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    remoteStreamRef.current = null
    pendingCandidatesRef.current = []
    setBusy(false)
    setCallStarted(false)
    setRemoteConnected(false)
    setMuted(false)
    setCameraEnabled(true)
    if (message) setCallStatus(message)
  }, [])

  useEffect(() => () => teardownCall(''), [teardownCall])

  useEffect(() => {
    if (!authToken) return undefined
    let cancelled = false
    const loadRtcConfiguration = async () => {
      try {
        const response = await fetch(`${apiBase}/api/teleconsults/rtc-config`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || cancelled) return
        if (Array.isArray(data?.iceServers) && data.iceServers.length) {
          setRtcConfiguration({
            iceServers: data.iceServers,
            ...(data?.iceTransportPolicy ? { iceTransportPolicy: data.iceTransportPolicy } : {}),
          })
        }
      } catch {
        // keep default STUN config as fallback
      }
    }
    loadRtcConfiguration()
    return () => {
      cancelled = true
    }
  }, [apiBase, authToken])

  useEffect(() => {
    if (localMediaRef.current) {
      localMediaRef.current.srcObject = localStreamRef.current || null
    }
  }, [callStarted, muted, cameraEnabled])

  useEffect(() => {
    if (remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = remoteStreamRef.current || null
    }
  }, [remoteConnected])

  const postCallEvent = useCallback(
    async (eventType, payload = null) => {
      const response = await fetch(`${apiBase}/api/teleconsults/${consult.id}/call-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId, eventType, payload }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update the live consult channel.')
      }
      return data.event
    },
    [apiBase, authToken, consult?.id, sessionId],
  )

  const ensurePeer = useCallback(async () => {
    if (peerRef.current) return peerRef.current
    const peer = new RTCPeerConnection(rtcConfiguration)
    const remoteStream = new MediaStream()
    remoteStreamRef.current = remoteStream
    if (remoteMediaRef.current) remoteMediaRef.current.srcObject = remoteStream
    peer.ontrack = (event) => {
      event.streams?.[0]?.getTracks?.().forEach((track) => remoteStream.addTrack(track))
      if (!event.streams?.[0] && event.track) {
        remoteStream.addTrack(event.track)
      }
      setRemoteConnected(true)
      setCallStatus(`${consultMode === 'video' ? 'Video' : 'Audio'} consult connected.`)
    }
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        postCallEvent('candidate', serializeIceCandidate(event.candidate)).catch((error) => {
          setCallStatus(error.message || 'Unable to send network details for the live consult.')
        })
      }
    }
    peer.onconnectionstatechange = () => {
      const state = String(peer.connectionState || '')
      if (state === 'connected') {
        setRemoteConnected(true)
        setCallStatus(`${consultMode === 'video' ? 'Video' : 'Audio'} consult connected.`)
      } else if (['failed', 'disconnected'].includes(state)) {
        setCallStatus(`The ${consultMode} connection was interrupted. Retry if needed.`)
      } else if (state === 'closed') {
        setCallStatus(`${consultMode === 'video' ? 'Video' : 'Audio'} consult ended.`)
      }
    }
    peerRef.current = peer
    return peer
  }, [consultMode, postCallEvent, rtcConfiguration])

  const flushPendingCandidates = useCallback(async () => {
    const peer = peerRef.current
    if (!peer?.remoteDescription) return
    const candidates = [...pendingCandidatesRef.current]
    pendingCandidatesRef.current = []
    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate)
      } catch {
        // ignore candidate race conditions
      }
    }
  }, [])

  const handleIncomingEvent = useCallback(
    async (event) => {
      if (!event || processedEventIdsRef.current.has(event.id)) return
      processedEventIdsRef.current.add(event.id)
      lastEventIdRef.current = Math.max(lastEventIdRef.current, Number(event.id) || 0)
      if (Number(event.senderUserId) === Number(currentUserId)) return
      if (String(event.sessionId || '') !== sessionId) return

      if (event.eventType === 'answer') {
        const peer = peerRef.current
        if (!peer) return
        await peer.setRemoteDescription(event.payload)
        await flushPendingCandidates()
        setCallStatus(`Connecting ${consultMode} consult...`)
        return
      }

      if (event.eventType === 'candidate') {
        const candidate = new RTCIceCandidate(event.payload)
        const peer = peerRef.current
        if (!peer?.remoteDescription) {
          pendingCandidatesRef.current.push(candidate)
          return
        }
        try {
          await peer.addIceCandidate(candidate)
        } catch {
          // ignore candidate race conditions
        }
        return
      }

      if (event.eventType === 'ended') {
        teardownCall(`The patient ended the ${consultMode} consult.`)
      }
    },
    [consultMode, currentUserId, flushPendingCandidates, sessionId, teardownCall],
  )

  useEffect(() => {
    if (!authToken || !consult?.id || !['audio', 'video'].includes(consultMode)) return undefined
    let cancelled = false
    const loadEvents = async () => {
      try {
        const response = await fetch(
          `${apiBase}/api/teleconsults/${consult.id}/call-events?afterId=${encodeURIComponent(lastEventIdRef.current)}`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        )
        const data = await response.json().catch(() => ({}))
        if (!response.ok || cancelled) return
        for (const event of data.events || []) {
          await handleIncomingEvent(event)
        }
      } catch {
        if (!cancelled) {
          setCallStatus((prev) => prev || `Live ${consultMode} updates were interrupted. Retry if needed.`)
        }
      }
    }
    loadEvents()
    const interval = window.setInterval(loadEvents, 1500)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [apiBase, authToken, consult?.id, consultMode, handleIncomingEvent])

  const beginConsultSession = useCallback(async () => {
    if (!roomUnlocked || busy) return
    setBusy(true)
    try {
      if (String(consult?.status || '').toLowerCase() === 'scheduled') {
        await updateRemoteConsultStatus?.('in_progress')
      }
      const localStream =
        localStreamRef.current ||
        (await requestUserMedia({
          audio: true,
          video: isVideo,
        }))
      localStreamRef.current = localStream
      if (localMediaRef.current) {
        localMediaRef.current.srcObject = localStream
      }
      const peer = await ensurePeer()
      if (!peer.getSenders().length) {
        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream))
      }
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await postCallEvent('offer', serializeSessionDescription(offer))
      setCallStarted(true)
      setCallStatus(`Calling patient over ${consultMode}...`)
    } catch (error) {
      setCallStatus(error?.message || `Unable to start ${consultMode} consult.`)
    } finally {
      setBusy(false)
    }
  }, [busy, consult, consultMode, ensurePeer, isVideo, postCallEvent, roomUnlocked, updateRemoteConsultStatus])

  const startConsult = async () => {
    if (!roomUnlocked || busy) return
    if (isVideo && !standaloneLiveMode) {
      openStandaloneLiveConsult?.(consult)
      setCallStatus('Video consult opened in a separate tab. Continue documenting here.')
      return
    }
    await beginConsultSession()
  }

  useEffect(() => {
    if (!standaloneLiveMode || !autoStartStandalone || !isVideo) return
    if (!roomUnlocked || callStarted || busy) return
    void beginConsultSession()
  }, [autoStartStandalone, beginConsultSession, busy, callStarted, isVideo, roomUnlocked, standaloneLiveMode])

  const endCall = async () => {
    try {
      if (callStarted) {
        await postCallEvent('ended')
      }
    } catch {
      // ignore end-call transport errors
    } finally {
      teardownCall(`${consultMode === 'video' ? 'Video' : 'Audio'} consult ended.`)
      if (standaloneLiveMode) {
        window.setTimeout(() => {
          try {
            window.close()
          } catch {
            // ignore close-window failures
          }
        }, 160)
      }
    }
  }

  const toggleMute = () => {
    const nextMuted = !muted
    localStreamRef.current?.getAudioTracks?.().forEach((track) => {
      track.enabled = !nextMuted
    })
    setMuted(nextMuted)
  }

  const toggleCamera = () => {
    const nextEnabled = !cameraEnabled
    localStreamRef.current?.getVideoTracks?.().forEach((track) => {
      track.enabled = nextEnabled
    })
    setCameraEnabled(nextEnabled)
  }

  if (isVideo && !standaloneLiveMode) {
    return (
      <div className="doctor-workspace-card doctor-media-panel doctor-media-launcher">
        <div className="section-head compact doctor-media-panel-head">
          <div>
            <p className="micro strong">Video consult</p>
            <p className="micro">Open the live consult in a separate window, then continue documenting here.</p>
          </div>
        </div>
        <p className="micro">{callStatus}</p>
        <div className="action-row doctor-console-actions doctor-media-actions">
          <button className="primary" type="button" onClick={startConsult} disabled={!roomUnlocked || busy}>
            {busy ? 'Preparing...' : 'Start video'}
          </button>
        </div>
        {!roomUnlocked ? <p className="micro">Acknowledge the teleconsult notice and keep the consult scheduled to unlock live video.</p> : null}
      </div>
    )
  }

  return (
    <div className="doctor-workspace-card doctor-media-panel">
      <div className="section-head compact doctor-media-panel-head">
        <div>
          <p className="micro strong">{consultMode === 'video' ? 'Video consult' : 'Audio consult'}</p>
          <p className="micro">Start the live consult here and continue documenting in the same console while the patient stays on screen.</p>
        </div>
      </div>
      <div className="doctor-media-meta">
        <div>
          <span className="mini-label">Patient phone</span>
          <strong>{consult?.phone || 'Phone number not added'}</strong>
        </div>
        <div>
          <span className="mini-label">Live channel</span>
          <strong>{callStarted ? 'Active' : 'Standby'}</strong>
        </div>
      </div>
      <p className="micro">{callStatus}</p>
      {!roomUnlocked ? <p className="micro">Acknowledge the teleconsult notice and keep the consult scheduled to unlock live {consultMode}.</p> : null}
      {isVideo ? (
        <div className="doctor-media-stage doctor-media-stage-video">
          <div className="history-card subtle doctor-media-patient-stage">
            <div className="doctor-media-tile-head">
              <p className="micro strong">Patient</p>
              <span className={`doctor-media-badge ${remoteConnected ? 'is-live' : ''}`}>
                {remoteConnected ? 'Live' : 'Waiting'}
              </span>
            </div>
            <video
              ref={remoteMediaRef}
              autoPlay
              playsInline
              className="doctor-media-video doctor-media-video-primary"
            />
            <div className="doctor-media-overlay">
              <div className="doctor-media-overlay-head">
                <p className="micro strong">Doctor</p>
                <span className="doctor-media-badge">You</span>
              </div>
              <video
                ref={localMediaRef}
                autoPlay
                muted
                playsInline
                className="doctor-media-video doctor-media-video-overlay"
              />
            </div>
            <p className="micro">
              {remoteConnected ? 'Patient connected.' : 'Once the patient joins, their live stream will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="doctor-media-stage">
          <div className="history-card subtle doctor-media-tile">
            <div className="doctor-media-tile-head">
              <p className="micro strong">Doctor</p>
              <span className="doctor-media-badge">You</span>
            </div>
            <audio ref={localMediaRef} autoPlay muted />
            {!callStarted ? <p className="micro">Your audio channel appears here as soon as you start.</p> : null}
          </div>
          <div className="history-card subtle doctor-media-tile">
            <div className="doctor-media-tile-head">
              <p className="micro strong">Patient</p>
              <span className={`doctor-media-badge ${remoteConnected ? 'is-live' : ''}`}>
                {remoteConnected ? 'Live' : 'Waiting'}
              </span>
            </div>
            <audio ref={remoteMediaRef} autoPlay playsInline controls={false} />
            <p className="micro" style={{ marginTop: 12 }}>
              {remoteConnected ? 'Patient connected.' : 'Once the patient joins, their live audio will appear here.'}
            </p>
          </div>
        </div>
      )}
      <div className="action-row doctor-console-actions doctor-media-actions">
        <button className="primary" type="button" onClick={startConsult} disabled={!roomUnlocked || busy}>
          {busy ? 'Preparing...' : `Start ${consultMode === 'video' ? 'video' : 'audio'}`}
        </button>
        <button className="secondary" type="button" onClick={toggleMute} disabled={!callStarted}>
          {muted ? 'Unmute' : 'Mute'}
        </button>
        {isVideo ? (
          <button className="ghost" type="button" onClick={toggleCamera} disabled={!callStarted}>
            {cameraEnabled ? 'Camera off' : 'Camera on'}
          </button>
        ) : null}
        <button className="ghost" type="button" onClick={endCall} disabled={busy || (!callStarted && !standaloneLiveMode)}>
          End call
        </button>
      </div>
    </div>
  )
}

export function DoctorConsoleWorkspace({
  consoleKind = 'general',
  doctorConsoleStatus,
  appointments,
  activeConsultAppointment,
  selectedConsultValue = '',
  activeEncounterDetail,
  activePatientHistory,
  activeHistoryEncounterDetail,
  activeHistoryEncounterId,
  openDoctorConsult,
  openHistoryEncounter,
  encounterForm,
  setEncounterForm,
  departmentConsoleForm = {},
  setDepartmentConsoleForm,
  saveDepartmentConsoleForm,
  saveEncounterSummary,
  noteDraft,
  setNoteDraft,
  signatureDraft,
  setSignatureDraft,
  noteAssistQuery,
  setNoteAssistQuery,
  noteAssistSuggestions,
  noteAssistStatus,
  noteAssistLoading,
  dismissedNoteAssistIds,
  loadNoteAssistSuggestions,
  applyNoteAssistSuggestion,
  applyAssistComplaintTemplate,
  applyAssistDiagnosisSuggestion,
  stageAssistOrderSuggestion,
  applyAssistPrescriptionTemplate,
  dismissNoteAssistSuggestion,
  noteRefineLoading,
  noteRefineStatus,
  refineDoctorNoteDraft,
  submitEncounterNote,
  prescriptionDraft,
  setPrescriptionDraft,
  addPrescriptionItem,
  removePrescriptionItem,
  updatePrescriptionItem,
  submitPrescription,
  copyPreviousPrescription,
  updateAppointmentStatus,
  orderDraft,
  setOrderDraft,
  submitEncounterOrder,
  recordPediatricImmunization,
  reportInsights,
  reportInsightsStatus,
  reportInsightsMonths,
  setReportInsightsMonths,
  downloadDoctorRecord,
  apiBase,
  authToken,
  currentUserId,
  isRemoteConsult = false,
  remoteConsultConsentSummary = null,
  acceptRemoteConsultConsent,
  remoteConsultMessages = [],
  remoteConsultMessageText = '',
  setRemoteConsultMessageText,
  sendRemoteConsultMessage,
  remoteConsultMessageStatus = '',
  updateRemoteConsultStatus,
  openStandaloneLiveConsult,
  forceActiveTab = '',
  standaloneLiveMode = false,
  autoStartStandalone = false,
}) {
  const [activeTab, setActiveTab] = useState(forceActiveTab || 'summary')
  const [reportViewMode, setReportViewMode] = useState('condition')
  const [collapsedReportPanels, setCollapsedReportPanels] = useState({})
  const [showPediatricTracker, setShowPediatricTracker] = useState(false)
  const [manualVaccineDraft, setManualVaccineDraft] = useState({
    code: '',
    vaccineName: '',
    doseLabel: '',
    administeredDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const consoleCopy = getConsoleCopy(consoleKind)
  const printLabel = consoleKind === 'surgery' ? 'Print case sheet' : consoleKind === 'pediatrics' ? 'Print visit summary' : 'Print consult summary'
  const currentAppointmentStatus = String(activeConsultAppointment?.status || '').toLowerCase()

  useEffect(() => {
    if (forceActiveTab) {
      setActiveTab(forceActiveTab)
    }
  }, [forceActiveTab])
  const doctorStatusActions =
    isRemoteConsult
      ? currentAppointmentStatus === 'requested'
        ? [
            { key: 'scheduled', label: 'Schedule' },
            { key: 'cancelled', label: 'Cancel' },
          ]
        : currentAppointmentStatus === 'scheduled'
          ? [
              { key: 'in_progress', label: 'Check in' },
              { key: 'cancelled', label: 'Cancel' },
              { key: 'no_show', label: 'No show' },
            ]
          : currentAppointmentStatus === 'in_progress'
            ? [
                { key: 'completed', label: 'Complete' },
                { key: 'cancelled', label: 'Cancel' },
                { key: 'no_show', label: 'No show' },
              ]
            : []
      : currentAppointmentStatus === 'requested'
      ? [
          { key: 'approved', label: 'Schedule' },
          { key: 'cancelled', label: 'Cancel' },
        ]
      : currentAppointmentStatus === 'approved'
        ? [
            { key: 'checked_in', label: 'Check in' },
            { key: 'cancelled', label: 'Cancel' },
            { key: 'no_show', label: 'No show' },
          ]
        : currentAppointmentStatus === 'checked_in'
          ? [
              { key: 'completed', label: 'Complete' },
              { key: 'cancelled', label: 'Cancel' },
              { key: 'no_show', label: 'No show' },
            ]
          : []

  const encounter = activeEncounterDetail?.encounter || null
  const notes = activeEncounterDetail?.notes || []
  const prescriptions = activeEncounterDetail?.prescriptions || []
  const orders = activeEncounterDetail?.orders || []
  const historySummary = activePatientHistory?.patient || null
  const priorHistory = activePatientHistory?.history || []
  const historyEncounter = activeHistoryEncounterDetail?.encounter || null
  const historyNotes = activeHistoryEncounterDetail?.notes || []
  const historyPrescriptions = activeHistoryEncounterDetail?.prescriptions || []
  const historyOrders = activeHistoryEncounterDetail?.orders || []
  const doctorConsentAccepted = Boolean(remoteConsultConsentSummary?.doctorAccepted)
  const remoteConsultMode = String(activeConsultAppointment?.mode || '').toLowerCase()
  const isAudioRemoteConsult = isRemoteConsult && remoteConsultMode === 'audio'
  const isVideoRemoteConsult = isRemoteConsult && remoteConsultMode === 'video'
  const isChatRemoteConsult = isRemoteConsult && remoteConsultMode === 'chat'
  const visibleNoteAssistSuggestions = (noteAssistSuggestions || []).filter(
    (item) => !dismissedNoteAssistIds?.includes(item.id),
  )
  const groupedReportPanels = useMemo(() => {
    const trendMap = new Map((reportInsights?.trends || []).map((trend) => [trend.metricKey, trend]))
    const summaryMap = new Map((reportInsights?.conditionSummaries || []).map((item) => [item.key, item]))
    return REPORT_GROUPS.map((group) => ({
      ...group,
      trends: group.metricKeys.map((metricKey) => trendMap.get(metricKey)).filter(Boolean),
      summary: summaryMap.get(group.key) || null,
    })).filter((group) => group.trends.length || group.summary)
  }, [reportInsights])
  const vitalsDisplay = getEncounterVitalsDisplay(encounter, encounterForm.vitalsText)
  const pediatricData = activePatientHistory?.pediatrics || null
  const selectedPediatricSchedule = String(departmentConsoleForm.immunizationSchedule || '').trim().toUpperCase()
  const selectedDueVaccines =
    selectedPediatricSchedule && pediatricData?.dueVaccinesBySchedule
      ? pediatricData.dueVaccinesBySchedule[selectedPediatricSchedule] || null
      : null
  const pediatricVaccineSuggestions = useMemo(() => {
    const suggestionMap = new Map()
    const appendSuggestion = (item = {}, source = '') => {
      const code = String(item.code || '').trim()
      const vaccineName = String(item.vaccineName || item.vaccine_name || '').trim()
      const doseLabel = String(item.doseLabel || item.dose_label || '').trim()
      if (!vaccineName || !doseLabel) return
      const key = `${code || vaccineName.toLowerCase()}::${doseLabel.toLowerCase()}`
      if (!suggestionMap.has(key)) {
        suggestionMap.set(key, {
          code: code || `${vaccineName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${doseLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
          vaccineName,
          doseLabel,
          source,
        })
      }
    }

    PEDIATRIC_VACCINE_CATALOG
      .filter(
        (item) =>
          !selectedPediatricSchedule ||
          item.schedule === 'Both' ||
          item.schedule === 'Private' ||
          item.schedule === selectedPediatricSchedule,
      )
      .forEach((item) => appendSuggestion(item, item.schedule))

    ;['UIP', 'IAP'].forEach((scheduleKey) => {
      const scheduleData = pediatricData?.dueVaccinesBySchedule?.[scheduleKey]
      ;[...(scheduleData?.overdue || []), ...(scheduleData?.dueToday || []), ...(scheduleData?.upcoming || [])].forEach((item) =>
        appendSuggestion(item, scheduleKey),
      )
    })

    ;(pediatricData?.immunizationRecords || []).forEach((item) => appendSuggestion(item, 'history'))

    const query = normalizeSearchValue(manualVaccineDraft.vaccineName)
    const queryInitials = toInitials(manualVaccineDraft.vaccineName)

    return Array.from(suggestionMap.values())
      .filter((item) => {
        if (!query) return true
        const haystacks = [
          normalizeSearchValue(item.vaccineName),
          normalizeSearchValue(item.doseLabel),
          normalizeSearchValue(item.code),
          toInitials(item.vaccineName),
        ]
        return haystacks.some((value) => value.includes(query) || (queryInitials && value.includes(queryInitials)))
      })
      .slice(0, 8)
  }, [manualVaccineDraft.vaccineName, pediatricData, selectedPediatricSchedule])
  const pediatricDateOfBirth = departmentConsoleForm.dateOfBirth || historySummary?.dateOfBirth || pediatricData?.dateOfBirth || ''
  const pediatricSex = normalizeGrowthSex(departmentConsoleForm.sex || historySummary?.sex || pediatricData?.referenceGenderKey)
  const pediatricHistory = useMemo(
    () => buildMeasurementHistory(pediatricData?.growthHistory || []),
    [pediatricData?.growthHistory],
  )
  const pediatricDraftMeasurement = useMemo(
    () => buildDraftMeasurement(departmentConsoleForm, pediatricDateOfBirth, activeConsultAppointment?.scheduled_at || new Date().toISOString()),
    [departmentConsoleForm, pediatricDateOfBirth, activeConsultAppointment?.scheduled_at],
  )
  const currentWeightAssessment =
    consoleKind === 'pediatrics' && pediatricSex && pediatricDraftMeasurement
      ? classifyGrowthMeasurement('weight', pediatricSex, pediatricDraftMeasurement.ageMonths, departmentConsoleForm.weightKg)
      : null
  const currentHeightAssessment =
    consoleKind === 'pediatrics' && pediatricSex && pediatricDraftMeasurement
      ? classifyGrowthMeasurement('height', pediatricSex, pediatricDraftMeasurement.ageMonths, departmentConsoleForm.heightCm)
      : null
  const currentHeadAssessment =
    consoleKind === 'pediatrics' && pediatricSex && pediatricDraftMeasurement
      ? classifyGrowthMeasurement('headCircumference', pediatricSex, pediatricDraftMeasurement.ageMonths, departmentConsoleForm.headCircumferenceCm)
      : null
  const currentBmiAssessment =
    consoleKind === 'pediatrics' && pediatricSex && pediatricDraftMeasurement
      ? classifyGrowthMeasurement('bmi', pediatricSex, pediatricDraftMeasurement.ageMonths, pediatricDraftMeasurement.bmi)
      : null
  const weightChartSeries =
    consoleKind === 'pediatrics' && pediatricSex
      ? buildChartSeries('weight', pediatricSex, pediatricHistory, pediatricDraftMeasurement)
      : null
  const heightChartSeries =
    consoleKind === 'pediatrics' && pediatricSex
      ? buildChartSeries('height', pediatricSex, pediatricHistory, pediatricDraftMeasurement)
      : null
  const headChartSeries =
    consoleKind === 'pediatrics' && pediatricSex
      ? buildChartSeries('headCircumference', pediatricSex, pediatricHistory, pediatricDraftMeasurement)
      : null
  const bmiChartSeries =
    consoleKind === 'pediatrics' && pediatricSex
      ? buildChartSeries('bmi', pediatricSex, pediatricHistory, pediatricDraftMeasurement)
      : null
  const pediatricAgeMonths = pediatricDraftMeasurement?.ageMonths ?? null
  const under5ComparisonReady =
    consoleKind === 'pediatrics' &&
    Boolean(pediatricSex) &&
    pediatricAgeMonths !== null &&
    pediatricAgeMonths <= WHO_UNDER5_MAX_MONTHS
  const bmiComparisonReady =
    consoleKind === 'pediatrics' &&
    Boolean(pediatricSex) &&
    pediatricAgeMonths !== null &&
    pediatricAgeMonths >= WHO_BMI_MIN_MONTHS &&
    pediatricAgeMonths <= WHO_OLDER_CHILD_MAX_MONTHS
  const pediatricPlotReady =
    consoleKind === 'pediatrics' &&
    Boolean(pediatricSex) &&
    pediatricAgeMonths !== null
  const headCircumferenceEmphasis =
    pediatricAgeMonths !== null && pediatricAgeMonths <= WHO_HEAD_CIRCUMFERENCE_EMPHASIS_MAX_MONTHS
  const pediatricMilestoneAssessments = useMemo(
    () =>
      WHO_GROSS_MOTOR_MILESTONES.map((milestone) => {
        const fieldMeta = PEDIATRIC_MILESTONE_FIELDS.find((item) => item.key === milestone.key)
        return {
          ...milestone,
          ...fieldMeta,
          assessment: assessDevelopmentMilestone({
            milestone,
            status: fieldMeta ? departmentConsoleForm[fieldMeta.statusField] : '',
            achievedDate: fieldMeta ? departmentConsoleForm[fieldMeta.dateField] : '',
            dateOfBirth: pediatricDateOfBirth,
            referenceDate: activeConsultAppointment?.scheduled_at || new Date().toISOString(),
          }),
        }
      }),
    [departmentConsoleForm, pediatricDateOfBirth, activeConsultAppointment?.scheduled_at],
  )
  const doctorTabConfig = [
    ...(isAudioRemoteConsult ? [{ key: 'audio', label: 'Audio', count: 1 }] : []),
    ...(isVideoRemoteConsult ? [{ key: 'video', label: 'Video', count: 1 }] : []),
    ...(isRemoteConsult ? [{ key: 'chat', label: 'Chat', count: remoteConsultMessages.length || 0 }] : []),
    { key: 'summary', label: 'Summary', count: encounter ? 1 : 0 },
    ...(consoleKind === 'pediatrics'
      ? [
          { key: 'pathway', label: 'Pediatric pathway', count: pediatricHistory.length || (departmentConsoleForm.weightKg || departmentConsoleForm.heightCm ? 1 : 0) },
          { key: 'vaccination', label: 'Vaccination', count: (selectedDueVaccines?.overdue || []).length + (selectedDueVaccines?.dueToday || []).length + (pediatricData?.recordedImmunizations?.length || 0) },
        ]
      : consoleKind === 'surgery'
        ? [
            { key: 'pathway', label: 'Surgical pathway', count: Object.values(departmentConsoleForm || {}).some((value) => String(value || '').trim()) ? 1 : 0 },
          ]
        : consoleKind === 'general'
          ? [{ key: 'pathway', label: 'Clinical pathway', count: Object.values(departmentConsoleForm || {}).some((value) => String(value || '').trim()) ? 1 : 0 }]
          : []),
    { key: 'notes', label: 'Notes', count: notes.length || (noteDraft ? 1 : 0) },
    { key: 'prescription', label: 'Prescription', count: prescriptions.length || (prescriptionDraft?.items || []).filter((item) => Object.values(item || {}).some(Boolean)).length },
    { key: 'orders', label: 'Orders', count: orders.length },
    { key: 'reportInsights', label: 'Report insights', count: reportInsights?.trends?.length || 0 },
  ]
  useEffect(() => {
    if (!isRemoteConsult && ['chat', 'audio', 'video'].includes(activeTab)) {
      setActiveTab('summary')
    }
  }, [isRemoteConsult, activeTab])

  useEffect(() => {
    if (!isAudioRemoteConsult && activeTab === 'audio') {
      setActiveTab(isRemoteConsult ? 'chat' : 'summary')
    }
    if (!isVideoRemoteConsult && activeTab === 'video') {
      setActiveTab(isRemoteConsult ? 'chat' : 'summary')
    }
  }, [isAudioRemoteConsult, isVideoRemoteConsult, isRemoteConsult, activeTab])

  useEffect(() => {
    if (!standaloneLiveMode || !activeConsultAppointment) return undefined
    const previousTitle = document.title
    document.title = `${activeConsultAppointment.patient_name || 'Patient'} ${String(activeConsultAppointment.mode || 'video').toUpperCase()} consult`
    return () => {
      document.title = previousTitle
    }
  }, [activeConsultAppointment, standaloneLiveMode])
  const clearManualVaccineDraft = () =>
    setManualVaccineDraft({
      code: '',
      vaccineName: '',
      doseLabel: '',
      administeredDate: new Date().toISOString().slice(0, 10),
      notes: '',
    })

  const applyManualVaccineSuggestion = (suggestion) => {
    setManualVaccineDraft((prev) => ({
      ...prev,
      code: suggestion.code || prev.code,
      vaccineName: suggestion.vaccineName || prev.vaccineName,
      doseLabel: suggestion.doseLabel || prev.doseLabel,
    }))
  }

  const renderDepartmentHistoryHighlights = (item, variant = 'compact') => {
    const form = item?.departmentForm?.form || {}
    if (consoleKind === 'surgery') {
      const surgeryBits = [
        form.procedurePlanned ? `Procedure: ${form.procedurePlanned}` : '',
        form.consentStatus ? `Consent: ${form.consentStatus}` : '',
        form.postOpNotes ? `Post-op: ${form.postOpNotes}` : '',
      ].filter(Boolean)
      if (!surgeryBits.length) return null
      return variant === 'compact'
        ? <p className="micro">{surgeryBits.slice(0, 2).join(' • ')}</p>
        : (
            <div className="doctor-history-expanded-section">
              <span className="mini-label">Surgical highlights</span>
              {surgeryBits.map((bit, index) => <p key={`surgery-highlight-${index}`} className="micro">{bit}</p>)}
            </div>
          )
    }
    if (consoleKind === 'pediatrics') {
      const pediatricBits = [
        form.sex ? `Sex: ${form.sex}` : '',
        form.guardianName ? `Guardian: ${form.guardianName}` : '',
        form.weightKg || form.heightCm
          ? `Growth: ${[form.weightKg ? `${form.weightKg} kg` : '', form.heightCm ? `${form.heightCm} cm` : ''].filter(Boolean).join(' • ')}`
          : '',
        form.weightKg && form.heightCm
          ? `BMI: ${(Number(form.weightKg) / ((Number(form.heightCm) / 100) * (Number(form.heightCm) / 100))).toFixed(2)}`
          : '',
        form.headCircumferenceCm ? `HC: ${form.headCircumferenceCm} cm` : '',
        form.immunizationContext ? `Immunization: ${form.immunizationContext}` : '',
        form.developmentNotes ? `Development: ${form.developmentNotes}` : '',
      ].filter(Boolean)
      if (!pediatricBits.length) return null
      return variant === 'compact'
        ? <p className="micro">{pediatricBits.slice(0, 2).join(' • ')}</p>
        : (
            <div className="doctor-history-expanded-section">
              <span className="mini-label">Pediatric highlights</span>
              {pediatricBits.map((bit, index) => <p key={`pediatric-highlight-${index}`} className="micro">{bit}</p>)}
            </div>
          )
    }
    return null
  }

  const consultOptions = useMemo(
    () =>
      appointments
        .filter((appointment) => String(appointment?.status || '').toLowerCase() !== 'cancelled')
        .map((appointment) => ({
        id: appointment.worklistKey || String(appointment.id),
        label: formatConsultLabel(appointment),
        })),
    [appointments],
  )

  const worklistSummary = useMemo(() => buildWorklistSectionSummary(appointments), [appointments])

  const printCurrentConsult = () => {
    if (!activeConsultAppointment || !encounter) return
    const popup = window.open('', '_blank', 'width=980,height=760')
    if (!popup) return
    const departmentRows =
      consoleKind === 'surgery'
        ? [
            ['Procedure planned', departmentConsoleForm.procedurePlanned],
            ['Indication', departmentConsoleForm.indication],
            ['Consent status', departmentConsoleForm.consentStatus],
            ['Pre-op notes', departmentConsoleForm.preOpNotes],
            ['Post-op notes', departmentConsoleForm.postOpNotes],
            ['Follow-up review', departmentConsoleForm.followUpReview],
          ]
        : consoleKind === 'pediatrics'
          ? [
              ['Child DOB', departmentConsoleForm.dateOfBirth],
              ['Child sex', departmentConsoleForm.sex],
              ['Guardian', departmentConsoleForm.guardianName],
              [
                'Growth',
                [departmentConsoleForm.weightKg ? `${departmentConsoleForm.weightKg} kg` : '', departmentConsoleForm.heightCm ? `${departmentConsoleForm.heightCm} cm` : '']
                  .filter(Boolean)
                  .join(' • '),
              ],
              ['BMI', pediatricDraftMeasurement?.bmi ? `${pediatricDraftMeasurement.bmi}` : ''],
              ['Head circumference', departmentConsoleForm.headCircumferenceCm ? `${departmentConsoleForm.headCircumferenceCm} cm` : ''],
              ['Growth notes', departmentConsoleForm.growthNotes],
              ['Immunization context', departmentConsoleForm.immunizationContext],
              ['Pediatric dosing context', departmentConsoleForm.pediatricDoseNotes],
              [
                'Development milestones',
                pediatricMilestoneAssessments
                  .filter((item) => String(departmentConsoleForm[item.statusField] || '').trim())
                  .map((item) => `${item.label}: ${departmentConsoleForm[item.statusField] === 'achieved' ? 'Achieved' : departmentConsoleForm[item.statusField] === 'concern' ? 'Concern' : 'Observed'}`)
                  .join(' • '),
              ],
              ['Development notes', departmentConsoleForm.developmentNotes],
              ['Follow-up notes', departmentConsoleForm.followUpPediatricNotes],
            ]
          : []
    const departmentHtml = departmentRows
      .filter(([, value]) => String(value || '').trim())
      .map(
        ([label, value]) => `
          <div class="line">
            <span class="label">${escapeHtml(label)}</span>
            <span>${escapeHtml(value)}</span>
          </div>
        `,
      )
      .join('')
    const noteHtml = notes.length
      ? notes
          .map(
            (item) => `
              <div class="item">
                <div class="subtle">${escapeHtml(formatPrintableDate(item.created_at))} • ${escapeHtml(item.signature_text || 'Unsigned')}</div>
                <div>${escapeHtml(item.note_text)}</div>
              </div>
            `,
          )
          .join('')
      : '<div class="item">No notes added.</div>'
    const prescriptionHtml = prescriptions.length
      ? prescriptions
          .map(
            (rx) => `
              <div class="item">
                <div><strong>${escapeHtml(rx.instructions || 'Prescription')}</strong></div>
                ${(rx.items || [])
                  .map((entry) => `<div class="subtle">${escapeHtml([entry.medicine, entry.dose, entry.frequency, entry.duration].filter(Boolean).join(' • '))}</div>`)
                  .join('')}
              </div>
            `,
          )
          .join('')
      : '<div class="item">No prescriptions added.</div>'
    const ordersHtml = orders.length
      ? orders
          .map(
            (item) => `
              <div class="item">
                <div><strong>${escapeHtml(item.item_name || '-')}</strong></div>
                <div class="subtle">${escapeHtml([item.order_type, item.destination, item.status].filter(Boolean).join(' • '))}</div>
                ${item.notes ? `<div>${escapeHtml(item.notes)}</div>` : ''}
              </div>
            `,
          )
          .join('')
      : '<div class="item">No orders created.</div>'
    const pediatricMilestoneRows = pediatricMilestoneAssessments
      .filter((item) => String(departmentConsoleForm[item.statusField] || '').trim())
      .map(
        (item) => `
          <div class="item">
            <div><strong>${escapeHtml(item.label)}</strong></div>
            <div class="subtle">${escapeHtml(String(departmentConsoleForm[item.statusField] || '').trim())}${departmentConsoleForm[item.dateField] ? ` • ${escapeHtml(departmentConsoleForm[item.dateField])}` : ''}</div>
            <div>${escapeHtml(item.assessment.label)}</div>
          </div>
        `,
      )
      .join('')
    const pediatricVaccineRows = [
      ...((selectedDueVaccines?.overdue || []).map((item) => ({ ...item, group: 'Overdue' }))),
      ...((selectedDueVaccines?.dueToday || []).map((item) => ({ ...item, group: 'Due today' }))),
      ...((selectedDueVaccines?.upcoming || []).slice(0, 6).map((item) => ({ ...item, group: 'Upcoming' }))),
    ]
      .map(
        (item) => `
          <div class="item">
            <div><strong>${escapeHtml(item.vaccineName)}</strong></div>
            <div class="subtle">${escapeHtml(item.group)} • ${escapeHtml(item.doseLabel || '')} • ${escapeHtml(item.dueDate || '-')}</div>
          </div>
        `,
      )
      .join('')
    const pediatricGrowthHighlights = [
      ['Weight-for-age', currentWeightAssessment?.band || 'Not interpretable yet'],
      ['Height-for-age', currentHeightAssessment?.band || 'Not interpretable yet'],
      ['BMI-for-age', currentBmiAssessment?.band || 'Not interpretable yet'],
      ['Head circumference', currentHeadAssessment?.band || 'Not interpretable yet'],
    ]
      .map(
        ([label, value]) => `
          <div class="line">
            <span class="label">${escapeHtml(label)}</span>
            <span>${escapeHtml(value)}</span>
          </div>
        `,
      )
      .join('')
    const pediatricPrintHtml =
      consoleKind === 'pediatrics'
        ? `
          <div class="section">
            <h3>Growth summary</h3>
            ${pediatricGrowthHighlights}
            <div class="line"><span class="label">BMI</span><span>${escapeHtml(pediatricDraftMeasurement?.bmi || '-')}</span></div>
            <div class="line"><span class="label">Head circumference emphasis</span><span>${escapeHtml(headCircumferenceEmphasis ? 'Infant / toddler interpretation active' : 'Trend only; strongest in 0–24 months')}</span></div>
          </div>
          <div class="section">
            <h3>Vaccination timeline${selectedPediatricSchedule ? ` (${escapeHtml(selectedPediatricSchedule)})` : ''}</h3>
            ${pediatricVaccineRows || '<div class="item">No due or upcoming UIP vaccines in the current pediatric record.</div>'}
          </div>
          <div class="section">
            <h3>Development milestones</h3>
            ${pediatricMilestoneRows || '<div class="item">No milestones recorded in this consult yet.</div>'}
          </div>
        `
        : ''
    popup.document.write(`
      <html>
        <head>
          <title>${escapeHtml(printLabel)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #203040; }
            h1,h2,h3 { margin: 0 0 10px; }
            .section { border: 1px solid #dbe3ec; border-radius: 16px; padding: 18px; margin-top: 18px; }
            .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
            .line { display: grid; grid-template-columns: 180px 1fr; gap: 12px; margin: 6px 0; }
            .label, .subtle { color: #5f6f81; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            .item { border-top: 1px solid #e4ebf2; padding-top: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(printLabel)}</h1>
          <div class="section">
            <h2>${escapeHtml(activeConsultAppointment.patient_name || 'Patient')}</h2>
            <div class="grid">
              <div><div class="label">Department</div><div>${escapeHtml(activeConsultAppointment.department_name || activeConsultAppointment.department || '-')}</div></div>
              <div><div class="label">Visit time</div><div>${escapeHtml(formatPrintableDate(activeConsultAppointment.scheduled_at))}</div></div>
              <div><div class="label">Encounter</div><div>#${escapeHtml(encounter.id)}</div></div>
            </div>
            <div class="line"><span class="label">Reason</span><span>${escapeHtml(activeConsultAppointment.reason || '-')}</span></div>
            <div class="line"><span class="label">Diagnosis</span><span>${escapeHtml(encounter.diagnosis_text || encounter.diagnosis_code || '-')}</span></div>
            <div class="line"><span class="label">Plan</span><span>${escapeHtml(encounter.plan_text || '-')}</span></div>
            <div class="line"><span class="label">Vitals</span><span>${escapeHtml(vitalsDisplay)}</span></div>
            ${departmentHtml}
          </div>
          <div class="section"><h3>Doctor notes</h3>${noteHtml}</div>
          <div class="section"><h3>Prescription</h3>${prescriptionHtml}</div>
          <div class="section"><h3>Orders</h3>${ordersHtml}</div>
          ${pediatricPrintHtml}
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const saveManualPediatricImmunization = () => {
    if (!manualVaccineDraft.vaccineName || !manualVaccineDraft.doseLabel) return
    recordPediatricImmunization({
      code: manualVaccineDraft.code || manualVaccineDraft.vaccineName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      vaccineName: manualVaccineDraft.vaccineName,
      doseLabel: manualVaccineDraft.doseLabel,
      administeredDate: manualVaccineDraft.administeredDate,
      notes: manualVaccineDraft.notes,
      source: 'console_manual',
    })
    clearManualVaccineDraft()
  }

  if (standaloneLiveMode && activeConsultAppointment && (isAudioRemoteConsult || isVideoRemoteConsult)) {
    return (
      <section className="doctor-live-window">
        <div className="doctor-live-window-header">
          <div>
            <p className="eyebrow">{isVideoRemoteConsult ? 'Live video consult' : 'Live audio consult'}</p>
            <h2>{activeConsultAppointment.patient_name || 'Patient'}</h2>
            <p className="doctor-live-window-subtitle">
              {activeConsultAppointment.department_name || activeConsultAppointment.department || '-'} •{' '}
              {new Date(activeConsultAppointment.scheduled_at).toLocaleString()}
            </p>
          </div>
          <div className="doctor-live-window-actions">
            <span className={`status-pill ${String(activeConsultAppointment.status || '').replace(/\s+/g, '_')}`}>
              {formatStatus(activeConsultAppointment.status)}
            </span>
            <button className="secondary" type="button" onClick={() => window.close()}>
              Close window
            </button>
          </div>
        </div>

        {!doctorConsentAccepted ? (
          <div className="doctor-console-banner subtle doctor-live-window-banner">
            Acknowledge the teleconsult notice before starting the live consult.
            <div className="action-row">
              <button className="secondary" type="button" onClick={acceptRemoteConsultConsent}>
                Acknowledge teleconsult
              </button>
            </div>
          </div>
        ) : null}

        <DoctorMediaConsultPanel
          consult={activeConsultAppointment}
          apiBase={apiBase}
          authToken={authToken}
          currentUserId={currentUserId}
          doctorConsentAccepted={doctorConsentAccepted}
          updateRemoteConsultStatus={updateRemoteConsultStatus}
          openStandaloneLiveConsult={openStandaloneLiveConsult}
          standaloneLiveMode={standaloneLiveMode}
          autoStartStandalone={autoStartStandalone}
        />
      </section>
    )
  }

  return (
    <section className="doctor-console-shell-wide">
      <div className="panel doctor-console-surface">
        <div className="doctor-console-header">
          <div>
            <p className="eyebrow">{consoleCopy.eyebrow}</p>
            <h2>{activeConsultAppointment ? (activeConsultAppointment.patient_name || 'Patient') : 'Clinical charting workspace'}</h2>
            <p className="panel-sub">
              {activeConsultAppointment
                ? `${activeConsultAppointment.department_name || activeConsultAppointment.department || '-'} • ${activeConsultAppointment.reason || 'General consult'}`
                : consoleCopy.subtitle}
            </p>
          </div>
          <div className="doctor-worklist-box">
            <span className="micro strong">{consoleCopy.worklistLabel}</span>
            <div className="doctor-worklist-summary">
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Waiting</span>
                <strong className="doctor-worklist-chip-value">{worklistSummary.waiting}</strong>
              </span>
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Today</span>
                <strong className="doctor-worklist-chip-value">{worklistSummary.today}</strong>
              </span>
              <span className="doctor-worklist-chip">
                <span className="doctor-worklist-chip-label">Future</span>
                <strong className="doctor-worklist-chip-value">{worklistSummary.future}</strong>
              </span>
            </div>
            <select value={selectedConsultValue} onChange={(event) => openDoctorConsult(event.target.value)}>
              <option value="">Select consult</option>
              {consultOptions.map((option) => (
                <option key={`doctor-consult-option-${option.id}`} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {doctorConsoleStatus ? <div className="doctor-console-banner">{doctorConsoleStatus}</div> : null}

        {activeConsultAppointment ? (
          <>
            <div className="doctor-consult-strip">
              <div className="doctor-consult-metadata">
                <div className="doctor-consult-title-row">
                  <h3>{activeConsultAppointment.patient_name || 'Patient'}</h3>
                  <span className={`status-pill ${String(activeConsultAppointment.status || '').replace(/\s+/g, '_')}`}>
                    {formatStatus(activeConsultAppointment.status)}
                  </span>
                </div>
                <p className="doctor-consult-subtitle">
                  {activeConsultAppointment.department_name || activeConsultAppointment.department || '-'} • {activeConsultAppointment.reason || 'General consult'}{isRemoteConsult ? ` • ${String(activeConsultAppointment.mode || 'chat').toUpperCase()} remote consult` : ''}
                </p>
                <div className="doctor-consult-quick-notes">
                  <span className="doctor-consult-pill">{notes.length} note{notes.length === 1 ? '' : 's'}</span>
                  <span className="doctor-consult-pill">{prescriptions.length} prescription{prescriptions.length === 1 ? '' : 's'}</span>
                  <span className="doctor-consult-pill">{orders.length} order{orders.length === 1 ? '' : 's'}</span>
                  {historySummary?.abhaNumber || historySummary?.abhaAddress ? (
                    <span className="doctor-consult-pill emphasis">ABHA linked</span>
                  ) : null}
                </div>
              </div>
              <div className="doctor-consult-facts">
                <div className="doctor-fact-chip">
                  <span className="mini-label">Consult</span>
                  <strong>#{activeConsultAppointment.id}</strong>
                </div>
                <div className="doctor-fact-chip">
                  <span className="mini-label">Time</span>
                  <strong>{new Date(activeConsultAppointment.scheduled_at).toLocaleString()}</strong>
                </div>
                <div className="doctor-fact-chip">
                  <span className="mini-label">History</span>
                  <strong>{priorHistory.length} visits</strong>
                </div>
              </div>
            </div>

            {doctorStatusActions.length > 0 ? (
              <div className="action-row doctor-console-actions" style={{ marginTop: 12 }}>
                {doctorStatusActions.map((action) => (
                  <button
                    key={`doctor-status-action-${action.key}`}
                    className={action.key === 'cancelled' || action.key === 'no_show' ? 'secondary' : 'primary'}
                    type="button"
                    onClick={() => {
                      if (isRemoteConsult) {
                        updateRemoteConsultStatus?.(action.key)
                        return
                      }
                      updateAppointmentStatus(activeConsultAppointment.id, action.key)
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="doctor-console-tabs doctor-console-tabs-wide">
              {doctorTabConfig.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`doctor-console-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  {tab.count ? <span className="doctor-console-tab-count">{tab.count}</span> : null}
                </button>
              ))}
            </div>

            {activeTab === 'audio' && isAudioRemoteConsult ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                {!doctorConsentAccepted ? (
                  <div className="doctor-console-banner subtle">
                    Acknowledge the remote consult notice before starting audio.
                    <div className="action-row">
                      <button className="secondary" type="button" onClick={acceptRemoteConsultConsent}>
                        Acknowledge teleconsult
                      </button>
                    </div>
                  </div>
                ) : null}
                  <DoctorMediaConsultPanel
                    consult={activeConsultAppointment}
                    apiBase={apiBase}
                    authToken={authToken}
                    currentUserId={currentUserId}
                    doctorConsentAccepted={doctorConsentAccepted}
                    updateRemoteConsultStatus={updateRemoteConsultStatus}
                    openStandaloneLiveConsult={openStandaloneLiveConsult}
                    standaloneLiveMode={standaloneLiveMode}
                    autoStartStandalone={autoStartStandalone}
                  />
              </div>
            ) : null}

            {activeTab === 'video' && isVideoRemoteConsult ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                {!doctorConsentAccepted ? (
                  <div className="doctor-console-banner subtle">
                    Acknowledge the remote consult notice before starting video.
                    <div className="action-row">
                      <button className="secondary" type="button" onClick={acceptRemoteConsultConsent}>
                        Acknowledge teleconsult
                      </button>
                    </div>
                  </div>
                ) : null}
                  <DoctorMediaConsultPanel
                    consult={activeConsultAppointment}
                    apiBase={apiBase}
                    authToken={authToken}
                    currentUserId={currentUserId}
                    doctorConsentAccepted={doctorConsentAccepted}
                    updateRemoteConsultStatus={updateRemoteConsultStatus}
                    openStandaloneLiveConsult={openStandaloneLiveConsult}
                    standaloneLiveMode={standaloneLiveMode}
                    autoStartStandalone={autoStartStandalone}
                  />
              </div>
            ) : null}

            {activeTab === 'chat' && isRemoteConsult ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-workspace-card remote-console-chat-card">
                  <div className="section-head compact">
                    <div>
                      <p className="micro strong">Consult chat</p>
                      <p className="micro">
                        {isAudioRemoteConsult
                          ? 'Use chat as the backup thread for the audio consult, then continue into summary, notes, prescription, and orders in the same console.'
                          : 'Use chat as the live remote consult thread, then continue into summary, notes, prescription, and orders in the same console.'}
                      </p>
                    </div>
                  </div>
                  {!doctorConsentAccepted ? (
                    <div className="doctor-console-banner subtle">
                      Acknowledge the remote consult notice before using chat or documenting care.
                      <div className="action-row">
                        <button className="secondary" type="button" onClick={acceptRemoteConsultConsent}>
                          Acknowledge teleconsult
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="consult-thread">
                    {remoteConsultMessages.length === 0 ? (
                      <p className="micro">No chat messages yet.</p>
                    ) : (
                      remoteConsultMessages.map((msg) => (
                        <div
                          key={`doctor-console-remote-message-${msg.id}`}
                          className={`chat-msg ${msg.senderRole === 'doctor' ? 'user' : 'bot'}`}
                        >
                          <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                          <p>{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form className="chat-form" onSubmit={sendRemoteConsultMessage}>
                    <input
                      type="text"
                      value={remoteConsultMessageText}
                      placeholder="Type a message to the patient..."
                      disabled={!doctorConsentAccepted}
                      onChange={(event) => setRemoteConsultMessageText(event.target.value)}
                    />
                    <button className="primary" type="submit" disabled={!doctorConsentAccepted}>Send</button>
                  </form>
                  {remoteConsultMessageStatus ? <p className="micro">{remoteConsultMessageStatus}</p> : null}
                </div>
              </div>
            ) : null}

            {activeTab === 'summary' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-summary-layout">
                  <div className="doctor-workspace-card doctor-summary-main">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Encounter summary</p>
                        <p className="micro">Capture the core clinical outcome for this visit.</p>
                      </div>
                    </div>
                    <div className="doctor-form-grid doctor-form-grid-four doctor-summary-row">
                      <label>
                        Chief complaint
                        <input
                          type="text"
                          value={encounterForm.chiefComplaint}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))}
                        />
                      </label>
                      <label>
                        Diagnosis code
                        <input
                          type="text"
                          value={encounterForm.diagnosisCode}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, diagnosisCode: event.target.value }))}
                        />
                      </label>
                      <label>
                        Follow-up date
                        <input
                          type="date"
                          value={encounterForm.followupDate}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, followupDate: event.target.value }))}
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={encounterForm.status}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, status: event.target.value }))}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>
                    </div>
                    <div className="doctor-form-grid doctor-form-grid-two doctor-summary-row">
                      <label>
                        Vitals
                        <input
                          type="text"
                          value={encounterForm.vitalsText}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, vitalsText: event.target.value }))}
                          placeholder="BP 120/70, Temp 98.4, Pulse 78"
                        />
                      </label>
                      <label>
                        Diagnosis
                        <input
                          type="text"
                          value={encounterForm.diagnosisText}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, diagnosisText: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="doctor-summary-textareas">
                      <label>
                        Findings
                        <textarea
                          rows={10}
                          value={encounterForm.findings}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, findings: event.target.value }))}
                        />
                      </label>
                      <label>
                        Plan
                        <textarea
                          rows={10}
                          value={encounterForm.planText}
                          onChange={(event) => setEncounterForm((prev) => ({ ...prev, planText: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="action-row doctor-console-actions">
                      <button className="primary" type="button" onClick={saveEncounterSummary}>Save summary</button>
                      <button className="ghost" type="button" onClick={printCurrentConsult}>{printLabel}</button>
                    </div>

                    {consoleKind === 'surgery' ? (
                      <div className="doctor-workspace-card doctor-department-card">
                        <div className="section-head compact">
                          <div>
                            <p className="micro strong">{consoleCopy.detailTitle}</p>
                            <p className="micro">Procedure planning, pre-op, post-op, and follow-up review for surgical visits.</p>
                          </div>
                        </div>
                        <div className="doctor-form-grid doctor-form-grid-three">
                          <label>
                            Procedure planned
                            <input
                              type="text"
                              value={departmentConsoleForm.procedurePlanned || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, procedurePlanned: event.target.value }))}
                            />
                          </label>
                          <label>
                            Indication
                            <input
                              type="text"
                              value={departmentConsoleForm.indication || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, indication: event.target.value }))}
                            />
                          </label>
                          <label>
                            Consent status
                            <select
                              value={departmentConsoleForm.consentStatus || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, consentStatus: event.target.value }))}
                            >
                              <option value="">Select</option>
                              <option value="pending">Pending</option>
                              <option value="taken">Taken</option>
                              <option value="declined">Declined</option>
                            </select>
                          </label>
                        </div>
                        <div className="doctor-summary-textareas">
                          <label>
                            Pre-op notes
                            <textarea
                              rows={7}
                              value={departmentConsoleForm.preOpNotes || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, preOpNotes: event.target.value }))}
                            />
                          </label>
                          <label>
                            Post-op notes
                            <textarea
                              rows={7}
                              value={departmentConsoleForm.postOpNotes || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, postOpNotes: event.target.value }))}
                            />
                          </label>
                        </div>
                        <label>
                          Surgical follow-up review
                          <textarea
                            rows={5}
                            value={departmentConsoleForm.followUpReview || ''}
                            onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, followUpReview: event.target.value }))}
                          />
                        </label>
                        <div className="action-row doctor-console-actions">
                          <button className="primary" type="button" onClick={saveDepartmentConsoleForm}>Save surgery details</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <aside className="doctor-workspace-card doctor-summary-side">
                    <p className="micro strong">Consult snapshot</p>
                    <div className="doctor-summary-side-list">
                      <div>
                        <span className="mini-label">Patient</span>
                        <strong>{activeConsultAppointment.patient_name || 'Patient'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">Department</span>
                        <strong>{activeConsultAppointment.department_name || activeConsultAppointment.department || '-'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">{consoleCopy.consultReasonLabel}</span>
                        <strong>{activeConsultAppointment.reason || '-'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">Encounter status</span>
                        <strong>{encounter?.status || 'open'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">ABHA status</span>
                        <strong>{String(historySummary?.abhaStatus || 'not_linked').replace(/_/g, ' ')}</strong>
                      </div>
                      <div>
                        <span className="mini-label">ABHA no.</span>
                        <strong>{historySummary?.abhaNumber || '-'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">ABHA address</span>
                        <strong>{historySummary?.abhaAddress || '-'}</strong>
                      </div>
                      {consoleKind === 'surgery' ? (
                        <>
                          <div>
                            <span className="mini-label">Procedure planned</span>
                            <strong>{departmentConsoleForm.procedurePlanned || '-'}</strong>
                          </div>
                          <div>
                            <span className="mini-label">Consent</span>
                            <strong>{departmentConsoleForm.consentStatus || '-'}</strong>
                          </div>
                        </>
                      ) : null}
                      {consoleKind === 'pediatrics' ? (
                        <>
                          <div>
                            <span className="mini-label">Child DOB</span>
                            <strong>{pediatricDateOfBirth || '-'}</strong>
                          </div>
                          <div>
                            <span className="mini-label">Child sex</span>
                            <strong>{departmentConsoleForm.sex || historySummary?.sex || '-'}</strong>
                          </div>
                          <div>
                            <span className="mini-label">Guardian</span>
                            <strong>{departmentConsoleForm.guardianName || '-'}</strong>
                          </div>
                          <div>
                            <span className="mini-label">Weight / Height</span>
                            <strong>
                              {[departmentConsoleForm.weightKg ? `${departmentConsoleForm.weightKg} kg` : '', departmentConsoleForm.heightCm ? `${departmentConsoleForm.heightCm} cm` : '']
                                .filter(Boolean)
                                .join(' • ') || '-'}
                            </strong>
                          </div>
                          <div>
                            <span className="mini-label">BMI</span>
                            <strong>{pediatricDraftMeasurement?.bmi || '-'}</strong>
                          </div>
                          <div>
                            <span className="mini-label">Head circumference</span>
                            <strong>{departmentConsoleForm.headCircumferenceCm ? `${departmentConsoleForm.headCircumferenceCm} cm` : '-'}</strong>
                          </div>
                          <div>
                            <span className="mini-label">Head circumference emphasis</span>
                            <strong>{headCircumferenceEmphasis ? 'Infant / toddler reference active' : 'Trend only; strongest in 0–24 months'}</strong>
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="doctor-history-divider" />
                    <p className="micro strong">Patient history</p>
                    <div className="doctor-summary-side-list">
                      <div>
                        <span className="mini-label">Visit type</span>
                        <strong>{historySummary?.isFollowUp ? 'Follow-up' : 'New patient'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">Previous visits</span>
                        <strong>{historySummary?.previousVisitCount || 0}</strong>
                      </div>
                      <div>
                        <span className="mini-label">Last visit</span>
                        <strong>{historySummary?.lastVisitAt ? new Date(historySummary.lastVisitAt).toLocaleString() : 'No prior visit'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">Conditions</span>
                        <strong>{historySummary?.conditions || '-'}</strong>
                      </div>
                      <div>
                        <span className="mini-label">Allergies</span>
                        <strong>{historySummary?.allergies || '-'}</strong>
                      </div>
                      {consoleKind === 'pediatrics' ? (
                        <div>
                          <span className="mini-label">{selectedPediatricSchedule ? `${selectedPediatricSchedule} due now` : 'Vaccine schedule'}</span>
                          <strong>{selectedPediatricSchedule ? (((selectedDueVaccines?.dueToday || []).length + (selectedDueVaccines?.overdue || []).length) || 0) : 'Not chosen'}</strong>
                        </div>
                      ) : null}
                      {consoleKind === 'pediatrics' ? (
                        <div>
                          <span className="mini-label">Recorded milestones</span>
                          <strong>{pediatricMilestoneAssessments.filter((item) => departmentConsoleForm[item.statusField] === 'achieved').length}</strong>
                        </div>
                      ) : null}
                    </div>
                    {priorHistory.length ? (
                      <div className="doctor-history-stack doctor-history-stack-scroll">
                        {priorHistory.slice(0, 4).map((item) => (
                          <div key={`prior-history-${item.id}`} className="doctor-history-visit-card">
                            <p className="history-headline">
                              {item.department || '-'} • {item.doctor_name || '-'}
                            </p>
                            <p className="micro">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : new Date(item.created_at).toLocaleString()}</p>
                            <p className="micro strong">{item.diagnosis_text || item.diagnosis_code || item.chief_complaint || 'No diagnosis recorded'}</p>
                            {item.notes?.[0]?.note_text ? <p className="micro">{item.notes[0].note_text}</p> : null}
                            {item.prescriptions?.[0] ? (
                              <p className="micro">
                                Rx: {(item.prescriptions[0].items || []).map((entry) => entry.medicine).filter(Boolean).join(', ') || 'Prescription saved'}
                              </p>
                            ) : null}
                            {renderDepartmentHistoryHighlights(item, 'compact')}
                            {item.orders?.[0] ? (
                              <p className="micro">
                                Orders: {item.orders.map((entry) => entry.item_name).filter(Boolean).slice(0, 2).join(', ')}
                              </p>
                            ) : null}
                            <div className="action-row doctor-history-actions">
                              <button
                                className="ghost"
                                type="button"
                                onClick={() => openHistoryEncounter(item.id)}
                              >
                                {activeHistoryEncounterId === item.id ? 'Close visit' : 'Open visit'}
                              </button>
                              <button
                                className="ghost"
                                type="button"
                                onClick={() => {
                                  copyPreviousPrescription(item)
                                  setActiveTab('prescription')
                                }}
                              >
                                Copy Rx
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="micro">No previous visit history for this patient.</p>
                    )}
                    {historyEncounter ? (
                      <>
                        <div className="doctor-history-divider" />
                        <div className="doctor-history-expanded">
                          <p className="micro strong">Opened previous visit</p>
                          <div className="doctor-history-expanded-block">
                            <p className="history-headline">
                              {historyEncounter.diagnosis_text || historyEncounter.diagnosis_code || historyEncounter.chief_complaint || 'Encounter summary'}
                            </p>
                            <p className="micro">
                              {historyEncounter.updated_at ? new Date(historyEncounter.updated_at).toLocaleString() : '-'}
                            </p>
                            {historyEncounter.findings ? <p className="micro"><strong>Findings:</strong> {historyEncounter.findings}</p> : null}
                            {historyEncounter.plan_text ? <p className="micro"><strong>Plan:</strong> {historyEncounter.plan_text}</p> : null}
                            {renderDepartmentHistoryHighlights({ departmentForm: activeHistoryEncounterDetail?.departmentForm }, 'expanded')}
                            {historyNotes.length ? (
                              <div className="doctor-history-expanded-section">
                                <span className="mini-label">Notes</span>
                                {historyNotes.map((item) => (
                                  <p key={`history-note-${item.id}`} className="micro doctor-history-note">{item.note_text}</p>
                                ))}
                              </div>
                            ) : null}
                            {historyPrescriptions.length ? (
                              <div className="doctor-history-expanded-section">
                                <span className="mini-label">Prescriptions</span>
                                {historyPrescriptions.map((prescription) => (
                                  <div key={`history-prescription-${prescription.id}`} className="doctor-history-expanded-card">
                                    <p className="micro strong">{prescription.instructions || 'No instructions'}</p>
                                    {(prescription.items || []).map((item) => (
                                      <p key={`history-prescription-item-${item.id}`} className="micro">
                                        {item.medicine} • {item.dose || '-'} • {item.frequency || '-'} • {item.duration || '-'}
                                      </p>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {historyOrders.length ? (
                              <div className="doctor-history-expanded-section">
                                <span className="mini-label">Orders</span>
                                {historyOrders.map((item) => (
                                  <p key={`history-order-${item.id}`} className="micro">
                                    {item.order_type} • {item.item_name} • {item.status}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </aside>
                </div>
              </div>
            ) : null}

            {activeTab === 'notes' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-console-two-col">
                  <div className="doctor-workspace-card">
                    <div className="doctor-note-header">
                      <div>
                        <p className="micro strong">Doctor note</p>
                        <h3 className="doctor-note-title">Clinical drafting workspace</h3>
                        <p className="micro">Capture the encounter note, polish the wording, and sign it cleanly before saving to the record.</p>
                      </div>
                      <div className="doctor-note-header-badge">
                        <span className="doctor-note-header-badge-label">Draft status</span>
                        <strong>{String(noteDraft || '').trim() ? 'In progress' : 'Ready to start'}</strong>
                      </div>
                    </div>
                    <DoctorAssistPanel
                      title={
                        consoleKind === 'pediatrics'
                          ? 'Pediatric clinic assist'
                          : consoleKind === 'surgery'
                            ? 'Surgical OPD assist'
                            : 'Clinical template assist'
                      }
                      subtitle={
                        consoleKind === 'pediatrics'
                          ? 'Use child-visit templates for fever, wheeze, growth, nutrition, abdominal pain, vaccine review, and caregiver-facing note drafting.'
                          : consoleKind === 'surgery'
                            ? 'Use surgical OPD templates for post-op review, wound care, acute abdomen, hernia, piles/fissure, and sharper procedure-facing notes.'
                            : 'Use Indian OPD-style templates to fill complaint structure, working diagnoses, likely tests, medicine drafts, and a clean note in one flow.'
                      }
                      departmentKey={consoleKind}
                      noteAssistQuery={noteAssistQuery}
                      setNoteAssistQuery={setNoteAssistQuery}
                      noteAssistSuggestions={visibleNoteAssistSuggestions}
                      noteAssistStatus={noteAssistStatus}
                      noteAssistLoading={noteAssistLoading}
                      loadNoteAssistSuggestions={loadNoteAssistSuggestions}
                      applyNoteAssistSuggestion={applyNoteAssistSuggestion}
                      applyAssistComplaintTemplate={applyAssistComplaintTemplate}
                      applyAssistDiagnosisSuggestion={applyAssistDiagnosisSuggestion}
                      stageAssistOrderSuggestion={stageAssistOrderSuggestion}
                      applyAssistPrescriptionTemplate={applyAssistPrescriptionTemplate}
                      dismissNoteAssistSuggestion={dismissNoteAssistSuggestion}
                    />
                    <div className="doctor-note-editor-card">
                      <div className="doctor-note-editor-head">
                        <div>
                          <p className="micro strong">Clinical note</p>
                          <p className="micro">Write or apply a structured draft, then use the polish tools only if you want to tighten the language.</p>
                        </div>
                        <span className="doctor-note-wordcount">
                          {String(noteDraft || '').trim()
                            ? `${String(noteDraft || '').trim().split(/\s+/).filter(Boolean).length} words`
                            : 'No draft yet'}
                        </span>
                      </div>
                      <label className="doctor-note-editor-field">
                        <span className="micro strong">Clinical note</span>
                        <textarea
                          rows={14}
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          placeholder="Clinical assessment, important findings, working impression, counselling, and follow-up plan..."
                        />
                      </label>
                      <div className="doctor-note-refine-bar">
                        <div>
                          <p className="micro strong">Refine current draft</p>
                          <p className="micro">Choose the tone you want without changing the clinical meaning.</p>
                        </div>
                        <div className="action-row doctor-note-refine-actions">
                          <button
                            type="button"
                            className="ghost"
                            disabled={noteRefineLoading || !String(noteDraft || '').trim()}
                            onClick={() => refineDoctorNoteDraft('clinical')}
                          >
                            {noteRefineLoading ? 'Refining…' : 'Clinical polish'}
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            disabled={noteRefineLoading || !String(noteDraft || '').trim()}
                            onClick={() => refineDoctorNoteDraft('concise')}
                          >
                            Concise
                          </button>
                          <button
                            type="button"
                            className="ghost"
                            disabled={noteRefineLoading || !String(noteDraft || '').trim()}
                            onClick={() => refineDoctorNoteDraft('caregiver')}
                          >
                            {consoleKind === 'pediatrics' ? 'Caregiver-friendly' : 'Patient-friendly'}
                          </button>
                        </div>
                      </div>
                      {noteRefineStatus ? <p className="micro doctor-note-assist-status doctor-note-refine-feedback">{noteRefineStatus}</p> : null}
                      <div className="doctor-note-footer">
                        <label className="doctor-note-signature">
                          <span className="micro strong">Signature</span>
                          <input type="text" value={signatureDraft} onChange={(event) => setSignatureDraft(event.target.value)} placeholder="Signed by Dr..." />
                        </label>
                        <div className="action-row doctor-console-actions doctor-note-savebar">
                          <button className="primary" type="button" onClick={submitEncounterNote}>Save doctor note</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="doctor-workspace-card doctor-notes-history-card">
                    <div className="doctor-note-header doctor-note-header-secondary">
                      <div>
                        <p className="micro strong">Existing notes</p>
                        <h3 className="doctor-note-title">Saved encounter notes</h3>
                        <p className="micro">Review the latest signed note entries for this consult without leaving the drafting workspace.</p>
                      </div>
                      <div className="doctor-note-header-badge">
                        <span className="doctor-note-header-badge-label">Saved</span>
                        <strong>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</strong>
                      </div>
                    </div>
                    <div className="history-list doctor-history-list">
                      {notes.map((item) => (
                        <div key={`note-${item.id}`} className="history-card doctor-history-row doctor-history-row-elevated">
                          <div className="doctor-history-entry-head">
                            <span className="doctor-history-entry-badge">Signed note</span>
                            <span className="doctor-history-entry-time">{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <p className="micro doctor-history-note">{item.note_text}</p>
                          <div className="doctor-history-meta">
                            <span>{item.signature_text || 'Unsigned'}</span>
                          </div>
                        </div>
                      ))}
                      {notes.length === 0 ? (
                        <div className="doctor-history-empty">
                          <p className="micro strong">No signed notes yet</p>
                          <p className="micro">The first saved doctor note for this consult will appear here.</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'pathway' && consoleKind === 'pediatrics' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-workspace-card doctor-department-card">
                  <div className="section-head compact">
                    <div>
                      <p className="micro strong">{consoleCopy.detailTitle}</p>
                      <p className="micro">Guardian context, WHO growth plotting, UIP vaccine due logic, and pediatric follow-up in one screen.</p>
                    </div>
                  </div>
                  <div className="doctor-form-grid doctor-form-grid-pediatrics">
                    <label>
                      Child DOB
                      <input
                        type="date"
                        value={departmentConsoleForm.dateOfBirth || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
                      />
                    </label>
                    <label>
                      Child sex
                      <select
                        value={departmentConsoleForm.sex || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, sex: event.target.value }))}
                      >
                        <option value="">Select sex</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>
                    <label>
                      Guardian name
                      <input
                        type="text"
                        value={departmentConsoleForm.guardianName || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, guardianName: event.target.value }))}
                      />
                    </label>
                    <label>
                      Weight (kg)
                      <input
                        type="text"
                        value={departmentConsoleForm.weightKg || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, weightKg: event.target.value }))}
                      />
                    </label>
                    <label>
                      Height (cm)
                      <input
                        type="text"
                        value={departmentConsoleForm.heightCm || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, heightCm: event.target.value }))}
                      />
                    </label>
                    <label>
                      Head circumference (cm)
                      <input
                        type="text"
                        value={departmentConsoleForm.headCircumferenceCm || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, headCircumferenceCm: event.target.value }))}
                      />
                    </label>
                    <label>
                      BMI (kg/m²)
                      <input type="text" value={pediatricDraftMeasurement?.bmi || ''} readOnly />
                    </label>
                    <label>
                      Pediatric dosing context
                      <input
                        type="text"
                        value={departmentConsoleForm.pediatricDoseNotes || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, pediatricDoseNotes: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="pediatric-growth-summary">
                    <div className={`pediatric-growth-pill ${currentWeightAssessment?.zone || 'neutral'}`}>
                      <span className="mini-label">Weight-for-age</span>
                      <strong>{summarizeGrowthAssessment('weight', currentWeightAssessment, pediatricAgeMonths)}</strong>
                    </div>
                    <div className={`pediatric-growth-pill ${currentHeightAssessment?.zone || 'neutral'}`}>
                      <span className="mini-label">Height-for-age</span>
                      <strong>{summarizeGrowthAssessment('height', currentHeightAssessment, pediatricAgeMonths)}</strong>
                    </div>
                    <div className={`pediatric-growth-pill ${currentBmiAssessment?.zone || 'neutral'}`}>
                      <span className="mini-label">BMI-for-age</span>
                      <strong>{summarizeGrowthAssessment('bmi', currentBmiAssessment, pediatricAgeMonths)}</strong>
                    </div>
                    <div className={`pediatric-growth-pill ${currentHeadAssessment?.zone || 'neutral'}`}>
                      <span className="mini-label">Head circumference</span>
                      <strong>{summarizeGrowthAssessment('headCircumference', currentHeadAssessment, pediatricAgeMonths)}</strong>
                    </div>
                  </div>
                  {pediatricPlotReady ? (
                    <>
                      {!under5ComparisonReady || !bmiComparisonReady ? (
                        <div className="doctor-status-banner">
                          <strong>Growth trend plotted with age-specific reference support.</strong>
                          <span>
                            {pediatricAgeMonths !== null && pediatricAgeMonths < WHO_BMI_MIN_MONTHS
                              ? 'WHO BMI-for-age comparison starts from 24 months. Weight-for-age, height-for-age, and head circumference trends are still recorded for this younger child.'
                              : pediatricAgeMonths !== null && pediatricAgeMonths > WHO_UNDER5_MAX_MONTHS
                                ? 'WHO height-for-age and BMI-for-age comparison continue through the older-child reference range in this build. Weight remains trend-focused beyond under-5, and head circumference is mainly emphasized in infancy and early toddler years.'
                                : 'WHO under-5 comparison is active for weight, height, and head circumference, while BMI-for-age activates from 24 months onward.'}
                          </span>
                        </div>
                      ) : null}
                      <div className="pediatric-growth-grid">
                        <PediatricGrowthChart title="Weight-for-age" unit="kg" series={weightChartSeries} />
                        <PediatricGrowthChart title="Height-for-age" unit="cm" series={heightChartSeries} />
                        <PediatricGrowthChart title="BMI-for-age" unit="kg/m²" series={bmiChartSeries} />
                        <PediatricGrowthChart title="Head circumference-for-age" unit="cm" series={headChartSeries} />
                      </div>
                    </>
                  ) : (
                    <div className="doctor-status-banner">
                      <strong>Plotting needs child DOB and sex.</strong>
                      <span>Enter DOB and sex first. Once those are present, the charts render immediately. Then add weight, height, and head circumference for under-5 comparison, and BMI-for-age comparison will activate from 24 months onward up to 19 years.</span>
                    </div>
                  )}
                  <div className="doctor-workspace-card pediatric-milestones-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">Development milestones</p>
                        <p className="micro">WHO gross motor milestone windows help flag whether the child is early, within window, or late for key achievements.</p>
                      </div>
                    </div>
                    <div className="pediatric-milestone-grid">
                      {pediatricMilestoneAssessments.map((item) => (
                        <div key={item.key} className={`pediatric-milestone-item ${item.assessment.zone || 'neutral'}`}>
                          <div>
                            <span className="mini-label">{item.label}</span>
                            <strong>{item.assessment.label}</strong>
                          </div>
                          <label>
                            Status
                            <select
                              value={departmentConsoleForm[item.statusField] || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, [item.statusField]: event.target.value }))}
                            >
                              <option value="">Not recorded</option>
                              <option value="achieved">Achieved</option>
                              <option value="concern">Concern</option>
                            </select>
                          </label>
                          <label>
                            Achieved date
                            <input
                              type="date"
                              value={departmentConsoleForm[item.dateField] || ''}
                              onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, [item.dateField]: event.target.value }))}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <label>
                      Development notes
                      <textarea
                        rows={5}
                        value={departmentConsoleForm.developmentNotes || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, developmentNotes: event.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="doctor-summary-textareas">
                    <label>
                      Growth notes
                      <textarea
                        rows={7}
                        value={departmentConsoleForm.growthNotes || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, growthNotes: event.target.value }))}
                      />
                    </label>
                  </div>
                  <label>
                    Follow-up pediatric notes
                    <textarea
                      rows={5}
                      value={departmentConsoleForm.followUpPediatricNotes || ''}
                      onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, followUpPediatricNotes: event.target.value }))}
                    />
                  </label>
                  <div className="action-row doctor-console-actions">
                    <button className="primary" type="button" onClick={saveDepartmentConsoleForm}>Save pediatrics details</button>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'vaccination' && consoleKind === 'pediatrics' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-workspace-card pediatric-vaccine-card">
                  <div className="section-head compact">
                    <div>
                      <p className="micro strong">Vaccination schedule tracker</p>
                      <p className="micro">Choose the child’s schedule, record vaccines manually, and open the due tracker only when you want schedule-based due dates calculated.</p>
                    </div>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => setShowPediatricTracker((prev) => !prev)}
                    >
                      {showPediatricTracker ? 'Hide due tracker' : 'Open due tracker'}
                    </button>
                  </div>
                  <label>
                    Immunization context
                    <textarea
                      rows={5}
                      value={departmentConsoleForm.immunizationContext || ''}
                      onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, immunizationContext: event.target.value }))}
                    />
                  </label>
                  <div className="doctor-form-grid doctor-form-grid-four">
                    <label>
                      Schedule
                      <select
                        value={departmentConsoleForm.immunizationSchedule || ''}
                        onChange={(event) => setDepartmentConsoleForm((prev) => ({ ...prev, immunizationSchedule: event.target.value }))}
                      >
                        <option value="">Choose schedule</option>
                        <option value="UIP">India UIP</option>
                        <option value="IAP">IAP / private</option>
                      </select>
                    </label>
                    <label>
                      Vaccine name
                      <div className="pediatric-vaccine-picker">
                        <input
                          type="text"
                          value={manualVaccineDraft.vaccineName}
                          onChange={(event) =>
                            setManualVaccineDraft((prev) => ({
                              ...prev,
                              code: '',
                              vaccineName: event.target.value,
                            }))
                          }
                          placeholder="Type initials like BCG, OPV, MMR, Hep..."
                          list="pediatric-vaccine-name-options"
                          autoComplete="off"
                        />
                        <datalist id="pediatric-vaccine-name-options">
                          {pediatricVaccineSuggestions.map((item) => (
                            <option
                              key={`vaccine-option-${item.code}-${item.doseLabel}`}
                              value={item.vaccineName}
                            >
                              {`${item.doseLabel}${item.source ? ` • ${item.source}` : ''}`}
                            </option>
                          ))}
                        </datalist>
                        {manualVaccineDraft.vaccineName && pediatricVaccineSuggestions.length ? (
                          <div className="pediatric-vaccine-suggestion-list">
                            {pediatricVaccineSuggestions.map((item) => (
                              <button
                                key={`vaccine-suggestion-${item.code}-${item.doseLabel}`}
                                className="pediatric-vaccine-suggestion"
                                type="button"
                                onClick={() => applyManualVaccineSuggestion(item)}
                              >
                                <strong>{item.vaccineName}</strong>
                                <span>{item.doseLabel}{item.source ? ` • ${item.source}` : ''}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <p className="micro">Pick from suggestions or type a custom vaccine name.</p>
                      </div>
                    </label>
                    <label>
                      Dose label
                      <input
                        type="text"
                        value={manualVaccineDraft.doseLabel}
                        onChange={(event) => setManualVaccineDraft((prev) => ({ ...prev, doseLabel: event.target.value }))}
                        placeholder="Dose 1 / Booster / Birth dose"
                      />
                    </label>
                    <label>
                      Given date
                      <input
                        type="date"
                        value={manualVaccineDraft.administeredDate}
                        onChange={(event) => setManualVaccineDraft((prev) => ({ ...prev, administeredDate: event.target.value }))}
                      />
                    </label>
                    <label>
                      Notes
                      <input
                        type="text"
                        value={manualVaccineDraft.notes}
                        onChange={(event) => setManualVaccineDraft((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder="Batch / site / reaction"
                      />
                    </label>
                  </div>
                  <div className="action-row doctor-console-actions">
                    <button className="primary" type="button" onClick={saveManualPediatricImmunization}>
                      Record vaccine manually
                    </button>
                    <button className="ghost" type="button" onClick={saveDepartmentConsoleForm}>
                      Save vaccination details
                    </button>
                  </div>
                  {showPediatricTracker ? (
                    !selectedPediatricSchedule ? (
                      <p className="micro">Choose `India UIP` or `IAP / private` first, then open the due tracker.</p>
                    ) : !pediatricDateOfBirth ? (
                      <p className="micro">Add child DOB first to fetch due vaccines accurately.</p>
                    ) : (
                    <>
                      <div className="pediatric-vaccine-columns">
                        <div>
                          <p className="micro strong">Overdue / due now</p>
                          <div className="pediatric-vaccine-stack">
                            {[...(selectedDueVaccines?.overdue || []), ...(selectedDueVaccines?.dueToday || [])].slice(0, 8).map((vaccine) => (
                              <div key={`${vaccine.code}-${vaccine.doseLabel}`} className="pediatric-vaccine-item overdue">
                                <div>
                                  <strong>{vaccine.vaccineName}</strong>
                                  <p className="micro">{vaccine.doseLabel} • Due {vaccine.dueDate}</p>
                                  <p className="micro">{vaccine.timingLabel}{vaccine.optional ? ' • optional / state dependent' : ''}</p>
                                </div>
                                <button className="ghost" type="button" onClick={() => recordPediatricImmunization(vaccine)}>
                                  Mark given today
                                </button>
                              </div>
                            ))}
                            {!((selectedDueVaccines?.overdue || []).length || (selectedDueVaccines?.dueToday || []).length) ? (
                              <p className="micro">No overdue or due-today vaccines for the selected schedule.</p>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <p className="micro strong">Upcoming</p>
                          <div className="pediatric-vaccine-stack">
                            {(selectedDueVaccines?.upcoming || []).slice(0, 6).map((vaccine) => (
                              <div key={`${vaccine.code}-${vaccine.doseLabel}`} className="pediatric-vaccine-item upcoming">
                                <strong>{vaccine.vaccineName}</strong>
                                <p className="micro">{vaccine.doseLabel} • Due {vaccine.dueDate}</p>
                                <p className="micro">{vaccine.timingLabel}{vaccine.optional ? ' • optional / state dependent' : ''}</p>
                              </div>
                            ))}
                            {!(selectedDueVaccines?.upcoming || []).length ? <p className="micro">No upcoming vaccines are due in the next 90 days for the selected schedule.</p> : null}
                          </div>
                        </div>
                      </div>
                      <div className="doctor-history-divider" />
                      <p className="micro strong">Recorded immunizations</p>
                      <div className="pediatric-vaccine-stack">
                        {(pediatricData?.immunizationRecords || []).slice(0, 6).map((record) => (
                          <div key={`given-vaccine-${record.id}`} className="pediatric-vaccine-item recorded">
                            <strong>{record.vaccine_name}</strong>
                            <p className="micro">{record.dose_label} • Given {record.administered_date}</p>
                          </div>
                        ))}
                        {!(pediatricData?.immunizationRecords || []).length ? <p className="micro">No vaccine has been recorded in this console for the child yet.</p> : null}
                      </div>
                    </>
                    )
                  ) : (
                    <p className="micro">Due vaccines are hidden until the doctor opens the tracker. Manual vaccine recording is always available above.</p>
                  )}
                </div>
              </div>
            ) : null}

            {activeTab === 'prescription' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-workspace-card">
                  <div className="section-head compact">
                    <div>
                      <p className="micro strong">{consoleCopy.prescriptionTitle}</p>
                      <p className="micro">{consoleCopy.prescriptionSubtitle}</p>
                    </div>
                  </div>
                  <label>
                    {consoleCopy.prescriptionInstructionsLabel}
                    <textarea
                      rows={4}
                      value={prescriptionDraft.instructions}
                      onChange={(event) => setPrescriptionDraft((prev) => ({ ...prev, instructions: event.target.value }))}
                      placeholder={consoleKind === 'surgery' ? 'Post-op care, dressing, diet, warning signs...' : consoleKind === 'pediatrics' ? 'Explain to parent/guardian how and when to give medicines...' : ''}
                    />
                  </label>
                  {consoleKind === 'pediatrics' ? (
                    <div className="doctor-console-banner subtle">
                      Weight-aware prescribing: use the child weight and dosing context from the pediatric pathway before finalizing Rx.
                    </div>
                  ) : null}
                  <div className="doctor-rx-table">
                    <div className="doctor-rx-head">
                      <span>{consoleCopy.prescriptionMedicineLabel}</span>
                      <span>{consoleCopy.prescriptionDoseLabel}</span>
                      <span>{consoleCopy.prescriptionFrequencyLabel}</span>
                      <span>{consoleCopy.prescriptionDurationLabel}</span>
                      <span>Action</span>
                    </div>
                    {prescriptionDraft.items.map((item, index) => (
                      <div key={`rx-item-${index}`} className="doctor-rx-row">
                        <input type="text" value={item.medicine} onChange={(event) => updatePrescriptionItem(index, 'medicine', event.target.value)} placeholder={consoleCopy.prescriptionMedicineLabel} />
                        <input type="text" value={item.dose} onChange={(event) => updatePrescriptionItem(index, 'dose', event.target.value)} placeholder={consoleCopy.prescriptionDoseLabel} />
                        <input type="text" value={item.frequency} onChange={(event) => updatePrescriptionItem(index, 'frequency', event.target.value)} placeholder={consoleCopy.prescriptionFrequencyLabel} />
                        <input type="text" value={item.duration} onChange={(event) => updatePrescriptionItem(index, 'duration', event.target.value)} placeholder={consoleCopy.prescriptionDurationLabel} />
                        <button className="ghost" type="button" onClick={() => removePrescriptionItem(index)}>Remove</button>
                      </div>
                    ))}
                  </div>
                  <div className="action-row doctor-console-actions">
                    <button className="ghost" type="button" onClick={addPrescriptionItem}>{consoleCopy.addMedicineLabel}</button>
                    <button className="primary" type="button" onClick={submitPrescription}>{consoleCopy.savePrescriptionLabel}</button>
                  </div>
                  <div className="history-list doctor-history-list">
                    {prescriptions.map((prescription) => (
                      <div key={`prescription-${prescription.id}`} className="history-card doctor-history-row">
                        <p className="micro strong">{prescription.instructions || 'No instructions'}</p>
                        {(prescription.items || []).map((item) => (
                          <p key={`prescription-item-${item.id}`} className="micro">
                            {item.medicine} • {item.dose || '-'} • {item.frequency || '-'} • {item.duration || '-'}
                          </p>
                        ))}
                      </div>
                    ))}
                    {prescriptions.length === 0 ? <p className="micro">No prescriptions saved yet.</p> : null}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'orders' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                  <div className="doctor-console-two-col">
                  <div className="doctor-workspace-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">{consoleCopy.ordersTitle}</p>
                        <p className="micro">{consoleCopy.ordersSubtitle}</p>
                      </div>
                    </div>
                    <div className="doctor-form-grid doctor-form-grid-three">
                      <label>
                        {consoleCopy.orderTypeLabel}
                        <select value={orderDraft.orderType} onChange={(event) => setOrderDraft((prev) => ({ ...prev, orderType: event.target.value }))}>
                          {consoleCopy.orderTypeOptions.map((option) => (
                            <option key={`order-type-${option.value}`} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {consoleCopy.itemNameLabel}
                        <input type="text" value={orderDraft.itemName} onChange={(event) => setOrderDraft((prev) => ({ ...prev, itemName: event.target.value }))} />
                      </label>
                      <label>
                        {consoleCopy.destinationLabel}
                        <input type="text" value={orderDraft.destination} onChange={(event) => setOrderDraft((prev) => ({ ...prev, destination: event.target.value }))} />
                      </label>
                    </div>
                    <label>
                      {consoleCopy.orderNotesLabel}
                      <textarea rows={8} value={orderDraft.notes} onChange={(event) => setOrderDraft((prev) => ({ ...prev, notes: event.target.value }))} />
                    </label>
                    <div className="action-row doctor-console-actions">
                      <button className="primary" type="button" onClick={submitEncounterOrder}>{consoleCopy.createOrderLabel}</button>
                    </div>
                  </div>
                  <div className="doctor-workspace-card">
                    <div className="section-head compact">
                      <div>
                        <p className="micro strong">{consoleCopy.existingOrdersTitle}</p>
                        <p className="micro">{consoleCopy.existingOrdersSubtitle}</p>
                      </div>
                    </div>
                    <div className="history-list doctor-history-list">
                      {orders.map((order) => (
                        <div key={`order-${order.id}`} className="history-card doctor-history-row">
                          <p className="history-headline">{order.order_type} • {order.item_name}</p>
                          <div className="doctor-history-meta">
                            <span>{order.destination || '-'}</span>
                            <span>{order.status}</span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 ? <p className="micro">No orders created yet.</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'reportInsights' ? (
              <div className="doctor-console-tabpanel doctor-console-tabpanel-wide">
                <div className="doctor-workspace-card">
                  <div className="section-head compact">
                    <div>
                      <p className="micro strong">Report insights</p>
                      <p className="micro">Review uploaded patient reports as structured trends across the selected time window.</p>
                    </div>
                    <label className="report-month-filter">
                      Trend window
                      <select value={String(reportInsightsMonths)} onChange={(event) => setReportInsightsMonths(Number(event.target.value))}>
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                      </select>
                    </label>
                  </div>
                  {reportInsightsStatus ? <p className="micro">{reportInsightsStatus}</p> : null}
                  <div className="doctor-report-hero">
                    <div className="doctor-report-hero-copy">
                      <p className="micro strong">Clinical review summary</p>
                      <h3>Lab trend review</h3>
                      <p>{reportInsights?.doctorSummary || 'No structured report values are available for this patient yet.'}</p>
                    </div>
                    <div className="doctor-report-hero-stats">
                      <div className="doctor-report-stat">
                        <span className="doctor-report-stat-label">Tracked metrics</span>
                        <strong>{(reportInsights?.trends || []).length}</strong>
                      </div>
                      <div className="doctor-report-stat">
                        <span className="doctor-report-stat-label">Condition panels</span>
                        <strong>{groupedReportPanels.length}</strong>
                      </div>
                      <div className="doctor-report-stat">
                        <span className="doctor-report-stat-label">Recent uploads</span>
                        <strong>{(reportInsights?.latestReports || []).length}</strong>
                      </div>
                    </div>
                  </div>
                  {(reportInsights?.badges || []).length ? (
                    <div className="report-badge-strip">
                      {reportInsights.badges.map((badge) => (
                        <div key={badge.key} className={`report-badge report-zone-${badge.zone}`}>{badge.label}</div>
                      ))}
                    </div>
                  ) : null}
                  {(reportInsights?.conditionSummaries || []).length ? (
                    <div className="history-list compact-list">
                      {reportInsights.conditionSummaries.map((item) => (
                        <div key={item.key} className="history-card">
                          <p className="history-headline">{item.title}</p>
                          <p className={`micro report-zone-${item.zone}`}>{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="report-view-switch">
                    <button
                      type="button"
                      className={reportViewMode === 'condition' ? 'active' : ''}
                      onClick={() => setReportViewMode('condition')}
                    >
                      Condition view
                    </button>
                    <button
                      type="button"
                      className={reportViewMode === 'metrics' ? 'active' : ''}
                      onClick={() => setReportViewMode('metrics')}
                    >
                      All metrics view
                    </button>
                  </div>
                  {reportViewMode === 'condition' ? (
                    <div className="report-condition-stack">
                      {groupedReportPanels.length ? groupedReportPanels.map((panel) => (
                        <article key={panel.key} className="report-condition-panel">
                          <div className="report-condition-head">
                            <div>
                              <p className="micro strong">{panel.title}</p>
                              <h3>{panel.summary?.title || panel.title}</h3>
                              <p className="micro report-condition-meta">
                                {panel.trends.length} tracked metric{panel.trends.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <div className="report-condition-actions">
                              {panel.summary ? (
                                <span className={`report-badge report-badge-soft report-zone-${panel.summary.zone}`}>
                                  {panel.summary.zone === 'high' ? 'Needs attention' : panel.summary.zone === 'low' ? 'Watch trend' : 'Stable'}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                className="mini-action"
                                onClick={() =>
                                  setCollapsedReportPanels((prev) => ({
                                    ...prev,
                                    [panel.key]: !prev[panel.key],
                                  }))
                                }
                              >
                                {collapsedReportPanels[panel.key] ? 'Expand' : 'Collapse'}
                              </button>
                            </div>
                          </div>
                          <p className="micro">{panel.summary?.summary || 'Grouped lab metrics for easier consult review.'}</p>
                          {!collapsedReportPanels[panel.key] ? (
                            <div className="report-trend-grid report-trend-grid-condensed report-trend-grid-compact">
                              {panel.trends.map((trend) => (
                                <ReportTrendChart
                                  key={trend.metricKey}
                                  title={trend.metricLabel}
                                  unit={trend.unit}
                                  points={trend.points}
                                  zone={trend.zone}
                                  needsReview={trend.needsReview}
                                  compact
                                />
                              ))}
                            </div>
                          ) : null}
                        </article>
                      )) : <p className="micro">No grouped condition trends available yet.</p>}
                    </div>
                  ) : (
                    <div className="report-trend-grid report-trend-grid-compact">
                      {(reportInsights?.trends || []).map((trend) => (
                        <ReportTrendChart
                          key={trend.metricKey}
                          title={trend.metricLabel}
                          unit={trend.unit}
                          points={trend.points}
                          zone={trend.zone}
                          needsReview={trend.needsReview}
                          compact
                        />
                      ))}
                      {!(reportInsights?.trends || []).length ? <p className="micro">No report trends available yet.</p> : null}
                    </div>
                  )}
                  <div className="history-list compact-list" style={{ marginTop: 16 }}>
                    {(reportInsights?.records || []).map((record) => (
                      <div key={`doctor-report-record-${record.id}`} className="history-card">
                        <p className="history-headline">{record.file_name || `Report #${record.id}`}</p>
                        <p className="micro">
                          {record.created_at ? new Date(record.created_at).toLocaleString() : '-'}
                          {record.analysis?.reportType ? ` • ${String(record.analysis.reportType).replace(/_/g, ' ')}` : ''}
                        </p>
                        <div className="action-row">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => downloadDoctorRecord?.(record.id, record.file_name || 'report')}
                          >
                            Download report
                          </button>
                        </div>
                      </div>
                    ))}
                    {!(reportInsights?.records || []).length ? <p className="micro">No uploaded reports available yet.</p> : null}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="doctor-console-empty">
            <p className="micro">No active consult selected.</p>
          </div>
        )}
      </div>
    </section>
  )
}
