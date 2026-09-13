import type { Metadata } from "next";
import { getBlogAlternateSlug } from "@/content/blog/slug-map";
import { BRAND_VISUAL } from "@/lib/brand-visual";
import { SITE_CONFIG, absoluteUrl, getSeoBaseUrl, hreflangTag, localePath, normalizeSeoLocale, openGraphLocale, type SeoLocale } from "./site";

export interface PageMetadataInput {
  locale: string;
  /** Ścieżka bez locale, np. `/magazyn` lub `/magazyn/slug` */
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  noIndex?: boolean;
}

function resolveImageUrl(url: string): string {
  return url.startsWith("http") ? url : absoluteUrl(url);
}

function defaultOgImage(): { url: string; width: number; height: number; alt: string } {
  return {
    url: absoluteUrl(BRAND_VISUAL.seoFallbackImage),
    width: 1200,
    height: 630,
    alt: SITE_CONFIG.name,
  };
}

export function buildBlogArticleAlternates(
  slug: string,
  locale: string,
): Metadata["alternates"] {
  const loc = normalizeSeoLocale(locale);

  const plSlug = loc === "pl" ? slug : getBlogAlternateSlug(slug, "en");
  const enSlug = loc === "en" ? slug : getBlogAlternateSlug(slug, "pl");

  if (!plSlug || !enSlug) {
    return buildLocaleAlternates(`/magazyn/${slug}`);
  }

  const languages = {
    [hreflangTag("pl")]: absoluteUrl(localePath("pl", `/magazyn/${plSlug}`)),
    [hreflangTag("en")]: absoluteUrl(localePath("en", `/magazyn/${enSlug}`)),
    "x-default": absoluteUrl(localePath(SITE_CONFIG.defaultLocale, `/magazyn/${plSlug}`)),
  };

  return { languages };
}

export function buildLocaleAlternates(path: string): Metadata["alternates"] {
  const languages = Object.fromEntries(
    (["pl", "en"] as SeoLocale[]).map((loc) => [hreflangTag(loc), absoluteUrl(localePath(loc, path))])
  );
  languages["x-default"] = absoluteUrl(localePath(SITE_CONFIG.defaultLocale, path));

  return {
    canonical: undefined,
    languages,
  };
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const locale = normalizeSeoLocale(input.locale);
  const canonical = absoluteUrl(localePath(locale, input.path));
  const alternates = buildLocaleAlternates(input.path);
  alternates!.canonical = canonical;

  const images =
    input.images && input.images.length > 0
      ? input.images.map((img) => ({
          ...img,
          url: resolveImageUrl(img.url),
        }))
      : [defaultOgImage()];

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    alternates,
    authors: [{ name: SITE_CONFIG.name, url: absoluteUrl(localePath(locale, SITE_CONFIG.editorialPath)) }],
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: SITE_CONFIG.name,
      locale: openGraphLocale(locale),
      type: input.ogType ?? "website",
      images,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(input.section ? { section: input.section } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: images.map((img) => img.url),
      ...(SITE_CONFIG.twitterHandle ? { site: SITE_CONFIG.twitterHandle } : {}),
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };

  return metadata;
}

export function buildRootMetadata(): Metadata {
  const base = getSeoBaseUrl();
  return {
    metadataBase: new URL(base),
    title: {
      default: SITE_CONFIG.name,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description:
      "Wedding Board — magazyn ślubny i aplikacja do planowania wesela: goście, budżet, plan stołów i zadania.",
    applicationName: SITE_CONFIG.name,
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export function buildPrivatePageMetadata(input: Omit<PageMetadataInput, "noIndex">): Metadata {
  return buildPageMetadata({ ...input, noIndex: true });
}

export function magazineFeedUrl(locale: string): string {
  return absoluteUrl(localePath(normalizeSeoLocale(locale), `${SITE_CONFIG.magazinePath}/feed`));
}
