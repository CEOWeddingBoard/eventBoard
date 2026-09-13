/**
 * Słownik łączący kroki procesu z agendą.
 *
 * Agenda nie ma własnej konfiguracji — składa się wyłącznie z tego, co kroki
 * procesu do niej oddają. Rozjazd między typem akcji a listą pól źródłowych
 * objawia się jako pusta sekcja w dokumencie dla kuchni, bez żadnego błędu.
 */

import {
  sourceFieldsFor,
  AGENDA_TARGETS,
  AGENDA_TARGET_GROUPS,
  agendaTargetLabel,
  SCHEDULE_AGENDA_KEY,
  MENU_SELECTION_MODES,
  DEFAULT_MENU_MODE,
  STEP_FIELD_TYPES,
  TRANSFORMS,
} from "@/lib/workflow-agenda-fields";

const TYPY_AKCJI = [
  "NONE",
  "CLIENT_FORM",
  "MENU_SELECTION",
  "APPROVAL",
  "PAYMENT",
  "DOCUMENT",
  "AGENDA",
  "SEND_MESSAGE",
];

describe("sourceFieldsFor", () => {
  it("każdy typ akcji oddaje przynajmniej notatkę z kroku", () => {
    TYPY_AKCJI.forEach((typ) => {
      const klucze = sourceFieldsFor(typ).map((f) => f.key);
      expect(klucze).toContain("note");
    });
  });

  it("krok wyboru menu oddaje wariant, podsumowanie i liczbę porcji", () => {
    const klucze = sourceFieldsFor("MENU_SELECTION").map((f) => f.key);
    expect(klucze).toEqual(
      expect.arrayContaining(["selectedVariantLabel", "menuSummary", "selectedDishes", "guestTotal"]),
    );
  });

  it("krok akceptacji oddaje kto i kiedy zatwierdził", () => {
    const klucze = sourceFieldsFor("APPROVAL").map((f) => f.key);
    expect(klucze).toEqual(expect.arrayContaining(["approvedBy", "approvedAt"]));
  });

  it("nieznany typ akcji nie wywraca edytora, tylko daje wspólne pola", () => {
    expect(sourceFieldsFor("CZEGOS_TAKIEGO_NIE_MA")).toEqual(sourceFieldsFor("NONE"));
  });

  it("pola mają wypełnione etykiety — to one są widoczne w edytorze", () => {
    TYPY_AKCJI.forEach((typ) => {
      sourceFieldsFor(typ).forEach((f) => {
        expect(f.key).not.toHaveLength(0);
        expect(f.label).not.toHaveLength(0);
      });
    });
  });
});

describe("cele w agendzie", () => {
  it("klucze są unikalne", () => {
    const klucze = AGENDA_TARGETS.map((t) => t.key);
    expect(new Set(klucze).size).toBe(klucze.length);
  });

  it("każdy klucz ma przedrostek agenda.", () => {
    AGENDA_TARGETS.forEach((t) => expect(t.key.startsWith("agenda.")).toBe(true));
  });

  it("harmonogram jest jednym z celów — agenda składa się z kroków", () => {
    expect(AGENDA_TARGETS.map((t) => t.key)).toContain(SCHEDULE_AGENDA_KEY);
  });

  it("grupy pokrywają wszystkie cele i nie mają duplikatów", () => {
    expect(new Set(AGENDA_TARGET_GROUPS).size).toBe(AGENDA_TARGET_GROUPS.length);
    AGENDA_TARGETS.forEach((t) => expect(AGENDA_TARGET_GROUPS).toContain(t.group));
  });

  it("etykieta znanego klucza jest czytelna, nieznany klucz wraca jako swój klucz", () => {
    expect(agendaTargetLabel("agenda.liczbaGosci")).toBe("Liczba gości");
    expect(agendaTargetLabel("agenda.wlasnyKlucz")).toBe("agenda.wlasnyKlucz");
  });
});

describe("słowniki edytora procesu", () => {
  it("domyślny tryb menu jest jednym z dostępnych", () => {
    expect(MENU_SELECTION_MODES.map((m) => m.value)).toContain(DEFAULT_MENU_MODE);
  });

  it("typy pól kroku pokrywają to, czego wymaga StepField", () => {
    expect(STEP_FIELD_TYPES.map((t) => t.value)).toEqual([
      "text",
      "textarea",
      "time",
      "date",
      "number",
      "select",
    ]);
  });

  it("lista przekształceń zaczyna się od wariantu bez zmian", () => {
    expect(TRANSFORMS[0].value).toBe("none");
  });
});
