---
name: wedding-content-weekly
description: >-
  Weekly wedding content agent: researches trends via web search, creates magazine
  article + Instagram Reel with Higgsfield AI avatar (Marta). Use for weekly
  content, virtual planner persona, Higgsfield reels, or /loop 7d content runs.
---

# Wedding Content Weekly Agent

**Cel:** 1 pakiet / tydzień = research trendów + skrypt rolki UGC + opcjonalnie artykuł magazynu.

## Narzędzie wideo: Higgsfield (NIE Mainframe, NIE slideshow)

| Narzędzie | Użycie |
|-----------|--------|
| **Higgsfield** | ✅ Avatar „Marta”, UGC Reels, lip sync, Soul ID |
| **Mainframe** | ❌ Tylko recaps pracy agentów dev — nie rolki marketingowe |
| ffmpeg slideshow | ❌ Fallback tylko w awarii — jakość „dziadostwo” |

Persona: `content/social/avatar/PERSONA.md`

## Cotygodniowy workflow

### 0. Viral research (najpierw)

Skill **`wedding-viral-research`** →  
`content/social/weekly/YYYY-MM-DD-viral-research.md`

Szablon: `content/social/weekly/TEMPLATE-viral-research.md`

### 1. Research (WebSearch, nie scraping Pinterest)

```
trendy weselne 2026 polska
wesele wiosna 2026 instagram
planowanie wesela viral reel
```

Zapisz też skrót: `content/social/weekly/YYYY-MM-DD-trends.md` (opcjonalnie)

### 2. Folder rolki

```
content/social/reels/YYYY-MM-DD-{slug}/
├── meta.json
├── script.md           # skrypt z timestampami
├── higgsfield-brief.md # gotowiec pod Higgsfield (UGC + prompt sceny)
├── caption-pl.txt
├── hashtags.txt
└── reel-ugc.mp4        # eksport z Higgsfield (nie generuj slideshow)
```

### 3. Skrypt rolki (UGC — mówi do kamery)

- Hook w **2 sekundy**
- 40–50 s łącznie
- Postać: **Marta** (planerka Wedding Board)
- CTA: link w bio, pierwszy miesiąc za darmo
- Transparentność AI w bio IG (nie w każdej rolce, ale w profilu)

### 4. Produkcja w Higgsfield

1. Marketing Studio → **UGC** → avatar **Marta** (Soul ID pinned)
2. Wklej skrypt z `higgsfield-brief.md`
3. Format: Reels 9:16, 1080p
4. Eksport → `reel-ugc.mp4`

**Pierwszy raz:** utwórz Soul ID wg `PERSONA.md` (30 stilli → train → pin).

### 5. Opcjonalna hybryda (wyższa konwersja)

- B-roll: Loom screencast planera (10 s) w środku rolki — montaż w CapCut

### 6. Magazyn (co 2 tygodnie)

Skill `wedding-blog-content` → ten sam temat co rolka.

### 7. Commit

```
content(social): weekly UGC brief YYYY-MM-DD <temat>
```

## Loop tygodniowy

```
/loop 7d Użyj wedding-content-weekly: research trendów, folder rolki z
higgsfield-brief.md i script.md. NIE twórz slideshow ffmpeg.
```

## Koszt orientacyjny Higgsfield

- Creator ~$19/m — start (3 avatary, 1080p)
- Pro ~$49/m — więcej kredytów + lepszy lip sync

## Grafika — jeden system

Przed GenerateImage / okładką rolki przeczytaj:
- `content/social/BRAND-VISUAL.md`
- `src/lib/brand-visual.ts` (`AI_IMAGE_MASTER_PROMPT`)

**Nie** generuj losowych stylów per slajd — ten sam cream/gold/olive + floral.

## Powiązane

- `.cursor/skills/wedding-viral-research/SKILL.md`
- `content/social/BRAND-VISUAL.md`
- `content/social/avatar/PERSONA.md`
- `content/social/README.md`
