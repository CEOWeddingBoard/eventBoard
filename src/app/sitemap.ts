import type { MetadataRoute } from "next";
import { categoryOrder } from "@/content/blog";
import { getAllBlogSlugs } from "@/content/blog";
import { absoluteUrl, localePath } from "@/lib/seo/site";

const MARKETING_PATHS = ["", "/magazyn", "/magazyn/redakcja", "/aplikacja"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of ["pl", "en"] as const) {
    for (const path of MARKETING_PATHS) {
      const isApp = path === "/aplikacja";
      entries.push({
        url: absoluteUrl(localePath(locale, path)),
        lastModified: now,
        changeFrequency: isApp ? "weekly" : path === "" ? "weekly" : path === "/magazyn" ? "daily" : "monthly",
        priority: isApp ? 1 : path === "" ? 0.95 : path === "/magazyn" ? 0.9 : 0.7,
      });
    }

    for (const category of categoryOrder) {
      entries.push({
        url: absoluteUrl(localePath(locale, `/magazyn/kategoria/${category}`)),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  for (const { locale, slug } of getAllBlogSlugs()) {
    entries.push({
      url: absoluteUrl(localePath(locale, `/magazyn/${slug}`)),
      lastModified: now,
      changeFrequency: "monthly",
      priority: locale === "pl" ? 0.8 : 0.7,
    });
  }

  entries.push({
    url: absoluteUrl(localePath("pl", "/ebook")),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  });

  return entries;
}
