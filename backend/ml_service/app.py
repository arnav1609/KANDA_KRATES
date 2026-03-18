"""
Kanda Krates ML Prediction API
================================
FastAPI server that loads the 7-model ensemble and serves predictions.

Endpoints:
  POST /predict
    Input:  { temperature, humidity, co2, nh3, voc }
    Output: { ohi, tier, daysRemaining, confidence, modelVotes }
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import joblib
import os

app = FastAPI(title="Kanda Krates ML Service", version="1.0.0")

# Allow Node.js backend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load Models ───

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

    # Tier classifiers (3 models — majority vote)
    rf_clf = joblib.load(os.path.join(MODEL_DIR, "rf_classifier.pkl"))
    gb_clf = joblib.load(os.path.join(MODEL_DIR, "gb_classifier.pkl"))
    svm_clf = joblib.load(os.path.join(MODEL_DIR, "svm_classifier.pkl"))

    # OHI regressors (3 models — averaged)
    rf_reg_ohi = joblib.load(os.path.join(MODEL_DIR, "rf_regressor_ohi.pkl"))
    gb_reg_ohi = joblib.load(os.path.join(MODEL_DIR, "gb_regressor_ohi.pkl"))
    ridge_reg_ohi = joblib.load(os.path.join(MODEL_DIR, "ridge_regressor_ohi.pkl"))

    # Days remaining regressor (1 model)
    rf_reg_days = joblib.load(os.path.join(MODEL_DIR, "rf_regressor_days.pkl"))

    print("All 7 ML models loaded successfully!")
    MODELS_LOADED = True

except Exception as e:
    print(f"Failed to load models: {e}")
    print("   Run 'python train_model.py' first to train and save models.")
    MODELS_LOADED = False


# ─── Request / Response Schemas ───

class SensorInput(BaseModel):
    temperature: float
    humidity: float
    co2: float
    nh3: float
    voc: float


class PredictionResponse(BaseModel):
    ohi: int
    tier: str
    daysRemaining: float
    confidence: float
    modelVotes: dict


# ─── Ensemble Prediction Logic ───

TIER_ORDER = ["Normal", "Alert", "Action", "Emergency"]

def ensemble_predict(features_scaled: np.ndarray):
    """
    Run all 7 models and combine predictions:
    - Tier: majority vote of 3 classifiers
    - OHI: weighted average of 3 regressors
    - Days: single regressor prediction
    """

    # ── Tier Classification (Majority Vote) ──
    pred_rf = rf_clf.predict(features_scaled)[0]
    pred_gb = gb_clf.predict(features_scaled)[0]
    pred_svm = svm_clf.predict(features_scaled)[0]

    votes = [pred_rf, pred_gb, pred_svm]
    vote_counts = {}
    for v in votes:
        vote_counts[v] = vote_counts.get(v, 0) + 1

    # Pick majority; if tie, pick highest severity
    max_votes = max(vote_counts.values())
    candidates = [k for k, v in vote_counts.items() if v == max_votes]

    if len(candidates) == 1:
        final_tier_idx = int(candidates[0])
    else:
        # Tie-break: pick the most severe tier
        final_tier_idx = int(max(candidates, key=lambda x: x))

    # Convert integer class index to label string
    final_tier = TIER_ORDER[min(final_tier_idx, len(TIER_ORDER) - 1)]

    # Confidence from probability estimates
    try:
        probs_rf = rf_clf.predict_proba(features_scaled)[0]
        probs_gb = gb_clf.predict_proba(features_scaled)[0]
        probs_svm = svm_clf.predict_proba(features_scaled)[0]
        avg_probs = (probs_rf + probs_gb + probs_svm) / 3.0
        confidence = float(np.max(avg_probs))
    except Exception:
        confidence = max_votes / 3.0

    # ── OHI Score (Weighted Average of 3 Regressors) ──
    ohi_rf = rf_reg_ohi.predict(features_scaled)[0]
    ohi_gb = gb_reg_ohi.predict(features_scaled)[0]
    ohi_ridge = ridge_reg_ohi.predict(features_scaled)[0]

    # Weights: RF=0.4, GB=0.4, Ridge=0.2 (tree models get more weight)
    ohi_ensemble = 0.4 * ohi_rf + 0.4 * ohi_gb + 0.2 * ohi_ridge
    ohi_final = int(np.clip(round(ohi_ensemble), 0, 100))

    # ── Reconcile tier with OHI score (prevents inconsistency) ──
    # OHI bands: 0–35 Emergency, 36–55 Action, 56–75 Alert, 76–100 Normal
    if ohi_final < 36:
        ohi_tier = "Emergency"
    elif ohi_final < 56:
        ohi_tier = "Action"
    elif ohi_final < 76:
        ohi_tier = "Alert"
    else:
        ohi_tier = "Normal"

    # Override ML vote with OHI-derived tier — OHI is the ground truth
    final_tier = ohi_tier

    # ── Days Remaining ──
    days = rf_reg_days.predict(features_scaled)[0]
    days_final = round(max(0, days), 1)

    return {
        "ohi": ohi_final,
        "tier": final_tier,
        "daysRemaining": float(days_final),
        "confidence": round(confidence, 3),
        "modelVotes": {
            "randomForest": TIER_ORDER[min(int(pred_rf), len(TIER_ORDER) - 1)],
            "gradientBoosting": TIER_ORDER[min(int(pred_gb), len(TIER_ORDER) - 1)],
            "svm": TIER_ORDER[min(int(pred_svm), len(TIER_ORDER) - 1)],
            "ohiScores": {
                "randomForest": round(float(ohi_rf), 1),
                "gradientBoosting": round(float(ohi_gb), 1),
                "ridge": round(float(ohi_ridge), 1),
                "ensemble": ohi_final
            }
        }
    }


# ─── API Endpoints ───

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "modelsLoaded": MODELS_LOADED,
        "modelCount": 7,
        "models": [
            "RandomForest Classifier (Tier)",
            "GradientBoosting Classifier (Tier)",
            "SVM Classifier (Tier)",
            "RandomForest Regressor (OHI)",
            "GradientBoosting Regressor (OHI)",
            "Ridge Regressor (OHI)",
            "RandomForest Regressor (Days Remaining)"
        ]
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(data: SensorInput):
    if not MODELS_LOADED:
        return PredictionResponse(
            ohi=50, tier="Alert", daysRemaining=10.0,
            confidence=0.0, modelVotes={"error": "Models not loaded"}
        )

    # Prepare features
    raw = np.array([[data.temperature, data.humidity, data.co2, data.nh3, data.voc]])
    scaled = scaler.transform(raw)

    result = ensemble_predict(scaled)
    return PredictionResponse(**result)


# ─── Main ───

if __name__ == "__main__":
    import uvicorn
    print("Starting Kanda Krates ML Service on port 5001...")
    uvicorn.run(app, host="0.0.0.0", port=5001)
