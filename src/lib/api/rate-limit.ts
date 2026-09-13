type RateLimitKey = string;

interface Bucket {
  count: number;
  expiresAt: number;
}

const buckets = new Map<RateLimitKey, Bucket>();

export interface RateLimitOptions {
  key: RateLimitKey;
  /**
   * Maximum number of allowed calls within windowMs.
   */
  limit: number;
  /**
   * Window size in milliseconds.
   */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Very simple in-memory sliding window rate limiter.
 * Works per Node.js process; in serverless it limits per instance, which is still better than nothing.
 * Disabled entirely in test environment to avoid affecting Jest.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  if (process.env.NODE_ENV === "test") {
    return { ok: true, remaining: options.limit, resetAt: Date.now() + options.windowMs };
  }

  const now = Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.expiresAt <= now) {
    const bucket: Bucket = { count: 1, expiresAt: now + options.windowMs };
    buckets.set(options.key, bucket);
    return { ok: true, remaining: options.limit - 1, resetAt: bucket.expiresAt };
  }

  if (existing.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: existing.expiresAt };
  }

  existing.count += 1;
  buckets.set(options.key, existing);
  return { ok: true, remaining: options.limit - existing.count, resetAt: existing.expiresAt };
}

export function getClientIpFromRequest(req: Request | { headers: Headers }): string {
  const headers = "headers" in req ? req.headers : (req as Request).headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim());
    if (parts[0]) return parts[0];
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export const RATE_LIMITS = {
  DEFAULT: { limit: 60, windowMs: 60_000 },
  AI: { limit: 20, windowMs: 60_000 },
  AUTH: { limit: 10, windowMs: 60_000 },
  FORM: { limit: 30, windowMs: 60_000 },
  STRICT: { limit: 5, windowMs: 60_000 },
} as const

export function applyRateLimit(
  req: Request,
  options?: Partial<RateLimitOptions>
): RateLimitResult {
  const ip = getClientIpFromRequest(req)
  const path = new URL(req.url).pathname
  const key = `${ip}:${path}`
  return checkRateLimit({
    key,
    limit: options?.limit ?? RATE_LIMITS.DEFAULT.limit,
    windowMs: options?.windowMs ?? RATE_LIMITS.DEFAULT.windowMs,
  })
}

