/**
 * Kartoteki, w których typ obiektu może być widoczny.
 *
 * Osobny moduł, bo pliki "use server" mogą eksportować wyłącznie funkcje async —
 * stała tablica w pliku akcji wywala build (invalid-use-server-value).
 */
export const OBJECT_TYPE_PLACEMENTS = [
  "EVENT",
  "PORTAL",
  "AGENDA",
  "DOCUMENT",
  "LEAD",
  "FINANCE",
] as const;

export type ObjectTypePlacement = (typeof OBJECT_TYPE_PLACEMENTS)[number];

export const OBJECT_TYPE_PLACEMENT_LABELS: Record<ObjectTypePlacement, string> = {
  EVENT: "Karta eventu",
  PORTAL: "Portal klienta",
  AGENDA: "Agenda",
  DOCUMENT: "Dokumenty",
  LEAD: "Zapytania",
  FINANCE: "Finanse",
};

/** Obiekt bez żadnej kartoteki byłby niewidoczny — domyślnie karta eventu. */
export function sanitizePlacements(visibleIn: string[]): string[] {
  const allowed = new Set<string>(OBJECT_TYPE_PLACEMENTS);
  const picked = visibleIn.filter((place) => allowed.has(place));
  return picked.length > 0 ? picked : ["EVENT"];
}
