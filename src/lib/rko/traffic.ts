import { leadSources, sourceLabels } from "./constants";
import type { Lead, LeadSource, TrafficSourceQuality } from "./types";

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function sourceRecommendation(source: LeadSource, ab: number, duplicate: number, risk: number, noIntent: number) {
  if (source === "warm_telegram" || source === "referral") return "увеличить бюджет";
  if (source === "bad_motiv") return "поставить источник на паузу";
  if (duplicate > 20) return "отдавать только A/B менеджеру";
  if (risk > 35 || noIntent > 25) return "добавить квалификационный вопрос";
  if (ab < 35) return "изменить креатив";
  return "оставить и смотреть A/B";
}

export function calculateTrafficQuality(leads: Lead[]): TrafficSourceQuality[] {
  return leadSources.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source);
    const total = sourceLeads.length;
    const ab = sourceLeads.filter((lead) => lead.leadClass === "A" || lead.leadClass === "B").length;
    const duplicates = sourceLeads.filter((lead) => lead.riskFlags.includes("duplicate")).length;
    const risky = sourceLeads.filter((lead) => lead.riskFlags.length > 0).length;
    const noIntent = sourceLeads.filter((lead) => lead.riskFlags.includes("no_business_intent") || lead.riskFlags.includes("not_ready")).length;
    const avgScore = total ? Math.round(sourceLeads.reduce((sum, lead) => sum + lead.score, 0) / total) : 0;
    const abPercent = percent(ab, total);
    const duplicatePercent = percent(duplicates, total);
    const riskPercent = percent(risky, total);
    const noIntentPercent = percent(noIntent, total);
    const recommendation = sourceRecommendation(source, abPercent, duplicatePercent, riskPercent, noIntentPercent);

    return {
      source,
      leads: total,
      abPercent,
      duplicatePercent,
      riskPercent,
      noIntentPercent,
      avgScore,
      recommendation,
      explanation:
        source === "bad_motiv"
          ? "Источник даёт много заявок, но мало профильных. Часто нет контакта, срока и реальной бизнес-задачи."
          : source === "warm_telegram" || source === "referral"
            ? "Источник даёт меньше объёма, зато выше доля A/B и понятнее намерение."
            : source === "cpa_partner_2"
              ? "Источник полезен по объёму, но заметны дубли и средний риск. Лучше фильтровать до менеджера."
              : "Источник даёт среднее качество. Нужны точнее креативы и дополнительный вопрос до передачи менеджеру.",
      patterns: [
        `${sourceLabels[source]}: ${total} лидов`,
        `A/B: ${abPercent}%`,
        duplicatePercent > 15 ? "много дублей в контактах" : "дубли под контролем",
        noIntentPercent > 25 ? "часто нет чёткого намерения" : "намерение в основном понятное",
      ],
      improvements: [
        recommendation,
        duplicatePercent > 15 ? "проверять контакт до CRM" : "держать текущий фильтр",
        riskPercent > 35 ? "добавить вопрос про срок и оборот" : "передавать A/B менеджеру быстрее",
      ],
    };
  });
}

export function trafficSummary(leads: Lead[]) {
  const rows = calculateTrafficQuality(leads);
  const total = leads.length;
  const ab = leads.filter((lead) => lead.leadClass === "A" || lead.leadClass === "B").length;
  const duplicates = leads.filter((lead) => lead.riskFlags.includes("duplicate")).length;
  const highRisk = leads.filter((lead) => lead.riskFlags.length >= 2 || lead.leadClass === "F").length;
  const noIntent = leads.filter((lead) => lead.riskFlags.includes("no_business_intent") || lead.riskFlags.includes("not_ready")).length;
  const sorted = [...rows].sort((a, b) => b.abPercent - a.abPercent || b.avgScore - a.avgScore);

  return {
    total,
    abPercent: percent(ab, total),
    duplicatePercent: percent(duplicates, total),
    highRiskPercent: percent(highRisk, total),
    noIntentPercent: percent(noIntent, total),
    bestSource: sorted[0]?.source,
    worstSource: sorted.at(-1)?.source,
  };
}
