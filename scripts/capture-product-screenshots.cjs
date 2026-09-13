const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(fileName) {
  const fullPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(fullPath)) return;
  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx < 1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const prisma = new PrismaClient();
const baseUrl = process.env.PRODUCT_GUIDE_BASE_URL || "http://localhost:3000";
const locale = "pl";
const outputDir = path.join(process.cwd(), "docs", "product-guide", "assets");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function getDemoRefs() {
  const event = await prisma.event.findFirst({
    where: { userId: "mock-user-id" },
    include: {
      guests: {
        where: { invitationToken: { not: null } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      vendors: {
        where: { portalToken: { not: null } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!event) {
    throw new Error("Brak eventu mock-user-id. Uruchom seed bazy: npm run db:seed");
  }

  if (!event.publicSlug || !event.guestPortalEnabled) {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        publicSlug: event.publicSlug || "nasze-wesele-demo",
        guestPortalEnabled: true,
        description:
          event.description ||
          "Cieszymy sie, ze bedziesz z nami. Na tej stronie znajdziesz wszystkie informacje o naszym slubie.",
        dressCode: event.dressCode || "Elegancki smart casual",
        ceremonyLocationName: event.ceremonyLocationName || "Kosciol sw. Marii",
        ceremonyLocationUrl:
          event.ceremonyLocationUrl || "https://maps.google.com/?q=Kosciol+sw+Marii",
        receptionLocationName: event.receptionLocationName || "Sala Pod Debami",
        receptionLocationUrl:
          event.receptionLocationUrl || "https://maps.google.com/?q=Sala+Pod+Debami",
      },
    });
  }

  let guestToken = event.guests?.[0]?.invitationToken || null;
  if (!guestToken) {
    const guest = await prisma.guest.findFirst({
      where: { eventId: event.id },
      orderBy: { createdAt: "asc" },
    });
    if (guest) {
      guestToken = `demo-${guest.id.slice(0, 8)}`;
      await prisma.guest.update({
        where: { id: guest.id },
        data: { invitationToken: guestToken },
      });
    }
  }

  let vendorToken = event.vendors?.[0]?.portalToken || null;
  if (!vendorToken) {
    const vendor = await prisma.vendor.findFirst({
      where: { eventId: event.id },
      orderBy: { createdAt: "asc" },
    });
    if (vendor) {
      vendorToken = `vendor-${vendor.id.slice(0, 8)}`;
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { portalToken: vendorToken },
      });
    }
  }

  return {
    publicSlug: event.publicSlug || "nasze-wesele-demo",
    guestToken,
    vendorToken,
  };
}

async function capture(page, route, fileName, waitMs = 1200) {
  const fullUrl = `${baseUrl}${route}`;
  await page.goto(fullUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(waitMs);
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: true,
  });
  console.log(`OK ${fileName} <= ${route}`);
}

async function run() {
  ensureDir(outputDir);
  const refs = await getDemoRefs();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1512, height: 982 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const routes = [
    { route: `/${locale}/dashboard`, file: "01-dashboard-overview.png" },
    { route: `/${locale}/dashboard/tasks`, file: "02-zadania.png" },
    { route: `/${locale}/dashboard/budget`, file: "03-budzet.png" },
    { route: `/${locale}/dashboard/guests`, file: "04-goscie-rsvp.png" },
    { route: `/${locale}/dashboard/seating`, file: "05-plan-stolow.png" },
    { route: `/${locale}/dashboard/day`, file: "06-plan-dnia-menu.png" },
    { route: `/${locale}/dashboard/vendors`, file: "07-dostawcy.png" },
    { route: `/${locale}/dashboard/communication`, file: "08-komunikacja.png" },
    { route: `/${locale}/dashboard/portal`, file: "09-konfiguracja-portalu-goscia.png" },
    { route: `/${locale}/dashboard/account`, file: "10-konto-platnosci.png" },
  ];

  for (const item of routes) {
    await capture(page, item.route, item.file);
  }

  await capture(
    page,
    `/${locale}/w/${refs.publicSlug}`,
    "11-publiczny-portal-goscia.png",
    1500
  );

  if (refs.guestToken) {
    await capture(
      page,
      `/${locale}/w/${refs.publicSlug}?token=${refs.guestToken}`,
      "12-portal-goscia-z-tokenem.png",
      1500
    );
    await capture(
      page,
      `/${locale}/rsvp/${refs.guestToken}`,
      "13-formularz-rsvp.png",
      1500
    );
  }

  if (refs.vendorToken) {
    await capture(
      page,
      `/${locale}/vendor-portal/${refs.vendorToken}`,
      "14-portal-uslugodawcy.png",
      1500
    );
  }

  await context.close();
  await browser.close();
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
