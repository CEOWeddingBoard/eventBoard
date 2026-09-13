import { prisma } from "@/lib/prisma";

/**
 * Trwały licznik prób — dla logowania i resetu hasła.
 *
 * Wersja w pamięci procesu (`checkRateLimit`) nadal ma sens tam, gdzie chodzi
 * o ochronę przed zalewem żądań. Nie nadaje się jednak do hamowania zgadywania
 * haseł: przy dwóch instancjach aplikacji limit jest de facto dwa razy wyższy,
 * a restart instancji zeruje go całkiem.
 *
 * Okno jest stałe, nie przesuwane: pierwszy trafiony klucz wyznacza koniec okna,
 * a po jego upływie licznik startuje od nowa. Przy dwóch równoległych żądaniach
 * na ten sam klucz możliwe jest jedno wejście ponad limit — przy limitach rzędu
 * 10 prób na 15 minut to nie zmienia nic, a upraszcza zapis do jednego działania.
 */

export type PersistentRateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: Date;
};

export async function checkPersistentRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<PersistentRateLimitResult> {
  const { key, limit, windowMs } = options;
  const now = new Date();

  // W testach jednostkowych liczniki tylko przeszkadzają — tak samo jak
  // w wersji w pamięci.
  if (process.env.NODE_ENV === "test") {
    return { ok: true, remaining: limit, resetAt: new Date(now.getTime() + windowMs) };
  }

  try {
    const existing = await prisma.rateLimitHit.findUnique({ where: { key } });

    if (!existing || existing.expiresAt <= now) {
      const expiresAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimitHit.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
      return { ok: true, remaining: limit - 1, resetAt: expiresAt };
    }

    if (existing.count >= limit) {
      return { ok: false, remaining: 0, resetAt: existing.expiresAt };
    }

    const updated = await prisma.rateLimitHit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return {
      ok: true,
      remaining: Math.max(0, limit - updated.count),
      resetAt: updated.expiresAt,
    };
  } catch (error) {
    // Baza niedostępna nie może zamknąć logowania wszystkim naraz.
    console.error("[rate-limit-db]", error);
    return { ok: true, remaining: limit, resetAt: new Date(now.getTime() + windowMs) };
  }
}

/** Zeruje licznik — po udanym logowaniu nie ma po co trzymać nieudanych prób. */
export async function clearPersistentRateLimit(key: string): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  try {
    await prisma.rateLimitHit.deleteMany({ where: { key } });
  } catch {
    /* brak licznika to nie błąd */
  }
}

/** Sprzątanie wygasłych liczników — wołane przy okazji, żeby tabela nie rosła. */
export async function pruneExpiredRateLimits(): Promise<number> {
  try {
    const { count } = await prisma.rateLimitHit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  } catch {
    return 0;
  }
}
