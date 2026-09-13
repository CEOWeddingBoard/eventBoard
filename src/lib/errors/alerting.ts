import "server-only";

/**
 * Alert o awarii, który realnie dociera.
 *
 * Sam dashboard nie wystarczy — nikt nie ogląda go w sobotę w trakcie wesela.
 * Dlatego błąd 5xx idzie e-mailem na adres z `ALERT_EMAIL`.
 *
 * Świadomie bez SMS-a: ten moduł jest wołany z `onRequestError`
 * w `src/instrumentation.ts`, które Next pakuje także dla runtime edge. Twilio
 * ciągnie `crypto` i `stream`, więc sama obecność tego importu wywracała build.
 * SMS zostaje tam, gdzie działa bez ryzyka — w cronach (runtime nodejs).
 *
 * Wysyłki są tłumione: ten sam błąd nie wyśle drugiego powiadomienia przez
 * `ALERT_DEDUP_MINUTES` (domyślnie 30), żeby awaria w pętli nie zasypała skrzynki.
 */

const DEDUP_MS = Number(process.env.ALERT_DEDUP_MINUTES ?? 30) * 60 * 1000;
const ostatnieWysylki = new Map<string, number>();

export type AlertPayload = {
  message: string;
  statusCode?: number;
  path?: string;
  component?: string;
  stack?: string;
};

function dedupKey(a: AlertPayload): string {
  return `${a.statusCode ?? 500}:${a.component ?? "-"}:${a.path ?? "-"}:${a.message}`;
}

function shouldSend(a: AlertPayload): boolean {
  const key = dedupKey(a);
  const now = Date.now();
  const last = ostatnieWysylki.get(key);
  if (last && now - last < DEDUP_MS) return false;
  ostatnieWysylki.set(key, now);
  return true;
}

function plainBody(a: AlertPayload): string {
  return [
    `Status: ${a.statusCode ?? 500}`,
    a.path ? `Ścieżka: ${a.path}` : null,
    a.component ? `Miejsce: ${a.component}` : null,
    `Błąd: ${a.message}`,
    `Czas: ${new Date().toISOString()}`,
    a.stack ? `\n${a.stack.split("\n").slice(0, 8).join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Wysyła alert, jeśli błąd jest serwerowy (5xx) i skonfigurowano odbiorcę.
 * Nigdy nie rzuca — alert nie może wywrócić obsługi żądania.
 */
export async function sendServerErrorAlert(a: AlertPayload): Promise<void> {
  const status = a.statusCode ?? 500;
  if (status < 500) return;
  if (process.env.NODE_ENV === "test") return;
  if (!shouldSend(a)) return;

  const body = plainBody(a);
  const subject = `[EventBoard] Błąd ${status}${a.path ? ` — ${a.path}` : ""}`;

  const to = process.env.ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (to && apiKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM || "EventBoard <onboarding@resend.dev>",
        to,
        subject,
        text: body,
      });
    } catch (e) {
      console.error("[alerting] nie udało się wysłać e-maila", e);
    }
  }

}

/** Tylko do testów — czyści pamięć tłumienia powtórek. */
export function resetAlertDedupForTests(): void {
  ostatnieWysylki.clear();
}
