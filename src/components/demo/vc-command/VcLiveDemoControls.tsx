"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Flame,
  ListRestart,
  Loader2,
  Radar,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadClassBadge } from "@/components/demo/rko/LeadClassBadge";
import { RiskFlags } from "@/components/demo/rko/RiskFlags";
import { VcVoiceSummary } from "./VcVoiceSummary";
import { vcTimelineLabels } from "./useVcDemoScenarios";
import type { VcDemoAction, VcDemoScenarios } from "./useVcDemoScenarios";
import type { VcCommandTabId } from "./vc-command-content";

type VcLiveDemoControlsProps = {
  onTabChange: (tab: VcCommandTabId) => void;
  scenarios: VcDemoScenarios;
};

export function VcLiveDemoControls({ onTabChange, scenarios }: VcLiveDemoControlsProps) {
  const { activeAction, busy, completedSteps, error, result, runAction } = scenarios;

  return (
    <section className="overflow-hidden rounded-xl border border-signal/18 bg-[var(--surface-1)]/78 p-4 shadow-[0_24px_100px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-signal-bright">
            <Sparkles className="size-4" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">live demo controls</span>
          </div>
          <h2 className="text-2xl font-semibold leading-tight text-white">Один клик для сценария на эфире</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Данные синтетические. Кнопки создают карточки через существующий RKO engine и показывают, что увидит CRM.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px]">
          <ScenarioButton
            action="hot"
            label="Горячий РКО-лид"
            icon={Flame}
            disabled={busy}
            active={activeAction === "hot"}
            onClick={() => void runAction("hot")}
          />
          <ScenarioButton
            action="junk"
            label="Мусорный лид"
            icon={AlertTriangle}
            disabled={busy}
            active={activeAction === "junk"}
            onClick={() => void runAction("junk")}
          />
          <ScenarioButton
            action="generate"
            label="Сгенерировать 100 лидов"
            icon={Database}
            disabled={busy}
            active={activeAction === "generate"}
            onClick={() => void runAction("generate")}
          />
          <ScenarioButton
            action="reset"
            label="Сбросить демо"
            icon={RotateCcw}
            disabled={busy}
            active={activeAction === "reset"}
            onClick={() => void runAction("reset")}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-2 sm:grid-cols-5">
          {vcTimelineLabels.map((label, index) => {
            const done = completedSteps > index;
            const active = busy && completedSteps === index;

            return (
              <div
                key={label}
                className={`rounded-lg border p-3 transition ${
                  done
                    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-50"
                    : active
                      ? "border-signal/35 bg-signal/12 text-signal-bright"
                      : "border-white/10 bg-black/18 text-slate-400"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  {done ? (
                    <CheckCircle2 className="size-4 text-emerald-200" aria-hidden="true" />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin text-signal-bright" aria-hidden="true" />
                  ) : (
                    <span className="size-4 rounded-full border border-white/20" aria-hidden="true" />
                  )}
                  <span className="font-mono text-[10px] text-slate-500">0{index + 1}</span>
                </div>
                <p className="text-xs font-medium leading-5">{label}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-4" data-demo-result={result?.type ?? "ready"}>
          {result?.type === "lead" ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/75">result</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{result.title}</h3>
                </div>
                <LeadClassBadge value={result.lead.leadClass} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{result.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 font-mono text-xs text-signal-bright">
                  score {result.lead.score}/100
                </span>
                <RiskFlags flags={result.lead.riskFlags} />
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{result.lead.managerSummary}</p>
              <p className="mt-3 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-sm leading-6 text-slate-200">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/75">next action</span>
                <br />
                {result.lead.nextAction}
              </p>
              <div className="mt-4">
                <VcVoiceSummary
                  summary={result.lead.managerSummary}
                  leadClass={result.lead.leadClass}
                  score={result.lead.score}
                  nextAction={result.lead.nextAction}
                  compact
                />
              </div>
            </div>
          ) : result?.type === "bulk" ? (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/75">result</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{result.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{result.text}</p>
              <p className="mt-3 rounded-md border border-signal/18 bg-signal/8 px-3 py-2 font-mono text-sm text-signal-bright">
                rows: {result.count}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">ready</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Выбери сценарий</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                После выполнения здесь появится score, class, выжимка и переходы в CRM/радар.
              </p>
            </div>
          )}

          {error ? <p className="mt-3 text-sm leading-6 text-rose-200">{error}</p> : null}

          {result ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button type="button" className="bg-signal text-slate-950 hover:bg-signal-bright" onClick={() => onTabChange("crm")}>
                <ListRestart className="size-4" />
                В CRM
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
                onClick={() => onTabChange("traffic")}
              >
                <Radar className="size-4" />
                В радар
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-black/16 p-3 text-xs leading-5 text-slate-500 md:grid-cols-[1fr_auto] md:items-center">
        <span>
          motiv_channel в этом demo-слое соответствует существующему источнику bad_motiv в RKO engine. Логика скоринга и traffic report не дублируются.
        </span>
        <Button type="button" size="sm" variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10" onClick={() => onTabChange("traffic")}>
          Проверить радар <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}

function ScenarioButton({
  action,
  label,
  icon: Icon,
  disabled,
  active,
  onClick,
}: {
  action: VcDemoAction;
  label: string;
  icon: typeof Flame;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      data-demo-action={action}
      className={`h-11 justify-start border-white/10 bg-white/[0.055] text-white hover:bg-signal/10 ${
        active ? "border-signal/35 bg-signal/12 text-signal-bright" : ""
      }`}
    >
      {active ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {label}
    </Button>
  );
}
