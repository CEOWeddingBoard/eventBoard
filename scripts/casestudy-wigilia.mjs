/**
 * Buduje w koncie demo proces „Obsługa wigilii" (case study) i zapisuje zrzuty
 * każdego etapu do docs/screens/cs-*.png. Nie zmienia aplikacji — używa jej
 * jak użytkownik, żeby przewodnik pokazywał realne ekrany.
 *
 *   node scripts/casestudy-wigilia.mjs [baseUrl] [outDir]
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.argv[2] ?? "https://develop-weddingboarddev.up.railway.app";
const OUT = path.resolve(process.argv[3] ?? path.join(process.cwd(), "docs", "screens"));

const log = (m) => console.log(`[cs] ${m}`);
const pause = (p, ms) => p.waitForTimeout(ms);

const HELPERS = `
window.__setInput = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); };
window.__setSel   = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('change',{bubbles:true})); };
window.__setTA    = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); };
window.__btn = (re, root=document) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent));
window.__cards = () => [...document.querySelectorAll('button')]
  .filter(b => b.textContent.trim() === 'Podstawowe')
  .map(b => { let c=b; for (let k=0;k<10&&c;k++){ c=c.parentElement; if (c && /^\\d+\\s/.test(c.innerText.trim())) return c; } return null; })
  .filter(Boolean);
`;

// name, nodeType, actionType, assigneeRole
const NODES = [
  ["Wybór menu i liczba osób", "DECISION", "MENU_SELECTION", "CLIENT"],
  ["Alergie i diety", "ACTION", "CLIENT_FORM", "CLIENT"],
  ["Napoje", "ACTION", "CLIENT_FORM", "CLIENT"],
  ["Godzina rozpoczęcia", "ACTION", "CLIENT_FORM", "CLIENT"],
  ["Godzina zakończenia", "ACTION", "CLIENT_FORM", "CLIENT"],
  ["Informacja o zaliczce", "ACTION", "SEND_MESSAGE", "MANAGER"],
  ["Informacja o płatności", "ACTION", "PAYMENT", "MANAGER"],
  ["Akceptacja menu — kuchnia", "ACTION", "APPROVAL", "CHEF"],
  ["Akceptacja menu — kelner", "ACTION", "APPROVAL", "WAITER"],
  ["Akceptacja napojów — kelner", "ACTION", "APPROVAL", "WAITER"],
  ["Akceptacja napojów — barman", "ACTION", "APPROVAL", "BARTENDER"],
  ["Akceptacja płatności — manager", "ACTION", "APPROVAL", "MANAGER"],
  ["Akceptacja harmonogramu", "END", "AGENDA", "BOTH"],
];

async function shot(page, name) {
  await pause(page, 900);
  await page.screenshot({ path: path.join(OUT, `cs-${name}.png`), fullPage: true });
  log(`📷 ${name}`);
}

async function shotEl(page, name, selector) {
  const el = page.locator(selector).first();
  if (await el.count()) {
    await el.scrollIntoViewIfNeeded();
    await pause(page, 400);
    await el.screenshot({ path: path.join(OUT, `cs-${name}.png`) });
    log(`📷 ${name}`);
  } else {
    await shot(page, name);
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "pl-PL" });
  const page = await ctx.newPage();
  await page.addInitScript(HELPERS);

  log("logowanie do konta demo…");
  await page.goto(`${BASE}/pl/auth`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /kontem testowym/i }).click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 60000 });

  // ── proces ────────────────────────────────────────────────────────────────
  log("budowa procesu…");
  await page.goto(`${BASE}/pl/app/settings/workflows/new`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__setInput(window.__inp?.(/Proces obsługi wesela/) ?? [...document.querySelectorAll("input")].find((i) => /Proces obsługi wesela/.test(i.placeholder)), "Obsługa wigilii");
    const t = [...document.querySelectorAll("input")].find((i) => /WEDDING, CORPORATE/.test(i.placeholder));
    if (t) window.__setInput(t, "CHRISTMAS_EVE");
    const ta = [...document.querySelectorAll("textarea")].find((x) => /Krótki opis/.test(x.placeholder));
    if (ta) window.__setTA(ta, "Kolacja wigilijna: menu, napoje, godziny od klienta; akceptacje kuchni, obsługi i managera.");
  });

  // pierwszy krok istnieje; dodaj resztę
  for (let i = 1; i < NODES.length; i++) {
    await page.evaluate(() => window.__btn(/Dodaj krok/).click());
    await pause(page, 150);
  }
  await page.evaluate((nodes) => {
    const names = [...document.querySelectorAll('input[placeholder="np. Wybór menu przez klienta"]')];
    names.forEach((inp, i) => {
      let card = inp;
      for (let k = 0; k < 8 && card && card.querySelectorAll("select").length < 3; k++) card = card.parentElement;
      const sels = [...card.querySelectorAll("select")];
      const [name, nodeType, actionType, role] = nodes[i];
      window.__setInput(inp, name);
      window.__setSel(sels[0], nodeType);
      window.__setSel(sels[1], actionType);
      window.__setSel(sels[2], role);
    });
  }, NODES);

  // Zrzut 1: nagłówek + nawigator kroków (góra strony)
  await page.evaluate(() => window.scrollTo(0, 0));
  await shotEl(page, "01-proces-naglowek", "main");

  // Zrzut 2: pojedynczy krok z widocznymi listami Typ/Akcja/Wykonuje (krok 8 — Kucharz)
  await page.evaluate(() => {
    const inp = [...document.querySelectorAll('input[placeholder="np. Wybór menu przez klienta"]')].find((i) => i.value === "Akceptacja menu — kuchnia");
    inp?.scrollIntoView({ block: "center" });
  });
  await pause(page, 500);
  await page.screenshot({ path: path.join(OUT, "cs-02-krok-akcja.png") });
  log("📷 02-krok-akcja");

  // Zapis, żeby węzły dostały ID (potrzebne do mapowania na cele)
  await page.evaluate(() => window.__btn(/Zapisz proces/).click());
  await page.waitForURL(/\/workflows\/[a-z0-9]{20,}/, { timeout: 60000 });
  await pause(page, 2500);
  const workflowUrl = page.url();

  // ── mapowanie pól na kroku „Wybór menu" ────────────────────────────────────
  log("mapowanie pól…");
  await page.evaluate(async () => {
    const inp = [...document.querySelectorAll('input[placeholder="np. Wybór menu przez klienta"]')].find((i) => i.value === "Wybór menu i liczba osób");
    let card = inp; for (let k = 0; k < 12 && card; k++) { if ([...card.querySelectorAll("button")].some((b) => /^Mapowanie/.test(b.textContent))) break; card = card.parentElement; }
    [...card.querySelectorAll("button")].find((b) => /^Mapowanie/.test(b.textContent)).click();
    await new Promise((r) => setTimeout(r, 400));
    const add = [...card.querySelectorAll("button")].find((b) => /Dodaj mapowanie|Odkładaj notatkę/.test(b.textContent));
    add?.click();
    await new Promise((r) => setTimeout(r, 400));
    const sels = [...card.querySelectorAll("select")];
    if (sels[0]) window.__setSel(sels[0], "selectedVariantLabel");
    if (sels[1]) window.__setSel(sels[1], "agenda.menu");
    inp?.scrollIntoView({ block: "center" });
  });
  await pause(page, 800);
  await page.screenshot({ path: path.join(OUT, "cs-03-mapowanie.png") });
  log("📷 03-mapowanie");

  // ── lista procesów ─────────────────────────────────────────────────────────
  await page.goto(`${BASE}/pl/app/settings/workflows`, { waitUntil: "networkidle" });
  await shotEl(page, "04-lista-procesow", "main");

  // ── przypisanie procesu ─────────────────────────────────────────────────────
  await page.goto(`${BASE}/pl/app/settings/configuration`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const h = [...document.querySelectorAll("*")].find((e) => /Przypisz proces do eventów/.test(e.textContent ?? "") && e.children.length < 6);
    h?.scrollIntoView({ block: "center" });
  });
  await shotEl(page, "05-przypisanie", "main");

  // ── panel procesu na evencie (wesele z seeda już ma proces w toku) ──────────
  await page.goto(`${BASE}/pl/app/events`, { waitUntil: "networkidle" });
  const eventHref = await page.evaluate(() => {
    const linki = [...document.querySelectorAll("a")].filter((a) => /\/events\/[a-z0-9]{20,}/.test(a.getAttribute("href") ?? ""));
    for (const a of linki) {
      let box = a;
      while (box.parentElement) { const p = box.parentElement; if ([...p.querySelectorAll("a")].filter((x) => /\/events\/[a-z0-9]{20,}/.test(x.getAttribute("href") ?? "")).length > 1) break; box = p; }
      if (/Wesele Ani i Tomka/.test(box.innerText ?? "")) return a.getAttribute("href");
    }
    return linki[0]?.getAttribute("href");
  });
  if (eventHref) {
    await page.goto(`${BASE}${eventHref}`, { waitUntil: "networkidle" });
    await pause(page, 1500);
    await page.evaluate(() => {
      const h = [...document.querySelectorAll("*")].reverse().find((e) => /Krok \d+ z \d+/.test(e.textContent ?? "") && e.children.length < 6);
      let c = h; for (let k = 0; k < 10 && c?.parentElement; k++) { c = c.parentElement; const cl = typeof c.className === "string" ? c.className : ""; if (/rounded/.test(cl) && c.getBoundingClientRect().height > 200) break; }
      c?.setAttribute("data-shot", "1"); c?.scrollIntoView({ block: "center" });
    });
    await pause(page, 700);
    const el = page.locator('[data-shot="1"]').first();
    if (await el.count()) { await el.screenshot({ path: path.join(OUT, "cs-06-panel-procesu.png") }); log("📷 06-panel-procesu"); }
  }

  // ── szablon dokumentu / generowanie ─────────────────────────────────────────
  await page.goto(`${BASE}/pl/app/settings/document-templates/new`, { waitUntil: "networkidle" });
  await pause(page, 1500);
  await shotEl(page, "07-szablon-dokumentu", "main");

  console.log("");
  log(`gotowe — proces: ${workflowUrl}`);
  log(`zrzuty: ${OUT}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
