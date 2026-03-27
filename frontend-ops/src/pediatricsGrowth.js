const WHO_GROWTH_ANCHORS = {
  weight: {
    boys: [
      { ageMonths: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.3 },
      { ageMonths: 6, p3: 6.4, p15: 7.3, p50: 7.9, p85: 8.8, p97: 9.3 },
      { ageMonths: 12, p3: 7.6, p15: 8.6, p50: 9.6, p85: 10.8, p97: 11.5 },
      { ageMonths: 18, p3: 8.4, p15: 9.6, p50: 10.9, p85: 12.4, p97: 13.3 },
      { ageMonths: 24, p3: 9.0, p15: 10.3, p50: 11.8, p85: 13.5, p97: 14.7 },
      { ageMonths: 30, p3: 9.6, p15: 11.0, p50: 12.7, p85: 14.6, p97: 15.9 },
      { ageMonths: 36, p3: 10.1, p15: 11.6, p50: 13.3, p85: 15.4, p97: 16.9 },
      { ageMonths: 42, p3: 10.5, p15: 12.1, p50: 13.9, p85: 16.2, p97: 17.8 },
      { ageMonths: 48, p3: 10.9, p15: 12.5, p50: 14.4, p85: 16.9, p97: 18.6 },
      { ageMonths: 54, p3: 11.3, p15: 12.9, p50: 14.9, p85: 17.5, p97: 19.3 },
      { ageMonths: 60, p3: 11.5, p15: 13.3, p50: 15.3, p85: 18.0, p97: 19.9 },
    ],
    girls: [
      { ageMonths: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
      { ageMonths: 6, p3: 5.8, p15: 6.7, p50: 7.3, p85: 8.2, p97: 8.8 },
      { ageMonths: 12, p3: 6.9, p15: 7.9, p50: 8.9, p85: 10.1, p97: 10.8 },
      { ageMonths: 18, p3: 7.8, p15: 9.0, p50: 10.2, p85: 11.7, p97: 12.7 },
      { ageMonths: 24, p3: 8.4, p15: 9.8, p50: 11.1, p85: 12.8, p97: 14.0 },
      { ageMonths: 30, p3: 9.1, p15: 10.4, p50: 11.9, p85: 13.8, p97: 15.1 },
      { ageMonths: 36, p3: 9.6, p15: 10.9, p50: 12.5, p85: 14.5, p97: 16.0 },
      { ageMonths: 42, p3: 10.0, p15: 11.4, p50: 13.0, p85: 15.3, p97: 16.9 },
      { ageMonths: 48, p3: 10.4, p15: 11.8, p50: 13.5, p85: 16.0, p97: 17.8 },
      { ageMonths: 54, p3: 10.8, p15: 12.3, p50: 14.0, p85: 16.7, p97: 18.6 },
      { ageMonths: 60, p3: 11.1, p15: 12.7, p50: 14.4, p85: 17.3, p97: 19.3 },
    ],
  },
  height: {
    boys: [
      { ageMonths: 0, p3: 46.1, p15: 48.0, p50: 49.9, p85: 51.8, p97: 53.7 },
      { ageMonths: 6, p3: 62.9, p15: 65.0, p50: 67.6, p85: 70.2, p97: 72.3 },
      { ageMonths: 12, p3: 71.0, p15: 73.4, p50: 76.1, p85: 78.9, p97: 81.2 },
      { ageMonths: 18, p3: 77.2, p15: 79.8, p50: 82.7, p85: 85.6, p97: 88.2 },
      { ageMonths: 24, p3: 81.7, p15: 84.5, p50: 87.8, p85: 91.1, p97: 93.9 },
      { ageMonths: 30, p3: 85.1, p15: 88.1, p50: 91.9, p85: 95.7, p97: 98.7 },
      { ageMonths: 36, p3: 88.1, p15: 91.2, p50: 95.1, p85: 99.1, p97: 102.3 },
      { ageMonths: 42, p3: 90.8, p15: 94.1, p50: 98.3, p85: 102.5, p97: 105.8 },
      { ageMonths: 48, p3: 93.1, p15: 96.7, p50: 101.3, p85: 105.8, p97: 109.4 },
      { ageMonths: 54, p3: 95.2, p15: 99.0, p50: 103.9, p85: 108.7, p97: 112.4 },
      { ageMonths: 60, p3: 97.1, p15: 101.2, p50: 106.0, p85: 111.0, p97: 115.0 },
      { ageMonths: 72, p3: 102.0, p15: 106.4, p50: 111.8, p85: 117.4, p97: 122.0 },
      { ageMonths: 84, p3: 106.6, p15: 111.6, p50: 118.0, p85: 124.6, p97: 129.4 },
      { ageMonths: 96, p3: 110.9, p15: 116.6, p50: 123.9, p85: 131.4, p97: 136.6 },
      { ageMonths: 108, p3: 115.3, p15: 121.8, p50: 129.8, p85: 138.4, p97: 144.1 },
      { ageMonths: 120, p3: 120.1, p15: 127.0, p50: 136.1, p85: 145.8, p97: 151.8 },
      { ageMonths: 132, p3: 125.3, p15: 132.7, p50: 142.8, p85: 153.6, p97: 160.2 },
      { ageMonths: 144, p3: 131.0, p15: 138.7, p50: 149.8, p85: 161.7, p97: 168.7 },
      { ageMonths: 156, p3: 136.8, p15: 144.8, p50: 156.7, p85: 169.8, p97: 177.4 },
      { ageMonths: 168, p3: 141.8, p15: 150.3, p50: 163.0, p85: 177.0, p97: 185.3 },
      { ageMonths: 180, p3: 145.2, p15: 154.0, p50: 168.3, p85: 183.5, p97: 192.0 },
      { ageMonths: 192, p3: 147.8, p15: 156.6, p50: 172.1, p85: 188.1, p97: 196.4 },
      { ageMonths: 204, p3: 149.5, p15: 158.4, p50: 174.5, p85: 191.0, p97: 199.3 },
      { ageMonths: 216, p3: 150.5, p15: 159.4, p50: 176.0, p85: 192.8, p97: 201.2 },
      { ageMonths: 228, p3: 151.2, p15: 160.1, p50: 176.9, p85: 193.9, p97: 202.3 },
    ],
    girls: [
      { ageMonths: 0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
      { ageMonths: 6, p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.3 },
      { ageMonths: 12, p3: 69.2, p15: 71.4, p50: 74.0, p85: 76.6, p97: 78.9 },
      { ageMonths: 18, p3: 75.0, p15: 77.8, p50: 80.7, p85: 83.8, p97: 86.6 },
      { ageMonths: 24, p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.7, p97: 92.9 },
      { ageMonths: 30, p3: 83.6, p15: 87.0, p50: 90.7, p85: 94.5, p97: 97.9 },
      { ageMonths: 36, p3: 86.5, p15: 90.0, p50: 94.1, p85: 98.1, p97: 101.6 },
      { ageMonths: 42, p3: 88.9, p15: 92.5, p50: 96.9, p85: 101.3, p97: 104.9 },
      { ageMonths: 48, p3: 91.0, p15: 94.9, p50: 99.5, p85: 104.2, p97: 108.0 },
      { ageMonths: 54, p3: 93.0, p15: 96.9, p50: 102.0, p85: 107.0, p97: 111.0 },
      { ageMonths: 60, p3: 94.8, p15: 98.9, p50: 104.2, p85: 109.4, p97: 113.7 },
      { ageMonths: 72, p3: 99.9, p15: 104.4, p50: 110.8, p85: 117.1, p97: 121.8 },
      { ageMonths: 84, p3: 104.9, p15: 109.8, p50: 117.0, p85: 123.9, p97: 129.0 },
      { ageMonths: 96, p3: 109.9, p15: 115.2, p50: 123.5, p85: 131.1, p97: 136.7 },
      { ageMonths: 108, p3: 115.3, p15: 120.9, p50: 130.5, p85: 138.5, p97: 144.5 },
      { ageMonths: 120, p3: 121.1, p15: 126.8, p50: 137.5, p85: 146.0, p97: 152.4 },
      { ageMonths: 132, p3: 127.2, p15: 132.8, p50: 144.0, p85: 153.0, p97: 159.4 },
      { ageMonths: 144, p3: 132.9, p15: 138.5, p50: 149.8, p85: 158.8, p97: 165.0 },
      { ageMonths: 156, p3: 137.5, p15: 143.1, p50: 154.3, p85: 163.1, p97: 169.0 },
      { ageMonths: 168, p3: 140.6, p15: 146.1, p50: 157.1, p85: 165.7, p97: 171.2 },
      { ageMonths: 180, p3: 142.2, p15: 147.7, p50: 158.7, p85: 167.1, p97: 172.2 },
      { ageMonths: 192, p3: 143.1, p15: 148.5, p50: 159.6, p85: 167.9, p97: 172.8 },
      { ageMonths: 204, p3: 143.6, p15: 149.0, p50: 160.1, p85: 168.3, p97: 173.1 },
      { ageMonths: 216, p3: 143.9, p15: 149.2, p50: 160.4, p85: 168.5, p97: 173.2 },
      { ageMonths: 228, p3: 144.0, p15: 149.3, p50: 160.5, p85: 168.6, p97: 173.3 },
    ],
  },
  bmi: {
    boys: [
      { ageMonths: 24, p3: 13.3, p15: 14.1, p50: 16.5, p85: 19.3, p97: 20.7 },
      { ageMonths: 36, p3: 13.1, p15: 13.9, p50: 16.0, p85: 18.6, p97: 20.0 },
      { ageMonths: 48, p3: 12.9, p15: 13.7, p50: 15.7, p85: 18.0, p97: 19.3 },
      { ageMonths: 60, p3: 12.8, p15: 13.6, p50: 15.4, p85: 17.5, p97: 18.8 },
      { ageMonths: 72, p3: 12.8, p15: 13.5, p50: 15.3, p85: 17.3, p97: 18.6 },
      { ageMonths: 84, p3: 12.8, p15: 13.5, p50: 15.4, p85: 17.5, p97: 18.9 },
      { ageMonths: 96, p3: 12.9, p15: 13.7, p50: 15.8, p85: 18.3, p97: 19.8 },
      { ageMonths: 108, p3: 13.2, p15: 14.1, p50: 16.4, p85: 19.4, p97: 21.0 },
      { ageMonths: 120, p3: 13.6, p15: 14.5, p50: 17.0, p85: 20.3, p97: 22.0 },
      { ageMonths: 132, p3: 14.0, p15: 15.1, p50: 17.8, p85: 21.4, p97: 23.3 },
      { ageMonths: 144, p3: 14.5, p15: 15.6, p50: 18.5, p85: 22.5, p97: 24.6 },
      { ageMonths: 156, p3: 14.9, p15: 16.2, p50: 19.3, p85: 23.8, p97: 26.0 },
      { ageMonths: 168, p3: 15.4, p15: 16.7, p50: 20.1, p85: 25.0, p97: 27.2 },
      { ageMonths: 180, p3: 15.8, p15: 17.2, p50: 20.8, p85: 26.0, p97: 28.1 },
      { ageMonths: 192, p3: 16.2, p15: 17.6, p50: 21.4, p85: 26.8, p97: 29.0 },
      { ageMonths: 204, p3: 16.5, p15: 18.0, p50: 21.9, p85: 27.5, p97: 29.7 },
      { ageMonths: 216, p3: 16.8, p15: 18.3, p50: 22.3, p85: 28.0, p97: 30.4 },
      { ageMonths: 228, p3: 17.0, p15: 18.6, p50: 22.6, p85: 28.4, p97: 30.8 },
    ],
    girls: [
      { ageMonths: 24, p3: 13.2, p15: 14.0, p50: 16.4, p85: 19.3, p97: 20.7 },
      { ageMonths: 36, p3: 12.8, p15: 13.7, p50: 15.8, p85: 18.3, p97: 19.7 },
      { ageMonths: 48, p3: 12.8, p15: 13.6, p50: 15.5, p85: 17.8, p97: 19.0 },
      { ageMonths: 60, p3: 12.7, p15: 13.5, p50: 15.4, p85: 17.4, p97: 18.8 },
      { ageMonths: 72, p3: 12.7, p15: 13.4, p50: 15.3, p85: 17.2, p97: 18.6 },
      { ageMonths: 84, p3: 12.6, p15: 13.4, p50: 15.5, p85: 17.8, p97: 19.4 },
      { ageMonths: 96, p3: 12.8, p15: 13.6, p50: 16.0, p85: 18.7, p97: 20.4 },
      { ageMonths: 108, p3: 13.2, p15: 14.1, p50: 16.8, p85: 19.9, p97: 21.7 },
      { ageMonths: 120, p3: 13.7, p15: 14.7, p50: 17.7, p85: 21.2, p97: 23.1 },
      { ageMonths: 132, p3: 14.3, p15: 15.4, p50: 18.7, p85: 22.6, p97: 24.7 },
      { ageMonths: 144, p3: 15.0, p15: 16.1, p50: 19.7, p85: 24.1, p97: 26.4 },
      { ageMonths: 156, p3: 15.6, p15: 16.8, p50: 20.7, p85: 25.5, p97: 27.9 },
      { ageMonths: 168, p3: 16.2, p15: 17.3, p50: 21.6, p85: 26.5, p97: 28.9 },
      { ageMonths: 180, p3: 16.7, p15: 17.8, p50: 22.3, p85: 27.2, p97: 29.5 },
      { ageMonths: 192, p3: 17.1, p15: 18.2, p50: 22.8, p85: 27.6, p97: 29.7 },
      { ageMonths: 204, p3: 17.4, p15: 18.4, p50: 23.0, p85: 27.7, p97: 29.5 },
      { ageMonths: 216, p3: 17.4, p15: 18.4, p50: 23.0, p85: 27.5, p97: 29.2 },
      { ageMonths: 228, p3: 17.2, p15: 18.3, p50: 22.8, p85: 27.1, p97: 28.7 },
    ],
  },
  headCircumference: {
    boys: [
      { ageMonths: 0, p3: 31.9, p15: 32.8, p50: 34.5, p85: 36.2, p97: 37.0 },
      { ageMonths: 6, p3: 40.9, p15: 41.7, p50: 43.3, p85: 44.9, p97: 45.7 },
      { ageMonths: 12, p3: 43.0, p15: 43.8, p50: 45.0, p85: 46.3, p97: 47.0 },
      { ageMonths: 18, p3: 44.0, p15: 44.7, p50: 45.9, p85: 47.1, p97: 47.8 },
      { ageMonths: 24, p3: 44.7, p15: 45.4, p50: 46.5, p85: 47.6, p97: 48.3 },
      { ageMonths: 30, p3: 45.1, p15: 45.8, p50: 46.9, p85: 48.0, p97: 48.6 },
      { ageMonths: 36, p3: 45.4, p15: 46.1, p50: 47.1, p85: 48.2, p97: 48.8 },
      { ageMonths: 42, p3: 45.6, p15: 46.3, p50: 47.3, p85: 48.3, p97: 48.9 },
      { ageMonths: 48, p3: 45.8, p15: 46.4, p50: 47.4, p85: 48.4, p97: 49.0 },
      { ageMonths: 54, p3: 45.9, p15: 46.6, p50: 47.5, p85: 48.5, p97: 49.1 },
      { ageMonths: 60, p3: 46.0, p15: 46.6, p50: 47.6, p85: 48.6, p97: 49.1 },
    ],
    girls: [
      { ageMonths: 0, p3: 31.7, p15: 32.5, p50: 34.2, p85: 35.8, p97: 36.6 },
      { ageMonths: 6, p3: 39.8, p15: 40.7, p50: 42.2, p85: 43.8, p97: 44.6 },
      { ageMonths: 12, p3: 42.0, p15: 42.8, p50: 44.0, p85: 45.2, p97: 46.0 },
      { ageMonths: 18, p3: 43.0, p15: 43.8, p50: 44.9, p85: 46.1, p97: 46.8 },
      { ageMonths: 24, p3: 43.6, p15: 44.4, p50: 45.4, p85: 46.6, p97: 47.2 },
      { ageMonths: 30, p3: 44.0, p15: 44.7, p50: 45.8, p85: 46.9, p97: 47.5 },
      { ageMonths: 36, p3: 44.2, p15: 44.9, p50: 46.0, p85: 47.0, p97: 47.7 },
      { ageMonths: 42, p3: 44.4, p15: 45.1, p50: 46.1, p85: 47.1, p97: 47.8 },
      { ageMonths: 48, p3: 44.6, p15: 45.2, p50: 46.2, p85: 47.2, p97: 47.9 },
      { ageMonths: 54, p3: 44.7, p15: 45.4, p50: 46.3, p85: 47.3, p97: 47.9 },
      { ageMonths: 60, p3: 44.8, p15: 45.4, p50: 46.4, p85: 47.3, p97: 48.0 },
    ],
  },
}

export const WHO_UNDER5_MAX_MONTHS = 60
export const WHO_OLDER_CHILD_MAX_MONTHS = 228
export const WHO_BMI_MIN_MONTHS = 24
export const WHO_HEAD_CIRCUMFERENCE_EMPHASIS_MAX_MONTHS = 24

const METRIC_SUPPORT = {
  weight: { min: 0, max: WHO_UNDER5_MAX_MONTHS },
  height: { min: 0, max: WHO_OLDER_CHILD_MAX_MONTHS },
  bmi: { min: WHO_BMI_MIN_MONTHS, max: WHO_OLDER_CHILD_MAX_MONTHS },
  headCircumference: { min: 0, max: WHO_UNDER5_MAX_MONTHS },
}

export const WHO_GROSS_MOTOR_MILESTONES = [
  { key: 'sittingWithoutSupport', label: 'Sitting without support', startMonths: 3.8, endMonths: 9.2 },
  { key: 'standingWithAssistance', label: 'Standing with assistance', startMonths: 4.8, endMonths: 11.4 },
  { key: 'handsAndKneesCrawling', label: 'Hands-and-knees crawling', startMonths: 5.2, endMonths: 13.5 },
  { key: 'walkingWithAssistance', label: 'Walking with assistance', startMonths: 5.9, endMonths: 13.7 },
  { key: 'standingAlone', label: 'Standing alone', startMonths: 6.9, endMonths: 16.9 },
  { key: 'walkingAlone', label: 'Walking alone', startMonths: 8.2, endMonths: 17.6 },
]

export function normalizeGrowthSex(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'boys' || normalized === 'girls') return normalized
  if (normalized === 'male' || normalized === 'm' || normalized === 'boy') return 'boys'
  if (normalized === 'female' || normalized === 'f' || normalized === 'girl') return 'girls'
  return null
}

export function calculateAgeMonths(dateOfBirth, referenceDate) {
  const dob = new Date(dateOfBirth)
  const ref = new Date(referenceDate)
  if (Number.isNaN(dob.getTime()) || Number.isNaN(ref.getTime()) || ref < dob) return null
  return Number((((ref.getTime() - dob.getTime()) / 86400000) / 30.4375).toFixed(2))
}

function interpolatePoint(points, ageMonths) {
  if (!Array.isArray(points) || !points.length || ageMonths === null || ageMonths === undefined) return null
  if (ageMonths <= points[0].ageMonths) return points[0]
  if (ageMonths >= points[points.length - 1].ageMonths) return points[points.length - 1]
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index]
    const right = points[index + 1]
    if (ageMonths >= left.ageMonths && ageMonths <= right.ageMonths) {
      const ratio = (ageMonths - left.ageMonths) / (right.ageMonths - left.ageMonths)
      return {
        ageMonths,
        p3: left.p3 + (right.p3 - left.p3) * ratio,
        p15: left.p15 + (right.p15 - left.p15) * ratio,
        p50: left.p50 + (right.p50 - left.p50) * ratio,
        p85: left.p85 + (right.p85 - left.p85) * ratio,
        p97: left.p97 + (right.p97 - left.p97) * ratio,
      }
    }
  }
  return null
}

export function getMetricSupport(metric) {
  return METRIC_SUPPORT[metric] || null
}

export function getGrowthReference(metric, sex, ageMonths) {
  const support = getMetricSupport(metric)
  if (!support || !Number.isFinite(ageMonths) || ageMonths < support.min || ageMonths > support.max) return null
  const points = WHO_GROWTH_ANCHORS[metric]?.[sex]
  if (!points?.length) return null
  return interpolatePoint(points, ageMonths)
}

export function classifyGrowthMeasurement(metric, sex, ageMonths, value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return null
  const reference = getGrowthReference(metric, sex, ageMonths)
  if (!reference) return null
  let band = 'Around WHO median'
  let zone = 'median'
  if (numericValue < reference.p3) {
    band = metric === 'bmi' ? 'Below WHO 3rd percentile BMI range' : 'Below WHO 3rd percentile'
    zone = 'low'
  } else if (numericValue < reference.p15) {
    band = metric === 'bmi' ? 'Between WHO 3rd and 15th percentile BMI range' : 'Between WHO 3rd and 15th percentile'
    zone = 'watch-low'
  } else if (numericValue <= reference.p85) {
    band = metric === 'bmi' ? 'Between WHO 15th and 85th percentile BMI range' : 'Between WHO 15th and 85th percentile'
    zone = 'expected'
  } else if (numericValue <= reference.p97) {
    band = metric === 'bmi' ? 'Between WHO 85th and 97th percentile BMI range' : 'Between WHO 85th and 97th percentile'
    zone = 'watch-high'
  } else {
    band = metric === 'bmi' ? 'Above WHO 97th percentile BMI range' : 'Above WHO 97th percentile'
    zone = 'high'
  }
  return { band, zone, reference }
}

export function buildMeasurementHistory(history = []) {
  return history
    .map((item) => ({
      ageMonths: Number(item.age_months),
      measuredAt: item.measured_at || item.created_at,
      weightKg: item.weight_kg === null || item.weight_kg === undefined ? null : Number(item.weight_kg),
      heightCm: item.height_cm === null || item.height_cm === undefined ? null : Number(item.height_cm),
      headCircumferenceCm: item.head_circumference_cm === null || item.head_circumference_cm === undefined ? null : Number(item.head_circumference_cm),
      bmi: item.bmi === null || item.bmi === undefined ? null : Number(item.bmi),
    }))
    .filter((item) => Number.isFinite(item.ageMonths))
    .sort((a, b) => a.ageMonths - b.ageMonths)
}

export function buildDraftMeasurement(form = {}, dateOfBirth = '', measuredAt = new Date().toISOString()) {
  const ageMonths = calculateAgeMonths(dateOfBirth, measuredAt)
  if (ageMonths === null) return null
  const weightKg = form.weightKg === '' ? null : Number(form.weightKg)
  const heightCm = form.heightCm === '' ? null : Number(form.heightCm)
  return {
    ageMonths,
    measuredAt,
    weightKg,
    heightCm,
    headCircumferenceCm: form.headCircumferenceCm === '' ? null : Number(form.headCircumferenceCm),
    bmi: Number.isFinite(weightKg) && Number.isFinite(heightCm) && heightCm > 0
      ? Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(2))
      : null,
  }
}

export function buildChartSeries(metric, sex, history = [], draftMeasurement = null) {
  const points = WHO_GROWTH_ANCHORS[metric]?.[sex] || []
  const patientPoints = [...history]
  if (draftMeasurement && Number.isFinite(draftMeasurement.ageMonths)) {
    patientPoints.push(draftMeasurement)
  }
  const patientKey =
    metric === 'weight'
      ? 'weightKg'
      : metric === 'height'
        ? 'heightCm'
        : metric === 'bmi'
          ? 'bmi'
          : 'headCircumferenceCm'
  const maxPatientMonths = patientPoints.reduce((max, item) => Math.max(max, Number(item?.ageMonths) || 0), 0)
  const support = getMetricSupport(metric)
  return {
    referencePoints: points,
    patientPoints: patientPoints
      .filter((item) => Number.isFinite(item?.ageMonths) && Number.isFinite(item?.[patientKey]))
      .sort((a, b) => a.ageMonths - b.ageMonths),
    patientKey,
    minMonths: support?.min || 0,
    maxMonths: Math.max(support?.max || WHO_UNDER5_MAX_MONTHS, Math.ceil(maxPatientMonths / 12) * 12 || WHO_UNDER5_MAX_MONTHS),
  }
}

export function summarizeGrowthAssessment(metric, assessment, ageMonths = null) {
  if (assessment?.band) return assessment.band
  if (!Number.isFinite(ageMonths)) return 'Add DOB, sex, and measurement to compare against the WHO curve.'
  if (metric === 'bmi' && ageMonths < WHO_BMI_MIN_MONTHS) return 'BMI-for-age comparison starts from 24 months.'
  if (metric === 'bmi' && ageMonths > WHO_OLDER_CHILD_MAX_MONTHS) return 'BMI trend recorded beyond the supported WHO 2–19 year reference.'
  if (metric === 'height' && ageMonths > WHO_OLDER_CHILD_MAX_MONTHS) {
    return 'Height trend recorded beyond the supported WHO 0–19 year reference.'
  }
  if (metric === 'headCircumference' && ageMonths > WHO_HEAD_CIRCUMFERENCE_EMPHASIS_MAX_MONTHS) {
    return 'Head circumference trend is shown; interpretation is most useful in infancy and early toddler years.'
  }
  if (metric === 'weight' && ageMonths > WHO_UNDER5_MAX_MONTHS) {
    return 'Weight trend is shown; this build keeps WHO weight-for-age comparison focused on under-5 reference curves.'
  }
  if (metric === 'height' && ageMonths > WHO_UNDER5_MAX_MONTHS) {
    return 'Height-for-age comparison is active through the WHO 5–19 reference range in this build.'
  }
  if (metric !== 'bmi' && metric !== 'height' && ageMonths > WHO_UNDER5_MAX_MONTHS) {
    return 'Longitudinal trend is shown; WHO percentile comparison in this build is focused on under-5 reference curves.'
  }
  return 'Add the measurement to compare against the WHO curve.'
}

export function assessDevelopmentMilestone({ status = '', achievedDate = '', dateOfBirth = '', referenceDate = new Date().toISOString(), milestone }) {
  const currentAgeMonths = calculateAgeMonths(dateOfBirth, referenceDate)
  if (!milestone || currentAgeMonths === null) {
    return {
      zone: 'neutral',
      label: 'Add DOB to evaluate this milestone.',
      achievedAgeMonths: null,
      currentAgeMonths,
    }
  }
  const achievedAgeMonths = achievedDate ? calculateAgeMonths(dateOfBirth, achievedDate) : null
  if (String(status).trim().toLowerCase() === 'achieved' && achievedAgeMonths !== null) {
    if (achievedAgeMonths > milestone.endMonths) {
      return {
        zone: 'watch-high',
        label: `Achieved at ${achievedAgeMonths.toFixed(1)} months, later than the WHO window ending around ${milestone.endMonths} months.`,
        achievedAgeMonths,
        currentAgeMonths,
      }
    }
    return {
      zone: 'expected',
      label: `Achieved at ${achievedAgeMonths.toFixed(1)} months within the WHO achievement window.`,
      achievedAgeMonths,
      currentAgeMonths,
    }
  }
  if (String(status).trim().toLowerCase() === 'concern') {
    return {
      zone: 'high',
      label: 'Marked as a developmental concern for this visit.',
      achievedAgeMonths,
      currentAgeMonths,
    }
  }
  if (currentAgeMonths < milestone.startMonths) {
    return {
      zone: 'neutral',
      label: `Usually begins around ${milestone.startMonths} months. Still early for this milestone.`,
      achievedAgeMonths,
      currentAgeMonths,
    }
  }
  if (currentAgeMonths <= milestone.endMonths) {
    return {
      zone: 'watch-low',
      label: `Expected window is about ${milestone.startMonths}–${milestone.endMonths} months. Observe and document if achieved.`,
      achievedAgeMonths,
      currentAgeMonths,
    }
  }
  return {
    zone: 'high',
    label: `Past the WHO achievement window ending around ${milestone.endMonths} months. Review for developmental delay.`,
    achievedAgeMonths,
    currentAgeMonths,
  }
}
