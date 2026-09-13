const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = "https://develop-weddingboarddev.up.railway.app/pl";
const outputDir = path.join(
  process.cwd(),
  "docs",
  "product-guide",
  "assets",
  "railway-public"
);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function shot(page, name, options = {}) {
  await page.screenshot({
    path: path.join(outputDir, name),
    fullPage: options.fullPage ?? false,
  });
  console.log(`OK ${name}`);
}

async function main() {
  ensureDir(outputDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1512, height: 982 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);

  await shot(page, "01-landing-hero.png");
  await shot(page, "02-landing-full-page.png", { fullPage: true });

  const sectionShots = [
    { y: 700, file: "03-sekcja-wszystko-w-jednym-miejscu.png" },
    { y: 1250, file: "04-sekcja-usadzenie-gosci-ai.png" },
    { y: 1900, file: "05-sekcja-cennik.png" },
    { y: 2450, file: "06-sekcja-rodo-i-cta.png" },
  ];

  for (const item of sectionShots) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), item.y);
    await page.waitForTimeout(900);
    await shot(page, item.file);
  }

  await page.goto(`${baseUrl}/sign-in`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "07-sign-in.png");

  const googleButton = page.getByRole("button", {
    name: /google|continue with google|z google/i,
  });
  if (await googleButton.first().isVisible().catch(() => false)) {
    await googleButton.first().click();
    await page.waitForTimeout(1800);
    await shot(page, "08-sign-in-google-click.png");
  }

  await page.goto(`${baseUrl}/sign-up`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "09-sign-up.png");

  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
