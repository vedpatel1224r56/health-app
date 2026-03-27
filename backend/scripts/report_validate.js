const fs = require("fs");
const path = require("path");

const { extractDocumentFromFile, getExtractionCapabilities } = require("../src/services/reportExtractionService");
const { parseReportSections } = require("../src/services/reportInsightsService");

function parseArgs(argv) {
  const args = { files: [], expectPath: "", json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--expect") {
      args.expectPath = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (value === "--json") {
      args.json = true;
      continue;
    }
    args.files.push(value);
  }
  return args;
}

function loadExpectations(expectPath) {
  if (!expectPath) return {};
  const raw = fs.readFileSync(expectPath, "utf8");
  return JSON.parse(raw);
}

function resolveFilesFromExpectations(expectations = {}) {
  return Object.values(expectations)
    .map((item) => item?.filePath)
    .filter((value) => typeof value === "string" && value.trim().length > 0);
}

function metricMap(metrics = []) {
  return new Map((metrics || []).map((metric) => [metric.metricKey, metric.valueNum]));
}

function compareExpectations(result, expected = {}) {
  const expectedSections = Array.isArray(expected.sections) ? expected.sections : [];
  const actualSections = Array.isArray(result.sections) ? result.sections : [];
  const findings = [];

  expectedSections.forEach((expectedSection) => {
    const actualSection = actualSections.find((section) => section.reportType === expectedSection.reportType);
    if (!actualSection) {
      findings.push({
        level: "fail",
        message: `Missing expected section: ${expectedSection.reportType}`,
      });
      return;
    }

    const actualMetrics = metricMap(actualSection.metrics);
    Object.entries(expectedSection.metrics || {}).forEach(([metricKey, expectedValue]) => {
      const actualValue = actualMetrics.get(metricKey);
      if (actualValue == null) {
        findings.push({
          level: "fail",
          message: `Missing metric ${metricKey} in section ${expectedSection.reportType}`,
        });
        return;
      }
      const roundedActual = Math.round(Number(actualValue) * 100) / 100;
      const roundedExpected = Math.round(Number(expectedValue) * 100) / 100;
      if (roundedActual !== roundedExpected) {
        findings.push({
          level: "fail",
          message: `Metric mismatch for ${metricKey} in ${expectedSection.reportType}: expected ${roundedExpected}, got ${roundedActual}`,
        });
      } else {
        findings.push({
          level: "pass",
          message: `Matched ${metricKey} in ${expectedSection.reportType}: ${roundedActual}`,
        });
      }
    });
  });

  return findings;
}

function buildResult(filePath, expectations = {}) {
  const extraction = extractDocumentFromFile({
    filePath,
    mimetype: filePath.toLowerCase().endsWith(".pdf") ? "application/pdf" : "",
  });
  const parsed = parseReportSections({
    text: extraction.text,
    pages: extraction.pages || [],
    reportDate: new Date().toISOString().slice(0, 10),
  });

  const expected = expectations[path.basename(filePath)] || expectations[filePath] || null;
  const findings = expected ? compareExpectations(parsed, expected) : [];

  return {
    file: filePath,
    extractor: extraction.extractor,
    error: extraction.error || "",
    pageCount: (extraction.pages || []).length,
    sectionCount: (parsed.sections || []).length,
    overallReportType: parsed.reportType,
    overallConfidence: parsed.overallConfidence ?? null,
    needsReview: Boolean(parsed.needsReview),
    qualityGate: parsed.qualityGate || "review",
    rejectedMetrics: parsed.rejectedMetrics || [],
    sections: (parsed.sections || []).map((section) => ({
      label: section.label,
      reportType: section.reportType,
      pageNumbers: section.pageNumbers || [],
      metricCount: (section.metrics || []).length,
      qualityGate: section.qualityGate || "review",
      rejectedMetricCount: (section.rejectedMetrics || []).length,
      metrics: (section.metrics || []).map((metric) => ({
        metricKey: metric.metricKey,
        metricLabel: metric.metricLabel,
        valueNum: metric.valueNum,
        unit: metric.unit || "",
      })),
    })),
    findings,
  };
}

function printHuman(result) {
  console.log(`\nFile: ${result.file}`);
  console.log(`Extractor: ${result.extractor}`);
  console.log(`Pages: ${result.pageCount} | Sections: ${result.sectionCount} | Overall type: ${result.overallReportType || "-"}`);
  console.log(`Confidence: ${result.overallConfidence ?? "-"} | Needs review: ${result.needsReview ? "yes" : "no"} | Quality gate: ${result.qualityGate}`);
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
  if (result.rejectedMetrics.length) {
    console.log("Rejected metrics:");
    result.rejectedMetrics.forEach((metric) => {
      console.log(`  - ${metric.metricLabel}: ${(metric.reviewReasons || []).join("; ") || "rejected"}`);
    });
  }
  result.sections.forEach((section) => {
    console.log(`\n  ${section.label}`);
    console.log(`  Type: ${section.reportType} | Pages: ${section.pageNumbers.join(", ") || "-"} | Quality gate: ${section.qualityGate} | Rejected: ${section.rejectedMetricCount}`);
    section.metrics.forEach((metric) => {
      console.log(`    - ${metric.metricLabel}: ${metric.valueNum}${metric.unit ? ` ${metric.unit}` : ""}`);
    });
  });
  if (result.findings.length) {
    console.log("\n  Expectation check");
    result.findings.forEach((finding) => {
      console.log(`    [${finding.level.toUpperCase()}] ${finding.message}`);
    });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const expectations = args.expectPath ? loadExpectations(args.expectPath) : {};
  const files = args.files.length ? args.files : resolveFilesFromExpectations(expectations);
  if (!files.length) {
    console.error("Usage: node scripts/report_validate.js <file1.pdf> [file2.pdf ...] [--expect expectations.json] [--json]");
    process.exit(1);
  }

  const capabilities = getExtractionCapabilities();
  const results = files.map((filePath) => buildResult(path.resolve(filePath), expectations));
  const failed = results.some((result) => result.findings.some((finding) => finding.level === "fail"));

  if (args.json) {
    console.log(JSON.stringify({ capabilities, results }, null, 2));
    process.exit(failed ? 1 : 0);
  }

  console.log("Report validation");
  console.log(`Capabilities: ${JSON.stringify(capabilities)}`);
  results.forEach(printHuman);
  process.exit(failed ? 1 : 0);
}

main();
