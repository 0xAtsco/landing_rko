"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  History,
  ListChecks,
  LockKeyhole,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TestTube2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadClassBadge } from "@/components/demo/rko/LeadClassBadge";
import { entityLabels, needLabels, riskLabels, sourceLabels, urgencyLabels } from "@/lib/rko/constants";
import { extractLeadDraft, safeDialog } from "@/lib/rko/lead-extractor";
import { buildMockLeadInsight } from "@/lib/rko/mock-ai";
import { scoreLead } from "@/lib/rko/scoring";
import { useRkoLeads } from "@/lib/rko/store";
import type { Lead, LeadClass, LeadDraft, RiskFlag } from "@/lib/rko/types";
import { VcVoiceSummary } from "./VcVoiceSummary";
import {
  DEFAULT_VC_AGENT_PROMPT,
  DEFAULT_VC_STOP_FACTORS,
  VC_AGENT_PROMPT_KEY,
  VC_SETTINGS_EVENT,
  VC_STOP_FACTORS_KEY,
  VC_TONE_MODE_KEY,
  VC_VOICE_ENABLED_KEY,
  type VcToneMode,
} from "./vc-ai-dialog-types";

const HISTORY_KEY = "vc-command-agent-test-history";

const DEFAULT_TEST_INPUT =
  "Хочу открыть ИП и расчетный счет. Работаю с маркетплейсами, оборот 700к-1м, Казань, нужен эквайринг, открыть хочу на этой неделе.";

const verticalTabs = [
  { id: "rko", label: "AI RKO", active: true },
  { id: "hr", label: "AI HR", active: false },
  { id: "cpa", label: "AI CPA", active: false },
  { id: "gml", label: "AI GML", active: false },
  { id: "mfo", label: "AI MFO", active: false },
] as const;

const studioControls = [
  { id: "status", label: "Status", icon: ShieldCheck },
  { id: "tone", label: "Tone & Voice", icon: SlidersHorizontal },
  { id: "prompt", label: "Prompt & Logic", icon: FileText },
  { id: "stop", label: "Stop Factors", icon: ShieldAlert },
  { id: "test", label: "Test", icon: TestTube2 },
  { id: "history", label: "History", icon: History },
] as const;

const statusCards = [
  { label: "AI RKO обработчик", value: "active", icon: Bot },
  { label: "Demo mode", value: "synthetic", icon: ShieldCheck },
  { label: "LLM", value: "optional", icon: SlidersHorizontal },
  { label: "Fallback rules", value: "active", icon: ListChecks },
  { label: "Scoring", value: "A–F", icon: Gauge },
  { label: "Handoff", value: "выжимка менеджеру", icon: FileText },
  { label: "No real payouts / no approve guarantee", value: "safe", icon: LockKeyhole },
] as const;

type StudioControlId = (typeof studioControls)[number]["id"];

type AgentExtractedField = {
  label: string;
  value: string;
};

type AgentTestResult = {
  id: string;
  timestamp: string;
  leadClass: LeadClass;
  score: number;
  riskFlags: RiskFlag[];
  extractedFields: AgentExtractedField[];
  managerSummary: string;
  nextAction: string;
};

function readString(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function readStringArray(key: string, fallback: readonly string[]) {
  if (typeof window === "undefined") return [...fallback];

  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (!Array.isArray(value)) return [...fallback];
    return value.filter((item): item is string => typeof item === "string" && DEFAULT_VC_STOP_FACTORS.includes(item as (typeof DEFAULT_VC_STOP_FACTORS)[number]));
  } catch {
    return [...fallback];
  }
}

function readToneMode() {
  if (typeof window === "undefined") return "balanced";
  const value = window.localStorage.getItem(VC_TONE_MODE_KEY);
  return value === "balanced" ||
    value === "expert" ||
    value === "friendly" ||
    value === "strict_filter" ||
    value === "closer"
    ? (value as VcToneMode)
    : "balanced";
}

function readVoiceEnabled() {
  if (typeof window === "undefined") return true;
  const value = window.localStorage.getItem(VC_VOICE_ENABLED_KEY);
  return value === null ? true : value === "true";
}

function emitSettingsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VC_SETTINGS_EVENT));
}

function readHistory() {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.slice(0, 5).filter(isAgentTestResult);
  } catch {
    return [];
  }
}

function isAgentTestResult(value: unknown): value is AgentTestResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AgentTestResult>;
  return (
    typeof item.id === "string" &&
    typeof item.timestamp === "string" &&
    typeof item.score === "number" &&
    typeof item.managerSummary === "string" &&
    typeof item.nextAction === "string" &&
    Array.isArray(item.riskFlags) &&
    Array.isArray(item.extractedFields)
  );
}

function hasContact(draft: LeadDraft) {
  return Boolean(draft.telegram?.trim() || draft.phone?.trim());
}

function needsText(draft: LeadDraft) {
  return draft.needs.map((need) => needLabels[need]).join(" + ") || "не указано";
}

function sanitizeSummary(summary: string, draft: LeadDraft) {
  return summary.replace(/Контакт:\s*[^.]+/i, `Контакт: ${hasContact(draft) ? "указан" : "не указан"}`);
}

function buildExtractedFields(draft: LeadDraft): AgentExtractedField[] {
  return [
    { label: "entity", value: entityLabels[draft.entityType] },
    { label: "ниша", value: draft.businessType || "не указано" },
    { label: "город", value: draft.city || "не указано" },
    { label: "оборот", value: draft.monthlyTurnover || "не указано" },
    { label: "потребность", value: needsText(draft) },
    { label: "срочность", value: urgencyLabels[draft.urgency] },
    { label: "контакт", value: hasContact(draft) ? "указан" : "не указан" },
    { label: "источник", value: sourceLabels[draft.source] },
  ];
}

function analyzeLeadText(input: string, knownLeads: Lead[]): AgentTestResult {
  const messages = safeDialog([{ role: "user", content: input }]);
  const extracted = extractLeadDraft({
    messages,
    source: "warm_telegram",
    campaign: "rko_marketplace",
    sessionId: "vc-agent-studio-test",
  });
  const scoring = scoreLead(extracted.draft, knownLeads);
  const insight = buildMockLeadInsight(extracted.draft, knownLeads);

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    leadClass: scoring.leadClass,
    score: scoring.score,
    riskFlags: scoring.riskFlags,
    extractedFields: buildExtractedFields(extracted.draft),
    managerSummary: sanitizeSummary(insight.managerSummary, extracted.draft),
    nextAction: insight.nextAction,
  };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function VcAgentStudio() {
  const leads = useRkoLeads();
  const [activeControl, setActiveControl] = useState<StudioControlId>("status");
  const [prompt, setPrompt] = useState(() => readString(VC_AGENT_PROMPT_KEY, DEFAULT_VC_AGENT_PROMPT));
  const [promptFeedback, setPromptFeedback] = useState("");
  const [selectedStopFactors, setSelectedStopFactors] = useState<string[]>(() => readStringArray(VC_STOP_FACTORS_KEY, DEFAULT_VC_STOP_FACTORS));
  const [toneMode, setToneMode] = useState<VcToneMode>(() => readToneMode());
  const [voiceEnabled, setVoiceEnabled] = useState(() => readVoiceEnabled());
  const [testInput, setTestInput] = useState(DEFAULT_TEST_INPUT);
  const [testResult, setTestResult] = useState<AgentTestResult | null>(null);
  const [history, setHistory] = useState<AgentTestResult[]>(() => readHistory());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VC_STOP_FACTORS_KEY, JSON.stringify(selectedStopFactors));
    emitSettingsUpdated();
  }, [selectedStopFactors]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VC_TONE_MODE_KEY, toneMode);
    emitSettingsUpdated();
  }, [toneMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VC_VOICE_ENABLED_KEY, String(voiceEnabled));
    emitSettingsUpdated();
  }, [voiceEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
  }, [history]);

  const selectedStopFactorSet = useMemo(() => new Set(selectedStopFactors), [selectedStopFactors]);

  const savePrompt = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VC_AGENT_PROMPT_KEY, prompt);
      emitSettingsUpdated();
    }
    setPromptFeedback("Сохранено");
  }, [prompt]);

  const resetPrompt = useCallback(() => {
    setPrompt(DEFAULT_VC_AGENT_PROMPT);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VC_AGENT_PROMPT_KEY, DEFAULT_VC_AGENT_PROMPT);
      emitSettingsUpdated();
    }
    setPromptFeedback("Сброшено");
  }, []);

  const toggleStopFactor = useCallback((factor: string) => {
    setSelectedStopFactors((current) => {
      if (current.includes(factor)) return current.filter((item) => item !== factor);
      return [...current, factor];
    });
  }, []);

  const runTest = useCallback(() => {
    const result = analyzeLeadText(testInput, leads);
    setTestResult(result);
    setHistory((current) => [result, ...current.filter((item) => item.id !== result.id)].slice(0, 5));
    setActiveControl("test");
  }, [leads, testInput]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  return (
    <section className="grid gap-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-signal-bright">
              <Bot className="size-4" aria-hidden="true" />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em]">ai agent studio</p>
            </div>
            <h2 className="text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Нейросеть: правила квалификации и тест
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              Эти настройки влияют на ответы AI Диалога. Остальные вертикали оставлены как безопасный visual demo.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2">
            {verticalTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={!tab.active}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition ${
                  tab.active
                    ? "border-signal/35 bg-signal/12 text-signal-bright"
                    : "cursor-not-allowed border-white/10 bg-white/[0.035] text-slate-500"
                }`}
              >
                {tab.label}
                {!tab.active ? (
                  <span className="rounded-md border border-white/10 bg-black/24 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
                    visual demo
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-white/10 bg-black/24 p-3 backdrop-blur-xl">
          <div className="grid gap-2">
            {studioControls.map((control) => {
              const Icon = control.icon;
              const selected = activeControl === control.id;

              return (
                <button
                  key={control.id}
                  type="button"
                  onClick={() => setActiveControl(control.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "border-signal/35 bg-signal/12 text-white"
                      : "border-white/8 bg-white/[0.035] text-slate-400 hover:border-signal/22 hover:bg-signal/8 hover:text-white"
                  }`}
                >
                  <Icon className={selected ? "size-4 text-signal-bright" : "size-4 text-slate-500"} aria-hidden="true" />
                  <span>{control.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] backdrop-blur-xl sm:p-5">
          {activeControl === "status" ? <StatusScreen /> : null}
          {activeControl === "tone" ? (
            <ToneScreen
              toneMode={toneMode}
              voiceEnabled={voiceEnabled}
              onToneModeChange={setToneMode}
              onVoiceEnabledChange={setVoiceEnabled}
            />
          ) : null}
          {activeControl === "prompt" ? (
            <PromptScreen
              prompt={prompt}
              promptFeedback={promptFeedback}
              onPromptChange={setPrompt}
              onSave={savePrompt}
              onReset={resetPrompt}
            />
          ) : null}
          {activeControl === "stop" ? (
            <StopFactorsScreen
              selectedStopFactorSet={selectedStopFactorSet}
              onToggle={toggleStopFactor}
            />
          ) : null}
          {activeControl === "test" ? (
            <TestScreen
              testInput={testInput}
              testResult={testResult}
              onTestInputChange={setTestInput}
              onRunTest={runTest}
            />
          ) : null}
          {activeControl === "history" ? (
            <HistoryScreen history={history} onClearHistory={clearHistory} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StatusScreen() {
  return (
    <div>
      <PanelTitle icon={ShieldCheck} kicker="status" title="AI RKO обработчик" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statusCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-white/10 bg-black/22 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-md border border-signal/20 bg-signal/10 text-signal-bright">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-signal-bright">
                  {card.value}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{card.label}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PromptScreen({
  prompt,
  promptFeedback,
  onPromptChange,
  onSave,
  onReset,
}: {
  prompt: string;
  promptFeedback: string;
  onPromptChange: (value: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div>
      <PanelTitle icon={FileText} kicker="prompt & logic" title="Промпт AI RKO" />
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        className="mt-5 min-h-[260px] w-full resize-y rounded-lg border border-white/10 bg-black/32 p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-signal/45 focus:ring-2 focus:ring-signal/18"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" className="bg-signal text-slate-950 hover:bg-signal-bright" onClick={onSave}>
          <Save className="size-4" />
          Сохранить
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
          onClick={onReset}
        >
          <RotateCcw className="size-4" />
          Сбросить
        </Button>
        {promptFeedback ? <span className="text-sm text-signal-bright">{promptFeedback}</span> : null}
      </div>
    </div>
  );
}

const toneModeOptions: Array<{ id: VcToneMode; label: string; text: string }> = [
  { id: "balanced", label: "balanced", text: "Ровный консультант: коротко, без давления." },
  { id: "expert", label: "expert", text: "Уверенный эксперт: больше структуры и причин." },
  { id: "friendly", label: "friendly", text: "Тёплый тон для новичков и сомнений." },
  { id: "strict_filter", label: "strict filter", text: "Жёстче фильтрует мотив, фейки и обходы." },
  { id: "closer", label: "closer", text: "Быстрее ведёт горячий лид к handoff." },
];

function ToneScreen({
  toneMode,
  voiceEnabled,
  onToneModeChange,
  onVoiceEnabledChange,
}: {
  toneMode: VcToneMode;
  voiceEnabled: boolean;
  onToneModeChange: (value: VcToneMode) => void;
  onVoiceEnabledChange: (value: boolean) => void;
}) {
  return (
    <div>
      <PanelTitle icon={SlidersHorizontal} kicker="tone & voice" title="Режим ответа AI Диалога" />
      <p className="mt-4 rounded-lg border border-signal/16 bg-signal/8 p-3 text-sm leading-6 text-slate-200">
        Эти настройки влияют на ответы AI Диалога.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {toneModeOptions.map((option) => {
          const selected = toneMode === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToneModeChange(option.id)}
              className={`rounded-lg border p-4 text-left transition ${
                selected
                  ? "border-signal/35 bg-signal/12 text-white"
                  : "border-white/10 bg-black/22 text-slate-300 hover:border-signal/24 hover:bg-signal/8"
              }`}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-bright">
                {option.label}
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-300">{option.text}</p>
            </button>
          );
        })}
      </div>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/22 p-4">
        <span>
          <span className="block text-sm font-semibold text-white">Voice reply</span>
          <span className="mt-1 block text-sm leading-6 text-slate-400">
            AI Диалог пробует ElevenLabs TTS, затем browser voice, затем transcript.
          </span>
        </span>
        <input
          type="checkbox"
          checked={voiceEnabled}
          onChange={(event) => onVoiceEnabledChange(event.target.checked)}
          className="size-5 rounded border-white/20 bg-black accent-[var(--signal-strong)]"
        />
      </label>
    </div>
  );
}

function StopFactorsScreen({
  selectedStopFactorSet,
  onToggle,
}: {
  selectedStopFactorSet: Set<string>;
  onToggle: (factor: string) => void;
}) {
  return (
    <div>
      <PanelTitle icon={ShieldAlert} kicker="stop factors" title="Стоп-факторы" />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {DEFAULT_VC_STOP_FACTORS.map((factor) => (
          <label
            key={factor}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/22 p-4 text-sm leading-6 text-slate-200 transition hover:border-signal/24 hover:bg-signal/8"
          >
            <input
              type="checkbox"
              checked={selectedStopFactorSet.has(factor)}
              onChange={() => onToggle(factor)}
              className="mt-1 size-4 rounded border-white/20 bg-black accent-[var(--signal-strong)]"
            />
            <span>{factor}</span>
          </label>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">Сохраняется локально в браузере.</p>
    </div>
  );
}

function TestScreen({
  testInput,
  testResult,
  onTestInputChange,
  onRunTest,
}: {
  testInput: string;
  testResult: AgentTestResult | null;
  onTestInputChange: (value: string) => void;
  onRunTest: () => void;
}) {
  return (
    <div>
      <PanelTitle icon={TestTube2} kicker="test" title="Тест агента на синтетической заявке" />
      <textarea
        value={testInput}
        onChange={(event) => onTestInputChange(event.target.value)}
        className="mt-5 min-h-[130px] w-full resize-y rounded-lg border border-white/10 bg-black/32 p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-signal/45 focus:ring-2 focus:ring-signal/18"
      />
      <div className="mt-4">
        <Button type="button" className="bg-signal text-slate-950 hover:bg-signal-bright" onClick={onRunTest}>
          <TestTube2 className="size-4" />
          Протестировать агента
        </Button>
      </div>

      {testResult ? (
        <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 rounded-lg border border-white/10 bg-black/22 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal/75">analysis result</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Score {testResult.score}/100</h3>
              </div>
              <LeadClassBadge value={testResult.leadClass} />
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {testResult.extractedFields.map((field) => (
                <div key={field.label} className="rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{field.label}</p>
                  <p className="mt-1 text-sm text-slate-100">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.045] p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">risk flags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {testResult.riskFlags.length ? (
                  testResult.riskFlags.map((flag) => (
                    <span key={flag} className="rounded-md border border-rose-300/20 bg-rose-300/10 px-2 py-1 text-xs text-rose-100">
                      {riskLabels[flag]}
                    </span>
                  ))
                ) : (
                  <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
                    критичных рисков нет
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <SummaryBlock title="выжимка менеджеру" text={testResult.managerSummary} />
              <SummaryBlock title="next action" text={testResult.nextAction} />
            </div>
          </div>

          <VcVoiceSummary
            summary={testResult.managerSummary}
            leadClass={testResult.leadClass}
            score={testResult.score}
            nextAction={testResult.nextAction}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}

function HistoryScreen({
  history,
  onClearHistory,
}: {
  history: AgentTestResult[];
  onClearHistory: () => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PanelTitle icon={History} kicker="history" title="Последние тесты" />
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
          onClick={onClearHistory}
        >
          <RotateCcw className="size-4" />
          Очистить историю
        </Button>
      </div>

      <div className="mt-5 grid gap-3">
        {history.map((item) => (
          <article key={item.id} className="rounded-lg border border-white/10 bg-black/22 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock3 className="size-4" aria-hidden="true" />
                <span className="text-sm">{formatTime(item.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 font-mono text-xs text-signal-bright">
                  score {item.score}
                </span>
                <LeadClassBadge value={item.leadClass} />
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{item.managerSummary}</p>
          </article>
        ))}

        {history.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/22 p-4 text-sm leading-6 text-slate-400">
            История пуста. Запусти тест агента, чтобы увидеть последние результаты.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PanelTitle({
  icon: Icon,
  kicker,
  title,
}: {
  icon: typeof CheckCircle2;
  kicker: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-signal/24 bg-signal/10 text-signal-bright">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal/75">{kicker}</p>
        <h3 className="mt-1 text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">{title}</h3>
      </div>
    </div>
  );
}

function SummaryBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal/75">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-200">{text}</p>
    </div>
  );
}
