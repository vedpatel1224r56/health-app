const UIP_SCHEDULE = [
  { code: 'bcg', vaccineName: 'BCG', doseLabel: 'Birth dose', atBirth: true },
  { code: 'hep_b_birth', vaccineName: 'Hepatitis B', doseLabel: 'Birth dose', atBirth: true },
  { code: 'opv_0', vaccineName: 'bOPV', doseLabel: 'Zero dose', atBirth: true },
  { code: 'opv_1', vaccineName: 'bOPV', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'rvv_1', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'pentavalent_1', vaccineName: 'Pentavalent vaccine', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'fipv_1', vaccineName: 'fIPV', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'pcv_1', vaccineName: 'PCV', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'opv_2', vaccineName: 'bOPV', doseLabel: 'Dose 2', dueWeeks: 10 },
  { code: 'rvv_2', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 2', dueWeeks: 10 },
  { code: 'pentavalent_2', vaccineName: 'Pentavalent vaccine', doseLabel: 'Dose 2', dueWeeks: 10 },
  { code: 'opv_3', vaccineName: 'bOPV', doseLabel: 'Dose 3', dueWeeks: 14 },
  { code: 'rvv_3', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 3', dueWeeks: 14 },
  { code: 'pentavalent_3', vaccineName: 'Pentavalent vaccine', doseLabel: 'Dose 3', dueWeeks: 14 },
  { code: 'fipv_2', vaccineName: 'fIPV', doseLabel: 'Dose 2', dueWeeks: 14 },
  { code: 'pcv_2', vaccineName: 'PCV', doseLabel: 'Dose 2', dueWeeks: 14 },
  { code: 'mr_1', vaccineName: 'MR', doseLabel: 'Dose 1', dueMonths: 9 },
  { code: 'pcv_booster', vaccineName: 'PCV', doseLabel: 'Booster', dueMonths: 9 },
  { code: 'je_1', vaccineName: 'JE', doseLabel: 'Dose 1', dueMonths: 9, optional: true, note: 'State-program dependent under UIP.' },
  { code: 'mr_2', vaccineName: 'MR', doseLabel: 'Dose 2', dueMonths: 16 },
  { code: 'dpt_booster_1', vaccineName: 'DPT', doseLabel: 'Booster 1', dueMonths: 16 },
  { code: 'opv_booster', vaccineName: 'bOPV', doseLabel: 'Booster', dueMonths: 16 },
  { code: 'je_2', vaccineName: 'JE', doseLabel: 'Dose 2', dueMonths: 16, optional: true, note: 'State-program dependent under UIP.' },
  { code: 'dpt_booster_2', vaccineName: 'DPT', doseLabel: 'Booster 2', dueYears: 5 },
  { code: 'td_10y', vaccineName: 'Td', doseLabel: '10 years', dueYears: 10 },
  { code: 'td_16y', vaccineName: 'Td', doseLabel: '16 years', dueYears: 16 },
]

const IAP_SCHEDULE = [
  { code: 'bcg', vaccineName: 'BCG', doseLabel: 'Birth dose', atBirth: true },
  { code: 'hep_b_birth', vaccineName: 'Hepatitis B', doseLabel: 'Birth dose', atBirth: true },
  { code: 'opv_0', vaccineName: 'OPV', doseLabel: 'Zero dose', atBirth: true },
  { code: 'hexa_1', vaccineName: 'DTaP + IPV + Hib ± Hep B', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'rvv_1', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'pcv_1', vaccineName: 'PCV', doseLabel: 'Dose 1', dueWeeks: 6 },
  { code: 'hexa_2', vaccineName: 'DTaP + IPV + Hib ± Hep B', doseLabel: 'Dose 2', dueWeeks: 10 },
  { code: 'rvv_2', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 2', dueWeeks: 10 },
  { code: 'pcv_2', vaccineName: 'PCV', doseLabel: 'Dose 2', dueWeeks: 10 },
  { code: 'hexa_3', vaccineName: 'DTaP + IPV + Hib ± Hep B', doseLabel: 'Dose 3', dueWeeks: 14 },
  { code: 'rvv_3', vaccineName: 'Rotavirus vaccine', doseLabel: 'Dose 3', dueWeeks: 14 },
  { code: 'pcv_3', vaccineName: 'PCV', doseLabel: 'Dose 3', dueWeeks: 14, optional: true, note: 'Depends on product schedule used by the pediatrician.' },
  { code: 'influenza_1', vaccineName: 'Influenza', doseLabel: 'Dose 1', dueMonths: 6 },
  { code: 'influenza_2', vaccineName: 'Influenza', doseLabel: 'Dose 2', dueMonths: 7 },
  { code: 'mmr_1', vaccineName: 'MMR', doseLabel: 'Dose 1', dueMonths: 9 },
  { code: 'hep_a_1', vaccineName: 'Hepatitis A', doseLabel: 'Dose 1', dueMonths: 12 },
  { code: 'varicella_1', vaccineName: 'Varicella', doseLabel: 'Dose 1', dueMonths: 15 },
  { code: 'mmr_2', vaccineName: 'MMR', doseLabel: 'Dose 2', dueMonths: 15 },
  { code: 'pcv_booster', vaccineName: 'PCV', doseLabel: 'Booster', dueMonths: 15 },
  { code: 'dtap_booster_1', vaccineName: 'DTaP booster', doseLabel: 'Booster 1', dueMonths: 18 },
  { code: 'ipv_booster_1', vaccineName: 'IPV', doseLabel: 'Booster', dueMonths: 18 },
  { code: 'hib_booster', vaccineName: 'Hib', doseLabel: 'Booster', dueMonths: 18 },
  { code: 'hep_a_2', vaccineName: 'Hepatitis A', doseLabel: 'Dose 2', dueMonths: 18 },
  { code: 'typhoid_tcv', vaccineName: 'Typhoid conjugate vaccine', doseLabel: 'Single dose', dueYears: 2 },
  { code: 'dtap_booster_2', vaccineName: 'DTaP booster', doseLabel: 'Booster 2', dueYears: 5 },
  { code: 'opv_booster', vaccineName: 'OPV', doseLabel: 'Booster', dueYears: 5, optional: true },
  { code: 'mmr_3', vaccineName: 'MMR', doseLabel: 'Dose 3', dueYears: 5 },
  { code: 'varicella_2', vaccineName: 'Varicella', doseLabel: 'Dose 2', dueYears: 5 },
  { code: 'hpv_1', vaccineName: 'HPV', doseLabel: 'Dose 1', dueYears: 9 },
  { code: 'hpv_2', vaccineName: 'HPV', doseLabel: 'Dose 2', dueYears: 10 },
  { code: 'tdap_10y', vaccineName: 'Tdap/Td', doseLabel: '10 years', dueYears: 10 },
  { code: 'tdap_16y', vaccineName: 'Tdap/Td', doseLabel: '16 years', dueYears: 16 },
]

function startOfDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date, months) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function addYears(date, years) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + years)
  return next
}

function calculateAgeMonths(dateOfBirth, referenceDate) {
  const dob = startOfDay(dateOfBirth)
  const ref = startOfDay(referenceDate)
  if (!dob || !ref || ref < dob) return null
  const diffDays = Math.max(0, Math.round((ref.getTime() - dob.getTime()) / 86400000))
  return Number((diffDays / 30.4375).toFixed(2))
}

function calculateAgeDays(dateOfBirth, referenceDate) {
  const dob = startOfDay(dateOfBirth)
  const ref = startOfDay(referenceDate)
  if (!dob || !ref || ref < dob) return null
  return Math.max(0, Math.round((ref.getTime() - dob.getTime()) / 86400000))
}

function computeDueDate(dateOfBirth, scheduleItem) {
  const dob = startOfDay(dateOfBirth)
  if (!dob) return null
  if (scheduleItem.atBirth) return dob
  if (Number.isFinite(scheduleItem.dueWeeks)) return addDays(dob, scheduleItem.dueWeeks * 7)
  if (Number.isFinite(scheduleItem.dueMonths)) return addMonths(dob, scheduleItem.dueMonths)
  if (Number.isFinite(scheduleItem.dueYears)) return addYears(dob, scheduleItem.dueYears)
  return null
}

function formatDateOnly(value) {
  const date = startOfDay(value)
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

function buildDueVaccines({ scheduleType, scheduleItems, dateOfBirth, administeredRecords = [], referenceDate = new Date() }) {
  const today = startOfDay(referenceDate)
  const dob = startOfDay(dateOfBirth)
  if (!dob || !today) {
    return {
      scheduleType,
      growthAgeMonths: null,
      dueToday: [],
      overdue: [],
      upcoming: [],
      completed: administeredRecords,
    }
  }

  const administeredKeys = new Set(
    administeredRecords.map((record) => `${String(record.vaccine_code || '').trim().toLowerCase()}::${String(record.dose_label || '').trim().toLowerCase()}`),
  )

  const dueToday = []
  const overdue = []
  const upcoming = []

  scheduleItems.forEach((item) => {
    const key = `${item.code}::${String(item.doseLabel || '').trim().toLowerCase()}`
    if (administeredKeys.has(key)) return
    const dueDate = computeDueDate(dob, item)
    if (!dueDate) return
    const payload = {
      ...item,
      dueDate: formatDateOnly(dueDate),
      ageDaysAtDue: calculateAgeDays(dob, dueDate),
      ageMonthsAtDue: calculateAgeMonths(dob, dueDate),
      timingLabel: item.atBirth
        ? 'At birth'
        : Number.isFinite(item.dueWeeks)
          ? `${item.dueWeeks} weeks`
          : Number.isFinite(item.dueMonths)
            ? `${item.dueMonths} months`
            : `${item.dueYears} years`,
    }
    const deltaDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000)
    if (deltaDays === 0) {
      dueToday.push(payload)
    } else if (deltaDays < 0) {
      overdue.push(payload)
    } else if (deltaDays <= 90) {
      upcoming.push(payload)
    }
  })

  return {
    scheduleType,
    growthAgeMonths: calculateAgeMonths(dob, today),
    dueToday,
    overdue,
    upcoming,
    completed: administeredRecords,
  }
}

function buildUipDueVaccines(input) {
  return buildDueVaccines({ scheduleType: 'UIP', scheduleItems: UIP_SCHEDULE, ...input })
}

function buildIapDueVaccines(input) {
  return buildDueVaccines({ scheduleType: 'IAP', scheduleItems: IAP_SCHEDULE, ...input })
}

module.exports = {
  UIP_SCHEDULE,
  IAP_SCHEDULE,
  calculateAgeMonths,
  calculateAgeDays,
  computeDueDate,
  buildDueVaccines,
  buildUipDueVaccines,
  buildIapDueVaccines,
}
