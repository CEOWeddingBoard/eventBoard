/**
 * Statusy wydarzenia i ich polskie etykiety.
 *
 * Jedno źródło prawdy — pulpit pokazywał surowe wartości techniczne
 * („DRAFT”) obok listy eventów, która miała własną mapę tłumaczeń.
 */

export const EVENT_STATUSES = ["DRAFT", "CONFIRMED", "COMPLETED", "ARCHIVED"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Etykieta pojedynczego wydarzenia — „Szkic”. */
const LABELS: Record<string, string> = {
  DRAFT: "Szkic",
  CONFIRMED: "Potwierdzony",
  COMPLETED: "Zakończony",
  ARCHIVED: "Archiwalny",
};

/** Etykieta zakładki filtra — liczba mnoga: „Szkice”. */
const FILTER_LABELS: Record<string, string> = {
  DRAFT: "Szkice",
  CONFIRMED: "Potwierdzone",
  COMPLETED: "Zakończone",
  ARCHIVED: "Archiwalne",
};

export function eventStatusLabel(status: string): string {
  return LABELS[status] ?? status;
}

export function eventStatusFilterLabel(status: string): string {
  return FILTER_LABELS[status] ?? status;
}

export const EVENT_STATUS_OPTIONS = EVENT_STATUSES.map((value) => ({
  value,
  label: LABELS[value],
}));

/** Statusy zapytania ofertowego. */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Nowe",
  CONTACTED: "W kontakcie",
  WON: "Wygrane",
  LOST: "Przegrane",
};

export function leadStatusLabel(status: string): string {
  return LEAD_STATUS_LABELS[status] ?? status;
}
