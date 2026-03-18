"""
Kanda Krates ML Model Trainer
=============================
Trains a 7-model ensemble for:
  1. OHI Score prediction (regression, 0-100)
  2. Spoilage Tier classification (Normal / Alert / Action / Emergency)
  3. Estimated Days Remaining (regression)

Models used:
  1. Random Forest Classifier (tier)
  2. Gradient Boosting Classifier (tier)
  3. Support Vector Machine (tier)
  4. Random Forest Regressor (OHI score)
  5. Gradient Boosting Regressor (OHI score)
  6. Ridge Regression (OHI score)
  7. Random Forest Regressor (days remaining)

All models trained on domain-expert synthetic data based on
FAO/WHO onion storage guidelines.
"""

import numpy as np
import pandas as pd
import joblib
import os
import random
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVC
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder

random.seed(42)
np.random.seed(42)

# ─────────────────────────────────────────────
# 1. Generate Synthetic Training Data
# ─────────────────────────────────────────────

def generate_training_data(n_samples=5000):
    """
    Generate labeled sensor data based on onion storage domain knowledge.
    
    Optimal onion storage: 25-30°C, 65-70% humidity, low gas levels.
    Spoilage accelerates with high temp, high humidity, and rising gases.
    """
    records = []

    for _ in range(n_samples):
        scenario = random.choices(
            ["normal", "alert", "action", "emergency"],
            weights=[0.35, 0.25, 0.22, 0.18],
            k=1
        )[0]

        if scenario == "normal":
            temp = random.uniform(20, 27)
            humidity = random.uniform(55, 68)
            co2 = random.uniform(300, 1000)
            nh3 = random.uniform(0.0, 0.3)
            voc = random.uniform(0.0, 0.3)
            ohi = random.uniform(76, 100)   # Normal: 76–100
            days = random.uniform(25, 60)
            tier = "Normal"

        elif scenario == "alert":
            temp = random.uniform(27, 32)
            humidity = random.uniform(66, 78)
            co2 = random.uniform(1000, 3000)
            nh3 = random.uniform(0.3, 1.0)
            voc = random.uniform(0.3, 1.0)
            ohi = random.uniform(56, 75)    # Alert: 56–75
            days = random.uniform(12, 25)
            tier = "Alert"

        elif scenario == "action":
            temp = random.uniform(31, 38)
            humidity = random.uniform(76, 88)
            co2 = random.uniform(3000, 7000)
            nh3 = random.uniform(1.0, 4.0)
            voc = random.uniform(1.0, 3.5)
            ohi = random.uniform(36, 55)    # Action: 36–55
            days = random.uniform(4, 12)
            tier = "Action"

        else:  # emergency
            temp = random.uniform(36, 45)
            humidity = random.uniform(85, 98)
            co2 = random.uniform(7000, 15000)
            nh3 = random.uniform(4.0, 15.0)
            voc = random.uniform(3.0, 10.0)
            ohi = random.uniform(0, 35)     # Emergency: 0–35
            days = random.uniform(0, 4)
            tier = "Emergency"

        # Add realistic noise
        temp += random.gauss(0, 0.5)
        humidity += random.gauss(0, 1.0)
        co2 += random.gauss(0, 50)
        nh3 += random.gauss(0, 0.05)
        voc += random.gauss(0, 0.05)
        ohi = max(0, min(100, ohi + random.gauss(0, 2)))
        days = max(0, days + random.gauss(0, 1))

        records.append({
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "co2": int(max(0, co2)),
            "nh3": round(max(0, nh3), 2),
            "voc": round(max(0, voc), 2),
            "ohi": round(ohi, 1),
            "days_remaining": round(days, 1),
            "tier": tier
        })

    return pd.DataFrame(records)


# ─────────────────────────────────────────────
# 2. Train All 7 Models
# ─────────────────────────────────────────────

def train_models():
    print("📊 Generating synthetic training data (5000 samples)...")
    df = generate_training_data(5000)

    features = ["temperature", "humidity", "co2", "nh3", "voc"]
    X = df[features].values
    
    # Must encode the string labels to integers to avoid NumPy 2.x casting bugs on Python 3.13
    tier_encoder = LabelEncoder()
    y_tier = tier_encoder.fit_transform(df["tier"].values)
    
    y_ohi = df["ohi"].values
    y_days = df["days_remaining"].values

    # Normalize features for SVM
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/test split
    X_train, X_test, y_tier_train, y_tier_test = train_test_split(
        X_scaled, y_tier, test_size=0.2, random_state=42, stratify=y_tier
    )
    _, _, y_ohi_train, y_ohi_test = train_test_split(
        X_scaled, y_ohi, test_size=0.2, random_state=42
    )
    _, _, y_days_train, y_days_test = train_test_split(
        X_scaled, y_days, test_size=0.2, random_state=42
    )

    models = {}

    # ── Model 1: Random Forest Classifier (Tier) ──
    print("🌲 Training Model 1/7: Random Forest Classifier (Tier)...")
    rf_clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42)
    rf_clf.fit(X_train, y_tier_train)
    acc = accuracy_score(y_tier_test, rf_clf.predict(X_test))
    print(f"   ✅ Accuracy: {acc:.4f}")
    models["rf_classifier"] = rf_clf

    # ── Model 2: Gradient Boosting Classifier (Tier) ──
    print("🚀 Training Model 2/7: Gradient Boosting Classifier (Tier)...")
    gb_clf = GradientBoostingClassifier(n_estimators=150, max_depth=6, random_state=42)
    gb_clf.fit(X_train, y_tier_train)
    acc = accuracy_score(y_tier_test, gb_clf.predict(X_test))
    print(f"   ✅ Accuracy: {acc:.4f}")
    models["gb_classifier"] = gb_clf

    # ── Model 3: Support Vector Machine (Tier) ──
    print("🔮 Training Model 3/7: SVM Classifier (Tier)...")
    svm_clf = SVC(kernel="rbf", C=10, gamma="scale", probability=True, random_state=42)
    svm_clf.fit(X_train, y_tier_train)
    acc = accuracy_score(y_tier_test, svm_clf.predict(X_test))
    print(f"   ✅ Accuracy: {acc:.4f}")
    models["svm_classifier"] = svm_clf

    # ── Model 4: Random Forest Regressor (OHI) ──
    print("📈 Training Model 4/7: Random Forest Regressor (OHI Score)...")
    rf_reg = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42)
    rf_reg.fit(X_train, y_ohi_train)
    mae = mean_absolute_error(y_ohi_test, rf_reg.predict(X_test))
    r2 = r2_score(y_ohi_test, rf_reg.predict(X_test))
    print(f"   ✅ MAE: {mae:.2f}, R²: {r2:.4f}")
    models["rf_regressor_ohi"] = rf_reg

    # ── Model 5: Gradient Boosting Regressor (OHI) ──
    print("📈 Training Model 5/7: Gradient Boosting Regressor (OHI Score)...")
    gb_reg = GradientBoostingRegressor(n_estimators=150, max_depth=6, random_state=42)
    gb_reg.fit(X_train, y_ohi_train)
    mae = mean_absolute_error(y_ohi_test, gb_reg.predict(X_test))
    r2 = r2_score(y_ohi_test, gb_reg.predict(X_test))
    print(f"   ✅ MAE: {mae:.2f}, R²: {r2:.4f}")
    models["gb_regressor_ohi"] = gb_reg

    # ── Model 6: Ridge Regression (OHI) ──
    print("📐 Training Model 6/7: Ridge Regression (OHI Score)...")
    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train, y_ohi_train)
    mae = mean_absolute_error(y_ohi_test, ridge.predict(X_test))
    r2 = r2_score(y_ohi_test, ridge.predict(X_test))
    print(f"   ✅ MAE: {mae:.2f}, R²: {r2:.4f}")
    models["ridge_regressor_ohi"] = ridge

    # ── Model 7: Random Forest Regressor (Days Remaining) ──
    print("📅 Training Model 7/7: Random Forest Regressor (Days Remaining)...")
    rf_days = RandomForestRegressor(n_estimators=200, max_depth=12, random_state=42)
    rf_days.fit(X_train, y_days_train)
    mae = mean_absolute_error(y_days_test, rf_days.predict(X_test))
    r2 = r2_score(y_days_test, rf_days.predict(X_test))
    print(f"   ✅ MAE: {mae:.2f} days, R²: {r2:.4f}")
    models["rf_regressor_days"] = rf_days

    # ─── Save everything ───
    output_dir = os.path.dirname(os.path.abspath(__file__))

    joblib.dump(scaler, os.path.join(output_dir, "scaler.pkl"))
    joblib.dump(tier_encoder, os.path.join(output_dir, "tier_encoder.pkl"))
    print(f"\n💾 Saved scaler.pkl and tier_encoder.pkl")

    for name, model in models.items():
        path = os.path.join(output_dir, f"{name}.pkl")
        joblib.dump(model, path)
        print(f"💾 Saved {name}.pkl")

    print(f"\n🎉 All 7 models trained and saved successfully!")
    print(f"   Total training samples: {len(df)}")
    print(f"   Features: {features}")
    print(f"   Output: OHI score, Tier classification, Days remaining")


if __name__ == "__main__":
    train_models()
