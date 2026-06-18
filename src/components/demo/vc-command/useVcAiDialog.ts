"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addLead } from "@/lib/rko/store";
import type { DialogMessage, Lead, LeadDraft } from "@/lib/rko/types";
import {
  DEFAULT_VC_AI_SETTINGS,
  DEFAULT_VC_STOP_FACTORS,
  VC_AGENT_PROMPT_KEY,
  VC_SETTINGS_EVENT,
  VC_STOP_FACTORS_KEY,
  VC_TONE_MODE_KEY,
  VC_VOICE_ENABLED_KEY,
  type AiDialogResult,
  type VcAiDialogMessage,
  type VcAiDialogProviderMode,
  type VcAiDialogResponse,
  type VcAiDialogSettings,
  type VcAiScenarioId,
  type VcToneMode,
} from "./vc-ai-dialog-types";

export const vcAiScenarios: Record<VcAiScenarioId, { label: string; text: string }> = {
  hot: {
    label: "Горячий РКО",
    text: "Привет. Планирую открыть ИП и расчетный счет для маркетплейсов. Казань, оборот примерно 900к в месяц, нужен эквайринг и регистрация на этой неделе. Telegram @demo_market.",
  },
  confused: {
    label: "Новичок не понимает",
    text: "Я новичок и не понимаю, что нужно сначала. Хочу запустить маленькую доставку еды, ИП еще нет, город Самара.",
  },
  skeptical: {
    label: "Сомневается",
    text: "Не очень верю таким чатам. Как понять, что вы не просто собираете заявки? У меня ООО в услугах, город Пермь, счет нужен в течение месяца.",
  },
  bonus: {
    label: "Хочет бонус",
    text: "ИП нет, открывать ничего не планирую. Где бонус и выплата? Хочу просто забрать деньги без лишних вопросов.",
  },
  urgent: {
    label: "Срочно открыть",
    text: "Срочно нужен расчетный счет сегодня. ИП уже есть, занимаюсь ремонтом, город Уфа, оборот около 500к, нужен РКО и бухгалтерия.",
  },
};

type SendOptions = {
  reset?: boolean;
};

function previewResult(): AiDialogResult {
  return {
    reply: "Понял: маркетплейсы, Казань, оборот 700к–1м. Score 90, класс A. Какой демо-контакт указать в карточке: Telegram или телефон?",
    voiceText: "Понял: маркетплейсы, Казань, оборот 700к–1м. Score 90, класс A. Какой демо-контакт указать в карточке?",
    detectedTone: "high_intent",
    responseStyle: "short_direct",
    stage: "contact",
    nextBestQuestion: "Какой демо-контакт указать в карточке: Telegram или телефон?",
    extractedFields: {
      entityType: "Планирует ИП",
      businessType: "маркетплейсы",
      city: "Казань",
      monthlyTurnover: "700к–1м",
      needs: ["РКО", "эквайринг"],
      urgency: "на неделе",
    },
    score: 90,
    leadClass: "A",
    riskFlags: [],
    managerSummary: "Планирует ИП, маркетплейсы, Казань. Нужно: РКО и эквайринг. Оборот: 700к–1м. Срок: на неделе. Контакт ещё не указан.",
    nextAction: "Уточнить демо-контакт и обновить CRM карточку.",
    shouldCreateLead: false,
    shouldHandoffToManager: true,
  };
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function welcomeMessage(): VcAiDialogMessage {
  return {
    id: id("msg"),
    role: "assistant",
    content: "Напишите сообщение лида. Я определю тон, задам следующий вопрос, обновлю score и подготовлю выжимку менеджеру.",
    createdAt: now(),
  };
}

function previewMessages(): VcAiDialogMessage[] {
  const result = previewResult();
  return [
    {
      id: id("msg"),
      role: "user",
      content: "Привет, хочу открыть ИП и расчётный счёт. Работаю с маркетплейсами, оборот 700к–1м, Казань, нужен эквайринг. Открыть хочу на этой неделе.",
      createdAt: now(),
    },
    {
      id: id("msg"),
      role: "assistant",
      content: result.reply,
      createdAt: now(),
      result,
      providerMode: "fallback",
    },
  ];
}

function readString(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function readStringArray(key: string, fallback: readonly string[]) {
  if (typeof window === "undefined") return [...fallback];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null") as unknown;
    if (!Array.isArray(parsed)) return [...fallback];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [...fallback];
  }
}

function readToneMode() {
  if (typeof window === "undefined") return DEFAULT_VC_AI_SETTINGS.toneMode;
  const value = window.localStorage.getItem(VC_TONE_MODE_KEY);
  return value === "balanced" ||
    value === "expert" ||
    value === "friendly" ||
    value === "strict_filter" ||
    value === "closer"
    ? (value as VcToneMode)
    : DEFAULT_VC_AI_SETTINGS.toneMode;
}

function readVoiceEnabled() {
  if (typeof window === "undefined") return DEFAULT_VC_AI_SETTINGS.voiceEnabled;
  const value = window.localStorage.getItem(VC_VOICE_ENABLED_KEY);
  if (value === null) return DEFAULT_VC_AI_SETTINGS.voiceEnabled;
  return value === "true";
}

function readSettings(): VcAiDialogSettings {
  return {
    systemPrompt: readString(VC_AGENT_PROMPT_KEY, DEFAULT_VC_AI_SETTINGS.systemPrompt),
    stopFactors: readStringArray(VC_STOP_FACTORS_KEY, DEFAULT_VC_STOP_FACTORS),
    toneMode: readToneMode(),
    voiceEnabled: readVoiceEnabled(),
  };
}

function toDialogMessages(messages: VcAiDialogMessage[]): DialogMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));
}

function redactContactText(text: string) {
  return text
    .replace(/@[a-zA-Z0-9_]{4,32}/g, "@demo_contact")
    .replace(/(?:\+7|8)?[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/g, "[demo_contact]");
}

function stageReadyForCrm(stage: AiDialogResult["stage"]) {
  return stage === "qualification" || stage === "need" || stage === "contact" || stage === "handoff" || stage === "nurture";
}

function draftHasSignal(draft: LeadDraft) {
  return Boolean(
    draft.entityType !== "unknown" ||
      draft.businessType?.trim() ||
      draft.city?.trim() ||
      draft.monthlyTurnover?.trim() ||
      draft.needs.length > 0,
  );
}

function safeCrmDraft(draft: LeadDraft, dialog: DialogMessage[]): LeadDraft {
  const hasContact = Boolean(draft.telegram?.trim() || draft.phone?.trim());

  return {
    ...draft,
    name: undefined,
    telegram: hasContact ? `@vc_demo_${Date.now().toString(36)}` : undefined,
    phone: undefined,
    rawDialog: dialog.map((message) => ({
      ...message,
      content: redactContactText(message.content).slice(0, 1200),
    })),
  };
}

export function useVcAiDialog() {
  const [sessionId, setSessionId] = useState(() => id("vc_session"));
  const [messages, setMessages] = useState<VcAiDialogMessage[]>(() => previewMessages());
  const [draft, setDraft] = useState<LeadDraft | null>(null);
  const [result, setResult] = useState<AiDialogResult | null>(() => previewResult());
  const [providerMode, setProviderMode] = useState<VcAiDialogProviderMode>("fallback");
  const [settings, setSettings] = useState<VcAiDialogSettings>(() => readSettings());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [lastApiLatencyMs, setLastApiLatencyMs] = useState<number | null>(null);
  const [conversationLead, setConversationLead] = useState<Lead | null>(null);
  const [crmStatus, setCrmStatus] = useState("Preview: CRM обновится после сценария");
  const [preview, setPreview] = useState(true);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const creatingLeadRef = useRef(false);
  const conversationLeadRef = useRef<Lead | null>(null);

  useEffect(() => {
    conversationLeadRef.current = conversationLead;
  }, [conversationLead]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    const sync = () => setSettings(readSettings());
    window.addEventListener("storage", sync);
    window.addEventListener(VC_SETTINGS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(VC_SETTINGS_EVENT, sync);
    };
  }, []);

  const reset = useCallback(() => {
    setSessionId(id("vc_session"));
    setMessages(previewMessages());
    setDraft(null);
    setResult(previewResult());
    setProviderMode("fallback");
    setError(null);
    setProviderError(null);
    setLastApiLatencyMs(null);
    setConversationLead(null);
    setCrmStatus("Preview: CRM обновится после сценария");
    setPreview(true);
    creatingLeadRef.current = false;
    conversationLeadRef.current = null;
  }, []);

  const createCrmCard = useCallback(async (nextDraft: LeadDraft, nextResult: AiDialogResult, dialog: DialogMessage[]) => {
    if (conversationLeadRef.current) {
      setCrmStatus("CRM карточка уже создана");
      return conversationLeadRef.current;
    }
    if (creatingLeadRef.current) return null;

    const shouldCreate =
      nextResult.shouldCreateLead &&
      stageReadyForCrm(nextResult.stage) &&
      (nextResult.score >= 40 || draftHasSignal(nextDraft)) &&
      nextResult.leadClass !== "F";

    if (!shouldCreate) {
      setCrmStatus("Фильтр качества: CRM не обновлялась");
      return null;
    }

    creatingLeadRef.current = true;
    setCrmStatus("Создаю CRM карточку...");

    try {
      const lead = await addLead(safeCrmDraft(nextDraft, dialog));
      setConversationLead(lead);
      conversationLeadRef.current = lead;
      setCrmStatus("CRM карточка обновлена");
      return lead;
    } catch {
      setCrmStatus("CRM временно недоступна");
      return null;
    } finally {
      creatingLeadRef.current = false;
    }
  }, []);

  const sendUserText = useCallback(
    async (text: string, options: SendOptions = {}) => {
      const content = text.trim();
      if (!content || busy) return;

      const nextSettings = readSettings();
      const baseMessages = options.reset || preview ? [welcomeMessage()] : messages;
      const nextSessionId = options.reset ? id("vc_session") : sessionId;
      const userMessage: VcAiDialogMessage = {
        id: id("msg"),
        role: "user",
        content,
        createdAt: now(),
      };
      const outgoingMessages = [...baseMessages, userMessage];

      if (options.reset || preview) {
        setSessionId(nextSessionId);
        setDraft(null);
        setResult(null);
        setConversationLead(null);
        conversationLeadRef.current = null;
        setCrmStatus("CRM карточка не создана");
        setPreview(false);
      }

      setSettings(nextSettings);
      setMessages(outgoingMessages);
      setBusy(true);
      setError(null);
      setProviderError(null);

      try {
        const startedAt = performance.now();
        const response = await fetch("/api/vc-command/ai-dialog", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: nextSessionId,
            messages: toDialogMessages(outgoingMessages),
            currentLeadDraft: options.reset ? undefined : draft ?? undefined,
            settings: nextSettings,
          }),
        });

        if (!response.ok) throw new Error(`AI Dialog API ${response.status}`);
        const data = (await response.json()) as VcAiDialogResponse;
        setLastApiLatencyMs(Math.round(performance.now() - startedAt));
        setProviderError(data.diagnostics?.providerError ?? null);
        const assistantMessage: VcAiDialogMessage = {
          id: id("msg"),
          role: "assistant",
          content: data.result.reply,
          createdAt: now(),
          result: data.result,
          providerMode: data.providerMode,
        };
        const finalMessages = [...outgoingMessages, assistantMessage];
        const dialogForCrm = toDialogMessages(finalMessages);

        setMessages(finalMessages);
        setDraft(data.draft);
        setResult(data.result);
        setProviderMode(data.providerMode);
        await createCrmCard(data.draft, data.result, dialogForCrm);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "AI Dialog не ответил";
        setLastApiLatencyMs(null);
        setError(message);
        setProviderError(message);
        setProviderMode("fallback");
        setMessages((current) => [
          ...current,
          {
            id: id("msg"),
            role: "assistant",
            content: "Не смог получить ответ API. Демо живо: попробуйте отправить сообщение ещё раз.",
            createdAt: now(),
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, createCrmCard, draft, messages, preview, sessionId],
  );

  const runScenario = useCallback(
    (scenarioId: VcAiScenarioId) => {
      void sendUserText(vcAiScenarios[scenarioId].text, { reset: true });
    },
    [sendUserText],
  );

  return useMemo(
    () => ({
      busy,
      conversationLead,
      crmStatus,
      draft,
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
    }),
    [
      busy,
      conversationLead,
      crmStatus,
      draft,
      error,
      lastApiLatencyMs,
      messages,
      providerError,
      providerMode,
      result,
      settings,
      reset,
      runScenario,
      sendUserText,
    ],
  );
}
