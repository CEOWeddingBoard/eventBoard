/**
 * Parser menu z tekstu — wklejasz surowe menu, a wg reguł organizacji
 * powstają warianty, sekcje (typy dań) i pozycje. Reguły definiuje się
 * na poziomie organizacji (słowa kluczowe → typ dania).
 *
 * Moduł czysto funkcyjny (bez "use server") — używany i po stronie serwera,
 * i do podglądu na kliencie.
 */

export type CourseType =
  | "APPETIZER" | "SOUP" | "MAIN" | "DESSERT" | "CAKE"
  | "COLD_PLATTER" | "BUFFET" | "DINNER" | "COFFEE_TEA"
  | "DRINKS" | "ALCOHOL" | "OTHER";

export const COURSE_TYPES: { value: CourseType; label: string }[] = [
  { value: "APPETIZER", label: "Przystawka" },
  { value: "SOUP", label: "Zupa" },
  { value: "MAIN", label: "Danie główne" },
  { value: "DESSERT", label: "Deser" },
  { value: "CAKE", label: "Tort" },
  { value: "COLD_PLATTER", label: "Zimna płyta" },
  { value: "BUFFET", label: "Bufet" },
  { value: "DINNER", label: "Kolacja" },
  { value: "COFFEE_TEA", label: "Kawa i herbata" },
  { value: "DRINKS", label: "Napoje" },
  { value: "ALCOHOL", label: "Alkohol" },
  { value: "OTHER", label: "Inne" },
];

/** Reguła sekcji: słowo kluczowe → typ dania. */
export type SectionRule = { match: string; courseType: CourseType };

export type ParserRules = {
  /** Słowa kluczowe rozpoznające sekcje (dopasowanie: zawiera, bez wielkości liter). */
  sections: SectionRule[];
  /** Początki linii oznaczające nowy wariant. */
  variantMarkers: string[];
  /** Znaki rozpoczynające pozycję (danie). */
  bulletChars: string;
  /** Linie zawierające którykolwiek z tych fragmentów są pomijane. */
  ignoreContains: string[];
};

export const DEFAULT_RULES: ParserRules = {
  sections: [
    { match: "bufet dań ciepłych", courseType: "MAIN" },
    { match: "danie ciepłe", courseType: "MAIN" },
    { match: "dania ciepłe", courseType: "MAIN" },
    { match: "zimny bufet", courseType: "COLD_PLATTER" },
    { match: "zimna płyta", courseType: "COLD_PLATTER" },
    { match: "przystawk", courseType: "APPETIZER" },
    { match: "zupa", courseType: "SOUP" },
    { match: "bufet deserowy", courseType: "DESSERT" },
    { match: "deser", courseType: "DESSERT" },
    { match: "tort", courseType: "CAKE" },
    { match: "napoje", courseType: "DRINKS" },
    { match: "alkohol", courseType: "ALCOHOL" },
    { match: "kawa", courseType: "COFFEE_TEA" },
  ],
  variantMarkers: ["Wariant", "Menu", "Pakiet", "Opcja"],
  bulletChars: "*-•–—·",
  ignoreContains: ["cena menu", "cena za"],
};

export type ParsedCourse = { name: string; courseType: CourseType };
export type ParsedVariant = { label: string; pricePerPerson: number | null; courses: ParsedCourse[] };

export function parseRules(rulesJson: string | null | undefined): ParserRules {
  if (!rulesJson) return DEFAULT_RULES;
  try {
    const raw = JSON.parse(rulesJson) as Partial<ParserRules>;
    return {
      sections: raw.sections?.length ? raw.sections : DEFAULT_RULES.sections,
      variantMarkers: raw.variantMarkers?.length ? raw.variantMarkers : DEFAULT_RULES.variantMarkers,
      bulletChars: raw.bulletChars || DEFAULT_RULES.bulletChars,
      ignoreContains: raw.ignoreContains ?? DEFAULT_RULES.ignoreContains,
    };
  } catch {
    return DEFAULT_RULES;
  }
}

function norm(s: string): string {
  return s.toLowerCase().trim();
}

/** „250 PLN netto/os." → 250. Tylko linie wyglądające na cenę za osobę. */
function detectPricePerPerson(line: string): number | null {
  const l = norm(line);
  if (!/(pln|zł)/.test(l)) return null;
  if (!/os\b|osob|\/\s*os/.test(l)) return null;
  const m = l.match(/(\d[\d\s.]*)\s*(pln|zł)/);
  if (!m) return null;
  const n = parseInt(m[1].replace(/[\s.]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function isSeparatorLine(line: string): boolean {
  return /^[\s⸻—─–\-*_.·]+$/.test(line) && line.replace(/\s/g, "").length >= 1 && !/[a-zA-Ząćęłńóśźż0-9]/.test(line);
}

/** Parsuje surowy tekst menu do struktury wariantów wg reguł. */
export function parseMenuText(text: string, rules: ParserRules = DEFAULT_RULES): ParsedVariant[] {
  const bullets = rules.bulletChars.split("");
  const variants: ParsedVariant[] = [];
  let current: ParsedVariant | null = null;
  let currentType: CourseType = "OTHER";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (isSeparatorLine(line)) continue;

    const low = norm(line);
    if (rules.ignoreContains.some((frag) => frag && low.includes(norm(frag)))) continue;

    // Nowy wariant
    if (rules.variantMarkers.some((mk) => mk && low.startsWith(norm(mk)))) {
      current = { label: line.replace(/\s+/g, " ").trim(), pricePerPerson: null, courses: [] };
      variants.push(current);
      currentType = "OTHER";
      continue;
    }

    // Cena za osobę (dopóki wariant nie ma jeszcze dań)
    const price = detectPricePerPerson(line);
    if (price != null && current && current.courses.length === 0) {
      current.pricePerPerson = price;
      continue;
    }

    // Sekcja (słowo kluczowe → typ dania)
    const section = rules.sections.find((s) => s.match && low.includes(norm(s.match)));
    if (section) {
      currentType = section.courseType;
      continue;
    }

    // Pozycja (danie) — tylko linie od znacznika
    const first = line[0];
    if (bullets.includes(first)) {
      if (!current) {
        current = { label: "Menu", pricePerPerson: null, courses: [] };
        variants.push(current);
      }
      const name = line.slice(1).replace(/^[\s]+/, "").replace(/[,.;:]+\s*$/, "").trim();
      if (name) current.courses.push({ name, courseType: currentType });
    }
  }

  return variants.filter((v) => v.courses.length > 0 || v.pricePerPerson != null);
}
