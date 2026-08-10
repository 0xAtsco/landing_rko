export const REPAIR_AREA_MIN = 20;
export const REPAIR_AREA_MAX = 150;

export const REPAIR_RATES = {
  cosmetic: 9_000,
  capital: 15_000,
  design: 22_000,
} as const;

export type RepairType = keyof typeof REPAIR_RATES;

export type RepairEstimateInput = {
  area: number;
  repairType: RepairType;
  bathroom: boolean;
  designProject: boolean;
};

export const DEFAULT_REPAIR_ESTIMATE_INPUT: RepairEstimateInput = {
  area: 45,
  repairType: "capital",
  bathroom: true,
  designProject: false,
};

export function clampRepairArea(area: number) {
  if (!Number.isFinite(area)) return REPAIR_AREA_MIN;
  return Math.min(REPAIR_AREA_MAX, Math.max(REPAIR_AREA_MIN, area));
}

export function calculateRepairEstimate(input: RepairEstimateInput) {
  const area = clampRepairArea(input.area);
  const rate = REPAIR_RATES[input.repairType];
  const bathroomCost = input.bathroom ? 65_000 : 0;
  const designProjectCost = input.repairType !== "design" && input.designProject ? area * 2_000 : 0;
  const total = area * rate + bathroomCost + designProjectCost;

  return Math.round(total / 10_000) * 10_000;
}

export function formatPrice(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const formatted = new Intl.NumberFormat("ru-RU").format(safeValue).replace(/[\u00a0\u202f]/g, " ");

  return `${formatted} ₽`;
}
