import type { BlogCategory } from "@/content/blog/types";

/** Jedna baza wizualna magazynu + social — cream, gold, olive. Tło strony: WeddingBackground. */
export const BRAND_VISUAL = {
  patternImage: "/floral-pattern.svg",
  seoFallbackImage: "/background-cream-gold.png",
  palette: {
    cream: "#f5f3ee",
    ivory: "#fefdfb",
    ink: "#2d3824",
    gold: "#9a8554",
    olive: "#7d8d6e",
  },
  fonts: {
    script: "Great Vibes — nagłówki hero",
    serif: "Playfair Display — tytuły, lead",
    sans: "Montserrat — body, UI",
  },
} as const;

export const categoryVisual: Record<
  BlogCategory,
  { accent: string; bar: string; icon: "calendar" | "layout" | "users" | "wallet" | "list" | "sparkles" }
> = {
  organizacja: { accent: "from-olive/35 to-gold-muted/45", bar: "bg-olive/80", icon: "calendar" },
  stoly: { accent: "from-gold/25 to-olive/30", bar: "bg-gold/90", icon: "layout" },
  goscie: { accent: "from-gold-muted/40 to-olive/25", bar: "bg-olive-light/90", icon: "users" },
  budzet: { accent: "from-gold/30 to-olive/20", bar: "bg-gold-soft/90", icon: "wallet" },
  zadania: { accent: "from-olive/25 to-gold-subtle/35", bar: "bg-olive/75", icon: "list" },
  narzedzia: { accent: "from-olive/20 to-gold-muted/40", bar: "bg-gold/85", icon: "sparkles" },
};

/** Master prompt — każda grafika AI (okładki, rolki, Higgsfield mood). */
export const AI_IMAGE_MASTER_PROMPT = `Wedding Board brand visual system:
- Palette: cream ivory #f5f3ee, soft gold #9a8554, olive green #7d8d6e, ink text #2d3824
- Style: editorial bridal magazine, soft natural light, delicate watercolor florals (white roses, hydrangeas)
- Mood: elegant, calm, premium, clarity — NOT cheap, NOT neon, NOT stock-photo cheesy
- NO text on image, NO watermarks, NO faces unless specified for avatar persona
- Consistent with wedding journal aesthetic: airy, romantic, minimalist`;

export const AI_REEL_SLIDE_PROMPT = `${AI_IMAGE_MASTER_PROMPT}
Format: vertical 9:16 Instagram Reel slide, composition with negative space for text overlay at top or bottom third.`;

export const AI_JOURNAL_COVER_PROMPT = `${AI_IMAGE_MASTER_PROMPT}
Format: horizontal 16:9 editorial hero image for wedding journal article cover, soft focus florals, shallow depth of field.`;
