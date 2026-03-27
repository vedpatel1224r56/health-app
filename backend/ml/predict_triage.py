#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

import joblib
import pandas as pd


VALID_LABELS = ["self_care", "clinic_24h", "emergency"]


def to_bool_int(value):
    if isinstance(value, bool):
        return int(value)
    text = str(value).strip().lower()
    return 1 if text in {"1", "true", "yes", "y"} else 0


def normalize_text(value: str) -> str:
    if value is None:
        return ""
    return str(value).strip().lower().replace(",", " ")


def build_features(payload: dict) -> pd.DataFrame:
    symptoms = payload.get("symptoms") or []
    red_flags = payload.get("redFlags") or []
    dental_symptoms = payload.get("dentalSymptoms") or []
    dental_red_flags = payload.get("dentalRedFlags") or []
    conditions = payload.get("conditions") or []

    token_text = " ".join(
        [
            normalize_text(" ".join(symptoms)),
            normalize_text(" ".join(red_flags)),
            normalize_text(" ".join(dental_symptoms)),
            normalize_text(" ".join(dental_red_flags)),
            normalize_text(" ".join(conditions)),
            normalize_text(payload.get("additionalSymptoms", "")),
        ]
    )

    row = {
        "triage_type": str(payload.get("triageType", "general")).lower(),
        "age": float(payload.get("age") or 0),
        "duration_days": float(payload.get("durationDays") or 0),
        "severity": float(payload.get("severity") or 0),
        "dental_pain_scale": float(payload.get("dentalPainScale") or 0),
        "dental_hot_cold_trigger": to_bool_int(payload.get("dentalHotColdTrigger", 0)),
        "dental_swelling": to_bool_int(payload.get("dentalSwelling", 0)),
        "sex": str(payload.get("sex") or "unknown").lower(),
        "region": str(payload.get("region") or "unknown").lower(),
        "token_text": token_text,
    }
    return pd.DataFrame([row])


def load_metadata():
    meta_file = os.getenv("TRIAGE_MODEL_META_FILE", "")
    if not meta_file:
        return {}
    path = Path(meta_file)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def confidence_bucket(score: float) -> str:
    if score >= 0.85:
        return "high"
    if score >= 0.60:
        return "medium"
    return "low"


def label_to_response(label: str):
    if label == "emergency":
        return {
            "level": "emergency",
            "headline": "Seek emergency care now",
            "urgency": "Symptoms indicate high urgency. Visit emergency care immediately.",
            "suggestions": [
                "Do not delay care.",
                "Use nearest emergency facility.",
                "Carry prior records if available.",
            ],
            "disclaimer": "This is general guidance, not diagnosis. For emergencies seek immediate care.",
        }
    if label == "clinic_24h":
        return {
            "level": "urgent",
            "headline": "Consult a clinician soon",
            "urgency": "Please visit a clinic within 24 hours for proper examination.",
            "suggestions": [
                "Monitor symptoms closely.",
                "Hydrate and avoid self-medication beyond basic care.",
                "Visit a nearby clinic if symptoms worsen.",
            ],
            "disclaimer": "This is general guidance, not diagnosis. Seek professional care for confirmation.",
        }
    return {
        "level": "self_care",
        "headline": "Likely manageable with home care",
        "urgency": "Monitor and continue supportive care. Seek clinic care if worsening.",
        "suggestions": [
            "Rest and hydrate.",
            "Track symptom change for 24-48 hours.",
            "Escalate if new red-flag symptoms appear.",
        ],
        "disclaimer": "This is general guidance, not diagnosis. Seek medical care when needed.",
    }


def apply_policy(base_label: str, scores: dict, meta: dict):
    policy = (meta or {}).get("decision_policy") or {}
    emergency_floor = float(policy.get("emergency_probability_floor", 0.5))

    emergency_score = float(scores.get("emergency", 0.0))
    label = base_label
    reasons = [f"Model prediction: {base_label}", f"Confidence score: {round(max(scores.values()), 3)}"]

    if emergency_score >= emergency_floor and base_label != "emergency":
        label = "emergency"
        reasons.append(
            f"Safety override: emergency probability {round(emergency_score, 3)} >= threshold {emergency_floor}"
        )

    return label, reasons, emergency_floor


def main():
    model_path = os.getenv("TRIAGE_MODEL_FILE")
    if not model_path:
        print(json.dumps({"error": "TRIAGE_MODEL_FILE not set"}))
        sys.exit(2)

    raw = sys.stdin.read().strip()
    payload = json.loads(raw) if raw else {}

    model = joblib.load(model_path)
    features = build_features(payload)
    base_label = str(model.predict(features)[0])

    if not hasattr(model, "predict_proba"):
        print(json.dumps({"error": "Loaded model does not support predict_proba"}))
        sys.exit(3)

    proba = model.predict_proba(features)[0]
    classes = list(getattr(model, "classes_", VALID_LABELS))
    scores = {str(c): float(p) for c, p in zip(classes, proba)}

    meta = load_metadata()
    label, reasons, emergency_floor = apply_policy(base_label, scores, meta)

    response = label_to_response(label)
    max_score = max(scores.values()) if scores else 0.0
    response["confidence"] = confidence_bucket(max_score)
    response["reasons"] = reasons
    response["model"] = {
        "label": label,
        "base_label": base_label,
        "scores": {k: round(v, 4) for k, v in scores.items()},
        "policy": {
            "emergency_probability_floor": emergency_floor,
        },
    }
    print(json.dumps(response))


if __name__ == "__main__":
    main()
