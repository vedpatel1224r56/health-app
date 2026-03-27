const createTriageService = ({ fs, spawn, MODEL_ENABLED, PYTHON_BIN, TRIAGE_MODEL_SCRIPT, TRIAGE_MODEL_FILE }) => {
  const buildTriagePrompt = (payload) => {
    const sanitized = {
      triageType: payload?.triageType || "general",
      age: payload?.age || null,
      sex: payload?.sex || null,
      durationDays: payload?.durationDays || null,
      severity: payload?.severity || null,
      symptoms: payload?.symptoms || [],
      redFlags: payload?.redFlags || [],
      dentalSymptoms: payload?.dentalSymptoms || [],
      dentalRedFlags: payload?.dentalRedFlags || [],
      dentalPainScale: payload?.dentalPainScale || null,
      dentalHotColdTrigger: payload?.dentalHotColdTrigger || false,
      dentalSwelling: payload?.dentalSwelling || false,
      additionalContext: payload?.additionalContext || "",
    };

    return `Patient intake (JSON):\n${JSON.stringify(sanitized, null, 2)}\n\nReturn ONLY valid JSON with keys: level, headline, urgency, suggestions, disclaimer.\n- level must be one of: emergency, urgent, self_care.\n- headline: short sentence.\n- urgency: 1-2 sentences.\n- suggestions: array of 3-5 short actionable tips.\n- disclaimer: include that this is general guidance, not diagnosis, and to seek immediate care for emergencies.\nDo not provide a medical diagnosis, do not give medication dosages, and do not replace a clinician.`;
  };

  const extractOutputText = (response) => {
    if (!response || !Array.isArray(response.output)) return "";
    const parts = [];
    for (const item of response.output) {
      if (item.type === "message" && item.role === "assistant") {
        for (const content of item.content || []) {
          if (content.type === "output_text" && content.text) {
            parts.push(content.text);
          }
        }
      }
    }
    return parts.join("\n").trim();
  };

  const safeParseJson = (text) => {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  };

  const isValidAiResult = (result) => {
    if (!result) return false;
    const levels = new Set(["emergency", "urgent", "self_care"]);
    return (
      levels.has(result.level) &&
      typeof result.headline === "string" &&
      typeof result.urgency === "string" &&
      Array.isArray(result.suggestions) &&
      typeof result.disclaimer === "string"
    );
  };

  const callOpenAiTriage = async (payload) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions:
          "You are a cautious medical triage assistant. Provide general health guidance only. Do not diagnose, do not prescribe medication dosages, and encourage seeking professional care for severe or red-flag symptoms. Keep output concise.",
        input: buildTriagePrompt(payload),
        temperature: 0.2,
        max_output_tokens: 400,
        text: { format: { type: "text" } },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI request failed.");
    }

    const outputText = extractOutputText(data);
    const parsed = safeParseJson(outputText);
    return isValidAiResult(parsed) ? parsed : null;
  };

  const callGeminiTriage = async (payload) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const endpoint =
      process.env.GEMINI_ENDPOINT ||
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 400,
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildTriagePrompt(payload) }],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: "You are a cautious medical triage assistant. Provide general health guidance only. Do not diagnose, do not prescribe medication dosages, and encourage seeking professional care for severe or red-flag symptoms. Keep output concise and return valid JSON only.",
            },
          ],
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Gemini request failed.");
    }

    const outputText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n")
        .trim() || "";
    const parsed = safeParseJson(outputText);
    return isValidAiResult(parsed) ? parsed : null;
  };

  const callConfiguredAiTriage = async (payload) => {
    const provider = (process.env.AI_PROVIDER || "").toLowerCase();
    if (provider === "local" || provider === "none" || provider === "offline") return null;

    if (provider === "gemini") return callGeminiTriage(payload);
    if (provider === "openai") return callOpenAiTriage(payload);

    if (process.env.GEMINI_API_KEY) return callGeminiTriage(payload);
    return callOpenAiTriage(payload);
  };

  const callLocalModelTriage = async (payload) => {
    if (!MODEL_ENABLED) return null;
    if (!fs.existsSync(TRIAGE_MODEL_SCRIPT) || !fs.existsSync(TRIAGE_MODEL_FILE)) return null;

    const input = {
      triageType: payload?.triageType || "general",
      age: payload?.age ?? null,
      sex: payload?.sex ?? null,
      durationDays: payload?.durationDays ?? null,
      severity: payload?.severity ?? null,
      symptoms: payload?.symptoms || [],
      redFlags: payload?.redFlags || [],
      additionalSymptoms: payload?.additionalSymptoms || "",
      dentalPainScale: payload?.dentalPainScale ?? null,
      dentalSymptoms: payload?.dentalSymptoms || [],
      dentalRedFlags: payload?.dentalRedFlags || [],
      dentalHotColdTrigger: payload?.dentalHotColdTrigger || false,
      dentalSwelling: payload?.dentalSwelling || false,
    };

    const stdout = await new Promise((resolve, reject) => {
      const child = spawn(PYTHON_BIN, [TRIAGE_MODEL_SCRIPT], {
        env: {
          ...process.env,
          TRIAGE_MODEL_FILE,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let out = "";
      let err = "";
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Local model timeout"));
      }, 4000);

      child.stdout.on("data", (chunk) => {
        out += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        err += String(chunk);
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(err || `Local model exited with code ${code}`));
          return;
        }
        resolve(out.trim());
      });

      child.stdin.write(JSON.stringify(input));
      child.stdin.end();
    });

    const parsed = safeParseJson(stdout);
    return isValidAiResult(parsed) ? parsed : null;
  };

  const triageEngine = (payload) => {
    const {
      symptoms = [],
      severity = 3,
      durationDays = 1,
      redFlags = [],
      age,
      photo,
    } = payload || {};

    const normalizedSymptoms = symptoms.map((s) => s.toLowerCase());
    const normalizedRedFlags = redFlags.map((s) => s.toLowerCase());

    const redFlagKeywords = [
      "chest pain",
      "trouble breathing",
      "severe breathlessness",
      "uncontrolled bleeding",
      "fainting",
      "loss of consciousness",
      "stroke",
      "seizure",
      "severe allergic reaction",
      "suicidal thoughts",
    ];

    const symptomRedFlagHit = normalizedSymptoms.some((symptom) =>
      redFlagKeywords.some((flag) => symptom.includes(flag)),
    );

    const redFlagHit =
      symptomRedFlagHit ||
      normalizedRedFlags.some((flag) =>
        redFlagKeywords.some((keyword) => flag.includes(keyword)),
      );

    const highRiskAge = age && Number(age) >= 65;
    const veryYoungAge = age && Number(age) <= 5;
    const longDuration = durationDays && Number(durationDays) >= 7;
    const highSeverity = Number(severity) >= 4;
    const severeSymptoms = Number(severity) >= 5;
    const multipleSymptoms = normalizedSymptoms.length >= 5;

    let level = "self_care";
    let headline = "Likely manageable with home care";
    let urgency = "Monitor symptoms and practice self-care.";
    let confidence = "medium";
    const reasons = [];

    let riskScore = 0;
    if (highSeverity) riskScore += 2;
    if (severeSymptoms) riskScore += 2;
    if (longDuration) riskScore += 2;
    if (highRiskAge || veryYoungAge) riskScore += 2;
    if (multipleSymptoms) riskScore += 1;
    riskScore += Math.min(normalizedRedFlags.length, 2) * 2;

    if (highRiskAge) reasons.push("Older age risk (65+).");
    if (veryYoungAge) reasons.push("Young child requires cautious escalation.");
    if (longDuration) reasons.push("Symptoms present for 7+ days.");
    if (highSeverity) reasons.push("Reported symptom severity is high.");
    if (multipleSymptoms) reasons.push("Multiple symptoms reported.");

    if (redFlagHit) {
      level = "emergency";
      headline = "Seek emergency care now";
      urgency = "Go to the nearest emergency facility or call local emergency services.";
      confidence = "high";
      reasons.push("Red-flag symptom detected.");
    } else if (riskScore >= 4) {
      level = "urgent";
      headline = "Talk to a clinician soon";
      urgency = "Consider a local clinic visit within 24-48 hours.";
      confidence = "high";
    } else if (riskScore >= 2) {
      confidence = "medium";
      reasons.push("Monitor closely due to moderate risk indicators.");
    } else {
      confidence = "medium";
    }

    const suggestions = [
      "Rest, hydrate, and avoid strenuous activity.",
      "Track your symptoms and note any changes.",
      "If symptoms worsen, seek medical care.",
    ];

    if (normalizedSymptoms.some((s) => s.includes("fever"))) {
      suggestions.push("Check temperature twice daily and keep fluids up.");
    }
    if (normalizedSymptoms.some((s) => s.includes("cough"))) {
      suggestions.push("Warm fluids can soothe throat irritation.");
    }
    if (normalizedSymptoms.some((s) => s.includes("diarrhea"))) {
      suggestions.push("Use oral rehydration salts if available.");
    }
    if (photo) {
      suggestions.push(
        "If a visible issue is present, share the photo with a clinician for proper evaluation.",
      );
    }

    return {
      level,
      headline,
      urgency,
      suggestions,
      confidence,
      reasons,
      disclaimer:
        "This is general guidance, not a medical diagnosis. For emergencies, seek immediate care.",
    };
  };

  const dentalTriageEngine = (payload) => {
    const dentalSymptoms = (payload?.dentalSymptoms || []).map((s) => String(s).toLowerCase());
    const dentalRedFlags = (payload?.dentalRedFlags || []).map((s) => String(s).toLowerCase());
    const pain = Number(payload?.dentalPainScale || 3);
    const durationDays = Number(payload?.durationDays || payload?.dentalDurationDays || 1);
    const hasSwelling = payload?.dentalSwelling === true || dentalSymptoms.some((s) => s.includes("swelling"));
    const hasHotColdTrigger = payload?.dentalHotColdTrigger === true;

    const emergencyFlags = [
      "difficulty breathing",
      "difficulty swallowing",
      "uncontrolled bleeding",
      "facial swelling with fever",
      "trauma with severe bleeding",
    ];
    const emergencyHit = dentalRedFlags.some((flag) =>
      emergencyFlags.some((key) => flag.includes(key)),
    );

    let level = "self_care";
    let headline = "Likely manageable with dental self-care";
    let urgency = "Monitor symptoms and book a routine dental consultation.";
    let confidence = "medium";
    const reasons = [];

    if (emergencyHit) {
      level = "emergency";
      headline = "Seek emergency dental/medical care now";
      urgency = "Go to the nearest emergency facility immediately.";
      confidence = "high";
      reasons.push("Critical dental red flag detected.");
    } else if (pain >= 4 || durationDays >= 3 || hasSwelling) {
      level = "urgent";
      headline = "Visit a dentist soon";
      urgency = "Book a dental clinic visit within 24 hours.";
      confidence = "high";
      if (pain >= 4) reasons.push("Moderate to severe dental pain.");
      if (durationDays >= 3) reasons.push("Symptoms persisting for multiple days.");
      if (hasSwelling) reasons.push("Visible swelling may indicate infection.");
    } else if (hasHotColdTrigger) {
      reasons.push("Temperature sensitivity reported.");
    }

    const suggestions = [
      "Keep the area clean and avoid hard foods on the painful side.",
      "Use warm saline rinses 2-3 times daily.",
      "Avoid very hot/cold sugary foods if sensitivity is present.",
      "Carry previous dental reports/X-rays to the clinic visit.",
    ];

    return {
      level,
      headline,
      urgency,
      suggestions,
      confidence,
      reasons,
      disclaimer:
        "This is general dental guidance, not a diagnosis. For severe symptoms, seek immediate professional care.",
    };
  };

  const validateTriagePayload = (payload) => {
    const errors = [];
    if (payload.age !== undefined && payload.age !== null) {
      if (Number.isNaN(Number(payload.age)) || Number(payload.age) < 0 || Number(payload.age) > 120) {
        errors.push("Age must be between 0 and 120.");
      }
    }
    if (
      payload.durationDays !== undefined &&
      payload.durationDays !== null &&
      (Number.isNaN(Number(payload.durationDays)) ||
        Number(payload.durationDays) < 0 ||
        Number(payload.durationDays) > 90)
    ) {
      errors.push("Duration must be between 0 and 90 days.");
    }
    if (
      payload.severity !== undefined &&
      payload.severity !== null &&
      (Number.isNaN(Number(payload.severity)) || Number(payload.severity) < 1 || Number(payload.severity) > 5)
    ) {
      errors.push("Severity must be between 1 and 5.");
    }
    if (payload.symptoms && (!Array.isArray(payload.symptoms) || payload.symptoms.length > 20)) {
      errors.push("Symptoms must be an array with up to 20 items.");
    }
    if (payload.redFlags && (!Array.isArray(payload.redFlags) || payload.redFlags.length > 10)) {
      errors.push("Red flags must be an array with up to 10 items.");
    }
    if (payload.triageType === "dental") {
      if (
        payload.dentalPainScale !== undefined &&
        payload.dentalPainScale !== null &&
        (Number.isNaN(Number(payload.dentalPainScale)) ||
          Number(payload.dentalPainScale) < 1 ||
          Number(payload.dentalPainScale) > 10)
      ) {
        errors.push("Dental pain scale must be between 1 and 10.");
      }
      if (
        payload.dentalSymptoms &&
        (!Array.isArray(payload.dentalSymptoms) || payload.dentalSymptoms.length > 20)
      ) {
        errors.push("Dental symptoms must be an array with up to 20 items.");
      }
      if (
        payload.dentalRedFlags &&
        (!Array.isArray(payload.dentalRedFlags) || payload.dentalRedFlags.length > 10)
      ) {
        errors.push("Dental red flags must be an array with up to 10 items.");
      }
    }
    if (
      payload.additionalSymptoms &&
      typeof payload.additionalSymptoms === "string" &&
      payload.additionalSymptoms.length > 500
    ) {
      errors.push("Additional symptoms text is too long.");
    }
    return errors;
  };

  return {
    buildTriagePrompt,
    extractOutputText,
    safeParseJson,
    isValidAiResult,
    callOpenAiTriage,
    callGeminiTriage,
    callConfiguredAiTriage,
    callLocalModelTriage,
    triageEngine,
    dentalTriageEngine,
    validateTriagePayload,
  };
};

module.exports = { createTriageService };
