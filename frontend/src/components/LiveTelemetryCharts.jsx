import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { TrendingUp, Activity } from "lucide-react";

export default function LiveTelemetryCharts({ historyData, selectedZoneId }) {
  const [activeMetric, setActiveMetric] = useState("strain");

  const metricConfigs = {
    strain: {
      name: "Strain (Microstrain)",
      unit: "ue",
      dataKey: "strain",
      stroke: "#38bdf8",
      limit: 750,
      limitLabel: "Critical Limit (750 ue)",
    },
    crack_width: {
      name: "Crack Width (mm)",
      unit: "mm",
      dataKey: "crack_width",
      stroke: "#f43f5e",
      limit: 1.50,
      limitLabel: "Fracture Limit (1.50 mm)",
    },
    vibration: {
      name: "Vibration Acceleration (g)",
      unit: "g",
      dataKey: "vibration",
      stroke: "#f59e0b",
      limit: 0.35,
      limitLabel: "Harmonic Limit (0.35 g)",
    },
    tilt: {
      name: "Inclination Tilt (deg)",
      unit: "deg",
      dataKey: "tilt",
      stroke: "#a855f7",
      limit: 0.60,
      limitLabel: "Tilt Limit (0.60 deg)",
    },
  };

  const currentCfg = metricConfigs[activeMetric];

  const chartData = (historyData || []).map((item, idx) => ({
    ...item,
    time: item.timestamp ? item.timestamp.split("T")[1]?.substring(0, 8) : `#${idx}`,
  }));

  return (
    <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-800 shadow-xl space-y-4 text-left">
      
      {/* Metric Selector Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 m-0">
            TIME-SERIES TELEMETRY & DESIGN LIMIT BREACHES
          </h2>
        </div>

        {/* Metric buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {Object.entries(metricConfigs).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeMetric === key
                  ? "bg-blue-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {cfg.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
            Streaming sensor telemetry buffer...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              />
              <ReferenceLine
                y={currentCfg.limit}
                label={{ value: currentCfg.limitLabel, fill: "#ef4444", fontSize: 10, position: "top" }}
                stroke="#ef4444"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey={currentCfg.dataKey}
                name={currentCfg.name}
                stroke={currentCfg.stroke}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
