import asyncio
import json
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db_connection, init_db
from models.ai_engine import ai_engine
from services.simulator import sensor_simulator

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

async def telemetry_background_stream():
    """Continuously generates simulated sensor telemetry every 2 seconds and broadcasts."""
    while True:
        try:
            readings = sensor_simulator.generate_tick()
            conn = get_db_connection()
            cursor = conn.cursor()
            processed_zones = []

            for zone_id, packet in readings.items():
                ai_result = ai_engine.predict(packet)

                # Store sensor telemetry
                cursor.execute("""
                    INSERT INTO sensor_telemetry (timestamp, zone_id, strain, vibration, tilt, crack_width, temperature, humidity, corrosion_rate, water_level, sensor_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    packet["timestamp"], zone_id, packet["strain"], packet["vibration"], packet["tilt"],
                    packet["crack_width"], packet["temperature"], packet["humidity"], packet["corrosion_rate"],
                    packet["water_level"], packet["sensor_status"]
                ))

                # Store AI inference
                cursor.execute("""
                    INSERT INTO ai_inferences (timestamp, zone_id, anomaly_flag, anomaly_score, risk_level, rul_hours, fatigue_index, feature_attributions, diagnosis_summary)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    packet["timestamp"], zone_id, 1 if ai_result["anomaly_flag"] else 0,
                    ai_result["anomaly_score"], ai_result["risk_level"], ai_result["rul_hours"],
                    ai_result["fatigue_index"], json.dumps(ai_result["top_features"]), ai_result["diagnosis_summary"]
                ))

                # Generate alert if risk is elevated or sensor is offline
                if ai_result["risk_level"] in ["MEDIUM", "HIGH", "SENSOR_OFFLINE"]:
                    sev = "HIGH" if ai_result["risk_level"] in ["HIGH", "SENSOR_OFFLINE"] else "MEDIUM"
                    lead_driver = ai_result["top_features"][0]["feature"]
                    val = ai_result["top_features"][0]["value"]

                    if ai_result["risk_level"] == "SENSOR_OFFLINE":
                        title = f"DATA GAP ALERT: Sensor Node {zone_id.upper()} Offline"
                        desc = "Packet heartbeat lost. System refuses to guess values to avoid false negatives."
                        rec = "Dispatch field technician to inspect wireless gateway transceiver & power supply."
                    elif ai_result["risk_level"] == "HIGH":
                        title = f"CRITICAL: {lead_driver} Breach in {zone_id.upper()}"
                        desc = f"{lead_driver} reached {val}. Structural integrity limit exceeded."
                        rec = f"Immediate NDT ultrasonic inspection on {zone_id}. Restrict heavy vehicle axle loads."
                    else:
                        title = f"Warning: {lead_driver} Elevation in {zone_id.upper()}"
                        desc = f"{lead_driver} elevated at {val}. Environmental degradation active."
                        rec = f"Inspect moisture seals, joint clearances, and foundation scour protection."

                    cursor.execute("SELECT id FROM alerts WHERE zone_id = ? AND resolved = 0 ORDER BY id DESC LIMIT 1", (zone_id,))
                    existing = cursor.fetchone()
                    if not existing:
                        cursor.execute("""
                            INSERT INTO alerts (timestamp, zone_id, severity, title, description, recommendation, resolved)
                            VALUES (?, ?, ?, ?, ?, ?, 0)
                        """, (packet["timestamp"], zone_id, sev, title, desc, rec))

                combined = {**packet, "ai": ai_result}
                processed_zones.append(combined)

            conn.commit()
            conn.close()

            await manager.broadcast({
                "type": "TELEMETRY_UPDATE",
                "scenario": sensor_simulator.scenario,
                "zones": processed_zones
            })

        except Exception as e:
            print(f"Error in telemetry loop: {e}")

        await asyncio.sleep(2.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Pre-train / warm AI
    _ = ai_engine.predict({
        "strain": 200, "vibration": 0.04, "tilt": 0.05, "crack_width": 0.1,
        "temperature": 22, "humidity": 55, "corrosion_rate": 2.5, "water_level": 1.4
    })
    task = asyncio.create_task(telemetry_background_stream())
    yield
    task.cancel()

app = FastAPI(
    title="Smart Infrastructure Digital Twin API",
    description="Scenario-Based Structural Health Monitoring with 6 sensor types and 5 failure scenarios.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScenarioRequest(BaseModel):
    scenario: str

@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "service": "Smart Infrastructure Digital Twin AI",
        "current_scenario": sensor_simulator.scenario,
        "monitored_zones": 5
    }

@app.get("/api/zones")
def get_zones():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM zones")
    zones = [dict(row) for row in cursor.fetchall()]
    
    result = []
    for z in zones:
        zid = z["id"]
        cursor.execute("SELECT * FROM sensor_telemetry WHERE zone_id = ? ORDER BY id DESC LIMIT 1", (zid,))
        latest_sensor = cursor.fetchone()
        
        cursor.execute("SELECT * FROM ai_inferences WHERE zone_id = ? ORDER BY id DESC LIMIT 1", (zid,))
        latest_ai = cursor.fetchone()

        sensor_data = dict(latest_sensor) if latest_sensor else {
            "strain": 180.0, "vibration": 0.035, "tilt": 0.05, "crack_width": 0.08,
            "temperature": 22.0, "humidity": 55.0, "corrosion_rate": 2.5, "water_level": 1.4,
            "sensor_status": "ONLINE", "timestamp": ""
        }
        
        ai_data = {}
        if latest_ai:
            ai_data = {
                "anomaly_flag": bool(latest_ai["anomaly_flag"]),
                "anomaly_score": latest_ai["anomaly_score"],
                "risk_level": latest_ai["risk_level"],
                "rul_hours": latest_ai["rul_hours"],
                "rul_days": round(latest_ai["rul_hours"] / 24.0, 1),
                "fatigue_index": latest_ai["fatigue_index"],
                "diagnosis_summary": latest_ai["diagnosis_summary"],
                "top_features": json.loads(latest_ai["feature_attributions"])
            }
        else:
            ai_data = ai_engine.predict(sensor_data)

        result.append({
            **z,
            "latest_telemetry": sensor_data,
            "ai_health": ai_data
        })

    conn.close()
    return result

@app.get("/api/zones/{zone_id}/history")
def get_zone_history(zone_id: str, limit: int = 40):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT t.timestamp, t.strain, t.vibration, t.tilt, t.crack_width, t.temperature, t.humidity, t.corrosion_rate, t.water_level, t.sensor_status,
               a.anomaly_flag, a.anomaly_score, a.risk_level, a.rul_hours, a.fatigue_index, a.feature_attributions, a.diagnosis_summary
        FROM sensor_telemetry t
        LEFT JOIN ai_inferences a ON t.timestamp = a.timestamp AND t.zone_id = a.zone_id
        WHERE t.zone_id = ?
        ORDER BY t.id DESC
        LIMIT ?
    """, (zone_id, limit))
    
    rows = [dict(r) for r in cursor.fetchall()]
    rows.reverse()
    
    for r in rows:
        r["anomaly_flag"] = bool(r.get("anomaly_flag", 0))
        if r.get("feature_attributions"):
            try:
                r["feature_attributions"] = json.loads(r["feature_attributions"])
            except Exception:
                pass

    conn.close()
    return rows

@app.post("/api/simulate/scenario")
def set_scenario(payload: ScenarioRequest):
    success = sensor_simulator.set_scenario(payload.scenario)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid scenario name")
    return {
        "status": "scenario_updated",
        "scenario": sensor_simulator.scenario,
        "message": f"Simulation scenario changed to {payload.scenario}"
    }

@app.get("/api/alerts")
def get_alerts(resolved: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if resolved is not None:
        cursor.execute("SELECT * FROM alerts WHERE resolved = ? ORDER BY id DESC LIMIT 50", (resolved,))
    else:
        cursor.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 50")
    alerts = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return alerts

@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "resolved", "alert_id": alert_id}

@app.get("/api/passport/{zone_id}")
def get_material_passport(zone_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM material_passport WHERE zone_id = ?", (zone_id,))
    passport = cursor.fetchone()
    
    if not passport:
        conn.close()
        raise HTTPException(status_code=404, detail="Zone passport not found")
        
    p_dict = dict(passport)
    
    cursor.execute("SELECT * FROM sensor_telemetry WHERE zone_id = ? ORDER BY id DESC LIMIT 1", (zone_id,))
    latest = cursor.fetchone()
    cursor.execute("SELECT * FROM ai_inferences WHERE zone_id = ? ORDER BY id DESC LIMIT 1", (zone_id,))
    latest_ai = cursor.fetchone()
    conn.close()
    
    curr_strain = latest["strain"] if latest else 180.0
    curr_crack = latest["crack_width"] if latest else 0.08
    curr_vib = latest["vibration"] if latest else 0.035
    curr_corr = latest["corrosion_rate"] if latest else 2.5
    fatigue = latest_ai["fatigue_index"] if latest_ai else 0.05
    
    strain_margin_pct = round(max(0.0, (1.0 - (curr_strain / p_dict["design_strain_limit_ue"])) * 100.0), 1)
    crack_margin_pct = round(max(0.0, (1.0 - (curr_crack / p_dict["design_crack_limit_mm"])) * 100.0), 1)
    vib_margin_pct = round(max(0.0, (1.0 - (curr_vib / p_dict["design_vibration_limit_g"])) * 100.0), 1)
    corr_margin_pct = round(max(0.0, (1.0 - (curr_corr / p_dict["design_corrosion_limit_um"])) * 100.0), 1)
    
    return {
        "passport": p_dict,
        "live_metrics": {
            "current_strain_ue": curr_strain,
            "current_crack_mm": curr_crack,
            "current_vibration_g": curr_vib,
            "current_corrosion_um": curr_corr,
            "fatigue_index": fatigue
        },
        "safety_margins": {
            "strain_safety_margin_pct": strain_margin_pct,
            "crack_safety_margin_pct": crack_margin_pct,
            "vibration_safety_margin_pct": vib_margin_pct,
            "corrosion_safety_margin_pct": corr_margin_pct
        }
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                cmd = json.loads(data)
                if cmd.get("action") == "SET_SCENARIO":
                    sensor_simulator.set_scenario(cmd.get("scenario", "NORMAL"))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
