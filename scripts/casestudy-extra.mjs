/** Dołapuje brakujące zrzuty do case study: warianty menu na karcie eventu. */
import { chromium } from "playwright";
import path from "path";

const BASE = process.argv[2] ?? "https://develop-weddingboarddev.up.railway.app";
const OUT = path.resolve(process.argv[3] ?? path.join(process.cwd(), "docs", "screens"));
const log = (m) => console.log(`[cs+] ${m}`);

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "pl-PL" });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/pl/auth`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /kontem testowym/i }).click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 60000 });

  await page.goto(`${BASE}/pl/app/events`, { waitUntil: "networkidle" });
  const href = await page.evaluate(() => {
    const linki = [...document.querySelectorAll("a")].filter((a) => /\/events\/[a-z0-9]{20,}/.test(a.getAttribute("href") ?? ""));
    for (const a of linki) {
      let box = a;
      while (box.parentElement) { const p = box.parentElement; if ([...p.querySelectorAll("a")].filter((x) => /\/events\/[a-z0-9]{20,}/.test(x.getAttribute("href") ?? "")).length > 1) break; box = p; }
      if (/Wesele Ani i Tomka/.test(box.innerText ?? "")) return a.getAttribute("href");
    }
    return linki[0]?.getAttribute("href");
  });
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    const h = [...document.querySelectorAll("*")].reverse().find((e) => /^Warianty menu/.test(e.textContent?.trim() ?? "") && e.children.length < 6);
    let c = h; for (let k = 0; k < 10 && c?.parentElement; k++) { c = c.parentElement; const cl = typeof c.className === "string" ? c.className : ""; if (/rounded/.test(cl) && c.getBoundingClientRect().height > 200) break; }
    c?.setAttribute("data-shot", "1"); c?.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(700);
  const el = page.locator('[data-shot="1"]').first();
  if (await el.count()) { await el.screenshot({ path: path.join(OUT, "cs-08-menu-warianty.png") }); log("📷 08-menu-warianty"); }
  else { await page.screenshot({ path: path.join(OUT, "cs-08-menu-warianty.png") }); log("📷 08 (fallback fullpage)"); }

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
