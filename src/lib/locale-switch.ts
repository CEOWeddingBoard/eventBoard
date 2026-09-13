import { getBlogAlternateSlug } from "@/content/blog/slug-map";

const MAGAZINE_ARTICLE_PATH = /^\/(pl|en)\/magazyn\/([^/?#]+)$/;

export function resolvePathForLocaleSwitch(
  pathname: string,
  currentLocale: string,
  targetLocale: string,
): string {
  if (currentLocale === targetLocale) return pathname;

  const articleMatch = pathname.match(MAGAZINE_ARTICLE_PATH);
  if (articleMatch?.[1] === currentLocale) {
    const slug = articleMatch[2]!;
    const alternateSlug = getBlogAlternateSlug(slug, currentLocale);
    if (alternateSlug) {
      return `/${targetLocale}/magazyn/${alternateSlug}`;
    }
    return `/${targetLocale}/magazyn`;
  }

  return pathname.replace(`/${currentLocale}`, `/${targetLocale}`);
}
