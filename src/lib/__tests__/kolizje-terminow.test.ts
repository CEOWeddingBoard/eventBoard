/**
 * Kolizje terminów.
 *
 * Najważniejszy przypadek: ta sama sala tego samego dnia. Podwójna rezerwacja
 * kończy się odwoływaniem wesela, więc musi być oznaczona jako wymagająca
 * decyzji, a nie jako drobna uwaga.
 */

import {
  znajdzKolizje,
  maPowazneKolizje,
  tenSamDzien,
  type RezerwacjaGoogle,
} from "@/lib/kolizje-terminow";

const dzien = (iso: string) => new Date(`${iso}T12:00:00`);

const event = (over: Partial<Parameters<typeof znajdzKolizje>[1][number]> & { id: string }) => ({
  name: "Wesele Kowalskich",
  date: dzien("2026-06-14"),
  hallId: "sala-a",
  hallName: "Sala Balowa",
  ...over,
});

describe("tenSamDzien", () => {
  it("porównuje dzień, nie godzinę", () => {
    expect(tenSamDzien(new Date("2026-06-14T08:00:00"), new Date("2026-06-14T23:00:00"))).toBe(true);
    expect(tenSamDzien(new Date("2026-06-14T23:59:00"), new Date("2026-06-15T00:01:00"))).toBe(false);
  });
});

describe("znajdzKolizje", () => {
  it("ta sama sala tego samego dnia wymaga decyzji", () => {
    const k = znajdzKolizje(
      { data: dzien("2026-06-14"), hallId: "sala-a" },
      [event({ id: "e1" })],
    );
    expect(k).toHaveLength(1);
    expect(k[0].rodzaj).toBe("ta-sama-sala");
    expect(k[0].waga).toBe("blokada");
    expect(maPowazneKolizje(k)).toBe(true);
  });

  it("inna sala tego samego dnia to tylko uwaga", () => {
    const k = znajdzKolizje(
      { data: dzien("2026-06-14"), hallId: "sala-b" },
      [event({ id: "e1", hallId: "sala-a" })],
    );
    expect(k[0].rodzaj).toBe("ten-sam-dzien");
    expect(k[0].waga).toBe("uwaga");
    expect(maPowazneKolizje(k)).toBe(false);
  });

  it("inny dzień to brak kolizji", () => {
    expect(
      znajdzKolizje({ data: dzien("2026-06-15"), hallId: "sala-a" }, [event({ id: "e1" })]),
    ).toEqual([]);
  });

  it("event nie koliduje sam ze sobą przy edycji", () => {
    expect(
      znajdzKolizje(
        { data: dzien("2026-06-14"), hallId: "sala-a", pomijanyEventId: "e1" },
        [event({ id: "e1" })],
      ),
    ).toEqual([]);
  });

  it("dzień zablokowany jest zgłaszany z powodem", () => {
    const k = znajdzKolizje({ data: dzien("2026-06-14"), hallId: "sala-a" }, [], [
      { date: dzien("2026-06-14"), reason: "Remont sali" },
    ]);
    expect(k[0].rodzaj).toBe("dzien-zablokowany");
    expect(k[0].opis).toContain("Remont sali");
    expect(maPowazneKolizje(k)).toBe(true);
  });

  it("brak przypisanej sali daje uwagę, nie ciszę", () => {
    const k = znajdzKolizje(
      { data: dzien("2026-06-14"), hallId: null },
      [event({ id: "e1", hallId: null, hallName: null })],
    );
    expect(k).toHaveLength(1);
    expect(k[0].waga).toBe("uwaga");
  });

  it("kilka przyjęć tego dnia daje kilka zgłoszeń", () => {
    const k = znajdzKolizje({ data: dzien("2026-06-14"), hallId: "sala-a" }, [
      event({ id: "e1", hallId: "sala-a" }),
      event({ id: "e2", hallId: "sala-b", name: "Komunia" }),
    ]);
    expect(k).toHaveLength(2);
    expect(k.filter((x) => x.waga === "blokada")).toHaveLength(1);
  });

  it("pusty kalendarz to brak kolizji", () => {
    expect(znajdzKolizje({ data: dzien("2026-06-14"), hallId: "sala-a" }, [])).toEqual([]);
  });
});

describe("rezerwacje z kalendarzy Google", () => {
  const dzien = new Date("2026-08-15T12:00:00");
  const rezerwacja = (over: Partial<RezerwacjaGoogle> = {}): RezerwacjaGoogle => ({
    tytul: "Chrzciny Nowaków",
    start: new Date("2026-08-15T14:00:00"),
    venueHallId: null,
    zrodlo: "Kalendarz sali",
    ...over,
  });

  it("zajęta ta sama sala to blokada, nie sugestia", () => {
    const k = znajdzKolizje(
      { data: dzien, hallId: "sala-a" },
      [],
      [],
      [rezerwacja({ venueHallId: "sala-a" })],
    );
    expect(k).toHaveLength(1);
    expect(k[0].waga).toBe("blokada");
    expect(k[0].rodzaj).toBe("rezerwacja-google");
    expect(k[0].opis).toContain("Kalendarz sali");
  });

  it("rezerwacja na innej sali to tylko uwaga", () => {
    const k = znajdzKolizje(
      { data: dzien, hallId: "sala-a" },
      [],
      [],
      [rezerwacja({ venueHallId: "sala-b" })],
    );
    expect(k[0].waga).toBe("uwaga");
  });

  it("rezerwacja całego obiektu nie blokuje konkretnej sali, ale ostrzega", () => {
    const k = znajdzKolizje({ data: dzien, hallId: "sala-a" }, [], [], [rezerwacja()]);
    expect(k[0].waga).toBe("uwaga");
  });

  it("rezerwacja z innego dnia nie ma znaczenia", () => {
    const k = znajdzKolizje(
      { data: dzien, hallId: "sala-a" },
      [],
      [],
      [rezerwacja({ start: new Date("2026-08-16T14:00:00"), venueHallId: "sala-a" })],
    );
    expect(k).toEqual([]);
  });

  it("nazwa rezerwacji trafia do opisu, żeby dało się ją znaleźć w Google", () => {
    const k = znajdzKolizje(
      { data: dzien, hallId: "sala-a" },
      [],
      [],
      [rezerwacja({ tytul: "Konferencja ACME", venueHallId: "sala-a" })],
    );
    expect(k[0].opis).toContain("Konferencja ACME");
  });
});
