import {
  czyLinkAktywny,
  czyLinkMozeZamknacKrok,
  krokiDlaRoli,
  wymaganaRolaKroku,
} from "@/lib/event-access";

/**
 * Token jest jedynym dowodem tożsamości osoby bez konta, więc rola linku
 * decyduje o tym, co wolno zamknąć. Błąd tutaj znaczy, że wedding planner
 * domyka kroki zamawiającego albo że ktoś z linkiem wchodzi w krok wewnętrzny
 * obiektu — dlatego te reguły mają własne testy, osobno od akcji serwerowej.
 */

describe("wymaganaRolaKroku", () => {
  it("„kto wypełnia” wygrywa nad „wykonuje”", () => {
    expect(wymaganaRolaKroku({ fillRole: "CLIENT", assigneeRole: "MANAGER" })).toBe("CLIENT");
  });

  it("bez „kto wypełnia” bierzemy rolę wykonującego", () => {
    expect(wymaganaRolaKroku({ fillRole: null, assigneeRole: "PLANNER" })).toBe("PLANNER");
  });

  it("krok bez ról nie wymaga żadnej", () => {
    expect(wymaganaRolaKroku({})).toBe("");
  });
});

describe("czyLinkMozeZamknacKrok", () => {
  it("wpuszcza posiadacza linku do kroku jego roli", () => {
    expect(czyLinkMozeZamknacKrok("CLIENT", { fillRole: "CLIENT" })).toBe(true);
    expect(czyLinkMozeZamknacKrok("PLANNER", { fillRole: "PLANNER" })).toBe(true);
  });

  it("nie pozwala plannerowi zamknąć kroku zamawiającego", () => {
    expect(czyLinkMozeZamknacKrok("PLANNER", { fillRole: "CLIENT" })).toBe(false);
  });

  it("nie pozwala zamawiającemu zamknąć kroku plannera", () => {
    expect(czyLinkMozeZamknacKrok("CLIENT", { fillRole: "PLANNER" })).toBe(false);
  });

  it("krok „Klient + Manager” otwiera się tylko dla klienta", () => {
    expect(czyLinkMozeZamknacKrok("CLIENT", { fillRole: "BOTH" })).toBe(true);
    expect(czyLinkMozeZamknacKrok("PLANNER", { fillRole: "BOTH" })).toBe(false);
  });

  it("krok bez roli jest wewnętrzny — żaden link go nie domyka", () => {
    expect(czyLinkMozeZamknacKrok("CLIENT", {})).toBe(false);
    expect(czyLinkMozeZamknacKrok("CLIENT", { fillRole: "", assigneeRole: "" })).toBe(false);
  });

  it("link bez roli nie otwiera niczego", () => {
    expect(czyLinkMozeZamknacKrok("", { fillRole: "CLIENT" })).toBe(false);
  });

  it("rola własna działa tak samo jak gotowa", () => {
    expect(czyLinkMozeZamknacKrok("Dekorator", { fillRole: "Dekorator" })).toBe(true);
    expect(czyLinkMozeZamknacKrok("Dekorator", { fillRole: "Florysta" })).toBe(false);
  });

  it("kroki zespołu obiektu zostają poza zasięgiem linku", () => {
    expect(czyLinkMozeZamknacKrok("CLIENT", { fillRole: "CHEF" })).toBe(false);
    expect(czyLinkMozeZamknacKrok("PLANNER", { fillRole: "MANAGER" })).toBe(false);
  });
});

describe("czyLinkAktywny", () => {
  const teraz = new Date("2026-06-01T12:00:00Z");

  it("link w terminie działa", () => {
    expect(czyLinkAktywny({ expiresAt: new Date("2026-06-10T00:00:00Z") }, teraz)).toBe(true);
  });

  it("link po terminie nie działa", () => {
    expect(czyLinkAktywny({ expiresAt: new Date("2026-05-30T00:00:00Z") }, teraz)).toBe(false);
  });

  it("link unieważniony nie działa, nawet w terminie", () => {
    expect(
      czyLinkAktywny(
        { expiresAt: new Date("2026-06-10T00:00:00Z"), revokedAt: new Date("2026-06-01T09:00:00Z") },
        teraz,
      ),
    ).toBe(false);
  });
});

describe("krokiDlaRoli", () => {
  const kroki = [
    { id: "1", fillRole: "CLIENT" },
    { id: "2", fillRole: "PLANNER" },
    { id: "3", fillRole: "CHEF" },
    { id: "4", fillRole: "BOTH" },
    { id: "5", fillRole: null, assigneeRole: "MANAGER" },
  ];

  it("zamawiający widzi swoje kroki i wspólne", () => {
    expect(krokiDlaRoli("CLIENT", kroki).map((k) => k.id)).toEqual(["1", "4"]);
  });

  it("planner widzi wyłącznie swoje", () => {
    expect(krokiDlaRoli("PLANNER", kroki).map((k) => k.id)).toEqual(["2"]);
  });

  it("kuchnia i manager nie wyciekają do portalu", () => {
    const widoczne = [...krokiDlaRoli("CLIENT", kroki), ...krokiDlaRoli("PLANNER", kroki)];
    expect(widoczne.map((k) => k.id)).not.toContain("3");
    expect(widoczne.map((k) => k.id)).not.toContain("5");
  });
});
