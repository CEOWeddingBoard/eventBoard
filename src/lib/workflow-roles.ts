/**
 * Role zatwierdzające kroki procesu.
 *
 * Jedno źródło prawdy dla edytora procesów i widoków runtime — wcześniej
 * builder znał role obsługi (Kucharz, Kelner…), a panel procesu nie, więc
 * na osi kroków wyświetlała się surowa wartość „CHEF”.
 *
 * `assigneeRole` jest w bazie zwykłym tekstem, nie wyliczeniem: poza
 * wartościami poniżej przyjmuje dowolną rolę własną wpisaną w edytorze.
 */

export const ASSIGNEE_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "MANAGER", label: "Manager" },
  { value: "OWNER", label: "Właściciel" },
  { value: "STAFF", label: "Pracownik" },
  { value: "CLIENT", label: "Klient (para/gość)" },
  { value: "BOTH", label: "Klient + Manager" },
  { value: "CHEF", label: "Kucharz" },
  { value: "WAITER", label: "Kelner" },
  { value: "BARTENDER", label: "Barman" },
  { value: "COORDINATOR", label: "Koordynator" },
  { value: "CUSTOM", label: "Własna rola…" },
];

/** Wartości gotowe — wszystko poza nimi traktujemy jako rolę własną. */
export const PRESET_ROLE_VALUES = ASSIGNEE_ROLE_OPTIONS
  .filter((r) => r.value !== "CUSTOM")
  .map((r) => r.value);

/** Krótsze etykiety do widoków, gdzie liczy się miejsce w wierszu. */
const DISPLAY_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  OWNER: "Właściciel",
  STAFF: "Pracownik",
  CLIENT: "Klient",
  BOTH: "Klient + Manager",
  CHEF: "Kucharz",
  WAITER: "Kelner",
  BARTENDER: "Barman",
  COORDINATOR: "Koordynator",
};

/**
 * Etykieta roli do wyświetlenia. Rola własna jest przechowywana jako jej
 * własna nazwa, więc zwrócenie surowej wartości jest tu poprawnym wynikiem.
 */
export function assigneeRoleLabel(role: string): string {
  return DISPLAY_LABELS[role] ?? role;
}

/** Czy krok należy do klienta (widoczny w portalu). */
export function isClientRole(role: string): boolean {
  return role === "CLIENT" || role === "BOTH";
}
