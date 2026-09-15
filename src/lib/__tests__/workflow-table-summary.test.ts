import type { StepField, TableRow } from "@/lib/workflow-agenda-fields";
import {
  formatujLiczbe,
  formatujPozycje,
  maPodsumowanie,
  parseLiczba,
  podsumujTabele,
  tableAgendaEntries,
} from "@/lib/workflow-table-summary";

/**
 * Zestawienia z kroku tabelarycznego: suma kolumn liczbowych i grupowanie
 * po wartości. To jest liczba, którą kuchnia zamawia u dostawcy — jeśli
 * zestawienie skłamie, ktoś zostanie bez obiadu.
 */

const kolumna = (p: Partial<StepField> & { key: string }): StepField => ({
  label: p.key,
  type: "text",
  targetAgendaKey: "",
  ...p,
});

const KOLUMNY: StepField[] = [
  kolumna({ key: "imie", label: "Imię i nazwisko" }),
  kolumna({ key: "menu", label: "Menu", type: "select", aggregate: "group", targetAgendaKey: "agenda.menu" }),
  kolumna({ key: "osoby", label: "Liczba osób", type: "number", aggregate: "sum", targetAgendaKey: "agenda.liczbaGosci" }),
];

const WIERSZE: TableRow[] = [
  { imie: "Anna Kowalska", menu: "mięsne", osoby: "2" },
  { imie: "Jan Nowak", menu: "wegetariańskie", osoby: "1" },
  { imie: "Piotr Zieliński", menu: "mięsne", osoby: "3" },
  { imie: "Ewa Mazur", menu: "mięsne", osoby: "1" },
  { imie: "", menu: "", osoby: "" },
];

describe("parseLiczba", () => {
  it("czyta liczby tak, jak wpisuje je człowiek w arkuszu", () => {
    expect(parseLiczba("12")).toBe(12);
    expect(parseLiczba("1 200,50")).toBe(1200.5);
    expect(parseLiczba("45 zł")).toBe(45);
    expect(parseLiczba("12 os.")).toBe(12);
    expect(parseLiczba("-3")).toBe(-3);
  });

  it("komórka bez liczby nie jest zerem, tylko brakiem wartości", () => {
    expect(parseLiczba("")).toBeNull();
    expect(parseLiczba("brak")).toBeNull();
    expect(parseLiczba(null)).toBeNull();
  });
});

describe("formatujLiczbe", () => {
  it("nie dokleja zer do liczb całkowitych", () => {
    expect(formatujLiczbe(45)).toBe("45");
    expect(formatujLiczbe(1200.5)).toBe("1200,5");
    expect(formatujLiczbe(0.1 + 0.2)).toBe("0,3");
  });
});

describe("podsumujTabele", () => {
  it("sumuje kolumnę liczbową, pomijając puste wiersze", () => {
    const p = podsumujTabele(KOLUMNY, WIERSZE);
    expect(p.liczbaWierszy).toBe(4);
    expect(p.sumy).toEqual([{ key: "osoby", label: "Liczba osób", suma: 7 }]);
  });

  it("grupuje po wartości i liczy sumy w obrębie grupy", () => {
    const { grupy } = podsumujTabele(KOLUMNY, WIERSZE);
    expect(grupy).toHaveLength(1);

    const [miesne, wege] = grupy[0].pozycje;
    expect(miesne).toEqual({
      wartosc: "mięsne",
      liczba: 3,
      sumy: [{ key: "osoby", label: "Liczba osób", suma: 6 }],
    });
    expect(wege.wartosc).toBe("wegetariańskie");
    expect(wege.sumy[0].suma).toBe(1);
  });

  it("pusta komórka nie tworzy osobnej kategorii", () => {
    const { grupy } = podsumujTabele(KOLUMNY, [
      { imie: "Anna", menu: "", osoby: "2" },
      { imie: "Jan", menu: "mięsne", osoby: "1" },
    ]);
    expect(grupy[0].pozycje.map((p) => p.wartosc)).toEqual(["mięsne"]);
  });

  it("bez oznaczonych kolumn nie ma czego podsumowywać", () => {
    const proste = [kolumna({ key: "imie" })];
    expect(maPodsumowanie(proste)).toBe(false);
    expect(podsumujTabele(proste, WIERSZE).grupy).toEqual([]);
  });
});

describe("formatujPozycje", () => {
  it("składa pozycję czytelną dla kuchni", () => {
    const { grupy } = podsumujTabele(KOLUMNY, WIERSZE);
    expect(formatujPozycje(grupy[0].pozycje[0])).toBe("mięsne × 3 · Liczba osób: 6");
  });
});

describe("tableAgendaEntries z agregacją", () => {
  it("kolumna grupowana oddaje zestawienie, nie listę wierszy", () => {
    const wpisy = tableAgendaEntries(KOLUMNY, WIERSZE);
    const menu = wpisy.find((w) => w.targetAgendaKey === "agenda.menu");
    expect(menu?.value).toBe("mięsne × 3 · Liczba osób: 6\nwegetariańskie × 1 · Liczba osób: 1");
  });

  it("kolumna sumowana oddaje sumę, nie kolejne liczby", () => {
    const wpisy = tableAgendaEntries(KOLUMNY, WIERSZE);
    expect(wpisy.find((w) => w.targetAgendaKey === "agenda.liczbaGosci")?.value).toBe("7");
  });

  it("kolumna bez agregacji nadal oddaje wartości wiersz po wierszu", () => {
    const kolumny = [kolumna({ key: "winietka", label: "Winietka", targetAgendaKey: "agenda.dekoracje" })];
    const wpisy = tableAgendaEntries(kolumny, [
      { winietka: "Anna" },
      { winietka: "Jan" },
      { winietka: "" },
    ]);
    expect(wpisy[0].value).toBe("Anna\nJan");
  });

  it("pusta tabela nie zaśmieca agendy zerami", () => {
    expect(tableAgendaEntries(KOLUMNY, [])).toEqual([]);
  });
});
