export function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  );
}

export function assertProductionConfig(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!isProductionRuntime()) return;

  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    throw new Error(
      "NEXT_PUBLIC_DEV_MODE must not be enabled in production."
    );
  }

  const required = [
    "DATABASE_URL",
  ] as const;

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  const recommended = [
    "NEXT_PUBLIC_APP_URL",
    "RESEND_API_KEY",
    "RESEND_FROM",
    "CLERK_WEBHOOK_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_ID",
  ] as const;

  const missingRecommended = recommended.filter((key) => !process.env[key]?.trim());
  if (missingRecommended.length > 0) {
    console.warn(
      `[env] Missing recommended production variables (features may be limited): ${missingRecommended.join(", ")}`
    );
  }
}

export function getClerkPublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim()
  );
}

type UrlRequestLike = { headers: Headers };

function applyCanonicalAppHost(parsed: URL): void {
  const fromEnv = process.env.NEXT_PUBLIC_APP_CANONICAL_HOST?.trim();
  if (fromEnv) {
    parsed.hostname = fromEnv.replace(/^https?:\/\//, "").split("/")[0] ?? fromEnv;
    parsed.protocol = "https:";
    return;
  }
  if (parsed.hostname === "weddingboard.pl") {
    parsed.hostname = "www.weddingboard.pl";
    parsed.protocol = "https:";
  }
}

/**
 * Kanoniczny origin (bez ścieżki) — baza dla getPublicAppUrl.
 * weddingboard.pl → www.weddingboard.pl
 */
export function canonicalizeAppOrigin(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    applyCanonicalAppHost(parsed);
    return parsed.origin;
  } catch {
    return trimmed;
  }
}

/** Pełny URL z zachowaną ścieżką (link partnera, RSVP). */
export function canonicalizeAppUrl(url: string): string {
  try {
    const parsed = new URL(url);
    applyCanonicalAppHost(parsed);
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Publiczny URL aplikacji (RSVP, link partnera, maile). */
export function getPublicAppUrl(req?: Request | UrlRequestLike): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return canonicalizeAppOrigin(configured);

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const host = railwayDomain.replace(/^https?:\/\//, "");
    return canonicalizeAppOrigin(`https://${host}`);
  }

  const railwayStatic = process.env.RAILWAY_STATIC_URL?.trim();
  if (railwayStatic) return canonicalizeAppOrigin(railwayStatic);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return canonicalizeAppOrigin(`https://${host}`);
  }

  if (req?.headers) {
    const forwardedHost = req.headers.get("x-forwarded-host");
    const forwardedProto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
    if (forwardedHost) {
      return canonicalizeAppOrigin(
        `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`
      );
    }
    const host = req.headers.get("host");
    if (host) {
      const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
      const proto =
        !isLocal && process.env.NODE_ENV === "production"
          ? "https"
          : req.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
      return canonicalizeAppOrigin(`${proto}://${host}`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error(
    "Ustaw NEXT_PUBLIC_APP_URL (np. https://twoja-domena.up.railway.app) w zmiennych środowiskowych.",
  );
}

export function getResendFrom(): string {
  const configured = process.env.RESEND_FROM?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") {
    return "Wedding Board <onboarding@resend.dev>";
  }
  throw new Error("RESEND_FROM is required in production runtime.");
}
