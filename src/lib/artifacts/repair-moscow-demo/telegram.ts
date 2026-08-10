export type RepairTelegramDraftInput = {
  name: string;
  district: string;
  area: number | string;
  repairType: string;
};

const TELEGRAM_USERNAME_PATTERN = /^[A-Za-z0-9_]{5,32}$/;

export function normalizeTelegramUsername(value?: string) {
  return value?.trim().replace(/^@+/, "") ?? "";
}

export function isValidTelegramUsername(value?: string) {
  return TELEGRAM_USERNAME_PATTERN.test(normalizeTelegramUsername(value));
}

export function buildRepairTelegramDraft(input: RepairTelegramDraftInput) {
  return [
    "Здравствуйте! Хочу получить расчёт ремонта.",
    `Имя: ${input.name}`,
    `Район: ${input.district}`,
    `Площадь: ${input.area} м²`,
    `Тип ремонта: ${input.repairType}`,
  ].join("\n");
}

export function buildTelegramDraftUrl(username: string, draft: string) {
  const normalizedUsername = normalizeTelegramUsername(username);

  if (!isValidTelegramUsername(normalizedUsername)) return null;

  return `https://t.me/${normalizedUsername}?text=${encodeURIComponent(draft)}`;
}
