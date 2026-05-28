import type { EntityType, LeadNeed, LeadSource, RiskFlag, Urgency } from "./types";

export const RKO_STORAGE_KEY = "vibecamp:rko-leads:v1";

export const leadSources: LeadSource[] = [
  "warm_telegram",
  "google_ads",
  "cpa_partner_1",
  "cpa_partner_2",
  "bad_motiv",
  "referral",
];

export const campaigns = [
  "rko_marketplace",
  "fast_ip",
  "acquiring",
  "accounting",
  "generic_rko",
] as const;

export const sourceLabels: Record<LeadSource, string> = {
  warm_telegram: "Тёплый Telegram",
  google_ads: "Google Ads",
  cpa_partner_1: "CPA партнёр 1",
  cpa_partner_2: "CPA партнёр 2",
  bad_motiv: "Мотив-трафик",
  referral: "Рефералы",
};

export const campaignLabels: Record<string, string> = {
  rko_marketplace: "РКО для маркетплейсов",
  fast_ip: "Быстро открыть ИП",
  acquiring: "Эквайринг",
  accounting: "Бухгалтерия",
  generic_rko: "РКО общий",
};

export const entityLabels: Record<EntityType, string> = {
  ip_exists: "ИП есть",
  ooo_exists: "ООО есть",
  planning_ip: "Планирует ИП",
  planning_ooo: "Планирует ООО",
  self_employed: "Самозанятый",
  unknown: "Неясно",
};

export const needLabels: Record<LeadNeed, string> = {
  rko: "РКО",
  ip_registration: "регистрация ИП",
  ooo_registration: "регистрация ООО",
  acquiring: "эквайринг",
  accounting: "бухгалтерия",
  salary_project: "зарплатный проект",
  credit: "кредитование",
  currency_control: "ВЭД",
};

export const urgencyLabels: Record<Urgency, string> = {
  today: "сегодня",
  week: "на неделе",
  month: "в течение месяца",
  later: "позже",
  unknown: "неясно",
};

export const riskLabels: Record<RiskFlag, string> = {
  no_contact: "нет контакта",
  no_business_intent: "нет бизнес-намерения",
  no_entity: "нет ИП/ООО",
  not_ready: "не готов",
  duplicate: "дубль",
  motivated_traffic: "мотив",
  contradictory_answers: "противоречия",
  empty_answers: "пустые ответы",
  bad_source: "слабый источник",
};

export const allNeeds = Object.keys(needLabels) as LeadNeed[];

export const leadQuestions = [
  "ИП/ООО уже есть или только планируете открыть?",
  "Чем занимается бизнес?",
  "В каком городе работаете?",
  "Примерный оборот в месяц?",
  "Что нужно: РКО, регистрация, эквайринг, бухгалтерия, зарплатный проект, кредит или ВЭД?",
  "Есть текущий банк?",
  "Когда хотите открыть счёт или решить задачу?",
  "Можно передать заявку менеджеру?",
  "Какой контакт для связи: Telegram или телефон?",
];

export const classLabels = {
  A: "горячий",
  B: "хороший",
  C: "прогрев",
  D: "низкий",
  F: "мусор / дубль",
} as const;
