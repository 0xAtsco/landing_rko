"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, CornerDownLeft, Play, Send, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMockLeadInsight } from "@/lib/rko/mock-ai";
import { campaigns, sourceLabels } from "@/lib/rko/constants";
import { createEmptyLeadDraft, extractLeadDraft } from "@/lib/rko/lead-extractor";
import { scenarioDraft } from "@/lib/rko/demo-scenarios";
import { scoreLead, statusForClass } from "@/lib/rko/scoring";
import { addLead } from "@/lib/rko/store";
import type { DialogMessage, Lead, LeadDraft, LeadInsight, LeadSource, ScoreResult } from "@/lib/rko/types";
import { cn } from "@/lib/utils";
import { LeadClassBadge } from "./LeadClassBadge";
import { ProcessingTheater, type TheaterStep, type TheaterStepId } from "./ProcessingTheater";
import { RiskFlags } from "./RiskFlags";

const scenarioMessages = {
  hot: "У меня ИП на маркетплейсах, оборот около 800к в месяц. Работаю в Казани, нужен расчётный счёт и эквайринг на этой неделе. Telegram @andrey_demo",
  medium: "Планирую открыть ИП для доставки готовой еды в СПб. Оборот пока около 300к, нужен счёт и регистрация ИП в течение месяца.",
  junk: "Я просто посмотреть, есть ли бонус за заявку. ИП нет, бизнес не веду, контакт оставлять не хочу.",
} as const;

const theaterOrder: Array<{ id: TheaterStepId; label: string }> = [
  { id: "received", label: "Получили сообщение" },
  { id: "extracted", label: "Извлекли данные" },
  { id: "needs", label: "Определили потребность" },
  { id: "scored", label: "Посчитали score" },
  { id: "risk", label: "Проверили риски и дубли" },
  { id: "summary", label: "Сформировали выжимку" },
  { id: "created", label: "Создали CRM-карточку" },
];

function now() {
  return new Date().toISOString();
}

function sourceFromQuery(value: string | null): LeadSource {
  const sources = Object.keys(sourceLabels) as LeadSource[];
  return value && sources.includes(value as LeadSource) ? (value as LeadSource) : "warm_telegram";
}

function createSessionId(playground: boolean, queryValue: string | null) {
  if (queryValue?.trim()) return queryValue.trim().slice(0, 80);
  if (typeof window === "undefined") return `session_${Date.now()}`;

  const key = playground ? "vibecamp:rko-playground-session" : "vibecamp:rko-live-chat-session";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `${playground ? "play" : "live"}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  window.localStorage.setItem(key, created);
  return created;
}

function buildSteps(active?: TheaterStepId, doneIds: TheaterStepId[] = []): TheaterStep[] {
  return theaterOrder.map((step) => ({
    ...step,
    state: doneIds.includes(step.id) ? "done" : active === step.id ? "active" : "idle",
  }));
}

function advanceStep(id: TheaterStepId, setSteps: (value: TheaterStep[]) => void) {
  const index = theaterOrder.findIndex((step) => step.id === id);
  const done = theaterOrder.slice(0, index + 1).map((step) => step.id);
  const next = theaterOrder[index + 1]?.id;
  setSteps(buildSteps(next, done));
}

function withRawDialog(draft: LeadDraft, messages: DialogMessage[]): LeadDraft {
  return {
    ...draft,
    rawDialog: messages.filter((message) => message.content.trim().length > 0),
  };
}

async function readSse(response: Response, onEvent: (event: string, data: unknown) => void) {
  if (!response.body) throw new Error("Empty stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const item of events) {
      const event = item.match(/^event:\s*(.+)$/m)?.[1]?.trim() || "message";
      const data = item.match(/^data:\s*(.+)$/m)?.[1]?.trim();
      if (!data) continue;
      try {
        onEvent(event, JSON.parse(data));
      } catch {
        // ignore a malformed SSE frame; keep the stream alive
      }
    }
  }
}

function localLeadFromDraft(draft: LeadDraft, score: ScoreResult, insight: LeadInsight): Lead {
  return {
    ...draft,
    id: `playground_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    createdAt: now(),
    score: score.score,
    leadClass: score.leadClass,
    riskFlags: score.riskFlags,
    recommendedRoute: insight.recommendedRoute,
    nextAction: insight.nextAction,
    managerSummary: insight.managerSummary,
    status: statusForClass(score.leadClass),
  };
}

export function LeadChat({ playground = false }: { playground?: boolean }) {
  const searchParams = useSearchParams();
  const source = sourceFromQuery(searchParams.get("source"));
  const campaign = searchParams.get("campaign") || campaigns[0];
  const [sessionId] = useState(() => createSessionId(playground, searchParams.get("sessionId")));
  const [presenterMode, setPresenterMode] = useState(!playground);
  const initialDraft = useMemo(() => createEmptyLeadDraft(source, campaign, sessionId), [campaign, sessionId, source]);
  const [draft, setDraft] = useState<LeadDraft>(initialDraft);
  const [scoreResult, setScoreResult] = useState<ScoreResult>(() => scoreLead(initialDraft));
  const [insight, setInsight] = useState<LeadInsight | null>(() => buildMockLeadInsight(initialDraft));
  const [missingFields, setMissingFields] = useState<string[]>(["entity", "businessType", "city", "monthlyTurnover", "needs", "urgency", "contact"]);
  const [steps, setSteps] = useState<TheaterStep[]>(() => buildSteps());
  const [messages, setMessages] = useState<DialogMessage[]>([
    {
      role: "assistant",
      content: playground
        ? "Напишите в свободной форме задачу по РКО. Я соберу mini-карточку и покажу, что передал бы менеджеру."
        : "Напишите как реальный лид: что за бизнес, что нужно по РКО и когда хотите решить задачу.",
      createdAt: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [streamMode, setStreamMode] = useState<"mock" | "llm" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const createdLeadRef = useRef<Lead | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    createdLeadRef.current = createdLead;
  }, [createdLead]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const createCrmCard = useCallback(async (draftOverride?: LeadDraft, dialogOverride?: DialogMessage[]) => {
    const sourceDraft = draftOverride ?? draft;
    const dialog = dialogOverride ?? messages;
    const readyDraft = withRawDialog(sourceDraft, dialog);
    const score = scoreLead(readyDraft);
    const readyInsight = insight ?? buildMockLeadInsight(readyDraft);

    if (creatingRef.current || createdLeadRef.current) return createdLeadRef.current;
    creatingRef.current = true;
    setIsCreating(true);
    setSteps((current) => current.map((step) => step.id === "created" ? { ...step, state: "active" } : step));

    try {
      const lead = playground
        ? localLeadFromDraft(readyDraft, score, readyInsight)
        : await addLead(readyDraft);
      setCreatedLead(lead);
      createdLeadRef.current = lead;
      setSteps(buildSteps(undefined, theaterOrder.map((step) => step.id)));
      return lead;
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  }, [draft, insight, messages, playground]);

  const sendUserText = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || isStreaming) return;

    setError(null);
    setInput("");
    setIsStreaming(true);
    setSteps(buildSteps("received"));

    const userMessage: DialogMessage = { role: "user", content, createdAt: now() };
    const nextMessages = [...messages, userMessage];
    const localExtraction = extractLeadDraft({ messages: nextMessages, currentLeadDraft: draft, source, campaign, sessionId });
    const localScore = scoreLead(localExtraction.draft);
    const localInsight = buildMockLeadInsight(localExtraction.draft);

    setDraft(localExtraction.draft);
    setScoreResult(localScore);
    setInsight(localInsight);
    setMissingFields(localExtraction.missingFields);
    setMessages([...nextMessages, { role: "assistant", content: "", createdAt: now() }]);
    advanceStep("received", setSteps);

    let streamedText = "";
    let latestDraft = localExtraction.draft;
    let latestScore = localScore;
    let latestInsight = localInsight;
    let latestMissing = localExtraction.missingFields;

    try {
      const response = await fetch("/api/rko/assistant/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: nextMessages,
          currentLeadDraft: draft,
          source,
          campaign,
        }),
      });

      if (!response.ok) throw new Error(`Assistant API ${response.status}`);

      await readSse(response, (event, data) => {
        if (event === "processing") {
          const step = (data as { step?: TheaterStepId }).step;
          if (step) advanceStep(step, setSteps);
        }

        if (event === "draft" || event === "done") {
          const payload = data as {
            draft?: LeadDraft;
            score?: ScoreResult;
            insight?: LeadInsight;
            missingFields?: string[];
            providerMode?: "mock" | "llm";
          };
          if (payload.draft) {
            latestDraft = payload.draft;
            setDraft(payload.draft);
          }
          if (payload.score) {
            latestScore = payload.score;
            setScoreResult(payload.score);
          }
          if (payload.insight) {
            latestInsight = payload.insight;
            setInsight(payload.insight);
          }
          if (payload.missingFields) {
            latestMissing = payload.missingFields;
            setMissingFields(payload.missingFields);
          }
          if (payload.providerMode) setStreamMode(payload.providerMode);
          if (event === "draft") {
            advanceStep("risk", setSteps);
          }
          if (event === "done") {
            advanceStep("summary", setSteps);
          }
        }

        if (event === "delta") {
          const chunk = (data as { text?: string }).text ?? "";
          streamedText += chunk;
          setMessages((current) => current.map((message, index) => (
            index === current.length - 1 ? { ...message, content: `${message.content}${chunk}` } : message
          )));
        }

        if (event === "error") {
          setError((data as { message?: string }).message || "Assistant stream failed");
        }
      });

      if (!streamedText.trim()) {
        streamedText = "Понял. Уточню один шаг, чтобы передать менеджеру понятную карточку: какой контакт удобнее оставить для связи?";
        setMessages((current) => current.map((message, index) => (
          index === current.length - 1 ? { ...message, content: streamedText } : message
        )));
      }

      setScoreResult(latestScore);
      setInsight(latestInsight);
      setMissingFields(latestMissing);

      const dialogWithAssistant = [
        ...nextMessages,
        { role: "assistant" as const, content: streamedText, createdAt: now() },
      ];
      const hasContact = Boolean(latestDraft.telegram || latestDraft.phone);
      if (hasContact && !createdLeadRef.current) {
        await createCrmCard(latestDraft, dialogWithAssistant);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось получить ответ AI");
      setMessages((current) => current.map((message, index) => (
        index === current.length - 1
          ? { ...message, content: "Не смог получить ответ, но карточку можно собрать из уже введённых данных. Попробуйте отправить ещё раз." }
          : message
      )));
    } finally {
      setIsStreaming(false);
    }
  }, [campaign, createCrmCard, draft, isStreaming, messages, sessionId, source]);

  const submitInput = useCallback(() => {
    void sendUserText(input);
  }, [input, sendUserText]);

  const loadScenario = useCallback((kind: keyof typeof scenarioMessages) => {
    const seeded = scenarioDraft(kind === "hot" ? "hot" : kind === "medium" ? "medium" : "junk", source, campaign);
    setDraft({ ...seeded, creative: playground ? `playground:${sessionId}` : "presenter_button" });
    setScoreResult(scoreLead(seeded));
    setInsight(buildMockLeadInsight(seeded));
    setMissingFields([]);
    void sendUserText(scenarioMessages[kind]);
  }, [campaign, playground, sendUserText, sessionId, source]);

  const resetForCustomQuestion = useCallback(() => {
    setInput("");
    setCreatedLead(null);
    createdLeadRef.current = null;
    setSteps(buildSteps());
  }, []);

  const chatTitle = playground ? "Public Playground" : "Live AI Chat";
  const showDashboardLink = createdLead && !playground;

  return (
    <div className={cn("mt-8 grid gap-5", presenterMode ? "lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]" : "lg:grid-cols-[minmax(0,1fr)_420px]")}>
      <section className="min-h-[640px] rounded-lg border border-signal/18 bg-white/[0.055] p-4 shadow-[0_24px_120px_rgb(var(--signal-rgb)/0.14)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-signal-bright">
              <Bot className="size-5" />
              <span className="font-mono text-xs uppercase tracking-[0.18em]">{chatTitle}</span>
            </div>
            <h3 className={cn("mt-2 font-semibold text-white", presenterMode ? "text-3xl" : "text-2xl")}>Свободный AI-чат по РКО</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Пишите обычным языком. AI ответит как консультант, обновит поля, score и подготовит карточку менеджеру.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPresenterMode((value) => !value)}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm transition",
              presenterMode ? "border-signal/35 bg-signal/12 text-signal-bright" : "border-white/10 bg-white/[0.045] text-slate-200 hover:bg-white/10",
            )}
          >
            <Play className="size-4" />
            Presenter mode
          </button>
        </div>

        <div className={cn("mt-5 grid gap-2", presenterMode ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2")}>
          <Button type="button" variant="outline" className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/16" onClick={() => loadScenario("hot")}>
            <Sparkles className="size-4" />
            Горячий РКО-лид
          </Button>
          <Button type="button" variant="outline" className="border-yellow-300/20 bg-yellow-300/10 text-yellow-100 hover:bg-yellow-300/16" onClick={() => loadScenario("medium")}>
            <Sparkles className="size-4" />
            Средний лид
          </Button>
          <Button type="button" variant="outline" className="border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/16" onClick={() => loadScenario("junk")}>
            <Sparkles className="size-4" />
            Мусор/мотив
          </Button>
          <Button type="button" variant="outline" className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10" onClick={resetForCustomQuestion}>
            <Wand2 className="size-4" />
            Задать свой вопрос
          </Button>
        </div>

        <div className={cn("mt-5 overflow-hidden rounded-lg border border-white/10 bg-black/24", presenterMode ? "min-h-[420px]" : "min-h-[360px]")}>
          <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}-${message.createdAt}`} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[86%] rounded-lg px-3 py-2 leading-6",
                    presenterMode ? "text-base" : "text-sm",
                    message.role === "user"
                      ? "bg-signal text-slate-950 shadow-[0_0_28px_rgb(var(--signal-rgb)/0.18)]"
                      : "border border-white/10 bg-white/[0.06] text-slate-100",
                    message.content.length === 0 && "min-h-10 min-w-24 animate-pulse",
                  )}
                >
                  {message.content || "AI печатает..."}
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                submitInput();
              }
            }}
            placeholder="Например: У меня ИП на маркетплейсах, оборот 800к, нужен счёт и эквайринг..."
            className={cn(
              "min-h-24 w-full resize-none rounded-md border border-white/10 bg-black/24 px-3 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-signal/45",
              presenterMode ? "text-base" : "text-sm",
            )}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CornerDownLeft className="size-4" />
              Cmd/Ctrl + Enter отправляет сообщение
              {streamMode ? <span className="rounded bg-white/8 px-2 py-1 text-signal-bright">mode: {streamMode}</span> : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/[0.055] text-white hover:bg-white/10"
                onClick={() => void createCrmCard()}
                disabled={isCreating}
                data-analytics="demo_submit_lead"
              >
                <CheckCircle2 className="size-4" />
                {isCreating ? "Создаём..." : "Создать CRM-карточку сейчас"}
              </Button>
              <Button type="button" className="bg-signal text-slate-950 hover:bg-signal-bright" onClick={submitInput} disabled={isStreaming || !input.trim()}>
                <Send className="size-4" />
                {isStreaming ? "AI отвечает..." : "Отправить"}
              </Button>
            </div>
          </div>
          {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
        </div>

        {createdLead ? (
          <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/8 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                  {playground ? "mini card готова" : "CRM-карточка создана"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <LeadClassBadge value={createdLead.leadClass} />
                  <span className="rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-slate-100">score {createdLead.score}/100</span>
                  <RiskFlags flags={createdLead.riskFlags} />
                </div>
              </div>
              {showDashboardLink ? (
                <Button asChild className="bg-emerald-200 text-slate-950 hover:bg-emerald-100" data-analytics="demo_open_dashboard">
                  <Link href="/demo/rko/dashboard">Открыть в dashboard <ArrowRight className="size-4" /></Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid content-start gap-4">
        <ProcessingTheater
          draft={draft}
          score={scoreResult}
          insight={insight}
          missingFields={missingFields}
          steps={steps}
          createdLead={createdLead}
          compact={!presenterMode}
        />
        {playground ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-slate-300 backdrop-blur-xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal/75">что увидит менеджер</p>
            <p className="mt-2">{insight?.managerSummary || "Пока AI ждёт больше данных."}</p>
            <p className="mt-3 text-signal-bright">{insight?.suggestedMessage || "После уточнения контакта AI подготовит короткое сообщение клиенту."}</p>
            <p className="mt-3 text-xs text-slate-500">Session: {sessionId}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
