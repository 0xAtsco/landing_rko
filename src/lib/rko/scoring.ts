import type { Lead, LeadClass, LeadDraft, RiskFlag, ScoreResult } from "./types";
import { findDuplicateLead } from "./dedup";

const badIntentWords = ["просто", "посмотреть", "не знаю", "халява", "бонус", "выплата", "мотив"];

function hasContact(lead: Pick<LeadDraft, "telegram" | "phone">) {
  return Boolean(lead.telegram?.trim() || lead.phone?.trim());
}

function hasTurnover(value?: string) {
  if (!value) return false;
  return /\d|к|м|тыс|млн/i.test(value);
}

function hasBusinessIntent(lead: Pick<LeadDraft, "businessType" | "needs">) {
  const text = lead.businessType?.toLowerCase() ?? "";
  return Boolean(lead.businessType?.trim()) && lead.needs.length > 0 && !badIntentWords.some((word) => text.includes(word));
}

function isExistingEntity(entityType: LeadDraft["entityType"]) {
  return entityType === "ip_exists" || entityType === "ooo_exists";
}

function isPlannedEntity(entityType: LeadDraft["entityType"]) {
  return entityType === "planning_ip" || entityType === "planning_ooo";
}

function classFromScore(score: number, riskFlags: RiskFlag[]): LeadClass {
  if (riskFlags.includes("duplicate") || riskFlags.includes("motivated_traffic") || riskFlags.includes("no_contact")) {
    if (score < 50 || riskFlags.includes("duplicate")) return "F";
  }
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

export function detectRiskFlags(lead: LeadDraft | Lead, knownLeads: Lead[] = []): RiskFlag[] {
  const risks = new Set<RiskFlag>();
  const text = `${lead.businessType ?? ""} ${lead.monthlyTurnover ?? ""} ${lead.currentBank ?? ""}`.toLowerCase();

  if (!hasContact(lead)) risks.add("no_contact");
  if (!hasBusinessIntent(lead)) risks.add("no_business_intent");
  if (!isExistingEntity(lead.entityType) && !isPlannedEntity(lead.entityType)) risks.add("no_entity");
  if (lead.urgency === "later" || lead.urgency === "unknown") risks.add("not_ready");
  if (lead.source === "bad_motiv") risks.add("motivated_traffic");
  if (lead.source === "bad_motiv" || text.includes("бонус") || text.includes("выплата")) risks.add("bad_source");
  if (!lead.businessType?.trim() && !lead.city?.trim() && !lead.monthlyTurnover?.trim()) risks.add("empty_answers");
  if (text.includes("нет ип") && isExistingEntity(lead.entityType)) risks.add("contradictory_answers");
  const duplicate = findDuplicateLead(lead, knownLeads.filter((item) => item.id !== ("id" in lead ? lead.id : "")));
  if (duplicate) {
    risks.add("duplicate");
  }

  return Array.from(risks);
}

export function scoreLead(lead: LeadDraft | Lead, knownLeads: Lead[] = []): ScoreResult {
  const riskFlags = detectRiskFlags(lead, knownLeads);
  const factors = [
    { label: "есть ИП/ООО", points: 20, active: isExistingEntity(lead.entityType) },
    { label: "срок сегодня/неделя", points: 15, active: lead.urgency === "today" || lead.urgency === "week" },
    { label: "указан оборот", points: 15, active: hasTurnover(lead.monthlyTurnover) },
    { label: "конкретная потребность", points: 10, active: lead.needs.length > 0 },
    { label: "оставил контакт", points: 10, active: hasContact(lead) },
    { label: "понятная ниша и город", points: 10, active: Boolean(lead.businessType?.trim() && lead.city?.trim()) },
    { label: "нет дубля", points: 10, active: !riskFlags.includes("duplicate") },
    {
      label: "нет признаков мусора/мотива",
      points: 10,
      active: !riskFlags.includes("motivated_traffic") && !riskFlags.includes("no_business_intent") && !riskFlags.includes("bad_source"),
    },
  ];
  const score = Math.min(100, Math.max(0, factors.reduce((sum, factor) => sum + (factor.active ? factor.points : 0), 0)));

  return {
    score,
    leadClass: classFromScore(score, riskFlags),
    riskFlags,
    factors,
  };
}

export function statusForClass(leadClass: LeadClass): Lead["status"] {
  if (leadClass === "A" || leadClass === "B") return "qualified";
  if (leadClass === "C") return "nurture";
  if (leadClass === "F") return "junk";
  return "new";
}
