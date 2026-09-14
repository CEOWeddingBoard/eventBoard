/**
 * Limity pakietów, w tym liczba podłączonych kalendarzy Google.
 *
 * Ręczne ustawienie per przestrzeń ma pierwszeństwo nad pakietem — admin
 * platformy musi móc dać klientowi więcej bez zmiany pakietu.
 */

import { effectiveLimits, normalizePlan, PLANS } from "@/lib/plans";

describe("limit kalendarzy Google", () => {
  it("wynika z pakietu, gdy nie ma nadpisania", () => {
    expect(effectiveLimits("START").maxGoogleCalendars).toBe(5);
    expect(effectiveLimits("PRO").maxGoogleCalendars).toBe(10);
    expect(effectiveLimits("ENTERPRISE").maxGoogleCalendars).toBeNull();
  });

  it("nadpisanie per przestrzeń wygrywa z pakietem", () => {
    expect(effectiveLimits("START", { maxGoogleCalendars: 25 }).maxGoogleCalendars).toBe(25);
  });

  it("nadpisanie na zero jest respektowane, nie mylone z brakiem", () => {
    expect(effectiveLimits("PRO", { maxGoogleCalendars: 0 }).maxGoogleCalendars).toBe(0);
  });

  it("brak nadpisania (null) wraca do pakietu", () => {
    expect(effectiveLimits("PRO", { maxGoogleCalendars: null }).maxGoogleCalendars).toBe(10);
  });

  it("nieznany pakiet traktujemy jak START — nie jak brak limitu", () => {
    expect(normalizePlan("COKOLWIEK")).toBe("START");
    expect(effectiveLimits("COKOLWIEK").maxGoogleCalendars).toBe(5);
  });

  it("stara wartość BASIC mapuje się na START", () => {
    expect(effectiveLimits("BASIC").maxGoogleCalendars).toBe(PLANS.START.maxGoogleCalendars);
  });

  it("pozostałe limity nie ucierpiały", () => {
    expect(effectiveLimits("START").maxAdmins).toBe(1);
    expect(effectiveLimits("PRO").maxUsers).toBe(10);
  });
});
