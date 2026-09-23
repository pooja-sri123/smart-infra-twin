import React from "react";
import { BrainCircuit, AlertTriangle, ShieldCheck, Clock, Layers, HelpCircle, FileText } from "lucide-react";

export default function ZoneDetailPanel({ selectedZone, onOpenPassport }) {
  if (!selectedZone) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[300px]">
        <BrainCircuit className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-300 m-0">No Zone Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Click any zone card above or click directly on the 3D digital twin to inspect AI predictions and feature attributions.
        </p>
      </div>
    );
  }

  const ai = selectedZone.ai_health || {};
  const isHigh = ai.risk_level === "HIGH";
  const isMed = ai.risk_level === "MEDIUM";
  const topFeatures = ai.top_features || [];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-800 shadow-xl space-y-4 text-left">
      
      {/* Title & Passport Action */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-blue-400">{selectedZone.id}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{selectedZone.structure_type}</span>
          </div>
          <h2 className="text-base font-bold text-white m-0 mt-0.5">{selectedZone.name}</h2>
        </div>
        <button
          onClick={() => onOpenPassport(selectedZone.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-mono font-medium transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          Material Passport
        </button>
      </div>

      {/* AI Diagnostic Alert Banner */}
      <div className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
        isHigh
          ? "bg-rose-950/40 border-rose-500/60 text-rose-200"
          : isMed
          ? "bg-amber-950/40 border-amber-500/60 text-amber-200"
          : "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
      }`}>
        <BrainCircuit className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold uppercase tracking-wider block mb-0.5">AI SHM Diagnostic Engine</span>
          <p className="m-0 leading-relaxed">{ai.diagnosis_summary || "Operating within healthy physical envelope."}</p>
        </div>
      </div>

      {/* Multi-Model Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        
        {/* 1. Isolation Forest Score */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">ISOLATION FOREST</span>
          <span className={`text-base font-black ${ai.anomaly_flag ? "text-rose-400" : "text-emerald-400"}`}>
            {ai.anomaly_score !== undefined ? (ai.anomaly_score * 100).toFixed(1) : "12.0"}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            {ai.anomaly_flag ? "Anomaly Flagged" : "Normal Stream"}
          </span>
        </div>

        {/* 2. Risk Classification */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">RISK CLASSIFIER</span>
          <span className={`text-base font-black ${isHigh ? "text-rose-400" : isMed ? "text-amber-400" : "text-emerald-400"}`}>
            {ai.risk_level || "LOW"}
          </span>
          <span className="text-[10px] text-slate-500 block">Random Forest</span>
        </div>

        {/* 3. Remaining Useful Life (RUL) */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">PROJECTED RUL</span>
          <span className={`text-base font-black ${ai.rul_days < 100 ? "text-rose-400" : "text-slate-100"}`}>
            {ai.rul_days ? `${ai.rul_days} Days` : "14,083 Days"}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {ai.rul_hours ? `(${ai.rul_hours} hrs)` : "(338,000 hrs)"}
          </span>
        </div>

        {/* 4. Cumulative Fatigue Index */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">FATIGUE INDEX</span>
          <span className={`text-base font-black ${ai.fatigue_index > 0.6 ? "text-rose-400" : "text-slate-100"}`}>
            {ai.fatigue_index !== undefined ? (ai.fatigue_index * 100).toFixed(1) : "3.2"}%
          </span>
          <span className="text-[10px] text-slate-500 block">Damage Accum.</span>
        </div>

      </div>

      {/* Feature Attribution Explainability Breakdown */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 m-0">
              AI Explainability & Feature Drivers (SHAP-Attribution)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Relative Weight Share</span>
        </div>

        <div className="space-y-2">
          {topFeatures.map((feat) => (
            <div key={feat.key || feat.feature} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-300 font-semibold">{feat.feature}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{feat.value}</span>
                  <span className={`font-bold ${feat.contribution_pct > 30 ? "text-rose-400" : "text-blue-400"}`}>
                    {feat.contribution_pct}%
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    feat.contribution_pct > 40
                      ? "bg-rose-500"
                      : feat.contribution_pct > 20
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, feat.contribution_pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
