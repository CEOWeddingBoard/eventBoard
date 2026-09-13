/**
 * Krok tabelaryczny — lista gości, teksty na winietki, dowolny arkusz.
 *
 * `fieldsJson` opisuje wtedy KOLUMNY, nie pojedyncze pola. Kolumna ze wskazanym
 * miejscem w agendzie oddaje tam swoje wartości ze wszystkich wypełnionych
 * wierszy. Runtime robi to przez `tableAgendaEntries`, a podgląd w edytorze
 * musi liczyć tak samo — stąd te testy obok siebie.
 */

import {
  parseTableRows,
  isRowFilled,
  isTableStep,
  tableAgendaEntries,
  TABLE_ROWS_KEY,
  type StepField,
} from "@/lib/workflow-agenda-fields";
import { policzPodgladAgendy } from "@/lib/workflow-agenda-preview";
import type { WorkflowNodeData } from "@/lib/actions/workflow-builder.actions";

const KOLUMNY: StepField[] = [
  { key: "imie", label: "Imię", type: "text", targetAgendaKey: "" },
  { key: "winietka", label: "Tekst na winietkę", type: "text", targetAgendaKey: "agenda.dekoracje" },
  { key: "alergie", label: "Alergie", type: "text", targetAgendaKey: "agenda.uczulenia" },
];

describe("isTableStep", () => {
  it("rozpoznaje tylko krok tabelaryczny", () => {
    expect(isTableStep("TABLE")).toBe(true);
    expect(isTableStep("CLIENT_FORM")).toBe(false);
    expect(isTableStep(null)).toBe(false);
    expect(isTableStep(undefined)).toBe(false);
  });
});

describe("parseTableRows", () => {
  it("przepuszcza poprawne wiersze i zamienia wartości na tekst", () => {
    expect(parseTableRows([{ imie: "Anna", liczba: 3 }])).toEqual([{ imie: "Anna", liczba: "3" }]);
  });

  it("zamienia brak wartości na pusty tekst", () => {
    expect(parseTableRows([{ imie: null, alergie: undefined }])).toEqual([{ imie: "", alergie: "" }]);
  });

  it("odrzuca to, co nie jest listą wierszy", () => {
    expect(parseTableRows(undefined)).toEqual([]);
    expect(parseTableRows("wiersze")).toEqual([]);
    expect(parseTableRows([1, "x", null])).toEqual([]);
  });
});

describe("isRowFilled", () => {
  it("wiersz z samymi spacjami jest pusty", () => {
    expect(isRowFilled({ imie: "   ", alergie: "" })).toBe(false);
    expect(isRowFilled({ imie: "Anna", alergie: "" })).toBe(true);
  });
});

describe("tableAgendaEntries", () => {
  it("zbiera wartości kolumny ze wszystkich wierszy, każdą w nowej linii", () => {
    const wpisy = tableAgendaEntries(KOLUMNY, [
      { imie: "Anna", winietka: "Anna Kowalska", alergie: "orzechy" },
      { imie: "Jan", winietka: "Jan Kowalski", alergie: "" },
      { imie: "Maria", winietka: "Maria Nowak", alergie: "gluten" },
    ]);

    expect(wpisy).toContainEqual({
      targetAgendaKey: "agenda.dekoracje",
      value: "Anna Kowalska\nJan Kowalski\nMaria Nowak",
    });
    // Pusta komórka nie zostawia pustej linii w agendzie kuchni.
    expect(wpisy).toContainEqual({
      targetAgendaKey: "agenda.uczulenia",
      value: "orzechy\ngluten",
    });
  });

  it("pomija kolumny bez wskazanego miejsca w agendzie", () => {
    const klucze = tableAgendaEntries(KOLUMNY, [{ imie: "Anna", winietka: "", alergie: "" }]).map(
      (w) => w.targetAgendaKey,
    );
    expect(klucze).not.toContain("");
  });

  it("pomija puste wiersze", () => {
    const wpisy = tableAgendaEntries(KOLUMNY, [
      { imie: "", winietka: "", alergie: "" },
      { imie: "Anna", winietka: "Anna K.", alergie: "" },
    ]);
    expect(wpisy).toEqual([{ targetAgendaKey: "agenda.dekoracje", value: "Anna K." }]);
  });

  it("brak wierszy to brak wpisów — agenda zostaje nietknięta", () => {
    expect(tableAgendaEntries(KOLUMNY, [])).toEqual([]);
  });

  it("klucz przenoszący wiersze jest stały", () => {
    expect(TABLE_ROWS_KEY).toBe("__rows");
  });
});

describe("podgląd agendy dla kroku tabelarycznego", () => {
  function krok(over: Partial<WorkflowNodeData> & { name: string }): WorkflowNodeData {
    return {
      nodeType: "ACTION",
      actionType: "NONE",
      assigneeRole: "CLIENT",
      sortOrder: 0,
      fieldMappings: [],
      conditions: [],
      ...over,
    };
  }

  it("pokazuje kolumny jako źródła pozycji agendy", () => {
    const wynik = policzPodgladAgendy([
      krok({ name: "Lista gości", actionType: "TABLE", fields: KOLUMNY }),
    ]);

    expect(wynik.wypelnione.get("agenda.uczulenia")).toEqual([
      { krok: "Lista gości", pole: "kolumna „Alergie”" },
    ]);
    expect(wynik.krokiBezWkladu).toEqual([]);
  });

  it("kolumna z godzinami nie tworzy pozycji harmonogramu", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Transport gości",
        actionType: "TABLE",
        fields: [
          { key: "godz", label: "Godzina", type: "time", targetAgendaKey: "agenda.transport", scheduleLine: true },
        ],
      }),
    ]);

    // W tabeli godzina to kolumna, nie jedna pozycja harmonogramu kroku.
    expect(wynik.harmonogram).toEqual([]);
    expect(wynik.wypelnione.has("agenda.transport")).toBe(true);
  });

  it("krok wklejania menu zasila agendę", () => {
    const wynik = policzPodgladAgendy([krok({ name: "Wklej menu", actionType: "MENU_IMPORT" })]);

    expect(wynik.wypelnione.get("agenda.menu")).toEqual([
      { krok: "Wklej menu", pole: "wklejone menu" },
    ]);
  });
});
