import { buildMockLeadInsight } from "./mock-ai";
import { scoreLead, statusForClass } from "./scoring";
import type { EntityType, Lead, LeadDraft, LeadNeed, LeadSource, Urgency } from "./types";

const sourcePlan: Array<{ source: LeadSource; count: number; quality: "high" | "mid" | "low" | "mixed" | "dupes" }> = [
  { source: "warm_telegram", count: 14, quality: "high" },
  { source: "google_ads", count: 20, quality: "mid" },
  { source: "cpa_partner_1", count: 18, quality: "mixed" },
  { source: "cpa_partner_2", count: 20, quality: "dupes" },
  { source: "bad_motiv", count: 22, quality: "low" },
  { source: "referral", count: 6, quality: "high" },
];

const businesses = [
  "маркетплейсы, товары для дома",
  "услуги для бизнеса",
  "доставка еды",
  "кофейня",
  "онлайн-школа",
  "ремонт квартир",
  "B2B консалтинг",
  "салон красоты",
  "оптовая торговля",
  "непонятный бизнес, просто посмотреть",
];

const cities = ["Москва", "СПб", "Казань", "Екатеринбург", "Новосибирск", "Краснодар", "Нижний Новгород"];
const campaigns = ["rko_marketplace", "fast_ip", "acquiring", "accounting", "generic_rko"];
const needs: LeadNeed[][] = [
  ["rko", "acquiring"],
  ["rko", "salary_project"],
  ["ip_registration", "rko"],
  ["rko", "accounting"],
  ["rko"],
  ["ooo_registration", "rko"],
  ["rko", "currency_control"],
  ["credit"],
];

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

function createdAt(index: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - index * 17);
  return date.toISOString();
}

function draftFor(source: LeadSource, quality: "high" | "mid" | "low" | "mixed" | "dupes", index: number): LeadDraft {
  const high = quality === "high" || (quality === "mixed" && index % 3 === 0);
  const low = quality === "low" || (quality === "mixed" && index % 4 === 0);
  const duplicate = quality === "dupes" && index % 3 === 0;
  const entityType: EntityType = high ? pick(["ip_exists", "ooo_exists", "planning_ip"], index) : low ? pick(["unknown", "self_employed"], index) : pick(["planning_ip", "ip_exists", "planning_ooo"], index);
  const urgency: Urgency = high ? pick(["today", "week"], index) : low ? pick(["later", "unknown"], index) : pick(["week", "month", "unknown"], index);
  const contact = duplicate ? "@duplicate_partner" : source === "bad_motiv" && index % 2 === 0 ? "" : `@lead_${source}_${index}`;
  const businessType = low ? pick(["просто посмотреть", "не знаю, нужен ли счёт", "интересует бонус за заявку", ""], index) : pick(businesses, index);

  return {
    source,
    campaign: pick(campaigns, index),
    creative: `${source}_creative_${(index % 4) + 1}`,
    name: low ? undefined : pick(["Анна", "Илья", "Дмитрий", "Мария", "Олег", "Елена"], index),
    telegram: contact,
    phone: index % 5 === 0 && !contact ? "+7 900 000-00-00" : undefined,
    entityType,
    businessType,
    city: low && index % 2 === 0 ? "" : pick(cities, index),
    monthlyTurnover: low ? (index % 3 === 0 ? "" : "не знаю") : pick(["300к", "800к", "1.2м", "2м", "450к", "5м"], index),
    currentBank: high ? pick(["Банк A", "Банк B", "Банк C"], index) : undefined,
    needs: low ? [] : pick(needs, index),
    urgency,
    rawDialog: [
      { role: "assistant", content: "Расскажите, какая задача по РКО?", createdAt: createdAt(index) },
      { role: "user", content: `${businessType || "пустой ответ"}; ${pick(needs, index).join(", ")}`, createdAt: createdAt(index) },
      { role: "assistant", content: "Когда хотите решить задачу и какой контакт?", createdAt: createdAt(index) },
      { role: "user", content: `${urgency}; ${contact || "контакт не оставил"}`, createdAt: createdAt(index) },
    ],
  };
}

export function completeLead(draft: LeadDraft, knownLeads: Lead[] = [], id?: string, createdAtValue?: string): Lead {
  const scoring = scoreLead(draft, knownLeads);
  const temporary = {
    ...draft,
    id: id ?? `rko_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    createdAt: createdAtValue ?? new Date().toISOString(),
    score: scoring.score,
    leadClass: scoring.leadClass,
    riskFlags: scoring.riskFlags,
    recommendedRoute: "",
    nextAction: "",
    managerSummary: "",
    status: statusForClass(scoring.leadClass),
  };
  const insight = buildMockLeadInsight(temporary, knownLeads);

  return {
    ...temporary,
    recommendedRoute: insight.recommendedRoute,
    nextAction: insight.nextAction,
    managerSummary: insight.managerSummary,
  };
}

export function createSeedLeads(total = 100): Lead[] {
  const leads: Lead[] = [];
  let globalIndex = 0;

  for (const sourceGroup of sourcePlan) {
    for (let index = 0; index < sourceGroup.count; index += 1) {
      if (leads.length >= total) break;
      const draft = draftFor(sourceGroup.source, sourceGroup.quality, index);
      leads.push(completeLead(draft, leads, `RKO-${String(globalIndex + 1).padStart(4, "0")}`, createdAt(globalIndex)));
      globalIndex += 1;
    }
  }

  return leads;
}
