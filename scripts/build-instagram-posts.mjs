import { platnoscCoverArtSvg } from "./instagram-illustrations.mjs";
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_ROOT = path.join(ROOT, "content", "social", "instagram-posts");
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(OUT_ROOT, "posts-manifest.json"), "utf8")
);

const CAPTIONS = {
  "01-logo-start": `Startujemy 🤍

Wedding Board — planer weselny online.
Goście, budżet, zadania i plan stołów w jednym miejscu.

Właśnie tu będziemy wrzucać porady i wskazówki dla par planujących wesele.

👇 Link w bio · pierwszy miesiąc za darmo

#weddingboard #planowaniewesela #wesele2026 #organizacjaslubu #slub2026 #planerweselny`,

  "02-organizacja-harmonogram": `Harmonogram wesela — 3 etapy.

18–12 mies. → fundamenty
10–8 mies. → przygotowania
7–4 mies. → zaproszenia

Pełna checklista — link w bio.

#weddingplanner #organizacjawesela #slub2026 #planowaniewesela #weddingboard`,

  "03-plan-stolow": `Plan stołów to nie Excel na ostatnią chwilę.

3 zasady, które ratują wiele rodzin przed dramatem:
→ osobno: ci, którzy są w konflikcie
→ razem: para + świadkowie
→ zamknij listę gości PRZED rozsadzeniem

Pełny poradnik + PDF do sali — link w bio.

#planstolow #wesele2026 #organizacjawesela #planowaniewesela #weddingboard #slub2026`,

  "04-budzet-weselny": `Wesele w 2026 to często 60 000–120 000 zł przy ~100 gościach.

Nie chodzi o liczenie co grosz — chodzi o to, żeby wiedzieć, dokąd idą pieniądze, zanim zabraknie na torcie.

Na blogu: podział kosztów + jak nie przekroczyć planu.

👇 Link w bio

#budzetweselny #wesele2026 #planowaniewesela #slub2026 #weddingboard #organizacjawesela`,

  "05-lista-gosci-rsvp": `Lista gości to nie „kiedyś się ogarniemy”.

Zacznij od trzech list: A (muszą być), B (chcemy), C (jak zostanie budżet).
Zaproszenia min. 6–7 mies. przed. RSVP min. 4 mies. przed — najlepiej 5.

Poradnik krok po kroku — link w bio.

#listagosci #rsvp #zaproszenia #wesele2026 #planowaniewesela #weddingboard #organizacjaslubu`,

  "06-excel-vs-planer": `Excel na start? Spoko.
Excel przy 80 gościach, RSVP i planie stołów? Chaos.

Kiedy przejść na planer:
→ masz więcej niż jeden plik „ostateczna_wersja_v3”
→ partner pyta „która lista jest aktualna?”

Porównanie Excel vs Wedding Board — link w bio.

#planerweselny #aplikacjaweselna #planowaniewesela #wesele2026 #weddingboard #organizacjaslubu`,

  "07-rsvp-za-pozno": `Jeśli RSVP zamykacie 2 tygodnie przed weselem — catering i plan stołów bolą.

Złota zasada: termin RSVP co najmniej 4 miesiące przed ślubem — najlepiej 5.
Zaproszenia wysyłacie co najmniej 6–7 miesięcy wcześniej.

Dlaczego pary czekają za długo i jak to naprawić — na blogu.

👇 Link w bio

#rsvp #listagosci #wesele2026 #organizacjawesela #planowaniewesela #weddingboard #slub2026`,

  "08-mikrowesele": `Mikrowesele (20–50 osób) to nie „gorsze wesele”.

To często:
→ mniejszy stres
→ więcej czasu z każdym gościem
→ niższy budżet bez rezygnacji z jakości

Kiedy kameralne ma sens — i kiedy nie — na blogu.

#mikrowesele #weselekameralne #wesele2026 #planowaniewesela #weddingboard #organizacjaslubu`,

  "09-trendy-weselne-2026": `Trendy weselne 2026 — co jest modne, a co ma sens na lata.

Nie musisz robić wszystkiego z Pinteresta.
Wybierz 2–3 rzeczy, które są „Wasze”, resztę zostaw.

Pełna lista trendów + co pominąć — link w bio.

#trendyweselne #wesele2026 #slub2026 #planowaniewesela #weddingboard #organizacjawesela`,

  "10-pan-mlody": `Pan Młody też ma swoją listę — i to nie tylko garnitur.

Twój realny plan:
→ budżet i umowy (wspólnie z partnerką)
→ transport, noclegi, alkohol
→ wybór DJ/zespołu
→ 30 min/tydzień na „status wesela”

Pełny przewodnik z perspektywy Pana Młodego — link w bio.

#panmlody #wesele2026 #planowaniewesela #organizacjawesela #weddingboard #slub2026`,

  "11-panna-mloda": `Panna Młoda nie musi robić wszystkiego sama.

Co zwykle leży po Twojej stronie:
→ wizja i styl wesela
→ suknia, kwiaty, zaproszenia
→ lista gości (często z Twojej rodziny)

Co delegować partnerowi — w artykule na blogu.

👇 Link w bio

#pannamloda #wesele2026 #planowaniewesela #organizacjawesela #weddingboard #slub2026`,

  "12-checklist-weselna": `Checklista weselna — co i kiedy zrobić, żeby nic nie umknęło.

18 mies. → sala i budżet
12 mies. → dostawcy i projekt zaproszeń
7 mies. → wysyłka zaproszeń · RSVP do 5–4 mies. przed
1 mies. → stoły i detale

Pełna checklista z terminami — link w bio.
Zapisz post 📌

#checklistweselna #harmonogramwesela #wesele2026 #planowaniewesela #weddingboard #organizacjaslubu`,

  "13-aplikacja-do-planowania": `Szukasz aplikacji do planowania wesela?

Na co patrzeć w 2026:
→ lista gości + RSVP
→ budżet bez Excela
→ plan stołów z regułami
→ zadania z harmonogramem

Porównanie i jak zacząć — link w bio.
Pierwszy miesiąc za darmo na weddingboard.pl

#aplikacjaweselna #planerweselny #wesele2026 #weddingboard #planowaniewesela #organizacjaslubu`,

  "14-platnosc-trial": `30 dni za darmo → potem 59 zł/mies.

0 zł → 30 dni pełnego dostępu
59 zł/mies. → bez ukrytych opłat
Anulujesz kiedy chcesz — bez ryzyka

Zacznij planować — link w bio.

#planowaniewesela #wesele2026 #planerweselny #weddingboard #organizacjawesela #slub2026`,

  "15-styl-pana-mlodego-stories": `Nowy artykuł w magazynie 🤵

Styl Pana Młodego 2026 — 5 archetypów, garnitur, zegarek i dodatki.

Od Classic Timeless po Modern Minimal — sprawdź, który styl jest Twój.

👇 Link w bio

#stylgarnituru #panmlody #wesele2026 #slub2026 #weddingboard #magazynslubny #garnitur`,
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Stopka: tylko logo marki (bez numeracji stron). */
function renderFooter(slide, variant = "ig") {
  const brand = "Wedding Board";
  if (variant === "ig") {
    return `<div class="ig-footer"><span class="ig-brand">${brand}</span></div>`;
  }
  return `<div class="footer-bar"><span class="brand-mini">${brand}</span></div>`;
}

function renderBlocks(slide) {
  if (!slide.blocks?.length) return "";
  return `<div class="timeline-blocks">${slide.blocks
    .map(
      (block) => `
    <div class="timeline-block">
      <div class="block-head">
        <span class="block-timing">${esc(block.timing)}</span>
        ${block.label ? `<span class="block-label">${esc(block.label)}</span>` : ""}
      </div>
      <ul class="block-items">
        ${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}
      </ul>
    </div>`
    )
    .join("")}</div>`;
}

function renderActions(slide) {
  const items = slide.actions || slide.lines || slide.bullets || [];
  if (!items.length) return "";
  const lis = items
    .map((item) => {
      if (typeof item === "string") {
        const sep = item.indexOf(" — ");
        if (sep > 0) {
          const lead = item.slice(0, sep);
          const text = item.slice(sep + 3);
          return `<li><strong>${esc(lead)}</strong> — ${esc(text)}</li>`;
        }
        return `<li>${esc(item)}</li>`;
      }
      return `<li><strong>${esc(item.lead)}</strong> — ${esc(item.text)}</li>`;
    })
    .join("");
  return `<ul class="action-list">${lis}</ul>`;
}

function renderCoverArt(slide) {
  if (slide.illustration === "platnosc") {
    return `<div class="ig-cover-art">${platnoscCoverArtSvg()}</div>`;
  }
  return "";
}

function renderInfographicCover(slide) {
  const art = renderCoverArt(slide);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="ig-slide ig-cover${art ? " ig-cover-illustrated" : ""}">
<div class="ig-canvas">
  <div class="ig-cover-main">
    ${art}
    <h1>${esc(slide.title || "")}</h1>
    ${slide.subtitle ? `<p class="ig-sub">${esc(slide.subtitle)}</p>` : ""}
  </div>
  ${renderFooter(slide, "ig")}
</div></body></html>`;
}

function renderInfographicTimeline(slide) {
  const steps = slide.steps || slide.blocks || [];
  const stepsHtml = steps
    .map((step, i) => {
      const range = step.range || step.timing || "";
      const phase = step.phase || step.label || "";
      const summary =
        step.summary ||
        (step.items || []).join(" · ") ||
        "";
      const line = i < steps.length - 1 ? `<div class="ig-step-line" aria-hidden="true"></div>` : "";
      const highlightClass = step.highlight ? " ig-step-highlight" : "";
      const rangeClass = step.highlight ? "ig-range ig-range-highlight" : "ig-range";
      return `
    <div class="ig-step${highlightClass}">
      <div class="ig-step-rail">
        <div class="ig-step-node" aria-hidden="true"></div>
        ${line}
      </div>
      <div class="ig-step-body">
        <div class="ig-step-head">
          <p class="ig-phase">${esc(phase)}</p>
          <p class="${rangeClass}">${esc(range)}</p>
        </div>
        <p class="ig-summary">${esc(summary)}</p>
      </div>
    </div>`;
    })
    .join("");

  const bodyClass = slide.story ? "ig-slide ig-story ig-timeline" : "ig-slide ig-timeline";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="${bodyClass}">
<div class="ig-canvas">
  ${slide.title ? `<h2 class="ig-timeline-title">${esc(slide.title)}</h2>` : ""}
  <div class="ig-steps">${stepsHtml}</div>
  ${renderFooter(slide, "ig")}
</div></body></html>`;
}

function renderInfographicCta(slide) {
  const lead = slide.lead || "Pełna checklista<br/>na blogu →";
  const bodyClass = slide.story ? "ig-slide ig-story ig-cta" : "ig-slide ig-cta";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="${bodyClass}">
<div class="ig-canvas ig-canvas-center">
  ${slide.script ? `<p class="ig-script">${esc(slide.script)}</p>` : ""}
  <p class="ig-cta-lead">${lead}</p>
  <p class="ig-cta-link">link w bio · weddingboard.pl</p>
  ${slide.note ? `<p class="ig-note">${esc(slide.note)}</p>` : ""}
  ${renderFooter(slide, "ig")}
</div></body></html>`;
}

function renderStoryTrial(slide) {
  const lines = (slide.lines || [])
    .map((line) => `<p>${esc(line)}</p>`)
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="ig-slide ig-story ig-cover">
<div class="ig-canvas ig-canvas-center">
  ${slide.eyebrow ? `<p class="ig-eyebrow">${esc(slide.eyebrow)}</p>` : ""}
  ${slide.script ? `<p class="ig-script">${esc(slide.script)}</p>` : ""}
  <h1 class="ig-price">${esc(slide.title || "")}</h1>
  ${slide.subtitle ? `<p class="ig-period">${esc(slide.subtitle)}</p>` : ""}
  <div class="ig-lines">${lines}</div>
  ${slide.pill ? `<span class="ig-pill">${esc(slide.pill)}</span>` : ""}
  ${renderFooter(slide, "ig")}
</div></body></html>`;
}

function renderStoryPrice(slide) {
  const features = (slide.features || [])
    .map((item) => `<li>${esc(item)}</li>`)
    .join("");
  const lines = (slide.lines || [])
    .map((line) => `<p>${esc(line)}</p>`)
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="ig-slide ig-story ig-timeline">
<div class="ig-canvas ig-canvas-center">
  ${slide.eyebrow ? `<p class="ig-eyebrow">${esc(slide.eyebrow)}</p>` : ""}
  <h1 class="ig-price">${esc(slide.price || "")}</h1>
  ${slide.period ? `<p class="ig-period">${esc(slide.period)}</p>` : ""}
  <div class="ig-lines">${lines}</div>
  ${features ? `<div class="ig-feature-card"><h3>${esc(slide.cardTitle || "Wszystko w jednym miejscu")}</h3><ul class="ig-feature-list">${features}</ul></div>` : ""}
  ${renderFooter(slide, "ig")}
</div></body></html>`;
}

function renderTextSlide(slide) {
  const phase = slide.phase ? `<span class="phase-watermark">${esc(slide.phase)}</span>` : "";
  const phaseLabel = slide.phase
    ? `<span class="phase-label">Etap ${esc(slide.phase)}</span>`
    : slide.eyebrow
      ? `<span class="phase-label">${esc(slide.eyebrow)}</span>`
      : "";
  const timing = slide.timing
    ? `<span class="timing">${esc(slide.timing)}</span>`
    : !slide.phase && slide.eyebrow
      ? `<span class="timing">${esc(slide.eyebrow)}</span>`
      : "";

  const intro = slide.intro ? `<p class="intro">${esc(slide.intro)}</p>` : "";
  const blocks = renderBlocks(slide);
  const actions = !blocks ? renderActions(slide) : "";
  const legacyBody =
    !blocks &&
    !slide.actions &&
    !slide.intro &&
    (slide.lines || slide.bullets)
      ? `<div class="body-lines">${(slide.lines || slide.bullets).map((l) => `<p>${esc(l)}</p>`).join("")}</div>`
      : "";

  const noteText = slide.plannerNote || slide.tip;
  const note = noteText
    ? `<aside class="planner-note"><span class="note-label">Od planerki</span><p>${esc(noteText)}</p></aside>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="text-slide">
<div class="canvas">
  <div class="deck-card">
    ${phase}
    <div class="meta-row">${phaseLabel}${timing}</div>
    <h1>${esc(slide.title || "")}</h1>
    ${intro}
    ${blocks || actions || legacyBody}
    ${note}
  </div>
  ${renderFooter(slide, "deck")}
</div></body></html>`;
}

function slideHtml(slide) {
  if (slide.type === "story-trial") {
    return renderStoryTrial(slide);
  }

  if (slide.type === "story-price") {
    return renderStoryPrice(slide);
  }

  if (slide.type === "infographic") {
    return renderInfographicTimeline(slide);
  }

  if (slide.type === "text") {
    return renderTextSlide(slide);
  }

  if (slide.type === "cta") {
    if (slide.style === "infographic" || slide.story) {
      return renderInfographicCta(slide);
    }
    const extra = slide.extra ? `<div class="save">${esc(slide.extra)}</div>` : "";
    const lead = slide.lead || "Pełny poradnik<br/>na blogu →";
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="cta-slide">
<div class="canvas">
  <div class="cta-card">
    <div class="brand">Wedding Board</div>
    <p class="lead">${lead}</p>
    <div class="cta-link"><span>Link w bio</span></div>
    ${extra}
  </div>
  ${renderFooter(slide, "deck")}
</div></body></html>`;
  }

  if (slide.type === "cover") {
    if (slide.style === "infographic") {
      return renderInfographicCover(slide);
    }
    const imgPath = path.join(ROOT, slide.copy).replace(/\\/g, "/");
    const subtitleClass = slide.subtitleScript ? "subtitle script" : "subtitle";
    const tag = slide.tag || slide.eyebrow
      ? `<div class="cover-tag">${esc(slide.tag || slide.eyebrow)}</div>`
      : "";
    const lead = slide.lead ? `<p class="cover-lead">${esc(slide.lead)}</p>` : "";
    const divider = slide.layout === "top" ? `<div class="cover-divider" aria-hidden="true"></div>` : "";
    const overlayClass =
      slide.layout === "center"
        ? "overlay center-card"
        : slide.layout === "top"
          ? "overlay top"
          : "overlay";
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="cover-slide">
<div class="canvas" style="background-image:url('file:///${imgPath}')">
  <div class="${overlayClass}">
    <div class="cover-card">
      ${tag}
      <h1>${esc(slide.title || "")}</h1>
      <p class="${subtitleClass}">${esc(slide.subtitle || "")}</p>
      ${lead}
      ${divider}
    </div>
  </div>
  ${renderFooter(slide, "deck")}
</div></body></html>`;
  }

  if (slide.type === "image") {
    const imgPath = path.join(ROOT, slide.copy).replace(/\\/g, "/");
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="image-slide">
<div class="canvas">
  <img src="file:///${imgPath}" alt=""/>
  <div class="caption-bar">${esc(slide.caption || "")}</div>
  ${renderFooter(slide, "deck")}
</div></body></html>`;
  }

  if (slide.type === "overlay-single") {
    const imgPath = path.join(ROOT, slide.base).replace(/\\/g, "/");
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link rel="stylesheet" href="../../../scripts/instagram-slide-base.css"/></head>
<body class="cover-slide">
<div class="canvas" style="background-image:url('file:///${imgPath}')">
  <div class="overlay center">
    <h1 class="big">${esc(slide.headline || "")}</h1>
  </div>
  ${renderFooter(slide, "deck")}
</div></body></html>`;
  }

  return "";
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

async function screenshotHtml(page, html, outFile) {
  const tmp = path.join(OUT_ROOT, ".tmp-slide.html");
  fs.writeFileSync(tmp, html, "utf8");
  await page.goto(`file:///${tmp.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.locator("body").screenshot({ path: outFile, type: "png" });
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only"));
  const onlyId = onlyArg ? process.argv[process.argv.indexOf(onlyArg) + 1] : null;

  const browser = await chromium.launch();
  const defaultViewport = { width: 1080, height: 1350 };
  const page = await browser.newPage({ viewport: defaultViewport });

  const posts = onlyId
    ? MANIFEST.posts.filter((p) => p.id === onlyId || p.id.includes(onlyId))
    : MANIFEST.posts;

  if (onlyId && !posts.length) {
    console.error(`Nie znaleziono postu: ${onlyId}`);
    process.exit(1);
  }

  for (const post of posts) {
    const postDir = path.join(OUT_ROOT, post.id);
    const isStories = post.format === "stories";
    const mediaDir = path.join(postDir, isStories ? "stories" : "graphics");
    fs.mkdirSync(mediaDir, { recursive: true });

    if (isStories) {
      await page.setViewportSize({ width: 1080, height: 1920 });
    } else {
      await page.setViewportSize(defaultViewport);
    }

    const caption = CAPTIONS[post.id] || "";
    if (isStories) {
      fs.writeFileSync(path.join(postDir, "caption-stories.txt"), caption, "utf8");
      fs.writeFileSync(
        path.join(postDir, "caption-ig.txt"),
        `LINK W BIO:\n${post.blogUrl}\n\nFORMAT: stories (3 relacje)\n\n---\n\n${caption}`,
        "utf8"
      );
    } else {
      const info = `LINK W BIO:\n${post.blogUrl}\n\nFORMAT: ${post.format}\n\n---\n\n`;
      fs.writeFileSync(path.join(postDir, "caption-ig.txt"), info + caption, "utf8");
    }

    if (post.format === "single" && post.graphics) {
      for (const g of post.graphics) {
        if (g.copy) {
          copyFile(path.join(ROOT, g.copy), path.join(mediaDir, g.as));
        }
        if (g.type === "overlay-single") {
          const html = slideHtml(g);
          await screenshotHtml(page, html, path.join(mediaDir, g.as));
        }
      }
      const order = post.graphics.map((g) => `${isStories ? "stories" : "graphics"}/${g.as}`).join("\n");
      fs.writeFileSync(path.join(postDir, "KOLEJNOSC.txt"), order, "utf8");
      continue;
    }

    if (post.slides) {
      const order = [];
      let n = 0;
      const prefix = isStories ? "story" : "slide";
      for (const slide of post.slides) {
        n += 1;
        const fileName = `${prefix}-${String(n).padStart(2, "0")}.png`;
        const outFile = path.join(mediaDir, fileName);
        if (isStories) slide.story = true;
        const html = slideHtml(slide);
        await screenshotHtml(page, html, outFile);
        order.push(`${isStories ? "stories" : "graphics"}/${fileName}`);
      }
      const kolejnoscNote = isStories
        ? "Relacje IG (3 slajdy, 9:16). Na ostatniej dodaj naklejkę Link → weddingboard.pl\n\n"
        : "";
      fs.writeFileSync(path.join(postDir, "KOLEJNOSC.txt"), kolejnoscNote + order.join("\n"), "utf8");
    }
  }

  await browser.close();
  if (fs.existsSync(path.join(OUT_ROOT, ".tmp-slide.html"))) {
    fs.unlinkSync(path.join(OUT_ROOT, ".tmp-slide.html"));
  }
  console.log("Done:", OUT_ROOT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
