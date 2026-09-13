/**
 * Limity prób (logowanie, reset hasła).
 *
 * `checkRateLimit` jest wyłączony w NODE_ENV=test, żeby nie psuć innych testów —
 * dlatego tutaj podmieniamy środowisko na czas asercji.
 */

import { checkRateLimit, getClientIpFromRequest, RATE_LIMITS } from "@/lib/api/rate-limit";

function withRateLimitEnabled<T>(fn: () => T): T {
  const prev = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  try {
    return fn();
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prev;
  }
}

let licznik = 0;
function unikalnyKlucz(): string {
  licznik += 1;
  return `test-key-${Date.now()}-${licznik}`;
}

describe("checkRateLimit", () => {
  it("przepuszcza do wyczerpania limitu, potem odmawia", () => {
    withRateLimitEnabled(() => {
      const key = unikalnyKlucz();
      const opcje = { key, limit: 3, windowMs: 60_000 };

      expect(checkRateLimit(opcje)).toMatchObject({ ok: true, remaining: 2 });
      expect(checkRateLimit(opcje)).toMatchObject({ ok: true, remaining: 1 });
      expect(checkRateLimit(opcje)).toMatchObject({ ok: true, remaining: 0 });
      expect(checkRateLimit(opcje)).toMatchObject({ ok: false, remaining: 0 });
    });
  });

  it("liczy osobno dla różnych kluczy — jedno IP nie blokuje drugiego", () => {
    withRateLimitEnabled(() => {
      const a = { key: unikalnyKlucz(), limit: 1, windowMs: 60_000 };
      const b = { key: unikalnyKlucz(), limit: 1, windowMs: 60_000 };

      expect(checkRateLimit(a).ok).toBe(true);
      expect(checkRateLimit(a).ok).toBe(false);
      expect(checkRateLimit(b).ok).toBe(true);
    });
  });

  it("zwalnia blokadę po upływie okna", () => {
    jest.useFakeTimers();
    try {
      withRateLimitEnabled(() => {
        const opcje = { key: unikalnyKlucz(), limit: 1, windowMs: 60_000 };
        expect(checkRateLimit(opcje).ok).toBe(true);
        expect(checkRateLimit(opcje).ok).toBe(false);

        jest.setSystemTime(Date.now() + 61_000);
        expect(checkRateLimit(opcje).ok).toBe(true);
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("w środowisku testowym nie blokuje niczego", () => {
    const opcje = { key: unikalnyKlucz(), limit: 1, windowMs: 60_000 };
    expect(checkRateLimit(opcje).ok).toBe(true);
    expect(checkRateLimit(opcje).ok).toBe(true);
  });

  it("ma zdefiniowany ostry limit dla ścieżek wrażliwych", () => {
    expect(RATE_LIMITS.STRICT.limit).toBeLessThanOrEqual(RATE_LIMITS.AUTH.limit);
  });
});

describe("getClientIpFromRequest", () => {
  it("bierze pierwszy adres z x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIpFromRequest({ headers })).toBe("203.0.113.7");
  });

  it("spada na x-real-ip, a bez niego zwraca unknown", () => {
    expect(getClientIpFromRequest({ headers: new Headers({ "x-real-ip": "198.51.100.4" }) })).toBe("198.51.100.4");
    expect(getClientIpFromRequest({ headers: new Headers() })).toBe("unknown");
  });
});
