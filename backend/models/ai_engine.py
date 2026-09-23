import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
IF_MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")
RF_MODEL_PATH = os.path.join(MODEL_DIR, "risk_classifier.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")

FEATURE_NAMES = ["strain", "vibration", "tilt", "crack_width", "temperature", "humidity", "corrosion_rate", "water_level"]

BASELINE_MEANS = {
    "strain": 180.0,
    "vibration": 0.035,
    "tilt": 0.05,
    "crack_width": 0.08,
    "temperature": 22.0,
    "humidity": 55.0,
    "corrosion_rate": 2.5,
    "water_level": 1.4
}

BASELINE_STDS = {
    "strain": 45.0,
    "vibration": 0.012,
    "tilt": 0.02,
    "crack_width": 0.03,
    "temperature": 5.0,
    "humidity": 12.0,
    "corrosion_rate": 1.0,
    "water_level": 0.4
}

DESIGN_LIMITS = {
    "strain": 750.0,
    "vibration": 0.35,
    "tilt": 0.60,
    "crack_width": 1.50,
    "temperature": 50.0,
    "humidity": 95.0,
    "corrosion_rate": 20.0,
    "water_level": 4.0
}

class AIEngine:
    def __init__(self):
        self.feature_names = FEATURE_NAMES
        self.isolation_forest = None
        self.risk_classifier = None
        self.scaler = None
        self._ensure_models_trained()

    def _generate_synthetic_training_data(self, n_samples=3000):
        np.random.seed(42)

        # 1. Healthy baseline (Class 0: LOW risk) - 60%
        n_healthy = int(n_samples * 0.60)
        h_strain = np.random.normal(180, 40, n_healthy)
        h_vib = np.abs(np.random.normal(0.035, 0.012, n_healthy))
        h_tilt = np.abs(np.random.normal(0.05, 0.02, n_healthy))
        h_crack = np.abs(np.random.normal(0.08, 0.03, n_healthy))
        h_temp = np.random.normal(22, 6, n_healthy)
        h_hum = np.clip(np.random.normal(55, 12, n_healthy), 20, 90)
        h_corr = np.abs(np.random.normal(2.5, 0.8, n_healthy))
        h_water = np.abs(np.random.normal(1.4, 0.3, n_healthy))
        h_labels = np.zeros(n_healthy, dtype=int)

        # 2. Moderate degradation / Heavy Rain (Class 1: MEDIUM risk) - 25%
        n_medium = int(n_samples * 0.25)
        m_strain = np.random.normal(420, 70, n_medium)
        m_vib = np.abs(np.random.normal(0.18, 0.04, n_medium))
        m_tilt = np.abs(np.random.normal(0.22, 0.06, n_medium))
        m_crack = np.abs(np.random.normal(0.55, 0.15, n_medium))
        m_temp = np.random.normal(26, 8, n_medium)
        m_hum = np.clip(np.random.normal(85, 10, n_medium), 50, 99)
        m_corr = np.abs(np.random.normal(14.0, 3.0, n_medium))
        m_water = np.abs(np.random.normal(3.5, 0.6, n_medium))
        m_labels = np.ones(n_medium, dtype=int)

        # 3. Critical anomalies / Overload / Fracture (Class 2: HIGH risk) - 15%
        n_high = n_samples - n_healthy - n_medium
        c_strain = np.random.normal(780, 110, n_high)
        c_vib = np.abs(np.random.normal(0.42, 0.08, n_high))
        c_tilt = np.abs(np.random.normal(0.65, 0.15, n_high))
        c_crack = np.abs(np.random.normal(1.85, 0.40, n_high))
        c_temp = np.random.normal(32, 10, n_high)
        c_hum = np.clip(np.random.normal(75, 18, n_high), 25, 99)
        c_corr = np.abs(np.random.normal(26.0, 5.0, n_high))
        c_water = np.abs(np.random.normal(4.6, 0.8, n_high))
        c_labels = np.full(n_high, 2, dtype=int)

        X = np.column_stack([
            np.concatenate([h_strain, m_strain, c_strain]),
            np.concatenate([h_vib, m_vib, c_vib]),
            np.concatenate([h_tilt, m_tilt, c_tilt]),
            np.concatenate([h_crack, m_crack, c_crack]),
            np.concatenate([h_temp, m_temp, c_temp]),
            np.concatenate([h_hum, m_hum, c_hum]),
            np.concatenate([h_corr, m_corr, c_corr]),
            np.concatenate([h_water, m_water, c_water]),
        ])
        y = np.concatenate([h_labels, m_labels, c_labels])
        return X, y

    def _ensure_models_trained(self):
        if os.path.exists(IF_MODEL_PATH) and os.path.exists(RF_MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.isolation_forest = joblib.load(IF_MODEL_PATH)
                self.risk_classifier = joblib.load(RF_MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                return
            except Exception as e:
                print(f"Error loading models: {e}. Refitting...")

        X, y = self._generate_synthetic_training_data()

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # 1. Isolation Forest for Unsupervised Anomaly Detection
        X_healthy = X_scaled[y == 0]
        self.isolation_forest = IsolationForest(
            n_estimators=150,
            contamination=0.08,
            random_state=42
        )
        self.isolation_forest.fit(X_healthy)

        # 2. Random Forest for Supervised Risk Classification
        self.risk_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42
        )
        self.risk_classifier.fit(X, y)

        joblib.dump(self.isolation_forest, IF_MODEL_PATH)
        joblib.dump(self.risk_classifier, RF_MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)

    def predict(self, sensor_dict):
        # Check for Sensor Failure / Data Gap
        if sensor_dict.get("sensor_status") == "DATA_GAP_DISCONNECTED":
            return {
                "anomaly_flag": True,
                "anomaly_score": 0.0,
                "risk_level": "SENSOR_OFFLINE",
                "risk_probabilities": {"LOW": 0.0, "MEDIUM": 0.0, "HIGH": 0.0, "OFFLINE": 1.0},
                "rul_hours": 0.0,
                "rul_days": 0.0,
                "fatigue_index": 0.0,
                "top_features": [
                    {"feature": "Telemetry Packet Heartbeat", "key": "heartbeat", "value": "LOST / DATA GAP", "contribution_pct": 100.0}
                ],
                "diagnosis_summary": "INTEGRITY WARNING: Sensor node heartbeat lost. System enters fail-safe diagnostic mode without guessing data."
            }

        raw_vals = [
            float(sensor_dict.get("strain", BASELINE_MEANS["strain"])),
            float(sensor_dict.get("vibration", BASELINE_MEANS["vibration"])),
            float(sensor_dict.get("tilt", BASELINE_MEANS["tilt"])),
            float(sensor_dict.get("crack_width", BASELINE_MEANS["crack_width"])),
            float(sensor_dict.get("temperature", BASELINE_MEANS["temperature"])),
            float(sensor_dict.get("humidity", BASELINE_MEANS["humidity"])),
            float(sensor_dict.get("corrosion_rate", BASELINE_MEANS["corrosion_rate"])),
            float(sensor_dict.get("water_level", BASELINE_MEANS["water_level"]))
        ]
        X_raw = np.array([raw_vals])
        X_scaled = self.scaler.transform(X_raw)

        # 1. Isolation Forest Inference
        raw_score = self.isolation_forest.decision_function(X_scaled)[0]
        calibrated_score = float(np.clip(1.0 - (raw_score + 0.35) / 0.55, 0.0, 1.0))
        is_anomaly = bool(calibrated_score >= 0.55 or raw_score < 0)

        # 2. Risk Classification Inference
        risk_probs = self.risk_classifier.predict_proba(X_raw)[0]
        risk_idx = int(np.argmax(risk_probs))
        risk_levels = ["LOW", "MEDIUM", "HIGH"]
        risk_level = risk_levels[risk_idx]

        if is_anomaly and risk_level == "LOW":
            risk_level = "MEDIUM"

        risk_prob_dict = {
            "LOW": round(float(risk_probs[0]), 3),
            "MEDIUM": round(float(risk_probs[1]), 3),
            "HIGH": round(float(risk_probs[2]), 3)
        }

        # 3. Remaining Useful Life (RUL) & Fatigue Damage
        strain_ratio = raw_vals[0] / DESIGN_LIMITS["strain"]
        vib_ratio = raw_vals[1] / DESIGN_LIMITS["vibration"]
        crack_ratio = raw_vals[3] / DESIGN_LIMITS["crack_width"]
        corr_ratio = raw_vals[6] / DESIGN_LIMITS["corrosion_rate"]
        water_ratio = raw_vals[7] / DESIGN_LIMITS["water_level"]

        damage_metric = (
            0.35 * (crack_ratio ** 2.2) +
            0.30 * (strain_ratio ** 1.8) +
            0.15 * (vib_ratio ** 1.5) +
            0.10 * (corr_ratio ** 1.6) +
            0.10 * (water_ratio ** 1.4)
        )
        fatigue_index = float(np.clip(damage_metric, 0.02, 0.99))

        if damage_metric < 0.30:
            rul_hours = max(50000.0, (1.0 - damage_metric) * 350000.0)
        elif damage_metric < 0.70:
            rul_hours = max(2400.0, (1.0 - damage_metric) * 25000.0)
        else:
            rul_hours = max(12.0, (1.0 - np.clip(damage_metric, 0.7, 0.98)) * 1200.0)

        rul_days = float(round(float(rul_hours) / 24.0, 1))
        rul_hours = float(round(float(rul_hours), 1))

        # 4. Feature Attributions
        deviations = {}
        total_dev = 0.0
        for i, fname in enumerate(FEATURE_NAMES):
            val = raw_vals[i]
            base_mean = BASELINE_MEANS[fname]
            base_std = BASELINE_STDS[fname]
            z_score = max(0.0, (val - base_mean) / base_std)
            limit_ratio = val / DESIGN_LIMITS[fname]
            weight = 2.5 if fname in ["crack_width", "strain", "corrosion_rate"] else 1.0
            contrib = (z_score ** 1.6) * weight + (limit_ratio ** 2.0) * 10.0
            deviations[fname] = {
                "val": val,
                "z_score": round(float(z_score), 2),
                "limit_ratio": round(float(limit_ratio), 3),
                "raw_contrib": contrib
            }
            total_dev += contrib

        if total_dev == 0:
            total_dev = 1.0

        top_features = []
        for fname in FEATURE_NAMES:
            share = round(float((deviations[fname]["raw_contrib"] / total_dev) * 100.0), 1)
            val_str = f"{raw_vals[FEATURE_NAMES.index(fname)]:.2f}"
            unit = "ue" if fname == "strain" else ("g" if fname == "vibration" else ("deg" if fname == "tilt" else ("mm" if fname == "crack_width" else ("C" if fname == "temperature" else ("%" if fname == "humidity" else ("um/yr" if fname == "corrosion_rate" else "m"))))))
            top_features.append({
                "feature": fname.replace("_", " ").title(),
                "key": fname,
                "value": f"{val_str} {unit}",
                "contribution_pct": share,
                "z_score": deviations[fname]["z_score"],
                "limit_ratio": deviations[fname]["limit_ratio"]
            })

        top_features.sort(key=lambda x: x["contribution_pct"], reverse=True)

        lead_feature = top_features[0]
        if risk_level == "HIGH":
            if "Crack" in lead_feature["feature"]:
                diagnosis_summary = f"CRITICAL: Excessive crack widening ({lead_feature['value']}). Immediate ultrasonic inspection required."
            elif "Strain" in lead_feature["feature"]:
                diagnosis_summary = f"CRITICAL: Excessive dynamic load stress on beam ({lead_feature['value']}). Axle overload breach detected."
            else:
                diagnosis_summary = f"CRITICAL ALERT: Structural threshold exceeded in {lead_feature['feature']} ({lead_feature['value']})."
        elif risk_level == "MEDIUM":
            if "Corrosion" in lead_feature["feature"] or "Water" in lead_feature["feature"] or "Humidity" in lead_feature["feature"]:
                diagnosis_summary = "WARNING: Prolonged moisture exposure & elevated flood level increasing corrosion risk on pier."
            else:
                diagnosis_summary = f"WARNING: Elevated stress detected in {lead_feature['feature']} ({lead_feature['value']}). Monitoring trend."
        else:
            diagnosis_summary = "NORMAL: All structural parameters operate within allowable design envelope."

        return {
            "anomaly_flag": is_anomaly,
            "anomaly_score": round(calibrated_score, 3),
            "risk_level": risk_level,
            "risk_probabilities": risk_prob_dict,
            "rul_hours": rul_hours,
            "rul_days": rul_days,
            "fatigue_index": round(fatigue_index, 3),
            "top_features": top_features,
            "diagnosis_summary": diagnosis_summary
        }

ai_engine = AIEngine()
