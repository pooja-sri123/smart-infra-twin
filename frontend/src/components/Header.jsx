import React from "react";
import { Activity, ShieldCheck, AlertTriangle, Radio, RefreshCw } from "lucide-react";

export default function Header({ systemHealth, activeAlertsCount, wsStatus, currentScenario }) {
  const isHealthy = systemHealth >= 80;
  const isWarning = systemHealth >= 50 && systemHealth < 80;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0">
                SMART INFRASTRUCTURE DIGITAL TWIN
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                AI SHM
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">Autonomous Structural Health & Predictive Degradation Intelligence</p>
          </div>
        </div>

        {/* Live Metrics Header Gauges */}
        <div className="flex items-center gap-4 text-sm">
          
          {/* Overall Health Index */}
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${isHealthy ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400"}`} />
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block leading-tight">Asset Health Index</span>
              <span className={`text-base font-black font-mono ${isHealthy ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400"}`}>
                {systemHealth}%
              </span>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${activeAlertsCount > 0 ? "text-rose-400 animate-bounce" : "text-slate-500"}`} />
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block leading-tight">Active Anomalies</span>
              <span className={`text-base font-black font-mono ${activeAlertsCount > 0 ? "text-rose-400" : "text-slate-300"}`}>
                {activeAlertsCount}
              </span>
            </div>
          </div>

          {/* Telemetry WebSocket Stream Status */}
          <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Radio className={`w-4 h-4 ${wsStatus === "connected" ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase text-slate-400 block leading-tight">IoT Stream</span>
              <span className="text-xs font-mono font-semibold text-slate-200 capitalize">
                {wsStatus === "connected" ? "Live (2.0s)" : wsStatus}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
