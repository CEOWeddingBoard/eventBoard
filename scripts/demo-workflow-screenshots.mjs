/**
 * Generator środowiska demo + zrzutów ekranu procesu obsługi.
 *
 * Loguje się przyciskiem „Wejdź kontem testowym” (bez podawania danych
 * logowania — akcja tworzy świeżą organizację), odtwarza kompletny przykład
 * i zapisuje zrzuty użyte w dokumentacji.
 *
 *   node scripts/demo-workflow-screenshots.mjs [baseUrl] [outDir]
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.argv[2] ?? "https://develop-weddingboarddev.up.railway.app";
const OUT = process.argv[3] ?? path.join(process.cwd(), "docs", "screens");

const log = (m) => console.log(`[demo] ${m}`);

/** Natywne settery — React nie zauważa zwykłego przypisania do .value. */
const HELPERS = `
window.__setInput = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); };
window.__setSel   = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('change',{bubbles:true})); };
window.__setTA    = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); };
window.__cards = () => [...document.querySelectorAll('button')]
  .filter(b => b.textContent.trim() === 'Podstawowe')
  .map(b => { let c=b; for (let k=0;k<10&&c;k++){ c=c.parentElement; if (c && /^\\d+\\s/.test(c.innerText.trim())) return c; } return null; })
  .filter(Boolean);
window.__btn = (re, root=document) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent));
`;

const NODES = [
  { n: "Zapytanie przyjęte",    t: "ACTION",   a: "NONE",           r: "MANAGER", d: "Rejestracja zapytania od pary i wstępna kwalifikacja terminu." },
  { n: "Oferta wysłana",        t: "ACTION",   a: "DOCUMENT",       r: "MANAGER", d: "Przygotowanie i wysyłka oferty cenowej wraz z opisem sali." },
  { n: "Wybór menu przez parę", t: "DECISION", a: "MENU_SELECTION", r: "CLIENT",  d: "Para wybiera wariant menu w portalu klienta. Wybór rozgałęzia proces." },
  { n: "Akceptacja kuchni",     t: "ACTION",   a: "APPROVAL",       r: "CHEF",    d: "Szef kuchni potwierdza wykonalność wybranego menu dla podanej liczby gości." },
  { n: "Zadatek",               t: "ACTION",   a: "PAYMENT",        r: "CLIENT",  d: "Wpłata zadatku potwierdzająca rezerwację terminu." },
  { n: "Agenda zatwierdzona",   t: "END",      a: "AGENDA",         r: "BOTH",    d: "Domknięcie harmonogramu dnia i akceptacja przez obie strony." },
];

async function shoot(page, name, opts = {}) {
  await page.waitForTimeout(900);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  log(`zrzut → ${name}.png`);
}

/**
 * Zrzut sekcji zamiast wycinka po współrzędnych — kadr po pikselach rozjeżdża
 * się przy każdej zmianie długości strony.
 */
async function shootSection(page, name, textRe) {
  const marked = await page.evaluate((src) => {
    const re = new RegExp(src);
    const hit = [...document.querySelectorAll("h2, h3, p, div, span")]
      .reverse()
      .find((e) => re.test(e.textContent ?? "") && e.children.length < 6);
    if (!hit) return false;
    let c = hit;
    for (let k = 0; k < 10 && c?.parentElement; k++) {
      c = c.parentElement;
      const cls = typeof c.className === "string" ? c.className : "";
      if (/rounded/.test(cls) && c.getBoundingClientRect().height > 220) break;
    }
    c.setAttribute("data-shot", "1");
    c.scrollIntoView({ block: "center" });
    return true;
  }, textRe.source);

  await page.waitForTimeout(700);
  const file = path.join(OUT, `${name}.png`);
  if (marked) {
    await page.locator('[data-shot="1"]').first().screenshot({ path: file });
    await page.evaluate(() => document.querySelectorAll('[data-shot]').forEach((e) => e.removeAttribute("data-shot")));
  } else {
    await page.screenshot({ path: file });
  }
  log(`zrzut → ${name}.png`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: "pl-PL",
  });
  const page = await ctx.newPage();
  await page.addInitScript(HELPERS);

  // ── logowanie kontem testowym ────────────────────────────────────────────
  log("logowanie kontem testowym…");
  await page.goto(`${BASE}/pl/auth`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /kontem testowym/i }).click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 45000 });
  log("zalogowano");

  // ── seed kategorii systemowych ───────────────────────────────────────────
  await page.goto(`${BASE}/pl/app/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // ── proces: 6 węzłów ─────────────────────────────────────────────────────
  log("tworzenie procesu…");
  await page.goto(`${BASE}/pl/app/settings/workflows/new`, { waitUntil: "networkidle" });

  await page.evaluate(({ nodes }) => {
    const ins = [...document.querySelectorAll("input")];
    window.__setInput(ins.find((i) => /Proces obsługi wesela/.test(i.placeholder)), "Obsługa wesela");
    window.__setInput(ins.find((i) => /WEDDING, CORPORATE/.test(i.placeholder)), "WEDDING");
    const ta = [...document.querySelectorAll("textarea")].find((t) => /Krótki opis/.test(t.placeholder));
    if (ta) window.__setTA(ta, "Pełna ścieżka od zapytania do zatwierdzonej agendy, z rozgałęzieniem na wybór menu.");
    void nodes;
  }, { nodes: NODES });

  for (let i = 1; i < NODES.length; i++) {
    await page.evaluate(() => window.__btn(/Dodaj krok/).click());
    await page.waitForTimeout(200);
  }

  await page.evaluate(({ nodes }) => {
    const names = [...document.querySelectorAll('input[placeholder="np. Wybór menu przez klienta"]')];
    names.forEach((inp, i) => {
      let card = inp;
      for (let k = 0; k < 8 && card && card.querySelectorAll("select").length < 3; k++) card = card.parentElement;
      const sels = [...card.querySelectorAll("select")];
      const ta = card.querySelector('textarea[placeholder="Co powinno się wydarzyć w tym kroku?"]');
      const p = nodes[i];
      window.__setInput(inp, p.n);
      window.__setSel(sels[0], p.t);
      window.__setSel(sels[1], p.a);
      window.__setSel(sels[2], p.r);
      if (ta) window.__setTA(ta, p.d);
    });
  }, { nodes: NODES });

  // pierwszy zapis nadaje węzłom identyfikatory
  await page.evaluate(() => window.__btn(/Zapisz proces/).click());
  await page.waitForURL(/\/workflows\/[a-z0-9]{20,}/, { timeout: 45000 });
  await page.waitForTimeout(2500);
  const workflowUrl = page.url();

  // ── warunki na węźle decyzyjnym + mapowania na węźle agendy ──────────────
  log("warunki i mapowanie pól…");
  const ids = await page.evaluate(() => {
    const sel = [...window.__cards()[0].querySelectorAll("select")]
      .find((s) => [...s.options].some((o) => /^cm/.test(o.value)));
    return [...sel.options].map((o) => o.value).filter(Boolean);
  });

  await page.evaluate(async (ids) => {
    const c = window.__cards()[2];
    window.__btn(/^Warunki/, c).click();
    await new Promise((r) => setTimeout(r, 400));
    const add = window.__btn(/Dodaj warunek/, c);
    add.click(); await new Promise((r) => setTimeout(r, 250));
    add.click(); await new Promise((r) => setTimeout(r, 400));

    const lab = [...c.querySelectorAll('input[placeholder="Etykieta (np. Menu A)"]')];
    const val = [...c.querySelectorAll('input[placeholder="Wartość (opcjonalna)"]')];
    const nxt = [...c.querySelectorAll('input[placeholder="nextNodeId"]')];
    const sels = [...c.querySelectorAll("select")];

    window.__setInput(lab[0], "Menu A — klasyczne");
    window.__setSel(sels[0], "client_choice");
    window.__setInput(val[0], "Menu A — klasyczne");
    window.__setInput(nxt[0], ids[3]);            // → Akceptacja kuchni

    window.__setInput(lab[1], "Menu B — wegetariańskie");
    window.__setSel(sels[1], "client_choice");
    window.__setInput(val[1], "Menu B — wegetariańskie");
    window.__setInput(nxt[1], ids[4]);            // → Zadatek (pomija kuchnię)
  }, ids);

  await page.evaluate(async () => {
    const c = window.__cards()[5];
    window.__btn(/^Mapowanie/, c).click();
    await new Promise((r) => setTimeout(r, 400));
    const add = window.__btn(/Dodaj mapowanie/, c);
    add.click(); await new Promise((r) => setTimeout(r, 250));
    add.click(); await new Promise((r) => setTimeout(r, 400));

    const src = [...c.querySelectorAll('input[placeholder="Pole źródłowe (np. step.selectedMenu)"]')];
    const tgt = [...c.querySelectorAll('input[placeholder="Pole agendy (np. event.menuVariants)"]')];
    const sels = [...c.querySelectorAll("select")];
    window.__setInput(src[0], "selectedVariantLabel"); window.__setInput(tgt[0], "agenda.menu");          window.__setSel(sels[0], "none");
    window.__setInput(src[1], "note");                 window.__setInput(tgt[1], "agenda.uwagiFinalne");  window.__setSel(sels[1], "join_newline");
  });

  await page.evaluate(() => window.__btn(/Zapisz proces/).click());
  await page.waitForTimeout(4000);

  // ZRZUT 1 — edytor procesu
  await page.goto(workflowUrl, { waitUntil: "networkidle" });
  await shoot(page, "01-edytor-procesu", { fullPage: true });

  // ZRZUT 2 — lista procesów
  await page.goto(`${BASE}/pl/app/settings/workflows`, { waitUntil: "networkidle" });
  await shoot(page, "02-lista-procesow");

  // ── event + warianty menu ────────────────────────────────────────────────
  log("tworzenie eventu…");
  await page.goto(`${BASE}/pl/app/events`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.__btn(/Nowy event/).click());
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const d = document.querySelector("[role=dialog]");
    const sel = d.querySelector("select");
    const wedding = [...sel.options].find((o) => /Wesele/.test(o.textContent));
    const ins = [...d.querySelectorAll("input")];
    window.__setSel(sel, wedding.value);
    window.__setInput(ins[0], "Wesele Ani i Tomka");
    window.__setInput(ins[1], "2026-08-22");
    window.__setInput(ins[2], "120");
    if (!ins[3].checked) ins[3].click();
  });
  await page.evaluate(() => {
    const d = document.querySelector("[role=dialog]");
    [...d.querySelectorAll("button")].find((b) => b.textContent.trim() === "Utwórz").click();
  });
  await page.waitForTimeout(3500);

  const eventUrl = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].map((x) => x.getAttribute("href"))
      .find((h) => h && /\/events\/[a-z0-9]{20,}/.test(h));
    return a;
  });
  await page.goto(`${BASE}${eventUrl}`, { waitUntil: "networkidle" });

  log("warianty menu…");
  for (const label of ["Menu A — klasyczne", "Menu B — wegetariańskie"]) {
    await page.evaluate((label) => {
      const inp = [...document.querySelectorAll("input")].find((i) => /MENU A, MENU B/.test(i.placeholder));
      let box = inp; for (let k = 0; k < 6 && box; k++) { box = box.parentElement; if (box.querySelector("button")) break; }
      window.__setInput(inp, label);
      [...box.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dodaj wariant").click();
    }, label);
    await page.waitForTimeout(2500);
  }

  // ── uruchomienie procesu i dwa kroki do przodu ───────────────────────────
  log("uruchamianie procesu…");
  await page.goto(`${BASE}${eventUrl}`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.__btn(/Wybierz proces/)?.click());
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__btn(/Rozpocznij proces/).click());
  await page.waitForTimeout(4500);

  for (let i = 0; i < 2; i++) {
    await page.goto(`${BASE}${eventUrl}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.__btn(/Przejdź do następnego kroku/)?.click());
    await page.waitForTimeout(4500);
  }

  // ZRZUT 3 — panel procesu na karcie eventu
  await page.goto(`${BASE}${eventUrl}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await shootSection(page, "03-panel-procesu", /Krok \d+ z \d+/);

  // ZRZUT 4 — pulpit widgetów
  await shootSection(page, "04-pulpit-widgetow", /Pulpit eventu/);

  // ZRZUT 5 — konfiguracja: typy obiektów
  await page.goto(`${BASE}/pl/app/settings/configuration`, { waitUntil: "networkidle" });
  await shoot(page, "05-typy-obiektow", { fullPage: true });

  log(`gotowe — zrzuty w ${OUT}`);
  log(`event: ${BASE}${eventUrl}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
