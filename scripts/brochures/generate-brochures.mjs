// Wedding Board - Profesjonalna broszura z grafikami Higgsfield
import React from "react";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgs = path.join(__dirname, "images", "resized");
const docsDir = path.resolve(__dirname, "..", "..", "docs");

function loadImage(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const cover = loadImage(path.join(imgs, "cover-hero.jpg"));
const imgGuests = loadImage(path.join(imgs, "feature-guests.jpg"));
const imgBudget = loadImage(path.join(imgs, "feature-budget.jpg"));
const imgTasks = loadImage(path.join(imgs, "feature-tasks.jpg"));
const imgTablesRaw = path.join(imgs, "feature-tables.jpg");
const imgTables = fs.existsSync(imgTablesRaw) ? loadImage(imgTablesRaw) : imgGuests;
const imgTimeline = loadImage(path.join(imgs, "feature-timeline.jpg"));
const imgVendors = loadImage(path.join(imgs, "feature-vendors.jpg"));

if (!cover || !imgGuests || !imgBudget || !imgTasks || !imgTimeline || !imgVendors) {
  console.error("Brak obrazow! Uruchom: node scripts/brochures/resize-images.mjs");
  process.exit(1);
}

console.log("Obrazy zaladowane. Generowanie PDF...");

const GOLD = "#B8943A";
const OLIVE = "#5A6B3E";
const DARK = "#1A1C15";
const MUTED = "#6B6B6B";
const WHITE = "#FFFFFF";

const A4_W = 595.28;
const A4_H = 841.89;

const s = StyleSheet.create({
  page: { backgroundColor: WHITE, padding: 0 },
  sectionPage: { padding: 0, flexDirection: "row" },
  imageHalf: { width: 260 },
  textHalf: { width: A4_W - 260, justifyContent: "center", paddingHorizontal: 30 },
  sectionTag: { fontSize: 8, color: GOLD, textTransform: "uppercase", letterSpacing: 3, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 24, color: DARK, fontFamily: "Times-Bold", marginBottom: 12, lineHeight: 1.2 },
  sectionBody: { fontSize: 10, color: MUTED, lineHeight: 1.7 },
  sectionHighlight: { fontSize: 12, color: OLIVE, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
  sectionDivider: { width: 40, height: 1, backgroundColor: GOLD, marginVertical: 10 },

  coverTag: { fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: 5, marginBottom: 16, fontFamily: "Helvetica-Bold" },
  coverTitle: { fontSize: 42, color: WHITE, textAlign: "center", fontFamily: "Times-Bold", marginBottom: 12 },
  coverSub: { fontSize: 14, color: "#D4D8C8", textAlign: "center", lineHeight: 1.5, maxWidth: 400 },
  coverGoldLine: { width: 60, height: 1, backgroundColor: GOLD, marginVertical: 20 },
  coverBottomText: { fontSize: 9, color: "#C5CBBA", textTransform: "uppercase", letterSpacing: 3 },

  finalPage: { backgroundColor: OLIVE, justifyContent: "center", alignItems: "center", padding: 48 },
  finalTag: { fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: 5, marginBottom: 16, fontFamily: "Helvetica-Bold" },
  finalTitle: { fontSize: 32, color: WHITE, textAlign: "center", fontFamily: "Times-Bold", marginBottom: 16 },
  finalText: { fontSize: 12, color: "#D4D8C8", textAlign: "center", lineHeight: 1.6, maxWidth: 380, marginBottom: 24 },
  finalCTA: { fontSize: 16, color: WHITE, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 6 },
  finalLink: { fontSize: 12, color: GOLD, textAlign: "center" },
  finalGoldLine: { width: 60, height: 1, backgroundColor: GOLD, marginVertical: 16 },

  pageNum: { position: "absolute", bottom: 16, right: 32, fontSize: 8, color: MUTED },
  pageNumLight: { position: "absolute", bottom: 16, right: 32, fontSize: 8, color: "#C5CBBA" },
});

function SectionLeft({ image, tag, title, body, highlight, num, total }) {
  return React.createElement(Page, { size: "A4", style: s.sectionPage },
    React.createElement(Image, { src: image, style: s.imageHalf }),
    React.createElement(View, { style: s.textHalf },
      React.createElement(Text, { style: s.sectionTag }, tag),
      React.createElement(Text, { style: s.sectionTitle }, title),
      React.createElement(View, { style: s.sectionDivider }),
      React.createElement(Text, { style: s.sectionBody }, body),
      highlight && React.createElement(Text, { style: s.sectionHighlight }, highlight)
    ),
    React.createElement(Text, { style: s.pageNum }, `${num}/${total}`)
  );
}

function SectionRight({ image, tag, title, body, highlight, num, total }) {
  return React.createElement(Page, { size: "A4", style: s.sectionPage },
    React.createElement(View, { style: s.textHalf },
      React.createElement(Text, { style: s.sectionTag }, tag),
      React.createElement(Text, { style: s.sectionTitle }, title),
      React.createElement(View, { style: s.sectionDivider }),
      React.createElement(Text, { style: s.sectionBody }, body),
      highlight && React.createElement(Text, { style: s.sectionHighlight }, highlight)
    ),
    React.createElement(Image, { src: image, style: s.imageHalf }),
    React.createElement(Text, { style: s.pageNum }, `${num}/${total}`)
  );
}

function CoupleBrochure() {
  const T = 8;
  let n = 0;
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: { backgroundColor: OLIVE, padding: 0 } },
      React.createElement(View, { style: { flex: 1, justifyContent: "center", alignItems: "center", padding: 48 } },
        React.createElement(Image, { src: cover, style: { width: 280, borderRadius: 16, marginBottom: 36 } }),
        React.createElement(Text, { style: s.coverTag }, "Wedding Board"),
        React.createElement(Text, { style: s.coverTitle }, "Wasze wymarzone wesele\nzaczyna sie tutaj"),
        React.createElement(View, { style: s.coverGoldLine }),
        React.createElement(Text, { style: s.coverSub }, "Planer weselny z Asystentem AI. Jeden panel zamiast dziesieciu plikow."),
      ),
      React.createElement(View, { style: { position: "absolute", bottom: 32, left: 0, right: 0, alignItems: "center" } },
        React.createElement(Text, { style: s.coverBottomText }, "weddingboard.pl  |  @weddingboard.pl"),
      ),
      React.createElement(Text, { style: s.pageNumLight }, `1/${T}`)
    ),
    SectionRight({ image: imgGuests, tag: "01  LISTA GOSCI I RSVP", num: ++n + 1, total: T,
      title: "Kto potwierdzil?\nWszystko w jednym\nmiejscu.",
      body: "Sledz odpowiedzi, zarzadzaj lista, wysylaj przypomnienia. Kazdy gosc dostaje wlasny link RSVP.",
      highlight: "Potwierdzenia na biezaco  ·  Eksport PDF  ·  Link RSVP dla kazdego"
    }),
    SectionLeft({ image: imgBudget, tag: "02  BUDZET WESELA", num: ++n + 1, total: T,
      title: "Wiesz, ile planujesz\ni ile juz wydales.",
      body: "Porownuj plan z wydatkami. AI analizuje budzet, wykrywa przekroczenia i sugeruje oszczednosci.",
      highlight: "AI optymalizacja  ·  Kategorie  ·  Historia wplat"
    }),
    SectionRight({ image: imgTasks, tag: "03  ASYSTENT AI", num: ++n + 1, total: T,
      title: "AI podpowiada co\nzrobic w tym tygodniu.",
      body: "Inteligentny asystent generuje checkliste z rolami i timeline dopasowany do daty slubu.",
      highlight: "AI checklista  ·  Role Pan/Pani Mloda  ·  Przypomnienia"
    }),
    SectionLeft({ image: imgTables, tag: "04  PLAN STOLOW", num: ++n + 1, total: T,
      title: "Rozsadz gosci\nbez bolu glowy.",
      body: "Drag & drop. AI rozsadza gosci z uwzglednieniem konfliktow i preferencji. PDF z winietkami.",
      highlight: "AI rozsadzanie  ·  Drag & drop  ·  Eksport PDF"
    }),
    SectionRight({ image: imgTimeline, tag: "05  HARMONOGRAM DNIA", num: ++n + 1, total: T,
      title: "Kto, gdzie, o ktorej.\nCaly dzien wesela\nna jednym ekranie.",
      body: "Od pobudki po ostatni taniec. Menu weselne, dostawcy, kontakty. Widok mobilny na dzien wesela.",
      highlight: "Timeline  ·  Menu weselne  ·  Widok mobilny"
    }),
    SectionLeft({ image: imgVendors, tag: "06  BAZA DOSTAWCOW", num: ++n + 1, total: T,
      title: "Sala, catering,\nfotograf — wszystko\nw jednej bazie.",
      body: "Dane kontaktowe, umowy, terminy platnosci. Porownujesz oferty w tabeli. Panel uslugodawcy.",
      highlight: "Porownywarka  ·  Dokumenty  ·  Panel uslugodawcy"
    }),
    React.createElement(Page, { size: "A4", style: { ...s.page, ...s.finalPage } },
      React.createElement(Text, { style: s.finalTag }, "ZACZNIJ DZIS"),
      React.createElement(Text, { style: s.finalTitle }, "Jeden panel.\nNie chaos."),
      React.createElement(View, { style: s.finalGoldLine }),
      React.createElement(Text, { style: s.finalText }, "Polski produkt. Aplikacja webowa dziala na telefonie i komputerze. Bez instalacji."),
      React.createElement(Text, { style: s.finalCTA }, "Pierwszy miesiac za darmo"),
      React.createElement(Text, { style: s.finalLink }, "weddingboard.pl"),
      React.createElement(Text, { style: s.pageNumLight }, `8/${T}`)
    )
  );
}

function VenueBrochure() {
  const T = 5;
  let n = 0;
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: { backgroundColor: OLIVE, padding: 0 } },
      React.createElement(View, { style: { flex: 1, justifyContent: "center", alignItems: "center", padding: 48 } },
        React.createElement(Image, { src: cover, style: { width: 240, height: 240, borderRadius: 16, marginBottom: 36, objectFit: "cover" } }),
        React.createElement(Text, { style: { ...s.coverTag, fontSize: 10 } }, "Wedding Board  ·  DLA SAL"),
        React.createElement(Text, { style: { ...s.coverTitle, fontSize: 34 } }, "Profesjonalna\nobsluga wesel\nw jednym systemie"),
        React.createElement(View, { style: s.coverGoldLine }),
        React.createElement(Text, { style: s.coverSub }, "Portal do zarzadzania rezerwacjami. Komunikacja z Parami w czasie rzeczywistym."),
      ),
      React.createElement(View, { style: { position: "absolute", bottom: 32, left: 0, right: 0, alignItems: "center" } },
        React.createElement(Text, { style: s.coverBottomText }, "weddingboard.pl  |  kontakt@weddingboard.pl"),
      ),
      React.createElement(Text, { style: s.pageNumLight }, `1/${T}`)
    ),
    SectionRight({ image: imgGuests, tag: "01  KALENDARZ REZERWACJI", num: ++n + 1, total: T,
      title: "Pelna widocznosc.\nKazde wesele\npod kontrola.",
      body: "Kalendarz z blokada dat. Statusy: zapytanie, oferta, podpisana, zrealizowana.",
      highlight: "Statusy  ·  Filtry  ·  Blokada dat"
    }),
    SectionLeft({ image: imgBudget, tag: "02  PANEL PARY MLODEJ", num: ++n + 1, total: T,
      title: "Para widzi Twoje\nsale, stoly i menu\nw swoim panelu.",
      body: "System korekt online. Menu katalog. Profil sali widoczny w aplikacji Wedding Board.",
      highlight: "System korekt  ·  Menu online  ·  Profil sali"
    }),
    SectionRight({ image: imgTasks, tag: "03  8 MODULOW PER WESELE", num: ++n + 1, total: T,
      title: "Goscie, stoly,\nharmonogram, menu,\noferty, platnosci...",
      body: "Kazda rezerwacja ma 8 modulow: lista gosci, plan stolow, harmonogram, menu, oferty, platnosci, dokumenty, check-lista.",
      highlight: "8 modulow  ·  PDF export  ·  Analityka"
    }),
    React.createElement(Page, { size: "A4", style: { ...s.page, ...s.finalPage } },
      React.createElement(Text, { style: s.finalTag }, "VENUE PRO"),
      React.createElement(Text, { style: s.finalTitle }, "99 zl / miesiac"),
      React.createElement(View, { style: s.finalGoldLine }),
      React.createElement(Text, { style: s.finalText }, "30 dni trialu. Nielimitowane rezerwacje. Onboarding 1:1. Priorytetowy support."),
      React.createElement(Text, { style: s.finalCTA }, "kontakt@weddingboard.pl"),
      React.createElement(Text, { style: s.finalLink }, "weddingboard.pl"),
      React.createElement(Text, { style: s.pageNumLight }, `5/${T}`)
    )
  );
}

async function main() {
  console.log("Wedding Board - Broszury z grafikami Higgsfield\n");

  console.log("[1/2] Broszura dla Par Mlodych...");
  const coupleBuf = await renderToBuffer(React.createElement(CoupleBrochure));
  const cp = path.join(docsDir, "Broszura-Pary-Mlode-Wedding-Board.pdf");
  fs.writeFileSync(cp, coupleBuf);
  console.log(`  ${cp}  (${(coupleBuf.length/1024).toFixed(0)} KB)`);

  console.log("[2/2] Broszura dla Sal Weselnych...");
  const venueBuf = await renderToBuffer(React.createElement(VenueBrochure));
  const vp = path.join(docsDir, "Broszura-Sale-Weselne-Wedding-Board.pdf");
  fs.writeFileSync(vp, venueBuf);
  console.log(`  ${vp}  (${(venueBuf.length/1024).toFixed(0)} KB)`);

  console.log("\nGotowe!");
}

main().catch(err => { console.error(err.message); process.exit(1); });
