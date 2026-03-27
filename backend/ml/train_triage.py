#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    make_scorer,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.svm import LinearSVC

VALID_LABELS = ["self_care", "clinic_24h", "emergency"]
REQUIRED_COLUMNS = {
    "triage_type",
    "age",
    "sex",
    "duration_days",
    "severity",
    "symptoms",
    "red_flags",
    "dental_pain_scale",
    "dental_symptoms",
    "dental_red_flags",
    "dental_hot_cold_trigger",
    "dental_swelling",
    "conditions",
    "region",
    "label",
}


def normalize_text(value: str) -> str:
    if value is None:
        return ""
    return str(value).strip().lower().replace(",", " ")


def to_bool_int(value):
    if isinstance(value, bool):
        return int(value)
    text = str(value).strip().lower()
    return 1 if text in {"1", "true", "yes", "y"} else 0


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame()
    out["triage_type"] = df["triage_type"].fillna("general").astype(str).str.lower()
    out["age"] = pd.to_numeric(df["age"], errors="coerce").fillna(0).clip(0, 120)
    out["duration_days"] = pd.to_numeric(df["duration_days"], errors="coerce").fillna(0).clip(0, 90)
    out["severity"] = pd.to_numeric(df["severity"], errors="coerce").fillna(0).clip(0, 10)
    out["dental_pain_scale"] = pd.to_numeric(df["dental_pain_scale"], errors="coerce").fillna(0).clip(0, 10)
    out["dental_hot_cold_trigger"] = df["dental_hot_cold_trigger"].map(to_bool_int)
    out["dental_swelling"] = df["dental_swelling"].map(to_bool_int)

    out["sex"] = df["sex"].fillna("unknown").astype(str).str.lower()
    out["region"] = df["region"].fillna("unknown").astype(str).str.lower()

    text_fields = [
        "symptoms",
        "red_flags",
        "dental_symptoms",
        "dental_red_flags",
        "conditions",
    ]
    merged = []
    for _, row in df[text_fields].fillna("").iterrows():
        tokens = [normalize_text(v).replace("|", " ") for v in row.values]
        merged.append(" ".join([t for t in tokens if t]))
    out["token_text"] = merged
    return out


def validate_dataset(df: pd.DataFrame, allow_small_dataset: bool):
    missing = sorted(REQUIRED_COLUMNS - set(df.columns))
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    invalid_labels = sorted(set(df["label"].dropna().astype(str)) - set(VALID_LABELS))
    if invalid_labels:
        raise ValueError(f"Unsupported labels in dataset: {invalid_labels}")

    if len(df) < 120 and not allow_small_dataset:
        raise ValueError(
            "Dataset too small for reliable triage training. Add at least 120 labeled rows before training."
        )


def class_balance_report(labels: pd.Series, min_per_class: int, max_imbalance_ratio: float):
    counts = labels.value_counts().reindex(VALID_LABELS, fill_value=0)
    min_count = int(counts.min())
    max_count = int(counts.max())
    ratio = (max_count / min_count) if min_count > 0 else float("inf")

    warnings = []
    if min_count < min_per_class:
        warnings.append(
            f"Minimum samples per class is {min_count}. Recommended >= {min_per_class}."
        )
    if ratio > max_imbalance_ratio:
        warnings.append(
            f"Class imbalance ratio is {ratio:.2f}. Recommended <= {max_imbalance_ratio:.2f}."
        )

    return {
        "counts": {k: int(v) for k, v in counts.to_dict().items()},
        "min_count": min_count,
        "max_count": max_count,
        "imbalance_ratio": round(float(ratio), 4),
        "warnings": warnings,
    }


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "text",
                TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_df=0.95, sublinear_tf=True),
                "token_text",
            ),
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["triage_type", "sex", "region"]),
            (
                "num",
                Pipeline([("scale", StandardScaler(with_mean=False))]),
                [
                    "age",
                    "duration_days",
                    "severity",
                    "dental_pain_scale",
                    "dental_hot_cold_trigger",
                    "dental_swelling",
                ],
            ),
        ],
        remainder="drop",
    )


def make_candidates(random_state: int):
    return {
        "logreg": Pipeline(
            [
                ("preprocessor", make_preprocessor()),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        solver="lbfgs",
                        C=1.0,
                    ),
                ),
            ]
        ),
        "linear_svc": Pipeline(
            [
                ("preprocessor", make_preprocessor()),
                (
                    "classifier",
                    LinearSVC(
                        C=1.0,
                        class_weight="balanced",
                        random_state=random_state,
                    ),
                ),
            ]
        ),
    }


def emergency_recall_score(y_true, y_pred):
    return recall_score(
        (np.asarray(y_true) == "emergency").astype(int),
        (np.asarray(y_pred) == "emergency").astype(int),
        zero_division=0,
    )


def choose_emergency_threshold(
    y_true,
    emergency_probs,
    min_recall_target: float,
    min_precision_target: float,
    min_threshold: float,
):
    y_bin = (np.asarray(y_true) == "emergency").astype(int)
    best = None
    for threshold in np.arange(min_threshold, 0.96, 0.01):
        pred_bin = (emergency_probs >= threshold).astype(int)
        precision = precision_score(y_bin, pred_bin, zero_division=0)
        recall = recall_score(y_bin, pred_bin, zero_division=0)
        if precision == 0 and recall == 0:
            f2 = 0.0
        else:
            beta2 = 4.0
            f2 = (1 + beta2) * precision * recall / (beta2 * precision + recall)

        candidate = {
            "threshold": round(float(threshold), 2),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f2": round(float(f2), 4),
            "meets_recall_target": bool(recall >= min_recall_target),
            "meets_precision_target": bool(precision >= min_precision_target),
        }

        if best is None:
            best = candidate
            continue

        def candidate_rank(item):
            return (
                1 if item["meets_recall_target"] else 0,
                1 if item["meets_precision_target"] else 0,
                item["f2"],
                item["recall"],
                item["precision"],
            )

        if candidate_rank(candidate) > candidate_rank(best):
            best = candidate

    return best


def select_model(candidates, X_train, y_train, folds, random_state):
    scoring = {
        "macro_f1": make_scorer(f1_score, average="macro", zero_division=0, pos_label=None),
        "macro_precision": make_scorer(
            precision_score, average="macro", zero_division=0, pos_label=None
        ),
        "macro_recall": make_scorer(recall_score, average="macro", zero_division=0, pos_label=None),
        "accuracy": make_scorer(accuracy_score),
    }
    cv = StratifiedKFold(n_splits=folds, shuffle=True, random_state=random_state)

    rows = []
    for name, estimator in candidates.items():
        result = cross_validate(estimator, X_train, y_train, cv=cv, scoring=scoring)
        cv_scores = {k: float(np.mean(v)) for k, v in result.items() if k.startswith("test_")}

        y_pred = np.empty(len(y_train), dtype=object)
        for train_idx, test_idx in cv.split(X_train, y_train):
            local_estimator = estimator
            local_estimator.fit(X_train.iloc[train_idx], y_train.iloc[train_idx])
            y_pred[test_idx] = local_estimator.predict(X_train.iloc[test_idx])

        emergency_recall = emergency_recall_score(y_train, y_pred)
        rows.append(
            {
                "name": name,
                "cv_macro_f1": round(cv_scores["test_macro_f1"], 4),
                "cv_macro_precision": round(cv_scores["test_macro_precision"], 4),
                "cv_macro_recall": round(cv_scores["test_macro_recall"], 4),
                "cv_accuracy": round(cv_scores["test_accuracy"], 4),
                "cv_emergency_recall": round(float(emergency_recall), 4),
                "estimator": estimator,
            }
        )

    ranked = sorted(
        rows,
        key=lambda item: (item["cv_emergency_recall"], item["cv_macro_f1"], item["cv_macro_recall"]),
        reverse=True,
    )
    return ranked


def clean_metrics_dict(report_dict):
    clean = {}
    for key, value in report_dict.items():
        if isinstance(value, dict):
            clean[key] = {k: round(float(v), 4) for k, v in value.items()}
        else:
            clean[key] = round(float(value), 4)
    return clean


def train(
    dataset_path: Path,
    artifacts_dir: Path,
    min_per_class: int,
    max_imbalance_ratio: float,
    test_size: float,
    random_state: int,
    cv_folds: int,
    min_emergency_recall: float,
    min_emergency_precision: float,
    min_macro_f1: float,
    min_emergency_threshold: float,
    allow_small_dataset: bool,
):
    df = pd.read_csv(dataset_path)
    validate_dataset(df, allow_small_dataset=allow_small_dataset)

    X = build_features(df)
    y = df["label"].astype(str)

    balance = class_balance_report(y, min_per_class=min_per_class, max_imbalance_ratio=max_imbalance_ratio)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )

    candidates = make_candidates(random_state=random_state)
    ranking = select_model(candidates, X_train, y_train, folds=cv_folds, random_state=random_state)
    selected = ranking[0]

    calibrator = CalibratedClassifierCV(
        estimator=selected["estimator"],
        method="sigmoid",
        cv=StratifiedKFold(n_splits=min(5, cv_folds), shuffle=True, random_state=random_state),
    )
    calibrator.fit(X_train, y_train)

    proba_test = calibrator.predict_proba(X_test)
    classes = list(calibrator.classes_)
    class_to_idx = {label: i for i, label in enumerate(classes)}

    emergency_idx = class_to_idx["emergency"]
    emergency_probs = proba_test[:, emergency_idx]

    threshold_info = choose_emergency_threshold(
        y_true=y_test,
        emergency_probs=emergency_probs,
        min_recall_target=min_emergency_recall,
        min_precision_target=min_emergency_precision,
        min_threshold=min_emergency_threshold,
    )
    emergency_threshold = threshold_info["threshold"]

    y_pred_base = calibrator.predict(X_test)
    y_pred = np.array(y_pred_base, copy=True)
    y_pred[emergency_probs >= emergency_threshold] = "emergency"

    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=VALID_LABELS)

    holdout_metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "macro_precision": round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "macro_f1": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "emergency_recall": round(float(recall_score((y_test == "emergency").astype(int), (y_pred == "emergency").astype(int), zero_division=0)), 4),
    }

    eval_report = {
        "dataset": {
            "path": str(dataset_path),
            "rows": int(len(df)),
            "train_rows": int(len(X_train)),
            "test_rows": int(len(X_test)),
            "labels": VALID_LABELS,
            "class_balance": balance,
        },
        "model_selection": {
            "strategy": "Sort by cross-validated emergency recall, then macro F1",
            "candidates": [
                {
                    "name": item["name"],
                    "cv_macro_f1": item["cv_macro_f1"],
                    "cv_macro_precision": item["cv_macro_precision"],
                    "cv_macro_recall": item["cv_macro_recall"],
                    "cv_accuracy": item["cv_accuracy"],
                    "cv_emergency_recall": item["cv_emergency_recall"],
                }
                for item in ranking
            ],
            "selected": selected["name"],
            "calibration": {
                "method": "sigmoid",
                "cv_folds": min(5, cv_folds),
            },
        },
        "decision_policy": {
            "emergency_probability_floor": emergency_threshold,
            "emergency_threshold_metrics": threshold_info,
            "notes": "If model emergency probability >= threshold, label forced to emergency.",
        },
        "holdout": {
            "metrics": holdout_metrics,
            "per_class": clean_metrics_dict(report),
            "confusion_matrix_labels": VALID_LABELS,
            "confusion_matrix": cm.tolist(),
        },
        "quality_gates": {
            "target_min_emergency_recall": min_emergency_recall,
            "target_min_emergency_precision": min_emergency_precision,
            "target_min_macro_f1": min_macro_f1,
            "passed": bool(
                holdout_metrics["emergency_recall"] >= min_emergency_recall
                and threshold_info["precision"] >= min_emergency_precision
                and holdout_metrics["macro_f1"] >= min_macro_f1
            ),
        },
    }

    artifacts_dir.mkdir(parents=True, exist_ok=True)
    model_path = artifacts_dir / "triage_model.joblib"
    meta_path = artifacts_dir / "model_metadata.json"
    report_path = artifacts_dir / "evaluation_report.json"

    joblib.dump(calibrator, model_path)

    model_meta = {
        "dataset": str(dataset_path),
        "model_path": str(model_path),
        "evaluation_report_path": str(report_path),
        "samples": int(len(df)),
        "labels": VALID_LABELS,
        "selected_model": selected["name"],
        "decision_policy": {
            "emergency_probability_floor": emergency_threshold,
        },
        "holdout": holdout_metrics,
        "quality_gates": eval_report["quality_gates"],
    }

    meta_path.write_text(json.dumps(model_meta, indent=2))
    report_path.write_text(json.dumps(eval_report, indent=2))
    print(json.dumps(eval_report, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Train clinically safer triage classifier.")
    parser.add_argument(
        "--dataset",
        default=str(Path(__file__).parent / "datasets" / "triage_training_template.csv"),
    )
    parser.add_argument(
        "--artifacts-dir",
        default=str(Path(__file__).parent / "artifacts"),
    )
    parser.add_argument("--min-per-class", type=int, default=30)
    parser.add_argument("--max-imbalance-ratio", type=float, default=2.0)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--cv-folds", type=int, default=5)
    parser.add_argument("--min-emergency-recall", type=float, default=0.85)
    parser.add_argument("--min-emergency-precision", type=float, default=0.35)
    parser.add_argument("--min-macro-f1", type=float, default=0.55)
    parser.add_argument("--min-emergency-threshold", type=float, default=0.2)
    parser.add_argument(
        "--allow-small-dataset",
        action="store_true",
        help="Allow training with <120 rows (for local smoke testing only).",
    )
    args = parser.parse_args()

    train(
        dataset_path=Path(args.dataset),
        artifacts_dir=Path(args.artifacts_dir),
        min_per_class=args.min_per_class,
        max_imbalance_ratio=args.max_imbalance_ratio,
        test_size=args.test_size,
        random_state=args.random_state,
        cv_folds=args.cv_folds,
        min_emergency_recall=args.min_emergency_recall,
        min_emergency_precision=args.min_emergency_precision,
        min_macro_f1=args.min_macro_f1,
        min_emergency_threshold=args.min_emergency_threshold,
        allow_small_dataset=args.allow_small_dataset,
    )


if __name__ == "__main__":
    main()
