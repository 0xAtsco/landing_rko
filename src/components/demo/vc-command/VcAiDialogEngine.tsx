"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  BrainCircuit,
  CircleDot,
  Database,
  Flame,
  Gauge,
  Gift,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  ShieldQuestion,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadClassBadge } from "@/components/demo/rko/LeadClassBadge";
import { cn } from "@/lib/utils";
import { VcAiVoicePlayer } from "./VcAiVoicePlayer";
import { useVcAiDialog, vcAiScenarios } from "./useVcAiDialog";
import type {
  AiDialogResult,
  LeadTone,
  ResponseStyle,
  VcAiDialogMessage,
  VcAiScenarioId,
  VcVoiceProvider,
} from "./vc-ai-dialog-types";

const scenarioIcons = {
  hot: Flame,
  confused: HelpCircle,
  skeptical: ShieldQuestion,
  bonus: Gift,
  urgent: Zap,
} satisfies Record<VcAiScenarioId, typeof Flame>;

const toneLabels: Record<LeadTone, string> = {
  neutral: "нейтральный",
  warm: "тёплый",
  skeptical: "сомнение",
  rushed: "спешит",
  aggressive: "агрессия",
  confused: "новичок",
  price_focused: "цена",
  bonus_hunter: "бонус",
  high_intent: "горячий",
};

const styleLabels: Record<ResponseStyle, string> = {
  short_direct: "коротко",
  warm_explainer: "объяснить",
  expert_confident: "экспертно",
  soft_closer: "мягко закрыть",
  risk_filter: "фильтр риска",
  human_handoff: "handoff",
};

const stageLabels: Record<AiDialogResult["stage"], string> = {
  greeting: "приветствие",
  intent: "намерение",
  qualification: "квалификация",
  need: "потребность",
  contact: "контакт",
  handoff: "handoff",
  nurture: "прогрев",
  reject: "фильтр",
};

function toneClass(tone: LeadTone) {
  if (tone === "high_intent") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (tone === "bonus_hunter" || tone === "aggressive") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  if (tone === "skeptical" || tone === "price_focused") return "border-signal/24 bg-signal/10 text-signal-bright";
  return "border-white/10 bg-white/[0.055] text-slate-200";
}

function fieldRows(result: AiDialogResult | null) {
  if (!result) return [];
  const fields = result.extractedFields;

  return [
    ["entity", fields.entityType],
    ["ниша", fields.businessType],
    ["город", fields.city],
    ["оборот", fields.monthlyTurnover],
    ["потребность", fields.needs?.join(", ")],
    ["срок", fields.urgency],
    ["контакт", fields.contact],
    ["банк", fields.currentBank],
  ].filter((row): row is [string, string] => Boolean(row[1]));
}

function providerLabel(mode: "llm" | "fallback") {
  return mode === "llm" ? "LLM mode" : "Fallback rules";
}

function voiceProviderLabel(provider: VcVoiceProvider) {
  if (provider === "elevenlabs") return "ElevenLabs";
  if (provider === "browser") return "browser";
  if (provider === "transcript") return "transcript";
  return "checking";
}

export function VcAiDialogEngine() {
  const [input, setInput] = useState("");
  const [voiceProvider, setVoiceProvider] = useState<VcVoiceProvider>("unknown");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    busy,
    conversationLead,
    crmStatus,
    error,
    lastApiLatencyMs,
    messageEndRef,
    messages,
    providerError,
    providerMode,
    result,
    settings,
    reset,
    runScenario,
    sendUserText,
  } = useVcAiDialog();
  const rows = fieldRows(result);

  useEffect(() => {
    let mounted = true;
    const speechAvailable =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined";

    fetch("/api/vc-command/tts")
      .then((response) => response.json() as Promise<{ provider?: string }>)
      .then((data) => {
        if (!mounted) return;
        if (data.provider === "elevenlabs") {
          setVoiceProvider("elevenlabs");
          return;
        }
        setVoiceProvider(speechAvailable ? "browser" : "transcript");
      })
      .catch(() => {
        if (mounted) setVoiceProvider(speechAvailable ? "browser" : "transcript");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const value = (input || inputRef.current?.value || "").trim();
    if (!value) return;
    setInput("");
    if (inputRef.current) inputRef.current.value = "";
    void sendUserText(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="grid gap-5">
      <header className="rounded-xl border border-signal/18 bg-[var(--surface-1)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22),inset_0_1px_0_rgb(var(--signal-rgb)/0.08)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-signal-bright">
              <BrainCircuit className="size-4" aria-hidden="true" />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em]">ai dialog engine</p>
            </div>
            <h2 className="text-balance text-2xl font-semibold leading-tight text-white sm:text-3xl">
              AI Dialog Engine
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Тон, следующий вопрос, score, CRM и voice reply в одном рабочем контуре.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
            <StatusChip icon={Sparkles} label={providerLabel(providerMode)} active={providerMode === "llm"} />
            <StatusChip icon={SlidersHorizontal} label={settings.toneMode} active />
            <StatusChip icon={Database} label={crmStatus} active={crmStatus.includes("обновлена")} />
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="min-w-0 rounded-xl border border-white/10 bg-white/[0.045] p-3 shadow-[0_24px_100px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] sm:p-4 xl:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-signal-bright">
                <Bot className="size-4" aria-hidden="true" />
                <p className="font-mono text-[11px] uppercase tracking-[0.18em]">dialog</p>
              </div>
              <h3 className="mt-1 text-xl font-semibold text-white">Сообщение лида → ответ оператора</h3>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={reset}
              disabled={busy}
              className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
            >
              <RotateCcw className="size-4" />
              Сброс
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(vcAiScenarios) as VcAiScenarioId[]).map((scenarioId) => {
              const Icon = scenarioIcons[scenarioId];

              return (
                <button
                  key={scenarioId}
                  type="button"
                  disabled={busy}
                  data-ai-scenario={scenarioId}
                  onClick={() => runScenario(scenarioId)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/22 px-3 py-2 text-sm text-slate-200 transition hover:border-signal/28 hover:bg-signal/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Icon className="size-4 text-signal-bright" aria-hidden="true" />
                  {vcAiScenarios[scenarioId].label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex max-h-[620px] min-h-[420px] flex-col gap-3 overflow-y-auto rounded-lg border border-white/10 bg-black/24 p-3 sm:p-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                voiceEnabled={settings.voiceEnabled}
                onVoiceProviderChange={setVoiceProvider}
              />
            ))}
            {busy ? <ThinkingBubble /> : null}
            <div ref={messageEndRef} />
          </div>

          <form
            onSubmit={submit}
            className="sticky bottom-2 z-10 mt-3 rounded-xl border border-signal/18 bg-[#090908]/96 p-2 shadow-[0_18px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:static"
          >
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onInput={(event) => setInput(event.currentTarget.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Напишите сообщение лида..."
                className="max-h-40 min-h-12 w-full resize-y rounded-lg border border-white/10 bg-black/34 px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-signal/45 focus:ring-2 focus:ring-signal/18"
              />
              <Button
                type="submit"
                disabled={busy}
                className="min-h-12 bg-signal px-4 text-slate-950 hover:bg-signal-bright sm:self-end"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Отправить
              </Button>
            </div>
            {error ? <p className="mt-2 text-sm leading-6 text-rose-200">{error}</p> : null}
          </form>
        </section>

        <aside className="grid min-w-0 gap-4 xl:col-span-5">
          <ProviderStatusCard
            aiMode={providerMode}
            voiceProvider={voiceProvider}
            crmStatus={crmStatus}
            latencyMs={lastApiLatencyMs}
            lastError={providerError || error}
          />
          <LiveIntelligencePanel
            result={result}
            providerMode={providerMode}
            crmStatus={crmStatus}
            rows={rows}
            leadId={conversationLead?.id}
          />
        </aside>
      </div>
    </section>
  );
}

function StatusChip({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Sparkles;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        active ? "border-signal/22 bg-signal/10 text-signal-bright" : "border-white/10 bg-white/[0.045] text-slate-400",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}

function MessageBubble({
  message,
  voiceEnabled,
  onVoiceProviderChange,
}: {
  message: VcAiDialogMessage;
  voiceEnabled: boolean;
  onVoiceProviderChange?: (provider: VcVoiceProvider) => void;
}) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-xl border px-3 py-3 text-sm leading-6 sm:max-w-[84%]",
          isUser
            ? "border-signal/24 bg-signal/12 text-slate-50"
            : "border-white/10 bg-white/[0.055] text-slate-200",
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-md border",
              isUser ? "border-signal/28 bg-black/16 text-signal-bright" : "border-white/10 bg-black/26 text-slate-300",
            )}
          >
            {isUser ? <UserRound className="size-3.5" aria-hidden="true" /> : <Bot className="size-3.5" aria-hidden="true" />}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {isUser ? "lead" : "ai operator"}
          </span>
        </div>
        <p>{message.content}</p>

        {message.result ? (
          <div className="mt-3 grid gap-3 border-t border-white/10 pt-3">
            <div className="flex flex-wrap gap-2">
              <span className={cn("rounded-md border px-2 py-1 text-xs", toneClass(message.result.detectedTone))}>
                tone · {toneLabels[message.result.detectedTone]}
              </span>
              <span className="rounded-md border border-signal/18 bg-signal/8 px-2 py-1 text-xs text-signal-bright">
                style · {styleLabels[message.result.responseStyle]}
              </span>
              <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-400">
                {providerLabel(message.providerMode ?? "fallback")}
              </span>
            </div>
            <VcAiVoicePlayer
              text={message.result.voiceText || message.result.reply}
              tone={message.result.detectedTone}
              style={message.result.responseStyle}
              enabled={voiceEnabled}
              onProviderChange={onVoiceProviderChange}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ThinkingBubble() {
  return (
    <article className="flex justify-start">
      <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin text-signal-bright" aria-hidden="true" />
          AI обрабатывает тон и score...
        </div>
      </div>
    </article>
  );
}

function ProviderStatusCard({
  aiMode,
  voiceProvider,
  crmStatus,
  latencyMs,
  lastError,
}: {
  aiMode: "llm" | "fallback";
  voiceProvider: VcVoiceProvider;
  crmStatus: string;
  latencyMs: number | null;
  lastError: string | null;
}) {
  const rows = [
    ["AI brain", providerLabel(aiMode)],
    ["Voice", voiceProviderLabel(voiceProvider)],
    ["CRM sync", crmStatus.includes("обнов") ? "active · updated" : "active"],
    ["Data", "synthetic"],
    ["Latency", latencyMs === null ? "—" : `${latencyMs} ms`],
    ["Last error", lastError ? lastError.slice(0, 88) : "none"],
  ] as const;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_80px_rgba(0,0,0,0.18),inset_0_1px_0_rgb(var(--signal-rgb)/0.05)]">
      <div className="mb-3 flex items-center gap-2 text-signal-bright">
        <CircleDot className="size-4" aria-hidden="true" />
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em]">Provider status</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-md border border-white/10 bg-black/18 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className={cn("mt-1 truncate text-sm", label === "Last error" && value !== "none" ? "text-rose-200" : "text-slate-200")}>
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Ключи не отображаются. Ошибки показываются коротко, без stack trace.
      </p>
    </section>
  );
}

function LiveIntelligencePanel({
  result,
  providerMode,
  crmStatus,
  rows,
  leadId,
}: {
  result: AiDialogResult | null;
  providerMode: "llm" | "fallback";
  crmStatus: string;
  rows: Array<[string, string]>;
  leadId?: string;
}) {
  const score = result?.score ?? 0;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_100px_rgba(0,0,0,0.24),inset_0_1px_0_rgb(var(--signal-rgb)/0.06)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-signal-bright">
            <Gauge className="size-4" aria-hidden="true" />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em]">live intelligence</p>
          </div>
          <h3 className="mt-1 text-xl font-semibold text-white">Разбор в реальном времени</h3>
        </div>
        {result ? <LeadClassBadge value={result.leadClass} /> : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricBox label="Тон" value={result ? toneLabels[result.detectedTone] : "нет данных"} />
        <MetricBox label="Stage" value={result ? stageLabels[result.stage] : "нет данных"} />
        <MetricBox label="Class" value={result?.leadClass ?? "нет данных"} />
        <MetricBox label="Handoff" value={result ? (result.shouldHandoffToManager ? "да" : "нет") : "нет данных"} />
        <MetricBox label="Style" value={result ? styleLabels[result.responseStyle] : "нет данных"} />
        <MetricBox label="Mode" value={providerLabel(providerMode)} />
      </div>

      <div className="mt-4 rounded-lg border border-signal/16 bg-black/22 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal/75">score</span>
          <span className="text-2xl font-semibold text-white">{score}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-signal" style={{ width: `${score}%` }} />
        </div>
      </div>

      <InfoBlock icon={CircleDot} title="Next best question" text={result?.nextBestQuestion || "Появится после первого сообщения."} />

      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex items-center gap-2 text-signal-bright">
          <BadgeCheck className="size-4" aria-hidden="true" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]">extracted fields</p>
        </div>
        {rows.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-1 truncate text-sm text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">Поля появятся после сообщения лида.</p>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        <InfoBlock
          icon={AlertTriangle}
          title="Risk flags"
          text={result?.riskFlags.length ? result.riskFlags.join(", ") : "Критичных рисков нет."}
          danger={Boolean(result?.riskFlags.length)}
        />
        <InfoBlock icon={Bot} title="Выжимка менеджеру" text={result?.managerSummary || "Выжимка будет готова после анализа."} />
        <InfoBlock icon={Sparkles} title="Next action" text={result?.nextAction || "Следующий шаг появится после score."} />
        <InfoBlock
          icon={Database}
          title="Create/update CRM card"
          text={leadId ? `${crmStatus}: ${leadId}` : crmStatus}
        />
      </div>
    </section>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  text,
  danger,
}: {
  icon: typeof Bot;
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className={cn("mb-2 flex items-center gap-2", danger ? "text-rose-200" : "text-signal-bright")}>
        <Icon className="size-4" aria-hidden="true" />
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]">{title}</p>
      </div>
      <p className="text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
