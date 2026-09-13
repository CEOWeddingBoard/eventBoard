/**
 * Zakłada kompletne środowisko demo EventBoard.
 *
 * Loguje się przyciskiem „Wejdź kontem testowym” — akcja zakłada świeżą
 * organizację, więc nie podaje się żadnych danych logowania — a następnie
 * wypełnia wszystkie zakładki panelu, żeby żadna nie była pusta na zrzutach:
 *
 *   Ustawienia    kategorie systemowe (seed przy pierwszym wejściu)
 *   Konfiguracja  własny typ obiektu przypięty do kartotek i procesu
 *   Procesy       „Obsługa wesela” — 6 kroków, rozgałęzienie, mapowanie pól
 *   Eventy        4 eventy: wesele, komunia, firmowy, wigilia
 *   Event         warianty menu, dania, harmonogram dnia, zadania, widgety
 *   Finanse       zadatek opłacony + rata i dopłata do zapłaty
 *   Kalendarz     blokady terminów
 *   Zapytania     leady z publicznego profilu organizatora
 *   Proces        uruchomiony i przesunięty na węzeł decyzyjny
 *
 *   node scripts/seed-demo-org.mjs [baseUrl]
 *
 * Wypisuje na końcu adres organizacji i eventu — użyj ich przy zrzutach.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.argv[2] ?? "https://develop-weddingboarddev.up.railway.app";
/** Katalog zrzutów. Podaj drugi argument, żeby po zasianiu zrobić zdjęcia zakładek. */
const SHOTS = process.argv[3] ? path.resolve(process.argv[3]) : null;

const log = (m) => console.log(`[seed] ${m}`);
const pause = (p, ms) => p.waitForTimeout(ms);

/** Zrzut całej strony po ustabilizowaniu układu. */
async function shot(page, name) {
  await pause(page, 1200);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  log(`  📷 ${name}`);
}

/**
 * Zrzut pojedynczej sekcji. Kadrowanie po pikselach rozjeżdża się przy każdej
 * zmianie długości strony, więc kotwiczymy się na tekście i fotografujemy
 * otaczającą go kartę.
 */
async function shotSection(page, name, textRe) {
  const found = await page.evaluate((src) => {
    const re = new RegExp(src);
    const hit = [...document.querySelectorAll("h2, h3, p, div, span")]
      .reverse()
      .find((e) => re.test(e.textContent ?? "") && e.children.length < 6);
    if (!hit) return false;

    // Wspinamy się, zbierając kandydatów, i wybieramy pierwszy o rozsądnych
    // wymiarach karty. Bez ograniczeń pętla albo zatrzymywała się na wąskim
    // pudełku w środku, albo dochodziła do kontenera całej strony.
    const kandydaci = [];
    let c = hit;
    for (let k = 0; k < 12 && c?.parentElement; k++) {
      c = c.parentElement;
      const r = c.getBoundingClientRect();
      kandydaci.push({ el: c, w: r.width, h: r.height });
    }
    const pasuje = kandydaci.find((x) => x.w >= 700 && x.h >= 200 && x.h <= 1700);
    const zapas = kandydaci.filter((x) => x.h <= 1700).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    const wybrany = (pasuje ?? zapas ?? kandydaci[kandydaci.length - 1]).el;

    wybrany.setAttribute("data-shot", "1");
    wybrany.scrollIntoView({ block: "center" });
    return true;
  }, textRe.source);

  await pause(page, 800);
  const file = path.join(SHOTS, `${name}.png`);
  if (found) {
    await page.locator('[data-shot="1"]').first().screenshot({ path: file });
    await page.evaluate(() => document.querySelectorAll("[data-shot]").forEach((e) => e.removeAttribute("data-shot")));
  } else {
    await page.screenshot({ path: file });
  }
  log(`  📷 ${name}`);
}

const HELPERS = `
window.__setInput = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); };
window.__setSel   = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('change',{bubbles:true})); };
window.__setTA    = (el, v) => { const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set; s.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true})); };
window.__btn = (re, root=document) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent));
window.__inp = (re, root=document) => [...root.querySelectorAll('input')].find(i => re.test(i.placeholder||''));
window.__cards = () => [...document.querySelectorAll('button')]
  .filter(b => b.textContent.trim() === 'Podstawowe')
  .map(b => { let c=b; for (let k=0;k<10&&c;k++){ c=c.parentElement; if (c && /^\\d+\\s/.test(c.innerText.trim())) return c; } return null; })
  .filter(Boolean);
`;

const NODES = [
  { n: "Zapytanie przyjęte",    t: "ACTION",   a: "NONE",           r: "MANAGER", d: "Rejestracja zapytania od pary i wstępna kwalifikacja terminu." },
  { n: "Oferta wysłana",        t: "ACTION",   a: "DOCUMENT",       r: "MANAGER", d: "Przygotowanie i wysyłka oferty cenowej wraz z opisem sali." },
  { n: "Wybór menu przez parę", t: "DECISION", a: "MENU_SELECTION", r: "CLIENT",  d: "Para wybiera wariant menu w portalu klienta. Wybór rozgałęzia proces." },
  { n: "Akceptacja kuchni",     t: "ACTION",   a: "APPROVAL",       r: "CHEF",    d: "Szef kuchni potwierdza wykonalność wybranego menu dla podanej liczby gości." },
  { n: "Zadatek",               t: "ACTION",   a: "PAYMENT",        r: "CLIENT",  d: "Wpłata zadatku potwierdzająca rezerwację terminu." },
  { n: "Agenda zatwierdzona",   t: "END",      a: "AGENDA",         r: "BOTH",    d: "Domknięcie harmonogramu dnia i akceptacja przez obie strony." },
];

const EVENTS = [
  { kategoria: "Wesele",  nazwa: "Wesele Ani i Tomka",       data: "2026-08-22", goscie: 120, wesele: true },
  { kategoria: "Komunia", nazwa: "Komunia Zosi",             data: "2026-05-17", goscie: 45,  wesele: false },
  { kategoria: "Firmowe", nazwa: "Gala roczna Nordwind SA",   data: "2026-11-14", goscie: 180, wesele: false },
  { kategoria: "Wigilia", nazwa: "Wigilia firmowa Alkon",     data: "2026-12-19", goscie: 60,  wesele: false },
];

const LEADY = [
  { name: "Karolina Zawadzka", email: "karolina.z@example.com", phone: "601 202 303", eventDate: "2027-06-12", guestCount: 100, message: "Dzień dobry, szukamy sali na wesele w czerwcu 2027. Czy termin jest wolny i jaka jest cena za osobę?" },
  { name: "Michał Ostrowski",  email: "m.ostrowski@example.com", phone: "512 880 145", eventDate: "2026-10-03", guestCount: 70,  message: "Planujemy chrzciny połączone z obiadem rodzinnym. Proszę o ofertę wraz z menu bezglutenowym." },
  { name: "Biuro Hartman",     email: "eventy@hartman.example", phone: "22 550 11 20", eventDate: "2027-01-24", guestCount: 150, message: "Poszukujemy sali na bankiet noworoczny dla pracowników. Potrzebujemy sceny i nagłośnienia." },
];

const DANIA_A = [
  { nazwa: "Rosół z domowym makaronem", kategoria: "Zupa",        cena: "18" },
  { nazwa: "Polędwiczki w sosie grzybowym", kategoria: "Danie główne", cena: "62" },
  { nazwa: "Tarta cytrynowa", kategoria: "Deser",                 cena: "22" },
];
const DANIA_B = [
  { nazwa: "Krem z pieczonej dyni", kategoria: "Zupa",            cena: "16" },
  { nazwa: "Risotto z borowikami",  kategoria: "Danie główne",    cena: "54" },
  { nazwa: "Panna cotta malinowa",  kategoria: "Deser",           cena: "20" },
];

const HARMONOGRAM = [
  { godz: "15:00", tytul: "Ceremonia w plenerze",  opis: "Ogród różany, 120 krzeseł, nagłośnienie bezprzewodowe." },
  { godz: "16:30", tytul: "Powitanie chlebem i solą", opis: "Wejście pary, toast powitalny na tarasie." },
  { godz: "17:00", tytul: "Obiad — pierwsze danie", opis: "Serwis kelnerski, 12 stołów po 10 osób." },
  { godz: "20:00", tytul: "Tort i pierwszy taniec", opis: "Wyciszenie muzyki, oświetlenie punktowe na parkiet." },
  { godz: "23:30", tytul: "Poczęstunek nocny",      opis: "Bufet ciepły, żurek i bigos." },
];

const ZADANIA = [
  "Potwierdzić liczbę gości na 14 dni przed",
  "Zamówić kwiaty na stoły i łuk ceremonii",
  "Ustalić listę alergenów z kuchnią",
  "Przygotować plan stołów i winietki",
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pl-PL" });
  const page = await ctx.newPage();
  await page.addInitScript(HELPERS);

  // ── konto testowe ────────────────────────────────────────────────────────
  log("zakładam konto testowe…");
  await page.goto(`${BASE}/pl/auth`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /kontem testowym/i }).click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 60000 });

  // ── ustawienia: seed kategorii + nazwa organizacji ───────────────────────
  log("kategorie systemowe…");
  await page.goto(`${BASE}/pl/app/settings`, { waitUntil: "networkidle" });
  await pause(page, 2000);
  const orgSlug = await page.evaluate(() => (document.body.innerText.match(/\/org\/([a-z0-9-]+)/) ?? [])[1]);

  // ── proces obsługi ───────────────────────────────────────────────────────
  log("proces „Obsługa wesela”…");
  await page.goto(`${BASE}/pl/app/settings/workflows/new`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__setInput(window.__inp(/Proces obsługi wesela/), "Obsługa wesela");
    window.__setInput(window.__inp(/WEDDING, CORPORATE/), "WEDDING");
    const ta = [...document.querySelectorAll("textarea")].find((t) => /Krótki opis/.test(t.placeholder));
    if (ta) window.__setTA(ta, "Pełna ścieżka od zapytania do zatwierdzonej agendy, z rozgałęzieniem na wybór menu.");
  });
  for (let i = 1; i < NODES.length; i++) {
    await page.evaluate(() => window.__btn(/Dodaj krok/).click());
    await pause(page, 180);
  }
  await page.evaluate(({ nodes }) => {
    [...document.querySelectorAll('input[placeholder="np. Wybór menu przez klienta"]')].forEach((inp, i) => {
      let card = inp;
      for (let k = 0; k < 8 && card && card.querySelectorAll("select").length < 3; k++) card = card.parentElement;
      const sels = [...card.querySelectorAll("select")];
      const ta = card.querySelector('textarea[placeholder="Co powinno się wydarzyć w tym kroku?"]');
      const p = nodes[i];
      window.__setInput(inp, p.n);
      window.__setSel(sels[0], p.t); window.__setSel(sels[1], p.a); window.__setSel(sels[2], p.r);
      if (ta) window.__setTA(ta, p.d);
    });
  }, { nodes: NODES });

  await page.evaluate(() => window.__btn(/Zapisz proces/).click());
  await page.waitForURL(/\/workflows\/[a-z0-9]{20,}/, { timeout: 60000 });
  await pause(page, 2500);
  const workflowUrl = page.url();

  log("rozgałęzienie i mapowanie pól…");
  const nodeIds = await page.evaluate(() => {
    const sel = [...window.__cards()[0].querySelectorAll("select")]
      .find((s) => [...s.options].some((o) => o.value && /^c/.test(o.value)));
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
    const sels = [...c.querySelectorAll("select")];
    const targets = sels.filter((s) => [...s.options].some((o) => /dokąd prowadzi/.test(o.textContent)));

    window.__setInput(lab[0], "Menu A — klasyczne");
    window.__setSel(sels.find((s) => [...s.options].some((o) => o.value === "client_choice")), "client_choice");
    window.__setInput(val[0], "Menu A — klasyczne");
    window.__setSel(targets[0], ids[3]);

    window.__setInput(lab[1], "Menu B — wegetariańskie");
    const typeSels = sels.filter((s) => [...s.options].some((o) => o.value === "client_choice"));
    window.__setSel(typeSels[1], "client_choice");
    window.__setInput(val[1], "Menu B — wegetariańskie");
    window.__setSel(targets[1], ids[4]);
  }, nodeIds);

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
    window.__setInput(src[0], "selectedVariantLabel"); window.__setInput(tgt[0], "agenda.menu");         window.__setSel(sels[0], "none");
    window.__setInput(src[1], "note");                 window.__setInput(tgt[1], "agenda.uwagiFinalne"); window.__setSel(sels[1], "join_newline");
  });
  await page.evaluate(() => window.__btn(/Zapisz proces/).click());
  await pause(page, 4000);

  // ── własny typ obiektu ───────────────────────────────────────────────────
  log("własny typ obiektu…");
  await page.goto(`${BASE}/pl/app/settings/configuration`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__setInput(window.__inp(/Nazwa obiektu/), "Kontakt do pary");
    const ta = [...document.querySelectorAll("textarea")].find((t) => /Opis obiektu/.test(t.placeholder));
    if (ta) window.__setTA(ta, "Dane kontaktowe i preferencje pary młodej zbierane na etapie oferty.");
    // kartoteki: Karta eventu (już zaznaczona) + Portal klienta + Dokumenty
    [...document.querySelectorAll("button")]
      .filter((b) => /Portal klienta|Dokumenty/.test(b.textContent) && /Widoczne dla pary|Umowy i wydruki/.test(b.textContent))
      .forEach((b) => b.click());
  });
  await pause(page, 400);
  await page.evaluate(() => {
    const sel = [...document.querySelectorAll("select")].find((s) => [...s.options].some((o) => /Bez powiązania/.test(o.textContent)));
    const wf = [...sel.options].find((o) => /Obsługa wesela/.test(o.textContent));
    if (wf) window.__setSel(sel, wf.value);
    ["Tekst", "Tekst", "Data"].forEach((t) => window.__btn(new RegExp(`^${t}$`))?.click());
  });
  await pause(page, 500);
  await page.evaluate(() => {
    const pola = [...document.querySelectorAll('input[placeholder="Nazwa pola"]')];
    ["Imiona pary", "Telefon kontaktowy", "Termin degustacji"].forEach((v, i) => pola[i] && window.__setInput(pola[i], v));
  });
  await page.evaluate(() => window.__btn(/Zapisz typ obiektu/).click());
  await pause(page, 3500);

  // ── szablon dokumentu (agenda na kartce A4) ──────────────────────────────
  log("szablon dokumentu…");
  try {
    await page.goto(`${BASE}/pl/app/settings/document-templates/new`, { waitUntil: "networkidle" });
    await pause(page, 1500);
    await page.evaluate(() => {
      window.__setInput(window.__inp(/Nazwa szablonu/), "Agenda imprezy — A4");
      window.__setInput(window.__inp(/Opis szablonu/), "Jednostronicowa agenda dla obsługi sali.");
    });

    // Bloki i pola przeciąga się myszą (HTML5 drag&drop), więc korzystamy
    // z dragTo — ręczne dispatchowanie zdarzeń nie niesie dataTransfer.
    for (const blok of ["Nagłówek", "Sekcja", "Tabela"]) {
      const zrodlo = page.locator(`text=${blok}`).first();
      const cel = page.locator('[class*="bg-white"][class*="shadow"]').first();
      await zrodlo.dragTo(cel).catch(() => log(`  ! nie udało się przeciągnąć bloku ${blok}`));
      await pause(page, 700);
    }

    await page.evaluate(() => window.__btn(/^Zapisz$/)?.click());
    await pause(page, 3000);
  } catch (e) {
    log(`  ! szablon dokumentu pominięty: ${e.message}`);
  }

  // ── eventy ───────────────────────────────────────────────────────────────
  log("eventy…");
  for (const ev of EVENTS) {
    await page.goto(`${BASE}/pl/app/events`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.__btn(/Nowy event/).click());
    await pause(page, 1200);
    await page.evaluate((ev) => {
      const d = document.querySelector("[role=dialog]");
      const sel = d.querySelector("select");
      const kat = [...sel.options].find((o) => o.textContent.trim() === ev.kategoria);
      const ins = [...d.querySelectorAll("input")];
      if (kat) window.__setSel(sel, kat.value);
      window.__setInput(ins[0], ev.nazwa);
      window.__setInput(ins[1], ev.data);
      window.__setInput(ins[2], String(ev.goscie));
      if (ev.wesele && !ins[3].checked) ins[3].click();
    }, ev);
    await page.evaluate(() => {
      const d = document.querySelector("[role=dialog]");
      [...d.querySelectorAll("button")].find((b) => b.textContent.trim() === "Utwórz").click();
    });
    await pause(page, 3000);
    log(`  · ${ev.nazwa}`);
  }

  // event wiodący = wesele
  await page.goto(`${BASE}/pl/app/events`, { waitUntil: "networkidle" });
  // Wesele musi być wybrane jednoznacznie — to jedyny event z portalem pary,
  // a `a.closest("*")` zwracało sam odsyłacz, więc dopasowanie po nazwie
  // zawodziło i dane lądowały na przypadkowym evencie.
  const eventPath = await page.evaluate(() => {
    const czyEvent = (a) => /\/events\/[a-z0-9]{20,}/.test(a.getAttribute("href") ?? "");
    const linki = [...document.querySelectorAll("a")].filter(czyEvent);
    for (const a of linki) {
      // Wspinamy się tylko dopóki kontener opisuje JEDEN event. Bez tego
      // warunku dochodziliśmy do listy wszystkich eventów, której tekst
      // zawiera nazwę wesela — i każdy odsyłacz „pasował”.
      let box = a;
      while (box.parentElement) {
        const rodzic = box.parentElement;
        if ([...rodzic.querySelectorAll("a")].filter(czyEvent).length > 1) break;
        box = rodzic;
      }
      if (/Wesele Ani i Tomka/.test(box.innerText ?? "")) return a.getAttribute("href");
    }
    return null;
  });
  if (!eventPath) throw new Error("nie znaleziono eventu wiodącego");
  const eventUrl = `${BASE}${eventPath}`;

  // ── menu, harmonogram, zadania, płatności ────────────────────────────────
  log("warianty menu i dania…");
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  for (const label of ["Menu A — klasyczne", "Menu B — wegetariańskie"]) {
    await page.evaluate((label) => {
      const inp = window.__inp(/MENU A, MENU B/);
      let box = inp; for (let k = 0; k < 6 && box; k++) { box = box.parentElement; if (box.querySelector("button")) break; }
      window.__setInput(inp, label);
      [...box.querySelectorAll("button")].find((b) => b.textContent.trim() === "Dodaj wariant").click();
    }, label);
    await pause(page, 2500);
  }

  await page.goto(eventUrl, { waitUntil: "networkidle" });
  for (const [wi, dania] of [DANIA_A, DANIA_B].entries()) {
    for (const danie of dania) {
      await page.evaluate(({ wi, danie }) => {
        const naglowki = [...document.querySelectorAll("*")].filter((e) => /^Menu [AB] — /.test(e.textContent?.trim() ?? "") && e.children.length === 0);
        let box = naglowki[wi];
        for (let k = 0; k < 8 && box; k++) { box = box.parentElement; if (window.__btn(/Dodaj danie/, box)) break; }
        window.__btn(/Dodaj danie/, box).click();
      }, { wi, danie });
      await pause(page, 1400);
      await page.evaluate(({ danie }) => {
        const puste = [...document.querySelectorAll('input[placeholder*="anie"], input[placeholder*="azwa"]')].filter((i) => !i.value);
        if (puste[0]) window.__setInput(puste[0], danie.nazwa);
      }, { danie });
      await pause(page, 900);
    }
  }

  log("harmonogram dnia…");
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  for (const p of HARMONOGRAM) {
    await page.evaluate(() => window.__btn(/Dodaj punkt/)?.click());
    await pause(page, 1300);
    await page.evaluate((p) => {
      const czas = [...document.querySelectorAll('input[type="time"], input[placeholder*="HH"]')].filter((i) => !i.value);
      const txt = [...document.querySelectorAll('input[type="text"]')].filter((i) => !i.value && /tytu|punkt|nazw|opis/i.test(i.placeholder || ""));
      if (czas[0]) window.__setInput(czas[0], p.godz);
      if (txt[0]) window.__setInput(txt[0], p.tytul);
      if (txt[1]) window.__setInput(txt[1], p.opis);
    }, p);
    await pause(page, 900);
  }

  log("zadania produkcyjne…");
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  for (const z of ZADANIA) {
    await page.evaluate((z) => {
      const inp = [...document.querySelectorAll("input")].find((i) => /zadani|checklist|Dodaj/i.test(i.placeholder || ""));
      if (inp) {
        window.__setInput(inp, z);
        let box = inp; for (let k = 0; k < 6 && box; k++) { box = box.parentElement; if (window.__btn(/^Dodaj$/, box)) break; }
        window.__btn(/^Dodaj$/, box)?.click();
      }
    }, z);
    await pause(page, 1500);
  }

  log("płatności…");
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  const PLATNOSCI = [
    { label: "Zadatek", kwota: "4000", oplacony: true },
    { label: "Rata II", kwota: "8000", oplacony: false },
    { label: "Dopłata końcowa", kwota: "10400", oplacony: false },
  ];
  for (const pl of PLATNOSCI) {
    // Kotwiczymy się na placeholderze pola nazwy — szukanie po nagłówku
    // trafiało w kontener wyżej i wspinaczka wychodziła poza dokument.
    await page.evaluate((pl) => {
      const nazwa = document.querySelector('input[placeholder="Np. Zadatek / Rata 1"]');
      const kwota = document.querySelector('input[placeholder="kwota zł"]');
      if (!nazwa) return;
      window.__setInput(nazwa, pl.label);
      if (kwota) window.__setInput(kwota, pl.kwota);
      let box = nazwa;
      for (let k = 0; k < 6 && box; k++) { box = box.parentElement; if (window.__btn(/^Dodaj$/, box)) break; }
      window.__btn(/^Dodaj$/, box)?.click();
    }, pl);
    await pause(page, 2200);
  }
  // Zadatek oznaczamy jako wpłacony, żeby Finanse pokazywały realny wpływ,
  // a nie same należności. Przycisk nazywa się „Oznacz zapłacone”.
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const wiersz = [...document.querySelectorAll("*")]
      .find((e) => /^Zadatek — /.test(e.textContent?.trim() ?? "") && e.children.length === 0);
    let box = wiersz;
    for (let k = 0; k < 6 && box; k++) { box = box.parentElement; if (window.__btn(/Oznacz zapłacone/, box)) break; }
    window.__btn(/Oznacz zapłacone/, box)?.click();
  });
  await pause(page, 3000);

  // ── widgety pulpitu ──────────────────────────────────────────────────────
  log("widgety pulpitu…");
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  for (const [typ, nazwa, portal] of [
    ["Checklista", "Checklista obsługi sali", false],
    ["Notatka", "Uwagi koordynatora", false],
    ["Scenariusz", "Scenariusz prowadzącego", true],
  ]) {
    await page.evaluate(() => (window.__btn(/Dodaj pierwszy widget/) ?? window.__btn(/Dodaj widget/))?.click());
    await pause(page, 1000);
    // Kafelki w pickerze mają sklejony tytuł z opisem („ChecklistaLista zadań…”),
    // więc dopasowujemy początek etykiety.
    await page.evaluate(({ typ }) => window.__btn(new RegExp(`^${typ}`))?.click(), { typ });
    await pause(page, 900);
    await page.evaluate(({ nazwa, portal }) => {
      const inp = window.__inp(/Checklista obsługi stołów/);
      if (inp) window.__setInput(inp, nazwa);
      if (portal) window.__btn(/Portal klienta/)?.click();
    }, { nazwa, portal });
    await pause(page, 600);
    await page.evaluate(() => window.__btn(/^Dodaj widget$/)?.click());
    await pause(page, 2500);
  }

  // ── blokady terminów ─────────────────────────────────────────────────────
  log("blokady w kalendarzu…");
  for (const blok of [
    { data: "2026-09-19", powod: "Remont sali głównej" },
    { data: "2026-12-31", powod: "Impreza zamknięta — sylwester" },
  ]) {
    await page.goto(`${BASE}/pl/app/calendar`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.__btn(/Blokada/)?.click());
    await pause(page, 1600);
    await page.evaluate((blok) => {
      const d = document.querySelector("[role=dialog]") ?? document;
      const data = d.querySelector('input[type="date"]');
      const powod = d.querySelector('input[placeholder="Np. remont, impreza zamknięta"]');
      if (data) window.__setInput(data, blok.data);
      if (powod) window.__setInput(powod, blok.powod);
      window.__btn(/Zapisz blokadę/, d)?.click();
    }, blok);
    await pause(page, 2500);
  }

  // ── zapytania z publicznego profilu ──────────────────────────────────────
  if (orgSlug) {
    log(`zapytania ofertowe (/org/${orgSlug})…`);
    const anon = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "pl-PL" });
    const pub = await anon.newPage();
    await pub.addInitScript(HELPERS);
    for (const lead of LEADY) {
      await pub.goto(`${BASE}/org/${orgSlug}`, { waitUntil: "networkidle" });
      // Sprawdzamy obecność samego formularza — profil potrafił zwracać
      // zarówno 404 (przepisanie locale), jak i 500 (brak kolumn profilu).
      const maFormularz = await pub.evaluate(() => document.querySelectorAll("input").length > 0);
      if (!maFormularz) {
        log(`  ! publiczny profil nie renderuje formularza (${await pub.title() || "błąd serwera"}) — pomijam zapytania`);
        break;
      }
      await pub.evaluate((lead) => {
        const q = (sel) => document.querySelector(sel);
        window.__setInput(q('input[placeholder="Imię i nazwisko"]'), lead.name);
        window.__setInput(q('input[placeholder="Email"]'), lead.email);
        window.__setInput(q('input[placeholder="Telefon (opcjonalnie)"]'), lead.phone);
        window.__setInput(q('input[placeholder="Preferowana data"]'), lead.eventDate);
        window.__setInput(q('input[placeholder="Liczba gości (opcjonalnie)"]'), String(lead.guestCount));
        window.__setTA(q('textarea[placeholder="Wiadomość (opcjonalnie)"]'), lead.message);
      }, lead);
      await pause(pub, 600);
      await pub.evaluate(() => window.__btn(/Wyślij zapytanie/)?.click());
      await pause(pub, 3000);
      log(`  · ${lead.name}`);
    }
    await anon.close();
  }

  // ── uruchomienie procesu i przesunięcie na węzeł decyzyjny ───────────────
  log("uruchamiam proces na weselu…");
  await page.goto(eventUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.__btn(/Wybierz proces/)?.click());
  await pause(page, 1500);
  await page.evaluate(() => window.__btn(/Rozpocznij proces/)?.click());
  await pause(page, 4500);
  for (let i = 0; i < 2; i++) {
    await page.goto(eventUrl, { waitUntil: "networkidle" });
    await pause(page, 1200);
    await page.evaluate(() => window.__btn(/Przejdź do następnego kroku/)?.click());
    await pause(page, 4500);
  }

  // ── zrzuty zakładek ──────────────────────────────────────────────────────
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    log("zrzuty zakładek…");

    const strony = [
      ["10-dashboard",     `${BASE}/pl/app/dashboard`],
      ["11-kalendarz",     `${BASE}/pl/app/calendar`],
      ["12-eventy",        `${BASE}/pl/app/events`],
      ["13-zapytania",     `${BASE}/pl/app/leads`],
      ["14-finanse",       `${BASE}/pl/app/finances`],
      ["15-zespol",        `${BASE}/pl/app/team`],
      ["16-konfiguracja",  `${BASE}/pl/app/settings/configuration`],
      ["17-ustawienia",    `${BASE}/pl/app/settings`],
      ["18-procesy-lista", `${BASE}/pl/app/settings/workflows`],
      ["19-procesy-edytor", workflowUrl],
    ];
    for (const [name, url] of strony) {
      await page.goto(url, { waitUntil: "networkidle" });
      await shot(page, name);
    }

    // sekcje karty eventu — pełna strona jest za długa, żeby cokolwiek na niej widzieć
    await page.goto(eventUrl, { waitUntil: "networkidle" });
    await shotSection(page, "20-event-proces",      /Krok \d+ z \d+/);
    await shotSection(page, "21-event-menu",        /Warianty menu/);
    await shotSection(page, "22-event-harmonogram", /Harmonogram dnia/);
    await shotSection(page, "23-event-platnosci",   /Płatności klienta/);
    await shotSection(page, "24-event-widgety",     /Pulpit eventu/);
    await shotSection(page, "25-event-zadania",     /Checklista produkcyjna/);
    await shotSection(page, "27-event-akceptacje",  /Akceptacje agendy/);
    await shotSection(page, "28-event-dokumenty",   /Dokumenty eventu/);

    // Kreator agendy otwiera się w oknie modalnym — fotografujemy sam dialog.
    await page.goto(eventUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => window.__btn(/Generuj agendę/)?.click());
    await pause(page, 1800);
    const dialog = page.locator("[role=dialog]").first();
    if (await dialog.count()) {
      await dialog.screenshot({ path: path.join(SHOTS, "29-kreator-agendy.png") });
      log("  📷 29-kreator-agendy");
    }

    // Szablony dokumentów: lista i pusty builder A4.
    await page.goto(`${BASE}/pl/app/settings/document-templates`, { waitUntil: "networkidle" });
    await shot(page, "30-szablony-lista");
    await page.goto(`${BASE}/pl/app/settings/document-templates/new`, { waitUntil: "networkidle" });
    await pause(page, 1500);
    await shot(page, "31-szablon-builder");

    // publiczny profil — widok, który dostaje klient
    const anon2 = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "pl-PL" });
    const pub2 = await anon2.newPage();
    await pub2.goto(`${BASE}/org/${orgSlug}`, { waitUntil: "networkidle" });
    await pause(pub2, 1200);
    await pub2.screenshot({ path: path.join(SHOTS, "26-profil-publiczny.png"), fullPage: true });
    log("  📷 26-profil-publiczny");
    await anon2.close();
  }

  console.log("");
  log("środowisko demo gotowe");
  log(`organizacja : ${BASE}/org/${orgSlug}`);
  log(`event       : ${eventUrl}`);
  log(`proces      : ${workflowUrl}`);
  if (SHOTS) log(`zrzuty      : ${SHOTS}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
