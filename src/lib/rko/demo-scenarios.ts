import type { LeadDraft } from "./types";

const now = () => new Date().toISOString();

function dialogFromDraft(draft: LeadDraft) {
  return [
    { role: "assistant" as const, content: "ИП/ООО уже есть или только планируете открыть?", createdAt: now() },
    { role: "user" as const, content: draft.entityType, createdAt: now() },
    { role: "assistant" as const, content: "Чем занимается бизнес?", createdAt: now() },
    { role: "user" as const, content: draft.businessType || "не указано", createdAt: now() },
    { role: "assistant" as const, content: "В каком городе?", createdAt: now() },
    { role: "user" as const, content: draft.city || "не указано", createdAt: now() },
    { role: "assistant" as const, content: "Что нужно и когда?", createdAt: now() },
    { role: "user" as const, content: `${draft.needs.join(", ")}; срок: ${draft.urgency}`, createdAt: now() },
    { role: "assistant" as const, content: "Какой контакт для связи?", createdAt: now() },
    { role: "user" as const, content: draft.telegram || draft.phone || "контакт не оставил", createdAt: now() },
  ];
}

export function scenarioDraft(kind: "hot" | "medium" | "junk", source = "warm_telegram", campaign = "rko_marketplace"): LeadDraft {
  const base = {
    source: source as LeadDraft["source"],
    campaign,
    creative: "demo_button",
    currentBank: "Банк A",
  };

  if (kind === "hot") {
    const draft: LeadDraft = {
      ...base,
      name: "Андрей",
      telegram: "@andrey_demo",
      entityType: "ip_exists",
      businessType: "маркетплейсы, товары для дома",
      city: "Казань",
      monthlyTurnover: "800к",
      needs: ["rko", "acquiring"],
      urgency: "week",
      rawDialog: [],
    };
    return { ...draft, rawDialog: dialogFromDraft(draft) };
  }

  if (kind === "medium") {
    const draft: LeadDraft = {
      ...base,
      name: "Мария",
      telegram: "@maria_ops",
      entityType: "planning_ip",
      businessType: "доставка готовой еды",
      city: "СПб",
      monthlyTurnover: "300к",
      currentBank: undefined,
      needs: ["ip_registration", "rko"],
      urgency: "month",
      rawDialog: [],
    };
    return { ...draft, rawDialog: dialogFromDraft(draft) };
  }

  const draft: LeadDraft = {
    ...base,
    source: "bad_motiv",
    name: "Тест",
    telegram: "",
    entityType: "unknown",
    businessType: "просто посмотреть, есть ли бонус",
    city: "",
    monthlyTurnover: "",
    currentBank: undefined,
    needs: [],
    urgency: "unknown",
    rawDialog: [],
  };
  return { ...draft, rawDialog: dialogFromDraft(draft) };
}

export const fastScenarioLabels = {
  hot: "Заполнить как горячий лид",
  medium: "Заполнить как средний лид",
  junk: "Заполнить как мусорный лид",
} as const;
