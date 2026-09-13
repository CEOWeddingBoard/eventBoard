/**
 * Usuwa wbakowany pasek stopki (numeracja + szary pas) ze slajdów PNG
 * wygenerowanych poza build-instagram-posts (np. 06-excel-vs-planer).
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DEFAULTS = {
  stripPx: 132,
  maskPx: 120,
  bg: "#f8f7f5",
};

/** Tło dolnej maski dopasowane do każdego slajdu (usuwa szary/biały pas stopki). */
const SLIDE_OVERRIDES = {
  "slide-01.png": { bg: "#f0ebe5", stripPx: 145, maskPx: 135 },
  "slide-02.png": { bg: "#f8f7f5", stripPx: 132, maskPx: 118 },
  "slide-03.png": { bg: "#f5f3ee", stripPx: 145, maskPx: 130 },
  "slide-04.png": { bg: "#f8f7f5", stripPx: 132, maskPx: 120 },
  "slide-05.png": { bg: "#faf9f7", stripPx: 140, maskPx: 125 },
};

function slideHtml(imagePath, { stripPx, maskPx, bg }) {
  const src = imagePath.replace(/\\/g, "/");
  const fontPath = path.join(ROOT, "public/fonts/GreatVibes-Regular.ttf").replace(/\\/g, "/");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    @font-face {
      font-family: "Great Vibes";
      src: url("file:///${fontPath}") format("truetype");
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      background: ${bg};
    }
    .frame {
      width: 1080px;
      height: 1350px;
      position: relative;
      background: ${bg};
    }
    .src {
      position: absolute;
      left: 0;
      top: 0;
      width: 1080px;
      height: 1350px;
      object-fit: cover;
      object-position: top center;
      clip-path: inset(0 0 ${stripPx}px 0);
    }
    .mask {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: ${maskPx}px;
      background: ${bg};
      z-index: 1;
    }
    .brand {
      position: absolute;
      left: 56px;
      bottom: 40px;
      font-family: "Great Vibes", cursive;
      font-size: 26px;
      font-weight: 400;
      color: #2d2d2d;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="frame">
    <img class="src" src="file:///${src}" alt=""/>
    <div class="mask" aria-hidden="true"></div>
    <span class="brand">Wedding Board</span>
  </div>
</body>
</html>`;
}

async function stripSlide(page, imagePath, outPath, opts) {
  const html = slideHtml(imagePath, opts);
  const tmp = path.join(ROOT, "content/social/instagram-posts/.tmp-strip.html");
  fs.writeFileSync(tmp, html, "utf8");
  await page.goto(`file:///${tmp.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.locator("body").screenshot({ path: outPath, type: "png" });
}

async function main() {
  const targetArg = process.argv.find((a) => a.startsWith("--dir"));
  const dirRel = targetArg
    ? process.argv[process.argv.indexOf(targetArg) + 1]
    : "content/social/instagram-posts/06-excel-vs-planer/graphics";

  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) {
    console.error("Brak katalogu:", dir);
    process.exit(1);
  }

  const slides = fs
    .readdirSync(dir)
    .filter((f) => /^slide-\d+\.png$/i.test(f))
    .sort();

  if (!slides.length) {
    console.error("Brak plików slide-XX.png w", dir);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });

  for (const file of slides) {
    const full = path.join(dir, file);
    const opts = { ...DEFAULTS, ...(SLIDE_OVERRIDES[file] || {}) };
    await stripSlide(page, full, full, opts);
    console.log("OK", file);
  }

  await browser.close();
  if (fs.existsSync(path.join(ROOT, "content/social/instagram-posts/.tmp-strip.html"))) {
    fs.unlinkSync(path.join(ROOT, "content/social/instagram-posts/.tmp-strip.html"));
  }
  console.log("Done:", dir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
