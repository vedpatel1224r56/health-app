# Triage ML Pipeline

This pipeline is built for production-style triage training with safety-first evaluation.

## What It Enforces

- Dataset schema validation before training.
- Minimum dataset size (`>=120` rows default).
- Class-balance checks (minimum per class + imbalance ratio).
- Model selection prioritized by **emergency recall**.
- Probability calibration (`CalibratedClassifierCV`).
- Emergency probability safety override threshold.
- Auto-generated evaluation report for audit/review.

## 1) Install Python deps

```bash
cd /Users/vedpatel/health-app/backend/ml
python3 -m pip install -r requirements.txt
```

## 2) Train model

```bash
cd /Users/vedpatel/health-app/backend/ml
python3 train_triage.py \
  --dataset /Users/vedpatel/health-app/backend/ml/datasets/triage_training_template.csv \
  --artifacts-dir /Users/vedpatel/health-app/backend/ml/artifacts \
  --min-per-class 30 \
  --max-imbalance-ratio 2.0 \
  --min-emergency-recall 0.85 \
  --allow-small-dataset
```

## 3) Artifacts produced

- `/Users/vedpatel/health-app/backend/ml/artifacts/triage_model.joblib`
- `/Users/vedpatel/health-app/backend/ml/artifacts/model_metadata.json`
- `/Users/vedpatel/health-app/backend/ml/artifacts/evaluation_report.json`

## 4) Enable in backend

Set these env variables in backend:

```env
TRIAGE_MODEL_ENABLED=true
TRIAGE_MODEL_PYTHON=python3
TRIAGE_MODEL_SCRIPT=/Users/vedpatel/health-app/backend/ml/predict_triage.py
TRIAGE_MODEL_FILE=/Users/vedpatel/health-app/backend/ml/artifacts/triage_model.joblib
TRIAGE_MODEL_META_FILE=/Users/vedpatel/health-app/backend/ml/artifacts/model_metadata.json
```

Restart backend after env update.

## 5) Review quality gates

Check `evaluation_report.json` and validate:

- `holdout.metrics.emergency_recall`
- `holdout.metrics.macro_f1`
- `quality_gates.passed`
- confusion matrix + per-class metrics

Do not rely on model-only triage if emergency recall is below target.

`--allow-small-dataset` is only for local testing with the starter CSV.

## Notes

- Keep backend hard red-flag rules enabled as a deterministic safety net.
- Replace template CSV with doctor-reviewed real-world data before pilot use.
