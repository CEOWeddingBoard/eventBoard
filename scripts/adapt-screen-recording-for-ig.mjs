/**
 * Nagranie ekranu → rolka IG 9:16 (1080×1920), tło #f8f7f5.
 *
 * Desktop (poziome): crop Chrome, scale do szerokości 1080 + pad.
 * Telefon (pionowe): crop status/pasek URL + nawigacja Android, scale do wys. 1920 + pad.
 *
 * node scripts/adapt-screen-recording-for-ig.mjs --in graphics/nagranie.mp4 --mode phone
 * node scripts/adapt-screen-recording-for-ig.mjs --in nagranie.mp4 --trim 1.5,48
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const REEL_W = 1080;
const REEL_H = 1920;
const BG = "0xf8f7f5";
const FPS = 30;

const DESKTOP_CROP = { top: 142, right: 0, bottom: 0, left: 0 };
/** Tylko pasek statusu Android — Chrome chowa się przy scrollu, więc duży crop obcina menu. */
const PHONE_CROP = { top: 40, right: 0, bottom: 50, left: 0 };

const DEFAULT_SOURCE =
  process.platform === "win32"
    ? path.join(os.homedir(), "Videos", "EaseUS RecExperts", "20260629_152550.mp4")
    : "";

function parseArgs() {
  const args = process.argv.slice(2);
  let input = "";
  let post = "06-excel-vs-planer";
  let outReel = "";
  let outExport = "";
  let mode = "auto";
  let crop = null;
  let noCrop = false;
  let trimStart = null;
  let trimDur = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--in" && args[i + 1]) input = args[++i];
    else if (args[i] === "--post" && args[i + 1]) post = args[++i];
    else if (args[i] === "--out-reel" && args[i + 1]) outReel = args[++i];
    else if (args[i] === "--out-export" && args[i + 1]) outExport = args[++i];
    else if (args[i] === "--mode" && args[i + 1]) mode = args[++i];
    else if (args[i] === "--crop" && args[i + 1]) {
      const [top, right, bottom, left] = args[++i].split(",").map((n) => Number(n.trim()));
      crop = { top, right, bottom, left };
    } else if (args[i] === "--trim" && args[i + 1]) {
      const [start, dur] = args[++i].split(",").map((n) => Number(n.trim()));
      trimStart = start;
      trimDur = dur;
    } else if (args[i] === "--no-crop") noCrop = true;
  }

  const postDir = path.join(ROOT, "content/social/instagram-posts", post);
  if (!outReel) outReel = path.join(postDir, "reel.mp4");
  if (!outExport) {
    outExport = path.join(postDir, "graphics", "20260629_152550_Export.MP4");
  }
  if (!input) input = DEFAULT_SOURCE;

  return { input, outReel, outExport, mode, crop, noCrop, trimStart, trimDur };
}

function probeVideo(input) {
  const r = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=p=0",
      input,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error("ffprobe failed");
  const [w, h] = r.stdout.trim().split(",").map(Number);
  return { width: w, height: h };
}

function resolveMode(mode, width, height) {
  if (mode === "phone" || mode === "portrait") return "phone";
  if (mode === "desktop" || mode === "landscape") return "desktop";
  return height > width ? "phone" : "desktop";
}

function buildCropFilter(crop) {
  const { top, right, bottom, left } = crop;
  return `crop=iw-${left + right}:ih-${top + bottom}:${left}:${top}`;
}

function buildScalePad(mode) {
  if (mode === "phone") {
    return [
      `scale=-2:${REEL_H}:flags=lanczos`,
      `pad=${REEL_W}:${REEL_H}:(ow-iw)/2:0:color=${BG}`,
    ];
  }
  return [
    `scale=${REEL_W}:-2:flags=lanczos`,
    `pad=${REEL_W}:${REEL_H}:(ow-iw)/2:(oh-ih)/2:color=${BG}`,
  ];
}

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function main() {
  const { input, outReel, outExport, mode, crop, noCrop, trimStart, trimDur } = parseArgs();

  if (!input || !fs.existsSync(input)) {
    console.error("Brak pliku źródłowego:", input || "(nie podano --in)");
    process.exit(1);
  }

  const { width, height } = probeVideo(input);
  const resolvedMode = resolveMode(mode, width, height);
  const activeCrop = crop ?? (resolvedMode === "phone" ? PHONE_CROP : DESKTOP_CROP);

  fs.mkdirSync(path.dirname(outReel), { recursive: true });
  fs.mkdirSync(path.dirname(outExport), { recursive: true });

  const filters = [];
  if (!noCrop) filters.push(buildCropFilter(activeCrop));
  filters.push(`fps=${FPS}`);
  filters.push(...buildScalePad(resolvedMode));
  const vf = filters.join(",");

  const inputArgs = ["-y"];
  if (trimStart != null) inputArgs.push("-ss", String(trimStart));
  inputArgs.push("-i", input);
  if (trimDur != null) inputArgs.push("-t", String(trimDur));

  console.log("Źródło:", input, `(${width}×${height})`);
  console.log("Tryb:", resolvedMode);
  if (!noCrop) console.log("Crop:", activeCrop);
  if (trimStart != null || trimDur != null) {
    console.log("Trim:", trimStart ?? 0, "+", trimDur ?? "koniec", "s");
  }
  console.log("Eksport 9:16…");

  ffmpeg([
    ...inputArgs,
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "20",
    "-preset",
    "medium",
    "-movflags",
    "+faststart",
    "-an",
    outReel,
  ]);

  fs.copyFileSync(outReel, outExport);
  console.log("OK", outReel);
  console.log("OK", outExport);
}

main();
