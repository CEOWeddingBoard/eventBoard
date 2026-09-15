/**
 * Co krok procesu oddaje do agendy.
 *
 * Mapowanie pól było parą pustych pól tekstowych: trzeba było wiedzieć,
 * że krok wyboru menu zapisuje dane pod kluczem `selectedVariantLabel`,
 * i samodzielnie wymyślić nazwę klucza docelowego. Teraz obie strony są
 * listami wyboru budowanymi z typu akcji, więc konfiguracja procesu od razu
 * mówi, gdzie odłoży się decyzja klienta i notatka z kroku.
 */

/** Sposób, w jaki klient wybiera menu na kroku MENU_SELECTION. */
export const MENU_SELECTION_MODES = [
  {
    value: "WHOLE_VARIANT",
    label: "Cały wariant",
    hint: "Klient wskazuje gotowy zestaw i podaje liczbę osób na każdy wariant.",
  },
  {
    value: "PER_DISH",
    label: "Pojedyncze dania",
    hint: "Klient składa menu sam, wybierając dania z dostępnych wariantów.",
  },
] as const;

export type MenuSelectionMode = (typeof MENU_SELECTION_MODES)[number]["value"];

export const DEFAULT_MENU_MODE: MenuSelectionMode = "WHOLE_VARIANT";

/** Pole, które krok wystawia do mapowania. */
export type SourceField = { key: string; label: string; hint?: string };

/** Notatka jest na każdym kroku — organizator albo klient zawsze może ją dopisać. */
const NOTATKA: SourceField = {
  key: "note",
  label: "Notatka z kroku",
  hint: "Treść wpisana przy zatwierdzaniu tego kroku.",
};

const WSPOLNE: SourceField[] = [NOTATKA];

/** Co da się zmapować, zależnie od tego, co krok robi. */
const ZRODLA: Record<string, SourceField[]> = {
  MENU_SELECTION: [
    { key: "selectedVariantLabel", label: "Wybrany wariant", hint: "Nazwa wariantu wskazanego przez klienta." },
    { key: "menuSummary", label: "Podsumowanie wyboru", hint: "Warianty wraz z liczbą osób." },
    { key: "selectedDishes", label: "Wybrane dania", hint: "Lista dań — przy wyborze pojedynczych pozycji." },
    { key: "guestTotal", label: "Łączna liczba porcji" },
    ...WSPOLNE,
  ],
  CLIENT_FORM: [
    { key: "answer", label: "Odpowiedź klienta", hint: "Treść wpisana przez klienta w portalu." },
    ...WSPOLNE,
  ],
  APPROVAL: [
    { key: "approvedBy", label: "Kto zatwierdził" },
    { key: "approvedAt", label: "Data zatwierdzenia" },
    ...WSPOLNE,
  ],
  PAYMENT: [
    { key: "paymentNote", label: "Opis płatności" },
    ...WSPOLNE,
  ],
  DOCUMENT: [
    { key: "documentName", label: "Nazwa dokumentu" },
    ...WSPOLNE,
  ],
  SEND_MESSAGE: [
    { key: "message", label: "Treść wiadomości" },
    ...WSPOLNE,
  ],
  TABLE: [
    { key: "rowCount", label: "Liczba wierszy", hint: "Ile pozycji klient wpisał w tabeli." },
    ...WSPOLNE,
  ],
  AGENDA: WSPOLNE,
  NONE: WSPOLNE,
};

export function sourceFieldsFor(actionType: string): SourceField[] {
  return ZRODLA[actionType] ?? WSPOLNE;
}

/**
 * Miejsca w agendzie, w które da się odłożyć wynik kroku.
 * Te same klucze wstawia się jako sloty w szablonie dokumentu.
 */
export const AGENDA_TARGETS: { key: string; label: string; group: string }[] = [
  { key: "agenda.menu", label: "Menu", group: "Agenda" },
  { key: "agenda.menuSzczegoly", label: "Menu — szczegóły dań", group: "Agenda" },
  { key: "agenda.harmonogram", label: "Harmonogram", group: "Agenda" },
  { key: "agenda.napoje", label: "Napoje", group: "Agenda" },
  { key: "agenda.alkohol", label: "Alkohol", group: "Agenda" },
  { key: "agenda.tort", label: "Tort", group: "Agenda" },
  { key: "agenda.godzinaStart", label: "Godzina rozpoczęcia", group: "Agenda" },
  { key: "agenda.godzinaKoniec", label: "Godzina zakończenia", group: "Agenda" },
  { key: "agenda.liczbaGosci", label: "Liczba gości", group: "Agenda" },
  { key: "agenda.atrakcje", label: "Atrakcje / oprawa", group: "Agenda" },
  { key: "agenda.uwagiFinalne", label: "Uwagi końcowe", group: "Uwagi" },
  { key: "agenda.uwagiKuchnia", label: "Uwagi dla kuchni", group: "Uwagi" },
  { key: "agenda.uwagiObsluga", label: "Uwagi dla obsługi", group: "Uwagi" },
  { key: "agenda.uczulenia", label: "Uczulenia", group: "Uwagi" },
  { key: "agenda.dekoracje", label: "Dekoracje", group: "Uwagi" },
  { key: "agenda.transport", label: "Transport", group: "Uwagi" },
  { key: "agenda.platnosci", label: "Płatności", group: "Rozliczenie" },
  { key: "agenda.platnosciStatus", label: "Status płatności", group: "Rozliczenie" },
  { key: "agenda.kontakt", label: "Kontakt do klienta", group: "Rozliczenie" },
  { key: "agenda.dokumenty", label: "Dokumenty", group: "Rozliczenie" },
];

export const AGENDA_TARGET_GROUPS = [...new Set(AGENDA_TARGETS.map((t) => t.group))];

export function agendaTargetLabel(key: string): string {
  return AGENDA_TARGETS.find((t) => t.key === key)?.label ?? key;
}

/**
 * Pole wypełniane na kroku procesu. Definiowane na etapie konfiguracji
 * procesu; wypełnia je rola „wypełniająca" (klient w portalu albo zespół
 * w panelu), a po akceptacji wartość ląduje w agendzie pod `targetAgendaKey`.
 */
export type StepFieldType = "text" | "textarea" | "time" | "date" | "number" | "select";

export type StepField = {
  key: string;
  label: string;
  type: StepFieldType;
  targetAgendaKey: string;
  required?: boolean;
  // Krok z polem-czasem oznaczonym jako pozycja harmonogramu tworzy linię
  // „GG:MM — nazwa kroku" w harmonogramie agendy (harmonogram Z PROCESU).
  scheduleLine?: boolean;
  options?: string[];
  // Tylko krok TABLE: jak podsumować tę kolumnę. `sum` liczy sumę wartości,
  // `group` grupuje wiersze po wartości i zlicza wystąpienia.
  // Szczegóły i liczenie: `src/lib/workflow-table-summary.ts`.
  aggregate?: "sum" | "group";
};

export const STEP_FIELD_TYPES: { value: StepFieldType; label: string }[] = [
  { value: "text", label: "Tekst" },
  { value: "textarea", label: "Dłuższy tekst" },
  { value: "time", label: "Godzina" },
  { value: "date", label: "Data" },
  { value: "number", label: "Liczba" },
  { value: "select", label: "Wybór z listy" },
];

/** Klucz w EventAgendaData, pod którym gromadzimy harmonogram złożony z kroków. */
export const SCHEDULE_AGENDA_KEY = "agenda.harmonogram";

/** Sposób złożenia wielu wartości w jeden wpis agendy. */
export const TRANSFORMS = [
  { value: "none", label: "Bez zmian" },
  { value: "join_comma", label: "Połącz przecinkami" },
  { value: "join_newline", label: "Każde w nowej linii" },
  { value: "date_pl", label: "Data po polsku" },
] as const;

// ── Krok typu tabela / arkusz ────────────────────────────────────────────

/**
 * Krok tabelaryczny: lista gości, teksty na winietki, cokolwiek, co jest
 * arkuszem. `fieldsJson` opisuje wtedy KOLUMNY, nie pojedyncze pola — jedna
 * definicja `StepField` to jedna kolumna. Wypełnione wiersze wędrują w danych
 * kroku pod kluczem `TABLE_ROWS_KEY`, a kolumna ze wskazanym `targetAgendaKey`
 * oddaje do agendy swoje wartości zebrane z wszystkich wierszy.
 */
export const TABLE_ROWS_KEY = "__rows";

export type TableRow = Record<string, string>;

export function isTableStep(actionType: string | null | undefined): boolean {
  return actionType === "TABLE";
}

/** Wiersze z danych kroku — odporne na to, że przyszło coś innego. */
export function parseTableRows(raw: unknown): TableRow[] {
  if (!Array.isArray(raw)) return [];
  const out: TableRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row: TableRow = {};
    for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
      row[k] = v == null ? "" : String(v);
    }
    out.push(row);
  }
  return out;
}

/** Czy wiersz ma cokolwiek wpisane — puste wiersze nie idą do agendy. */
export function isRowFilled(row: TableRow): boolean {
  return Object.values(row).some((v) => String(v ?? "").trim() !== "");
}
