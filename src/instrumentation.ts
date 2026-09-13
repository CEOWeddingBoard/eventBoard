/**
 * Hook uruchamiany przy starcie serwera:
 *  - wypisuje dzienny kod dostępu admina do logów (dostępny od razu po deployu,
 *    bez czekania na cron),
 *  - inicjalizuje Sentry, jeśli jest `SENTRY_DSN`.
 *
 * `onRequestError` łapie błędy renderowania i tras API, czyli dokładnie te 5xx,
 * o których dziś dowiadujesz się telefonem od klienta.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logDailyAdminCode } = await import("@/lib/auth/admin-access-code");
    logDailyAdminCode("boot");
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // Dane gości (alergie) są danymi szczególnej kategorii — nie wysyłamy
    // treści żądań ani nagłówków do zewnętrznego dostawcy.
    sendDefaultPii: false,
  });
}

type RequestErrorContext = {
  routerKind: string;
  routePath: string;
  routeType: string;
};

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: RequestErrorContext,
) {
  const err = error instanceof Error ? error : new Error(String(error));

  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err);
    } catch {
      /* brak SDK — zostaje log i alert */
    }
  }

  console.error("[onRequestError]", {
    path: request.path,
    method: request.method,
    route: context.routePath,
    message: err.message,
  });

  // Alerty ciągną Twilio i Resend — pakiety wyłącznie node'owe. W runtime edge
  // nie ma czego ładować, a próba kończy się błędem bundlera (brak `crypto`).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { sendServerErrorAlert } = await import("@/lib/errors/alerting");
    await sendServerErrorAlert({
      message: err.message,
      statusCode: 500,
      path: request.path ?? context.routePath,
      component: `${context.routerKind}:${context.routeType}`,
      stack: err.stack,
    });
  } catch {
    /* alert nie może przerwać obsługi błędu */
  }
}
