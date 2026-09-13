export {
  organizationSchema,
  webSiteSchema,
  breadcrumbSchema,
  articleSchema,
  collectionPageSchema,
  editorialPageSchema,
  webPageSchema,
  faqPageSchema,
  softwareApplicationSchema,
  itemListSchema,
} from "./json-ld";
export type { FaqItem, SoftwareApplicationInput } from "./json-ld";
export {
  buildLocaleAlternates,
  buildPageMetadata,
  buildPrivatePageMetadata,
  buildRootMetadata,
  magazineFeedUrl,
} from "./metadata";
export {
  SEO_DEFAULT_ORIGIN,
  SEO_LOCALES,
  SITE_CONFIG,
  absoluteUrl,
  editorialUrl,
  getSeoBaseUrl,
  hreflangTag,
  localePath,
  magazineUrl,
  normalizeSeoLocale,
} from "./site";
