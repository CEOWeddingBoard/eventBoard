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

const normRole = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/**
 * Czy osoba o tych rolach może wykonać krok wymagający roli `required`.
 *
 * Dopasowanie po wartości i po etykiecie (CHEF ↔ „Kucharz"), bo role własne są
 * zapisywane jako ich nazwa, a gotowe jako kod. Ta sama funkcja obsługuje panel
 * i serwer — rozjazd między nimi oznaczałby, że interfejs pokazuje kłódkę tam,
 * gdzie serwer przepuszcza, albo odwrotnie.
 */
export function hasRequiredRole(required: string | null | undefined, roles: string[]): boolean {
  if (!required) return true;
  const req = normRole(required);
  const reqLabel = normRole(assigneeRoleLabel(required));
  return roles.some((r) => {
    const rv = normRole(r);
    return rv === req || rv === reqLabel || normRole(assigneeRoleLabel(r)) === req;
  });
}

/**
 * Role akceptujące krok. Pole trzyma albo pojedynczą rolę (stary zapis), albo
 * listę JSON — krok może wymagać akceptacji kilku osób, np. Managera i Szefa kuchni.
 */
export function parseApproveRoles(value: string | null | undefined): string[] {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === "string" && r.trim() !== "") : [];
    } catch {
      return [];
    }
  }
  return [raw];
}

/** Zapis ról akceptujących: pojedyncza jako tekst, wiele jako lista JSON. */
export function formatApproveRoles(roles: string[]): string | null {
  const clean = roles.map((r) => r.trim()).filter(Boolean);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

/** Etykiety ról akceptujących do wyświetlenia, np. „Manager, Szef kuchni". */
export function approveRolesLabel(value: string | null | undefined): string {
  return parseApproveRoles(value).map(assigneeRoleLabel).join(", ");
}
