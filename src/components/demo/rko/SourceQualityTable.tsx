"use client";

import { memo } from "react";
import { sourceLabels } from "@/lib/rko/constants";
import type { LeadSource, TrafficSourceQuality } from "@/lib/rko/types";
import { cn } from "@/lib/utils";

export const SourceQualityTable = memo(function SourceQualityTable({ rows, selected, onSelect }: { rows: TrafficSourceQuality[]; selected?: LeadSource; onSelect: (source: LeadSource) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] backdrop-blur-xl">
      <div className="overflow-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[var(--surface-2)]/95 text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr>
              {["source", "leads", "A/B %", "duplicate %", "risk %", "no intent %", "avg score", "recommendation"].map((head) => (
                <th key={head} className="border-b border-white/10 px-3 py-3 font-medium">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.source}
                onClick={() => onSelect(row.source)}
                className={cn("cursor-pointer border-b border-white/[0.07] text-slate-200 transition hover:bg-signal/8", selected === row.source && "bg-signal/10")}
              >
                <td className="px-3 py-3 font-semibold text-white">{sourceLabels[row.source]}</td>
                <td className="px-3 py-3">{row.leads}</td>
                <td className="px-3 py-3 text-emerald-100"><QualityValue value={row.abPercent} tone="green" /></td>
                <td className="px-3 py-3"><QualityValue value={row.duplicatePercent} tone="yellow" /></td>
                <td className="px-3 py-3 text-rose-100"><QualityValue value={row.riskPercent} tone="red" /></td>
                <td className="px-3 py-3"><QualityValue value={row.noIntentPercent} tone="violet" /></td>
                <td className="px-3 py-3 font-semibold text-white">{row.avgScore}</td>
                <td className="px-3 py-3 text-signal-bright">{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

function QualityValue({ value, tone }: { value: number; tone: "green" | "yellow" | "red" | "violet" }) {
  const color = {
    green: "bg-emerald-300/80",
    yellow: "bg-yellow-300/80",
    red: "bg-rose-300/80",
    violet: "bg-signal-strong/80",
  }[tone];

  return (
    <span className="grid min-w-24 gap-1">
      <span>{value}%</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className={`quality-bar-fill block h-full origin-left rounded-full ${color}`} style={{ transform: `scaleX(${value / 100})` }} />
      </span>
    </span>
  );
}
