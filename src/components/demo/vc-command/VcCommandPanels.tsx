"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Braces,
  Database,
  FileText,
  Gauge,
  Link2,
  ListChecks,
  MessageSquareText,
  Radio,
  Radar,
  Route,
  SlidersHorizontal,
  Sparkles,
  PhoneCall,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadClassBadge } from "@/components/demo/rko/LeadClassBadge";
import { LeadDetailPanel } from "@/components/demo/rko/LeadDetailPanel";
import { LeadTable } from "@/components/demo/rko/LeadTable";
import { RiskFlags } from "@/components/demo/rko/RiskFlags";
import { TrafficDashboard } from "@/components/demo/rko/TrafficDashboard";
import { sourceLabels } from "@/lib/rko/constants";
import { useRkoLeads } from "@/lib/rko/store";
import { trafficSummary } from "@/lib/rko/traffic";
import type { Lead } from "@/lib/rko/types";
import { VcAiDialogEngine } from "./VcAiDialogEngine";
import { VcAgentStudio } from "./VcAgentStudio";
import { VcLiveDemoControls } from "./VcLiveDemoControls";
import { VcVoiceSummary } from "./VcVoiceSummary";
import type { VcDemoScenarios } from "./useVcDemoScenarios";
import {
  demoScriptSteps,
  leadFlow,
  referralRows,
  toolCards,
  trafficAliasRows,
} from "./vc-command-content";
import type { VcCommandTabId } from "./vc-command-content";

type VcCommandPanelsProps = {
  activeTab: VcCommandTabId;
  onPresenterOpen: () => void;
  onScriptOpen: () => void;
  onTabChange: (tab: VcCommandTabId) => void;
  scenarios: VcDemoScenarios;
};

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

export function VcCommandPanels({
  activeTab,
  onPresenterOpen,
  onScriptOpen,
  onTabChange,
  scenarios,
}: VcCommandPanelsProps) {
  if (activeTab === "home") return <HomePanel onTabChange={onTabChange} scenarios={scenarios} />;
  if (activeTab === "chats") return <VcAiDialogEngine />;
  if (activeTab === "crm") return <CrmPanel />;
  if (activeTab === "studio") return <AgentStudioPanel />;
  if (activeTab === "traffic") return <TrafficPanel />;
  if (activeTab === "tools") return <ToolsPanel />;
  if (activeTab === "referrals") return <ReferralLinksPanel />;
  return <PresenterPanel onPresenterOpen={onPresenterOpen} onScriptOpen={onScriptOpen} onTabChange={onTabChange} />;
}

function HomePanel({ onTabChange, scenarios }: { onTabChange: (tab: VcCommandTabId) => void; scenarios: VcDemoScenarios }) {
  const leads = useRkoLeads();
  const summary = useMemo(() => trafficSummary(leads), [leads]);
  const latestLead = leads[0];
  const stats = useMemo(() => {
    let today = 0;
    let ab = 0;
    let risk = 0;
    let waiting = 0;
    let scoreSum = 0;

    for (const lead of leads) {
      if (isToday(lead.createdAt)) today += 1;
      if (lead.leadClass === "A" || lead.leadClass === "B") ab += 1;
      if (lead.riskFlags.length > 0 || lead.leadClass === "F") risk += 1;
      if (lead.status === "new" || lead.status === "qualified") waiting += 1;
      scoreSum += lead.score;
    }

    return {
      today,
      ab,
      risk,
      waiting,
      avg: leads.length ? Math.round(scoreSum / leads.length) : 0,
      best: summary.bestSource ? sourceLabels[summary.bestSource] : "нет данных",
    };
  }, [leads, summary.bestSource]);

  return (
    <div className="grid gap-5">
      <VcLiveDemoControls onTabChange={onTabChange} scenarios={scenarios} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <CommandMetric title="Заявки сегодня" value={stats.today} icon={Radio} />
        <CommandMetric title="A/B лиды" value={stats.ab} icon={Sparkles} tone="green" />
        <CommandMetric title="Средний score" value={stats.avg} icon={Gauge} />
        <CommandMetric title="Дубли / риск" value={stats.risk} icon={AlertTriangle} tone="red" />
        <CommandMetric title="До менеджера" value={stats.waiting} icon={ListChecks} />
        <CommandMetric title="Лучший источник" value={stats.best} icon={Users} />
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <CommandPanel>
          <PanelHeader
            icon={Route}
            kicker="core flow"
            title="Один путь от клика до карточки менеджера"
            text="Это демо показывает рабочую AI-связку, которую можно открыть на эфире: заявка, квалификация, score, CRM и качество источников."
          />
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {leadFlow.map((item, index) => (
              <div key={item} className="relative rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="grid size-8 place-items-center rounded-md border border-signal/28 bg-signal/10 font-mono text-xs font-semibold text-signal-bright">
                    {index + 1}
                  </span>
                  {index < leadFlow.length - 1 ? <ArrowRight className="hidden size-4 text-signal/70 lg:block" aria-hidden="true" /> : null}
                </div>
                <p className="text-sm font-semibold text-white">{item}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {index === 0
                    ? "Источник и метка"
                    : index === 1
                      ? "Первый клик"
                      : index === 2
                        ? "Вопросы и score"
                        : index === 3
                          ? "Выжимка и действие"
                          : "Решение человеком"}
                </p>
              </div>
            ))}
          </div>
        </CommandPanel>

        <div className="grid gap-5">
          <CommandPanel>
            <PanelHeader icon={FileText} kicker="live demo script" title="Сценарий на эфир" />
            <ol className="mt-5 grid gap-3">
              {demoScriptSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg border border-white/10 bg-black/18 p-3 text-sm leading-6 text-slate-200">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-signal text-sm font-semibold text-slate-950">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-2">
              <Button asChild className="bg-signal text-slate-950 hover:bg-signal-bright">
                <Link href="/demo/rko/script">
                  Открыть полный скрипт <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10">
                <Link href="/demo/rko/dashboard">Классический RKO demo</Link>
              </Button>
            </div>
          </CommandPanel>

          <div className="grid gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/75">Последняя выжимка</p>
            <VcVoiceSummary
              summary={latestLead?.managerSummary ?? "Запусти горячий или мусорный сценарий, чтобы получить свежую выжимку для менеджера."}
              leadClass={latestLead?.leadClass}
              score={latestLead?.score}
              nextAction={latestLead?.nextAction}
              compact
            />
          </div>
        </div>
      </section>

      <CommandPanel>
        <PanelHeader
          icon={Database}
          kicker="recent crm signal"
          title="Последние карточки в CRM"
          text="Короткий срез без тяжёлого dashboard. Полная таблица во вкладке Лиды / CRM."
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {leads.slice(0, 3).map((lead) => (
            <LeadPreviewCard key={lead.id} lead={lead} />
          ))}
          {leads.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
              Демо-лиды загружаются. Если база пустая, открой Лиды / CRM и сгенерируй demo leads.
            </div>
          ) : null}
        </div>
      </CommandPanel>
    </div>
  );
}

function CrmPanel() {
  return (
    <div className="grid gap-5">
      <CommandPanel>
        <PanelHeader
          icon={Database}
          kicker="lead crm"
          title="CRM показывает score, class, выжимку, risk flags и следующий шаг"
          text="Ниже используется рабочий RKO dashboard. Он не подменяет менеджера, а готовит карточку и подсказку для ручной обработки."
        />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="bg-signal text-slate-950 hover:bg-signal-bright">
            <Link href="/demo/rko/chat">Создать тестовую заявку</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10">
            <Link href="/demo/rko/dashboard">Открыть полный dashboard</Link>
          </Button>
        </div>
      </CommandPanel>
      <InlineCrmPreview />
    </div>
  );
}

function TrafficPanel() {
  return (
    <div className="grid gap-5">
      <CommandPanel>
        <PanelHeader
          icon={Radar}
          kicker="traffic quality radar"
          title="Качество источников видно до траты времени менеджера"
          text="Радар сравнивает источники по A/B лидам, дублям, рискам и слабому намерению. Данные синтетические."
        />
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          {trafficAliasRows.map((row) => (
            <div key={row.source} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-mono text-[11px] text-signal-bright">{row.source}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{row.text}</p>
              <p className="mt-3 rounded-md border border-white/10 bg-white/[0.045] px-2 py-1 text-xs text-slate-300">{row.quality}</p>
            </div>
          ))}
        </div>
      </CommandPanel>
      <TrafficDashboard />
    </div>
  );
}

function AgentStudioPanel() {
  return <VcAgentStudio />;
}

function ToolsPanel() {
  const toolIconByTitle = {
    "Чекер базы": Database,
    "Рассылка": MessageSquareText,
    "Прозвон базы": PhoneCall,
    API: Braces,
    "Аналитика базы": BarChart3,
  } satisfies Record<(typeof toolCards)[number]["title"], typeof Wrench>;

  return (
    <CommandPanel>
      <PanelHeader
        icon={Wrench}
        kicker="tools"
        title="Операционные модули вокруг обработки лидов"
        text="Это визуальные демо-карточки. Здесь нет реальной рассылки, звонков, scraping или внешних интеграций."
      />

      <div className="mt-5 rounded-lg border border-signal/16 bg-black/22 p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          {["synthetic base", "no real sending", "manager controls"].map((item) => (
            <div key={item} className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {toolCards.map((tool) => (
          <div
            key={tool.title}
            className="group rounded-lg border border-white/10 bg-black/24 p-4 transition hover:border-signal/24 hover:bg-signal/8"
            data-tool-status="visual-demo"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="grid size-9 place-items-center rounded-md border border-signal/20 bg-signal/10 text-signal-bright">
                {(() => {
                  const Icon = toolIconByTitle[tool.title];
                  return <Icon className="size-4" aria-hidden="true" />;
                })()}
              </span>
              <span className="rounded-md border border-white/10 bg-white/[0.045] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                visual demo
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{tool.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{tool.text}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-2/3 rounded-full bg-signal/60 transition group-hover:w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </CommandPanel>
  );
}

function ReferralLinksPanel() {
  return (
    <CommandPanel>
      <PanelHeader
        icon={Link2}
        kicker="referral links"
        title="Синтетические ссылки и метки для демонстрации источников"
        text="Нет реальных банковских офферов или payout-интеграций. Таблица нужна, чтобы показать источник, метку и качество."
      />
      <div className="mt-5 rounded-lg border border-signal/18 bg-signal/8 p-4 text-sm leading-6 text-slate-200">
        Ссылки синтетические. В демо они нужны, чтобы показать разметку источников и качество лидов.
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[var(--surface-2)]/95 font-mono text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr>
                {["Вертикаль", "Оффер", "Метка", "Ссылка", "Статус", "Качество"].map((head) => (
                  <th key={head} className="border-b border-white/10 px-3 py-3 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referralRows.map((row) => (
                <tr key={row.tag} className="border-b border-white/[0.07] text-slate-200">
                  <td className="px-3 py-3">
                    <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 font-mono text-xs font-semibold text-signal-bright">
                      {row.vertical}
                    </span>
                  </td>
                  <td className="px-3 py-3">{row.offer}</td>
                  <td className="px-3 py-3 font-mono text-signal-bright">{row.tag}</td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-300">{row.link}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md border border-white/10 bg-white/[0.045] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-300">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-md border px-2 py-1 text-xs ${
                        row.quality === "высокий"
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          : row.quality === "риск"
                            ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                            : "border-signal/18 bg-signal/8 text-signal-bright"
                      }`}
                    >
                      {row.quality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CommandPanel>
  );
}

function PresenterPanel({
  onPresenterOpen,
  onScriptOpen,
  onTabChange,
}: {
  onPresenterOpen: () => void;
  onScriptOpen: () => void;
  onTabChange: (tab: VcCommandTabId) => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <CommandPanel>
        <PanelHeader
          icon={SlidersHorizontal}
          kicker="presenter"
          title="Сценарий показа AI Dialog Engine"
          text="Фокус показа: AI не просто пишет ответ, а ведёт обработку тона, качества, CRM и handoff."
        />
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button type="button" className="bg-signal text-slate-950 hover:bg-signal-bright" onClick={onPresenterOpen}>
            <SlidersHorizontal className="size-4" />
            Режим презентации
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
            onClick={onScriptOpen}
          >
            <FileText className="size-4" />
            Скрипт эфира
          </Button>
        </div>
      </CommandPanel>

      <CommandPanel>
        <PanelHeader icon={FileText} kicker="flow" title="Порядок показа" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {demoScriptSteps.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => onTabChange(index === 3 ? "crm" : index === 4 ? "studio" : "chats")}
              className="rounded-lg border border-white/10 bg-black/20 p-4 text-left text-sm leading-6 text-slate-300 transition hover:border-signal/24 hover:bg-signal/8 hover:text-white"
            >
              <span className="mb-3 grid size-7 place-items-center rounded-md bg-signal font-mono text-xs font-semibold text-slate-950">
                {index + 1}
              </span>
              {item}
            </button>
          ))}
        </div>
      </CommandPanel>
    </section>
  );
}

function CommandMetric({
  title,
  value,
  icon: Icon,
  tone = "amber",
}: {
  title: string;
  value: string | number;
  icon: typeof Gauge;
  tone?: "amber" | "green" | "red";
}) {
  const toneClass = {
    amber: "border-signal/18 bg-signal/8 text-signal-bright",
    green: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    red: "border-rose-300/20 bg-rose-300/10 text-rose-100",
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-slate-300">{title}</p>
        <span className={`grid size-8 shrink-0 place-items-center rounded-md border ${toneClass}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 truncate text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function CommandPanel({ children }: { children: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] backdrop-blur-xl sm:p-5">
      {children}
    </section>
  );
}

function PanelHeader({
  icon: Icon,
  kicker,
  title,
  text,
}: {
  icon: typeof Gauge;
  kicker: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-signal/24 bg-signal/10 text-signal-bright">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal/75">{kicker}</p>
        <h2 className="mt-1 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">{title}</h2>
        {text ? <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{text}</p> : null}
      </div>
    </div>
  );
}

function LeadPreviewCard({ lead }: { lead: Lead }) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-signal-bright">{lead.id}</p>
          <h3 className="mt-2 truncate text-lg font-semibold text-white">{lead.businessType || "Лид без ниши"}</h3>
          <p className="mt-1 text-xs text-slate-500">{sourceLabels[lead.source]}</p>
        </div>
        <LeadClassBadge value={lead.leadClass} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{lead.managerSummary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-white/10 bg-white/[0.045] px-2 py-1 font-mono text-xs text-slate-300">
          score {lead.score}
        </span>
        <RiskFlags flags={lead.riskFlags.slice(0, 2)} />
      </div>
    </article>
  );
}

function InlineCrmPreview() {
  const leads = useRkoLeads();
  const [selectedId, setSelectedId] = useState<string>();
  const selected = useMemo(() => leads.find((lead) => lead.id === selectedId) ?? leads[0], [leads, selectedId]);

  return (
    <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_430px]">
      <LeadTable leads={leads} selectedId={selected?.id} onSelect={(lead) => setSelectedId(lead.id)} />
      <div className="grid gap-5">
        {selected ? (
          <VcVoiceSummary
            summary={selected.managerSummary}
            leadClass={selected.leadClass}
            score={selected.score}
            nextAction={selected.nextAction}
            compact
          />
        ) : (
          <CommandPanel>
            <PanelHeader
              icon={FileText}
              kicker="voice"
              title="Голосовая выжимка"
              text="Появится после выбора или создания синтетического лида."
            />
          </CommandPanel>
        )}
        <LeadDetailPanel lead={selected} onChange={(next) => setSelectedId(next.find((lead) => lead.id === selected?.id)?.id)} />
      </div>
    </section>
  );
}
