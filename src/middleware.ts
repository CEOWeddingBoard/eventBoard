import "./edge-polyfill";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import {
  readSessionTokenFromRequest,
  verifySessionToken,
} from "@/lib/auth/session-token";

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "pl"],
  defaultLocale: "pl",
  localePrefix: "always",
});

function pathMatcher(patterns: string[]) {
  return (pathname: string) => patterns.some((p) => {
    const escaped = p
      .replace(/\(\.\*\)/g, "###STAR###")
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/###STAR###/g, ".*");
    return new RegExp(`^${escaped}$`).test(pathname);
  });
}

const isProtectedRoute = pathMatcher([
  // /admin świadomie NIE jest tu wymieniony: strona sama zwraca 404 dla
  // nie-adminów, a przekierowanie na logowanie zdradzałoby, że panel istnieje.
  "/(pl|en)/app(.*)",
  "/(pl|en)/api/events(.*)",
  "/(pl|en)/api/calendar(.*)",
  "/(pl|en)/api/google(.*)",
  "/(pl|en)/api/ai(.*)",
]);

/** Trasy logowania i stany bez przypisanej przestrzeni — nie wymagają sesji. */
const isRegistrationFlowRoute = pathMatcher([
  "/(pl|en)/auth(.*)",
  "/(pl|en)/onboarding(.*)",
  "/(pl|en)/after-auth(.*)",
  "/(pl|en)/legal(.*)",
]);

async function hasUserSession(req: NextRequest): Promise<boolean> {
  const token = readSessionTokenFromRequest(req.headers.get("cookie"));
  if (!token) return false;
  const session = await verifySessionToken(token);
  return !!session;
}

function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0];
  return locale === "en" || locale === "pl" ? locale : "pl";
}

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim());
    if (parts[0]) return parts[0];
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyReq = req as any;
  if (typeof anyReq.ip === "string") return anyReq.ip;
  return null;
}

const allowedIps =
  (process.env.ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

const isWebhookPath = (pathname: string) =>
  pathname.startsWith("/api/webhooks/");

/** Trasy publiczne renderowane poza segmentem [locale] — i18n ich nie dotyczy. */
const isLocaleAgnosticPublicRoute = (pathname: string) =>
  pathname === "/org" ||
  pathname.startsWith("/org/") ||
  // Endpointy maszynowe pod gołym /api — bez prefiksu locale, inaczej
  // intlMiddleware przepisałby je na /pl/api/... i zwracał 404.
  pathname === "/api/admin/bootstrap" ||
  pathname.startsWith("/api/cron/") ||
  pathname.startsWith("/api/webhooks/");

/** Apex weddingboard.pl trafia na home.pl — przekieruj na www (Railway). */
function redirectToCanonicalHost(req: NextRequest): NextResponse | null {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    req.nextUrl.hostname;
  if (host !== "weddingboard.pl") return null;

  const url = req.nextUrl.clone();
  url.hostname = "www.weddingboard.pl";
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

export default async function middleware(req: NextRequest) {
  const canonicalRedirect = redirectToCanonicalHost(req);
  if (canonicalRedirect) return canonicalRedirect;

  if (
    process.env.NODE_ENV === "production" &&
    allowedIps.length > 0 &&
    !isWebhookPath(req.nextUrl.pathname)
  ) {
    const ip = getClientIp(req);
    if (!ip || !allowedIps.includes(ip)) {
      return new NextResponse("Access restricted. This environment is limited to specific IPs.", {
        status: 403,
      });
    }
  }

  // Publiczny profil organizatora leży w src/app/org/[slug], poza [locale].
  // intlMiddleware przy localePrefix "always" dokleiłby prefiks i przepisał
  // /org/<slug> na /pl/org/<slug>, gdzie nie ma żadnej trasy — link, który
  // Ustawienia każą wysyłać klientom po zapytanie ofertowe, zwracał 404.
  // Strona nie używa tłumaczeń, więc omija i18n w całości.
  if (isLocaleAgnosticPublicRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(req.nextUrl.pathname) && !isRegistrationFlowRoute(req.nextUrl.pathname)) {
    const userSession = await hasUserSession(req);
    if (!userSession) {
      const locale = getLocaleFromPath(req.nextUrl.pathname);
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/auth`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
