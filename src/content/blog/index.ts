import { blogPostsEn } from "./posts-en";
import { blogPostsPl } from "./posts-pl";
import type { BlogCategory, BlogPost } from "./types";

const allPosts: BlogPost[] = [...blogPostsPl, ...blogPostsEn];

export function getBlogPosts(locale: string): BlogPost[] {
  const loc = locale === "en" ? "en" : "pl";
  return allPosts
    .filter((p) => p.locale === loc)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(locale: string, slug: string): BlogPost | undefined {
  const loc = locale === "en" ? "en" : "pl";
  return allPosts.find((p) => p.locale === loc && p.slug === slug);
}

export function getAllBlogSlugs(): { locale: string; slug: string }[] {
  return allPosts.map((p) => ({ locale: p.locale, slug: p.slug }));
}

import { categoryMeta } from "./categories";

export const blogCategoryLabels: Record<"pl" | "en", Record<BlogCategory, string>> = {
  pl: Object.fromEntries(
    (Object.keys(categoryMeta.pl) as BlogCategory[]).map((k) => [k, categoryMeta.pl[k].title])
  ) as Record<BlogCategory, string>,
  en: Object.fromEntries(
    (Object.keys(categoryMeta.en) as BlogCategory[]).map((k) => [k, categoryMeta.en[k].title])
  ) as Record<BlogCategory, string>,
};

export function getBlogPostsByCategory(locale: string, category: BlogCategory): BlogPost[] {
  return getBlogPosts(locale).filter((p) => p.category === category);
}

export { categoryMeta, categoryOrder } from "./categories";
export { getBlogAlternateSlug, getBlogArticlePath } from "./slug-map";
