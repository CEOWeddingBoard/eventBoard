# Higgsfield — Prompty do broszur Wedding Board

**Styl marki:** cream & gold (#f5f3ee + #B8943A), olive green (#5A6B3E), elegancki, luksusowy, spokojny. Estetyka: editorial bridal magazine, czyste tło, delikatne akcenty florystyczne. Zero chaosu.

**Format w Higgsfield:** Marketing Studio → AI Images. Wybierz model najlepszy do fotorealizmu / still image (np. Flux lub SD3). Format: **1:1 (square)** lub **3:4 (vertical)** — do PDF A4.

---

## BROszURA DLA PAR MŁODYCH (3 strony)

---

### Obraz 1 — Okładka / Hero

**Prompt:**
```
Elegant wedding planner brochure cover, cream background #f5f3ee,
delicate olive branch watercolor illustration on left side, subtle gold foil border frame,
centered serif title text area left intentionally blank and clean,
soft boho floral accents in muted blush and ivory tones at bottom right corner,
editorial bridal magazine aesthetic, high-end stationery design,
natural soft lighting, premium paper texture visible, minimal composition,
scandinavian luxury style, no people, no faces, no text overlay,
photorealistic product photography of a beautiful wedding planning binder
```

**Negative:**
```
cluttered, messy, neon, dark background, people, text watermark, logo, heavy shadows,
cartoon, anime, 3d render, plastic texture
```

---

### Obraz 2 — Feature section: "Dlaczego Wedding Board?" (tło z akcentem)

**Prompt:**
```
Elegant minimalist background for a wedding brochure, cream paper texture #f5f3ee,
thin gold geometric line art (delicate circles and connecting dots) on the right third,
tiny scattered olive leaves in watercolor style at the bottom edge,
soft cream-to-white gradient, premium stationery paper texture,
magazine editorial spread aesthetic, empty composition ready for text placement,
no people, no typography, no devices, clean negative space,
warm natural light, subtle shadow from an invisible flower arrangement
```

**Negative:**
```
text, words, logo, people, phones, laptops, clutter, dark background, heavy patterns
```

---

### Obraz 3 — Pricing / CTA sekcja

**Prompt:**
```
Warm elegant wedding brochure closing page background, ivory cream paper #f5f3ee,
beautiful watercolor floral wreath (eucalyptus, olive branches, blush roses) framing the top and sides,
thin gold border frame, soft candlelight glow effect in the center,
premium invitation suite aesthetic, romantic but minimal,
empty center space for text, editorial wedding magazine quality,
photorealistic luxury stationery spread, shallow depth of field on edges
```

**Negative:**
```
text, people, electronics, messy, neon, dark, heavy saturation, cartoon, illustration
```

---

### Obraz 4 (opcjonalny) — Ikony / elementy do sekcji "Dzień wesela"

**Prompt:**
```
Set of 3 elegant minimalist icons for a luxury wedding brochure, cream background,
thin gold line art style, icons: a wedding ring, a champagne glass, an envelope,
clean geometric design, premium stationery aesthetic, no text, no background elements,
scandinavian minimal style, isolated on cream #f5f3ee, photorealistic ink drawing style,
editorial quality
```

**Negative:**
```
text, labels, complex, colorful, 3d, shadow, people
```

---

## BROszURA DLA SAL WESELNYCH (2 strony)

---

### Obraz 5 — Okładka Venue

**Prompt:**
```
Elegant venue management brochure cover, deep olive green background #5A6B3E,
thin gold geometric lines forming an architectural blueprint pattern (subtle, faded),
gold foil border frame, cream #f5f3ee center panel left intentionally blank,
classic serif aesthetic, luxury hotel brand guidelines style,
corporate yet warm, premium paper texture, natural lighting,
no people, no text, no specific building, abstract venue representation
```

**Negative:**
```
people, photos of buildings, text, logos, messy, neon, dark gothic, cartoon, cheap paper
```

---

### Obraz 6 — Feature section tło Venue

**Prompt:**
```
Minimalist cream background for a luxury venue brochure, #f5f3ee paper texture,
elegant olive and gold abstract geometric pattern on the bottom third (thin lines, arches, circles),
subtle architectural blueprint aesthetic, clean and professional,
premium hotel corporate design style, empty composition for text,
soft natural light, warm tone, no people, no devices, no typography
```

**Negative:**
```
text, people, messy, dark, neon, cartoon, colorful, heavy patterns, clutter
```

---

### Obraz 7 — Pricing / CTA sekcja Venue

**Prompt:**
```
Luxury closing section background for a venue management brochure,
warm cream background #f5f3ee with olive green border frame #5A6B3E,
delicate gold line art of a wedding arch and table arrangement (minimal, thin lines),
premium stationery aesthetic, professional but warm,
empty center space, editorial quality, natural light,
hotel brand style, elegant simplicity
```

**Negative:**
```
people, text, electronics, messy, dark, neon, 3d render, cartoon
```

---

## PARAMETRY WSPÓLNE DLA WSZYSTKICH:

| Parametr | Wartość |
|----------|---------|
| Format | 1:1 (square) — potem przytniesz do A4 |
| Rozdzielczość | minimum 1024x1024, najlepiej 2048x2048 |
| Styl | Photorealistic / Editorial / Luxury |
| Paleta | cream #f5f3ee, gold #B8943A, olive #5A6B3E, blush #E8D5D0 |
| Model (Higgsfield) | Flux Pro / SD3 / najlepszy dostępny do still image |

---

## JAK UŻYĆ W BROszURZE:

1. Wygeneruj każdy obraz osobno w Higgsfield
2. Zapisz jako PNG do `scripts/brochures/images/`
3. Uruchom `node scripts/brochures/generate-brochures.mjs` (zaktualizowany o grafiki)
4. PDF z grafikami będzie w `docs/`

Gotowe obrazy wrzuć do folderu `scripts/brochures/images/` a ja złożę z nich finalną broszurę.
