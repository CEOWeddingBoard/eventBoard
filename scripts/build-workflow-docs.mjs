/**
 * Wstawia zrzuty ekranu do dokumentacji jako data URI.
 *
 * CSP artefaktów blokuje obrazy z zewnętrznych hostów, więc pliki muszą być
 * osadzone w dokumencie. Szablon trzyma czytelne znaczniki __IMG_NN__,
 * gdzie NN to prefiks pliku zrzutu (np. __IMG_12__ → 12-eventy.webp).
 *
 *   node scripts/build-workflow-docs.mjs <szablon.html> <wynik.html> [katalogZeZrzutami]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";

const [template, output, screensArg] = process.argv.slice(2);
if (!template || !output) {
  console.error("użycie: build-workflow-docs.mjs <szablon> <wynik> [katalogZeZrzutami]");
  process.exit(1);
}
const screens = screensArg ?? path.join(process.cwd(), "docs", "screens");

if (!existsSync(screens)) {
  console.error(`[docs] brak katalogu ze zrzutami: ${screens}`);
  process.exit(1);
}

// Mapa prefiks → plik. Preferujemy webp; png służy jako materiał źródłowy.
const byPrefix = new Map();
for (const f of readdirSync(screens)) {
  const m = /^(\d+)-.*\.(webp|png)$/.exec(f);
  if (!m) continue;
  const [, prefix, ext] = m;
  const current = byPrefix.get(prefix);
  if (!current || (ext === "webp" && !current.endsWith(".webp"))) byPrefix.set(prefix, f);
}

let html = readFileSync(template, "utf8");
const missing = new Set();
let embedded = 0;

html = html.replace(/__IMG_(\d+)__/g, (match, prefix) => {
  const file = byPrefix.get(prefix);
  if (!file) { missing.add(`${match} (brak pliku ${prefix}-*.webp)`); return match; }
  const bytes = readFileSync(path.join(screens, file));
  const mime = file.endsWith(".webp") ? "image/webp" : "image/png";
  embedded++;
  console.log(`[docs] ${match} ← ${file} (${(bytes.length / 1024).toFixed(0)} KB)`);
  return `data:${mime};base64,${bytes.toString("base64")}`;
});

if (missing.size) {
  console.error(`[docs] nie podstawiono: ${[...missing].join(", ")}`);
  process.exit(1);
}

writeFileSync(output, html, "utf8");
console.log(`[docs] osadzono ${embedded} zrzutów → ${output} (${(Buffer.byteLength(html, "utf8") / 1024).toFixed(0)} KB)`);
