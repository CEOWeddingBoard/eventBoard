/** @jest-environment node */
import { canWrite, canDelete, scopeForMode } from "@/lib/google-calendar";

/**
 * Poziom dostępu do kalendarza klienta.
 *
 * Google zna tylko odczyt albo pełny zapis na wydarzeniach — nie ma zakresu
 * „zapisuj, ale nie kasuj”. Poziom WRITE jest więc regułą EventBoarda, nie
 * Google, i tylko te funkcje stoją między nami a skasowaniem komuś wpisu
 * z firmowego kalendarza. Stąd osobne testy.
 */

describe("scopeForMode", () => {
  it("podgląd prosi o węższy zakres, który Google realnie egzekwuje", () => {
    expect(scopeForMode("READ")).toBe("https://www.googleapis.com/auth/calendar.readonly");
  });

  it("zapis i pełna synchronizacja mają ten sam zakres — Google nie zna różnicy", () => {
    expect(scopeForMode("WRITE")).toBe("https://www.googleapis.com/auth/calendar.events");
    expect(scopeForMode("FULL")).toBe(scopeForMode("WRITE"));
  });

  it("nie prosimy o pełny zakres kalendarza, tylko o wydarzenia", () => {
    expect(scopeForMode("FULL")).not.toBe("https://www.googleapis.com/auth/calendar");
  });
});

describe("canWrite", () => {
  it("podgląd nie zapisuje niczego", () => {
    expect(canWrite("READ")).toBe(false);
  });

  it("zapis i pełna synchronizacja zapisują", () => {
    expect(canWrite("WRITE")).toBe(true);
    expect(canWrite("FULL")).toBe(true);
  });

  it("nieznana albo brakująca wartość nie otwiera zapisu", () => {
    expect(canWrite(null)).toBe(false);
    expect(canWrite(undefined)).toBe(false);
    expect(canWrite("COKOLWIEK")).toBe(false);
  });
});

describe("canDelete", () => {
  it("kasuje wyłącznie pełna synchronizacja", () => {
    expect(canDelete("FULL")).toBe(true);
  });

  it("zapis bez kasowania nie usuwa wpisów", () => {
    expect(canDelete("WRITE")).toBe(false);
  });

  it("podgląd tym bardziej nie usuwa", () => {
    expect(canDelete("READ")).toBe(false);
  });

  it("brak wartości nie daje prawa do kasowania", () => {
    expect(canDelete(null)).toBe(false);
    expect(canDelete(undefined)).toBe(false);
    expect(canDelete("")).toBe(false);
  });
});
