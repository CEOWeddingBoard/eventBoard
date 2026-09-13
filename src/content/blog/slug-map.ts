import { blogPostsEn } from "./posts-en";
import { blogPostsPl } from "./posts-pl";

type BlogLocale = "pl" | "en";

function buildBlogSlugMaps(): {
  plToEn: Map<string, string>;
  enToPl: Map<string, string>;
} {
  const plToEn = new Map<string, string>();
  const enToPl = new Map<string, string>();

  for (const plPost of blogPostsPl) {
    const matches = blogPostsEn.filter(
      (enPost) =>
        enPost.publishedAt === plPost.publishedAt && enPost.category === plPost.category,
    );

    if (matches.length !== 1) {
      throw new Error(
        `Blog slug map: expected 1 EN match for "${plPost.slug}", got ${matches.length}`,
      );
    }

    const enPost = matches[0]!;
    plToEn.set(plPost.slug, enPost.slug);
    enToPl.set(enPost.slug, plPost.slug);
  }

  if (plToEn.size !== blogPostsPl.length || enToPl.size !== blogPostsEn.length) {
    throw new Error("Blog slug map incomplete — check PL/EN article parity");
  }

  return { plToEn, enToPl };
}

const { plToEn, enToPl } = buildBlogSlugMaps();

export function getBlogAlternateSlug(slug: string, locale: string): string | undefined {
  const loc: BlogLocale = locale === "en" ? "en" : "pl";
  return loc === "pl" ? plToEn.get(slug) : enToPl.get(slug);
}

export function getBlogArticlePath(slug: string, locale: string): string {
  const loc: BlogLocale = locale === "en" ? "en" : "pl";
  return `/${loc}/magazyn/${slug}`;
}
