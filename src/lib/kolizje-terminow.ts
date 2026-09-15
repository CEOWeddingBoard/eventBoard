/**
 * Kolizje terminów przyjęć.
 *
 * Do tej pory nic nie sprawdzało, czy sala jest już zajęta — dwa przyjęcia na tej
 * samej sali tego samego dnia zapisywały się bez słowa. Dla obiektu to
 * najkosztowniejszy możliwy błąd, bo kończy się odwoływaniem wesela.
 *
 * Świadomie OSTRZEŻENIE, nie blokada: dwa wesela na dwóch salach i bankiet
 * w ogrodzie tego samego dnia to normalny dzień pracy dużego obiektu. Decyzję
 * podejmuje człowiek, system ma tylko nie pozwolić przeoczyć.
 */

export type RodzajKolizji = "ta-sama-sala" | "dzien-zablokowany" | "ten-sam-dzien";

export type Kolizja = {
  rodzaj: RodzajKolizji;
  /** Zdanie gotowe do pokazania — bez składania go w komponencie. */
  opis: string;
  /** Waga: „blokada" wymaga świadomej decyzji, „uwaga" tylko informuje. */
  waga: "blokada" | "uwaga";
  eventId?: string;
};

export type WejscieDoSprawdzenia = {
  /** Dzień przyjęcia (ISO albo Date). */
  data: Date;
  hallId: string | null;
  /** Przy edycji — żeby event nie kolidował sam ze sobą. */
  pomijanyEventId?: string | null;
};

export type IstniejacyEvent = {
  id: string;
  name: string;
  date: Date;
  hallId: string | null;
  hallName: string | null;
};

export function tenSamDzien(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Zwraca kolizje dla planowanego terminu.
 *
 * @param wejscie planowany termin i sala
 * @param eventy przyjęcia tego obiektu z okolic tej daty
 * @param zablokowaneDni daty zablokowane w kalendarzu obiektu
 */
export function znajdzKolizje(
  wejscie: WejscieDoSprawdzenia,
  eventy: IstniejacyEvent[],
  zablokowaneDni: { date: Date; reason: string | null }[] = [],
): Kolizja[] {
  const out: Kolizja[] = [];
  const data = wejscie.data;

  const blokada = zablokowaneDni.find((b) => tenSamDzien(b.date, data));
  if (blokada) {
    out.push({
      rodzaj: "dzien-zablokowany",
      waga: "blokada",
      opis: blokada.reason
        ? `Ten dzień jest zablokowany w kalendarzu: ${blokada.reason}.`
        : "Ten dzień jest zablokowany w kalendarzu obiektu.",
    });
  }

  const tegoDnia = eventy.filter(
    (e) => e.id !== wejscie.pomijanyEventId && tenSamDzien(e.date, data),
  );

  for (const e of tegoDnia) {
    // Ta sama sala tego samego dnia to podwójna rezerwacja — najcięższy przypadek.
    if (wejscie.hallId && e.hallId === wejscie.hallId) {
      out.push({
        rodzaj: "ta-sama-sala",
        waga: "blokada",
        eventId: e.id,
        opis: `Sala ${e.hallName ?? ""} jest już zajęta tego dnia: „${e.name}".`.replace("  ", " "),
      });
      continue;
    }

    // Brak sal w obiekcie (albo event bez przypisanej sali) — nie wiemy, czy to
    // kolizja, ale człowiek musi o tym wiedzieć.
    if (!wejscie.hallId || !e.hallId) {
      out.push({
        rodzaj: "ten-sam-dzien",
        waga: "uwaga",
        eventId: e.id,
        opis: `Tego dnia jest już przyjęcie: „${e.name}".`,
      });
      continue;
    }

    out.push({
      rodzaj: "ten-sam-dzien",
      waga: "uwaga",
      eventId: e.id,
      opis: `Tego dnia jest już przyjęcie „${e.name}" na sali ${e.hallName ?? "innej"}.`,
    });
  }

  return out;
}

/** Czy wśród kolizji jest taka, która wymaga świadomej decyzji. */
export function maPowazneKolizje(kolizje: Kolizja[]): boolean {
  return kolizje.some((k) => k.waga === "blokada");
}
