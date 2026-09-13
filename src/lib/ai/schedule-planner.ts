/**
 * Deterministyczny planer harmonogramu dnia.
 *
 * Zastępuje zaślepkę, która zwracała pięć sztywnych punktów niezależnie od
 * wszystkiego: ten sam plan dostawało wesele, komunia i bankiet firmowy,
 * wskazówki wpisane przez użytkownika były ignorowane, a menu i liczba gości
 * — mimo że pobierane — nie wpływały na wynik.
 *
 * Planer nie wymaga modelu językowego. Buduje plan z typu wydarzenia, liczby
 * gości i realnych dań w menu, a wskazówki użytkownika traktuje jako kotwice
 * czasowe („ceremonia o 15:00”), względem których układa resztę.
 */

export interface PlannedItem {
  title: string;
  description: string;
  location: string | null;
  startTime: string;
  endTime: string;
}

export interface PlannerEvent {
  name: string;
  date: Date | string;
  eventType: string | null;
  estimatedGuestCount: number | null;
  style?: string | null;
  receptionLocationName?: string | null;
}

export interface PlannerMenuVariant {
  label: string;
  courses: { name: string; courseType?: string | null }[];
}

/** Szkielet punktu przed osadzeniem w czasie. */
type Beat = {
  key: string;
  title: string;
  description: string;
  /** Minuty od startu przyjęcia; ujemne to przygotowania przed. */
  offset: number;
  /** Czas trwania w minutach; skalowany liczbą gości gdy `scales`. */
  duration: number;
  scales?: boolean;
};

const SZABLONY: Record<string, { start: number; beats: Beat[] }> = {
  WEDDING: {
    start: 15 * 60,
    beats: [
      { key: "przygotowanie", title: "Przygotowanie sali", description: "Dekoracja, ustawienie stołów, próba nagłośnienia i oświetlenia.", offset: -300, duration: 240 },
      { key: "ceremonia", title: "Ceremonia", description: "Powitanie gości, ceremonia, sesja zdjęciowa pary.", offset: 0, duration: 60 },
      { key: "powitanie", title: "Powitanie chlebem i solą", description: "Wejście pary na salę, toast powitalny.", offset: 75, duration: 30 },
      { key: "obiad", title: "Obiad — pierwsze danie", description: "Serwis kelnerski.", offset: 120, duration: 60, scales: true },
      { key: "danie_glowne", title: "Danie główne", description: "Serwis dania głównego.", offset: 195, duration: 60, scales: true },
      { key: "tort", title: "Tort i pierwszy taniec", description: "Wyciszenie muzyki, oświetlenie punktowe na parkiet.", offset: 300, duration: 45 },
      { key: "zabawa", title: "Zabawa taneczna", description: "Blok taneczny z przerwami na kolejne serwisy.", offset: 360, duration: 240 },
      { key: "kolacja", title: "Poczęstunek nocny", description: "Bufet ciepły — żurek, bigos, przekąski.", offset: 510, duration: 60, scales: true },
      { key: "zakonczenie", title: "Zakończenie", description: "Pożegnanie gości, uprzątnięcie sali.", offset: 660, duration: 90 },
    ],
  },
  COMMUNION: {
    start: 12 * 60,
    beats: [
      { key: "przygotowanie", title: "Przygotowanie sali", description: "Dekoracja, ustawienie stołów.", offset: -180, duration: 150 },
      { key: "przyjazd", title: "Przyjazd gości", description: "Powitanie, szatnia, napoje powitalne.", offset: 0, duration: 30 },
      { key: "obiad", title: "Obiad", description: "Serwis dań zgodnie z menu.", offset: 45, duration: 90, scales: true },
      { key: "tort", title: "Tort i słodki stół", description: "Podanie deserów, kawa, herbata.", offset: 165, duration: 60 },
      { key: "zakonczenie", title: "Zakończenie", description: "Pożegnanie gości, uprzątnięcie sali.", offset: 285, duration: 60 },
    ],
  },
  CORPORATE: {
    start: 18 * 60,
    beats: [
      { key: "przygotowanie", title: "Przygotowanie sali", description: "Ustawienie sceny, nagłośnienie, rejestracja gości.", offset: -240, duration: 180 },
      { key: "rejestracja", title: "Rejestracja i koktajl powitalny", description: "Przyjęcie gości, identyfikatory, napoje.", offset: 0, duration: 45 },
      { key: "czesc_oficjalna", title: "Część oficjalna", description: "Wystąpienia, prezentacja, wręczenie wyróżnień.", offset: 60, duration: 60 },
      { key: "kolacja", title: "Kolacja", description: "Serwis zgodnie z menu.", offset: 135, duration: 90, scales: true },
      { key: "zabawa", title: "Część nieformalna", description: "Muzyka, networking, bufet.", offset: 240, duration: 180 },
      { key: "zakonczenie", title: "Zakończenie", description: "Pożegnanie gości, uprzątnięcie sali.", offset: 435, duration: 60 },
    ],
  },
  CHRISTMAS_EVE: {
    start: 17 * 60,
    beats: [
      { key: "przygotowanie", title: "Przygotowanie sali", description: "Dekoracja świąteczna, ustawienie stołów.", offset: -180, duration: 150 },
      { key: "przyjazd", title: "Przyjazd gości", description: "Powitanie, szatnia.", offset: 0, duration: 30 },
      { key: "zyczenia", title: "Życzenia i opłatek", description: "Wystąpienie, dzielenie się opłatkiem.", offset: 40, duration: 30 },
      { key: "kolacja", title: "Kolacja wigilijna", description: "Serwis dań postnych zgodnie z menu.", offset: 80, duration: 90, scales: true },
      { key: "deser", title: "Deser i kawa", description: "Słodki stół, ciasta, napoje gorące.", offset: 185, duration: 60 },
      { key: "zakonczenie", title: "Zakończenie", description: "Pożegnanie gości, uprzątnięcie sali.", offset: 275, duration: 60 },
    ],
  },
};

const DOMYSLNY = SZABLONY.CORPORATE;

/** Słowa, po których rozpoznajemy, do którego punktu odnosi się wskazówka. */
const SLOWA_KLUCZOWE: { key: string; wzorce: RegExp }[] = [
  { key: "ceremonia", wzorce: /ceremoni|ślub|slub|przysięg/i },
  { key: "przyjazd", wzorce: /przyjazd|przyj[eę]ci[ae] go[śs]ci|rejestracj/i },
  { key: "powitanie", wzorce: /powitan|chleb/i },
  { key: "obiad", wzorce: /obiad|pierwsze danie/i },
  { key: "danie_glowne", wzorce: /danie g[łl][óo]wne/i },
  { key: "kolacja", wzorce: /kolacj|pocz[eę]stunek|bufet nocny/i },
  { key: "tort", wzorce: /tort|pierwszy taniec|deser/i },
  { key: "zabawa", wzorce: /zabaw|taniec|muzyk|dj/i },
  { key: "czesc_oficjalna", wzorce: /oficjaln|przemów|wyst[ąa]pien|prezentacj/i },
  { key: "zakonczenie", wzorce: /zako[ńn]czen|koniec|po[żz]egnan/i },
];

/**
 * Wyciąga ze wskazówek pary „punkt → godzina”.
 * „ceremonia o 15:00, tort po 20:00” → { ceremonia: 900, tort: 1200 }
 */
export function parseInstructions(instructions?: string): Record<string, number> {
  if (!instructions?.trim()) return {};
  const kotwice: Record<string, number> = {};

  // Dzielimy na fragmenty, żeby godzina trafiła do właściwego słowa kluczowego.
  for (const fragment of instructions.split(/[,;.\n]+/)) {
    const czas = /(\d{1,2})[:.](\d{2})/.exec(fragment) ?? /\bo\s+(\d{1,2})\b/.exec(fragment);
    if (!czas) continue;
    const godzina = Number(czas[1]);
    const minuta = czas[2] ? Number(czas[2]) : 0;
    if (godzina > 23 || minuta > 59) continue;

    const dopasowanie = SLOWA_KLUCZOWE.find((s) => s.wzorce.test(fragment));
    if (dopasowanie) kotwice[dopasowanie.key] = godzina * 60 + minuta;
  }
  return kotwice;
}

/** Dania z menu wpisane w opis odpowiedniego serwisu. */
function opisSerwisu(base: string, warianty: PlannerMenuVariant[], typy: RegExp): string {
  const dania = warianty
    .flatMap((v) => v.courses.filter((c) => typy.test(c.courseType ?? c.name)).map((c) => c.name))
    .filter(Boolean);
  if (dania.length === 0) return base;
  const unikalne = [...new Set(dania)].slice(0, 4);
  return `${base} Menu: ${unikalne.join(", ")}.`;
}

function hhmm(dzien: Date, minuty: number): string {
  const d = new Date(dzien);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minuty);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function planSchedule(
  event: PlannerEvent,
  menuVariants: PlannerMenuVariant[] = [],
  instructions?: string,
): PlannedItem[] {
  const szablon = SZABLONY[event.eventType ?? ""] ?? DOMYSLNY;
  const kotwice = parseInstructions(instructions);
  const goscie = event.estimatedGuestCount ?? 80;
  const miejsce = event.receptionLocationName ?? null;
  const dzien = new Date(event.date);

  // Pierwsza kotwica wyznacza start przyjęcia; bez niej bierzemy domyślny
  // dla typu wydarzenia.
  let start = szablon.start;
  for (const beat of szablon.beats) {
    const kotwica = kotwice[beat.key];
    if (kotwica != null) {
      start = kotwica - beat.offset;
      break;
    }
  }

  // Serwis dla 200 osób trwa dłużej niż dla 40 — skalujemy łagodnie.
  const mnoznik = Math.min(1.6, Math.max(0.7, goscie / 100));

  return szablon.beats.map((beat) => {
    const od = kotwice[beat.key] ?? start + beat.offset;
    const trwanie = Math.round(beat.scales ? beat.duration * mnoznik : beat.duration);

    let opis = beat.description;
    if (beat.key === "obiad") opis = opisSerwisu(opis, menuVariants, /zupa|przystawk|pierwsze/i);
    else if (beat.key === "danie_glowne" || beat.key === "kolacja")
      opis = opisSerwisu(opis, menuVariants, /g[łl][óo]wne|main|danie/i);
    else if (beat.key === "tort" || beat.key === "deser")
      opis = opisSerwisu(opis, menuVariants, /deser|tort|s[łl]odk/i);

    if (beat.scales) opis += ` Liczba gości: ${goscie}.`;

    return {
      title: beat.title,
      description: opis,
      location: miejsce,
      startTime: hhmm(dzien, od),
      endTime: hhmm(dzien, od + trwanie),
    };
  });
}
