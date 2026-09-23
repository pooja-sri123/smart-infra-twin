import React, { useEffect, useState } from "react";
import { fetchMaterialPassport } from "../services/api";
import { X, ShieldAlert, CheckCircle2, Cpu, FileCheck, Layers, Factory } from "lucide-react";

export default function DigitalMaterialPassport({ zoneId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zoneId) return;
    setLoading(true);
    fetchMaterialPassport(zoneId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [zoneId]);

  if (!zoneId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-left text-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-blue-400">{zoneId}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  PASSPORT VERIFIED
                </span>
              </div>
              <h2 className="text-lg font-bold text-white m-0">Digital Material Passport</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-slate-400">Loading passport ledger...</div>
        ) : !data ? (
          <div className="py-12 text-center text-xs font-mono text-rose-400">Passport record not found.</div>
        ) : (
          <>
            {/* Component & Material Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase">Component Name</span>
                <span className="font-bold text-white">{data.passport.component_name}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase">Material Type</span>
                <span className="font-bold text-slate-200">{data.passport.material_type}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase">Standard Grade</span>
                <span className="font-bold text-blue-300">{data.passport.standard_grade}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase">Yield Strength</span>
                <span className="font-bold text-slate-200">{data.passport.yield_strength_mpa} MPa</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase">Modulus of Elasticity</span>
                <span className="font-bold text-slate-200">{data.passport.elastic_modulus_gpa} GPa</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block uppercase">Carbon Footprint</span>
                <span className="font-bold text-emerald-400">{data.passport.carbon_footprint_kg.toLocaleString()} kg CO2</span>
              </div>
            </div>

            {/* Design Spec vs. Measured Live State Comparison */}
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Design Envelope vs. Measured Real-Time Behavior
              </h3>

              <div className="space-y-3">
                {/* Strain comparison */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Strain Elastic Margin</span>
                    <span className="text-slate-400">
                      Live: <span className="text-white font-bold">{data.live_metrics.current_strain_ue} ue</span> / Design Max: {data.passport.design_strain_limit_ue} ue
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        data.safety_margins.strain_safety_margin_pct < 20 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, (data.live_metrics.current_strain_ue / data.passport.design_strain_limit_ue) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                    Safety Margin Remaining: {data.safety_margins.strain_safety_margin_pct}%
                  </span>
                </div>

                {/* Crack comparison */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Crack Width Limit</span>
                    <span className="text-slate-400">
                      Live: <span className="text-white font-bold">{data.live_metrics.current_crack_mm} mm</span> / Design Max: {data.passport.design_crack_limit_mm} mm
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        data.safety_margins.crack_safety_margin_pct < 20 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, (data.live_metrics.current_crack_mm / data.passport.design_crack_limit_mm) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                    Safety Margin Remaining: {data.safety_margins.crack_safety_margin_pct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs rounded-xl transition cursor-pointer"
              >
                Close Passport
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
