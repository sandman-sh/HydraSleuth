"use client";

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceArea } from "recharts";
import type { InvestigationReport } from "@hydrasleuth/shared";

const severityMap = {
  low: 1,
  medium: 2,
  high: 3,
};

const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#ef4444", "#f59e0b"];

export function CaseCharts({ report }: { report: InvestigationReport }) {
  // Extract all signals across all contributions
  const bubbleData = report.contributions.flatMap((contrib, index) => 
    contrib.signals.map(signal => ({
      agent: contrib.agent.replace("Agent", ""),
      agentIndex: index,
      severity: severityMap[signal.severity as keyof typeof severityMap] || 1,
      severityLabel: signal.severity,
      riskDelta: contrib.suggestedRiskDelta * 20, // Scale for bubble size
      label: signal.label,
      evidence: signal.evidence,
      color: colors[index % colors.length]
    }))
  );

  return (
    <div className="w-full h-[400px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
          <XAxis 
            type="category" 
            dataKey="agent" 
            name="Agent" 
            stroke="#ffffff40" 
            tick={{ fill: '#ffffff80', fontSize: 12 }} 
            tickLine={false}
            axisLine={{ stroke: '#ffffff20' }}
          />
          <YAxis 
            type="number" 
            dataKey="severity" 
            name="Severity" 
            domain={[0, 4]} 
            ticks={[1, 2, 3]} 
            tickFormatter={(val) => val === 1 ? "Low" : val === 2 ? "Medium" : val === 3 ? "High" : ""}
            stroke="#ffffff40" 
            tick={{ fill: '#ffffff80', fontSize: 12 }} 
            tickLine={false}
            axisLine={{ stroke: '#ffffff20' }}
          />
          <ZAxis type="number" dataKey="riskDelta" range={[200, 1500]} name="Impact" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: '#ffffff20' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0 && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-[#111] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl max-w-[280px]">
                    <p className="text-[10px] uppercase font-bold text-white/50 mb-1">{data.agent}</p>
                    <p className="text-white font-bold text-sm mb-2">{data.label}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 border border-white/5 text-white/80">
                        {data.severityLabel}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{data.evidence}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceArea y1={2.5} y2={4} fill="#ef4444" fillOpacity={0.03} />
          <Scatter name="Signals" data={bubbleData} animationDuration={1500}>
            {bubbleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
