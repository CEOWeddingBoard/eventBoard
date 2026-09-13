import { SERVICE_NAME } from "@/lib/brand";
import { BRAND_VISUAL } from "@/lib/brand-visual";
import { canonicalizeAppOrigin } from "@/lib/env";

export const SEO_LOCALES = ["pl", "en"] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];

/** Kanoniczny origin produkcyjny — bezpieczny przy buildzie bez requestu. */
export const SEO_DEFAULT_ORIGIN = "https://www.weddingboard.pl";

export const SITE_CONFIG = {
  name: SERVICE_NAME,
  defaultLocale: "pl" as SeoLocale,
  logoPath: BRAND_VISUAL.seoFallbackImage,
  editorialPath: "/magazyn/redakcja",
  magazinePath: "/magazyn",
  twitterHandle: undefined as string | undefined,
  instagramUrl: "https://www.instagram.com/weddingboard.pl/",
} as const;

export function normalizeSeoLocale(locale: string): SeoLocale {
  return locale === "en" ? "en" : "pl";
}

export function getSeoBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return canonicalizeAppOrigin(configured);
    } catch {
      return SEO_DEFAULT_ORIGIN;
    }
  }
  return SEO_DEFAULT_ORIGIN;
}

export function absoluteUrl(path: string): string {
  const base = getSeoBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function localePath(locale: string, path: string): string {
  const loc = normalizeSeoLocale(locale);
  if (!path || path === "/") return `/${loc}`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${loc}${normalized}`;
}

export function hreflangTag(locale: SeoLocale): string {
  return locale === "pl" ? "pl-PL" : "en-GB";
}

export function openGraphLocale(locale: SeoLocale): string {
  return locale === "pl" ? "pl_PL" : "en_GB";
}

export function editorialUrl(locale: string): string {
  return absoluteUrl(localePath(locale, SITE_CONFIG.editorialPath));
}

export function magazineUrl(locale: string): string {
  return absoluteUrl(localePath(locale, SITE_CONFIG.magazinePath));
}
