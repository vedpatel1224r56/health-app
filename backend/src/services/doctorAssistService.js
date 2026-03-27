const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) =>
  normalizeText(value)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

const COMMON_TEMPLATES = [
  {
    id: "general-follow-up",
    label: "Follow-up review note",
    departmentKeys: ["general", "pediatrics", "surgery"],
    triggers: ["followup", "follow-up", "review", "revisit"],
    noteText:
      "Follow-up consultation performed. Clinical progress, symptom burden, treatment adherence, and interval events were reviewed. Examination findings and current plan were updated after discussion with the patient/caregiver.",
    summaryPatch: {
      chiefComplaint: "Follow-up review",
      planText:
        "Continue advised care, review response to treatment, and return earlier if warning signs or worsening symptoms appear.",
    },
  },
  {
    id: "fever-template",
    label: "Fever assessment",
    departmentKeys: ["general", "pediatrics"],
    triggers: ["fever", "pyrexia", "temperature"],
    noteText:
      "Patient assessed for fever. History includes duration, temperature pattern, associated symptoms, intake/output, and red-flag symptoms. Examination and hydration status were reviewed, and supportive care with safety-net advice was discussed.",
    summaryPatch: {
      chiefComplaint: "Fever",
      findings:
        "Fever history reviewed with associated symptom screen and clinical examination.",
      planText:
        "Supportive care, fluids, fever monitoring, and return precautions discussed. Escalate if persistent fever, lethargy, breathing difficulty, dehydration, or other red flags appear.",
    },
  },
  {
    id: "jaundice-template",
    label: "Jaundice assessment",
    departmentKeys: ["general", "pediatrics"],
    triggers: ["jaundice", "icterus", "yellow"],
    noteText:
      "Clinical assessment performed for jaundice. History focused on onset and progression of yellow discoloration, urine/stool color, feeding/appetite, fever, lethargy, and associated abdominal symptoms. Examination findings and need for laboratory evaluation were discussed.",
    summaryPatch: {
      chiefComplaint: "Jaundice",
      findings:
        "Jaundice-focused history and examination performed, including associated systemic symptoms and hydration assessment.",
      diagnosisText: "Jaundice under evaluation",
      planText:
        "Correlate clinically and investigate as indicated. Counsel regarding red flags such as worsening jaundice, poor intake, lethargy, vomiting, bleeding, or altered sensorium.",
    },
  },
  {
    id: "viral-fever-template",
    label: "Viral fever / body ache assessment",
    departmentKeys: ["general", "pediatrics"],
    triggers: ["viral", "body ache", "fever with cold", "myalgia", "weakness"],
    noteText:
      "Clinical review performed for probable viral febrile illness. Duration of fever, body ache, upper respiratory symptoms, hydration, intake, and red-flag symptoms were reviewed. Examination focused on general condition, hydration, respiratory status, and need for further testing or follow-up.",
    summaryPatch: {
      chiefComplaint: "Fever with body ache / viral symptoms",
      findings:
        "Febrile illness reviewed with hydration, respiratory status, and red-flag symptom assessment.",
      planText:
        "Supportive care, fluids, fever control, and return precautions discussed. Review urgently if persistent high fever, breathing difficulty, poor intake, lethargy, bleeding, or worsening symptoms develop.",
    },
  },
  {
    id: "loose-motion-template",
    label: "Loose motion / dehydration assessment",
    departmentKeys: ["general", "pediatrics"],
    triggers: ["loose motion", "diarrhoea", "diarrhea", "motions", "dehydration", "stools"],
    noteText:
      "Patient assessed for loose motions with hydration review. Frequency of stools, vomiting, intake, urine output, fever, abdominal symptoms, and dehydration features were reviewed. Clinical advice focused on oral hydration, feeding, and warning signs needing urgent reassessment.",
    summaryPatch: {
      chiefComplaint: "Loose motions",
      findings:
        "Hydration, intake/output, abdominal symptoms, and general clinical stability reviewed.",
      planText:
        "Oral rehydration, diet and fluid advice, and return precautions discussed. Review urgently for persistent vomiting, reduced urine output, blood in stools, lethargy, or poor oral intake.",
    },
  },
  {
    id: "respiratory-infection-template",
    label: "Cold / cough / throat infection review",
    departmentKeys: ["general", "pediatrics"],
    triggers: ["cold", "cough", "throat pain", "sore throat", "uri", "urti", "runny nose"],
    noteText:
      "Patient reviewed for upper respiratory symptoms. History covered fever, cough, cold, throat discomfort, breathing difficulty, intake, and duration of symptoms. Examination and supportive-care advice were documented, with escalation advice for worsening respiratory symptoms.",
    summaryPatch: {
      chiefComplaint: "Cold and cough",
      findings:
        "Upper respiratory symptom review completed with airway and respiratory red-flag screening.",
      planText:
        "Supportive treatment and monitoring advised. Review urgently for persistent fever, breathing difficulty, poor intake, wheeze, or worsening cough.",
    },
  },
];

const PEDIATRIC_TEMPLATES = [
  {
    id: "peds-jaundice",
    label: "Pediatric jaundice review",
    departmentKeys: ["pediatrics"],
    triggers: ["jaundice", "icterus", "yellow", "bilirubin"],
    noteText:
      "Child reviewed for jaundice. Caregiver history covered onset, feeding pattern, urine/stool color, activity level, fever, and weight trend. Examination included hydration, icterus assessment, and general clinical stability. Caregiver was counselled on warning signs and need for bilirubin or other investigations where appropriate.",
    summaryPatch: {
      chiefComplaint: "Child with jaundice",
      findings:
        "Pediatric jaundice history reviewed with feeding, output, hydration, and stability assessment.",
      diagnosisText: "Pediatric jaundice under evaluation",
      planText:
        "Assess severity, correlate with age and feeding status, investigate as indicated, and review urgently if poor feeding, lethargy, fever, vomiting, or worsening discoloration occurs.",
    },
  },
  {
    id: "peds-growth-followup",
    label: "Growth and development follow-up",
    departmentKeys: ["pediatrics"],
    triggers: ["growth", "milestone", "development", "weight gain", "height"],
    noteText:
      "Pediatric follow-up focused on growth and development. Weight, height, feeding pattern, developmental milestones, and caregiver concerns were reviewed. Growth trend and follow-up planning were discussed with the caregiver.",
    summaryPatch: {
      chiefComplaint: "Growth and development follow-up",
      findings:
        "Growth trend and developmental context reviewed with caregiver.",
      planText:
        "Track serial growth parameters, milestones, nutrition, and scheduled follow-up. Escalate if faltering growth or developmental concerns persist.",
    },
  },
  {
    id: "peds-gastroenteritis",
    label: "Vomiting / diarrhea assessment",
    departmentKeys: ["pediatrics"],
    triggers: ["vomiting", "diarrhea", "dehydration", "loose stools", "gastro"],
    noteText:
      "Child assessed for vomiting/diarrhea. History included stool/vomit frequency, intake, urine output, fever, and dehydration symptoms. Hydration and general activity were assessed clinically, and caregiver was counselled on oral rehydration, feeding, and warning signs.",
    summaryPatch: {
      chiefComplaint: "Vomiting / diarrhea",
      findings:
        "Hydration, intake/output, and clinical stability assessed in a child with gastrointestinal symptoms.",
      planText:
        "Oral rehydration, feeding guidance, monitoring of urine output and activity, and urgent return advice for dehydration, persistent vomiting, lethargy, or blood in stools.",
    },
  },
  {
    id: "peds-viral-fever",
    label: "Pediatric viral fever review",
    departmentKeys: ["pediatrics"],
    triggers: ["viral fever", "fever cold", "fever cough", "body pain", "running nose"],
    noteText:
      "Child assessed for febrile illness with probable viral etiology. Caregiver history included fever duration, cough/cold symptoms, intake, urine output, activity level, and red-flag symptoms. Clinical stability and hydration were reviewed, and caregiver counselling was provided.",
    summaryPatch: {
      chiefComplaint: "Child with fever / cold symptoms",
      findings:
        "Pediatric febrile illness reviewed with hydration, respiratory status, intake, and activity assessment.",
      planText:
        "Supportive care, fluids, temperature monitoring, and caregiver warning signs discussed. Review urgently for breathing difficulty, poor feeding, lethargy, seizures, or persistent high fever.",
    },
  },
  {
    id: "peds-wheeze-template",
    label: "Wheeze / breathing difficulty review",
    departmentKeys: ["pediatrics"],
    triggers: ["wheeze", "wheezing", "breathing difficulty", "fast breathing", "noisy breathing", "asthma"],
    noteText:
      "Child reviewed for wheeze or breathing difficulty. Caregiver history covered cough, fever, noisy breathing, feeding tolerance, prior wheeze episodes, and inhaler/nebulization response where relevant. Respiratory effort and need for escalation were assessed clinically.",
    summaryPatch: {
      chiefComplaint: "Wheeze / breathing difficulty",
      findings:
        "Respiratory symptoms reviewed with work of breathing, feeding tolerance, and prior wheeze history.",
      planText:
        "Monitor respiratory distress, intake, and response to treatment. Review urgently for chest retractions, cyanosis, lethargy, poor feeding, or worsening breathing difficulty.",
    },
  },
  {
    id: "peds-anemia-nutrition-template",
    label: "Pediatric anaemia / nutrition review",
    departmentKeys: ["pediatrics"],
    triggers: ["anemia", "anaemia", "poor weight gain", "nutrition", "pallor", "weak child"],
    noteText:
      "Child reviewed for nutrition, pallor, or poor weight gain concerns. Feeding history, appetite, weight trend, developmental context, and any prior investigations or supplements were reviewed with the caregiver. Clinical counselling focused on nutrition support and follow-up planning.",
    summaryPatch: {
      chiefComplaint: "Nutrition / anaemia review",
      findings:
        "Growth trend, feeding pattern, pallor concerns, and caregiver observations reviewed.",
      planText:
        "Continue nutrition counselling and follow-up growth review. Investigate and supplement as clinically indicated, with reassessment if feeding or growth concerns persist.",
    },
  },
  {
    id: "peds-immunization-followup",
    label: "Immunization follow-up",
    departmentKeys: ["pediatrics"],
    triggers: ["vaccine", "vaccination", "immunization", "immunisation", "due vaccine"],
    noteText:
      "Pediatric review completed with focus on immunization status. Vaccine history, due doses, interval illnesses, and caregiver questions were reviewed. Counselling was provided regarding due vaccines, timing, and follow-up planning.",
    summaryPatch: {
      chiefComplaint: "Immunization follow-up",
      findings:
        "Vaccine history and due-dose context reviewed with caregiver.",
      planText:
        "Advise timely vaccination as per selected schedule and document follow-up for pending or upcoming doses.",
    },
  },
];

const SURGERY_TEMPLATES = [
  {
    id: "surgery-post-op-stable",
    label: "Post-op stable review",
    departmentKeys: ["surgery"],
    triggers: ["post op", "post-op", "stable", "dressing", "wound"],
    noteText:
      "Post-operative review performed. Pain, wound/dressing status, oral intake, bowel/bladder function, fever, and overall recovery were reviewed. Examination focused on general stability and operative-site concerns. Post-operative advice and follow-up were discussed.",
    summaryPatch: {
      chiefComplaint: "Post-operative follow-up",
      findings:
        "Post-operative recovery reviewed including pain, wound/dressing status, intake, and fever screen.",
      planText:
        "Continue post-operative medications and wound care instructions. Review urgently for fever, increasing pain, discharge, swelling, bleeding, vomiting, or other recovery concerns.",
    },
  },
  {
    id: "surgery-pre-op-review",
    label: "Pre-op review note",
    departmentKeys: ["surgery"],
    triggers: ["pre op", "pre-op", "procedure planned", "consent"],
    noteText:
      "Pre-operative review completed. Indication for planned procedure, current symptoms, consent status, relevant investigations, and peri-operative preparation were reviewed with the patient/family.",
    summaryPatch: {
      chiefComplaint: "Pre-operative review",
      findings:
        "Indication, preparation status, and peri-operative readiness reviewed.",
      planText:
        "Proceed as planned once consent, investigations, and peri-operative preparation are complete. Reinforce fasting, medication, and admission instructions as applicable.",
    },
  },
  {
    id: "surgery-dressing-review",
    label: "Dressing / wound review",
    departmentKeys: ["surgery"],
    triggers: ["dressing", "wound", "sutured", "stitch", "stitches", "discharge from wound"],
    noteText:
      "Surgical dressing and wound review performed. Pain, swelling, discharge, fever, dressing status, and wound appearance were assessed. Advice was provided regarding dressing care, hygiene, red flags, and follow-up timing.",
    summaryPatch: {
      chiefComplaint: "Dressing / wound review",
      findings:
        "Operative or wound-site review completed with pain, discharge, swelling, and fever assessment.",
      planText:
        "Continue advised dressing care and medications. Review urgently for increasing pain, fever, pus discharge, wound gaping, bleeding, or swelling.",
    },
  },
  {
    id: "surgery-appendicitis-review",
    label: "Acute abdomen / appendicitis review",
    departmentKeys: ["surgery"],
    triggers: ["appendix", "appendicitis", "rlq pain", "acute abdomen", "pain right side"],
    noteText:
      "Surgical review performed for abdominal pain suggestive of acute surgical pathology. Symptom duration, pain progression, vomiting, fever, bowel symptoms, and examination findings were reviewed. Need for urgent evaluation, imaging, and observation was discussed as clinically indicated.",
    summaryPatch: {
      chiefComplaint: "Abdominal pain under surgical review",
      findings:
        "Acute abdomen history and examination reviewed with attention to pain progression, vomiting, fever, and localized tenderness.",
      planText:
        "Correlate clinically and investigate as indicated. Escalate urgently for worsening pain, persistent vomiting, fever, guarding, or systemic instability.",
    },
  },
  {
    id: "surgery-hernia-review",
    label: "Hernia / swelling review",
    departmentKeys: ["surgery"],
    triggers: ["hernia", "inguinal swelling", "groin swelling", "reducible swelling", "abdominal wall swelling"],
    noteText:
      "Surgical review completed for hernia or localized swelling. Duration, pain, reducibility, cough impulse, vomiting, bowel symptoms, and red-flag symptoms were reviewed. Need for planned repair versus urgent reassessment was discussed.",
    summaryPatch: {
      chiefComplaint: "Hernia / swelling review",
      findings:
        "Swelling and symptom review completed with reducibility and obstruction/strangulation red-flag assessment.",
      planText:
        "Advise planned surgical follow-up as indicated and review urgently for irreducibility, increasing pain, vomiting, abdominal distension, or fever.",
    },
  },
];

const GENERAL_TEMPLATES = [
  {
    id: "general-hypertension-followup",
    label: "Hypertension follow-up",
    departmentKeys: ["general"],
    triggers: ["hypertension", "bp", "blood pressure"],
    noteText:
      "Follow-up performed for blood pressure management. Symptoms, medication adherence, home readings if available, and warning signs were reviewed. Examination and treatment plan were updated accordingly.",
    summaryPatch: {
      chiefComplaint: "Blood pressure follow-up",
      findings:
        "Blood pressure management reviewed with symptom and adherence assessment.",
      planText:
        "Continue monitoring, reinforce medication adherence and lifestyle measures, and review urgently for headache, chest pain, breathlessness, or neurological symptoms.",
    },
  },
  {
    id: "general-diabetes-followup",
    label: "Diabetes / sugar follow-up",
    departmentKeys: ["general"],
    triggers: ["diabetes", "sugar", "high sugar", "blood sugar", "dm"],
    noteText:
      "Follow-up performed for blood sugar management. Symptoms, medication adherence, home sugar readings where available, diet history, and interval events were reviewed. Examination and ongoing management advice were updated accordingly.",
    summaryPatch: {
      chiefComplaint: "Blood sugar follow-up",
      findings:
        "Diabetes follow-up reviewed with symptom screen, adherence, and interval glycaemic context.",
      planText:
        "Continue advised medications, diet, and monitoring. Review sooner if vomiting, dehydration, symptomatic hyperglycaemia, hypoglycaemia, or worsening weakness occurs.",
    },
  },
  {
    id: "general-dengue-review",
    label: "Dengue / thrombocytopenia review",
    departmentKeys: ["general"],
    triggers: ["dengue", "platelet", "thrombocytopenia", "fever with body ache", "bleeding spots"],
    noteText:
      "Clinical review performed for suspected dengue or thrombocytopenia-related febrile illness. Fever pattern, body ache, intake, urine output, vomiting, bleeding symptoms, and prior reports were reviewed. Clinical stability and warning signs were discussed carefully.",
    summaryPatch: {
      chiefComplaint: "Fever with body ache / dengue review",
      findings:
        "Febrile illness reviewed with bleeding, hydration, urine output, and clinical stability assessment.",
      planText:
        "Advise hydration, monitoring, and repeat review as clinically indicated. Escalate urgently for bleeding, persistent vomiting, abdominal pain, lethargy, or reduced urine output.",
    },
  },
  {
    id: "general-typhoid-review",
    label: "Enteric fever / typhoid review",
    departmentKeys: ["general"],
    triggers: ["typhoid", "enteric fever", "prolonged fever", "step ladder fever"],
    noteText:
      "Clinical review performed for prolonged febrile illness with enteric-fever consideration. Duration of fever, abdominal symptoms, intake, bowel pattern, prior treatment, and available investigations were reviewed. Need for further evaluation and structured follow-up was discussed.",
    summaryPatch: {
      chiefComplaint: "Prolonged fever",
      findings:
        "Prolonged febrile illness reviewed with abdominal, intake, and bowel-history assessment.",
      planText:
        "Correlate clinically with available investigations, continue advised treatment, and review earlier for persistent high fever, vomiting, dehydration, bleeding, or worsening abdominal symptoms.",
    },
  },
  {
    id: "general-acidity-template",
    label: "Acidity / gastritis review",
    departmentKeys: ["general"],
    triggers: ["acidity", "gas", "gastritis", "burning", "epigastric pain", "reflux"],
    noteText:
      "Clinical review completed for upper abdominal burning or acidity symptoms. Duration, meal relation, vomiting, appetite, bowel pattern, and alarming symptoms were reviewed. Diet advice, symptomatic treatment, and follow-up precautions were discussed.",
    summaryPatch: {
      chiefComplaint: "Acidity / upper abdominal discomfort",
      findings:
        "Upper abdominal symptom review completed with red-flag screening for vomiting, bleeding, and persistent pain.",
      planText:
        "Diet and medication advice discussed. Review urgently for persistent vomiting, hematemesis, black stools, severe pain, weight loss, or worsening symptoms.",
    },
  },
  {
    id: "general-cough-cold-template",
    label: "Cough / cold OPD review",
    departmentKeys: ["general"],
    triggers: ["cough cold", "cold cough", "sneezing", "throat infection", "phlegm"],
    noteText:
      "Patient reviewed for cough and cold symptoms. Duration of symptoms, sputum/phlegm history, fever, throat symptoms, breathlessness, and intake were reviewed. Examination findings and need for supportive care versus further assessment were documented.",
    summaryPatch: {
      chiefComplaint: "Cough and cold",
      findings:
        "Respiratory symptom review completed with fever, throat, and breathlessness screen.",
      planText:
        "Advise supportive care and monitoring. Review earlier for high fever, breathing difficulty, chest pain, poor intake, or persistent worsening symptoms.",
    },
  },
];

const CLINICAL_ASSIST_LIBRARY = {
  "fever-template": {
    complaintTemplate: {
      title: "Fever template",
      complaint: "Fever",
      prompts: ["Duration of fever", "Highest recorded temperature", "Associated cough/cold symptoms", "Intake and urine output", "Red flags"],
    },
    diagnoses: [
      { label: "Acute febrile illness", confidence: 0.72, rationale: "Useful working diagnosis for early fever review before a narrower cause is confirmed." },
      { label: "Viral fever under evaluation", confidence: 0.64, rationale: "Common first-pass framing when fever is present without a clear focal bacterial source." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Baseline fever workup if clinically indicated.", why: "Screen for infection severity or cytopenia." },
      { orderType: "lab", itemName: "CRP", destination: "Laboratory", notes: "Add if inflammatory marker would influence review.", why: "Helps trend inflammatory burden." },
    ],
    redFlags: ["Persistent high fever", "Breathing difficulty", "Poor oral intake", "Lethargy or confusion", "Dehydration / reduced urine output"],
    prescriptions: [
      {
        label: "Supportive fever care",
        instructions: "Supportive care, fluid intake, and temperature monitoring explained. Review earlier if red flags appear.",
        items: [{ medicine: "Paracetamol", dose: "As clinically appropriate", frequency: "SOS / as advised", duration: "2-3 days", route: "PO", notes: "Doctor to confirm age/weight-appropriate dosing." }],
      },
    ],
  },
  "viral-fever-template": {
    complaintTemplate: {
      title: "Viral fever template",
      complaint: "Fever with body ache / viral symptoms",
      prompts: ["Fever duration", "Body ache / myalgia", "Respiratory symptoms", "Hydration", "Any bleeding or rash"],
    },
    diagnoses: [
      { label: "Probable viral febrile illness", confidence: 0.82, rationale: "Symptom cluster supports a viral-style draft diagnosis." },
      { label: "Upper respiratory tract infection under review", confidence: 0.52, rationale: "Reasonable when cough/cold symptoms are also described." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Consider if fever persists or patient appears unwell.", why: "Useful baseline review in persistent febrile illness." },
      { orderType: "lab", itemName: "Dengue NS1 / CBC", destination: "Laboratory", notes: "Use only if epidemiology or symptoms support dengue review.", why: "Helpful in Indian febrile illness workflows." },
    ],
    redFlags: ["Bleeding", "Persistent vomiting", "Breathing difficulty", "Poor intake", "Reduced urine output"],
    prescriptions: [
      {
        label: "Viral illness supportive plan",
        instructions: "Rest, hydration, fever monitoring, and return precautions explained.",
        items: [{ medicine: "Paracetamol", dose: "As clinically appropriate", frequency: "SOS / as advised", duration: "2-3 days", route: "PO", notes: "Doctor to confirm dose." }],
      },
    ],
  },
  "jaundice-template": {
    complaintTemplate: {
      title: "Jaundice template",
      complaint: "Jaundice",
      prompts: ["Onset of yellow discoloration", "Urine and stool color", "Fever / abdominal pain", "Appetite and vomiting", "Bleeding / lethargy"],
    },
    diagnoses: [
      { label: "Jaundice under evaluation", confidence: 0.84, rationale: "Safe working diagnosis while cause is still being clarified." },
      { label: "Hepatobiliary dysfunction to rule out", confidence: 0.58, rationale: "Appropriate when associated liver symptoms are suspected." },
    ],
    orders: [
      { orderType: "lab", itemName: "LFT", destination: "Laboratory", notes: "Correlate bilirubin and transaminases with clinical presentation.", why: "Core first-line workup for jaundice." },
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Add if systemic illness or hemolysis concern exists.", why: "Supports broader jaundice workup." },
      { orderType: "radiology", itemName: "Ultrasound abdomen", destination: "Radiology", notes: "Consider if obstructive or hepatobiliary cause is suspected.", why: "Useful when abdominal cause is being evaluated." },
    ],
    redFlags: ["Worsening jaundice", "Vomiting", "Bleeding", "Altered sensorium", "Poor intake / lethargy"],
    prescriptions: [
      {
        label: "Observation and red-flag counselling",
        instructions: "No empirical medicine template is auto-added. Prioritise investigation review and warning-sign counselling.",
        items: [],
      },
    ],
  },
  "respiratory-infection-template": {
    complaintTemplate: {
      title: "Cough / cold template",
      complaint: "Cold and cough",
      prompts: ["Duration of cough", "Fever", "Breathing difficulty", "Sputum / throat pain", "Poor intake"],
    },
    diagnoses: [
      { label: "Upper respiratory tract infection", confidence: 0.78, rationale: "Fits common cough/cold/throat symptom clusters." },
      { label: "Acute cough syndrome", confidence: 0.55, rationale: "Useful broad label when symptoms are still being defined." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Only if symptoms persist or patient appears systemically unwell.", why: "Not always needed, but useful in prolonged or atypical illness." },
    ],
    redFlags: ["Worsening cough", "Breathlessness", "Chest pain", "Persistent fever", "Poor intake"],
    prescriptions: [
      {
        label: "URTI supportive plan",
        instructions: "Supportive care, fluids, steam/saline measures if appropriate, and follow-up precautions explained.",
        items: [],
      },
    ],
  },
  "loose-motion-template": {
    complaintTemplate: {
      title: "Gastroenteritis / dehydration template",
      complaint: "Loose motions",
      prompts: ["Frequency of stools", "Vomiting", "Oral intake", "Urine output", "Blood in stool / lethargy"],
    },
    diagnoses: [
      { label: "Acute gastroenteritis", confidence: 0.8, rationale: "Typical first-pass diagnosis for loose motions with hydration review." },
      { label: "Dehydration risk under assessment", confidence: 0.62, rationale: "Useful when poor intake or reduced urine output is part of the complaint." },
    ],
    orders: [
      { orderType: "lab", itemName: "Electrolytes / RFT", destination: "Laboratory", notes: "Consider if dehydration is significant or symptoms are prolonged.", why: "Helps assess fluid/electrolyte impact." },
      { orderType: "lab", itemName: "Stool routine", destination: "Laboratory", notes: "Reserve for bloody stool or persistent symptoms.", why: "Useful when infective etiology needs more detail." },
    ],
    redFlags: ["Persistent vomiting", "No urine / reduced urine", "Blood in stool", "Lethargy", "Unable to take fluids"],
    prescriptions: [
      {
        label: "Hydration support plan",
        instructions: "Oral rehydration, feeding guidance, and dehydration warning signs explained.",
        items: [{ medicine: "ORS", dose: "As advised", frequency: "Frequent small sips", duration: "Until hydration improves", route: "PO", notes: "Doctor to confirm age-appropriate counselling." }],
      },
    ],
  },
  "general-diabetes-followup": {
    complaintTemplate: {
      title: "Diabetes follow-up template",
      complaint: "Blood sugar follow-up",
      prompts: ["Medication adherence", "Home sugars", "Diet pattern", "Hypoglycemia / hyperglycemia symptoms", "Foot care / complications"],
    },
    diagnoses: [
      { label: "Type 2 diabetes mellitus follow-up", confidence: 0.88, rationale: "Best-fit follow-up framing for known diabetic review." },
      { label: "Suboptimal glycemic control", confidence: 0.67, rationale: "Useful if symptoms or report trends suggest poor control." },
    ],
    orders: [
      { orderType: "lab", itemName: "HbA1c", destination: "Laboratory", notes: "Use if not recently available.", why: "Core long-term diabetes control metric." },
      { orderType: "lab", itemName: "FBS / PPBS", destination: "Laboratory", notes: "Add for current glucose review.", why: "Provides short-term glycemic context." },
      { orderType: "lab", itemName: "Renal function test", destination: "Laboratory", notes: "Consider routine diabetes complication review.", why: "Important for renal monitoring." },
    ],
    redFlags: ["Symptomatic hyperglycemia", "Hypoglycemia episodes", "Vomiting", "Dehydration", "Foot wound / infection"],
    prescriptions: [
      {
        label: "Diabetes continuation template",
        instructions: "Continue current anti-diabetic plan if clinically appropriate, reinforce diet, monitoring, and earlier review for abnormal sugars.",
        items: [],
      },
    ],
  },
  "general-dengue-review": {
    complaintTemplate: {
      title: "Dengue review template",
      complaint: "Fever with body ache / dengue review",
      prompts: ["Days of fever", "Body ache", "Bleeding symptoms", "Vomiting / abdominal pain", "Urine output / hydration"],
    },
    diagnoses: [
      { label: "Dengue under evaluation", confidence: 0.74, rationale: "Useful in endemic settings when symptom profile matches." },
      { label: "Acute febrile illness with thrombocytopenia concern", confidence: 0.68, rationale: "Safer wording if platelets or bleeding are part of the concern." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Trend hematocrit and platelets if clinically indicated.", why: "Key first-line dengue monitoring test." },
      { orderType: "lab", itemName: "Dengue NS1 / IgM", destination: "Laboratory", notes: "Use according to day of illness and local protocol.", why: "Supports etiologic confirmation." },
    ],
    redFlags: ["Bleeding", "Severe abdominal pain", "Persistent vomiting", "Reduced urine output", "Lethargy / hypotension"],
    prescriptions: [],
  },
  "general-typhoid-review": {
    complaintTemplate: {
      title: "Prolonged fever template",
      complaint: "Prolonged fever",
      prompts: ["Duration", "Abdominal symptoms", "Bowel changes", "Prior antibiotics", "Intake and dehydration"],
    },
    diagnoses: [
      { label: "Enteric fever under evaluation", confidence: 0.7, rationale: "Reasonable in prolonged fever with GI history in Indian OPD settings." },
      { label: "Prolonged febrile illness", confidence: 0.63, rationale: "Broad safe label while investigations are pending." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Baseline prolonged fever review.", why: "Useful in prolonged infectious review." },
      { orderType: "lab", itemName: "Typhi IgM / blood culture", destination: "Laboratory", notes: "Use as per local clinical protocol.", why: "Supports typhoid evaluation." },
    ],
    redFlags: ["Persistent high fever", "Vomiting", "Dehydration", "GI bleeding", "Worsening abdominal pain"],
    prescriptions: [],
  },
  "general-acidity-template": {
    complaintTemplate: {
      title: "Acidity template",
      complaint: "Acidity / upper abdominal discomfort",
      prompts: ["Meal relation", "Burning / reflux", "Vomiting", "Bleeding red flags", "Weight loss / appetite"],
    },
    diagnoses: [
      { label: "Acid peptic symptoms", confidence: 0.78, rationale: "Fits upper abdominal burning/reflux style symptoms." },
      { label: "Gastritis / dyspepsia under review", confidence: 0.67, rationale: "Broad clinical draft when symptoms are still being refined." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Consider if chronic symptoms or anemia suspicion exists.", why: "Useful when occult blood loss or chronicity is a concern." },
    ],
    redFlags: ["Hematemesis", "Black stool", "Weight loss", "Persistent vomiting", "Severe abdominal pain"],
    prescriptions: [
      {
        label: "Acidity symptom template",
        instructions: "Diet advice, trigger avoidance, and alarm symptoms explained. Doctor to confirm medication choice.",
        items: [{ medicine: "Antacid / acid suppression", dose: "As clinically appropriate", frequency: "As advised", duration: "Short course", route: "PO", notes: "Doctor to choose exact drug and dose." }],
      },
    ],
  },
  "peds-jaundice": {
    complaintTemplate: {
      title: "Pediatric jaundice template",
      complaint: "Child with jaundice",
      prompts: ["Child age at onset", "Feeding", "Urine/stool color", "Activity / lethargy", "Fever / vomiting"],
    },
    diagnoses: [
      { label: "Pediatric jaundice under evaluation", confidence: 0.86, rationale: "Best working label pending age-specific cause review." },
      { label: "Hyperbilirubinemia to evaluate", confidence: 0.61, rationale: "Helpful when investigations and age-based interpretation matter." },
    ],
    orders: [
      { orderType: "lab", itemName: "Serum bilirubin", destination: "Laboratory", notes: "Correlate with age, feeding, and clinical stability.", why: "Core lab for pediatric jaundice assessment." },
      { orderType: "lab", itemName: "CBC / blood group if indicated", destination: "Laboratory", notes: "Add according to neonatal or hemolysis context.", why: "Helps extend jaundice workup." },
    ],
    redFlags: ["Poor feeding", "Lethargy", "Fever", "Vomiting", "Increasing jaundice"],
    prescriptions: [],
  },
  "peds-viral-fever": {
    complaintTemplate: {
      title: "Pediatric fever template",
      complaint: "Child with fever / cold symptoms",
      prompts: ["Fever duration", "Feeding", "Urine output", "Activity level", "Breathing difficulty / seizures"],
    },
    diagnoses: [
      { label: "Pediatric febrile illness", confidence: 0.8, rationale: "Useful structured label for common child fever reviews." },
      { label: "Probable viral illness", confidence: 0.66, rationale: "Good first-pass wording when symptom pattern looks viral." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Reserve for persistent fever or toxic appearance.", why: "Helpful when fever needs further evaluation." },
    ],
    redFlags: ["Poor feeding", "Seizure", "Breathing difficulty", "Lethargy", "Persistent high fever"],
    prescriptions: [
      {
        label: "Pediatric supportive fever care",
        instructions: "Caregiver counselled on fluids, monitoring, and warning signs.",
        items: [{ medicine: "Paracetamol", dose: "Weight-based dosing", frequency: "SOS / as advised", duration: "2-3 days", route: "PO", notes: "Doctor to confirm child-specific dosing." }],
      },
    ],
  },
  "peds-wheeze-template": {
    complaintTemplate: {
      title: "Wheeze template",
      complaint: "Wheeze / breathing difficulty",
      prompts: ["Duration", "Prior wheeze episodes", "Response to nebulization", "Feeding tolerance", "Chest retractions / cyanosis"],
    },
    diagnoses: [
      { label: "Wheeze-associated respiratory illness", confidence: 0.76, rationale: "Safe structured diagnosis wording for wheeze review." },
      { label: "Reactive airway episode under review", confidence: 0.62, rationale: "Useful if prior wheeze/asthma context exists." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Use only if infection or severity warrants workup.", why: "Sometimes useful in persistent febrile wheeze." },
      { orderType: "radiology", itemName: "Chest X-ray", destination: "Radiology", notes: "Reserve for focal findings, severe illness, or poor recovery.", why: "Escalation imaging when clinically indicated." },
    ],
    redFlags: ["Chest retractions", "Cyanosis", "Poor feeding", "Lethargy", "Worsening breathing difficulty"],
    prescriptions: [
      {
        label: "Wheeze support template",
        instructions: "Caregiver counselled on breathing red flags and inhalation/nebulization review if advised.",
        items: [],
      },
    ],
  },
  "peds-anemia-nutrition-template": {
    complaintTemplate: {
      title: "Nutrition / anemia template",
      complaint: "Nutrition / anaemia review",
      prompts: ["Diet history", "Weight gain", "Pallor", "Development concerns", "Prior supplements / reports"],
    },
    diagnoses: [
      { label: "Poor weight gain / nutrition review", confidence: 0.74, rationale: "Useful pediatric follow-up framing for growth and feeding concerns." },
      { label: "Anemia under evaluation", confidence: 0.66, rationale: "Appropriate when pallor or poor intake suggests anemia review." },
    ],
    orders: [
      { orderType: "lab", itemName: "CBC", destination: "Laboratory", notes: "Baseline pediatric anemia review.", why: "First-line investigation for pallor / anemia concern." },
      { orderType: "lab", itemName: "Iron profile if indicated", destination: "Laboratory", notes: "Use if persistent anemia concern exists.", why: "Extends anemia workup when clinically needed." },
    ],
    redFlags: ["Severe pallor", "Poor feeding", "Developmental regression", "Persistent poor weight gain", "Lethargy"],
    prescriptions: [
      {
        label: "Nutrition follow-up template",
        instructions: "Nutrition counselling and close follow-up explained. Doctor to decide supplements after evaluation.",
        items: [],
      },
    ],
  },
  "peds-immunization-followup": {
    complaintTemplate: {
      title: "Immunization template",
      complaint: "Immunization follow-up",
      prompts: ["Missed doses", "Selected schedule", "Past vaccine reactions", "Current illness", "Caregiver concerns"],
    },
    diagnoses: [
      { label: "Immunization review visit", confidence: 0.88, rationale: "Best direct label for vaccine follow-up consults." },
    ],
    orders: [
      { orderType: "vaccine", itemName: "Due vaccine as per selected schedule", destination: "Immunization desk", notes: "Confirm schedule and document administered doses.", why: "Directly supports pediatric vaccination workflow." },
    ],
    redFlags: ["Fever at visit", "Previous severe vaccine reaction", "Missed multiple doses", "Caregiver confusion about schedule"],
    prescriptions: [],
  },
  "surgery-post-op-stable": {
    complaintTemplate: {
      title: "Post-op review template",
      complaint: "Post-operative follow-up",
      prompts: ["Pain score", "Wound status", "Fever", "Oral intake", "Bowel/bladder function"],
    },
    diagnoses: [
      { label: "Post-operative review", confidence: 0.9, rationale: "Correct direct label for routine post-op follow-up." },
      { label: "Stable post-operative course", confidence: 0.74, rationale: "Useful when recovery is uncomplicated." },
    ],
    orders: [
      { orderType: "post_op_order", itemName: "Post-op wound care review", destination: "Nursing / dressing room", notes: "Continue dressing and wound instructions as advised.", why: "Supports post-op care continuity." },
    ],
    redFlags: ["Fever", "Increasing pain", "Wound discharge", "Bleeding", "Vomiting / poor intake"],
    prescriptions: [
      {
        label: "Post-op discharge template",
        instructions: "Continue wound care and prescribed post-op medicines. Review urgently for fever, pain, bleeding, or discharge.",
        items: [],
      },
    ],
  },
  "surgery-dressing-review": {
    complaintTemplate: {
      title: "Wound review template",
      complaint: "Dressing / wound review",
      prompts: ["Pain", "Discharge", "Swelling", "Fever", "Wound gaping / bleeding"],
    },
    diagnoses: [
      { label: "Post-surgical wound review", confidence: 0.82, rationale: "Good direct label for wound/dressing follow-up." },
      { label: "Wound healing under review", confidence: 0.6, rationale: "Useful when evaluating progress and red flags." },
    ],
    orders: [
      { orderType: "post_op_order", itemName: "Dressing change", destination: "Dressing room", notes: "Continue wound care and review if discharge increases.", why: "Common surgical next-step order." },
    ],
    redFlags: ["Pus discharge", "Wound gaping", "Fever", "Increasing swelling", "Bleeding"],
    prescriptions: [],
  },
  "surgery-appendicitis-review": {
    complaintTemplate: {
      title: "Acute abdomen template",
      complaint: "Abdominal pain under surgical review",
      prompts: ["Pain site and progression", "Vomiting", "Fever", "Guarding / tenderness", "Bowel symptoms"],
    },
    diagnoses: [
      { label: "Acute abdomen under evaluation", confidence: 0.8, rationale: "Safe structured label pending surgical workup." },
      { label: "Appendicitis to rule out", confidence: 0.68, rationale: "Useful when RLQ pain or classic progression is part of the symptom pattern." },
    ],
    orders: [
      { orderType: "pre_op_lab", itemName: "CBC", destination: "Laboratory", notes: "Baseline acute abdomen surgical workup.", why: "Common first-line surgical investigation." },
      { orderType: "radiology", itemName: "Ultrasound abdomen", destination: "Radiology", notes: "Use when appendicitis or other surgical pathology is suspected.", why: "Helpful first imaging step." },
    ],
    redFlags: ["Guarding", "Persistent vomiting", "Fever", "Abdominal distension", "Systemic instability"],
    prescriptions: [],
  },
  "surgery-hernia-review": {
    complaintTemplate: {
      title: "Hernia template",
      complaint: "Hernia / swelling review",
      prompts: ["Pain", "Reducibility", "Cough impulse", "Vomiting", "Abdominal distension"],
    },
    diagnoses: [
      { label: "Hernia under surgical review", confidence: 0.82, rationale: "Direct surgical working diagnosis." },
      { label: "Reducible swelling / hernia follow-up", confidence: 0.64, rationale: "Useful when documenting stable outpatient review." },
    ],
    orders: [
      { orderType: "radiology", itemName: "Ultrasound local part / abdomen", destination: "Radiology", notes: "Use if swelling details need confirmation.", why: "Helpful for hernia/swelling characterization." },
    ],
    redFlags: ["Irreducible swelling", "Increasing pain", "Vomiting", "Abdominal distension", "Fever"],
    prescriptions: [],
  },
};

function getTemplatesForDepartment(departmentKey = "general") {
  const normalized = String(departmentKey || "general").trim().toLowerCase();
  const allTemplates = [
    ...COMMON_TEMPLATES,
    ...GENERAL_TEMPLATES,
    ...PEDIATRIC_TEMPLATES,
    ...SURGERY_TEMPLATES,
  ];
  return allTemplates.filter((template) => template.departmentKeys.includes(normalized));
}

function buildContextTokens(context = {}) {
  return tokenize(
    [
      context.query,
      context.reason,
      context.chiefComplaint,
      context.diagnosisText,
      context.findings,
      context.planText,
      context.departmentKey,
      context.patient?.conditions,
      context.patient?.allergies,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function scoreTemplate(template, tokens) {
  const triggerTokens = template.triggers.flatMap((item) => tokenize(item));
  const matches = triggerTokens.filter((token) => tokens.includes(token));
  if (!matches.length) return 0;
  return matches.length / Math.max(1, triggerTokens.length);
}

function renderContextualNote(template, context = {}) {
  const patientName = context.patient?.name ? `Patient ${context.patient.name}` : "Patient";
  const agePart = context.patient?.age ? `${context.patient.age}-year-old` : "";
  const sexPart = context.patient?.sex ? String(context.patient.sex) : "";
  const patientDescriptor = [patientName, agePart, sexPart].filter(Boolean).join(" ").trim();
  return template.noteText.replace(/^Patient\b/, patientDescriptor || "Patient");
}

function buildFallbackSuggestion(context = {}) {
  const normalizedQuery = String(context.query || "").trim();
  const lead = normalizedQuery || context.reason || context.chiefComplaint || "clinical review";
  return {
    id: "contextual-draft",
    label: "Contextual draft",
    score: 0.2,
    reason: "Built from the typed keywords and current consult context.",
    noteText: `Clinical review documented for ${lead}. History, examination findings, working impression, and next-step counselling were reviewed and updated for this encounter.`,
    summaryPatch: {
      chiefComplaint: context.chiefComplaint || normalizedQuery || context.reason || "",
      findings: context.findings || "",
      diagnosisText: context.diagnosisText || "",
      planText:
        context.planText ||
        "Review clinical response, document red flags, and continue follow-up as advised.",
    },
  };
}

function buildFallbackAssist(departmentKey = "general", context = {}) {
  const normalizedQuery = String(context.query || "").trim();
  const complaint = context.chiefComplaint || normalizedQuery || context.reason || "";
  return {
    complaintTemplate: {
      title: "Structured complaint template",
      complaint: complaint || "Clinical review",
      prompts: [
        "Duration of symptoms",
        "Severity and progression",
        "Associated symptoms",
        "Examination findings",
        "Red flags and follow-up needs",
      ],
    },
    diagnoses: [
      {
        label:
          departmentKey === "pediatrics"
            ? "Pediatric condition under evaluation"
            : departmentKey === "surgery"
              ? "Surgical condition under evaluation"
              : "Condition under evaluation",
        confidence: 0.35,
        rationale: "Fallback suggestion built from the current symptom context.",
      },
    ],
    orders: [
      {
        orderType: "lab",
        itemName: "CBC",
        destination: "Laboratory",
        notes: "Use only if clinical evaluation warrants a baseline investigation.",
        why: "General fallback investigation suggestion.",
      },
    ],
    redFlags: ["Worsening symptoms", "Poor oral intake", "Breathing difficulty", "Persistent vomiting", "Marked lethargy"],
    prescriptions: [],
  };
}

function extractOpenAiText(response) {
  if (!response || !Array.isArray(response.output)) return "";
  const parts = [];
  for (const item of response.output) {
    if (item.type === "message" && item.role === "assistant") {
      for (const content of item.content || []) {
        if (content.type === "output_text" && content.text) parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

async function callOpenAiWriter(payload) {
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
        "You are assisting a hospital doctor with clinical note drafting. Do not invent diagnosis certainty, doses, or orders. Rewrite only as a draft note for clinician review. Keep the meaning conservative, clinically structured, and editable. Return plain text only.",
      input: payload,
      temperature: 0.2,
      max_output_tokens: 500,
      text: { format: { type: "text" } },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI writer request failed.");
  }
  return extractOpenAiText(data);
}

async function callGeminiWriter(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const endpoint =
    process.env.GEMINI_ENDPOINT ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
      contents: [{ role: "user", parts: [{ text: payload }] }],
      systemInstruction: {
        parts: [
          {
            text: "You assist a hospital doctor with clinical note drafting. Do not invent diagnosis certainty, medication doses, or orders. Rewrite only as a draft note for clinician review. Return plain text only.",
          },
        ],
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini writer request failed.");
  }
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || ""
  );
}

function buildAiRewritePrompt({ draftText = "", context = {} } = {}) {
  const patientLine = [context.patient?.name, context.patient?.age ? `${context.patient.age}y` : "", context.patient?.sex || ""]
    .filter(Boolean)
    .join(" • ");
  return [
    `Department: ${context.departmentKey || "general"}`,
    patientLine ? `Patient: ${patientLine}` : "",
    context.reason ? `Visit reason: ${context.reason}` : "",
    context.chiefComplaint ? `Chief complaint: ${context.chiefComplaint}` : "",
    context.findings ? `Findings: ${context.findings}` : "",
    context.diagnosisText ? `Working diagnosis: ${context.diagnosisText}` : "",
    context.planText ? `Current plan: ${context.planText}` : "",
    "Rewrite the following into a cleaner clinical draft note. Keep uncertainty where uncertainty exists. Do not add medication doses or new tests. Keep it concise but complete enough for doctor review.",
    `Draft note:\n${draftText}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function sentenceCase(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function splitSentences(value) {
  return String(value || "")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDraftText(value) {
  return splitSentences(value)
    .map((sentence) => sentenceCase(sentence))
    .join(" ");
}

function buildClinicalRefine(value, context = {}) {
  const normalized = normalizeDraftText(value);
  const lead = context.patient?.name ? `Patient ${context.patient.name} reviewed.` : "Patient reviewed.";
  if (!normalized) return lead;
  return `${lead} ${normalized}`;
}

function buildConciseRefine(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const sentences = splitSentences(trimmed);
  return sentences.slice(0, 2).map((sentence) => sentenceCase(sentence)).join(" ");
}

function buildCaregiverRefine(value, context = {}) {
  const normalized = normalizeDraftText(value);
  const intro = context.departmentKey === "pediatrics"
    ? "Caregiver counselling provided in simple terms."
    : "Patient counselling provided in simple terms.";
  const closing =
    "Warning signs, home care, and when to return were explained clearly.";
  if (!normalized) return `${intro} ${closing}`;
  return `${intro} ${normalized} ${closing}`;
}

const createDoctorAssistService = () => {
  const suggestNoteDrafts = ({ departmentKey = "general", query = "", context = {} } = {}) => {
    const templates = getTemplatesForDepartment(departmentKey);
    const tokens = buildContextTokens({ ...context, departmentKey, query });
    const ranked = templates
      .map((template) => ({
        template,
        score: scoreTemplate(template, tokens),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ template, score }) => ({
        id: template.id,
        label: template.label,
        score,
        reason: `Matched keywords: ${template.triggers.filter((entry) =>
          tokens.some((token) => tokenize(entry).includes(token)),
        ).join(", ")}`,
        noteText: renderContextualNote(template, context),
        summaryPatch: template.summaryPatch || {},
        ...(CLINICAL_ASSIST_LIBRARY[template.id] || buildFallbackAssist(departmentKey, { ...context, query })),
      }));

    if (!ranked.length) {
      const fallback = buildFallbackSuggestion({ ...context, departmentKey, query });
      return [
        {
          ...fallback,
          ...buildFallbackAssist(departmentKey, { ...context, query }),
        },
      ];
    }

    const suggestions = [...ranked];
    const fallback = buildFallbackSuggestion({ ...context, departmentKey, query });
    if (!suggestions.some((item) => item.id === fallback.id)) {
      suggestions.push({
        ...fallback,
        ...buildFallbackAssist(departmentKey, { ...context, query }),
      });
    }
    return suggestions;
  };

  const refineNoteDraft = async ({ draftText = "", mode = "clinical", context = {} } = {}) => {
    const trimmed = String(draftText || "").trim();
    if (!trimmed) {
      return {
        mode,
        refinedText: "",
        label: "Nothing to refine",
      };
    }

    const normalizedMode = String(mode || "clinical").trim().toLowerCase();
    if (normalizedMode === "ai") {
      try {
        const provider = (process.env.AI_PROVIDER || "").toLowerCase();
        const payload = buildAiRewritePrompt({ draftText: trimmed, context });
        const refinedText =
          provider === "gemini"
            ? await callGeminiWriter(payload)
            : provider === "openai"
              ? await callOpenAiWriter(payload)
              : (await callOpenAiWriter(payload)) || (await callGeminiWriter(payload));
        if (String(refinedText || "").trim()) {
          return {
            mode: "ai",
            label: "AI clinical rewrite",
            refinedText: String(refinedText).trim(),
            provider: provider || (process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY ? "gemini" : "fallback"),
          };
        }
      } catch {
        // fall through to deterministic fallback
      }
      return {
        mode: "ai",
        label: "AI rewrite fallback",
        refinedText: buildClinicalRefine(trimmed, context),
        provider: "fallback",
      };
    }
    if (normalizedMode === "concise") {
      return {
        mode: "concise",
        label: "Concise rewrite",
        refinedText: buildConciseRefine(trimmed),
      };
    }
    if (normalizedMode === "caregiver") {
      return {
        mode: "caregiver",
        label: context.departmentKey === "pediatrics" ? "Caregiver-friendly rewrite" : "Patient-friendly rewrite",
        refinedText: buildCaregiverRefine(trimmed, context),
      };
    }
    return {
      mode: "clinical",
      label: "Clinical polish",
      refinedText: buildClinicalRefine(trimmed, context),
    };
  };

  return {
    suggestNoteDrafts,
    refineNoteDraft,
  };
};

module.exports = { createDoctorAssistService };
