/**
 * Karuzela PNG → rolka IG 9:16 (1080×1920), delikatny zoom, tło #f8f7f5.
 *
 * node scripts/build-carousel-reel.mjs --dir content/social/instagram-posts/06-excel-vs-planer/graphics
 * node scripts/build-carousel-reel.mjs --dir ... --out reel.mp4 --sec 7
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const W = 1080;
const H = 1920;
const FPS = 30;
const BG = "0xf8f7f5";

function parseArgs() {
  const dirIdx = process.argv.indexOf("--dir");
  const outIdx = process.argv.indexOf("--out");
  const secIdx = process.argv.indexOf("--sec");
  if (dirIdx < 0) {
    console.error("Użycie: node scripts/build-carousel-reel.mjs --dir <folder-z-slide-XX.png> [--out reel.mp4] [--sec 7]");
    process.exit(1);
  }
  const dirRel = process.argv[dirIdx + 1];
  const dir = path.join(ROOT, dirRel);
  const out = outIdx >= 0 ? path.join(ROOT, process.argv[outIdx + 1]) : path.join(path.dirname(dir), "reel.mp4");
  const sec = secIdx >= 0 ? Number(process.argv[secIdx + 1]) : 7;
  return { dir, out, sec };
}

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function slideFilter(sec) {
  const frames = sec * FPS;
  return [
    `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${BG}`,
    `zoompan=z='min(zoom+0.00035,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`,
  ].join(",");
}

function main() {
  const { dir, out, sec } = parseArgs();
  if (!fs.existsSync(dir)) {
    console.error("Brak katalogu:", dir);
    process.exit(1);
  }

  const slides = fs
    .readdirSync(dir)
    .filter((f) => /^slide-\d+\.png$/i.test(f))
    .sort();
  if (!slides.length) {
    console.error("Brak slide-XX.png w", dir);
    process.exit(1);
  }

  const tmp = path.join(dir, ".reel-build-tmp");
  fs.mkdirSync(tmp, { recursive: true });
  const parts = [];

  try {
    for (let i = 0; i < slides.length; i++) {
      const part = path.join(tmp, `part-${String(i + 1).padStart(2, "0")}.mp4`);
      parts.push(part);
      const input = path.join(dir, slides[i]);
      ffmpeg([
        "-y",
        "-loop",
        "1",
        "-i",
        input,
        "-vf",
        slideFilter(sec),
        "-t",
        String(sec),
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-r",
        String(FPS),
        part,
      ]);
    }

    const listFile = path.join(tmp, "concat.txt");
    fs.writeFileSync(
      listFile,
      parts.map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"),
      "utf8",
    );

    fs.mkdirSync(path.dirname(out), { recursive: true });
    ffmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", out]);
    console.log("OK", out, `(${slides.length} slajdów × ${sec}s, ${W}×${H})`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main();
