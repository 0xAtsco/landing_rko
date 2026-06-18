import type { Lead, LeadDraft } from "./types";

export function normalizeTelegram(value?: string) {
  if (!value) return "";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed.replace(/^https?:\/\/t\.me\//, "")}`;
}

export function normalizePhone(value?: string) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  return digits;
}

export function leadContactKey(lead: Pick<Lead | LeadDraft, "telegram" | "phone">) {
  return normalizeTelegram(lead.telegram) || normalizePhone(lead.phone);
}

export function findDuplicateLead(lead: Pick<Lead | LeadDraft, "telegram" | "phone">, knownLeads: Lead[]) {
  const key = leadContactKey(lead);
  if (!key) return undefined;

  return knownLeads.find((item) => {
    const itemKey = leadContactKey(item);
    return itemKey === key && itemKey.length > 0;
  });
}
