/**
 * Plany subskrypcji przestrzeni. Próg wyznacza liczba sal, a każdy plan ma
 * limit „miejsc" (kont pracowników z dostępem). Konto serwisowe (SERVICE)
 * NIE liczy się do limitu.
 */
export type PlanKey = "START" | "PRO" | "ENTERPRISE";

export const PLANS: Record<PlanKey, { label: string; halls: string; maxAdmins: number | null; maxUsers: number | null; priceMonthly: number | null }> = {
  START: { label: "Start", halls: "1 sala", maxAdmins: 1, maxUsers: 3, priceMonthly: 249 },
  PRO: { label: "Pro", halls: "do 5 sal", maxAdmins: 2, maxUsers: 10, priceMonthly: 599 },
  ENTERPRISE: { label: "Enterprise", halls: "powyżej 5 sal", maxAdmins: null, maxUsers: null, priceMonthly: null },
};

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export function normalizePlan(plan: string | null | undefined): PlanKey {
  const p = (plan ?? "").toUpperCase();
  if (p === "START" || p === "PRO" || p === "ENTERPRISE") return p;
  // Zgodność wstecz ze starymi wartościami.
  if (p === "BASIC") return "START";
  return "START";
}

/** Efektywne limity: ręczne ustawienie per przestrzeń ma pierwszeństwo nad planem. */
export function effectiveLimits(
  plan: string | null | undefined,
  overrides?: { maxAdmins?: number | null; maxUsers?: number | null },
): { maxAdmins: number | null; maxUsers: number | null } {
  const p = PLANS[normalizePlan(plan)];
  return {
    maxAdmins: overrides?.maxAdmins ?? p.maxAdmins,
    maxUsers: overrides?.maxUsers ?? p.maxUsers,
  };
}

export function planLabel(plan: string | null | undefined): string {
  return PLANS[normalizePlan(plan)].label;
}
