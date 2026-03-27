const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const EXTRACTION_PROVIDER = String(process.env.REPORT_EXTRACTION_PROVIDER || "auto").trim().toLowerCase();
const AZURE_DI_ENDPOINT = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "").trim().replace(/\/+$/, "");
const AZURE_DI_KEY = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || "").trim();
const AZURE_DI_MODEL = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || "prebuilt-layout").trim();
const AZURE_DI_API_VERSION = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION || "2024-11-30").trim();

function buildCommandPath() {
  const current = String(process.env.PATH || "");
  const extra = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  const parts = [...extra, ...current.split(":").filter(Boolean)];
  return [...new Set(parts)].join(":");
}

function extractTextFromPlainFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return "";
  }
}

function hasCommand(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      PATH: buildCommandPath(),
    },
  });
  return result.status === 0 && String(result.stdout || "").trim().length > 0;
}

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    timeout: options.timeout || 30000,
    env: {
      ...process.env,
      PATH: buildCommandPath(),
      ...(options.env || {}),
    },
  });
}

function isAzureDocumentIntelligenceConfigured() {
  return Boolean(AZURE_DI_ENDPOINT && AZURE_DI_KEY && hasCommand("curl"));
}

function parseCurlHttpResponse(raw = "") {
  const source = String(raw || "");
  const marker = source.lastIndexOf("\r\n\r\n");
  const altMarker = source.lastIndexOf("\n\n");
  const splitAt = marker >= 0 ? marker : altMarker;
  if (splitAt < 0) {
    return { headersText: "", bodyText: source };
  }
  return {
    headersText: source.slice(0, splitAt),
    bodyText: source.slice(splitAt + (marker >= 0 ? 4 : 2)),
  };
}

function parseHeaders(headersText = "") {
  const headers = {};
  String(headersText || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const index = line.indexOf(":");
      if (index <= 0) return;
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();
      if (key) headers[key] = value;
    });
  return headers;
}

function buildAzureDocAiUrl() {
  return `${AZURE_DI_ENDPOINT}/documentintelligence/documentModels/${encodeURIComponent(
    AZURE_DI_MODEL,
  )}:analyze?api-version=${encodeURIComponent(AZURE_DI_API_VERSION)}&features=keyValuePairs`;
}

function buildAzurePages(document = {}) {
  const text = String(document?.content || "");
  const spansToText = (spans = []) =>
    (Array.isArray(spans) ? spans : [])
      .map((span) => {
        const offset = Number(span?.offset || 0);
        const length = Number(span?.length || 0);
        if (!Number.isFinite(offset) || !Number.isFinite(length) || length <= 0) return "";
        return text.slice(offset, offset + length);
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  return (document?.pages || []).map((page, index) => {
    const lineText = Array.isArray(page?.lines)
      ? page.lines.map((line) => line?.content || spansToText(line?.spans || [])).filter(Boolean).join("\n").trim()
      : "";
    const spanText = spansToText(page?.spans || []);
    const pageText = lineText || spanText;
    return {
      pageNumber: Number(page?.pageNumber) || index + 1,
      text: pageText,
      confidence:
        Array.isArray(page?.words) && page.words.length
          ? Math.round(
              (page.words.reduce((sum, word) => sum + Number(word?.confidence || 0), 0) / page.words.length) * 100,
            ) / 100
          : null,
    };
  });
}

function extractWithAzureDocumentIntelligence(filePath, mimetype) {
  if (!isAzureDocumentIntelligenceConfigured()) {
    return { text: "", pages: [], extractor: "azure_document_intelligence", error: "Azure Document Intelligence not configured." };
  }

  const analyze = runCommand(
    "curl",
    [
      "-sS",
      "-i",
      "-X",
      "POST",
      buildAzureDocAiUrl(),
      "-H",
      `Ocp-Apim-Subscription-Key: ${AZURE_DI_KEY}`,
      "-H",
      `Content-Type: ${mimetype || "application/pdf"}`,
      "--data-binary",
      `@${filePath}`,
    ],
    { timeout: 120000 },
  );
  if (analyze.error) {
    return { text: "", pages: [], extractor: "azure_document_intelligence", error: analyze.error.message };
  }
  if (analyze.status !== 0) {
    return { text: "", pages: [], extractor: "azure_document_intelligence", error: analyze.stderr || "Azure analyze request failed." };
  }

  const { headersText, bodyText } = parseCurlHttpResponse(analyze.stdout || "");
  const headers = parseHeaders(headersText);
  const operationLocation = headers["operation-location"] || headers["operation-location".toLowerCase()];
  if (!operationLocation) {
    return {
      text: "",
      pages: [],
      extractor: "azure_document_intelligence",
      error: `Azure analyze response missing operation-location. ${String(bodyText || "").slice(0, 240)}`,
    };
  }

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const statusResponse = runCommand(
      "curl",
      ["-sS", "-X", "GET", operationLocation, "-H", `Ocp-Apim-Subscription-Key: ${AZURE_DI_KEY}`],
      { timeout: 120000 },
    );
    if (statusResponse.error) {
      return { text: "", pages: [], extractor: "azure_document_intelligence", error: statusResponse.error.message };
    }
    if (statusResponse.status !== 0) {
      return {
        text: "",
        pages: [],
        extractor: "azure_document_intelligence",
        error: statusResponse.stderr || "Azure result polling failed.",
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(String(statusResponse.stdout || "{}"));
    } catch (error) {
      return {
        text: "",
        pages: [],
        extractor: "azure_document_intelligence",
        error: "Azure result payload could not be parsed.",
      };
    }

    const status = String(parsed?.status || "").toLowerCase();
    if (status === "succeeded") {
      const document = parsed?.analyzeResult || {};
      const pages = buildAzurePages(document);
      return {
        text: String(document?.content || "").trim(),
        pages,
        extractor: "azure_document_intelligence",
        error: "",
        providerMeta: {
          modelId: AZURE_DI_MODEL,
          pageCount: pages.length,
        },
      };
    }
    if (status === "failed") {
      return {
        text: "",
        pages: [],
        extractor: "azure_document_intelligence",
        error: parsed?.error?.message || "Azure Document Intelligence failed to analyze this file.",
      };
    }

    runCommand("sh", ["-lc", "sleep 1"], { timeout: 3000 });
  }

  return {
    text: "",
    pages: [],
    extractor: "azure_document_intelligence",
    error: "Azure Document Intelligence timed out while analyzing the document.",
  };
}

function scoreExtractedText(text = "") {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return 0;
  const keywordMatches =
    normalized.match(/\b(hba1c|hbalc|glucose|sugar|cbc|hemoglobin|platelet|wbc|rbc|creatinine|urea|uric acid|bilirubin|sgpt|sgot|alt|ast|cholesterol|ldl|hdl|triglycerides|tsh|t3|t4|esr|bmi|weight)\b/gi)?.length || 0;
  const numericMatches = normalized.match(/\d+(?:[.,°]\d+)?/g)?.length || 0;
  return Math.min(normalized.length, 800) + keywordMatches * 50 + numericMatches * 10;
}

function extractWithSwiftOcr(filePath, mimetype) {
  const scriptPath = path.join(__dirname, "../../scripts/report_ocr.swift");
  const cacheDir = path.join(os.tmpdir(), "swift-module-cache");
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch {}
  const result = runCommand("swift", [scriptPath, filePath, mimetype], {
    env: { CLANG_MODULE_CACHE_PATH: cacheDir },
  });
  if (result.error) {
    return { text: "", extractor: "swift_ocr", error: result.error.message };
  }
  if (result.status !== 0) {
    return { text: "", extractor: "swift_ocr", error: result.stderr || "OCR failed." };
  }
  try {
    const parsed = JSON.parse(result.stdout || "{}");
    return {
      text: String(parsed.text || ""),
      extractor: "swift_ocr",
      error: parsed.error || "",
    };
  } catch (error) {
    return { text: "", extractor: "swift_ocr", error: "Unable to parse OCR output." };
  }
}

function extractPdfWithPdftotext(filePath) {
  const result = runCommand("pdftotext", ["-layout", "-nopgbrk", filePath, "-"]);
  if (result.error) {
    return { text: "", extractor: "pdftotext", error: result.error.message };
  }
  if (result.status !== 0) {
    return { text: "", extractor: "pdftotext", error: result.stderr || "pdftotext failed." };
  }
  return {
    text: String(result.stdout || "").trim(),
    extractor: "pdftotext",
    error: "",
  };
}

function getPdfPageCount(filePath) {
  const result = runCommand("pdfinfo", [filePath], { timeout: 15000 });
  if (result.error || result.status !== 0) return null;
  const match = String(result.stdout || "").match(/Pages:\s+(\d+)/i);
  const value = Number(match?.[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractPdfPagesWithPdftotext(filePath) {
  const pageCount = getPdfPageCount(filePath);
  if (!pageCount) return [];
  const pages = [];
  for (let page = 1; page <= pageCount; page += 1) {
    const result = runCommand("pdftotext", ["-layout", "-nopgbrk", "-f", String(page), "-l", String(page), filePath, "-"]);
    if (result.error || result.status !== 0) {
      pages.push({ pageNumber: page, text: "" });
      continue;
    }
    pages.push({ pageNumber: page, text: String(result.stdout || "").trim() });
  }
  return pages;
}

function runTesseractPass(filePath, extraArgs = []) {
  const args = [filePath, "stdout", ...extraArgs];
  const result = runCommand("tesseract", args, { timeout: 60000 });
  if (result.error) {
    return { text: "", error: result.error.message };
  }
  if (result.status !== 0) {
    return { text: "", error: result.stderr || "tesseract failed." };
  }
  return {
    text: String(result.stdout || "").trim(),
    error: "",
  };
}

function extractImageWithTesseract(filePath) {
  const passes = [
    { name: "tesseract_psm6", args: ["--psm", "6"] },
    { name: "tesseract", args: [] },
    { name: "tesseract_psm11", args: ["--psm", "11"] },
  ];

  let best = { text: "", extractor: "tesseract", error: "tesseract failed.", score: 0 };
  for (const pass of passes) {
    const outcome = runTesseractPass(filePath, pass.args);
    const score = scoreExtractedText(outcome.text);
    if (score > best.score * 1.1 || (!best.text && score > 0)) {
      best = {
        text: outcome.text,
        extractor: pass.name,
        error: outcome.error,
        score,
      };
    }
  }

  return {
    text: best.text,
    extractor: best.extractor,
    error: best.text ? "" : best.error,
  };
}

function hasUsablePdfText(text = "") {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (normalized.length < 80) return false;
  const signalPatterns = [
    /\b(hba1c|glucose|sugar|cbc|hemoglobin|platelet|wbc|creatinine|urea|uric acid|bilirubin|sgpt|sgot|alt|ast|cholesterol|ldl|hdl|triglycerides|tsh|t3|t4)\b/i,
    /\b(mg\/dl|g\/dl|uiu\/ml|u\/l|%|ng\/dl|ug\/dl)\b/i,
    /\d+(?:\.\d+)?/,
  ];
  return signalPatterns.filter((pattern) => pattern.test(normalized)).length >= 2;
}

function extractPdfWithTesseract(filePath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "report-pdf-ocr-"));
  try {
    const prefix = path.join(tempDir, "page");
    const render = runCommand("pdftoppm", ["-png", filePath, prefix], { timeout: 60000 });
    if (render.error) {
      return { text: "", extractor: "pdftoppm+tesseract", error: render.error.message };
    }
    if (render.status !== 0) {
      return { text: "", extractor: "pdftoppm+tesseract", error: render.stderr || "pdftoppm failed." };
    }

    const pageFiles = fs
      .readdirSync(tempDir)
      .filter((name) => name.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((name) => path.join(tempDir, name));

    if (!pageFiles.length) {
      return { text: "", extractor: "pdftoppm+tesseract", error: "No PDF pages were rendered for OCR." };
    }

    const parts = [];
    const pages = [];
    for (const pageFile of pageFiles) {
      const ocr = extractImageWithTesseract(pageFile);
      const pageMatch = pageFile.match(/page-(\d+)\.png$/i);
      const pageNumber = Number(pageMatch?.[1]) || pages.length + 1;
      const pageText = String(ocr.text || "").trim();
      pages.push({ pageNumber, text: pageText });
      if (pageText) parts.push(pageText);
    }

    return {
      text: parts.join("\n").trim(),
      pages,
      extractor: "pdftoppm+tesseract",
      error: parts.length ? "" : "Tesseract could not extract text from rendered PDF pages.",
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

function getExtractionCapabilities() {
  const platform = process.platform;
  return {
    platform,
    plainText: true,
    azureDocumentIntelligence: isAzureDocumentIntelligenceConfigured(),
    pdftotext: hasCommand("pdftotext"),
    pdfinfo: hasCommand("pdfinfo"),
    pdftoppm: hasCommand("pdftoppm"),
    tesseract: hasCommand("tesseract"),
    swiftVisionOcr: platform === "darwin" && hasCommand("swift"),
  };
}

function extractTextFromFile({ filePath, mimetype = "" }) {
  const document = extractDocumentFromFile({ filePath, mimetype });
  return {
    text: document.text,
    extractor: document.extractor,
    error: document.error,
  };
}

function extractDocumentFromFile({ filePath, mimetype = "" }) {
  if (!filePath || !fs.existsSync(filePath)) {
    return { text: "", pages: [], extractor: "none", error: "File missing." };
  }

  const extension = path.extname(filePath).toLowerCase();
  if (mimetype === "text/plain" || extension === ".txt" || extension === ".csv") {
    return {
      text: extractTextFromPlainFile(filePath),
      pages: [{ pageNumber: 1, text: extractTextFromPlainFile(filePath) }],
      extractor: "plain_text",
      error: "",
    };
  }

  const capabilities = getExtractionCapabilities();
  const isPdf = mimetype === "application/pdf" || extension === ".pdf";
  const isImage = mimetype.startsWith("image/") || [".png", ".jpg", ".jpeg", ".heic", ".webp"].includes(extension);

  const tryAzureFirst =
    isAzureDocumentIntelligenceConfigured() &&
    (EXTRACTION_PROVIDER === "auto" || EXTRACTION_PROVIDER === "azure" || EXTRACTION_PROVIDER === "azure_document_intelligence");

  if ((isPdf || isImage) && tryAzureFirst) {
    const azureResult = extractWithAzureDocumentIntelligence(filePath, mimetype);
    if (azureResult.text) return azureResult;
  }

  if (isPdf && capabilities.pdftotext) {
    const result = extractPdfWithPdftotext(filePath);
    const pages = capabilities.pdfinfo ? extractPdfPagesWithPdftotext(filePath) : [];
    if (hasUsablePdfText(result.text)) return { ...result, pages };
  }

  if (isImage && capabilities.tesseract) {
    const result = extractImageWithTesseract(filePath);
    if (result.text) return { ...result, pages: [{ pageNumber: 1, text: result.text }] };
  }

  if (isPdf && capabilities.pdftoppm && capabilities.tesseract) {
    const result = extractPdfWithTesseract(filePath);
    if (result.text) return result;
  }

  if ((isPdf || isImage) && capabilities.swiftVisionOcr) {
    const result = extractWithSwiftOcr(filePath, mimetype);
    if (result.text) return { ...result, pages: [{ pageNumber: 1, text: result.text }] };
    return { ...result, pages: [] };
  }

  const missing = [];
  if (isPdf && !capabilities.pdftotext && !capabilities.swiftVisionOcr) missing.push("pdftotext or macOS Vision OCR");
  if (isImage && !capabilities.tesseract && !capabilities.swiftVisionOcr) missing.push("tesseract or macOS Vision OCR");

  return {
    text: "",
    pages: [],
    extractor: "unavailable",
    error: missing.length
      ? `No supported extractor is available for this file type on ${capabilities.platform}. Install ${missing.join(" / ")}.`
      : "No supported extractor is available for this file type.",
  };
}

module.exports = {
  extractDocumentFromFile,
  extractTextFromFile,
  getExtractionCapabilities,
};
