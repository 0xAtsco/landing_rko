"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { MessageCircle, Send, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMockLeadInsight } from "@/lib/rko/mock-ai";
import { addManagerAction } from "@/lib/rko/store";
import type { Lead, LeadAction, LeadActionType } from "@/lib/rko/types";
import { LeadClassBadge } from "./LeadClassBadge";
import { RiskFlags } from "./RiskFlags";

const actions: Array<{ label: string; type: LeadActionType }> = [
  { label: "Передать менеджеру", type: "send_to_manager" },
  { label: "Дожать", type: "follow_up" },
  { label: "В прогрев", type: "nurture" },
  { label: "Мусор/дубль", type: "junk_or_duplicate" },
  { label: "Закрыт", type: "closed" },
];

export const LeadDetailPanel = memo(function LeadDetailPanel({ lead, onChange }: { lead?: Lead; onChange: (leads: Lead[]) => void }) {
  const insight = useMemo(() => lead ? buildMockLeadInsight(lead) : null, [lead]);
  const [history, setHistory] = useState<LeadAction[]>([]);

  useEffect(() => {
    if (!lead) {
      setHistory([]);
      return;
    }
    let active = true;
    fetch(`/api/rko/leads/${encodeURIComponent(lead.id)}`)
      .then((response) => response.ok ? response.json() : undefined)
      .then((data: { actions?: LeadAction[] } | undefined) => {
        if (active) setHistory(data?.actions ?? []);
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
  }, [lead]);

  if (!lead || !insight) {
    return (
      <aside className="rounded-lg border border-white/10 bg-white/[0.045] p-5 text-slate-300 backdrop-blur-xl">
        Выберите лида в таблице, чтобы увидеть выжимку, raw dialog и подсказки менеджеру.
      </aside>
    );
  }

  return (
    <aside className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal/75">{lead.id}</p>
          <h3 className="mt-1 text-xl font-semibold text-white">{lead.businessType || "Лид без ниши"}</h3>
        </div>
        <LeadClassBadge value={lead.leadClass} />
      </div>

      <section className="rounded-lg border border-signal/15 bg-signal/8 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-signal-bright"><Sparkles className="size-4" /> Выжимка менеджеру</div>
        <p className="text-sm leading-6 text-slate-200">{lead.managerSummary}</p>
      </section>

      <section className="grid gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100"><ShieldAlert className="size-4 text-rose-200" /> Score explanation</div>
        <p className="text-sm leading-6 text-slate-300">{insight.scoreExplanation}</p>
        <RiskFlags flags={lead.riskFlags} />
      </section>

      <section className="grid gap-2 rounded-lg border border-white/10 bg-black/15 p-3">
        <div className="text-sm font-semibold text-white">Route и next action</div>
        <p className="text-sm text-signal-bright">{lead.recommendedRoute}</p>
        <p className="text-sm leading-6 text-slate-300">{lead.nextAction}</p>
      </section>

      <section className="grid gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><MessageCircle className="size-4 text-signal" /> Raw dialog</div>
        <div className="max-h-48 space-y-2 overflow-auto pr-1">
          {lead.rawDialog.map((message, index) => (
            <div key={`${message.createdAt}-${index}`} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-5 text-slate-300">
              <span className="font-semibold text-signal-bright">{message.role === "assistant" ? "AI" : "lead"}: </span>
              {message.content}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-2 rounded-lg border border-signal/15 bg-signal/8 p-3">
        <div className="text-sm font-semibold text-signal-bright">Manager copilot</div>
        <p className="text-sm text-slate-300"><span className="text-slate-100">Что сказать:</span> {insight.copilotSay}</p>
        <p className="text-sm text-slate-300"><span className="text-slate-100">Что уточнить:</span> {insight.copilotAsk}</p>
        <p className="text-sm text-slate-300"><span className="text-slate-100">Следующий шаг:</span> {insight.copilotStep}</p>
        <p className="mt-2 rounded-md bg-black/20 p-3 text-sm leading-6 text-slate-200">{insight.suggestedMessage}</p>
      </section>

      <section className="grid gap-2 rounded-lg border border-white/10 bg-black/15 p-3">
        <div className="text-sm font-semibold text-white">История действий</div>
        {history.length > 0 ? (
          <div className="grid gap-2">
            {history.slice(0, 5).map((action) => (
              <div key={action.id} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-5 text-slate-300">
                <span className="text-signal-bright">{action.label}</span>
                <span className="text-slate-500"> · </span>
                {new Date(action.createdAt).toLocaleString("ru-RU")}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Пока действий нет.</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="outline"
            className="border-white/10 bg-white/[0.055] text-slate-100 hover:bg-signal/10"
            data-analytics="demo_lead_action"
            onClick={async () => onChange(await addManagerAction(lead.id, action.type))}
          >
            <Send className="size-4" />
            {action.label}
          </Button>
        ))}
      </div>
    </aside>
  );
});
