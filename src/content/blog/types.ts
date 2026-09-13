export type BlogCategory =
  | "organizacja"
  | "budzet"
  | "goscie"
  | "stoly"
  | "zadania"
  | "narzedzia";

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "appShot"; src: string; alt: string; caption?: string; label?: string }
  | {
      type: "palette";
      name: string;
      description?: string;
      colors: { name: string; hex: string }[];
      image?: { src: string; alt: string };
      decor?: { item: string; hex: string }[];
    }
  | { type: "tip"; title: string; text: string }
  | { type: "cta" };

export interface BlogPost {
  slug: string;
  locale: "pl" | "en";
  title: string;
  excerpt: string;
  category: BlogCategory;
  readTimeMinutes: number;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  /** Opcjonalna okładka — /public/blog/covers/... ; bez tego: grafika kategorii */
  /** Opcjonalne — domyślnie ujednolicony hero z brand-visual. */
  coverImage?: string;
  blocks: BlogBlock[];
}
