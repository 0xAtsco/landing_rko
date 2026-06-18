import { campaigns, leadSources } from "./constants";
import type { DialogMessage, EntityType, LeadDraft, LeadNeed, LeadSource, Urgency } from "./types";

type ExtractionResult = {
  draft: LeadDraft;
  missingFields: string[];
  notes: string[];
};

const cityMatchers: Array<{ pattern: RegExp; city: string }> = [
  { pattern: /москв/i, city: "Москва" },
  { pattern: /спб|санкт-петербург|питер/i, city: "СПб" },
  { pattern: /казан/i, city: "Казань" },
  { pattern: /екатеринбург/i, city: "Екатеринбург" },
  { pattern: /новосибирск/i, city: "Новосибирск" },
  { pattern: /краснодар/i, city: "Краснодар" },
  { pattern: /нижн\w*\s+новгород/i, city: "Нижний Новгород" },
  { pattern: /самар/i, city: "Самара" },
  { pattern: /ростов/i, city: "Ростов" },
  { pattern: /воронеж/i, city: "Воронеж" },
  { pattern: /перм/i, city: "Пермь" },
  { pattern: /уф[аеы]?/i, city: "Уфа" },
  { pattern: /сочи/i, city: "Сочи" },
];

const needMatchers: Array<{ need: LeadNeed; patterns: RegExp[] }> = [
  { need: "rko", patterns: [/рко/i, /расч[её]тн\w*\s+сч[её]т/i, /сч[её]т/i, /открыть\s+сч[её]т/i] },
  { need: "ip_registration", patterns: [/регистрац\w*\s+ип/i, /открыть\s+ип/i, /оформить\s+ип/i] },
  { need: "ooo_registration", patterns: [/регистрац\w*\s+ооо/i, /открыть\s+ооо/i, /оформить\s+ооо/i] },
  { need: "acquiring", patterns: [/эквайр/i, /терминал/i, /оплат\w*\s+карт/i] },
  { need: "accounting", patterns: [/бухгалтер/i, /отч[её]тност/i, /налог/i] },
  { need: "salary_project", patterns: [/зарплат/i, /сотрудник/i] },
  { need: "credit", patterns: [/кредит/i, /овердрафт/i, /финансирован/i] },
  { need: "currency_control", patterns: [/валют/i, /вэд/i, /экспорт/i, /импорт/i] },
];

const sensitivePatterns = [/паспорт/i, /снилс/i, /инн\s*\d/i, /номер\s+карты/i, /код\s+из\s+sms/i, /код\s+из\s+смс/i];

function now() {
  return new Date().toISOString();
}

function normalizeSource(value?: string): LeadSource {
  return leadSources.includes(value as LeadSource) ? (value as LeadSource) : "warm_telegram";
}

function normalizeCampaign(value?: string) {
  return value && campaigns.includes(value as (typeof campaigns)[number]) ? value : campaigns[0];
}

export function createEmptyLeadDraft(source?: string, campaign?: string, sessionId?: string): LeadDraft {
  return {
    source: normalizeSource(source),
    campaign: normalizeCampaign(campaign),
    creative: sessionId ? `live_ai:${sessionId}` : "live_ai_chat",
    entityType: "unknown",
    businessType: "",
    city: "",
    monthlyTurnover: "",
    currentBank: "",
    needs: [],
    urgency: "unknown",
    rawDialog: [],
  };
}

function compact(value?: string) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

function latestUserText(messages: DialogMessage[]) {
  return messages.filter((message) => message.role === "user").map((message) => message.content).join("\n");
}

function detectEntity(text: string, current: EntityType): EntityType {
  if (/самозанят/i.test(text)) return "self_employed";
  if (/(планир|хочу|нужно|собира).{0,24}(открыть|оформить|зарегистр).{0,24}ооо/i.test(text)) return "planning_ooo";
  if (/(планир|хочу|нужно|собира).{0,24}(открыть|оформить|зарегистр).{0,24}ип/i.test(text)) return "planning_ip";
  if (/(у\s+меня|есть|уже).{0,18}ооо|ооо\s+(есть|уже|открыто)/i.test(text)) return "ooo_exists";
  if (/(у\s+меня|есть|уже).{0,18}ип|ип\s+(есть|уже|открыт|открыто)/i.test(text)) return "ip_exists";
  if (/нет\s+(ип|ооо)|не\s+оформ/i.test(text)) return "unknown";
  return current;
}

function detectNeeds(text: string, current: LeadNeed[]) {
  const needs = new Set(current);
  for (const matcher of needMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(text))) {
      needs.add(matcher.need);
    }
  }
  return Array.from(needs);
}

function detectUrgency(text: string, current: Urgency): Urgency {
  if (/сегодня|сейчас|срочно|как можно быстрее|завтра/i.test(text)) return "today";
  if (/недел|пару\s+дней|2-3\s+дня|два\s+дня|три\s+дня/i.test(text)) return "week";
  if (/месяц|в\s+течение\s+месяца/i.test(text)) return "month";
  if (/потом|позже|когда-нибудь|не\s+срочно/i.test(text)) return "later";
  return current;
}

function detectTurnover(text: string, current?: string) {
  const turnover = text.match(/(?:оборот|выручк\w*|примерно|около)?\s*(\d+[,.]?\d*)\s*(к|тыс|млн|м|миллион\w*)/i);
  if (!turnover) return current;
  return `${turnover[1].replace(".", ",")}${turnover[2].toLowerCase()}`;
}

function detectCity(text: string, current?: string) {
  const matched = cityMatchers.find((item) => item.pattern.test(text));
  return matched?.city ?? current;
}

function detectBusinessType(text: string, current?: string) {
  const normalized = compact(current);
  const patterns: Array<[RegExp, string]> = [
    [/маркетплейс|wildberries|ozon|вайлдбер/i, "маркетплейсы"],
    [/доставк/i, "доставка"],
    [/кофейн|кафе|ресторан/i, "общепит"],
    [/услуг/i, "услуги"],
    [/ремонт/i, "ремонт"],
    [/салон|beauty|красот/i, "сфера красоты"],
    [/опт|торгов/i, "торговля"],
    [/онлайн-школ|курс|обучен/i, "онлайн-образование"],
    [/консалт|агентств/i, "B2B услуги"],
  ];
  const matched = patterns.find(([pattern]) => pattern.test(text));
  if (matched) return matched[1];

  const phrase = text.match(/(?:занимаюсь|занимаемся|бизнес\s+по|делаем|прода[её]м)\s+([^.!?,\n]{4,70})/i)?.[1];
  if (phrase) return compact(phrase);
  return normalized;
}

function detectBank(text: string, current?: string) {
  if (/банк\s*a|банк\s+а/i.test(text)) return "Банк A";
  if (/банк\s*b|банк\s+б/i.test(text)) return "Банк B";
  if (/банк\s*c|банк\s+ц|банк\s+с/i.test(text)) return "Банк C";
  if (/(сбер|тиньк|альфа|точка|модуль|втб|райф|газпром)/i.test(text)) return "Банк A";
  return compact(current);
}

function detectTelegram(text: string, current?: string) {
  return text.match(/@[a-zA-Z0-9_]{4,32}/)?.[0] || compact(current);
}

function detectPhone(text: string, current?: string) {
  const candidates = text.match(/(?:\+7|8)?[\s(.-]*\d{3}[\s).-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/g) ?? [];
  const phone = candidates.map((item) => item.replace(/[^\d+]/g, "")).find((item) => item.replace(/\D/g, "").length >= 10);
  return phone || compact(current);
}

function detectName(text: string, current?: string) {
  const name = text.match(/меня\s+зовут\s+([А-ЯЁA-Z][а-яёa-z-]{2,20})/i)?.[1];
  return name || compact(current);
}

function missingFields(draft: LeadDraft) {
  const missing: string[] = [];
  if (draft.entityType === "unknown" || draft.entityType === "self_employed") missing.push("entity");
  if (!compact(draft.businessType)) missing.push("businessType");
  if (!compact(draft.city)) missing.push("city");
  if (!compact(draft.monthlyTurnover)) missing.push("monthlyTurnover");
  if (draft.needs.length === 0) missing.push("needs");
  if (draft.urgency === "unknown") missing.push("urgency");
  if (!compact(draft.telegram) && !compact(draft.phone)) missing.push("contact");
  return missing;
}

export function extractLeadDraft(input: {
  messages: DialogMessage[];
  currentLeadDraft?: Partial<LeadDraft>;
  source?: string;
  campaign?: string;
  sessionId?: string;
}): ExtractionResult {
  const base = createEmptyLeadDraft(input.source, input.campaign, input.sessionId);
  const current = { ...base, ...input.currentLeadDraft };
  const text = latestUserText(input.messages);
  const notes: string[] = [];
  const draft: LeadDraft = {
    ...current,
    source: normalizeSource(input.source ?? current.source),
    campaign: normalizeCampaign(input.campaign ?? current.campaign),
    creative: current.creative || base.creative,
    name: detectName(text, current.name) || undefined,
    telegram: detectTelegram(text, current.telegram) || undefined,
    phone: detectPhone(text, current.phone) || undefined,
    entityType: detectEntity(text, current.entityType ?? "unknown"),
    businessType: detectBusinessType(text, current.businessType),
    city: detectCity(text, current.city),
    monthlyTurnover: detectTurnover(text, current.monthlyTurnover),
    currentBank: detectBank(text, current.currentBank) || undefined,
    needs: detectNeeds(text, current.needs ?? []),
    urgency: detectUrgency(text, current.urgency ?? "unknown"),
    rawDialog: input.messages.map((message) => ({ ...message, createdAt: message.createdAt || now() })),
  };

  if (sensitivePatterns.some((pattern) => pattern.test(text))) {
    notes.push("Пользователь упомянул чувствительные данные. AI не должен их запрашивать или сохранять.");
  }
  if (draft.currentBank && !["Банк A", "Банк B", "Банк C"].includes(draft.currentBank)) {
    draft.currentBank = "Банк A";
  }

  return { draft, missingFields: missingFields(draft), notes };
}

export function safeDialog(messages: Array<Partial<DialogMessage>>): DialogMessage[] {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role as DialogMessage["role"],
      content: compact(message.content).slice(0, 1200),
      createdAt: message.createdAt || now(),
    }))
    .filter((message) => message.content.length > 0);
}
