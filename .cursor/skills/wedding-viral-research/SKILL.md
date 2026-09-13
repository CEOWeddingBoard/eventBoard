---
name: wedding-viral-research
description: >-
  Scans the web for Polish wedding viral trends (Pinterest, Instagram, TikTok
  via articles and search), maps season hooks, and outputs a weekly viral brief
  for reels and magazine. Use before creating reels, weekly content, or when
  user asks for viral wedding trends, Pinterest ideas, or seasonal hooks.
---

# Wedding Viral Research Agent

**Cel:** Co tydzień znaleźć **co jest viralowe / sezonowe** w planowaniu wesela i przetłumaczyć to na **nasze** hooki (Marta + magazyn).

## Nie scrapuj — researchuj

| Dozwolone | Zakazane |
|-----------|----------|
| WebSearch: trendy, artykuły, roundupy | Scraping Pinterest/IG API |
| `site:pinterest.com wesele 2026` (tematy) | Kopiowanie captionów 1:1 |
| Analiza powtarzalnych hooków | Publikowanie cudzych zdjęć |

## Workflow (co tydzień, ~20 min)

### 1. Ustal sezon

| Miesiąc | Kąt |
|---------|-----|
| Mar–Kwi | start planu, wiosna, rezerwacja sal |
| Maj–Cze | majowe wesele, RSVP, plan stołów |
| Lip–Sie | finał, upał, timeline dnia |
| Wrz–Paź | jesień, budżet |
| Lis–Lut | off-season, oszczędności |

### 2. Batch WebSearch (równolegle)

```
trendy weselne 2026 polska instagram
wesele wiosna 2026 pinterest inspiracje
planowanie wesela viral tiktok polska
reel plan stołów wesele hook
checklist ślub 2026 trend
```

### 3. Wypełnij brief

Skopiuj `content/social/weekly/TEMPLATE-viral-research.md` →  
`content/social/weekly/YYYY-MM-DD-viral-research.md`

Wypisz minimum:
- **3 trendy** sezonu
- **2 viral formats** (np. „harmonogram 60s”, „3 błędy przy RSVP”)
- **1 hook** gotowy pod Martę (PL, 1 zdanie)
- **1 temat** na magazyn (slug lub nowy)

### 4. Powiąż z produkcją

| Output | Skill / plik |
|--------|----------------|
| Skrypt rolki | `wedding-content-weekly` → `higgsfield-brief.md` |
| Artykuł | `wedding-blog-content` → `posts-pl.ts` |
| Grafika B-roll | `BRAND-VISUAL.md` + `AI_REEL_SLIDE_PROMPT` |

### 5. Ujednolicenie grafik

Przed generowaniem obrazów przeczytaj:
- `content/social/BRAND-VISUAL.md`
- `src/lib/brand-visual.ts`

**Zawsze** ten sam master prompt. Różnice tylko w `Scene:` i akcent kategorii.

## Viral hook library (rotacja)

1. „Wesele za rok i nie wiesz od czego zacząć?”
2. „3 rzeczy, które musisz mieć w jednym miejscu przed weselem”
3. „Babcia przy wujku? Plan stołów bez dramatu”
4. „Ile naprawdę kosztuje wesele w 2026?”
5. „RSVP: dlaczego 80% par robi to za późno”
6. „Excel vs planer — kiedy przesiąść się na aplikację?”
7. „Majowe wesele 2026 — 3 trendy które widzę wszędzie”

## Loop (z content weekly)

```
/loop 7d Użyj wedding-viral-research: zrób viral brief na ten tydzień,
potem wedding-content-weekly: higgsfield-brief na wybrany hook.
```

## Powiązane

- `content/social/BRAND-VISUAL.md`
- `content/social/avatar/PERSONA.md`
- `.cursor/skills/wedding-content-weekly/SKILL.md`
