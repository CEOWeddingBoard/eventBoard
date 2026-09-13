import {
  computePlanProgress,
  getNextStepId,
  getStepIndex,
  isPlanComplete,
} from "@/lib/plan-progress";

const emptyInput = {
  guestCount: 0,
  budgetItemCount: 0,
  hasTargetBudget: false,
  taskCount: 0,
  tableCount: 0,
  portalEnabled: false,
  hasPublicSlug: false,
  scheduleCount: 0,
  vendorCount: 0,
};

describe("computePlanProgress", () => {
  it("marks all steps incomplete when empty", () => {
    const p = computePlanProgress(emptyInput);
    expect(Object.values(p).every((v) => v === false)).toBe(true);
  });

  it("marks guests complete when guestCount > 0", () => {
    const p = computePlanProgress({ ...emptyInput, guestCount: 1 });
    expect(p.guests).toBe(true);
    expect(p.budget).toBe(false);
  });

  it("marks budget complete with target budget only", () => {
    const p = computePlanProgress({ ...emptyInput, hasTargetBudget: true });
    expect(p.budget).toBe(true);
  });

  it("marks portal complete only when enabled and slug set", () => {
    expect(
      computePlanProgress({
        ...emptyInput,
        portalEnabled: true,
        hasPublicSlug: false,
      }).portal,
    ).toBe(false);
    expect(
      computePlanProgress({
        ...emptyInput,
        portalEnabled: true,
        hasPublicSlug: true,
      }).portal,
    ).toBe(true);
  });
});

describe("getNextStepId", () => {
  it("returns guests first when nothing done", () => {
    expect(getNextStepId(computePlanProgress(emptyInput))).toBe("guests");
  });

  it("returns budget after guests", () => {
    const p = computePlanProgress({ ...emptyInput, guestCount: 2 });
    expect(getNextStepId(p)).toBe("budget");
  });

  it("returns null when all complete", () => {
    const p = computePlanProgress({
      guestCount: 1,
      budgetItemCount: 1,
      hasTargetBudget: true,
      taskCount: 1,
      tableCount: 1,
      portalEnabled: true,
      hasPublicSlug: true,
      scheduleCount: 1,
      vendorCount: 1,
    });
    expect(getNextStepId(p)).toBeNull();
    expect(isPlanComplete(p)).toBe(true);
  });
});

describe("getStepIndex", () => {
  it("returns 1-based index", () => {
    expect(getStepIndex("guests")).toBe(1);
    expect(getStepIndex("vendors")).toBe(7);
  });
});
