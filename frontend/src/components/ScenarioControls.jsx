import React from "react";
import { Play, Flame, Activity, Zap, Compass, AlertOctagon } from "lucide-react";

export default function ScenarioControls({ currentScenario, onTriggerScenario }) {
  const scenarios = [
    {
      id: "NORMAL",
      label: "Normal State",
      desc: "Baseline ambient traffic & thermal drift",
      icon: Activity,
      color: "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40",
      activeColor: "border-emerald-400 bg-emerald-600/30 text-emerald-200 shadow-lg shadow-emerald-900/50",
    },
    {
      id: "TRAFFIC_SURGE",
      label: "Traffic Overload",
      desc: "Zone 2 Deck Strain & Harmonic Resonance",
      icon: Zap,
      color: "border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40",
      activeColor: "border-amber-400 bg-amber-600/30 text-amber-200 shadow-lg shadow-amber-900/50",
    },
    {
      id: "SEISMIC_EVENT",
      label: "Seismic Motion",
      desc: "Zone 1 & 3 Foundation Tilt & High Vibration",
      icon: Compass,
      color: "border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40",
      activeColor: "border-rose-400 bg-rose-600/30 text-rose-200 shadow-lg shadow-rose-900/50",
    },
    {
      id: "CRACK_PROPAGATION",
      label: "Crack Fracture",
      desc: "Zone 5 Expansion Joint Critical Growth (>1.8mm)",
      icon: AlertOctagon,
      color: "border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40",
      activeColor: "border-purple-400 bg-purple-600/30 text-purple-200 shadow-lg shadow-purple-900/50",
    },
    {
      id: "CABLE_FATIGUE",
      label: "Cable Fatigue",
      desc: "Zone 4 High-Tensile Stay Overstrain (>850ue)",
      icon: Flame,
      color: "border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40",
      activeColor: "border-cyan-400 bg-cyan-600/30 text-cyan-200 shadow-lg shadow-cyan-900/50",
    }
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 m-0">
            HACKATHON SIMULATION & INJECTION CONTROLS
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Click any scenario to inject live physical anomalies for AI detection
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = currentScenario === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onTriggerScenario(sc.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                isActive ? sc.activeColor : sc.color
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded-md bg-black/30">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-mono uppercase">{sc.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-current animate-ping" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{sc.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
