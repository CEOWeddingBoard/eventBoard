import type { BlogPost } from "./types";
import { BRAND_VISUAL, categoryVisual } from "@/lib/brand-visual";

/** Okładka artykułu — tylko dedykowana grafika z /blog/covers. */
export function getPostCoverImage(post: BlogPost): string | undefined {
  return post.coverImage;
}

/** Fallback dla Open Graph, gdy brak coverImage (np. EN). */
export function getPostCoverImageForSeo(post: BlogPost): string {
  return post.coverImage ?? BRAND_VISUAL.seoFallbackImage;
}

export function getPostCoverAccent(post: BlogPost): string {
  return categoryVisual[post.category].accent;
}

export function getCategoryBarClass(post: BlogPost): string {
  return categoryVisual[post.category].bar;
}
