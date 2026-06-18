import { NextResponse } from "next/server";
import { safeDialog } from "@/lib/rko/lead-extractor";
import { listLeads } from "@/lib/rko/server-store";
import type { DialogMessage, LeadDraft } from "@/lib/rko/types";
import {
  DEFAULT_VC_AI_SETTINGS,
  type AiDialogResult,
  type VcAiDialogRequest,
  type VcAiDialogSettings,
} from "@/components/demo/vc-command/vc-ai-dialog-types";
import {
  buildFallbackAiDialog,
  redactSensitiveText,
  sanitizeAiDialogResult,
} from "@/components/demo/vc-command/vc-tone-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const AI_DIALOG_SYSTEM_PROMPT = `Ты AI-обработчик заявок для demo-продукта VC Command Center. Ты работаешь в нише РКО/ИП/ООО/Telegram/CPA лидгена. Твоя задача — вести короткий человеческий диалог, подстраиваясь под тон собеседника.

Ты НЕ обещаешь доход, approve, выплаты, обход проверок, протаскивание мотива, фейковые документы или замену менеджера.

Ты должен:
1. Определить тон пользователя.
2. Выбрать стиль ответа.
3. Извлечь поля лида.
4. Задать следующий лучший вопрос.
5. Посчитать score и класс A/B/C/D/F.
6. Подготовить выжимку менеджеру.
7. Решить, передавать ли менеджеру.
8. Вернуть строго JSON без markdown.

Стиль:
- коротко
- по-человечески
- без канцелярита
- без GPT-шного текста
- один следующий вопрос за раз
- если лид горячий — уверенно и быстро
- если лид сомневается — спокойно и с объяснением
- если лид мусорный — фильтруй и не называй горячим
- reply: максимум 2 коротких предложения
- nextBestQuestion: один вопрос

JSON schema:
{
  "reply": "string",
  "voiceText": "string",
  "detectedTone": "neutral|warm|skeptical|rushed|aggressive|confused|price_focused|bonus_hunter|high_intent",
  "responseStyle": "short_direct|warm_explainer|expert_confident|soft_closer|risk_filter|human_handoff",
  "stage": "greeting|intent|qualification|need|contact|handoff|nurture|reject",
  "nextBestQuestion": "string",
  "extractedFields": {
    "entityType": "string|null",
    "businessType": "string|null",
    "city": "string|null",
    "monthlyTurnover": "string|null",
    "needs": ["string"],
    "urgency": "string|null",
    "contact": "string|null",
    "currentBank": "string|null"
  },
  "score": 0,
  "leadClass": "A|B|C|D|F",
  "riskFlags": ["string"],
  "managerSummary": "string",
  "nextAction": "string",
  "shouldCreateLead": true,
  "shouldHandoffToManager": true
}

If unsafe request:
- reply must redirect safely.
- leadClass should be F or D.
- shouldHandoffToManager false.
- riskFlags must explain why.`;

function compact(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSettings(value?: Partial<VcAiDialogSettings>): VcAiDialogSettings {
  const toneMode = value?.toneMode;

  return {
    systemPrompt: typeof value?.systemPrompt === "string" && value.systemPrompt.trim()
      ? compact(value.systemPrompt).slice(0, 3000)
      : DEFAULT_VC_AI_SETTINGS.systemPrompt,
    stopFactors: Array.isArray(value?.stopFactors)
      ? value.stopFactors.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 12)
      : DEFAULT_VC_AI_SETTINGS.stopFactors,
    toneMode:
      toneMode === "balanced" ||
      toneMode === "expert" ||
      toneMode === "friendly" ||
      toneMode === "strict_filter" ||
      toneMode === "closer"
        ? toneMode
        : DEFAULT_VC_AI_SETTINGS.toneMode,
    voiceEnabled: typeof value?.voiceEnabled === "boolean" ? value.voiceEnabled : DEFAULT_VC_AI_SETTINGS.voiceEnabled,
  };
}

function stripJsonFences(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseJsonObject(value: string): unknown | null {
  const stripped = stripJsonFences(value);
  try {
    return JSON.parse(stripped) as unknown;
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(stripped.slice(start, end + 1)) as unknown;
    } catch {
      return null;
    }
  }
}

function latestUserText(messages: DialogMessage[]) {
  return messages.filter((message) => message.role === "user").map((message) => message.content).join("\n");
}

function redactDraftForLlm(draft: LeadDraft, messages: DialogMessage[]) {
  return {
    ...draft,
    telegram: draft.telegram ? "@demo_contact" : undefined,
    phone: draft.phone ? "[demo_contact]" : undefined,
    rawDialog: messages.map((message) => ({
      ...message,
      content: redactSensitiveText(message.content),
    })),
  };
}

async function runLlmDialog(input: {
  messages: DialogMessage[];
  settings: VcAiDialogSettings;
  fallbackResult: AiDialogResult;
  fallbackDraft: LeadDraft;
}) {
  // Uses the same OpenAI-compatible server env contract as src/lib/ai/provider.ts.
  // Required: OPENAI_API_KEY or RKO_LLM_API_KEY, plus OPENAI_MODEL or RKO_LLM_MODEL.
  const apiKey = process.env.OPENAI_API_KEY || process.env.RKO_LLM_API_KEY;
  const model = process.env.RKO_LLM_MODEL || process.env.OPENAI_MODEL;
  const baseUrl = process.env.RKO_LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  if (!apiKey || !model) return null;

  const redactedMessages = input.messages.map((message) => ({
    ...message,
    content: redactSensitiveText(message.content),
  }));
  const latestText = latestUserText(input.messages);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: AI_DIALOG_SYSTEM_PROMPT },
          {
            role: "system",
            content: [
              `Настройки демо-агента: toneMode=${input.settings.toneMode}.`,
              `Голос включен: ${input.settings.voiceEnabled ? "да" : "нет"}.`,
              `Пользовательский промпт: ${input.settings.systemPrompt}`,
              `Стоп-факторы: ${input.settings.stopFactors.join(", ") || "нет"}.`,
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Return only AiDialogResult JSON. Use deterministic fallback as grounding, but improve wording if useful.",
              messages: redactedMessages,
              extractedDraft: redactDraftForLlm(input.fallbackDraft, redactedMessages),
              deterministicFallback: input.fallbackResult,
            }),
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = parseJsonObject(content);
    if (!parsed) return null;
    return sanitizeAiDialogResult(parsed, input.fallbackResult, latestText);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: VcAiDialogRequest;

  try {
    body = (await request.json()) as VcAiDialogRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId || `vc_${Date.now()}`;
  const messages = safeDialog(body.messages ?? []);

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages" }, { status: 400 });
  }

  const settings = normalizeSettings(body.settings);
  const knownLeads = await listLeads();
  const llmConfigured = Boolean(
    (process.env.OPENAI_API_KEY || process.env.RKO_LLM_API_KEY) &&
      (process.env.RKO_LLM_MODEL || process.env.OPENAI_MODEL),
  );
  const fallback = buildFallbackAiDialog({
    messages,
    currentLeadDraft: body.currentLeadDraft,
    knownLeads,
    settings,
    sessionId,
  });
  const llmResult = await runLlmDialog({
    messages,
    settings,
    fallbackResult: fallback.result,
    fallbackDraft: fallback.draft,
  });

  return NextResponse.json(
    {
      result: llmResult ?? fallback.result,
      draft: fallback.draft,
      providerMode: llmResult ? "llm" : "fallback",
      notes: fallback.notes,
      diagnostics: {
        llmConfigured,
        providerError: llmConfigured && !llmResult ? "LLM недоступен, включены fallback rules" : undefined,
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
