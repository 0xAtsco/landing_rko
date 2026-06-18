"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, Gauge, ListChecks, Radio, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replaceWithSeed, useRkoLeads } from "@/lib/rko/store";
import type { Lead } from "@/lib/rko/types";
import { MetricCard } from "./MetricCard";
import { LeadTable } from "./LeadTable";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { LeadClassBadge } from "./LeadClassBadge";
import { sourceLabels } from "@/lib/rko/constants";

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

export function LeadDashboard() {
  const leads = useRkoLeads();
  const [selectedId, setSelectedId] = useState<string>();
  const [toastLead, setToastLead] = useState<Lead | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const lastFirstRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const nextFirst = leads[0]?.id;
    if (!nextFirst) return;
    if (!lastFirstRef.current) {
      lastFirstRef.current = nextFirst;
      return;
    }
    if (nextFirst !== lastFirstRef.current) {
      setToastLead(leads[0]);
      lastFirstRef.current = nextFirst;
    }
  }, [leads]);

  useEffect(() => {
    if (!toastLead) return;
    const timer = window.setTimeout(() => setToastLead(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toastLead]);

  const selected = useMemo(() => leads.find((lead) => lead.id === selectedId) ?? leads[0], [leads, selectedId]);
  const stats = useMemo(() => {
    let ab = 0;
    let today = 0;
    let highRisk = 0;
    let waiting = 0;
    let scoreSum = 0;
    for (const lead of leads) {
      if (lead.leadClass === "A" || lead.leadClass === "B") ab += 1;
      if (isToday(lead.createdAt)) today += 1;
      if (lead.leadClass === "F" || lead.riskFlags.length >= 2) highRisk += 1;
      if (lead.status === "new" || lead.status === "qualified") waiting += 1;
      scoreSum += lead.score;
    }
    return {
      total: leads.length,
      ab,
      today,
      highRisk,
      waiting,
      avg: leads.length ? Math.round(scoreSum / leads.length) : 0,
    };
  }, [leads]);
  const recentLeads = useMemo(() => leads.slice(0, 4), [leads]);
  const selectLead = useCallback((lead: Lead) => setSelectedId(lead.id), []);
  const generateLeads = useCallback(() => {
    const count = 80 + Math.floor(Math.random() * 41);
    window.setTimeout(async () => {
      const next = await replaceWithSeed(count);
      startTransition(() => setSelectedId(next[0]?.id));
    }, 0);
  }, []);

  return (
    <div className="mt-8 grid gap-5">
      {toastLead ? (
        <div className="new-lead-toast fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-signal/30 bg-[var(--surface-2)]/95 p-4 text-sm text-white shadow-[0_22px_80px_rgb(var(--signal-rgb)/0.22)] backdrop-blur-xl">
          <p className="font-semibold text-signal-bright">Новый {toastLead.leadClass}-лид</p>
          <p className="mt-1 text-slate-300">{toastLead.businessType || "ниша не указана"} / {toastLead.needs.join(" + ") || "потребность не ясна"}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard label="Всего лидов" value={stats.total} icon={Users} />
        <MetricCard label="A/B лидов" value={stats.ab} icon={Sparkles} tone="green" />
        <MetricCard label="Новые сегодня" value={stats.today} icon={Radio} tone="cyan" />
        <MetricCard label="High risk" value={stats.highRisk} icon={AlertTriangle} tone="red" />
        <MetricCard label="Ждут менеджера" value={stats.waiting} icon={ListChecks} tone="violet" />
        <MetricCard label="Средний score" value={stats.avg} icon={Gauge} tone="yellow" />
      </div>

      <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal/75">realtime feed</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Последние лиды</h3>
          </div>
          <Button
            type="button"
            className="bg-signal text-slate-950 hover:bg-signal-bright"
            data-analytics="demo_generate_leads"
            disabled={isGenerating}
            onClick={generateLeads}
          >
            {isGenerating ? "Генерируем..." : "Generate demo leads"}
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          {recentLeads.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => selectLead(lead)}
              className={`rounded-lg border border-white/10 bg-black/18 p-3 text-left transition hover:bg-signal/8 ${toastLead?.id === lead.id ? "new-lead-card" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-signal-bright">{lead.id}</span>
                <LeadClassBadge value={lead.leadClass} pulse={toastLead?.id === lead.id} />
              </div>
              <p className="mt-2 truncate text-sm text-white">{lead.businessType || "пустая заявка"}</p>
              <p className="mt-1 text-xs text-slate-400">{sourceLabels[lead.source]}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LeadTable leads={leads} selectedId={selected?.id} newLeadId={toastLead?.id} onSelect={selectLead} />
        <LeadDetailPanel lead={selected} onChange={(next) => {
          setSelectedId(next.find((lead) => lead.id === selected?.id)?.id);
        }} />
      </section>
    </div>
  );
}
