import { chromium } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "generate-instagram-logo.html");
const outPath = path.join(__dirname, "..", "content", "social", "avatar", "instagram-profile-logo.png");
const outPathAlt = path.join(__dirname, "..", "content", "social", "avatar", "instagram-profile-logo-text-only.png");

async function capture(page, selector, output) {
  const el = page.locator(selector);
  await el.screenshot({ path: output, type: "png" });
  console.log(`Saved: ${output}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

await capture(page, "body", outPath);

await page.evaluate(() => {
  document.querySelector(".icon-ring")?.remove();
  const name = document.querySelector(".brand-name");
  if (name) name.style.fontSize = "132px";
});
await capture(page, "body", outPathAlt);

await browser.close();
