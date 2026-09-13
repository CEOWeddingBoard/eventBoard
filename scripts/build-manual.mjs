/**
 * Scala podręcznik zakładek z dokumentacją silnika procesów w jeden dokument.
 *
 * Oba źródła powstały osobno i mają część wspólną: edytor procesów, panel
 * procesu na evencie i konfigurację pokazywały te same ekrany. W scalonym
 * dokumencie zrzuty zostają w części o panelu, a część o silniku odwołuje się
 * do nich zamiast powtarzać.
 *
 *   node scripts/build-manual.mjs
 *
 * Wynik: docs/eventboard-full.template.html (ze znacznikami __IMG_NN__).
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const DOCS = path.join(process.cwd(), "docs");
const MANUAL = path.join(DOCS, "eventboard-manual.template.html");
const ENGINE = path.join(DOCS, "workflow-docs.template.html");
const OUT = path.join(DOCS, "eventboard-full.template.html");

const manual = readFileSync(MANUAL, "utf8");
const engine = readFileSync(ENGINE, "utf8");

/** Wycina <section id="..."> ... </section> po identyfikatorze. */
function section(src, id) {
  const start = src.indexOf(`<section id="${id}">`);
  if (start === -1) throw new Error(`brak sekcji #${id}`);
  const end = src.indexOf("</section>", start);
  return src.slice(start, end + "</section>".length);
}

/** Usuwa <figure> zawierające wskazany znacznik obrazu (zdublowane zrzuty). */
function dropFigure(html, marker) {
  const i = html.indexOf(marker);
  if (i === -1) return html;
  const start = html.lastIndexOf("<figure>", i);
  const end = html.indexOf("</figure>", i);
  if (start === -1 || end === -1) return html;
  return html.slice(0, start) + html.slice(end + "</figure>".length);
}

/** Zmienia tytuł sekcji (tekst po </span> w <h2>). */
function retitle(html, title) {
  return html.replace(/(<h2>.*?<\/span>)([\s\S]*?)(<\/h2>)/, (_m, a, _b, c) => `${a}${title}${c}`);
}

// ── CSS: podręcznik + komponenty z dokumentacji silnika ───────────────────
const engineStyle = engine.slice(engine.indexOf("<style>") + 7, engine.indexOf("</style>"));
const engineComponents = engineStyle.slice(engineStyle.indexOf("/* ---------- pipeline ---------- */"));

// ── sekcje ────────────────────────────────────────────────────────────────
const czescI = [
  section(manual, "sciezka"),
  section(manual, "start"),
  section(manual, "dashboard"),
  section(manual, "kalendarz"),
  section(manual, "eventy"),
  section(manual, "karta"),
  section(manual, "agenda"),
  section(manual, "zapytania"),
  section(manual, "finanse"),
  section(manual, "zespol"),
  section(manual, "konfiguracja"),
  section(manual, "ustawienia"),
  section(manual, "klient"),
];

// Część II — silnik. Zrzuty pokazane już w części I zostają usunięte.
const czescII = [
  retitle(section(engine, "przeglad"), "Jak działa proces"),
  section(engine, "model"),
  // Edytor zachowuje swoje zrzuty — to jedyne miejsce, które je pokazuje.
  // Podmieniamy na ujęcia z tego samego przebiegu demo co reszta dokumentu.
  section(engine, "edytor")
    .replace("__IMG_02__", "__IMG_18__")
    .replace("__IMG_01__", "__IMG_19__"),
  section(engine, "przypisanie"),
  dropFigure(section(engine, "organizator"), "__IMG_03__").replace(
    "</p>",
    ' Zrzut tego panelu znajdziesz w części o <a href="#karta">karcie eventu</a>.</p>',
  ),
  // Portal opisany od strony procesu. Identyfikator kolidowałby z sekcją
  // „Widok klienta” z części o panelu, więc dostaje własny.
  retitle(section(engine, "klient"), "Portal klienta w procesie")
    .replace('<section id="klient">', '<section id="proces-portal">'),
  section(engine, "rozgalezienia"),
  dropFigure(section(engine, "mapowanie"), "__IMG_05__").replace(
    "<h3>Powiązanie z typami obiektów</h3>",
    '<h3>Powiązanie z typami obiektów</h3>\n      <p>Kreator typu obiektu pokazuje część o <a href="#konfiguracja">Konfiguracji</a>.</p>',
  ),
  section(engine, "typy-wezlow"),
  section(engine, "slowniki"),
];

// Część III — praktyka. Ograniczenia z obu dokumentów w jednym miejscu.
const lukiManual = section(manual, "luki");
const ogranEngine = section(engine, "ograniczenia");
const listaProcesowa = ogranEngine.slice(ogranEngine.indexOf("<h3>Pozostałe uwagi</h3>"), ogranEngine.indexOf("</section>"));
const autoryzacja = ogranEngine.slice(ogranEngine.indexOf('<div class="note warn">'), ogranEngine.indexOf("<h3>Pozostałe uwagi</h3>"));

const luki = lukiManual
  .replace("</section>", `      <h3>Ograniczenia silnika procesów</h3>\n${listaProcesowa}\n${autoryzacja}\n    </section>`);

const czescIII = [luki, section(engine, "przyklad")];

// ── numeracja i spis treści ───────────────────────────────────────────────
const grupy = [
  ["Panel organizatora", czescI],
  ["Silnik procesów", czescII],
  ["Praktyka", czescIII],
];

let n = 0;
const toc = [];
const body = [];

for (const [nazwa, sekcje] of grupy) {
  toc.push(`    <p>${nazwa}</p>`);
  for (let s of sekcje) {
    n++;
    const num = String(n).padStart(2, "0");
    s = s.replace(/<span class="num">\d+<\/span>/, `<span class="num">${num}</span>`);
    const id = /<section id="([^"]+)"/.exec(s)[1];
    const tytul = /<h2>.*?<\/span>([\s\S]*?)<\/h2>/.exec(s)[1]
      .replace(/<[^>]+>/g, "").trim();
    toc.push(`    <a href="#${id}"><b>${num}</b>${tytul}</a>`);
    body.push(`    <!-- ${num} -->\n${s}`);
  }
}

// ── złożenie dokumentu ────────────────────────────────────────────────────
let out = manual;
out = out.replace("</style>", `\n  /* ——— komponenty z dokumentacji silnika procesów ——— */\n${engineComponents}\n</style>`);
out = out.replace(/<nav class="toc">[\s\S]*?<\/nav>/, `<nav class="toc">\n    <p>Spis treści</p>\n${toc.join("\n")}\n  </nav>`);
out = out.replace(/<main>[\s\S]*<\/main>/, `<main>\n\n${body.join("\n\n")}\n\n  </main>`);

// Odsyłacz do osobnego dokumentu nie ma już sensu — wszystko jest tutaj.
out = out.replace(
  /<div class="note">\s*<span class="lbl">Pełna dokumentacja silnika<\/span>[\s\S]*?<\/div>/,
  "",
);

// Po scaleniu część kotwic zmieniła nazwę: sekcja „Procesy” z podręcznika
// ustąpiła miejsca części o silniku, a „Ograniczenia” wtopiły się w „luki”.
out = out.replace(/href="#procesy"/g, 'href="#przeglad"');
out = out.replace(/href="#ograniczenia"/g, 'href="#luki"');

// Walidacja: żaden odsyłacz wewnętrzny nie może wskazywać na nieistniejącą sekcję.
{
  const ids = new Set([...out.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]));
  const zepsute = [...new Set([...out.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))]
    .filter((a) => !ids.has(a));
  if (zepsute.length) {
    console.error(`[manual] zepsute odsyłacze: ${zepsute.join(", ")}`);
    process.exit(1);
  }
}

out = out.replace(
  "<p class=\"standfirst\">",
  "<p class=\"standfirst\">",
).replace(
  /Przejście przez każdą zakładkę panelu i przez pełną ścieżkę obsługi —[\s\S]*?Wszystkie zrzuty pochodzą z działającego środowiska demo\./,
  "Przejście przez każdą zakładkę panelu, pełną ścieżkę obsługi od zapytania po rozliczenie oraz silnik procesów, który tę ścieżkę prowadzi. Wszystkie zrzuty pochodzą z działającego środowiska demo.",
);

writeFileSync(OUT, out, "utf8");
console.log(`[manual] złożono ${n} sekcji → ${OUT}`);
console.log(`[manual] część I: ${czescI.length} · część II: ${czescII.length} · część III: ${czescIII.length}`);
