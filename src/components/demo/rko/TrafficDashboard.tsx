"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Copy, Download, Gauge, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sourceLabels } from "@/lib/rko/constants";
import type { LeadSource, TrafficSourceQuality } from "@/lib/rko/types";
import { MetricCard } from "./MetricCard";
import { SourceQualityTable } from "./SourceQualityTable";

type TrafficApiResponse = {
  rows: TrafficSourceQuality[];
  summary: {
    total: number;
    abPercent: number;
    duplicatePercent: number;
    highRiskPercent: number;
    noIntentPercent: number;
    bestSource?: LeadSource;
    worstSource?: LeadSource;
  };
};

const emptySummary: TrafficApiResponse["summary"] = {
  total: 0,
  abPercent: 0,
  duplicatePercent: 0,
  highRiskPercent: 0,
  noIntentPercent: 0,
};

export function TrafficDashboard() {
  const [report, setReport] = useState<TrafficApiResponse>({ rows: [], summary: emptySummary });
  const rows = report.rows;
  const summary = report.summary;
  const [selectedSource, setSelectedSource] = useState<LeadSource>("warm_telegram");
  const selected = useMemo(() => rows.find((row) => row.source === selectedSource) ?? rows[0], [rows, selectedSource]);
  const selectSource = useCallback((source: LeadSource) => setSelectedSource(source), []);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch("/api/rko/traffic");
      if (!response.ok) return;
      const data = await response.json() as TrafficApiResponse;
      if (active) setReport(data);
    }
    void load();
    const interval = window.setInterval(() => void load(), 6000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-8 grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="Total leads" value={summary.total} icon={BarChart3} />
        <MetricCard label="A/B lead %" value={`${summary.abPercent}%`} icon={TrendingUp} tone="green" />
        <MetricCard label="Duplicate rate" value={`${summary.duplicatePercent}%`} icon={Copy} tone="yellow" />
        <MetricCard label="High risk rate" value={`${summary.highRiskPercent}%`} icon={AlertTriangle} tone="red" />
        <MetricCard label="No reply / low intent" value={`${summary.noIntentPercent}%`} icon={Gauge} tone="violet" />
        <MetricCard label="Best / worst" value={`${summary.bestSource ? sourceLabels[summary.bestSource] : "—"} / ${summary.worstSource ? sourceLabels[summary.worstSource] : "—"}`} icon={ShieldCheck} tone="cyan" />
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          <div className="flex justify-end">
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-signal/10">
              <a href="/api/rko/export" download data-analytics="demo_open_traffic">
                <Download className="size-4" />
                Скачать отчёт
              </a>
            </Button>
          </div>
          <SourceQualityTable rows={rows} selected={selectedSource} onSelect={selectSource} />
        </div>
        {selected ? (
          <aside className="grid content-start gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal/75">source detail</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{sourceLabels[selected.source]}</h3>
            </div>
            <p className="text-sm leading-6 text-slate-300">{selected.explanation}</p>
            <section className="rounded-lg border border-signal/15 bg-signal/8 p-3">
              <h4 className="text-sm font-semibold text-signal-bright">Паттерны</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {selected.patterns.map((pattern) => <li key={pattern}>{pattern}</li>)}
              </ul>
            </section>
            <section className="rounded-lg border border-signal/15 bg-signal/8 p-3">
              <h4 className="text-sm font-semibold text-signal-bright">Что улучшить</h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {selected.improvements.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">recommendation</p>
              <p className="mt-2 text-lg font-semibold text-white">{selected.recommendation}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Для live demo сравните warm_telegram и bad_motiv: видно, где качество выше, а где объём превращается в ручную нагрузку.</p>
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
