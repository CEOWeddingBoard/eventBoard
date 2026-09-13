/**
 * Centralized error logging service
 * Logs errors to console in development, can be extended for production services (Sentry, LogRocket, etc.)
 */

export type ErrorContext = {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function logError(error: Error | AppError, context?: ErrorContext) {
  const errorData = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context: error instanceof AppError ? { ...error.context, ...context } : context,
    code: error instanceof AppError ? error.code : undefined,
    statusCode: error instanceof AppError ? error.statusCode : undefined,
  };

  // W produkcji też logujemy — inaczej jedynym sladem awarii jest telefon klienta.
  console.error('[Error Logger]', errorData);

  // Sentry: wysyłamy tylko gdy jest DSN. Import dynamiczny, żeby brak konfiguracji
  // nie wywracał żądania i żeby SDK nie ładował się bez potrzeby.
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    void import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, { extra: errorData as Record<string, unknown> });
      })
      .catch(() => {
        /* brak SDK — zostaje log w konsoli */
      });
  }

  // Alert dla człowieka przy błędach serwerowych.
  const status = error instanceof AppError ? error.statusCode ?? 500 : 500;
  if (status >= 500 && typeof window === 'undefined') {
    void import('@/lib/errors/alerting')
      .then(({ sendServerErrorAlert }) =>
        sendServerErrorAlert({
          message: error.message,
          statusCode: status,
          component: errorData.context?.component,
          path: errorData.context?.action,
          stack: error.stack,
        }),
      )
      .catch(() => {
        /* alert jest dodatkiem, nie może przerwać obsługi błędu */
      });
  }

  return errorData;
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      { action: 'api_call' }
    );
  }

  return new AppError(
    'Wystąpił nieoczekiwany błąd',
    'UNKNOWN_ERROR',
    500,
    { action: 'api_call' }
  );
}
