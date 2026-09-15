import type { StepField, TableRow } from "@/lib/workflow-agenda-fields";
import { isRowFilled } from "@/lib/workflow-agenda-fields";

/**
 * Zestawienia z kroku tabelarycznego.
 *
 * Lista gości na 120 osób jest bezużyteczna dla kuchni jako lista — kucharz
 * potrzebuje „mięsne 45, wegetariańskie 12, bezglutenowe 3”, a nie stu
 * dwudziestu nazwisk. Dlatego kolumna może być oznaczona jako:
 *
 * - `sum`   — wartości liczbowe sumujemy (liczba osób, dopłaty, porcje),
 * - `group` — wiersze grupujemy po jej wartości i zliczamy.
 *
 * Gdy w tabeli są obie naraz, sumy liczą się **w obrębie grupy**: przy
 * grupowaniu po kolumnie „Menu” i sumowaniu „Liczba osób” dostajemy
 * „mięsne — 45 osób”, czyli dokładnie to, co idzie na zamówienie do kuchni.
 */

/** Sposób podsumowania kolumny tabeli. */
export type ColumnAggregate = "sum" | "group";

export const AGREGACJE: { value: ColumnAggregate; label: string; hint: string }[] = [
  {
    value: "sum",
    label: "Sumuj",
    hint: "Kolumna liczbowa — w podsumowaniu pokaże się suma wszystkich wierszy.",
  },
  {
    value: "group",
    label: "Grupuj i zliczaj",
    hint: "Wiersze zostaną pogrupowane po wartości tej kolumny wraz z liczbą wystąpień.",
  },
];

export type SumaKolumny = { key: string; label: string; suma: number };

export type PozycjaGrupy = {
  wartosc: string;
  /** Ile wierszy trafiło do tej grupy. */
  liczba: number;
  /** Sumy kolumn liczbowych policzone w obrębie tej grupy. */
  sumy: SumaKolumny[];
};

export type GrupowanieKolumny = {
  key: string;
  label: string;
  pozycje: PozycjaGrupy[];
};

export type PodsumowanieTabeli = {
  liczbaWierszy: number;
  sumy: SumaKolumny[];
  grupy: GrupowanieKolumny[];
};

/** Etykieta kolumny — z fallbackiem na klucz, bo etykieta bywa pusta. */
function etykieta(col: StepField): string {
  return col.label?.trim() || col.key;
}

/**
 * Liczba z komórki wpisanej przez człowieka.
 *
 * Ludzie wpisują „1 200,50”, „12 os.”, „45zł” — arkusz i tak to przyjmie,
 * więc podsumowanie też musi. Bierzemy pierwszą liczbę z komórki, traktując
 * przecinek jak separator dziesiętny, a spacje (także twarde) jak separator
 * tysięcy. Komórka bez liczby to zero wierszy do sumy, nie zero w sumie.
 */
export function parseLiczba(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const tekst = String(raw ?? "").trim();
  if (!tekst) return null;

  const bezSeparatorow = tekst.replace(/[\s\u00a0\u202f]/g, "").replace(/,/g, ".");
  const dopasowanie = bezSeparatorow.match(/-?\d+(?:\.\d+)?/);
  if (!dopasowanie) return null;

  const liczba = Number(dopasowanie[0]);
  return Number.isFinite(liczba) ? liczba : null;
}

/** Liczba do wyświetlenia: bez zbędnych zer, z przecinkiem jak w polskim. */
export function formatujLiczbe(n: number): string {
  const zaokraglona = Math.round(n * 100) / 100;
  return Number.isInteger(zaokraglona)
    ? String(zaokraglona)
    : zaokraglona.toFixed(2).replace(".", ",").replace(/,?0+$/, "");
}

/** Czy tabela ma cokolwiek do podsumowania — inaczej nie pokazujemy sekcji. */
export function maPodsumowanie(columns: StepField[]): boolean {
  return columns.some((c) => c.aggregate === "sum" || c.aggregate === "group");
}

function sumujKolumny(kolumny: StepField[], wiersze: TableRow[]): SumaKolumny[] {
  return kolumny.map((col) => {
    let suma = 0;
    for (const wiersz of wiersze) {
      const liczba = parseLiczba(wiersz[col.key]);
      if (liczba !== null) suma += liczba;
    }
    return { key: col.key, label: etykieta(col), suma };
  });
}

export function podsumujTabele(columns: StepField[], rows: TableRow[]): PodsumowanieTabeli {
  const wypelnione = rows.filter(isRowFilled);
  const doSumy = columns.filter((c) => c.aggregate === "sum");
  const doGrupowania = columns.filter((c) => c.aggregate === "group");

  const grupy: GrupowanieKolumny[] = doGrupowania.map((col) => {
    // Map trzyma kolejność wstawiania, więc grupy wychodzą w kolejności
    // pojawienia się w tabeli — tak, jak je wpisywał człowiek.
    const kubelki = new Map<string, TableRow[]>();
    for (const wiersz of wypelnione) {
      const wartosc = String(wiersz[col.key] ?? "").trim();
      if (!wartosc) continue; // pusta komórka nie jest osobną kategorią
      const lista = kubelki.get(wartosc) ?? [];
      lista.push(wiersz);
      kubelki.set(wartosc, lista);
    }

    const pozycje: PozycjaGrupy[] = [...kubelki.entries()].map(([wartosc, wiersze]) => ({
      wartosc,
      liczba: wiersze.length,
      sumy: sumujKolumny(doSumy, wiersze),
    }));

    // Najliczniejsze na górze — kuchnia czyta to jak zamówienie.
    pozycje.sort((a, b) => b.liczba - a.liczba || a.wartosc.localeCompare(b.wartosc, "pl"));

    return { key: col.key, label: etykieta(col), pozycje };
  });

  return {
    liczbaWierszy: wypelnione.length,
    sumy: sumujKolumny(doSumy, wypelnione),
    grupy,
  };
}

/** Jedna pozycja grupy jako tekst: „mięsne × 12 · Liczba osób: 45”. */
export function formatujPozycje(pozycja: PozycjaGrupy): string {
  const sumy = pozycja.sumy
    .filter((s) => s.suma !== 0)
    .map((s) => `${s.label}: ${formatujLiczbe(s.suma)}`);
  const ogon = sumy.length > 0 ? ` · ${sumy.join(" · ")}` : "";
  return `${pozycja.wartosc} × ${pozycja.liczba}${ogon}`;
}

/** Zestawienie grupowania jako tekst do agendy — każda pozycja w nowej linii. */
export function formatujGrupowanie(grupa: GrupowanieKolumny): string {
  return grupa.pozycje.map(formatujPozycje).join("\n");
}

/**
 * Co tabela odkłada w agendzie.
 *
 * Kolumna bez agregacji oddaje swoje wartości wiersz po wierszu — tak działa
 * lista winietek czy uczuleń. Kolumna oznaczona jako grupowana albo sumowana
 * oddaje **zestawienie**, bo agenda ma mówić kuchni „mięsne × 45”, a nie
 * wyliczać sto dwadzieścia nazwisk.
 */
export function tableAgendaEntries(
  columns: StepField[],
  rows: TableRow[],
): { targetAgendaKey: string; value: string }[] {
  const wypelnione = rows.filter(isRowFilled);
  const podsumowanie = podsumujTabele(columns, rows);
  const out: { targetAgendaKey: string; value: string }[] = [];

  for (const col of columns) {
    if (!col.targetAgendaKey) continue;

    if (col.aggregate === "group") {
      const grupa = podsumowanie.grupy.find((g) => g.key === col.key);
      const tekst = grupa ? formatujGrupowanie(grupa) : "";
      if (tekst) out.push({ targetAgendaKey: col.targetAgendaKey, value: tekst });
      continue;
    }

    if (col.aggregate === "sum") {
      const suma = podsumowanie.sumy.find((s) => s.key === col.key);
      // Suma zerowa znaczy zwykle „nikt nic nie wpisał” — nie zaśmiecamy agendy.
      if (suma && suma.suma !== 0) {
        out.push({ targetAgendaKey: col.targetAgendaKey, value: formatujLiczbe(suma.suma) });
      }
      continue;
    }

    const values = wypelnione
      .map((r) => String(r[col.key] ?? "").trim())
      .filter((v) => v !== "");
    if (values.length === 0) continue;
    out.push({ targetAgendaKey: col.targetAgendaKey, value: values.join("\n") });
  }

  return out;
}
