import { entityLabels, needLabels, riskLabels, urgencyLabels } from "@/lib/rko/constants";
import { extractLeadDraft } from "@/lib/rko/lead-extractor";
import { buildMockLeadInsight } from "@/lib/rko/mock-ai";
import { scoreLead } from "@/lib/rko/scoring";
import type { DialogMessage, Lead, LeadDraft, RiskFlag } from "@/lib/rko/types";
import {
  DEFAULT_VC_AI_SETTINGS,
  type AiDialogResult,
  type DialogStage,
  type LeadTone,
  type ResponseStyle,
  type VcAiDialogSettings,
} from "./vc-ai-dialog-types";

type FallbackInput = {
  messages: DialogMessage[];
  currentLeadDraft?: Partial<LeadDraft>;
  knownLeads?: Lead[];
  settings?: Partial<VcAiDialogSettings>;
  sessionId?: string;
};

type FallbackOutput = {
  result: AiDialogResult;
  draft: LeadDraft;
  notes: string[];
};

const unsafePattern =
  /гарант\w*\s+(?:approve|апрув|одобрен|выдач|выплат)|обход\w*\s+провер|обойти\s+провер|фейк\w*\s+(?:док|данн|сайт)|поддельн\w*\s+(?:док|данн)|спам|массов\w*\s+рассыл|scrap|скрап|парсинг|протащ\w*\s+мотив|накрут/i;

const rudePattern = /идиот|дурак|туп\w*|бесит|заткни|отвали|нахер|хрен|бред/i;

const tonePatterns: Array<{ tone: LeadTone; patterns: RegExp[] }> = [
  {
    tone: "bonus_hunter",
    patterns: [/бонус|халяв|где\s+деньг|где\s+выплат|просто\s+забрать|мотив/i],
  },
  {
    tone: "skeptical",
    patterns: [/не.{0,18}верю|скам|сомнева|а\s+точно|докажи|почему\s+довер|очередн\w*\s+схем|схем/i],
  },
  {
    tone: "price_focused",
    patterns: [/цен[ауы]|сколько\s+стоит|дорого|бесплатн|комисс/i],
  },
  {
    tone: "confused",
    patterns: [/не\s+понимаю|объясни|я\s+новичок|с\s+нуля|как\s+это\s+работает|запутал/i],
  },
  {
    tone: "high_intent",
    patterns: [/открыть\s+(?:ип|ооо|сч[её]т)|расч[её]тн\w*\s+сч[её]т|рко|эквайр|оборот|зарплатн|бухгалтер|на\s+этой\s+неделе/i],
  },
  {
    tone: "rushed",
    patterns: [/быстро|срочно|сегодня|сейчас|завтра|как\s+можно\s+быстр/i],
  },
  {
    tone: "warm",
    patterns: [/привет|здравствуйте|добрый|спасибо|подскажите|пожалуйста/i],
  },
];

const questions: Record<string, string> = {
  entity: "ИП/ООО уже есть или нужно открыть?",
  businessType: "Чем занимается бизнес?",
  city: "В каком городе работаете?",
  monthlyTurnover: "Какой примерный оборот в месяц?",
  needs: "Что нужно первым: РКО, регистрация, эквайринг или бухгалтерия?",
  urgency: "Когда хотите решить задачу: сегодня, на неделе или позже?",
  contact: "Какой демо-контакт указать в карточке: Telegram или телефон?",
};

const safeRedirect =
  "Я не помогаю с обходом проверок или фейковыми данными. Могу показать, как легально упаковать реальный оффер, обработать заявки и отфильтровать мусор.";

function compact(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function latestUserText(messages: DialogMessage[]) {
  return messages.filter((message) => message.role === "user").map((message) => message.content).join("\n");
}

function hasAnyExtractedField(draft: LeadDraft) {
  return Boolean(
    draft.entityType !== "unknown" ||
      draft.businessType?.trim() ||
      draft.city?.trim() ||
      draft.monthlyTurnover?.trim() ||
      draft.needs.length > 0 ||
      draft.urgency !== "unknown" ||
      draft.telegram?.trim() ||
      draft.phone?.trim(),
  );
}

function hasContact(draft: LeadDraft) {
  return Boolean(draft.telegram?.trim() || draft.phone?.trim());
}

function riskTexts(flags: RiskFlag[]) {
  return flags.map((flag) => riskLabels[flag] ?? flag);
}

function classFromScore(score: number): AiDialogResult["leadClass"] {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

function stageFor(input: {
  draft: LeadDraft;
  missingFields: string[];
  leadClass: AiDialogResult["leadClass"];
  unsafe: boolean;
  tone: LeadTone;
}): DialogStage {
  if (input.unsafe || input.tone === "bonus_hunter") return "reject";
  if (input.missingFields.includes("entity")) return "intent";
  if (input.missingFields.includes("needs")) return "need";
  if (input.missingFields.includes("contact")) return "contact";
  if (input.leadClass === "A" || input.leadClass === "B") return "handoff";
  if (input.leadClass === "C") return "qualification";
  return hasAnyExtractedField(input.draft) ? "nurture" : "greeting";
}

function styleFor(tone: LeadTone, stage: DialogStage): ResponseStyle {
  if (stage === "reject" || tone === "bonus_hunter") return "risk_filter";
  if (stage === "handoff") return "human_handoff";
  if (tone === "high_intent" || tone === "rushed") return "short_direct";
  if (tone === "confused" || tone === "warm") return "warm_explainer";
  if (tone === "skeptical") return "expert_confident";
  if (tone === "price_focused") return "soft_closer";
  if (tone === "aggressive") return "risk_filter";
  return "expert_confident";
}

function nextQuestion(missingFields: string[], stage: DialogStage) {
  const field = missingFields.find((item) => item in questions);
  if (field) return questions[field];
  if (stage === "handoff") return "Удобно передать демо-выжимку менеджеру сейчас?";
  if (stage === "reject") return "Есть реальная бизнес-задача без обходов и фейковых данных?";
  return "Какую задачу по РКО нужно решить первой?";
}

export function detectUnsafeAiDialogRequest(text: string) {
  return unsafePattern.test(text);
}

export function detectLeadTone(text: string): LeadTone {
  if (rudePattern.test(text)) return "aggressive";
  for (const matcher of tonePatterns) {
    if (matcher.patterns.some((pattern) => pattern.test(text))) return matcher.tone;
  }
  return "neutral";
}

function replyFor(input: {
  tone: LeadTone;
  stage: DialogStage;
  question: string;
  draft: LeadDraft;
  unsafe: boolean;
  score: number;
  leadClass: AiDialogResult["leadClass"];
}) {
  if (input.unsafe) return safeRedirect;

  const business = input.draft.businessType || "задачу";
  const city = input.draft.city ? `, ${input.draft.city}` : "";
  const turnover = input.draft.monthlyTurnover ? `, оборот ${input.draft.monthlyTurnover}` : "";
  const leadSignal = `Score ${input.score}, класс ${input.leadClass}.`;

  if (input.tone === "bonus_hunter") {
    return `Бонус сам по себе не делает заявку горячей. Сначала проверяю реальную задачу; мотив не отдаю менеджеру. ${input.question}`;
  }
  if (input.tone === "confused") {
    return `Коротко: РКО — это счёт для бизнеса и базовые сервисы вокруг него. Я соберу минимум полей без лишних данных. ${input.question}`;
  }
  if (input.tone === "skeptical") {
    return `Нормально сомневаться. В демо видно найденные поля, score и причину, почему заявка идёт или не идёт менеджеру. ${input.question}`;
  }
  if (input.tone === "price_focused") {
    return `По стоимости важно смотреть не только цену, а задачу: счёт, регистрация, эквайринг, бухгалтерия. ${input.question}`;
  }
  if (input.tone === "aggressive") {
    return `Давайте без давления. Я могу обработать заявку только по реальной бизнес-задаче и безопасным данным. ${input.question}`;
  }
  if (input.tone === "rushed") {
    return `Понял, нужен быстрый разбор. ${leadSignal} Соберу минимум данных для менеджера. ${input.question}`;
  }
  if (input.tone === "high_intent") {
    return `Понял: ${business}${city}${turnover}. ${leadSignal} ${input.question}`;
  }
  if (input.stage === "handoff") {
    return `Данных достаточно для демо-карточки. ${leadSignal} ${input.question}`;
  }

  return `Понял сообщение. Собираю короткую карточку и следующий шаг. ${input.question}`;
}

function extractedFieldsFor(draft: LeadDraft): AiDialogResult["extractedFields"] {
  return {
    entityType: entityLabels[draft.entityType],
    businessType: draft.businessType || undefined,
    city: draft.city || undefined,
    monthlyTurnover: draft.monthlyTurnover || undefined,
    needs: draft.needs.map((need) => needLabels[need]),
    urgency: urgencyLabels[draft.urgency],
    contact: hasContact(draft) ? "указан" : undefined,
    currentBank: draft.currentBank || undefined,
  };
}

function sanitizeManagerSummary(summary: string, draft: LeadDraft) {
  return compact(summary.replace(/Контакт:\s*[^.]+/i, `Контакт: ${hasContact(draft) ? "указан" : "не указан"}`));
}

export function redactSensitiveText(text: string) {
  return text
    .replace(/@[a-zA-Z0-9_]{4,32}/g, "@demo_contact")
    .replace(/(?:\+7|8)?[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/g, "[demo_contact]");
}

export function buildFallbackAiDialog(input: FallbackInput): FallbackOutput {
  const messages = input.messages;
  const settings = { ...DEFAULT_VC_AI_SETTINGS, ...input.settings };
  const text = latestUserText(messages);
  const unsafe = detectUnsafeAiDialogRequest(text);
  const tone = unsafe ? detectLeadTone(text) : detectLeadTone(text);
  const source = tone === "bonus_hunter" ? "bad_motiv" : "warm_telegram";
  const extracted = extractLeadDraft({
    messages,
    currentLeadDraft: input.currentLeadDraft,
    source,
    campaign: tone === "rushed" ? "fast_ip" : "rko_marketplace",
    sessionId: input.sessionId,
  });
  const scoring = scoreLead(extracted.draft, input.knownLeads ?? []);
  const riskFlags = new Set(scoring.riskFlags);

  if (unsafe) {
    riskFlags.add("bad_source");
    riskFlags.add("no_business_intent");
  }
  if (tone === "bonus_hunter") {
    riskFlags.add("motivated_traffic");
    riskFlags.add("bad_source");
  }

  const forcedScore = unsafe || tone === "bonus_hunter" ? Math.min(scoring.score, 25) : scoring.score;
  const forcedClass = unsafe || tone === "bonus_hunter" ? (forcedScore >= 20 ? "D" : "F") : scoring.leadClass;
  const leadClass = forcedClass || classFromScore(forcedScore);
  const missingFields = extracted.missingFields;
  const stage = stageFor({ draft: extracted.draft, missingFields, leadClass, unsafe, tone });
  const responseStyle = styleFor(tone, stage);
  const question = nextQuestion(missingFields, stage);
  const insight = buildMockLeadInsight(
    {
      ...extracted.draft,
      id: `preview_${input.sessionId ?? Date.now()}`,
      createdAt: new Date().toISOString(),
      score: forcedScore,
      leadClass,
      riskFlags: Array.from(riskFlags),
      recommendedRoute: "",
      nextAction: "",
      managerSummary: "",
      status: "new",
    },
    input.knownLeads ?? [],
  );
  const reply = replyFor({
    tone,
    stage,
    question,
    draft: extracted.draft,
    unsafe,
    score: forcedScore,
    leadClass,
  });
  const stopFactorNote =
    settings.stopFactors.length > 0
      ? `Стоп-факторы активны: ${settings.stopFactors.slice(0, 3).join(", ")}.`
      : "";
  const shouldHandoffToManager =
    !unsafe &&
    tone !== "bonus_hunter" &&
    (leadClass === "A" || leadClass === "B") &&
    !riskFlags.has("duplicate") &&
    !riskFlags.has("motivated_traffic");
  const shouldCreateLead =
    !unsafe &&
    tone !== "bonus_hunter" &&
    leadClass !== "F" &&
    !riskFlags.has("duplicate") &&
    (forcedScore >= 40 || hasAnyExtractedField(extracted.draft));
  const riskFlagTexts = riskTexts(Array.from(riskFlags));

  return {
    draft: extracted.draft,
    notes: [...extracted.notes, stopFactorNote].filter(Boolean),
    result: {
      reply,
      voiceText: reply,
      detectedTone: tone,
      responseStyle,
      stage,
      nextBestQuestion: question,
      extractedFields: extractedFieldsFor(extracted.draft),
      score: forcedScore,
      leadClass,
      riskFlags: unsafe ? Array.from(new Set([...riskFlagTexts, "запрос про обход или фейковые данные"])) : riskFlagTexts,
      managerSummary: unsafe
        ? "Запрос про обход/фейковые данные. Менеджеру не отдавать как горячий лид."
        : sanitizeManagerSummary(insight.managerSummary, extracted.draft),
      nextAction: unsafe
        ? "Ответить безопасным редиректом и не создавать горячую карточку."
        : shouldHandoffToManager
          ? "Передать менеджеру демо-выжимку после подтверждения контакта."
          : insight.nextAction,
      shouldCreateLead,
      shouldHandoffToManager,
    },
  };
}

const leadTones: LeadTone[] = [
  "neutral",
  "warm",
  "skeptical",
  "rushed",
  "aggressive",
  "confused",
  "price_focused",
  "bonus_hunter",
  "high_intent",
];

const stages: DialogStage[] = [
  "greeting",
  "intent",
  "qualification",
  "need",
  "contact",
  "handoff",
  "nurture",
  "reject",
];

const responseStyles: ResponseStyle[] = [
  "short_direct",
  "warm_explainer",
  "expert_confident",
  "soft_closer",
  "risk_filter",
  "human_handoff",
];

function safeString(value: unknown, fallback: string, limit = 900) {
  return typeof value === "string" && value.trim() ? compact(value).slice(0, limit) : fallback;
}

function safeStringArray(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => compact(item).slice(0, 120));
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeExtractedFields(value: unknown, fallback: AiDialogResult["extractedFields"]) {
  if (!value || typeof value !== "object") return fallback;
  const item = value as Record<string, unknown>;

  return {
    entityType: safeString(item.entityType, fallback.entityType ?? "", 80) || undefined,
    businessType: safeString(item.businessType, fallback.businessType ?? "", 120) || undefined,
    city: safeString(item.city, fallback.city ?? "", 80) || undefined,
    monthlyTurnover: safeString(item.monthlyTurnover, fallback.monthlyTurnover ?? "", 80) || undefined,
    needs: safeStringArray(item.needs, fallback.needs ?? []),
    urgency: safeString(item.urgency, fallback.urgency ?? "", 80) || undefined,
    contact: safeString(item.contact, fallback.contact ?? "", 80) || undefined,
    currentBank: safeString(item.currentBank, fallback.currentBank ?? "", 80) || undefined,
  };
}

export function sanitizeAiDialogResult(value: unknown, fallback: AiDialogResult, latestText: string): AiDialogResult {
  if (!value || typeof value !== "object") return fallback;
  const item = value as Record<string, unknown>;
  const score = Math.max(0, Math.min(100, Math.round(typeof item.score === "number" ? item.score : fallback.score)));
  const unsafe = detectUnsafeAiDialogRequest(latestText);
  const detectedTone = pickEnum(item.detectedTone, leadTones, fallback.detectedTone);
  const responseStyle = pickEnum(item.responseStyle, responseStyles, fallback.responseStyle);
  const stage = pickEnum(item.stage, stages, fallback.stage);
  const leadClass = pickEnum(item.leadClass, ["A", "B", "C", "D", "F"] as const, fallback.leadClass);
  const reply = safeString(item.reply, fallback.reply);

  if (unsafe) {
    return {
      ...fallback,
      reply: safeRedirect,
      voiceText: safeRedirect,
      detectedTone,
      responseStyle: "risk_filter",
      stage: "reject",
      score: Math.min(score, 25),
      leadClass: score >= 20 ? "D" : "F",
      riskFlags: Array.from(new Set([...fallback.riskFlags, "запрос про обход или фейковые данные"])),
      managerSummary: "Запрос про обход/фейковые данные. Менеджеру не отдавать как горячий лид.",
      nextAction: "Ответить безопасным редиректом и не создавать горячую карточку.",
      shouldCreateLead: false,
      shouldHandoffToManager: false,
    };
  }

  return {
    reply,
    voiceText: safeString(item.voiceText, reply),
    detectedTone,
    responseStyle,
    stage,
    nextBestQuestion: safeString(item.nextBestQuestion, fallback.nextBestQuestion, 240),
    extractedFields: normalizeExtractedFields(item.extractedFields, fallback.extractedFields),
    score,
    leadClass,
    riskFlags: safeStringArray(item.riskFlags, fallback.riskFlags),
    managerSummary: safeString(item.managerSummary, fallback.managerSummary),
    nextAction: safeString(item.nextAction, fallback.nextAction, 360),
    shouldCreateLead: typeof item.shouldCreateLead === "boolean" ? item.shouldCreateLead : fallback.shouldCreateLead,
    shouldHandoffToManager:
      typeof item.shouldHandoffToManager === "boolean" ? item.shouldHandoffToManager : fallback.shouldHandoffToManager,
  };
}
