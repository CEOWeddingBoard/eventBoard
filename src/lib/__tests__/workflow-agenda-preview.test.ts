/**
 * Podgląd agendy w edytorze procesu.
 *
 * Panel obiecuje użytkownikowi, co wyjdzie w dokumencie dla kuchni. Musi liczyć
 * to samo, co runtime w `process-runtime.actions.ts` — rozjazd byłby gorszy niż
 * brak podglądu, bo edytor pokazywałby pozycję, której agenda nie wypełni.
 * Zachowanie runtime pilnuje `src/lib/actions/__tests__/process-to-agenda.test.ts`.
 */

import { policzPodgladAgendy } from "@/lib/workflow-agenda-preview";
import type { WorkflowNodeData } from "@/lib/actions/workflow-builder.actions";

function krok(over: Partial<WorkflowNodeData> & { name: string }): WorkflowNodeData {
  return {
    nodeType: "ACTION",
    actionType: "NONE",
    assigneeRole: "MANAGER",
    sortOrder: 0,
    fieldMappings: [],
    conditions: [],
    ...over,
  };
}

describe("policzPodgladAgendy", () => {
  it("pokazuje, który krok zasila którą pozycję agendy", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Ustalenia wstępne",
        fields: [
          { key: "liczbaGosci", label: "Liczba gości", type: "number", targetAgendaKey: "agenda.liczbaGosci" },
        ],
      }),
    ]);

    expect(wynik.wypelnione.get("agenda.liczbaGosci")).toEqual([
      { krok: "Ustalenia wstępne", pole: "Liczba gości" },
    ]);
    expect(wynik.krokiBezWkladu).toEqual([]);
  });

  it("pole-czas idzie do harmonogramu i nie tworzy osobnej pozycji", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Wjazd tortu",
        fields: [
          {
            key: "godzina",
            label: "Godzina",
            type: "time",
            targetAgendaKey: "agenda.godzinaStart",
            scheduleLine: true,
          },
        ],
      }),
    ]);

    expect(wynik.harmonogram).toEqual(["Wjazd tortu"]);
    expect(wynik.wypelnione.has("agenda.godzinaStart")).toBe(false);
  });

  it("krok wyboru menu zasila agendę także bez skonfigurowanego mapowania", () => {
    const wynik = policzPodgladAgendy([krok({ name: "Wybór menu", actionType: "MENU_SELECTION" })]);

    expect(wynik.wypelnione.get("agenda.menu")).toEqual([
      { krok: "Wybór menu", pole: "wybór klienta" },
    ]);
    expect(wynik.krokiBezWkladu).toEqual([]);
  });

  it("uwzględnia stare mapowania pól obok nowych pól kroku", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Atrakcje",
        fieldMappings: [{ sourceKey: "atrakcje", targetAgendaKey: "agenda.atrakcje", transform: "join_comma" }],
      }),
    ]);

    expect(wynik.wypelnione.get("agenda.atrakcje")).toEqual([
      { krok: "Atrakcje", pole: "atrakcje" },
    ]);
  });

  it("wskazuje kroki, które nic nie oddają do agendy", () => {
    const wynik = policzPodgladAgendy([
      krok({ name: "Telefon powitalny" }),
      krok({
        name: "Zaliczka",
        fields: [{ key: "kwota", label: "Kwota", type: "number", targetAgendaKey: "agenda.platnosci" }],
      }),
      krok({ name: "Przypomnienie", actionType: "SEND_MESSAGE" }),
    ]);

    expect(wynik.krokiBezWkladu).toEqual(["Telefon powitalny", "Przypomnienie"]);
  });

  it("dwa kroki mogą zasilać tę samą pozycję agendy", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Ustalenia z parą",
        fields: [{ key: "u", label: "Uwagi", type: "text", targetAgendaKey: "agenda.uwagiKuchnia" }],
      }),
      krok({
        name: "Rozmowa z kuchnią",
        fields: [{ key: "u2", label: "Uwagi szefa kuchni", type: "text", targetAgendaKey: "agenda.uwagiKuchnia" }],
      }),
    ]);

    expect(wynik.wypelnione.get("agenda.uwagiKuchnia")).toHaveLength(2);
  });

  it("oddziela klucz własny od listy gotowych pozycji", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Dekoracje",
        fields: [{ key: "d", label: "Kwiaty", type: "text", targetAgendaKey: "agenda.kwiaciarnia" }],
      }),
    ]);

    expect(wynik.wypelnione.size).toBe(0);
    expect(wynik.wlasneKlucze.get("agenda.kwiaciarnia")).toEqual([
      { krok: "Dekoracje", pole: "Kwiaty" },
    ]);
  });

  it("pomija pola bez wskazanego miejsca w agendzie", () => {
    const wynik = policzPodgladAgendy([
      krok({
        name: "Notatki",
        fields: [{ key: "x", label: "Coś", type: "text", targetAgendaKey: "" }],
      }),
    ]);

    expect(wynik.wypelnione.size).toBe(0);
    expect(wynik.wlasneKlucze.size).toBe(0);
    expect(wynik.krokiBezWkladu).toEqual(["Notatki"]);
  });

  it("krok bez nazwy dostaje numer, żeby dało się go wskazać", () => {
    const wynik = policzPodgladAgendy([krok({ name: "   " })]);
    expect(wynik.krokiBezWkladu).toEqual(["Krok 1"]);
  });
});
