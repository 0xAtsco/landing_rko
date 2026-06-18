"use client";

import { CheckCircle2, Circle, Database, Loader2 } from "lucide-react";
import { entityLabels, needLabels, urgencyLabels } from "@/lib/rko/constants";
import type { Lead, LeadDraft, LeadInsight, ScoreResult } from "@/lib/rko/types";
import { cn } from "@/lib/utils";
import { LeadClassBadge } from "./LeadClassBadge";
import { RiskFlags } from "./RiskFlags";

export type TheaterStepId = "received" | "extracted" | "needs" | "scored" | "risk" | "summary" | "created";

export type TheaterStepState = "idle" | "active" | "done";

export type TheaterStep = {
  id: TheaterStepId;
  label: string;
  state: TheaterStepState;
};

function valueOrEmpty(value?: string) {
  return value?.trim() || "—";
}

function StepIcon({ state }: { state: TheaterStepState }) {
  if (state === "done") return <CheckCircle2 className="size-4 text-emerald-300" />;
  if (state === "active") return <Loader2 className="size-4 animate-spin text-signal" />;
  return <Circle className="size-4 text-slate-500" />;
}

export function ProcessingTheater({
  draft,
  score,
  insight,
  missingFields,
  steps,
  createdLead,
  compact = false,
}: {
  draft: LeadDraft;
  score: ScoreResult;
  insight: LeadInsight | null;
  missingFields: string[];
  steps: TheaterStep[];
  createdLead?: Lead | null;
  compact?: boolean;
}) {
  const needs = draft.needs.map((need) => needLabels[need]).filter(Boolean).join(", ") || "—";
  const contact = draft.telegram || draft.phone || "—";

  return (
    <aside className="grid gap-4">
      <section className="rounded-lg border border-signal/20 bg-slate-950/52 p-4 shadow-[0_24px_90px_rgb(var(--signal-rgb)/0.13)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal/75">processing theater</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Как AI превращает диалог в CRM</h3>
          </div>
          <div className="rounded-md border border-signal/20 bg-signal/10 p-2 text-signal-bright">
            <Database className="size-5" />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition",
                step.state === "done" && "border-emerald-300/20 bg-emerald-300/8 text-emerald-50",
                step.state === "active" && "border-signal/35 bg-signal/12 text-signal-bright shadow-[0_0_28px_rgb(var(--signal-rgb)/0.16)]",
                step.state === "idle" && "border-white/10 bg-white/[0.035] text-slate-400",
              )}
            >
              <StepIcon state={step.state} />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal/75">extracted fields</p>
          <LeadClassBadge value={score.leadClass} />
        </div>
        <div className={cn("mt-4 grid gap-2 text-sm", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2")}>
          <Field label="Тип" value={entityLabels[draft.entityType]} />
          <Field label="Ниша" value={valueOrEmpty(draft.businessType)} />
          <Field label="Город" value={valueOrEmpty(draft.city)} />
          <Field label="Оборот" value={valueOrEmpty(draft.monthlyTurnover)} />
          <Field label="Потребность" value={needs} />
          <Field label="Срок" value={urgencyLabels[draft.urgency]} />
          <Field label="Банк" value={valueOrEmpty(draft.currentBank)} />
          <Field label="Контакт" value={contact} />
        </div>

        <div className="mt-4 rounded-lg border border-signal/15 bg-black/24 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Score preview</span>
            <span className="font-mono text-2xl font-semibold text-signal-bright">{score.score}/100</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-signal-strong via-signal to-signal-strong transition-[width] duration-300"
              style={{ width: `${score.score}%` }}
            />
          </div>
          <div className="mt-3">
            <RiskFlags flags={score.riskFlags} />
          </div>
        </div>

        {missingFields.length > 0 ? (
          <div className="mt-3 rounded-md border border-yellow-300/15 bg-yellow-300/8 px-3 py-2 text-xs leading-5 text-yellow-50/85">
            Не хватает: {missingFields.map(labelMissingField).join(", ")}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal/75">mini crm-card</p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {createdLead ? "Карточка создана" : "Карточка готовится"}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {insight?.managerSummary || "AI собирает нишу, город, оборот, потребность, срок и контакт. После этого карточку можно передать менеджеру."}
        </p>
        {insight?.nextAction ? (
          <div className="mt-3 rounded-md border border-signal/15 bg-signal/8 px-3 py-2 text-sm leading-5 text-signal-bright">
            {insight.nextAction}
          </div>
        ) : null}
      </section>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/18 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 min-h-5 text-slate-100">{value}</div>
    </div>
  );
}

function labelMissingField(field: string) {
  const labels: Record<string, string> = {
    entity: "ИП/ООО",
    businessType: "ниша",
    city: "город",
    monthlyTurnover: "оборот",
    needs: "потребность",
    urgency: "срок",
    contact: "контакт",
  };
  return labels[field] ?? field;
}
