/** Kategorie zadań weselnych (wartości zapisywane w DB). */
export const WEDDING_TASK_CATEGORIES = [
  "Ogólne",
  "Planowanie",
  "Budżet",
  "Goście",
  "Sala",
  "Kościół",
  "Formalności",
  "Usługodawcy",
  "Muzyka",
  "Ubiór",
  "Zaproszenia",
  "Catering",
  "Dekoracje",
  "Kwiaty",
  "Transport",
  "Logistyka",
  "Papeteria",
  "Atrakcje",
  "Prezenty",
  "Uroda",
  "Dzień ślubu",
] as const;

export type WeddingTaskCategory = (typeof WEDDING_TASK_CATEGORIES)[number];
