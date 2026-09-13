/**
 * Nagranie ekranu planera (dashboard → zadania → goście) → rolka 9:16.
 * Wymaga: npm run dev + baza z seedem (mock-user-id).
 *
 * node scripts/record-excel-screen-reel.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const OUT_DIR = path.join(ROOT, "content/social/instagram-posts/06-excel-vs-planer");
const OUT_REEL = path.join(OUT_DIR, "reel.mp4");
const OUT_EXPORT = path.join(OUT_DIR, "graphics", "20260629_152550_Export.MP4");

const W = 1920;
const H = 1080;
const REEL_W = 1080;
const REEL_H = 1920;
const BG = "0xf8f7f5";
const LOCALE = "pl";

function loadEnv(fileName) {
  const p = path.join(ROOT, fileName);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const baseUrl = process.env.PRODUCT_GUIDE_BASE_URL || "http://localhost:3000";

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function waitForServer(maxMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${baseUrl}/${LOCALE}/dashboard`, { redirect: "follow" });
      if (res.ok || res.status === 307 || res.status === 308) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Serwer niedostępny: ${baseUrl}`);
}

async function recordScreen(tmpVideoPath) {
  const videoDir = path.dirname(tmpVideoPath);
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: W, height: H } },
  });
  const page = await context.newPage();

  const go = async (route, ms) => {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(ms);
  };

  await go(`/${LOCALE}/dashboard`, 9000);
  await go(`/${LOCALE}/dashboard/tasks`, 11000);
  await go(`/${LOCALE}/dashboard/guests`, 4000);
  await page.evaluate(() => window.scrollBy(0, 280));
  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(9000);

  await context.close();
  await browser.close();

  const webm = fs.readdirSync(videoDir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("Brak pliku webm z Playwright");
  fs.renameSync(path.join(videoDir, webm), tmpVideoPath);
}

function toReel916(src, dest) {
  const vf = [
    "fps=30",
    `scale=${REEL_W}:-2:flags=lanczos`,
    `pad=${REEL_W}:${REEL_H}:(ow-iw)/2:(oh-ih)/2:color=${BG}`,
  ].join(",");
  ffmpeg(["-y", "-i", src, "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", dest]);
}

async function main() {
  console.log("Czekam na serwer:", baseUrl);
  await waitForServer();

  const tmp = path.join(OUT_DIR, ".screen-record-tmp");
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const raw = path.join(tmp, "raw.webm");

  try {
    console.log("Nagrywam ekran…");
    await recordScreen(raw);
    fs.mkdirSync(path.dirname(OUT_EXPORT), { recursive: true });
    console.log("Eksport 9:16…");
    toReel916(raw, OUT_REEL);
    fs.copyFileSync(OUT_REEL, OUT_EXPORT);
    console.log("OK", OUT_REEL);
    console.log("OK", OUT_EXPORT);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
