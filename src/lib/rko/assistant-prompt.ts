import { campaignLabels, needLabels, sourceLabels } from "./constants";
import type { LeadDraft, LeadInsight, ScoreResult } from "./types";

export const rkoAssistantSystemPrompt = [
  "Ты AI-консультант по РКО-заявкам для demo RKO Lead Command Center.",
  "Ты не продаёшь банк и не обещаешь approve, выплаты CPA или обход банковских правил.",
  "Твоя задача: коротко понять бизнес-задачу, задать один лучший следующий вопрос и собрать понятную карточку для менеджера.",
  "Не проси паспортные данные, номера карт, реквизиты счёта, коды из SMS или банковские логины.",
  "Если человек слабый по намерению, спокойно отправляй в прогрев.",
  "Используй только placeholder-банки: Банк A, Банк B, Банк C.",
  "Пиши просто по-русски: 2-4 коротких предложения.",
  "В каждом ответе задавай только один следующий вопрос и коротко объясняй, зачем он нужен.",
].join("\n");

export function describeLeadForAssistant(lead: LeadDraft) {
  const needs = lead.needs.map((need) => needLabels[need]).join(", ") || "пока не ясно";
  return [
    `Источник: ${sourceLabels[lead.source]}`,
    `Кампания: ${campaignLabels[lead.campaign] ?? lead.campaign}`,
    `Тип: ${lead.entityType}`,
    `Ниша: ${lead.businessType || "не указана"}`,
    `Город: ${lead.city || "не указан"}`,
    `Оборот: ${lead.monthlyTurnover || "не указан"}`,
    `Потребности: ${needs}`,
    `Срочность: ${lead.urgency}`,
    `Контакт: ${lead.telegram || lead.phone || "не указан"}`,
  ].join("\n");
}

export function buildAssistantContext(input: {
  draft: LeadDraft;
  score: ScoreResult;
  insight: LeadInsight;
  missingFields: string[];
}) {
  return [
    "Текущая CRM-черновик:",
    describeLeadForAssistant(input.draft),
    `Score preview: ${input.score.score}/100, class ${input.score.leadClass}`,
    `Риски: ${input.score.riskFlags.join(", ") || "нет"}`,
    `Не хватает: ${input.missingFields.join(", ") || "ничего критичного"}`,
    `Следующий шаг для менеджера: ${input.insight.nextAction}`,
  ].join("\n");
}

export function nextQuestionForMissingField(field: string) {
  const questions: Record<string, { question: string; why: string }> = {
    entity: {
      question: "ИП/ООО уже есть или только планируете открыть?",
      why: "так менеджер поймёт, нужна ли регистрация или сразу подбор РКО.",
    },
    businessType: {
      question: "Чем занимается бизнес?",
      why: "ниша влияет на сценарий РКО, эквайринга и вопросы менеджера.",
    },
    city: {
      question: "В каком городе работаете?",
      why: "часть условий и коммуникации зависит от региона.",
    },
    monthlyTurnover: {
      question: "Какой примерно оборот в месяц?",
      why: "это помогает не тратить время на неподходящий маршрут.",
    },
    needs: {
      question: "Что нужно первым: счёт, регистрация, эквайринг, бухгалтерия или что-то ещё?",
      why: "так менеджер получит не общий лид, а понятную задачу.",
    },
    urgency: {
      question: "Когда хотите решить задачу: сегодня, на неделе или позже?",
      why: "горячие заявки важно не потерять после первого клика.",
    },
    contact: {
      question: "Куда удобно передать ответ менеджера: Telegram или телефон?",
      why: "без контакта карточка останется в прогреве, а не у менеджера.",
    },
  };

  return questions[field] ?? questions.contact;
}
