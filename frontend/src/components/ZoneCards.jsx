import React from "react";
import { Activity, AlertCircle, ShieldAlert, Cpu, Gauge } from "lucide-react";

export default function ZoneCards({ zones, selectedZoneId, onSelectZone }) {
  const getRiskBadge = (risk) => {
    switch (risk) {
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">CRITICAL</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">ELEVATED</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">NOMINAL</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {zones.map((zone) => {
        const isSelected = selectedZoneId === zone.id;
        const risk = zone.ai_health?.risk_level || "LOW";
        const isHigh = risk === "HIGH";
        const isMed = risk === "MEDIUM";
        const tel = zone.latest_telemetry || {};

        return (
          <div
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between ${
              isSelected
                ? "bg-blue-950/60 border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-400"
                : isHigh
                ? "bg-rose-950/30 border-rose-500/50 hover:bg-rose-900/40"
                : isMed
                ? "bg-amber-950/20 border-amber-500/40 hover:bg-amber-900/30"
                : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">{zone.id}</span>
                {getRiskBadge(risk)}
              </div>
              <h3 className="text-xs font-bold text-slate-100 line-clamp-1 m-0">{zone.name}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{zone.structure_type}</p>
            </div>

            {/* Micro Sensor Telemetry Pills */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[11px] font-mono">
              <div className="text-slate-400">
                Strain: <span className={`font-bold ${tel.strain > 600 ? "text-rose-400" : "text-slate-200"}`}>{tel.strain ? `${tel.strain} ue` : "--"}</span>
              </div>
              <div className="text-slate-400">
                Crack: <span className={`font-bold ${tel.crack_width > 1.0 ? "text-rose-400" : "text-slate-200"}`}>{tel.crack_width ? `${tel.crack_width} mm` : "--"}</span>
              </div>
              <div className="text-slate-400">
                Vib: <span className={`font-bold ${tel.vibration > 0.25 ? "text-amber-400" : "text-slate-200"}`}>{tel.vibration ? `${tel.vibration} g` : "--"}</span>
              </div>
              <div className="text-slate-400">
                RUL: <span className={`font-bold ${zone.ai_health?.rul_days < 30 ? "text-rose-400" : "text-emerald-400"}`}>
                  {zone.ai_health?.rul_days ? `${zone.ai_health.rul_days}d` : "--"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
