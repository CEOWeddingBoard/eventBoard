/**
 * Retry logic utility for API calls
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'fixed' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> & { onRetry?: RetryOptions['onRetry'] } = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxAttempts) {
        throw lastError;
      }

      if (opts.onRetry) {
        opts.onRetry(attempt, lastError);
      }

      const delay = opts.backoff === 'exponential'
        ? opts.delay * Math.pow(2, attempt - 1)
        : opts.delay;

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if error is retryable (network errors, timeouts, 5xx errors)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return true;
    }
    
    // Check if it's an HTTP error with retryable status code
    const match = error.message.match(/status[:\s]+(\d+)/i);
    if (match) {
      const statusCode = parseInt(match[1], 10);
      return statusCode >= 500 || statusCode === 429; // Server errors or rate limit
    }
  }

  return false;
}
