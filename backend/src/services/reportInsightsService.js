const REPORT_CATALOG = {
  multi_panel: {
    label: "Comprehensive lab panel",
    keywords: [],
    metrics: [],
  },
  hba1c: {
    label: "HbA1c",
    keywords: ["hba1c", "hbalc", "hbatc", "hbate", "glycated hemoglobin", "glycosylated hemoglobin"],
    metrics: [
      { key: "hba1c", label: "HbA1c", unit: "%", low: 4.0, high: 5.6, trend: "lower_better" },
      { key: "estimated_average_glucose", label: "Estimated Average Glucose", unit: "mg/dL", low: 70, high: 140, trend: "lower_better" },
    ],
  },
  crp: {
    label: "CRP",
    keywords: ["crp", "c-reactive protein", "reactive protein"],
    metrics: [
      { key: "crp_quantitative", label: "CRP Quantitative", unit: "mg/L", low: 0, high: 6, trend: "lower_better" },
    ],
  },
  glucose: {
    label: "Blood Sugar",
    keywords: ["glucose", "blood sugar", "fbs", "ppbs", "rbs", "fasting sugar", "post prandial"],
    metrics: [
      { key: "fbs", label: "Fasting Blood Sugar", unit: "mg/dL", low: 70, high: 99, trend: "lower_better" },
      { key: "ppbs", label: "Post Prandial Blood Sugar", unit: "mg/dL", low: 70, high: 140, trend: "lower_better" },
      { key: "rbs", label: "Random Blood Sugar", unit: "mg/dL", low: 70, high: 140, trend: "lower_better" },
    ],
  },
  cbc: {
    label: "CBC",
    keywords: ["cbc", "complete blood count", "hemoglobin", "hb", "wbc", "platelet", "platelets"],
    metrics: [
      { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", low: 12, high: 16, trend: "higher_better" },
      { key: "rbc_count", label: "RBC Count", unit: "mill/cmm", low: 4.7, high: 6.0, trend: "range" },
      { key: "pcv", label: "PCV", unit: "%", low: 42, high: 52, trend: "range" },
      { key: "mcv", label: "MCV", unit: "fL", low: 78, high: 95, trend: "range" },
      { key: "mch", label: "MCH", unit: "pg", low: 27, high: 31, trend: "range" },
      { key: "mchc", label: "MCHC", unit: "%", low: 32, high: 36, trend: "range" },
      { key: "rdw", label: "RDW", unit: "fL", low: 11.5, high: 14.0, trend: "range" },
      { key: "wbc", label: "WBC", unit: "10^3/uL", low: 4, high: 11, trend: "range" },
      { key: "esr", label: "ESR", unit: "mm/hr", low: 0, high: 20, trend: "range" },
      { key: "platelets", label: "Platelets", unit: "10^3/uL", low: 150, high: 450, trend: "range" },
    ],
  },
  anthropometry: {
    label: "Anthropometry",
    keywords: ["bmi", "body mass index", "weight", "height"],
    metrics: [
      { key: "weight", label: "Weight", unit: "kg", low: 0, high: 200, trend: "range" },
      { key: "bmi", label: "BMI", unit: "kg/m²", low: 18.5, high: 24.9, trend: "range" },
    ],
  },
  lipid: {
    label: "Lipid Profile",
    keywords: ["lipid", "cholesterol", "ldl", "hdl", "triglycerides", "triglyceride"],
    metrics: [
      { key: "total_cholesterol", label: "Total Cholesterol", unit: "mg/dL", low: 0, high: 200, trend: "lower_better" },
      { key: "ldl", label: "LDL", unit: "mg/dL", low: 0, high: 100, trend: "lower_better" },
      { key: "hdl", label: "HDL", unit: "mg/dL", low: 40, high: 100, trend: "higher_better" },
      { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", low: 0, high: 150, trend: "lower_better" },
    ],
  },
  thyroid: {
    label: "Thyroid Profile",
    keywords: ["thyroid", "tsh", "t3", "t4", "ft3", "ft4"],
    metrics: [
      { key: "tsh", label: "TSH", unit: "uIU/mL", low: 0.4, high: 4.5, trend: "range" },
      { key: "t3", label: "T3", unit: "ng/dL", low: 80, high: 200, trend: "range" },
      { key: "t4", label: "T4", unit: "ug/dL", low: 5.1, high: 14.1, trend: "range" },
    ],
  },
  renal: {
    label: "Kidney / Renal Function",
    keywords: ["renal", "kidney", "creatinine", "urea", "uric acid", "kft", "rft"],
    metrics: [
      { key: "creatinine", label: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.2, trend: "lower_better" },
      { key: "urea", label: "Urea", unit: "mg/dL", low: 15, high: 40, trend: "range" },
      { key: "uric_acid", label: "Uric Acid", unit: "mg/dL", low: 3.5, high: 7.2, trend: "range" },
    ],
  },
  liver: {
    label: "Liver Function",
    keywords: ["liver", "bilirubin", "sgpt", "sgot", "alt", "ast", "lft"],
    metrics: [
      { key: "bilirubin_total", label: "Total Bilirubin", unit: "mg/dL", low: 0.2, high: 1.2, trend: "lower_better" },
      { key: "sgpt_alt", label: "SGPT / ALT", unit: "U/L", low: 0, high: 45, trend: "lower_better" },
      { key: "sgot_ast", label: "SGOT / AST", unit: "U/L", low: 0, high: 40, trend: "lower_better" },
    ],
  },
};

REPORT_CATALOG.multi_panel.metrics = Object.values(REPORT_CATALOG)
  .filter((item) => item !== REPORT_CATALOG.multi_panel)
  .flatMap((item) => item.metrics || [])
  .filter((metric, index, list) => list.findIndex((candidate) => candidate.key === metric.key) === index);

const EXTRACTION_PATTERNS = {
  hba1c: [
    /\bhba1c\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /\bhb[a4](?:1|l)[c0]\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /\bhbat[ce]\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /glyc(?:ated|osylated) hemoglobin[^\d]{0,12}(\d+(?:\.\d+)?)/i,
  ],
  estimated_average_glucose: [
    /estimated(?:\s+\w+){0,2}\s+average blood glucose[^\d]{0,20}(\d+(?:\.\d+)?)/i,
    /\beag\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
  ],
  crp_quantitative: [/\bcrp(?: quantitative)?\b[^\d]{0,16}(\d+(?:\.\d+)?)/i, /c-reactive protein[^\d]{0,16}(\d+(?:\.\d+)?)/i],
  fbs: [/\bfbs\b[^\d]{0,12}(\d+(?:\.\d+)?)/i, /fasting (?:blood )?(?:glucose|sugar)[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  ppbs: [
    /\bppbs\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /post[ -]?prandial (?:blood )?(?:glucose|sugar)[^\d]{0,18}(\d+(?:\.\d+)?)/i,
    /\bbees\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /\bpp\b[^\d]{0,8}(\d+(?:\.\d+)?)/i,
  ],
  rbs: [
    /\brbs\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /random (?:blood )?(?:glucose|sugar)[^\d]{0,18}(\d+(?:\.\d+)?)/i,
  ],
  hemoglobin: [
    /\bhemoglobin(?!\s*a1c)\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /\bhaemoglobin\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /\baemog(?:t|l)obin\b[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /\bhb\b[^\d]{0,8}(\d+(?:\.\d+)?)/i,
  ],
  rbc_count: [
    /r[\W_]*b(?:[\W_]*c)?[\W_,-]*count[^\d]{0,12}(\d+(?:\.\d+)?)/i,
  ],
  pcv: [/p\.?c\.?v[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  mcv: [/m\.?c\.?v[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  mch: [/m\.?c\.?h[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  mchc: [/m\.?c\.?h\.?c[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  rdw: [/r\.?d\.?w[^\d]{0,12}(\d+(?:\.\d+)?)/i, /\brow\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  wbc: [/\bwbc(?: count)?\b[^\d]{0,12}(\d+(?:\.\d+)?)/i, /total leukocyte count[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  esr: [
    /\besr[^\n]{0,80}?(\d+(?:\.\d+)?)\s*mm\s*\/?\s*hr/i,
    /\besr[^\n]{0,80}?(\d+(?:\.\d+)?)\s*mm/i,
    /\besr[^\n]{0,80}?(\d+(?:\.\d+)?)/i,
  ],
  platelets: [/\bplatelets?\b[^\d]{0,12}(\d+(?:\.\d+)?)/i, /platelet count[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  weight: [/\bweight\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  bmi: [/\bbmi\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  total_cholesterol: [/total cholesterol[^\d]{0,18}(\d+(?:\.\d+)?)/i, /[tf\[]etal cholesterol[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  ldl: [/\bldl\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  hdl: [/\bhdl\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  triglycerides: [/triglycerides?[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  tsh: [/\btsh\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  t3: [/\bt3\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  t4: [/\bt4\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  creatinine: [/creatinine[^\d]{0,18}(\d+(?:\.\d+)?)/i, /peatinine[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  urea: [/\burea\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
  uric_acid: [/uric acid[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  bilirubin_total: [/bilirubin(?: total)?[^\d]{0,18}(\d+(?:\.\d+)?)/i],
  sgpt_alt: [
    /\bsgpt\b[^\d]{0,24}(\d+(?:\.\d+)?)/i,
    /\balt\b[^\d]{0,24}(\d+(?:\.\d+)?)/i,
    /\baltu?[\W_]*sgpt[^\n]{0,80}/i,
  ],
  sgot_ast: [/\bsgot\b[^\d]{0,12}(\d+(?:\.\d+)?)/i, /\bast\b[^\d]{0,12}(\d+(?:\.\d+)?)/i],
};

const LAB_SOURCE_PATTERNS = [
  { key: "thyrocare", label: "Thyrocare", pattern: /\bthyrocare\b/i },
  { key: "drlal", label: "Dr Lal PathLabs", pattern: /\bdr\.?\s*lal\b|\blal pathlabs\b/i },
  { key: "metropolis", label: "Metropolis", pattern: /\bmetropolis\b/i },
  { key: "srl", label: "SRL", pattern: /\bsrl\b|\bsrl diagnostics\b/i },
];

const NORMALIZATION_REPLACEMENTS = [
  [/\bdr\.?\s*lal\s*pathlabs\b/gi, "dr lal pathlabs"],
  [/\bfasting blood sugar\b/gi, "fbs"],
  [/\bfasting plasma glucose\b/gi, "fbs"],
  [/\bpost[ -]?prandial blood sugar\b/gi, "ppbs"],
  [/\bpost[ -]?prandial plasma glucose\b/gi, "ppbs"],
  [/\brandom blood sugar\b/gi, "rbs"],
  [/\bglycosylated hemoglobin\b/gi, "hba1c"],
  [/\bglycated hemoglobin\b/gi, "hba1c"],
  [/\bhemoglobin\s*a1c\b/gi, "hba1c"],
  [/\bhaemoglobin\s*a1c\b/gi, "hba1c"],
  [/\bhbalc\b/gi, "hba1c"],
  [/\bfstimated\b/gi, "estimated"],
  [/\bestimated\s+\d+\s+average\b/gi, "estimated average"],
  [/\bhbatc\b/gi, "hba1c"],
  [/\bhbate\b/gi, "hba1c"],
  [/\bhbaic\b/gi, "hba1c"],
  [/\bhaemoglobin\b/gi, "hemoglobin"],
  [/\baemog(?:t|l)obin\b/gi, "hemoglobin"],
  [/\bsr\.?\s*creatinine\b/gi, "creatinine"],
  [/\breactive protein\b/gi, "crp"],
  [/\bplatelet count\b/gi, "platelets"],
  [/\btotal leukocyte count\b/gi, "wbc"],
  [/\bserum creatinine\b/gi, "creatinine"],
  [/\bpeatinine\b/gi, "creatinine"],
  [/\btotal bilirubin\b/gi, "bilirubin total"],
  [/[tf\[]etal cholesterol/gi, "total cholesterol"],
  [/\brow\b/gi, "rdw"],
  [/\bsgpt\b/gi, "alt"],
  [/\bsgot\b/gi, "ast"],
  [/\bµiu\/ml\b/gi, "uiu/ml"],
  [/\bμiu\/ml\b/gi, "uiu/ml"],
  [/\bmg\/dl\b/gi, "mg/dl"],
  [/°/g, "."],
];

const METRIC_VALIDATION_RULES = {
  hba1c: { plausibleMin: 3, plausibleMax: 20, expectedUnits: ["%", "percent"], critical: true, fractionalExpected: true },
  estimated_average_glucose: { plausibleMin: 40, plausibleMax: 500, expectedUnits: ["mg/dl"], critical: false },
  crp_quantitative: { plausibleMin: 0, plausibleMax: 400, expectedUnits: ["mg/l"], critical: false },
  fbs: { plausibleMin: 40, plausibleMax: 600, expectedUnits: ["mg/dl"], critical: true },
  ppbs: { plausibleMin: 40, plausibleMax: 700, expectedUnits: ["mg/dl"], critical: true },
  rbs: { plausibleMin: 40, plausibleMax: 700, expectedUnits: ["mg/dl"], critical: true },
  hemoglobin: { plausibleMin: 3, plausibleMax: 25, expectedUnits: ["g/dl"], critical: true, fractionalExpected: true },
  rbc_count: { plausibleMin: 1, plausibleMax: 10, expectedUnits: ["mill/cmm", "million/cmm", "10^6"], critical: false, fractionalExpected: true },
  pcv: { plausibleMin: 10, plausibleMax: 70, expectedUnits: ["%"], critical: false, fractionalExpected: true },
  mcv: { plausibleMin: 40, plausibleMax: 150, expectedUnits: ["fl"], critical: false, fractionalExpected: true },
  mch: { plausibleMin: 10, plausibleMax: 60, expectedUnits: ["pg"], critical: false, fractionalExpected: true },
  mchc: { plausibleMin: 15, plausibleMax: 45, expectedUnits: ["%", "g/dl"], critical: false, fractionalExpected: true },
  rdw: { plausibleMin: 8, plausibleMax: 25, expectedUnits: ["%", "fl"], critical: false, fractionalExpected: true },
  wbc: { plausibleMin: 0.5, plausibleMax: 80, expectedUnits: ["10^3/ul", "10^3/u", "thou/cmm"], critical: true, fractionalExpected: true },
  esr: { plausibleMin: 0, plausibleMax: 150, expectedUnits: ["mm/hr", "mm"], critical: false },
  platelets: { plausibleMin: 10, plausibleMax: 1500, expectedUnits: ["10^3/ul", "10^3/u", "lakhs"], critical: true },
  weight: { plausibleMin: 1, plausibleMax: 300, expectedUnits: ["kg"], critical: false, fractionalExpected: true },
  bmi: { plausibleMin: 8, plausibleMax: 80, expectedUnits: ["kg/m", "bmi"], critical: false, fractionalExpected: true },
  total_cholesterol: { plausibleMin: 40, plausibleMax: 500, expectedUnits: ["mg/dl"], critical: true },
  ldl: { plausibleMin: 10, plausibleMax: 400, expectedUnits: ["mg/dl"], critical: true },
  hdl: { plausibleMin: 5, plausibleMax: 150, expectedUnits: ["mg/dl"], critical: true },
  triglycerides: { plausibleMin: 10, plausibleMax: 1000, expectedUnits: ["mg/dl"], critical: true },
  tsh: { plausibleMin: 0.01, plausibleMax: 100, expectedUnits: ["uiu/ml", "miu/l"], critical: true, fractionalExpected: true },
  t3: { plausibleMin: 10, plausibleMax: 600, expectedUnits: ["ng/dl", "pg/ml"], critical: false, fractionalExpected: true },
  t4: { plausibleMin: 0.5, plausibleMax: 30, expectedUnits: ["ug/dl", "ng/dl"], critical: false, fractionalExpected: true },
  creatinine: { plausibleMin: 0.1, plausibleMax: 20, expectedUnits: ["mg/dl"], critical: true, fractionalExpected: true },
  urea: { plausibleMin: 2, plausibleMax: 300, expectedUnits: ["mg/dl"], critical: false, fractionalExpected: true },
  uric_acid: { plausibleMin: 1, plausibleMax: 20, expectedUnits: ["mg/dl"], critical: false, fractionalExpected: true },
  bilirubin_total: { plausibleMin: 0.05, plausibleMax: 40, expectedUnits: ["mg/dl"], critical: true, fractionalExpected: true },
  sgpt_alt: { plausibleMin: 1, plausibleMax: 2000, expectedUnits: ["u/l"], critical: true },
  sgot_ast: { plausibleMin: 1, plausibleMax: 2000, expectedUnits: ["u/l"], critical: true },
};

function listReportCatalog() {
  return Object.entries(REPORT_CATALOG).map(([key, item]) => ({
    key,
    label: item.label,
    metrics: item.metrics,
  }));
}

function detectLabSource(text = "") {
  const haystack = String(text || "");
  const match = LAB_SOURCE_PATTERNS.find((item) => item.pattern.test(haystack));
  return match || null;
}

function buildSectionExcerpt(text = "", patterns = []) {
  const lines = String(text || "").split(/\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    if (patterns.some((pattern) => pattern.test(lines[index]))) {
      return lines.slice(index, Math.min(lines.length, index + 4)).join(" ");
    }
  }
  return lines.slice(0, 4).join(" ");
}

function normalizeExtractedReportText(text = "") {
  let normalized = String(text || "");
  NORMALIZATION_REPLACEMENTS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  normalized = normalized
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+:\s+/g, ": ")
    .replace(/reference range.*$/gim, "")
    .replace(/bio(?:logical)? reference interval.*$/gim, "")
    .replace(/test method.*$/gim, "")
    .replace(/sample collected.*$/gim, "")
    .replace(/authori[sz]ed signatory.*$/gim, "")
    .replace(/end of report.*$/gim, "")
    .trim();

  return normalized;
}

function evaluateMetric(metric, value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return { zone: "neutral", label: "No reading" };
  if (metric.low != null && number < metric.low) return { zone: "low", label: "Below range" };
  if (metric.high != null && number > metric.high) return { zone: "high", label: "Above range" };
  return { zone: "normal", label: "Within range" };
}

function buildNarrative(metric, latest, previous) {
  const evaluation = evaluateMetric(metric, latest?.value);
  const latestText = `${metric.label} is ${latest?.value}${metric.unit ? ` ${metric.unit}` : ""}`;
  if (!previous) {
    return `${latestText}, ${evaluation.label.toLowerCase()}.`;
  }
  const delta = Number(latest.value) - Number(previous.value);
  const direction = delta === 0 ? "stable" : delta > 0 ? "up" : "down";
  const trendWords =
    metric.trend === "higher_better"
      ? direction === "up"
        ? "improved upward"
        : direction === "down"
          ? "fallen"
          : "remained stable"
      : metric.trend === "lower_better"
        ? direction === "down"
          ? "improved downward"
          : direction === "up"
            ? "risen"
            : "remained stable"
        : direction === "up"
          ? "risen"
          : direction === "down"
            ? "fallen"
            : "remained stable";
  return `${latestText}, ${evaluation.label.toLowerCase()}, and has ${trendWords} compared with the previous reading.`;
}

function buildDateLabel(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toISOString().slice(0, 10);
}

function inferReportType(text = "", hintedReportType = "") {
  if (hintedReportType && REPORT_CATALOG[hintedReportType]) return hintedReportType;
  const haystack = String(text || "").toLowerCase();
  let best = { key: "", score: 0 };
  Object.entries(REPORT_CATALOG).forEach(([key, config]) => {
    const score = (config.keywords || []).reduce((sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 2 : 0), 0)
      + config.metrics.reduce((sum, metric) => sum + (haystack.includes(metric.label.toLowerCase()) ? 1 : 0), 0);
    if (score > best.score) best = { key, score };
  });
  return best.key || "";
}

function findMetricDefinition(metricKey) {
  for (const config of Object.values(REPORT_CATALOG)) {
    const metric = (config.metrics || []).find((item) => item.key === metricKey);
    if (metric) return metric;
  }
  return null;
}

function normalizeCandidateNumber(rawValue = "") {
  return String(rawValue || "")
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/,/g, ".")
    .replace(/°/g, ".")
    .replace(/[^\d.]/g, "");
}

function buildCandidateExcerpt(text = "", start = 0, end = 0) {
  const source = String(text || "");
  const left = Math.max(0, start - 60);
  const right = Math.min(source.length, end + 60);
  return source.slice(left, right).replace(/\s+/g, " ").trim();
}

function inferUnitConfidence(metricKey, excerpt = "", metricDef = null) {
  const rule = METRIC_VALIDATION_RULES[metricKey] || {};
  const expectedUnits = rule.expectedUnits || [];
  if (!expectedUnits.length) return { unitConfidence: 0.8, unitMatched: false, reasons: [] };
  const haystack = String(excerpt || "").toLowerCase();
  const unitMatched = expectedUnits.some((token) => haystack.includes(String(token).toLowerCase()));
  if (unitMatched) {
    return { unitConfidence: 0.97, unitMatched: true, reasons: [] };
  }
  const genericMetricUnit = String(metricDef?.unit || "").toLowerCase().replace(/\s+/g, "");
  if (genericMetricUnit && haystack.includes(genericMetricUnit.replace(/²/g, ""))) {
    return { unitConfidence: 0.9, unitMatched: true, reasons: [] };
  }
  return {
    unitConfidence: 0.62,
    unitMatched: false,
    reasons: ["expected unit not clearly present near the extracted value"],
  };
}

function applyMetricScaleNormalization(metricKey, rawValue, numericValue) {
  let value = numericValue;
  let normalizationReason = "";
  if (metricKey === "hemoglobin" && value > 30 && value < 250) {
    value = value / 10;
    normalizationReason = "scaled down hemoglobin by 10 from OCR-style integer";
  }
  if (metricKey === "hba1c" && value >= 20 && value < 200 && !String(rawValue || "").includes(".")) {
    value = value / 10;
    normalizationReason = "scaled down HbA1c by 10 from OCR-style integer";
  }
  if ((metricKey === "mch" || metricKey === "mchc") && value >= 100 && value < 1000 && !String(rawValue || "").includes(".")) {
    value = value / 10;
    normalizationReason = `scaled down ${metricKey} by 10 from OCR-style integer`;
  }
  if ((metricKey === "wbc" || metricKey === "platelets") && value > 1000) {
    value = value / 1000;
    normalizationReason = `scaled down ${metricKey} by 1000 based on count unit convention`;
  }
  if (metricKey === "tsh" && value >= 100 && !String(rawValue || "").includes(".")) {
    value = value / 100;
    normalizationReason = "scaled down TSH by 100 from OCR-style integer";
  }
  if (metricKey === "creatinine" && value >= 10 && String(rawValue || "").length === 3 && String(rawValue || "").startsWith("0")) {
    value = Number(`0.${String(rawValue).slice(1)}`);
    normalizationReason = "reformatted creatinine leading-zero OCR token";
  }
  if (metricKey === "rbc_count" && value >= 100 && value < 10000) {
    value = value / 1000;
    normalizationReason = "scaled down RBC count by 1000 based on count unit convention";
  }
  return { value, normalizationReason };
}

function validateExtractedMetric(metricKey, rawValue, value, excerpt = "", patternIndex = 0, metricDef = null) {
  const rule = METRIC_VALIDATION_RULES[metricKey] || {};
  const reasons = [];
  let hardReject = false;

  if (!Number.isFinite(value)) {
    return {
      accepted: false,
      reviewStatus: "rejected",
      confidence: 0,
      confidenceBreakdown: { pattern: 0, value: 0, unit: 0, overall: 0 },
      reviewReasons: ["no numeric value could be parsed"],
    };
  }

  if (rule.plausibleMin != null && value < rule.plausibleMin) {
    reasons.push(`value ${value} is below plausible ${metricKey} range`);
    hardReject = true;
  }
  if (rule.plausibleMax != null && value > rule.plausibleMax) {
    reasons.push(`value ${value} is above plausible ${metricKey} range`);
    hardReject = true;
  }

  if (rule.fractionalExpected && !String(rawValue || "").includes(".") && value < 15) {
    reasons.push("fractional metric was extracted without a decimal point");
  }

  const patternConfidence = Math.max(0.52, 0.97 - patternIndex * 0.08);
  let valueConfidence = hardReject ? 0.1 : 0.9;
  if (reasons.some((reason) => reason.includes("fractional metric"))) {
    valueConfidence -= 0.16;
  }

  const { unitConfidence, unitMatched, reasons: unitReasons } = inferUnitConfidence(metricKey, excerpt, metricDef);
  reasons.push(...unitReasons);
  if (!unitMatched && (METRIC_VALIDATION_RULES[metricKey]?.critical || false)) {
    valueConfidence -= 0.08;
  }

  const overall = Math.max(
    0,
    Math.min(0.99, Math.round(((patternConfidence * 0.3 + valueConfidence * 0.45 + unitConfidence * 0.25)) * 100) / 100),
  );
  const reviewStatus = hardReject ? "rejected" : overall < 0.88 ? "needs_review" : "trusted";

  return {
    accepted: !hardReject,
    reviewStatus,
    confidence: overall,
    confidenceBreakdown: {
      pattern: Math.round(patternConfidence * 100) / 100,
      value: Math.max(0, Math.round(valueConfidence * 100) / 100),
      unit: Math.round(unitConfidence * 100) / 100,
      overall,
    },
    reviewReasons: reasons,
  };
}

function extractMetricCandidate(metricKey, text) {
  const patterns = EXTRACTION_PATTERNS[metricKey] || [];
  for (const [index, pattern] of patterns.entries()) {
    const match = pattern.exec(String(text || ""));
    let rawValue = normalizeCandidateNumber(String(match?.[1] || ""));
    if (!rawValue && metricKey === "sgpt_alt" && match?.[0]) {
      const lineNumbers = String(match[0]).match(/\d+(?:\.\d+)?/g) || [];
      rawValue = lineNumbers[lineNumbers.length - 1] || "";
    }
    let value = Number(rawValue);
    if (Number.isFinite(value)) {
      if (value === 0) {
        continue;
      }
      const { value: normalizedValue, normalizationReason } = applyMetricScaleNormalization(metricKey, rawValue, value);
      value = normalizedValue;
      const excerpt = buildCandidateExcerpt(String(text || ""), match?.index || 0, (match?.index || 0) + String(match?.[0] || "").length);
      const metricDef = findMetricDefinition(metricKey);
      const validation = validateExtractedMetric(metricKey, rawValue, value, excerpt, index, metricDef);
      const reviewReasons = normalizationReason ? [...validation.reviewReasons, normalizationReason] : validation.reviewReasons;
      return {
        value,
        confidence: validation.confidence,
        confidenceBreakdown: validation.confidenceBreakdown,
        reviewStatus: validation.reviewStatus,
        accepted: validation.accepted,
        reviewReasons,
        rawValue,
        excerpt,
        patternIndex: index,
      };
    }
  }
  return null;
}

function parseReportText({ text = "", hintedReportType = "", reportDate = "" } = {}) {
  const sourceText = String(text || "").trim();
  if (!sourceText) {
    return {
      reportType: hintedReportType && REPORT_CATALOG[hintedReportType] ? hintedReportType : "",
      metrics: [],
      rejectedMetrics: [],
      reportDate: reportDate || new Date().toISOString().slice(0, 10),
      source: "parsed_text",
      detectedLabSource: null,
      qualityGate: "rejected",
      overallConfidence: 0,
      needsReview: true,
      summary: "Paste extracted report text to auto-suggest values.",
    };
  }

  const normalizedText = normalizeExtractedReportText(sourceText);
  const detectedLabSource = detectLabSource(normalizedText);
  const reportTypeMetrics = Object.entries(REPORT_CATALOG)
    .filter(([key]) => key !== "multi_panel")
    .map(([key, config]) => ({
      key,
      label: config.label,
      keywords: config.keywords || [],
      metrics: (config.metrics || [])
        .map((metric) => {
          const candidate = extractMetricCandidate(metric.key, normalizedText);
          if (!candidate) return null;
          const valueNum = candidate?.value;
          if (!Number.isFinite(valueNum)) return null;
          return {
            metricKey: metric.key,
            metricLabel: metric.label,
            valueNum,
            unit: metric.unit || "",
            referenceLow: metric.low ?? null,
            referenceHigh: metric.high ?? null,
            confidence: candidate?.confidence ?? 0.75,
            confidenceBreakdown: candidate?.confidenceBreakdown || null,
            reviewStatus: candidate?.reviewStatus || "needs_review",
            reviewReasons: candidate?.reviewReasons || [],
            excerpt: candidate?.excerpt || "",
            rawValue: candidate?.rawValue || "",
            accepted: candidate?.accepted !== false,
          };
        })
        .filter(Boolean),
    }))
    .filter((entry) => entry.metrics.length);

  const allCandidates = reportTypeMetrics.flatMap((entry) => entry.metrics);
  const allMetrics = allCandidates.filter((metric) => metric.accepted !== false);
  const rejectedMetrics = allCandidates
    .filter((metric) => metric.accepted === false)
    .map((metric) => ({
      metricKey: metric.metricKey,
      metricLabel: metric.metricLabel,
      attemptedValue: metric.valueNum,
      unit: metric.unit || "",
      reviewStatus: metric.reviewStatus || "rejected",
      reviewReasons: metric.reviewReasons || [],
      excerpt: metric.excerpt || "",
      rawValue: metric.rawValue || "",
    }));
  if (!allMetrics.length) {
    const hintedCatalog = hintedReportType ? REPORT_CATALOG[hintedReportType] : null;
    return {
      reportType: hintedCatalog ? hintedReportType : "",
      metrics: [],
      rejectedMetrics,
      reportDate: reportDate || new Date().toISOString().slice(0, 10),
      source: "parsed_text",
      detectedLabSource,
      qualityGate: "rejected",
      summary: hintedCatalog
        ? `Detected ${hintedCatalog.label}, but no supported numeric values could be extracted confidently.`
        : "Could not confidently identify any supported report values from the extracted report text.",
    };
  }

  const uniqueMetrics = Array.from(
    new Map(allMetrics.map((metric) => [metric.metricKey, metric])).values(),
  );
  const explicitHint = hintedReportType && REPORT_CATALOG[hintedReportType] ? hintedReportType : "";
  const inferredPrimaryType = inferReportType(normalizedText, "");
  const matchedTypes = reportTypeMetrics.map((entry) => entry.key);
  const detectedSections = reportTypeMetrics.map((entry) => {
    const keywordPatterns = entry.keywords.map((keyword) => new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
    const metricPatterns = entry.metrics.map((metric) => new RegExp(`\\b${metric.metricLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
    return {
      key: entry.key,
      label: entry.label,
      metricCount: entry.metrics.length,
      matchedMetrics: entry.metrics.map((metric) => metric.metricLabel),
      excerpt: buildSectionExcerpt(normalizedText, [...keywordPatterns, ...metricPatterns]),
    };
  });
  const reportType =
    explicitHint ||
    (matchedTypes.length > 1 ? "multi_panel" : matchedTypes[0] || inferredPrimaryType || "multi_panel");

  const overallConfidence = uniqueMetrics.length
    ? Math.round(
        (uniqueMetrics.reduce((sum, metric) => sum + Number(metric.confidence || 0), 0) / uniqueMetrics.length) * 100,
      ) / 100
    : 0;
  const needsReview =
    overallConfidence < 0.9 ||
    uniqueMetrics.some((metric) => Number(metric.confidence || 0) < 0.88 || metric.reviewStatus === "needs_review") ||
    rejectedMetrics.some((metric) => (METRIC_VALIDATION_RULES[metric.metricKey]?.critical || false));
  const qualityGate = !uniqueMetrics.length
    ? "rejected"
    : rejectedMetrics.some((metric) => (METRIC_VALIDATION_RULES[metric.metricKey]?.critical || false))
      ? "partial_review"
      : needsReview
        ? "review"
        : "trusted";
  const matchedLabels = reportTypeMetrics.map((entry) => entry.label);

  return {
    reportType,
    metrics: uniqueMetrics,
    rejectedMetrics,
    reportDate: reportDate || new Date().toISOString().slice(0, 10),
    source: "parsed_text",
    detectedLabSource,
    detectedSections,
    overallConfidence,
    needsReview,
    qualityGate,
    summary:
      reportType === "multi_panel"
        ? `Auto-suggested ${uniqueMetrics.length} values across ${matchedLabels.join(", ")} from the extracted report text${detectedLabSource ? ` (${detectedLabSource.label} style detected)` : ""}.`
        : `Auto-suggested ${uniqueMetrics.length} value${uniqueMetrics.length === 1 ? "" : "s"} from the extracted report text${detectedLabSource ? ` (${detectedLabSource.label} style detected)` : ""}.`,
  };
}

function dedupeMetrics(metrics = []) {
  return Array.from(
    new Map(
      (metrics || []).map((metric) => [
        `${metric.metricKey}:${metric.metricLabel}:${metric.unit || ""}`,
        metric,
      ]),
    ).values(),
  );
}

function buildSectionLabel(reportType, pageNumber) {
  const label = REPORT_CATALOG[reportType]?.label || "Detected section";
  return pageNumber ? `${label} (Page ${pageNumber})` : label;
}

function buildMergedSectionLabel(reportType, pageNumbers = []) {
  const label = REPORT_CATALOG[reportType]?.label || "Detected section";
  const cleanPages = [...new Set((pageNumbers || []).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!cleanPages.length) return label;
  if (cleanPages.length === 1) return `${label} (Page ${cleanPages[0]})`;
  const first = cleanPages[0];
  const last = cleanPages[cleanPages.length - 1];
  return `${label} (Pages ${first}-${last})`;
}

function groupMetricsIntoLogicalSections(metrics = []) {
  const grouped = new Map();
  for (const metric of metrics || []) {
    const owner = Object.entries(REPORT_CATALOG)
      .filter(([key]) => key !== "multi_panel")
      .find(([, config]) => (config.metrics || []).some((candidate) => candidate.key === metric.metricKey));
    const reportType = owner?.[0] || "multi_panel";
    if (!grouped.has(reportType)) grouped.set(reportType, []);
    grouped.get(reportType).push(metric);
  }
  return grouped;
}

function parseReportSections({ text = "", pages = [], hintedReportType = "", reportDate = "" } = {}) {
  const normalizedPages = Array.isArray(pages) && pages.length
    ? pages
    : [{ pageNumber: 1, text: String(text || "") }];

  const pageSections = normalizedPages
    .map((page) => {
      const parsed = parseReportText({
        text: page.text,
        hintedReportType,
        reportDate,
      });
      if (!parsed.metrics?.length) return null;
      return {
        pageNumber: page.pageNumber || null,
        reportType: parsed.reportType || "",
        label: buildSectionLabel(parsed.reportType, page.pageNumber),
        reportDate: parsed.reportDate || reportDate || new Date().toISOString().slice(0, 10),
        metrics: parsed.metrics || [],
        rejectedMetrics: parsed.rejectedMetrics || [],
        summary: parsed.summary || "",
        overallConfidence: parsed.overallConfidence ?? null,
        needsReview: parsed.needsReview ?? true,
        qualityGate: parsed.qualityGate || "review",
        detectedLabSource: parsed.detectedLabSource || null,
        excerpt: buildSectionExcerpt(page.text, []),
      };
    })
    .filter(Boolean);

  const aggregated = parseReportText({ text, hintedReportType, reportDate });
  const rawSections = pageSections.length
    ? pageSections
    : aggregated.metrics?.length
      ? [{
          pageNumber: 1,
          reportType: aggregated.reportType || "",
          label: buildSectionLabel(aggregated.reportType, 1),
          reportDate: aggregated.reportDate || reportDate || new Date().toISOString().slice(0, 10),
          metrics: aggregated.metrics || [],
          rejectedMetrics: aggregated.rejectedMetrics || [],
          summary: aggregated.summary || "",
          overallConfidence: aggregated.overallConfidence ?? null,
          needsReview: aggregated.needsReview ?? true,
          qualityGate: aggregated.qualityGate || "review",
          detectedLabSource: aggregated.detectedLabSource || null,
          excerpt: buildSectionExcerpt(text, []),
        }]
      : [];

  let mergedSections = Array.from(
    rawSections.reduce((map, section) => {
      const groupKey = section.reportType || section.label || "unknown";
      const existing = map.get(groupKey);
      if (!existing) {
        map.set(groupKey, {
          sectionKey: groupKey,
          reportType: section.reportType || "",
          label: section.label || buildMergedSectionLabel(section.reportType, [section.pageNumber]),
          reportDate: section.reportDate,
          metrics: [...(section.metrics || [])],
          rejectedMetrics: [...(section.rejectedMetrics || [])],
          summary: section.summary || "",
          overallConfidence: section.overallConfidence ?? null,
          needsReview: Boolean(section.needsReview),
          qualityGate: section.qualityGate || "review",
          detectedLabSource: section.detectedLabSource || null,
          excerpt: section.excerpt || "",
          pageNumbers: section.pageNumber ? [section.pageNumber] : [],
        });
        return map;
      }

      existing.metrics = dedupeMetrics([...(existing.metrics || []), ...(section.metrics || [])]);
      existing.rejectedMetrics = [...(existing.rejectedMetrics || []), ...(section.rejectedMetrics || [])];
      existing.pageNumbers = [...new Set([...(existing.pageNumbers || []), ...(section.pageNumber ? [section.pageNumber] : [])])].sort((a, b) => a - b);
      existing.reportDate = existing.reportDate || section.reportDate;
      existing.summary = existing.summary || section.summary || "";
      existing.excerpt = [existing.excerpt, section.excerpt].filter(Boolean).join(" ").trim();
      existing.overallConfidence =
        existing.overallConfidence == null
          ? section.overallConfidence ?? null
          : section.overallConfidence == null
            ? existing.overallConfidence
            : Math.round(((Number(existing.overallConfidence) + Number(section.overallConfidence)) / 2) * 100) / 100;
      existing.needsReview = Boolean(existing.needsReview || section.needsReview);
      existing.qualityGate =
        existing.qualityGate === "rejected" || section.qualityGate === "rejected"
          ? "rejected"
          : existing.qualityGate === "partial_review" || section.qualityGate === "partial_review"
            ? "partial_review"
            : existing.qualityGate === "review" || section.qualityGate === "review"
              ? "review"
              : "trusted";
      if (!existing.detectedLabSource && section.detectedLabSource) {
        existing.detectedLabSource = section.detectedLabSource;
      }
      return map;
    }, new Map()).values(),
  ).map((section) => ({
    ...section,
    label: buildMergedSectionLabel(section.reportType, section.pageNumbers),
    metricCount: (section.metrics || []).length,
    matchedMetrics: (section.metrics || []).map((metric) => metric.metricLabel),
  }));

  if (mergedSections.length === 1 && mergedSections[0].reportType === "multi_panel") {
    const seed = mergedSections[0];
    const logicalGroups = groupMetricsIntoLogicalSections(seed.metrics || []);
    if (logicalGroups.size > 1) {
      mergedSections = Array.from(logicalGroups.entries()).map(([reportType, metrics]) => ({
        sectionKey: reportType,
        reportType,
        label: buildMergedSectionLabel(reportType, seed.pageNumbers),
        reportDate: seed.reportDate,
        metrics: dedupeMetrics(metrics),
        rejectedMetrics: seed.rejectedMetrics || [],
        summary: `${REPORT_CATALOG[reportType]?.label || "Detected section"} extracted from a bundled report upload.`,
        overallConfidence: seed.overallConfidence,
        needsReview: seed.needsReview,
        qualityGate: seed.qualityGate || "review",
        detectedLabSource: seed.detectedLabSource,
        excerpt: seed.excerpt,
        pageNumbers: seed.pageNumbers,
        metricCount: metrics.length,
        matchedMetrics: metrics.map((metric) => metric.metricLabel),
      }));
    }
  }

  const uniqueMetrics = dedupeMetrics(mergedSections.flatMap((section) => section.metrics || []));
  const matchedTypes = [...new Set(mergedSections.map((section) => section.reportType).filter(Boolean))];

  return {
    reportType: matchedTypes.length > 1 ? "multi_panel" : matchedTypes[0] || aggregated.reportType || "",
    reportDate: aggregated.reportDate || reportDate || new Date().toISOString().slice(0, 10),
    metrics: uniqueMetrics,
    summary: aggregated.summary || "",
    detectedLabSource: aggregated.detectedLabSource || null,
    overallConfidence: aggregated.overallConfidence ?? null,
    needsReview: aggregated.needsReview ?? true,
    qualityGate: aggregated.qualityGate || "review",
    rejectedMetrics: aggregated.rejectedMetrics || [],
    detectedSections: mergedSections.map((section) => ({
      key: section.sectionKey,
      label: section.label,
      metricCount: section.metricCount,
      matchedMetrics: section.matchedMetrics,
      excerpt: section.excerpt,
      pageNumbers: section.pageNumbers,
      reportType: section.reportType,
      qualityGate: section.qualityGate || "review",
      rejectedMetricCount: (section.rejectedMetrics || []).length,
    })),
    sections: mergedSections,
  };
}

function buildConditionSummaries(trends) {
  const byKey = new Map(trends.map((trend) => [trend.metricKey, trend]));
  const summaries = [];

  const hba1c = byKey.get("hba1c");
  const fbs = byKey.get("fbs");
  const ppbs = byKey.get("ppbs");
  const hemoglobin = byKey.get("hemoglobin");
  const tsh = byKey.get("tsh");
  const creatinine = byKey.get("creatinine");
  const ldl = byKey.get("ldl");
  const triglycerides = byKey.get("triglycerides");
  const hdl = byKey.get("hdl");
  const bilirubin = byKey.get("bilirubin_total");
  const alt = byKey.get("sgpt_alt");
  const ast = byKey.get("sgot_ast");

  if (hba1c || fbs || ppbs) {
    const latestHba1c = Number(hba1c?.latestValue);
    const latestFbs = Number(fbs?.latestValue);
    const latestPpbs = Number(ppbs?.latestValue);
    let zone = "normal";
    let summary = "Glucose markers do not show a clearly high trend in the selected window.";
    if ((Number.isFinite(latestHba1c) && latestHba1c >= 6.5) || (Number.isFinite(latestFbs) && latestFbs >= 126) || (Number.isFinite(latestPpbs) && latestPpbs >= 200)) {
      zone = "high";
      summary = "Diabetes-focused review is suggested because one or more sugar markers remain above target in the selected period.";
    } else if ((Number.isFinite(latestHba1c) && latestHba1c >= 5.7) || (Number.isFinite(latestFbs) && latestFbs >= 100) || (Number.isFinite(latestPpbs) && latestPpbs >= 140)) {
      zone = "low";
      summary = "Sugar markers are borderline or mildly elevated. Consider follow-up trend review and lifestyle counselling.";
    }
    summaries.push({ key: "diabetes", title: "Diabetes focus", zone, summary });
  }

  if (hemoglobin) {
    const latest = Number(hemoglobin.latestValue);
    summaries.push({
      key: "anemia",
      title: "Anemia focus",
      zone: Number.isFinite(latest) && latest < 12 ? "high" : "normal",
      summary:
        Number.isFinite(latest) && latest < 12
          ? "Hemoglobin is below the usual adult reference range, so anemia review is warranted. Correlate clinically and with CBC context."
          : "Hemoglobin is within the configured reference range in the latest reading.",
    });
  }

  if (tsh) {
    const latest = Number(tsh.latestValue);
    let zone = "normal";
    let summary = "TSH is within the configured reference range in the latest reading.";
    if (Number.isFinite(latest) && latest > 4.5) {
      zone = "high";
      summary = "TSH is elevated, which may suggest hypothyroid-pattern follow-up depending on clinical context and T3/T4 correlation.";
    } else if (Number.isFinite(latest) && latest < 0.4) {
      zone = "low";
      summary = "TSH is suppressed, which may suggest hyperthyroid-pattern follow-up depending on clinical context and T3/T4 correlation.";
    }
    summaries.push({ key: "thyroid", title: "Thyroid focus", zone, summary });
  }

  if (creatinine) {
    const latest = Number(creatinine.latestValue);
    summaries.push({
      key: "ckd",
      title: "CKD / renal focus",
      zone: Number.isFinite(latest) && latest > 1.2 ? "high" : "normal",
      summary:
        Number.isFinite(latest) && latest > 1.2
          ? "Creatinine is above the configured range, so renal function follow-up and CKD correlation should be considered."
          : "Creatinine is within the configured reference range in the latest reading.",
    });
  }

  if (ldl || triglycerides || hdl) {
    const latestLdl = Number(ldl?.latestValue);
    const latestTriglycerides = Number(triglycerides?.latestValue);
    const latestHdl = Number(hdl?.latestValue);
    let zone = "normal";
    let summary = "Lipid markers do not currently show a clearly high-risk pattern in the selected window.";
    if ((Number.isFinite(latestLdl) && latestLdl >= 130) || (Number.isFinite(latestTriglycerides) && latestTriglycerides >= 200) || (Number.isFinite(latestHdl) && latestHdl < 40)) {
      zone = "high";
      summary = "Lipid review is suggested because LDL or triglycerides are elevated, or HDL is low, in the latest readings.";
    } else if ((Number.isFinite(latestLdl) && latestLdl >= 100) || (Number.isFinite(latestTriglycerides) && latestTriglycerides >= 150)) {
      zone = "low";
      summary = "Lipid markers are borderline. Lifestyle counselling and trend follow-up may be useful.";
    }
    summaries.push({ key: "lipid", title: "Lipid risk focus", zone, summary });
  }

  if (bilirubin || alt || ast) {
    const latestBilirubin = Number(bilirubin?.latestValue);
    const latestAlt = Number(alt?.latestValue);
    const latestAst = Number(ast?.latestValue);
    let zone = "normal";
    let summary = "Liver markers are within the configured ranges in the latest reading.";
    if ((Number.isFinite(latestBilirubin) && latestBilirubin > 1.2) || (Number.isFinite(latestAlt) && latestAlt > 45) || (Number.isFinite(latestAst) && latestAst > 40)) {
      zone = "high";
      summary = "Liver-pattern review is suggested because bilirubin or transaminases are elevated in the latest reading.";
    }
    summaries.push({ key: "liver", title: "Liver pattern focus", zone, summary });
  }

  return summaries;
}

function buildBadges(trends, conditionSummaries) {
  const badges = [];
  trends.forEach((trend) => {
    if (trend.zone === "high") badges.push({ key: `${trend.metricKey}-high`, label: `${trend.metricLabel} high`, zone: "high" });
    if (trend.zone === "low") badges.push({ key: `${trend.metricKey}-low`, label: `${trend.metricLabel} low`, zone: "low" });
    if (trend.needsReview) badges.push({ key: `${trend.metricKey}-review`, label: `${trend.metricLabel} OCR review`, zone: "low" });
  });
  conditionSummaries.forEach((item) => {
    if (item.zone !== "normal") {
      badges.push({ key: `${item.key}-${item.zone}`, label: item.title, zone: item.zone });
    }
  });
  return badges.slice(0, 8);
}

function buildReportInsights({ analyses = [], months = 6, referenceDate = new Date().toISOString() } = {}) {
  const cutoff = new Date(referenceDate);
  cutoff.setMonth(cutoff.getMonth() - Number(months || 6));
  const filteredAnalyses = analyses.filter((item) => {
    const ts = Date.parse(item.reportDate || item.createdAt || "");
    return Number.isNaN(ts) ? true : ts >= cutoff.getTime();
  });

  const metricBuckets = new Map();
  filteredAnalyses.forEach((analysis) => {
    (analysis.metrics || []).forEach((metric) => {
      if (!metricBuckets.has(metric.metricKey)) {
        metricBuckets.set(metric.metricKey, []);
      }
      metricBuckets.get(metric.metricKey).push({
        reportId: analysis.recordId,
        reportType: analysis.reportType,
        reportDate: analysis.reportDate,
        value: Number(metric.valueNum),
        unit: metric.unit,
        referenceLow: metric.referenceLow,
        referenceHigh: metric.referenceHigh,
        confidence: metric.confidence ?? null,
      });
    });
  });

  const trends = Array.from(metricBuckets.entries())
    .map(([metricKey, points]) => {
      const sorted = [...points]
        .filter((point) => Number.isFinite(point.value))
        .sort((a, b) => new Date(a.reportDate || 0) - new Date(b.reportDate || 0));
      if (!sorted.length) return null;
      const reportType = sorted[sorted.length - 1].reportType;
      const metricDef =
        findMetricDefinition(metricKey) || {
          key: metricKey,
          label: metricKey,
          unit: sorted[sorted.length - 1].unit || "",
        };
      const latest = sorted[sorted.length - 1];
      const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      return {
        metricKey,
        metricLabel: metricDef.label,
        reportType,
        unit: metricDef.unit || latest.unit || "",
        low: metricDef.low ?? latest.referenceLow ?? null,
        high: metricDef.high ?? latest.referenceHigh ?? null,
        latestValue: latest.value,
        previousValue: previous?.value ?? null,
        latestConfidence: latest.confidence ?? null,
        needsReview: sorted.some((point) => Number(point.confidence || 1) < 0.88),
        zone: evaluateMetric(metricDef, latest.value).zone,
        summary: buildNarrative(metricDef, latest, previous),
        points: sorted.map((point) => ({
          label: buildDateLabel(point.reportDate),
          value: point.value,
          confidence: point.confidence ?? null,
        })),
      };
    })
    .filter(Boolean);

  const latestReports = filteredAnalyses
    .slice()
    .sort((a, b) => new Date(b.reportDate || 0) - new Date(a.reportDate || 0))
    .slice(0, 12);

  const reviewHeavy = trends.filter((trend) => trend.needsReview).length;
  const trustedTrendCount = trends.length - reviewHeavy;

  const conditionSummaries = buildConditionSummaries(trends);
  const badges = buildBadges(trends, conditionSummaries);

  const doctorSummary = !trends.length
    ? "No structured report values are available in the selected time window yet."
    : reviewHeavy
      ? `Extraction quality review is still needed for ${reviewHeavy} of ${trends.length} tracked metric trend${trends.length === 1 ? "" : "s"}. Trusted trends: ${trustedTrendCount}. ${trends
          .filter((item) => !item.needsReview)
          .slice(0, 3)
          .map((item) => item.summary)
          .join(" ")}`.trim()
      : `${trends.slice(0, 4).map((item) => item.summary).join(" ")} ${conditionSummaries
          .slice(0, 2)
          .map((item) => item.summary)
          .join(" ")}`.trim();
  const patientSummary = !trends.length
    ? "No report trends are available yet. Upload a report and add its key values to start seeing summaries and graphs."
    : reviewHeavy
      ? `We found ${trends.length} tracked lab trend${trends.length === 1 ? "" : "s"}, but ${reviewHeavy} still need review before you rely on them.`
      : `We found ${trends.length} tracked lab trend${trends.length === 1 ? "" : "s"} in the last ${months} month${Number(months) === 1 ? "" : "s"}. ${conditionSummaries
          .slice(0, 2)
          .map((item) => item.summary)
          .join(" ")}`;

  return {
    months: Number(months || 6),
    trends,
    latestReports,
    badges,
    conditionSummaries,
    patientSummary,
    doctorSummary,
  };
}

module.exports = {
  REPORT_CATALOG,
  listReportCatalog,
  buildReportInsights,
  parseReportText,
  parseReportSections,
};
