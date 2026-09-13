export const GUIDE_STEP_IDS = [
  "guests",
  "budget",
  "tasks",
  "seating",
  "portal",
  "day",
  "vendors",
] as const;

export type GuideStepId = (typeof GUIDE_STEP_IDS)[number];

export type GuideStepDef = {
  id: GuideStepId;
  href: string;
  phaseKey: "start" | "planning" | "realization" | "control";
};

/** Kanoniczna kolejność modułów w przewodniku i na checkliście pulpitu. */
export const GUIDE_STEPS: GuideStepDef[] = [
  { id: "guests", href: "/dashboard/guests", phaseKey: "start" },
  { id: "stationery", href: "/dashboard/stationery", phaseKey: "planning" },
  { id: "budget", href: "/dashboard/budget", phaseKey: "planning" },
  { id: "tasks", href: "/dashboard/tasks", phaseKey: "planning" },
  { id: "seating", href: "/dashboard/seating", phaseKey: "planning" },
  { id: "portal", href: "/dashboard/portal", phaseKey: "realization" },
  { id: "day", href: "/dashboard/day", phaseKey: "realization" },
  { id: "vendors", href: "/dashboard/vendors", phaseKey: "control" },
];
