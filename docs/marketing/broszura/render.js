const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const dir = __dirname;
const b64 = (p, mime) => `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;

const html = fs
  .readFileSync(path.join(dir, "tpl.html"), "utf8")
  .replace("__FONT_LATINEXT__", b64(path.join(dir, "fonts/inter-latinext.woff2"), "font/woff2"))
  .replace("__FONT_LATIN__", b64(path.join(dir, "fonts/inter-latin.woff2"), "font/woff2"))
  .replaceAll("__IMG_PROCES__", b64(path.join(dir, "../../screens/03-panel-procesu.png"), "image/png"));

const out = path.join(dir, "index.html");
fs.writeFileSync(out, html);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
  await page.goto("file:///" + out.replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const pdf = process.argv[2] || path.join(dir, "..", "EventBoard-broszura.pdf");
  await page.pdf({ path: pdf, format: "A4", printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log("OK ->", pdf);
})();
