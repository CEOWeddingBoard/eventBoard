import type { NextRequest } from "next/server";

/**
 * Uwierzytelnienie endpointu maszynowego.
 *
 * Preferowany jest nagłówek `x-cron-secret` — sekret w query stringu ląduje
 * w logach dostępowych serwera i w historii przeglądarki. Parametr `?secret=`
 * zostaje dla zgodności z tym, co mogło już być gdzieś zaplanowane.
 *
 * Brak `CRON_SECRET` w środowisku oznacza „zamknięte", nie „otwarte" — inaczej
 * pominięcie zmiennej przy wdrożeniu odsłaniałoby wszystkie crony.
 */
export function isValidCronSecret(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;

  const provided =
    req.headers.get("x-cron-secret")?.trim() ||
    req.nextUrl.searchParams.get("secret")?.trim() ||
    "";

  return provided.length > 0 && provided === expected;
}
