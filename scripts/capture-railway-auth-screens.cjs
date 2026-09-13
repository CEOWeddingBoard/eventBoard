const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const base = "https://develop-weddingboarddev.up.railway.app/pl";
const outDir = path.join(process.cwd(), "docs", "product-guide", "assets", "railway-auth");

async function loginAndCapture(otpCode) {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1512, height: 982 },
  });

  await page.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
  await page.locator("#identifier-field").fill("adas123321@gmail.com");
  await page.locator("#password-field").fill("Bogunice1996");
  await page.locator("#password-field").press("Enter");
  await page.waitForURL("**/sign-in/factor-one", { timeout: 20000 });

  const otpDigits = page.locator("input[inputmode='numeric'], input[type='tel']");
  const otpCount = await otpDigits.count();
  if (otpCount >= 6) {
    for (let i = 0; i < 6; i += 1) {
      await otpDigits.nth(i).fill(otpCode[i] || "");
    }
  } else {
    const fallback = page.locator("input[inputmode='numeric']").first();
    await fallback.waitFor({ state: "visible", timeout: 20000 });
    await fallback.fill(otpCode);
  }

  await page.getByRole("button", { name: /kontynuuj|continue|verify/i }).first().click();
  await page.waitForTimeout(7000);
  await page.waitForLoadState("networkidle").catch(() => {});
  console.log("AFTER_OTP_URL", page.url());

  await page.screenshot({ path: path.join(outDir, "01-after-otp.png"), fullPage: true });

  const routes = [
    ["/dashboard", "02-dashboard.png"],
    ["/dashboard/tasks", "03-tasks.png"],
    ["/dashboard/budget", "04-budget.png"],
    ["/dashboard/guests", "05-guests.png"],
    ["/dashboard/seating", "06-seating.png"],
    ["/dashboard/day", "07-day.png"],
    ["/dashboard/vendors", "08-vendors.png"],
    ["/dashboard/portal", "09-guest-portal-config.png"],
    ["/dashboard/account", "10-account.png"],
  ];

  for (const [route, file] of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    console.log("SHOT", file);
  }

  await browser.close();
}

const otpCode = process.argv[2];
if (!otpCode || otpCode.length < 6) {
  console.error("Podaj 6-cyfrowy kod OTP jako argument.");
  process.exit(1);
}

loginAndCapture(otpCode).catch((error) => {
  console.error(error);
  process.exit(1);
});
