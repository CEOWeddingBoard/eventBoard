import type { BlogBlock, BlogPost } from "@/content/blog/types";
import { blogCategoryLabels } from "@/content/blog";
import { getPostCoverImageForSeo } from "@/content/blog/covers";
import { SITE_CONFIG, absoluteUrl, editorialUrl, getSeoBaseUrl, localePath, normalizeSeoLocale } from "./site";

type JsonLd = Record<string, unknown>;

export function estimateWordCount(blocks: BlogBlock[]): number {
  const chunks: string[] = [];
  for (const block of blocks) {
    if (block.type === "paragraph" || block.type === "heading") chunks.push(block.text);
    else if (block.type === "list") chunks.push(...block.items);
    else if (block.type === "tip") chunks.push(block.text);
  }
  return chunks.join(" ").split(/\s+/).filter(Boolean).length;
}

export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${getSeoBaseUrl()}/#organization`,
    name: SITE_CONFIG.name,
    alternateName: ["Aplikacja do planowania wesela", "Planowanie wesela aplikacja"],
    url: getSeoBaseUrl(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(SITE_CONFIG.logoPath),
      width: 1200,
      height: 630,
    },
    description:
      "Wedding Board — magazyn ślubny i aplikacja do planowania wesela: goście, budżet, plan stołów i zadania.",
    sameAs: [SITE_CONFIG.instagramUrl],
  };
}

export function webSiteSchema(locale: string): JsonLd {
  const loc = normalizeSeoLocale(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSeoBaseUrl()}/#website`,
    name: SITE_CONFIG.name,
    url: getSeoBaseUrl(),
    inLanguage: loc === "pl" ? "pl-PL" : "en-GB",
    publisher: { "@id": `${getSeoBaseUrl()}/#organization` },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  locale: string
): JsonLd {
  const loc = normalizeSeoLocale(locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localePath(loc, item.path)),
    })),
  };
}

export function articleSchema(post: BlogPost, locale: string): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const path = `/magazyn/${post.slug}`;
  const url = absoluteUrl(localePath(loc, path));
  const cover = getPostCoverImageForSeo(post);
  const categoryLabel = blogCategoryLabels[loc][post.category];

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.seoDescription,
    image: [absoluteUrl(cover)],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: editorialUrl(loc),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(SITE_CONFIG.logoPath),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: categoryLabel,
    inLanguage: loc === "pl" ? "pl-PL" : "en-GB",
    wordCount: estimateWordCount(post.blocks),
    timeRequired: `PT${post.readTimeMinutes}M`,
    isAccessibleForFree: true,
  };
}

export function collectionPageSchema(
  locale: string,
  path: string,
  name: string,
  description: string
): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const url = absoluteUrl(localePath(loc, path));
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name,
    description,
    url,
    inLanguage: loc === "pl" ? "pl-PL" : "en-GB",
    isPartOf: { "@id": `${getSeoBaseUrl()}/#website` },
    publisher: { "@id": `${getSeoBaseUrl()}/#organization` },
  };
}

export function editorialPageSchema(locale: string, title: string, description: string): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const url = editorialUrl(loc);
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#about`,
    name: title,
    description,
    url,
    inLanguage: loc === "pl" ? "pl-PL" : "en-GB",
    about: {
      "@type": "Organization",
      "@id": `${getSeoBaseUrl()}/#organization`,
    },
    publisher: { "@id": `${getSeoBaseUrl()}/#organization` },
  };
}

export function webPageSchema(
  locale: string,
  path: string,
  name: string,
  description: string
): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const url = absoluteUrl(localePath(loc, path));
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    name,
    description,
    url,
    inLanguage: loc === "pl" ? "pl-PL" : "en-GB",
    isPartOf: { "@id": `${getSeoBaseUrl()}/#website` },
    publisher: { "@id": `${getSeoBaseUrl()}/#organization` },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(locale: string, path: string, faqs: FaqItem[]): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const url = absoluteUrl(localePath(loc, path));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export interface SoftwareApplicationInput {
  name: string;
  description: string;
  price: number;
  currency: string;
  trialDays: number;
  alternateName?: string[];
  featureList?: string[];
}

export function softwareApplicationSchema(locale: string, input: SoftwareApplicationInput): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const url = absoluteUrl(localePath(loc, "/aplikacja"));
  const trialLabel =
    loc === "pl"
      ? `${input.trialDays} dni za 0 zł — bez karty`
      : `${input.trialDays}-day free trial — no card required`;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: input.name,
    ...(input.alternateName?.length ? { alternateName: input.alternateName } : {}),
    description: input.description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: loc === "pl" ? "pl-PL" : "en-GB",
    ...(input.featureList?.length ? { featureList: input.featureList } : {}),
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency,
      description: trialLabel,
      url,
    },
    provider: { "@id": `${getSeoBaseUrl()}/#organization` },
  };
}

export function itemListSchema(
  locale: string,
  path: string,
  name: string,
  items: { name: string; path: string }[]
): JsonLd {
  const loc = normalizeSeoLocale(locale);
  const url = absoluteUrl(localePath(loc, path));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#itemlist`,
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(localePath(loc, item.path)),
    })),
  };
}
