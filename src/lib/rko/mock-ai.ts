import { entityLabels, needLabels, riskLabels, sourceLabels, urgencyLabels } from "./constants";
import { scoreLead } from "./scoring";
import type { Lead, LeadDraft, LeadInsight } from "./types";

function contactOf(lead: Lead | LeadDraft) {
  return lead.telegram || lead.phone || "контакт не указан";
}

function needsOf(lead: Lead | LeadDraft) {
  return lead.needs.map((need) => needLabels[need]).join(" + ") || "потребность не ясна";
}

export function buildMockLeadInsight(lead: Lead | LeadDraft, knownLeads: Lead[] = []): LeadInsight {
  const scoring = "score" in lead ? { score: lead.score, leadClass: lead.leadClass, riskFlags: lead.riskFlags, factors: scoreLead(lead, knownLeads).factors } : scoreLead(lead, knownLeads);
  const entity = entityLabels[lead.entityType];
  const source = sourceLabels[lead.source];
  const needs = needsOf(lead);
  const contact = contactOf(lead);
  const city = lead.city || "город не указан";
  const turnover = lead.monthlyTurnover || "оборот не указан";

  const nextByClass = {
    A: "Передать менеджеру сейчас. Написать в течение 5 минут.",
    B: "Дожать 1–2 вопроса и передать менеджеру при подтверждении срока.",
    C: "Отправить в прогрев: уточнить срок и конкретную задачу.",
    D: "Низкий приоритет. Авто-сообщение и мягкий прогрев.",
    F: "Пометить как мусор / дубль. Менеджеру не отдавать без ручной проверки.",
  };

  const routeByClass = {
    A: "Менеджер РКО: быстрый контакт",
    B: "Менеджер РКО: уточнение",
    C: "Прогрев в Telegram",
    D: "Автоцепочка",
    F: "Фильтр качества",
  };

  const activeFactors = scoring.factors.filter((factor) => factor.active).map((factor) => `+${factor.points} ${factor.label}`);
  const inactiveFactors = scoring.factors.filter((factor) => !factor.active).map((factor) => factor.label);
  const risks = scoring.riskFlags.map((risk) => riskLabels[risk]).join(", ") || "критичных рисков нет";

  return {
    managerSummary: `${entity}, ${lead.businessType || "ниша не указана"}, ${city}. Нужно: ${needs}. Оборот: ${turnover}. Срочность: ${urgencyLabels[lead.urgency]}. Источник: ${source}. Контакт: ${contact}.`,
    scoreExplanation: `Score ${scoring.score}/100. Сработало: ${activeFactors.join("; ") || "нет сильных факторов"}. Не хватает: ${inactiveFactors.join("; ") || "ничего критичного"}. Риски: ${risks}.`,
    recommendedRoute: routeByClass[scoring.leadClass],
    nextAction: nextByClass[scoring.leadClass],
    suggestedMessage: `Здравствуйте! Видим заявку по задаче: ${needs}. Уточню пару деталей и передам менеджеру, чтобы быстрее подобрать следующий шаг без лишней переписки.`,
    copilotSay: scoring.leadClass === "A" ? "Коротко подтвердить задачу и сразу предложить созвон/переписку с менеджером." : "Спокойно уточнить намерение, срок и контакт. Без давления.",
    copilotAsk: scoring.leadClass === "F" ? "Проверить, есть ли реальная бизнес-задача и корректный контакт." : "Уточнить, какой результат нужен первым: счёт, регистрация, эквайринг или бухгалтерия.",
    copilotStep: nextByClass[scoring.leadClass],
  };
}

export async function enrichLeadWithAi(lead: Lead | LeadDraft, knownLeads: Lead[] = []): Promise<LeadInsight> {
  return buildMockLeadInsight(lead, knownLeads);
}
