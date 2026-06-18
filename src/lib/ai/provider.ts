import { buildMockLeadInsight } from "@/lib/rko/mock-ai";
import { buildAssistantContext, nextQuestionForMissingField, rkoAssistantSystemPrompt } from "@/lib/rko/assistant-prompt";
import type { DialogMessage, Lead, LeadDraft, LeadInsight, ScoreResult } from "@/lib/rko/types";

export type RkoAssistantInput = {
  sessionId: string;
  messages: DialogMessage[];
  draft: LeadDraft;
  score: ScoreResult;
  insight: LeadInsight;
  missingFields: string[];
  notes?: string[];
};

export type RkoAiProvider = {
  mode: "mock" | "llm";
  enrichLead(lead: Lead | LeadDraft, knownLeads?: Lead[]): Promise<LeadInsight>;
  streamAssistantReply(input: RkoAssistantInput): AsyncIterable<string>;
};

const leadInsightSystemPrompt = [
  rkoAssistantSystemPrompt,
  "Для managerSummary/scoreExplanation возвращай только валидный JSON без markdown.",
].join("\n");

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function compactText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function buildMockAssistantText(input: RkoAssistantInput) {
  const latestUser = input.messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
  const firstMissing = input.missingFields[0];
  const question = nextQuestionForMissingField(firstMissing || "contact");
  const needs = input.draft.needs.length > 0 ? "Задачу вижу: " : "Пока вижу общий интерес к РКО. ";
  const business = input.draft.businessType ? `${input.draft.businessType}` : "бизнес";
  const turnover = input.draft.monthlyTurnover ? `, оборот ${input.draft.monthlyTurnover}` : "";
  const safety = /паспорт|карта|код\s+из\s+(sms|смс)/i.test(latestUser)
    ? "Паспортные, банковские данные и коды здесь не нужны. "
    : "";

  if (input.missingFields.length === 0) {
    return compactText(`${safety}Понял: ${business}${turnover}. Данных достаточно, чтобы собрать карточку для менеджера. Последний вопрос: удобно передать заявку менеджеру сейчас? Это нужно, чтобы не потерять горячий лид после первого клика.`);
  }

  return compactText(`${safety}${needs}${business}${turnover}. Следующий вопрос: ${question.question} Это нужно, потому что ${question.why}`);
}

async function* chunkText(text: string, delayMs = 24): AsyncIterable<string> {
  const chunks = text.match(/.{1,16}(\s|$)/g) ?? [text];
  for (const chunk of chunks) {
    await sleep(delayMs);
    yield chunk;
  }
}

function mockProvider(): RkoAiProvider {
  return {
    mode: "mock",
    enrichLead: async (lead, knownLeads = []) => buildMockLeadInsight(lead, knownLeads),
    streamAssistantReply: async function* streamAssistantReply(input) {
      yield* chunkText(buildMockAssistantText(input));
    },
  };
}

function safeJson(text: string): Partial<LeadInsight> {
  try {
    return JSON.parse(text) as Partial<LeadInsight>;
  } catch {
    return {};
  }
}

function openAiCompatibleProvider(): RkoAiProvider {
  return {
    mode: "llm",
    enrichLead: async (lead, knownLeads = []) => {
      const fallback = buildMockLeadInsight(lead, knownLeads);
      const apiKey = process.env.OPENAI_API_KEY || process.env.RKO_LLM_API_KEY;
      const model = process.env.RKO_LLM_MODEL || process.env.OPENAI_MODEL;
      const baseUrl = process.env.RKO_LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

      if (!apiKey || !model) return fallback;

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: leadInsightSystemPrompt },
              {
                role: "user",
                content: JSON.stringify({
                  task: "Return JSON with managerSummary, scoreExplanation, recommendedRoute, nextAction, suggestedMessage, copilotSay, copilotAsk, copilotStep.",
                  lead,
                  deterministicFallback: fallback,
                }),
              },
            ],
          }),
        });

        if (!response.ok) return fallback;
        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content;
        if (!content) return fallback;
        const parsed = safeJson(content);
        return { ...fallback, ...parsed };
      } catch {
        return fallback;
      }
    },
    streamAssistantReply: async function* streamAssistantReply(input) {
      const fallback = buildMockAssistantText(input);
      const apiKey = process.env.OPENAI_API_KEY || process.env.RKO_LLM_API_KEY;
      const model = process.env.RKO_LLM_MODEL || process.env.OPENAI_MODEL;
      const baseUrl = process.env.RKO_LLM_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

      if (!apiKey || !model) {
        yield* chunkText(fallback);
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.35,
            stream: true,
            messages: [
              { role: "system", content: rkoAssistantSystemPrompt },
              { role: "system", content: buildAssistantContext(input) },
              ...input.messages.slice(-10).map((message) => ({
                role: message.role,
                content: message.content,
              })),
            ],
          }),
        });

        if (!response.ok || !response.body) {
          yield* chunkText(fallback);
          return;
        }

        yield* streamOpenAiDeltas(response);
      } catch {
        yield* chunkText(fallback);
      }
    },
  };
}

async function* streamOpenAiDeltas(response: Response): AsyncIterable<string> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Ignore malformed provider chunks and keep the demo alive.
      }
    }
  }
}

export function getRkoAiProvider(): RkoAiProvider {
  if ((process.env.OPENAI_API_KEY || process.env.RKO_LLM_API_KEY) && (process.env.RKO_LLM_MODEL || process.env.OPENAI_MODEL)) {
    return openAiCompatibleProvider();
  }
  return mockProvider();
}
