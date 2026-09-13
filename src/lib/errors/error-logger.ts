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

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Logger]', errorData);
  }

  // TODO: Integrate with production error tracking service
  // Example: Sentry.captureException(error, { extra: errorData });
  
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
