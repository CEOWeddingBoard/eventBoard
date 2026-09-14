/**
 * Rodzaje notatek o kliencie.
 *
 * Osobny moduł, bo `admin.actions.ts` ma dyrektywę `"use server"`, a plik
 * serwerowy może eksportować wyłącznie funkcje asynchroniczne — stała tablica
 * wywracała build przy zbieraniu danych stron.
 */
export const RODZAJE_NOTATEK = [
  { value: "UWAGA", label: "Uwaga" },
  { value: "POMYSL", label: "Pomysł na rozwój" },
  { value: "PROBLEM", label: "Problem" },
  { value: "USTALENIE", label: "Ustalenie" },
] as const;
