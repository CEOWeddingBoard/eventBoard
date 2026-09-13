---
name: wedding-blog-content
description: >-
  Researches wedding planning trends and topics via web search (Polish market),
  synthesizes original blog posts for Wedding Board, and adds them to
  src/content/blog/posts-pl.ts. Use when the user asks for new poradnik/blog
  articles, content from Pinterest/Instagram/TikTok trends, SEO topics, or
  automated wedding content research.
---

# Wedding Blog Content Agent

Research → original article → commit to `feature/5` (blog branch).

**Tygodniowy social (Reels + trendy):** użyj skill `wedding-content-weekly` — research Pinterest/IG + rolka + opcjonalnie artykuł.

## Important limitations

**Do NOT scrape Pinterest, Instagram or TikTok directly.** Their APIs and ToS block automated harvesting of posts, captions and images. Instead:

1. Use **WebSearch** for public articles, trend roundups and hashtag discussions.
2. Use search queries like: `site:instagram.com planowanie wesela trend 2026`, `tiktok plan stołów wesele`, `pinterest wedding seating chart ideas` — only to discover **topics and angles**, not to copy text.
3. Write **100% original** Polish copy. Never paste captions, blog paragraphs or comments verbatim.
4. Do not hotlink or reuse images from social media without license.

## Brand voice

| Element | Rule |
|---------|------|
| Ton | Ciepły, konkretny, bez słodzenia. Jak doświadczona koleżanka po ślubie. |
| Język | Polski (PL). EN only when user explicitly asks for `posts-en.ts`. |
| Produkt | Wedding Board / Wedding Board — all-in-one + AI plan stołów |
| CTA | „Wypróbuj miesiąc za darmo” — link `/{locale}/sign-up` |
| Unikaj | Obietnic niedziałających funkcji (generator zaproszeń AI jeśli wyłączony) |

## Research workflow

### 1. Zbierz tematy (15 min)

Szukaj w internecie równolegle:

- **Problemy par:** budżet, RSVP, plan stołów, konflikty rodzinne, checklist
- **Trendy:** `trendy weselne 2026 polska`, `wesele kameralne`, `cyfrowe zaproszenia`
- **Social signals (pośrednio):** co powtarza się w artykułach cytujących IG/TikTok/Pinterest
- **SEO:** Google suggest / frazy z `docs/ANALIZA-RYNKU-PL-SZANSE.md`

Zapisz 3–5 kątów z **hookiem** (pierwsze zdanie artykułu).

### 2. Wybierz kategorię

Mapowanie na `BlogCategory` w `src/content/blog/types.ts`:

| Temat | category |
|-------|----------|
| Harmonogram, organizacja | `organizacja` |
| Koszty, oszczędności | `budzet` |
| Lista gości, zaproszenia, RSVP | `goscie` |
| Usadzenie, winietki, sala | `stoly` |
| Checklist, zadania | `zadania` |
| Excel, narzędzia, porównania | `narzedzia` |

### 3. Napisz artykuł

Struktura obowiązkowa:

1. Akapit wprowadzający (problem + obietnica rozwiązania)
2. 3–5 sekcji `heading` level 2
3. Min. 1 `tip` (ramka ze złotym akcentem)
4. Listy `ordered` dla kroków, `list` dla wskazówek
5. Na końcu blok `{ type: "cta" }`

Długość: **800–1500 słów**, `readTimeMinutes`: ~5–10.

### 4. SEO

- `slug`: kebab-case, PL, bez polskich znaków (np. `scenariusz-dnia-slubu`)
- `seoTitle`: ≤60 znaków, fraza kluczowa na początku
- `seoDescription`: ≤155 znaków, CTA lub korzyść
- `publishedAt`: ISO date `YYYY-MM-DD`

### 5. Okładka (ujednolicony system)

Okładki artykułów są **automatycznie spójne** — `BlogCover` + `src/lib/brand-visual.ts`:
- wspólny hero: `/hero-floral-arch.png`
- akcent + ikona per kategoria
- **Nie dodawaj** `coverImage` per artykuł (chyba że batch regeneracji w jednym stylu)

Jeśli generujesz dodatkową grafikę (np. OG share):
```
[Wklej AI_JOURNAL_COVER_PROMPT z src/lib/brand-visual.ts]
Scene: [temat artykułu]
```
Zobacz `content/social/BRAND-VISUAL.md`.

### 6. Wdróż w kod

Edytuj `src/content/blog/posts-pl.ts`:

```typescript
{
  slug: "twoj-nowy-artykul",
  locale: "pl",
  title: "...",
  excerpt: "...",
  category: "organizacja",
  readTimeMinutes: 7,
  publishedAt: "2026-03-20",
  seoTitle: "...",
  seoDescription: "...",
  blocks: [
    { type: "paragraph", text: "..." },
    { type: "heading", level: 2, text: "..." },
    { type: "list", items: ["..."] },
    { type: "tip", title: "...", text: "..." },
    { type: "cta" },
  ],
},
```

Opcjonalnie skrócona wersja EN w `posts-en.ts`.

### 7. Weryfikacja

- `npm run build` — brak błędów
- Slug unikalny w obrębie locale
- Link podglądu: `/{locale}/magazyn/{slug}` (stary `/blog` przekierowuje)
- Commit na branch `feature/5`: `content(blog): <tytuł>`

## Kalendarz tematów (rotacja)

Publikuj 1 artykuł / 2 tygodnie. Priorytet SEO:

1. Plan stołów / usadzenie gości
2. Budżet weselny + ile kosztuje
3. Lista gości / RSVP
4. Checklist / harmonogram
5. Excel vs planer
6. Scenariusz dnia ślubu
7. Kiedy wysłać zaproszenia
8. Wesele kameralne vs duże
9. Konflikty rodzinne przy stole
10. Trendy weselne 2026

## Powiązanie z social media

Z artykułu blogowego **nie kopiuj** — **generuj** materiały:

| Blog | Reels/TikTok | Instagram post |
|------|--------------|----------------|
| Hook z §1 | Pierwsze 3 sekundy wideo | Nagłówek carousel |
| Lista kroków | Screencast planera | Slajdy 2–4 |
| Tip box | Tekst na ekranie | Cytat na grafice |
| CTA | „Link w bio” | Link w bio |

Szczegóły rolek: `docs/CONTENT-MARKETING-REELS-TIKTOK-INSTAGRAM.md`.

## Styl wizualny artykułu (przy edycji UI)

Gdy user prosi o „ładniejszy poradnik”, stosuj w `blog-content.tsx` / layout:

- Nagłówek artykułu: `font-script` (Great Vibes) tylko tytuł listy; w artykule `font-serif` (Playfair)
- Treść: `font-sans` (Montserrat) light, `leading-relaxed`
- Drop cap na pierwszym akapicie
- Separatory `border-olive/15` między sekcjami
- `content-readable` z globals.css dla kontrastu na tle WeddingBackground
- Karty kategorii z ikoną (Lucide) na liście bloga
- Featured post (pierwszy / najnowszy) — większa karta na `/blog`

## Additional resources

- Szablon bloków: [article-template.md](article-template.md)
- Istniejące posty: `src/content/blog/posts-pl.ts`
- Analiza rynku: `docs/ANALIZA-RYNKU-PL-SZANSE.md`
