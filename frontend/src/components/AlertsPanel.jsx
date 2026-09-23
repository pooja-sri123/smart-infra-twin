import React from "react";
import { AlertTriangle, CheckCircle, Wrench, ShieldAlert } from "lucide-react";

export default function AlertsPanel({ alerts, onResolveAlert }) {
  const unresolved = (alerts || []).filter((a) => !a.resolved);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-800 shadow-xl space-y-3 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${unresolved.length > 0 ? "text-rose-400" : "text-emerald-400"}`} />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 m-0">
            STRUCTURAL ALERTS & MAINTENANCE PROTOCOLS ({unresolved.length})
          </h2>
        </div>
      </div>

      {unresolved.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-emerald-400 flex flex-col items-center justify-center gap-1.5">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>No critical structural alerts. System operating within design tolerances.</span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {unresolved.map((alt) => {
            const isHigh = alt.severity === "HIGH";
            return (
              <div
                key={alt.id}
                className={`p-3 rounded-lg border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isHigh
                    ? "bg-rose-950/40 border-rose-500/60 text-rose-200"
                    : "bg-amber-950/30 border-amber-500/50 text-amber-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isHigh ? "bg-rose-500/30 text-rose-300" : "bg-amber-500/30 text-amber-300"
                    }`}>
                      {alt.severity}
                    </span>
                    <span className="font-bold text-white">{alt.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 m-0">{alt.description}</p>
                  <p className="text-[10px] text-blue-300 m-0 flex items-center gap-1 mt-0.5">
                    <Wrench className="w-3 h-3" /> Recommended Action: {alt.recommendation}
                  </p>
                </div>

                <button
                  onClick={() => onResolveAlert(alt.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] rounded-md transition cursor-pointer flex-shrink-0 self-start sm:self-center"
                >
                  Acknowledge ✓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
