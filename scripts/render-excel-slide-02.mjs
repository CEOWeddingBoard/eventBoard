/**
 * Regeneruje slide-02 (06-excel-vs-planer) z poprawnym tekstem.
 * Tło dopasowane do slajdów Higgsfield (03–05) — bez jaśniejszego #f8f7f5 z HTML.
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(
  ROOT,
  "content/social/instagram-posts/06-excel-vs-planer/graphics/slide-02.png",
);
const CSS = path.join(ROOT, "scripts/instagram-slide-base.css").replace(/\\/g, "/");

const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <link rel="stylesheet" href="file:///${CSS}"/>
  <style>
    .excel-slide-02 .canvas {
      padding: 0;
      /* Cieplejsze tło jak slide-03 (Higgsfield), bez jasnych radiali z base.css */
      background-color: #f4f1ea;
      background-image:
        radial-gradient(ellipse 820px 640px at 86% 14%, rgba(255, 250, 242, 0.35) 0%, transparent 58%),
        radial-gradient(ellipse 760px 560px at 10% 88%, rgba(228, 218, 202, 0.22) 0%, transparent 52%);
    }
    .excel-slide-02 .stack {
      padding: 112px 72px 120px;
    }
    .excel-slide-02 .eyebrow {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 20px;
      font-style: italic;
      font-weight: 500;
      color: #a88952;
      margin-bottom: 18px;
    }
    .excel-slide-02 h1 {
      font-family: "Playfair Display", Georgia, serif;
      font-size: 58px;
      line-height: 1.14;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #2d3824;
      max-width: 900px;
    }
    .excel-slide-02 .rule {
      width: 72px;
      height: 2px;
      background: #c29564;
      opacity: 0.62;
      margin: 24px 0 38px;
    }
    .excel-slide-02 .lines p {
      font-family: "Montserrat", system-ui, sans-serif;
      font-size: 24px;
      line-height: 1.82;
      font-weight: 500;
      color: #6e6b66;
      margin: 0;
    }
  </style>
</head>
<body class="excel-slide-02">
  <div class="canvas">
    <div class="stack">
      <p class="eyebrow">Excel na start</p>
      <h1>Kiedy w zupełności wystarcza</h1>
      <div class="rule" aria-hidden="true"></div>
      <div class="lines">
        <p>Do ok. 40 gości i na samym początku planowania.</p>
        <p>Jeden arkusz, jedna osoba — jeszcze do opanowania.</p>
        <p>Gdy decyzji jest mało, Excel nie przeszkadza.</p>
      </div>
    </div>
    <div class="ig-footer"><span class="ig-brand">Wedding Board</span></div>
  </div>
</body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(ROOT, "content/social/instagram-posts/.tmp-excel-slide-02.html");
  fs.writeFileSync(tmp, HTML, "utf8");
  await page.goto(`file:///${tmp.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.locator("body").screenshot({ path: OUT, type: "png" });
  await browser.close();
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

  console.log("OK", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
