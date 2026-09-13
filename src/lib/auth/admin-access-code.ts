import crypto from "crypto";

/**
 * Dzienny, rotujący kod dostępu admina.
 *
 * Wyprowadzany deterministycznie z CRON_SECRET i bieżącej daty (UTC), więc nie
 * trzeba go nigdzie przechowywać. Zmienia się raz na dobę i pojawia się w logach
 * aplikacji — dostęp do niego ma tylko ktoś, kto widzi logi Railway. Endpoint
 * bootstrapu przyjmuje ten kod ZAMIAST długiego CRON_SECRET, dzięki czemu w
 * adresie URL nie trzeba wpisywać stałego sekretu.
 */

function dayStamp(d = new Date()): string {
  // YYYYMMDD w UTC — spójne niezależnie od strefy serwera.
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Kod dla wskazanego dnia (domyślnie dziś). Pusty string, gdy brak CRON_SECRET. */
export function getDailyAdminCode(date = new Date()): string {
  const base = process.env.CRON_SECRET?.trim();
  if (!base) return "";
  return crypto
    .createHmac("sha256", base)
    .update(`admin-bootstrap:${dayStamp(date)}`)
    .digest("hex")
    .slice(0, 10);
}

/**
 * Czy podany sekret jest ważny: pełny CRON_SECRET albo dzisiejszy/wczorajszy
 * kod dzienny (mała tolerancja na granicy doby / strefy czasowej).
 */
export function isValidAdminSecret(provided: string | null | undefined): boolean {
  const secret = (provided ?? "").trim();
  if (!secret) return false;
  const base = process.env.CRON_SECRET?.trim();
  if (!base) return false;
  if (safeEq(secret, base)) return true;

  const today = getDailyAdminCode();
  const yesterday = getDailyAdminCode(new Date(Date.now() - 24 * 60 * 60 * 1000));
  return safeEq(secret, today) || safeEq(secret, yesterday);
}

function safeEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

let lastLoggedDay = "";

/**
 * Wypisuje dzisiejszy kod do logów — maks. raz na dobę na proces. Wywoływane
 * przy starcie serwera (instrumentation) oraz z crona /api/cron/admin-access-code.
 */
export function logDailyAdminCode(reason = "boot"): void {
  const code = getDailyAdminCode();
  if (!code) {
    console.warn("[admin-access-code] CRON_SECRET nieustawiony — kod dzienny wyłączony.");
    return;
  }
  const today = dayStamp();
  if (lastLoggedDay === today) return;
  lastLoggedDay = today;
  console.log(
    `[admin-access-code] (${reason}) Kod dostepu admina na dzis (${today} UTC): ${code}\n` +
      `  Uzyj: /api/admin/bootstrap?secret=${code}&email=<twoj-email>`,
  );
}
