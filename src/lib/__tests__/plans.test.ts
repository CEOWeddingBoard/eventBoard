/**
 * Plany i limity przestrzeni.
 *
 * `Organization.plan` ma w bazie domyślne `"FREE"` i stare wartości (`BASIC`)
 * sprzed zmiany cennika, więc każdy odczyt musi przechodzić przez `normalizePlan`.
 * Limity decydują o tym, ile kont klient może założyć — pomyłka tutaj to albo
 * zablokowany klient, albo rozdane konta poza umową.
 */

import {
  PLANS,
  PLAN_KEYS,
  normalizePlan,
  effectiveLimits,
  planLabel,
} from "@/lib/plans";

describe("normalizePlan", () => {
  it("przyjmuje bieżące klucze, niezależnie od wielkości liter", () => {
    expect(normalizePlan("PRO")).toBe("PRO");
    expect(normalizePlan("pro")).toBe("PRO");
    expect(normalizePlan("Enterprise")).toBe("ENTERPRISE");
  });

  it("mapuje starą wartość BASIC na START", () => {
    expect(normalizePlan("BASIC")).toBe("START");
  });

  it("dla pustych i nieznanych wartości spada na START", () => {
    // Kolumna w bazie ma default "FREE" — nigdy nie było takiego planu w cenniku.
    expect(normalizePlan("FREE")).toBe("START");
    expect(normalizePlan(null)).toBe("START");
    expect(normalizePlan(undefined)).toBe("START");
    expect(normalizePlan("cokolwiek")).toBe("START");
  });
});

describe("effectiveLimits", () => {
  it("bierze limity z planu, gdy nie ma nadpisania", () => {
    expect(effectiveLimits("START")).toMatchObject({ maxAdmins: 1, maxUsers: 3 });
    expect(effectiveLimits("PRO")).toMatchObject({ maxAdmins: 2, maxUsers: 10 });
  });

  it("ENTERPRISE nie ma limitu", () => {
    expect(effectiveLimits("ENTERPRISE")).toMatchObject({ maxAdmins: null, maxUsers: null });
  });

  it("ręczne ustawienie per przestrzeń wygrywa z planem", () => {
    expect(effectiveLimits("START", { maxAdmins: 5, maxUsers: 25 })).toMatchObject({
      maxAdmins: 5,
      maxUsers: 25,
    });
  });

  it("nadpisanie tylko jednej wartości zostawia drugą z planu", () => {
    expect(effectiveLimits("PRO", { maxUsers: 40 })).toMatchObject({ maxAdmins: 2, maxUsers: 40 });
  });

  it("null w nadpisaniu znaczy „użyj limitu z planu”, nie „bez limitu”", () => {
    // Tak jest opisana kolumna w schemacie: null = domyślny limit z planu.
    // Zdjęcie limitu robi się planem ENTERPRISE, nie wpisaniem null.
    expect(effectiveLimits("START", { maxAdmins: null, maxUsers: null })).toMatchObject({
      maxAdmins: 1,
      maxUsers: 3,
    });
  });
});

describe("cennik", () => {
  it("ma dokładnie trzy plany w rosnącej pojemności", () => {
    expect(PLAN_KEYS).toEqual(["START", "PRO", "ENTERPRISE"]);
    expect(PLANS.START.maxUsers!).toBeLessThan(PLANS.PRO.maxUsers!);
    expect(PLANS.ENTERPRISE.maxUsers).toBeNull();
  });

  it("etykieta planu działa też dla starych wartości z bazy", () => {
    expect(planLabel("BASIC")).toBe("Start");
    expect(planLabel("FREE")).toBe("Start");
    expect(planLabel("PRO")).toBe("Pro");
  });
});
