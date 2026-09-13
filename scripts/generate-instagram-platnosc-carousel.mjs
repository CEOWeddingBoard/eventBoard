/**
 * Relacje IG (3 slajdy, 9:16) — płatność / trial, styl organizacja-harmonogram.
 * Uruchom: node scripts/generate-instagram-platnosc-carousel.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(
  ROOT,
  "content/social/instagram-posts/14-platnosc-trial/stories"
);

const W = 1080;
const H = 1920;
const CX = W / 2;

const palette = {
  cream: "#f5f3ee",
  ivory: "#fefdfb",
  ink: "#2d3824",
  gold: "#9a8554",
  olive: "#7d8d6e",
  goldSoft: "#c4b08a",
  oliveSoft: "#a8b598",
};

const FONT_CACHE = path.join(ROOT, "scripts/.font-cache");

const fontSources = {
  greatVibes:
    "https://cdn.jsdelivr.net/fontsource/fonts/great-vibes@5.0.8/latin-400-normal.ttf",
  playfairBold:
    "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@5.0.8/latin-700-normal.ttf",
  cormorant:
    "https://cdn.jsdelivr.net/fontsource/fonts/cormorant@5.0.8/latin-600-normal.ttf",
  montserrat:
    "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.0.8/latin-400-normal.ttf",
  montserratSemi:
    "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.0.8/latin-600-normal.ttf",
  montserratBold:
    "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@5.0.8/latin-700-normal.ttf",
};

let fontUris = {};

async function ensureFonts() {
  fs.mkdirSync(FONT_CACHE, { recursive: true });
  const paths = {};
  for (const [key, url] of Object.entries(fontSources)) {
    const file = path.join(FONT_CACHE, `${key}.ttf`);
    if (!fs.existsSync(file)) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Font download failed: ${url}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    }
    paths[key] = file;
  }
  return paths;
}

function fontDataUri(filePath) {
  const b64 = fs.readFileSync(filePath).toString("base64");
  return `data:font/ttf;base64,${b64}`;
}

function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decorativeBg() {
  return `
    <defs>
      <style>
        @font-face { font-family: 'GreatVibes'; src: url('${fontUris.greatVibes}') format('truetype'); }
        @font-face { font-family: 'Playfair'; src: url('${fontUris.playfairBold}') format('truetype'); font-weight: 700; }
        @font-face { font-family: 'Cormorant'; src: url('${fontUris.cormorant}') format('truetype'); font-weight: 600; }
        @font-face { font-family: 'Montserrat'; src: url('${fontUris.montserrat}') format('truetype'); }
        @font-face { font-family: 'Montserrat'; src: url('${fontUris.montserratSemi}') format('truetype'); font-weight: 600; }
        @font-face { font-family: 'Montserrat'; src: url('${fontUris.montserratBold}') format('truetype'); font-weight: 700; }
      </style>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.ivory}"/>
        <stop offset="45%" stop-color="${palette.cream}"/>
        <stop offset="100%" stop-color="#ebe6dc"/>
      </linearGradient>
      <radialGradient id="wash1" cx="15%" cy="10%" r="45%">
        <stop offset="0%" stop-color="${palette.goldSoft}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${palette.cream}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="wash2" cx="88%" cy="82%" r="50%">
        <stop offset="0%" stop-color="${palette.oliveSoft}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${palette.cream}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <rect width="${W}" height="${H}" fill="url(#wash1)"/>
    <rect width="${W}" height="${H}" fill="url(#wash2)"/>
    <g opacity="0.35" fill="none" stroke="${palette.gold}" stroke-width="1.2">
      <ellipse cx="920" cy="220" rx="110" ry="70" transform="rotate(-18 920 220)"/>
      <ellipse cx="140" cy="1680" rx="95" ry="60" transform="rotate(12 140 1680)"/>
    </g>
    <g opacity="0.5">
      <circle cx="90" cy="160" r="4" fill="${palette.gold}"/>
      <circle cx="990" cy="1760" r="3.5" fill="${palette.olive}"/>
    </g>
    <line x1="120" y1="1840" x2="960" y2="1840" stroke="${palette.gold}" stroke-width="1" opacity="0.35"/>
    <text x="${CX}" y="1875" text-anchor="middle" font-family="Montserrat" font-size="18" fill="${palette.gold}" letter-spacing="4">WEDDING BOARD</text>
  `;
}

function eyebrow(text, y = 340) {
  return `<text x="${CX}" y="${y}" text-anchor="middle" font-family="Montserrat" font-size="24" font-weight="600" fill="${palette.gold}" letter-spacing="6">${esc(text)}</text>`;
}

function titleLines(lines, yStart, size, lineHeight) {
  return lines
    .map(
      (line, i) =>
        `<text x="${CX}" y="${yStart + i * lineHeight}" text-anchor="middle" font-family="Playfair" font-size="${size}" font-weight="700" fill="${palette.ink}">${esc(line)}</text>`
    )
    .join("\n");
}

function bodyLines(lines, yStart, size = 32, lineHeight = 50, color = palette.ink) {
  return lines
    .map(
      (line, i) =>
        `<text x="${CX}" y="${yStart + i * lineHeight}" text-anchor="middle" font-family="Montserrat" font-size="${size}" fill="${color}" opacity="0.88">${esc(line)}</text>`
    )
    .join("\n");
}

function pill(text, y) {
  return `
    <rect x="240" y="${y - 48}" width="600" height="80" rx="40" fill="${palette.gold}" opacity="0.92"/>
    <text x="${CX}" y="${y + 10}" text-anchor="middle" font-family="Montserrat" font-size="28" font-weight="600" fill="${palette.ivory}">${esc(text)}</text>
  `;
}

function featureRow(text, y) {
  return `
    <circle cx="200" cy="${y}" r="6" fill="${palette.gold}"/>
    <text x="230" y="${y + 9}" font-family="Montserrat" font-size="32" fill="${palette.ink}">${esc(text)}</text>
  `;
}

function slideSvg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${decorativeBg()}
    ${content}
  </svg>`;
}

function buildStories() {
  return [
    {
      file: "story-01.png",
      svg: slideSvg(`
        ${eyebrow("PLANER WESELNY")}
        <text x="${CX}" y="480" text-anchor="middle" font-family="GreatVibes" font-size="100" fill="${palette.gold}">Wedding Board</text>
        <text x="${CX}" y="720" text-anchor="middle" font-family="Playfair" font-size="130" font-weight="700" fill="${palette.gold}">30 dni</text>
        <text x="${CX}" y="820" text-anchor="middle" font-family="Playfair" font-size="72" font-weight="700" fill="${palette.ink}">za darmo</text>
        ${bodyLines(
          [
            "Pełny dostęp do planera.",
            "Goście, budżet, zadania, plan stołów.",
            "Podłącz kartę — dziś nic nie pobieramy.",
          ],
          940,
          30,
          48
        )}
        ${pill("Przesuń →", 1280)}
      `),
    },
    {
      file: "story-02.png",
      svg: slideSvg(`
        ${eyebrow("POTEM TYLKO")}
        <text x="${CX}" y="560" text-anchor="middle" font-family="Playfair" font-size="150" font-weight="700" fill="${palette.gold}">59 zł</text>
        <text x="${CX}" y="660" text-anchor="middle" font-family="Montserrat" font-size="40" font-weight="600" fill="${palette.ink}">miesięcznie</text>
        ${bodyLines(["Mniej niż kawa dziennie.", "Rezygnacja w każdej chwili."], 760, 30, 48, palette.olive)}
        <rect x="140" y="920" width="800" height="420" rx="24" fill="${palette.ivory}" stroke="${palette.gold}" stroke-width="1.5" opacity="0.95"/>
        <text x="${CX}" y="1000" text-anchor="middle" font-family="Playfair" font-size="44" font-weight="700" fill="${palette.ink}">Wszystko w jednym miejscu</text>
        ${featureRow("Lista gości i RSVP", 1080)}
        ${featureRow("Budżet pod kontrolą", 1150)}
        ${featureRow("Plan stołów z AI", 1220)}
        ${featureRow("Checklist i harmonogram", 1290)}
      `),
    },
    {
      file: "story-03.png",
      svg: slideSvg(`
        ${eyebrow("GOTOWA?")}
        <text x="${CX}" y="520" text-anchor="middle" font-family="GreatVibes" font-size="110" fill="${palette.gold}">Zacznij dziś</text>
        ${titleLines(["Link w bio"], 680, 88, 100)}
        ${bodyLines(
          [
            "30 dni za darmo · potem 59 zł/mies.",
            "Anulujesz kiedy chcesz — bez pytań.",
          ],
          900,
          30,
          48
        )}
        ${pill("weddingboard.pl", 1120)}
        <text x="${CX}" y="1280" text-anchor="middle" font-family="Cormorant" font-size="38" fill="${palette.olive}">pierwszy miesiąc bez opłat 💛</text>
      `),
    },
  ];
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const fontPaths = await ensureFonts();
fontUris = Object.fromEntries(
  Object.entries(fontPaths).map(([k, v]) => [k, fontDataUri(v)])
);

const stories = buildStories();
const bgPath = path.join(ROOT, "public/background-cream-gold.png");

for (const story of stories) {
  const outPath = path.join(OUT_DIR, story.file);
  const svgBuffer = Buffer.from(story.svg);

  const composites = [];
  if (fs.existsSync(bgPath)) {
    const floral = await sharp(bgPath)
      .resize(W, H, { fit: "cover" })
      .ensureAlpha()
      .linear(1, 0)
      .png()
      .toBuffer();
    composites.push({ input: floral, blend: "multiply", opacity: 0.12 });
  }

  await sharp(svgBuffer).composite(composites).png().toFile(outPath);
  console.log("✓", outPath);
}

console.log(`\nWygenerowano ${stories.length} relacji → ${OUT_DIR}`);
