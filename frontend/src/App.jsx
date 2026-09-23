import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import ScenarioControls from "./components/ScenarioControls";
import ZoneCards from "./components/ZoneCards";
import DigitalTwin3D from "./components/DigitalTwin3D";
import ZoneDetailPanel from "./components/ZoneDetailPanel";
import LiveTelemetryCharts from "./components/LiveTelemetryCharts";
import AlertsPanel from "./components/AlertsPanel";
import DigitalMaterialPassport from "./components/DigitalMaterialPassport";
import {
  fetchZones,
  fetchZoneHistory,
  fetchAlerts,
  resolveAlert,
  setSimulationScenario,
  createTelemetryWebSocket
} from "./services/api";
import { Box, Layers, Eye, Shield } from "lucide-react";

// Default Initial Zones to prevent empty state
const INITIAL_ZONES = [
  {
    id: "zone-1",
    name: "South Pier & Caisson Foundation",
    structure_type: "Pier Foundation",
    description: "Submerged concrete pile cap and bedrock mooring anchoring the south span.",
    critical_sensor: "tilt",
    max_allowable_strain: 450.0,
    max_allowable_vibration: 0.25,
    max_allowable_tilt: 0.60,
    max_allowable_crack: 0.40,
    latest_telemetry: { strain: 142.5, vibration: 0.026, tilt: 0.042, crack_width: 0.058, temperature: 22.4, humidity: 54.2 },
    ai_health: {
      anomaly_flag: false,
      anomaly_score: 0.12,
      risk_level: "LOW",
      rul_hours: 340000,
      rul_days: 14166.0,
      fatigue_index: 0.024,
      diagnosis_summary: "NORMAL: All structural parameters operate within allowable design envelope.",
      top_features: [
        { feature: "Humidity", key: "humidity", value: "54.2 %", contribution_pct: 48.0 },
        { feature: "Temperature", key: "temperature", value: "22.4 C", contribution_pct: 35.0 },
        { feature: "Strain", key: "strain", value: "142.5 ue", contribution_pct: 10.0 },
        { feature: "Vibration", key: "vibration", value: "0.03 g", contribution_pct: 4.0 },
        { feature: "Crack Width", key: "crack_width", value: "0.06 mm", contribution_pct: 3.0 }
      ]
    }
  },
  {
    id: "zone-2",
    name: "Main Roadway Deck Mid-Span",
    structure_type: "Deck Girder",
    description: "Steel-composite orthotropic deck at the maximum dynamic deflection midpoint.",
    critical_sensor: "strain",
    max_allowable_strain: 750.0,
    max_allowable_vibration: 0.35,
    max_allowable_tilt: 0.40,
    max_allowable_crack: 1.20,
    latest_telemetry: { strain: 184.2, vibration: 0.038, tilt: 0.052, crack_width: 0.118, temperature: 23.1, humidity: 51.5 },
    ai_health: {
      anomaly_flag: false,
      anomaly_score: 0.14,
      risk_level: "LOW",
      rul_hours: 338000,
      rul_days: 14083.0,
      fatigue_index: 0.032,
      diagnosis_summary: "NORMAL: All structural parameters operate within allowable design envelope.",
      top_features: [
        { feature: "Strain", key: "strain", value: "184.2 ue", contribution_pct: 42.0 },
        { feature: "Temperature", key: "temperature", value: "23.1 C", contribution_pct: 30.0 },
        { feature: "Humidity", key: "humidity", value: "51.5 %", contribution_pct: 18.0 },
        { feature: "Vibration", key: "vibration", value: "0.04 g", contribution_pct: 6.0 },
        { feature: "Crack Width", key: "crack_width", value: "0.12 mm", contribution_pct: 4.0 }
      ]
    }
  },
  {
    id: "zone-3",
    name: "North Pylon & Tower Saddle",
    structure_type: "Vertical Pylon",
    description: "Post-tensioned high-strength concrete pylon bearing primary dead and live cable loads.",
    critical_sensor: "vibration",
    max_allowable_strain: 500.0,
    max_allowable_vibration: 0.40,
    max_allowable_tilt: 0.80,
    max_allowable_crack: 0.50,
    latest_telemetry: { strain: 192.0, vibration: 0.036, tilt: 0.048, crack_width: 0.078, temperature: 22.8, humidity: 53.0 },
    ai_health: {
      anomaly_flag: false,
      anomaly_score: 0.13,
      risk_level: "LOW",
      rul_hours: 341000,
      rul_days: 14208.0,
      fatigue_index: 0.026,
      diagnosis_summary: "NORMAL: All structural parameters operate within allowable design envelope.",
      top_features: [
        { feature: "Vibration", key: "vibration", value: "0.04 g", contribution_pct: 38.0 },
        { feature: "Strain", key: "strain", value: "192.0 ue", contribution_pct: 32.0 },
        { feature: "Humidity", key: "humidity", value: "53.0 %", contribution_pct: 20.0 },
        { feature: "Temperature", key: "temperature", value: "22.8 C", contribution_pct: 10.0 }
      ]
    }
  },
  {
    id: "zone-4",
    name: "Cable-Stay Harness Stay-04",
    structure_type: "Tension Stay Cable",
    description: "High-tensile parallel strand stay cables under constant tension and harmonic wind loads.",
    critical_sensor: "strain",
    max_allowable_strain: 900.0,
    max_allowable_vibration: 0.30,
    max_allowable_tilt: 0.30,
    max_allowable_crack: 0.10,
    latest_telemetry: { strain: 282.4, vibration: 0.044, tilt: 0.028, crack_width: 0.018, temperature: 24.0, humidity: 49.8 },
    ai_health: {
      anomaly_flag: false,
      anomaly_score: 0.15,
      risk_level: "LOW",
      rul_hours: 335000,
      rul_days: 13958.0,
      fatigue_index: 0.038,
      diagnosis_summary: "NORMAL: All structural parameters operate within allowable design envelope.",
      top_features: [
        { feature: "Strain", key: "strain", value: "282.4 ue", contribution_pct: 55.0 },
        { feature: "Vibration", key: "vibration", value: "0.04 g", contribution_pct: 25.0 },
        { feature: "Temperature", key: "temperature", value: "24.0 C", contribution_pct: 12.0 },
        { feature: "Humidity", key: "humidity", value: "49.8 %", contribution_pct: 8.0 }
      ]
    }
  },
  {
    id: "zone-5",
    name: "North Abutment & Expansion Joint",
    structure_type: "Abutment Joint",
    description: "Modular elastomeric expansion joint accommodating thermal expansion and seismic movements.",
    critical_sensor: "crack_width",
    max_allowable_strain: 400.0,
    max_allowable_vibration: 0.20,
    max_allowable_tilt: 0.50,
    max_allowable_crack: 2.00,
    latest_telemetry: { strain: 162.1, vibration: 0.028, tilt: 0.065, crack_width: 0.182, temperature: 23.4, humidity: 55.2 },
    ai_health: {
      anomaly_flag: false,
      anomaly_score: 0.14,
      risk_level: "LOW",
      rul_hours: 339000,
      rul_days: 14125.0,
      fatigue_index: 0.028,
      diagnosis_summary: "NORMAL: All structural parameters operate within allowable design envelope.",
      top_features: [
        { feature: "Crack Width", key: "crack_width", value: "0.18 mm", contribution_pct: 46.0 },
        { feature: "Humidity", key: "humidity", value: "55.2 %", contribution_pct: 28.0 },
        { feature: "Temperature", key: "temperature", value: "23.4 C", contribution_pct: 16.0 },
        { feature: "Strain", key: "strain", value: "162.1 ue", contribution_pct: 10.0 }
      ]
    }
  }
];

export default function App() {
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState("zone-2");
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [wsStatus, setWsStatus] = useState("connecting");
  const [currentScenario, setCurrentScenario] = useState("NORMAL");
  const [passportZoneId, setPassportZoneId] = useState(null);
  const [viewMode, setViewMode] = useState("solid"); // solid | heatmap | wireframe

  const lastAlertFetchRef = useRef(0);

  // 1. Initial Load
  useEffect(() => {
    fetchZones().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setZones(data);
      }
    }).catch(console.error);

    fetchAlerts().then((data) => {
      if (Array.isArray(data)) setAlerts(data);
    }).catch(console.error);
  }, []);

  // 2. Poll/Stream History when selected zone changes
  useEffect(() => {
    if (!selectedZoneId) return;
    fetchZoneHistory(selectedZoneId, 40).then((hist) => {
      if (Array.isArray(hist)) setHistoryData(hist);
    }).catch(console.error);
  }, [selectedZoneId]);

  // 3. WebSocket Real-time Telemetry Stream
  useEffect(() => {
    const wsClient = createTelemetryWebSocket(
      (data) => {
        if (data.type === "TELEMETRY_UPDATE") {
          setCurrentScenario(data.scenario);

          setZones((prevZones) => {
            if (!prevZones || prevZones.length === 0) return prevZones;
            return prevZones.map((z) => {
              const updated = data.zones.find((uz) => uz.zone_id === z.id);
              if (updated) {
                return {
                  ...z,
                  latest_telemetry: updated,
                  ai_health: updated.ai,
                };
              }
              return z;
            });
          });

          // Update chart history for active selected zone
          if (selectedZoneId) {
            const activeZoneTelemetry = data.zones.find((uz) => uz.zone_id === selectedZoneId);
            if (activeZoneTelemetry) {
              setHistoryData((prev) => [
                ...prev.slice(-39),
                {
                  ...activeZoneTelemetry,
                  ...activeZoneTelemetry.ai,
                },
              ]);
            }
          }

          // Throttle alert fetching to every 5s
          const now = Date.now();
          if (now - lastAlertFetchRef.current > 5000) {
            lastAlertFetchRef.current = now;
            fetchAlerts().then((alts) => {
              if (Array.isArray(alts)) setAlerts(alts);
            }).catch(console.error);
          }
        }
      },
      (status) => {
        setWsStatus(status);
      }
    );

    return () => wsClient.close();
  }, [selectedZoneId]);

  // Handler: Change Scenario
  const handleTriggerScenario = async (scenario) => {
    try {
      await setSimulationScenario(scenario);
      setCurrentScenario(scenario);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Resolve Alert
  const handleResolveAlert = async (alertId) => {
    try {
      await resolveAlert(alertId);
      setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, resolved: 1 } : a));
    } catch (err) {
      console.error(err);
    }
  };

  // Overall Asset Health Calculation
  const systemHealth = zones.length > 0
    ? Math.round(
        zones.reduce((acc, z) => {
          const risk = z.ai_health?.risk_level;
          const score = risk === "HIGH" ? 30 : (risk === "MEDIUM" ? 70 : 100);
          return acc + score;
        }, 0) / zones.length
      )
    : 100;

  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;
  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[1] || INITIAL_ZONES[1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation & System Health Header */}
      <Header
        systemHealth={systemHealth}
        activeAlertsCount={activeAlertsCount}
        wsStatus={wsStatus}
        currentScenario={currentScenario}
      />

      {/* Main Command Center Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Hackathon Simulation Controls */}
        <ScenarioControls
          currentScenario={currentScenario}
          onTriggerScenario={handleTriggerScenario}
        />

        {/* 5 Monitored Structural Zone Cards */}
        <ZoneCards
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
        />

        {/* 3D Digital Twin + AI Inspector Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: 3D Twin Viewer (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
            
            {/* View Mode Bar */}
            <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-slate-200">3D DIGITAL TWIN VIEWER</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewMode("solid")}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    viewMode === "solid" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Realistic 3D
                </button>
                <button
                  onClick={() => setViewMode("heatmap")}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    viewMode === "heatmap" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Stress Heatmap
                </button>
                <button
                  onClick={() => setViewMode("wireframe")}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    viewMode === "wireframe" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  X-Ray Wireframe
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="h-[440px]">
              <DigitalTwin3D
                zones={zones}
                selectedZoneId={selectedZoneId}
                onSelectZone={setSelectedZoneId}
                viewMode={viewMode}
              />
            </div>
          </div>

          {/* Right Column: AI Detail & Explainability Panel (5 cols) */}
          <div className="lg:col-span-5">
            <ZoneDetailPanel
              selectedZone={selectedZone}
              onOpenPassport={setPassportZoneId}
            />
          </div>

        </div>

        {/* Bottom Split: Live Sensor Charts & Alerts Protocol */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <LiveTelemetryCharts
              historyData={historyData}
              selectedZoneId={selectedZoneId}
            />
          </div>
          <div className="lg:col-span-5">
            <AlertsPanel
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
            />
          </div>
        </div>

      </main>

      {/* Digital Material Passport Modal */}
      {passportZoneId && (
        <DigitalMaterialPassport
          zoneId={passportZoneId}
          onClose={() => setPassportZoneId(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs font-mono text-slate-500">
        Smart Infrastructure Digital Twin • AI SHM Prototype • Built for Hackathon Pair Programming
      </footer>

    </div>
  );
}
