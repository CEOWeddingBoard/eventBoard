import { GUIDE_STEPS, type GuideStepId } from "@/lib/guide-steps";

export type PlanProgressInput = {
  guestCount: number;
  budgetItemCount: number;
  hasTargetBudget: boolean;
  taskCount: number;
  tableCount: number;
  portalEnabled: boolean;
  hasPublicSlug: boolean;
  scheduleCount: number;
  vendorCount: number;
};

export type PlanProgress = Record<GuideStepId, boolean>;

export function computePlanProgress(input: PlanProgressInput): PlanProgress {
  return {
    guests: input.guestCount > 0,
    budget: input.budgetItemCount > 0 || input.hasTargetBudget,
    tasks: input.taskCount > 0,
    seating: input.tableCount > 0,
    portal: input.portalEnabled && input.hasPublicSlug,
    day: input.scheduleCount > 0,
    vendors: input.vendorCount > 0,
  };
}

export function getNextStepId(progress: PlanProgress): GuideStepId | null {
  const step = GUIDE_STEPS.find((s) => !progress[s.id]);
  return step?.id ?? null;
}

export function getStepIndex(stepId: GuideStepId): number {
  const idx = GUIDE_STEPS.findIndex((s) => s.id === stepId);
  return idx >= 0 ? idx + 1 : 0;
}

export function countCompletedSteps(progress: PlanProgress): number {
  return GUIDE_STEPS.filter((s) => progress[s.id]).length;
}

export function isPlanComplete(progress: PlanProgress): boolean {
  return countCompletedSteps(progress) === GUIDE_STEPS.length;
}

/** Etykiety modułów w kontekście AI (PL). */
export const PLAN_STEP_LABELS_PL: Record<GuideStepId, string> = {
  guests: "Goście i RSVP",
  budget: "Budżet",
  tasks: "Zadania",
  seating: "Plan stołów",
  portal: "Portal gościa",
  day: "Organizacja dnia",
  vendors: "Usługodawcy",
};
