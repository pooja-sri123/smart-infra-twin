# 🌉 Smart Infrastructure Digital Twin
### AI-Powered Structural Health Monitoring (SHM) & Predictive Degradation System for Bridges and Buildings

![Tech Stack](https://img.shields.io/badge/Stack-React_19_+_Three.js_+_FastAPI_+_Scikit--Learn-blue)
![AI Models](https://img.shields.io/badge/AI-Isolation_Forest_+_Random_Forest_+_RUL_Forecaster-emerald)
![Status](https://img.shields.io/badge/Status-Hackathon_Ready-green)

---

## 📖 System Overview

The **Smart Infrastructure Digital Twin** is an end-to-end cyber-physical structural health monitoring prototype designed for civil infrastructure assets (cable-stayed bridges, towers, high-rise buildings).

The platform continuously streams simulated multi-sensor telemetry, feeds it into an active multi-model AI pipeline, computes real-time anomaly probabilities, risk tiers, and remaining useful life (RUL) forecasts, and visualizes structural stress distribution directly onto an interactive **Three.js 3D Digital Twin** with a **Digital Material Passport**.

---

## 🏗️ Architectural Pipeline

```
[IoT Sensor Simulator / Anomaly Injector]
  ├── Strain Gauges (ue)
  ├── Triaxial Accelerometers / Vibration (g)
  ├── Digital Inclinometers / Tilt (deg)
  ├── Optical Crack Displacement (mm)
  └── Ambient Temp (C) & Humidity (%RH)
            │
            ▼ (Continuous 2.0s Telemetry Loop)
[FastAPI Backend & SQLite Time-Series Store]
            │
            ├─► [1. Isolation Forest] ──► Real-Time Stream Anomaly Score & Outlier Flag
            ├─► [2. Random Forest] ────► Structural Risk Tier (LOW / MEDIUM / HIGH)
            ├─► [3. RUL Forecaster] ───► Physics-Informed Fatigue & Degradation (Days/Hours)
            └─► [4. Explainability] ───► SHAP-style Feature Importance & Z-Score Attributions
            │
            ▼ (WebSocket: ws://localhost:8000/ws/telemetry)
[React + Three.js Frontend Command Center]
  ├── 3D Structural Twin (Interactive Raycasting, Zone Heatmaps, Pulsing Sensor Pucks)
  ├── Multi-Metric Time-Series Charts with Design Threshold Breaches
  ├── Digital Material Passport (Design Specifications vs. Real-Time Behavior Ledger)
  ├── Actionable Maintenance Protocol & Engineering Alerts
  └── Hackathon Demo Control Bar (Instant 1-click physical failure injections)
```

---

## 🧠 AI Prediction Engine Details

1. **Isolation Forest (`models/ai_engine.py`)**:
   - Unsupervised multivariate outlier detection fitted on healthy structural baseline distributions.
   - Evaluates multivariate correlation shifts without requiring prior labeled failure instances.
   - Computes continuous calibrated anomaly scores $[0.0, 1.0]$.
2. **Supervised Risk Classification (Random Forest)**:
   - Evaluates multi-parameter stress states and classifies structural risk into `LOW` (Green), `MEDIUM` (Amber), and `HIGH` (Red / Critical).
3. **Remaining Useful Life (RUL) & Fatigue Damage Progression**:
   - Physics-informed exponential degradation law calculating continuous damage accumulation metric $D(t)$ against Eurocode & AASHTO structural design limits.
   - Dynamically projects operational hours and days remaining before mandatory maintenance closure.
4. **SHAP-Style Feature Explainability**:
   - Computes exact percentage shares of which sensors caused the anomaly (e.g. `Crack Width: 65.4%`, `Vibration: 27.1%`, `Strain: 6.9%`).
   - Generates automated natural-language diagnostic summaries for civil engineers.

---

## 🎯 5 Monitored Structural Zones

| Zone ID | Structural Component | Primary Sensors | Design Limit | Critical Failure Mode |
| :--- | :--- | :--- | :--- | :--- |
| `zone-1` | South Pier & Caisson Foundation | Tilt, Vibration, Strain | Tilt: 0.60 deg, Vib: 0.25g | Differential settlement & scour |
| `zone-2` | Main Deck Girder Mid-Span | Dynamic Strain, Crack | Strain: 750 ue, Crack: 1.20mm | Overload deflection & fatigue cracking |
| `zone-3` | North Pylon & Tower Saddle | Vibration, Tilt, Temp | Vib: 0.40g, Tilt: 0.80 deg | Resonant wind vortex excitation |
| `zone-4` | Cable-Stay Harness Stay-04 | High-Tensile Strain, Vib | Strain: 900 ue, Vib: 0.30g | Cable tension loss & anchor fatigue |
| `zone-5` | North Abutment & Expansion Joint | Crack Width, Temp, Humidity | Crack: 2.00mm, Vib: 0.20g | Joint lockup & elastomeric tearing |

---

## 🚀 Quick-Start Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### Step 1: Start the Backend (FastAPI + AI Engine)

Open a terminal in `backend/`:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
> Backend will be running at: `http://localhost:8000`
> Interactive Swagger API docs: `http://localhost:8000/docs`

---

### Step 2: Start the Frontend (React + Three.js)

Open a separate terminal in `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
> Frontend will be running at: `http://localhost:3000` (or `http://localhost:5173`)

---

## 🎬 How to Demo to Judges in 60 Seconds

1. Open `http://localhost:3000` in your browser.
2. **Show the 3D Twin**: Orbit, zoom, and rotate the 3D Cable-Stayed bridge. Toggle between **Realistic 3D**, **Stress Heatmap**, and **X-Ray Wireframe** modes.
3. **Show Zone Selection**: Click on any zone in the 3D model (e.g. Zone 2 Mid-Span). Notice how the camera smoothly glides and the AI diagnostic panel updates in real time.
4. **Trigger a Live Failure Scenario**:
   - In the top demo bar, click **"Crack Fracture"** (Zone 5) or **"Traffic Overload"** (Zone 2).
   - In 2 seconds, observe the live sensor reading breach threshold limits.
   - Observe **Isolation Forest** trigger `Anomaly Flag: TRUE`, and **Risk Level** turn to `CRITICAL` (Red).
   - Observe the 3D model turn pulsing Crimson at that exact component.
   - Observe the **Feature Attribution Bar Chart** show Crack Width / Strain driving 70%+ of the score.
   - Observe the **RUL Forecast** drop and a new actionable alert appear with prescribed engineering maintenance protocol.
5. **Open Digital Material Passport**:
   - Click **"Material Passport"** on any zone to showcase the design specifications (yield strength, modulus, carbon footprint) vs. live measured stress and safety margin meters.
6. **Return to Normal**: Click **"Normal State"** on the demo bar to show baseline recovery.

---

## 📁 Repository Structure

```
smart-infra-twin/
├── backend/
│   ├── database.py              # SQLite schema & time-series persistence
│   ├── main.py                  # FastAPI REST endpoints & WebSocket broadcaster
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   ├── ai_engine.py         # Isolation Forest, Random Forest & RUL forecaster
│   │   ├── isolation_forest.joblib
│   │   ├── risk_classifier.joblib
│   │   └── scaler.joblib
│   └── services/
│       └── simulator.py         # Physics-informed sensor generator & anomaly injector
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx              # Main dashboard command center layout
│       ├── index.css            # Tailwind styles, animations & glow shaders
│       ├── services/
│       │   └── api.js           # REST API & WebSocket client
│       └── components/
│           ├── Header.jsx       # Health index gauge, active alerts, WS status
│           ├── ScenarioControls.jsx # 1-Click failure scenario injection bar
│           ├── ZoneCards.jsx    # 5 structural zone status cards
│           ├── DigitalTwin3D.jsx# Three.js 3D bridge model with raycasting
│           ├── ZoneDetailPanel.jsx # AI diagnostics & explainability charts
│           ├── LiveTelemetryCharts.jsx # Real-time sensor trend graphs
│           ├── DigitalMaterialPassport.jsx # Design vs. Actual material specs
│           └── AlertsPanel.jsx  # Actionable maintenance protocols
└── README.md
```
