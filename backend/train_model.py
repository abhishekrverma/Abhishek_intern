import pandas as pd
import numpy as np
import json
import pickle
import os
from textblob import TextBlob
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

DATA_FILE = 'data/master_dataset.csv'
MODEL_FILE = 'model.pkl'
METRICS_FILE = 'model_metrics.json'
RANDOM_STATE = 42

def train():
    print("=" * 60)
    print("🚀 EduGuard AI — Model Training Pipeline")
    print("=" * 60)

    if not os.path.exists(DATA_FILE):
        print(f"❌ Error: {DATA_FILE} not found. Run process_data.py first.")
        return

    # ──────────── 1. LOAD & PREPARE DATA ────────────
    df = pd.read_csv(DATA_FILE)
    print(f"\n📊 Dataset: {len(df)} records loaded")
    print(f"   Columns: {list(df.columns)}")

    # NLP Feature Extraction: Sentiment Analysis
    print("\n🔤 Running NLP Sentiment Analysis on feedback text...")
    df['Sentiment_Score'] = df['Feedback_Text'].apply(
        lambda x: TextBlob(str(x)).sentiment.polarity
    )

    # Define features and target (Expanded for Phase 6)
    feature_cols = [
        'gpa', 'attendance_rate', 'participation_score', 'late_submissions',
        'math score', 'reading score', 'writing score', 'Sentiment_Score'
    ]
    X = df[feature_cols]
    y = df['Risk_Level']

    print(f"\n📈 Feature Matrix Shape: {X.shape}")
    print(f"   Target Distribution:")
    for level, count in y.value_counts().sort_index().items():
        label = ['Low Risk', 'Moderate Risk', 'High Risk'][level]
        pct = count / len(y) * 100
        print(f"     Class {level} ({label}): {count} ({pct:.1f}%)")

    # ──────────── 2. TRAIN/TEST SPLIT ────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    print(f"\n✂️  Train/Test Split: {len(X_train)} train, {len(X_test)} test")

    # ──────────── 3. BUILD PIPELINE (Scaler + Model) ────────────
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ))
    ])

    print("\n🏋️  Training RandomForest (200 trees, max_depth=15)...")
    pipeline.fit(X_train, y_train)

    # ──────────── 4. EVALUATION ────────────
    y_pred = pipeline.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)

    print(f"\n{'─' * 50}")
    print(f"🎯 Test Accuracy: {test_accuracy * 100:.2f}%")
    print(f"{'─' * 50}")

    # Classification Report
    target_names = ['Low Risk', 'Moderate Risk', 'High Risk']
    report = classification_report(y_test, y_pred, target_names=target_names, output_dict=True)
    report_text = classification_report(y_test, y_pred, target_names=target_names)
    print(f"\n📋 Classification Report:\n{report_text}")

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"🔢 Confusion Matrix:")
    print(f"              Predicted")
    print(f"              Low  Mod  High")
    for i, label in enumerate(['Actual Low ', 'Actual Mod ', 'Actual High']):
        print(f"   {label}  {cm[i][0]:4d} {cm[i][1]:4d} {cm[i][2]:4d}")

    # ──────────── 5. CROSS-VALIDATION ────────────
    print(f"\n🔄 Running 5-Fold Stratified Cross-Validation...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    # We need to do CV on the full pipeline
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy')
    print(f"   Fold Scores: {[f'{s:.4f}' for s in cv_scores]}")
    print(f"   Mean ± Std:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ──────────── 6. FEATURE IMPORTANCE ────────────
    # Extract from the trained classifier inside the pipeline
    rf_model = pipeline.named_steps['classifier']
    importances = rf_model.feature_importances_
    feature_importance = {}
    print(f"\n🔬 Feature Importance:")
    for fname, imp in sorted(zip(feature_cols, importances), key=lambda x: -x[1]):
        feature_importance[fname] = round(float(imp), 4)
        bar = "█" * int(imp * 50)
        print(f"   {fname:20s}: {imp:.4f} {bar}")

    # ──────────── 7. SAVE MODEL ────────────
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(pipeline, f)
    print(f"\n💾 Model pipeline saved as '{MODEL_FILE}'")

    # ──────────── 8. SAVE METRICS TO JSON ────────────
    metrics = {
        "model_type": "RandomForestClassifier",
        "n_estimators": 200,
        "max_depth": 15,
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "test_accuracy": round(test_accuracy * 100, 2),
        "cross_validation": {
            "n_folds": 5,
            "mean_accuracy": round(cv_scores.mean() * 100, 2),
            "std_accuracy": round(cv_scores.std() * 100, 2),
            "fold_scores": [round(s * 100, 2) for s in cv_scores]
        },
        "classification_report": {
            name: {
                "precision": round(report[name]["precision"] * 100, 2),
                "recall": round(report[name]["recall"] * 100, 2),
                "f1_score": round(report[name]["f1-score"] * 100, 2),
                "support": int(report[name]["support"])
            }
            for name in target_names
        },
        "confusion_matrix": cm.tolist(),
        "feature_importance": feature_importance,
        "features_used": feature_cols,
        "class_labels": {str(i): name for i, name in enumerate(target_names)}
    }

    with open(METRICS_FILE, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"📊 Metrics saved as '{METRICS_FILE}'")

    print(f"\n{'=' * 60}")
    print(f"✅ Training Complete! Model is ready for deployment.")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    train()