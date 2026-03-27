const PAD = { top: 18, right: 18, bottom: 42, left: 46 }
const WIDTH = 420
const HEIGHT = 220

function linePoints(points, getX, getY) {
  return points.map((point) => `${getX(point.ageMonths)},${getY(point.value)}`).join(' ')
}

function buildTickMonths(minMonths, maxMonths) {
  const range = maxMonths - minMonths
  const interval = range > 180 ? 36 : range > 96 ? 24 : range > 48 ? 12 : 6
  const ticks = []
  const start = Math.ceil(minMonths / interval) * interval
  for (let month = start; month <= maxMonths; month += interval) {
    ticks.push(month)
  }
  if (!ticks.includes(minMonths)) ticks.unshift(minMonths)
  if (!ticks.includes(maxMonths)) ticks.push(maxMonths)
  return [...new Set(ticks)].sort((a, b) => a - b)
}

function formatXAxisTick(month) {
  if (month < 24) return `${month}m`
  const years = Math.floor(month / 12)
  const remMonths = month % 12
  return remMonths ? `${years}y ${remMonths}m` : `${years}y`
}

export function PediatricGrowthChart({ title, unit, series, maxMonths = 60 }) {
  const referencePoints = series?.referencePoints || []
  const patientPoints = series?.patientPoints || []
  const patientKey = series?.patientKey
  const minMonths = Number(series?.minMonths) || 0
  const plottedMaxMonths = Math.max(maxMonths, Number(series?.maxMonths) || 0)

  if (!referencePoints.length) {
    return (
      <div className="doctor-workspace-card pediatric-growth-chart-card">
        <div className="section-head compact">
          <div>
            <p className="micro strong">{title}</p>
            <p className="micro">WHO reference not available for this graph yet.</p>
          </div>
        </div>
      </div>
    )
  }

  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const allValues = [
    ...referencePoints.flatMap((point) => [point.p3, point.p15, point.p50, point.p85, point.p97]),
    ...patientPoints.map((point) => Number(point?.[patientKey])).filter(Number.isFinite),
  ]
  const minValue = Math.min(...allValues)
  const maxValue = Math.max(...allValues)
  const range = Math.max(1, maxValue - minValue)
  const xRange = Math.max(1, plottedMaxMonths - minMonths)
  const x = (ageMonths) =>
    PAD.left + ((Math.min(plottedMaxMonths, Math.max(minMonths, ageMonths)) - minMonths) / xRange) * plotWidth
  const y = (value) => PAD.top + ((maxValue - value) / range) * plotHeight
  const tickMonths = buildTickMonths(minMonths, plottedMaxMonths)

  const bandPath = (upperKey, lowerKey) => {
    const upper = referencePoints.map((point) => `${x(point.ageMonths)},${y(point[upperKey])}`).join(' ')
    const lower = [...referencePoints]
      .reverse()
      .map((point) => `${x(point.ageMonths)},${y(point[lowerKey])}`)
      .join(' ')
    return `${upper} ${lower}`
  }

  const referenceLine = (key) => referencePoints.map((point) => ({ ageMonths: point.ageMonths, value: point[key] }))
  const patientLine = patientPoints.map((point) => ({ ageMonths: point.ageMonths, value: point[patientKey] }))

  return (
    <div className="doctor-workspace-card pediatric-growth-chart-card">
      <div className="section-head compact">
        <div>
          <p className="micro strong">{title}</p>
          <p className="micro">WHO 3rd / 15th / 50th / 85th / 97th percentile anchor curves with child trend overlay.</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="pediatric-growth-chart" role="img" aria-label={title}>
        <polygon points={bandPath('p97', 'p3')} className="pediatric-band pediatric-band-outer" />
        <polygon points={bandPath('p85', 'p15')} className="pediatric-band pediatric-band-inner" />
        <polyline points={linePoints(referenceLine('p3'), x, y)} className="pediatric-line pediatric-line-boundary" />
        <polyline points={linePoints(referenceLine('p15'), x, y)} className="pediatric-line pediatric-line-guide" />
        <polyline points={linePoints(referenceLine('p50'), x, y)} className="pediatric-line pediatric-line-median" />
        <polyline points={linePoints(referenceLine('p85'), x, y)} className="pediatric-line pediatric-line-guide" />
        <polyline points={linePoints(referenceLine('p97'), x, y)} className="pediatric-line pediatric-line-boundary" />
        {patientLine.length > 0 ? <polyline points={linePoints(patientLine, x, y)} className="pediatric-line pediatric-line-patient" /> : null}
        {patientLine.map((point, index) => (
          <circle key={`${title}-${index}`} cx={x(point.ageMonths)} cy={y(point.value)} r="3.5" className="pediatric-point" />
        ))}
        {tickMonths.map((month) => (
          <g key={`${title}-x-${month}`}>
            <line x1={x(month)} x2={x(month)} y1={PAD.top} y2={HEIGHT - PAD.bottom} className="pediatric-axis-grid" />
            <text x={x(month)} y={HEIGHT - 8} textAnchor="middle" className="pediatric-axis-label">{formatXAxisTick(month)}</text>
          </g>
        ))}
        {[minValue, minValue + range / 2, maxValue].map((value, index) => (
          <g key={`${title}-y-${index}`}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(value)} y2={y(value)} className="pediatric-axis-grid" />
            <text x={PAD.left - 8} y={y(value) + 4} textAnchor="end" className="pediatric-axis-label">{value.toFixed(1)}</text>
          </g>
        ))}
      </svg>
      <div className="pediatric-chart-caption">
        <span>Age in months</span>
        <span>{unit}</span>
      </div>
    </div>
  )
}
