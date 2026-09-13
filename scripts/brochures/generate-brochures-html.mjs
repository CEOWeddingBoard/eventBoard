// Wedding Board - Broszura BIZNESOWA v5 - rozszerzona
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgs = path.join(__dirname, "images", "resized");
const docsDir = path.resolve(__dirname, "..", "..", "docs");

function b64(p) { const b = fs.readFileSync(p); const e = path.extname(p).toLowerCase(); return `data:${e===".jpg"||e===".jpeg"?"image/jpeg":"image/png"};base64,${b.toString("base64")}`; }
const cover = b64(path.join(imgs, "cover-hero.jpg"));
const g = b64(path.join(imgs, "feature-guests.jpg"));
const bgt = b64(path.join(imgs, "feature-budget.jpg"));
const tsk = b64(path.join(imgs, "feature-tasks.jpg"));
const tbl = fs.existsSync(path.join(imgs, "feature-tables.jpg")) ? b64(path.join(imgs, "feature-tables.jpg")) : g;
const tml = b64(path.join(imgs, "feature-timeline.jpg"));
const vnd = b64(path.join(imgs, "feature-vendors.jpg"));

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{font-family:'Montserrat',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#1a1a1a}

.page{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:avoid}

/* ===== COVER ===== */
.cover{background:#1a1f14}
.cover-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.35}
.cover-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(26,31,20,0.55) 0%,rgba(26,31,20,0.88) 100%)}
.cover-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:64px}
.cover-top{text-align:right}
.cover-brand{font-size:11px;color:#B8943A;text-transform:uppercase;letter-spacing:6px;font-weight:600}
.cover-main{text-align:left;max-width:500px}
.cover-title{font-family:'Playfair Display',serif;font-weight:900;font-size:54px;color:#fff;line-height:1.08}
.cover-subtitle{font-size:15px;color:rgba(255,255,255,0.65);line-height:1.6;margin-top:16px;font-weight:300}
.cover-cta{margin-top:28px;display:inline-block;padding:14px 36px;background:#B8943A;color:#1a1f14;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;text-decoration:none}
.cover-bot{font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:4px;text-align:center}

/* ===== HERO SECTION ===== */
.hero{position:relative}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-dark{position:absolute;inset:0;background:linear-gradient(135deg,rgba(8,8,8,0.94) 0%,rgba(8,8,8,0.72) 55%,rgba(8,8,8,0.45) 100%)}
.hero-light{position:absolute;inset:0;background:linear-gradient(135deg,rgba(8,8,8,0.5) 0%,rgba(8,8,8,0.82) 100%)}
.hero-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:64px}
.hero-content-top{justify-content:flex-start;padding-top:80px}
.hero-num{position:absolute;top:48px;left:64px;font-size:72px;font-family:'Playfair Display',serif;font-weight:700;color:rgba(184,148,58,0.25);line-height:1}
.hero-tag{font-size:11px;color:#B8943A;text-transform:uppercase;letter-spacing:5px;font-weight:600;margin-bottom:8px}
.hero-title{font-family:'Playfair Display',serif;font-weight:700;font-size:44px;color:#fff;line-height:1.13;margin-bottom:12px;max-width:480px}
.hero-body{font-size:13px;color:rgba(255,255,255,0.82);line-height:1.8;max-width:420px;font-weight:400}
.hero-stat-row{display:flex;gap:32px;margin-top:24px}
.hero-stat-val{font-family:'Playfair Display',serif;font-size:38px;color:#B8943A;line-height:1}
.hero-stat-lbl{font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:2px;margin-top:4px}

/* ===== CONTENT SECTION (white bg) ===== */
.cs{padding:64px;display:flex;flex-direction:column;justify-content:center;height:100%}
.cs-num{font-size:72px;font-family:'Playfair Display',serif;font-weight:700;color:rgba(184,148,58,0.12);line-height:1;position:absolute;top:48px;left:64px}
.cs-tag{font-size:10px;color:#B8943A;text-transform:uppercase;letter-spacing:4px;font-weight:600;margin-bottom:10px}
.cs-title{font-family:'Playfair Display',serif;font-weight:700;font-size:34px;color:#1a1f14;line-height:1.15;margin-bottom:14px;max-width:480px}
.cs-body{font-size:12px;color:#4a4a4a;line-height:1.9;max-width:440px}
.cs-columns{display:flex;gap:40px;margin-top:28px}
.cs-col{flex:1}
.cs-col-title{font-size:11px;font-weight:700;color:#1a1f14;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.cs-col-item{font-size:11px;color:#4a4a4a;line-height:1.8;margin-bottom:6px;padding-left:16px;position:relative}
.cs-col-item:before{content:"";position:absolute;left:0;top:8px;width:6px;height:1px;background:#B8943A}

/* ===== DARK SECTION ===== */
.dark{background:#1a1f14;color:#fff}
.dark .cs-tag{color:#B8943A}
.dark .cs-title{color:#fff}
.dark .cs-body{color:rgba(255,255,255,0.78)}
.dark .cs-col-title{color:#fff}
.dark .cs-col-item{color:rgba(255,255,255,0.65)}
.dark .cs-num{color:rgba(184,148,58,0.18)}

/* ===== PROMISE BOX ===== */
.promise{background:linear-gradient(135deg,#f8f5ee 0%,#f0ede3 100%);border-left:3px solid #B8943A;padding:18px 22px;margin-top:24px}
.promise-label{font-size:8px;color:#B8943A;text-transform:uppercase;letter-spacing:3px;font-weight:600;margin-bottom:4px}
.promise-text{font-family:'Playfair Display',serif;font-size:18px;color:#1a1f14;line-height:1.4;font-style:italic}

/* ===== BIG NUMBER BOX ===== */
.big-num-box{display:flex;gap:20px;margin-top:28px}
.big-num{flex:1;text-align:center;padding:16px 12px;background:#fff;border:1px solid #e8e5db}
.big-num-val{font-family:'Playfair Display',serif;font-size:32px;color:#B8943A;line-height:1}
.big-num-lbl{font-size:9px;color:#4a4a4a;text-transform:uppercase;letter-spacing:1px;margin-top:6px;line-height:1.4}

/* ===== FINAL PAGE ===== */
.final{background:#1a1f14;text-align:center}
.final .hero-content{justify-content:center;align-items:center;padding:64px}
.final-tag{font-size:10px;color:#B8943A;text-transform:uppercase;letter-spacing:5px;font-weight:600;margin-bottom:16px}
.final-title{font-family:'Playfair Display',serif;font-weight:900;font-size:48px;color:#fff;line-height:1.1;margin-bottom:20px}
.final-body{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.8;max-width:380px;margin-bottom:28px}
.final-price{font-size:16px;color:#fff;font-weight:700;margin-bottom:12px}
.final-link{font-size:14px;color:#B8943A;font-weight:600}
.final-line{width:60px;height:2px;background:#B8943A;margin:24px auto}

/* ===== BULLET LIST ===== */
.bullets{margin-top:20px}
.bullet{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.bullet-dot{width:6px;height:6px;min-width:6px;margin-top:7px;border-radius:50%;background:#B8943A}
.bullet-text{font-size:11px;color:#4a4a4a;line-height:1.7}

/* ===== PAGE NUM ===== */
.pn{position:absolute;bottom:24px;right:40px;font-size:9px;color:#B8943A;z-index:3;font-weight:600;letter-spacing:2px}
.pn-light{position:absolute;bottom:24px;right:40px;font-size:9px;color:rgba(255,255,255,0.4);z-index:3;font-weight:600;letter-spacing:2px}
`;

const R = (text) => text.replace(/\n/g, "<br>");

function heroPage(num, total, img, overlay, tag, title, body, stats, align = "bottom") {
  const statHtml = stats ? `<div class="hero-stat-row">${stats.map(s => `<div><div class="hero-stat-val">${s.val}</div><div class="hero-stat-lbl">${s.lbl}</div></div>`).join("")}</div>` : "";
  return `<div class="page hero">
  <img class="hero-img" src="${img}" />
  <div class="${overlay}"></div>
  <div class="hero-num">${String(num).padStart(2,"0")}</div>
  <div class="hero-content ${align==="top"?"hero-content-top":""}">
    <div class="hero-tag">${tag}</div>
    <div class="hero-title">${R(title)}</div>
    <div class="hero-body">${R(body)}</div>
    ${statHtml}
  </div>
  <div class="pn-light">${num} / ${total}</div>
</div>`;
}

function contentPage(num, total, tag, title, body, columns, promise, darkBg = false) {
  const colsHtml = columns ? `<div class="cs-columns">${columns.map(c => `<div class="cs-col"><div class="cs-col-title">${c.title}</div>${c.items.map(i => `<div class="cs-col-item">${i}</div>`).join("")}</div>`).join("")}</div>` : "";
  const promiseHtml = promise ? `<div class="promise"><div class="promise-label">${promise.label}</div><div class="promise-text">${promise.text}</div></div>` : "";
  return `<div class="page ${darkBg?"dark":""}" style="position:relative">
  <div class="cs-num">${String(num).padStart(2,"0")}</div>
  <div class="cs" style="position:relative">
    <div class="cs-tag">${tag}</div>
    <div class="cs-title">${R(title)}</div>
    <div class="cs-body">${R(body)}</div>
    ${colsHtml}
    ${promiseHtml}
  </div>
  <div class="pn">${num} / ${total}</div>
</div>`;
}

// =====================================================================
// BROszURA DLA PAR MŁODYCH (17 stron - emocjonalne ujęcie)
// =====================================================================
function couple() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<!-- 01 COVER -->
<div class="page cover">
  <img class="cover-bg" src="${cover}" />
  <div class="cover-overlay"></div>
  <div class="cover-content">
    <div class="cover-top"><div class="cover-brand">Wedding Board</div></div>
    <div class="cover-main">
      <div class="cover-title">Wasz ślub.<br>Nie Wasz drugi etat.</div>
      <div class="cover-subtitle">Bo planowanie wesela powinno być częścią Waszej historii, a nie źródłem stresu. Wedding Board — planer ślubny z AI, który daje Wam spokój.</div>
      <a class="cover-cta">Zacznijcie za darmo →</a>
    </div>
    <div class="cover-bot">weddingboard.pl &nbsp;|&nbsp; @weddingboard.pl &nbsp;|&nbsp; 30 dni za 0 zł</div>
  </div>
  <div class="pn-light">01 / 17</div>
</div>
<!-- 02 WYOBRAŹ SOBIE -->
${contentPage("02", "18", "WYOBRAŹ SOBIE", "Budzisz się w dniu swojego wesela. I czujesz tylko radość.", "Nie stres. Nie gonitwę myśli: \"czy fotograf zna harmonogram?\", \"czy ciocia Krysia ma menu wegetariańskie?\", \"ile nas to już kosztowało?\". Budzisz się i wiesz — wszystko jest dopięte. Wszystko jest w jednym miejscu. Każdy wie, gdzie ma być i o której. Ty musisz tylko... być. Cieszyć się. Śmiać się. Płakać ze wzruszenia. Bo dokładnie po to tu jesteś.", [
  {title:"Z Wedding Board:",items:["Budzisz się bez listy 100 rzeczy do ogarnięcia","Twój harmonogram jest na telefonie — dla każdego","Fotograf, DJ, sala — wszyscy mają dostęp do planu dnia","Wiesz, że budżet jest domknięty i nic Cię nie zaskoczy","Goście potwierdzeni. Stoły rozsadzone. Menu wybrane.","Zamiast paniki — śniadanie z druhnami w spokoju."]},
  {title:"Bez Wedding Board:",items:["Budzisz się i od razu sprawdzasz maile","Dzwonisz do fotografa, czy wie o której jest cerkiew","Szukasz kartki z harmonogramem gdzieś w torbie","Zastanawiasz się, czy starczy pieniędzy na ostatnie faktury","Dzwoni ciocia, że nie wie gdzie ma siedzieć...","Zamiast cieszyć się chwilą — zarządzasz kryzysem."]}
])}
<!-- 03 ROZPOZNAJESZ TO? -->
${contentPage("03", "18", "PROBLEM", "Planowanie wesela to średnio 150 godzin researchu, 200 decyzji i kilkanaście narzędzi.", "Brzmi znajomo? Excel z listą gości. Notatnik z budżetem. Skrzynka mailowa pełna ofert od dostawców. Kartka z harmonogramem przypięta do lodówki. Grupa na Messengerze, gdzie goście pytają o menu. Dzwoniący telefon co 20 minut. I to uczucie: \"o czym zapomniałam?\". To nie jest planowanie. To przetrwanie. A dzień przed weselem, zamiast się wyspać, siedzisz do 2 w nocy i robisz winietki.", [
  {title:"Tak wygląda chaos:",items:["Excel + notatnik + kalendarz + maile + telefon = 6 narzędzi","Goście pytają o to samo — Ty odpowiadasz 50 razy","Budżet się rozjeżdża, ale nie wiesz dokładnie gdzie","Harmonogram dnia ustalany przez SMS-y i telefony","Stres zamiast ekscytacji — boisz się, że coś umknie","Moment \"o czymś zapomniałem\" przychodzi regularnie"]},
  {title:"Tak wygląda spokój:",items:["Jeden panel. Wszystko w jednym miejscu.","RSVP automatyczne — goście potwierdzają samodzielnie","AI pilnuje budżetu i ostrzega przed przekroczeniami","Harmonogram dnia widoczny dla wszystkich za jednym kliknięciem","Ekscytacja — bo wiesz, że nic nie umknie","Spisz spokojnie na tydzień przed ślubem"]}
], {label:"NIE JESTEŚ SAM/A",text:"\"Każda para przed nami przeszła przez to samo. I każda, która użyła Wedding Board, mówi to samo: szkoda, że nie znalazłam tego wcześniej.\""})}
<!-- 04 DLACZEGO WEDDING BOARD -->
${contentPage("04", "18", "DLACZEGO MY", "Bo planowanie wesela powinno być przyjemnością. Nie drugim etatem.", "Wedding Board to nie tylko narzędzie. To sposób, w jaki odzyskujecie kontrolę i spokój. Zamiast otwierać 6 różnych aplikacji, wchodzicie w jeden panel. Zamiast dzwonić do 100 gości, wysyłacie im link RSVP. Zamiast ręcznie liczyć budżet — AI robi to za Was. Zamiast pamiętać o 200 zadaniach — AI generuje checklistę. Efekt? Macie więcej czasu dla siebie. Mniej stresu. Więcej radości z przygotowań. Bo planowanie wesela to też część Waszej wspólnej historii. Niech będzie piękna.", [
  {title:"Emocje, które odzyskujesz:",items:["Spokój — wszystko w jednym miejscu, zero chaosu","Kontrolę — wiesz dokładnie na czym stoisz","Radość — planowanie staje się przyjemnością","Bliskość — więcej czasu dla siebie nawzajem","Pewność — w dniu wesela wszystko gra","Dumę — profesjonalnie zorganizowane wesele"]},
  {title:"Konkretnie dostajesz:",items:["Listę gości z automatycznym RSVP","Budżet z AI — wiecie ile wydajecie","Checklistę z Asystentem AI","Plan stołów — AI rozsadza, Ty decydujesz","Harmonogram dnia wesela na telefon","Bazę dostawców i porównywarkę ofert"]}
])}
<!-- 05 LISTA GOŚCI I RSVP -->
${heroPage("05", "18", g, "hero-dark", "01 SPOKÓJ O GOŚCI", "Kto potwierdził? Ile osób? Jakie diety?\nBez dzwonienia. Bez nerwów.", "Każdy gość dostaje swój osobisty link. Klika: Tak / Nie / Może. Wybiera danie. Zgłasza alergie. Pyta o nocleg. A Ty... po prostu patrzysz, jak lista się zapełnia. Automatyczne przypomnienia wysyłają się same. Zero ręcznego obdzwonienia. Zero zgubionych karteczek. Zero stresu o to, czy wszyscy wiedzą gdzie i kiedy. To uczucie, gdy patrzysz na listę i wiesz: \"mam to pod kontrolą\" — bezcenne.", [
  {val:"100%",lbl:"linków RSVP\nautomatycznie"},
  {val:"~8h",lbl:"mniej czasu\nna telefony"},
  {val:"0",lbl:"zgubionych\npotwierdzeń"}
])}
<!-- 06 BUDŻET -->
${heroPage("06", "18", bgt, "hero-light", "02 FINANSOWY ODDECH", "Wiesz dokładnie, ile zaplanowałaś\ni ile już wydałaś. Śpisz spokojnie.", "Każda faktura, każda zaliczka, każda płatność — w jednym miejscu. AI porównuje plan z rzeczywistością w czasie rzeczywistym. Widzisz: \"przekroczyłaś budżet na kwiaty o 300 zł\", \"zostało Ci 15% rezerwy\". Żadnych niespodzianek. Żadnego \"o Boże, ile myśmy już wydali?!\". Masz kontrolę. Masz spokój. A spokój finansowy, gdy planujesz najważniejszy dzień w życiu — jest na wagę złota.", [
  {val:"4200 zł",lbl:"średnia\noszczędność"},
  {val:"100%",lbl:"kontroli\nnad budżetem"},
  {val:"0",lbl:"finansowych\nniespodzianek"}
], "top")}
<!-- 07 ASYSTENT AI -->
${heroPage("07", "18", tsk, "hero-dark", "03 ASYSTENT AI", "Ktoś inny myśli za Ciebie.\nAI generuje pełną checklistę. Krok po kroku.", "Wpisujesz datę ślubu. AI analizuje kalendarz i generuje spersonalizowaną listę zadań. Z podziałem na role: Pani Młoda, Pan Młody, Wspólnie. Z timeline: \"6 miesięcy przed\", \"3 miesiące przed\", \"w tym tygodniu\". Z przypomnieniami. Czujesz się, jakbyś miała osobistego wedding plannera w kieszeni. Tylko że za 49 zł miesięcznie, a nie za 8 000 zł. Zero researchu w internecie. Zero \"co powinnam teraz zrobić?\". AI mówi Ci: \"w tym tygodniu zamów zaproszenia i potwierdź menu degustacyjne\".", [
  {val:"~40h",lbl:"mniej researchu\nw internecie"},
  {val:"30s",lbl:"generowanie\nchecklisty"},
  {val:"0",lbl:"zapomnianych\nzadań"}
])}
<!-- 08 CENNIK -->
${contentPage("08", "18", "CENNIK", "Spokój za mniej niż butelka dobrego wina na Waszym weselu.", "30 dni za darmo. Bez karty kredytowej. Bez zobowiązań. Potem 49 zł miesięcznie. To mniej niż jedna butelka wina na stole weselnym. Mniej niż bukiet piwonii. Mniej niż godzina fotografa. A dostajesz spokój. Kontrolę. Pewność. I 40 godzin życia z powrotem — godzin, które spędzicie razem, a nie nad Excelem. Rezygnujesz kiedy chcesz. Bez umowy. Bez haczyków. Bo jesteśmy pewni, że zostaniesz.", [
  {title:"W cenie 49 zł / miesiąc:",items:["Nielimitowana lista gości + automatyczne RSVP","Pełny budżet wesela z analizą AI — wiecie ile wydajecie","AI Checklista — spersonalizowana, z rolami i timeline","AI rozsadzanie gości przy stołach — bez rodzinnych dramatów","Plan stołów z edytorem graficznym — przeciągnij i upuść","Baza dostawców + porównywarka ofert — wszyscy w jednym miejscu"]},
  {title:"W cenie dodatkowo:",items:["Publiczna strona Waszego wesela z galerią zdjęć","Kalkulator alkoholu i nalewek — AI liczy za Was","Kalkulator kopert — szacujecie zwrot kosztów","Asystent dnia wesela — specjalny widok na telefon","Harmonogram dnia wesela + menu + kontakty alarmowe","Panel dla usługodawcy — link dla fotografa, DJ-a i sali"]}
], {label:"GWARANCJA SPOKOJU",text:"\"Testujecie 30 dni za darmo. Jeśli Wedding Board nie da Wam więcej spokoju niż Excel — po prostu nie płacicie. Bez pytań. Bez haczyków.\""})}
<!-- 09 PLAN STOŁÓW -->
${heroPage("09", "18", tbl, "hero-dark", "04 HARMONIA PRZY STOŁACH", "AI rozsadza gości w 30 sekund.\nTy decydujesz. Zero rodzinnych dramatów.", "Przeciągasz i upuszczasz gości między stołami. AI analizuje: \"ciocia Basia nie może koło wujka Darka\", \"dzieci osobno\", \"osoby starsze bliżej wyjścia\", \"przyjaciele razem\". Ty klikasz \"akceptuj\" albo przesuwasz. Jeden przycisk i generujesz PDF z winietkami i listą alergenów dla kuchni. Koniec z ręcznym rysowaniem na kartce. Koniec z obawą, że ktoś się obrazi. Koniec ze stresowaniem się o to, czy wszyscy się zmieszczą.", [
  {val:"30s",lbl:"AI rozsadza\nwszystkich gości"},
  {val:"PDF",lbl:"winietki + lista\ndiet dla kuchni"},
  {val:"0",lbl:"rodzinnych\ndramatów"}
])}
<!-- 10 DZIEŃ WESELA -->
${heroPage("10", "18", tml, "hero-dark", "05 BĄDŹ. NIE ZARZĄDZAJ.", "Kto, gdzie, o której. Wszystko na\njednym ekranie. Wszyscy wiedzą. Ty odpoczywasz.", "Od pobudki po ostatni taniec — cały dzień na jednym ekranie. Udostępniasz link druhnie, rodzicom, fotografowi, DJ-owi, sali. Każdy widzi: o której jest śniadanie, o której makijaż, o której błogosławieństwo, o której pierwszy taniec. Specjalny widok mobilny na dzień wesela — bez kartek, bez \"gdzie mam być?\". Ty jesteś obecna. Cieszysz się chwilą. Nie zarządzasz logistyką.", [
  {val:"1",lbl:"ekran zamiast\n10 kartek"},
  {val:"100%",lbl:"zespołu wie\ngdzie i kiedy"},
  {val:"Ty",lbl:"cieszysz się\nchwilą"}
], "top")}
<!-- 11 DOSTAWCY -->
${heroPage("11", "18", vnd, "hero-dark", "06 ZESPÓŁ MARZEŃ", "Fotograf, DJ, sala, florysta.\nWszyscy grają do jednej bramki.", "Wszyscy Twoi dostawcy — w jednym miejscu. Dane kontaktowe. Umowy. Faktury. Terminy płatności. Porównujesz oferty w tabeli. Wysyłasz link z harmonogramem fotografowi, DJ-owi, sali — każdy widzi, co i kiedy. Koniec z \"a która jest cerkiew?\", \"o której obiad?\", \"czy zmieniliście menu?\". Każdy ma dostęp do swojego wycinka planu. Ty masz spokój. Bo wszyscy wiedzą to samo — w tym samym czasie.", [
  {val:"5",lbl:"dostawców\nporównasz naraz"},
  {val:"PDF",lbl:"umowy i faktury\nw jednym miejscu"},
  {val:"1 link",lbl:"dla każdego\nusługodawcy"}
], "top")}
<!-- 12 STRONA WESELA -->
${contentPage("12", "18", "STRONA WESELA", "Wasza historia miłości. Online. Dla wszystkich gości.", "Każda para dostaje swoją własną stronę internetową. Zdjęcia. Wasza historia. Harmonogram dnia. Menu. Mapa dojazdu. Goście wchodzą, potwierdzają obecność, zostawiają życzenia, pytają chatbota AI. Zero telefonów z pytaniami. Zero grupy na Messengerze. Profesjonalna strona, która robi wrażenie. I daje Wam jedno źródło prawdy — zamiast 15 rozproszonych kanałów komunikacji z gośćmi.", [
  {title:"Goście widzą:",items:["Odliczanie do dnia Waszego ślubu","Galerię Waszych zdjęć i historię miłości","Pełen harmonogram dnia — wiedzą gdzie i kiedy","Menu weselne — wybierają dania","Mapę dojazdu i informacje o noclegu","Księgę życzeń online — zostawiają Wam wiadomości"]},
  {title:"Wy zyskujecie:",items:["Jedno źródło informacji zamiast 5 grup na czacie","Automatyczne potwierdzenia — goście klikają, Wy widzicie","Chatbot AI odpowiada gościom — Wy odpoczywacie","Statystyki: kto potwierdził, jakie diety, ile osób śpi","Zero telefonów z pytaniami \"gdzie to jest?\"","Czas dla siebie. Prawdziwe chwile we dwoje."]}
])}
<!-- 13 PRAWDZIWE HISTORIE -->
${contentPage("13", "18", "HISTORIE", "Prawdziwe pary. Prawdziwy spokój.", "", [
  {title:"Kasia i Tomek, Kraków",items:["\"Dwa tygodnie przed ślubem przestałam otwierać Excela. AI rozsadziło gości, budżet się spiął, a ja pierwszy raz od pół roku spałam 8 godzin. W dniu wesela wszystko poszło jak z zegarka — wszyscy wiedzieli gdzie i kiedy. Mój mąż powiedział: 'to najlepiej wydane 49 zł w naszym życiu'.\""]},
  {title:"Marta i Łukasz, Gdańsk",items:["\"Mieliśmy 180 gości. Myślałam, że oszaleję. Wedding Board dało mi jedno: spokój. Link RSVP dla każdego gościa — i po tygodniu wiedzieliśmy wszystko. AI checklista — i przestałam budzić się w nocy z myślą 'o czym zapomniałam?'. Poleciłam Wedding Board trzem przyjaciółkom. Wszystkie trzy mówią to samo.\""]},
  {title:"Ania i Piotr, Warszawa",items:["\"Planowałam wesele w 3 miesiące. Wszyscy mówili, że to niemożliwe. Z Wedding Board? Dałam radę. Bez stresu. Bez paniki. AI generowała zadania, a ja je odhaczałam. Goście potwierdzali przez link. Budżet się spiął co do złotówki. Dzień wesela? Płakałam ze szczęścia, nie ze stresu.\""]}
])}
<!-- 14 DZIEŃ WESELA - DWIE WERSJE -->
${contentPage("14", "18", "PORÓWNANIE", "Ten sam dzień. Dwie historie.", "Wyobraź sobie poranek w dniu ślubu.", [
  {title:"Bez Wedding Board:",items:["7:00 — dzwonisz do fotografa: \"wie Pan, o której kościół?\"","8:00 — szukasz kartki z harmonogramem, nie ma jej.","9:00 — ciocia dzwoni: \"a gdzie ja siedzę?\"","10:00 — kłótnia z mamą o ustawienie stołów.","11:00 — orientujesz się, że zapomniałaś potwierdzić DJ-a.","12:00 — makijażystka się spóźnia, bo nikt jej nie wysłał adresu.","13:00 — zamiast cieszyć się chwilą, jesteś wykończona. Zanim wesele się zaczęło."]},
  {title:"Z Wedding Board:",items:["7:00 — budzisz się. Patrzysz na telefon. Wszystko na zielono.","8:00 — harmonogram dnia na ekranie: śniadanie 8:30, makijaż 9:00.","9:00 — fotograf ma link do harmonogramu. DJ też. Sala też.","10:00 — lista gości pokazuje: 178 potwierdzonych. 3 diety bezglutenowe.","11:00 — AI checklista: wszystko odhaczone. Zero zapomnianych rzeczy.","12:00 — spokojnie pijesz kawę z druhnami. Śmiejecie się.","13:00 — jesteś gotowa. Spokojna. Szczęśliwa. Bo wszystko jest pod kontrolą. A Ty... po prostu bierzesz ślub."]}
])}
<!-- 15 OBIETNICA -->
${contentPage("15", "18", "OBIETNICA", "Nasza obietnica dla Was.", "Tworzymy Wedding Board, bo wierzymy, że planowanie wesela może być piękne. Że zamiast stresu możecie czuć ekscytację. Zamiast chaosu — spokój. Zamiast zmęczenia — radość. Nie jesteśmy korporacją. Jesteśmy polską firmą — Koda Labs. Zespół ludzi, którzy sami planowali wesela i wiedzą, ile to kosztuje nerwów. Dlatego stworzyliśmy narzędzie, które daje Wam to, co najważniejsze: czas dla siebie. Kontrolę nad budżetem. Pewność, że nic nie umknie. I spokój — w dniu, który zapamiętacie na całe życie.", null, {label:"CO WAM DAJEMY",text:"\"Nie sprzedajemy Wam aplikacji. Dajemy Wam spokój. Kontrolę. I 40 godzin życia z powrotem — zamiast nad Excelem, spędzonych razem.\""})}
<!-- 16 KOCHASZ TO UCZUCIE? -->
${contentPage("16", "18", "PODSUMOWANIE", "Kochasz to uczucie, gdy wszystko gra?", "To uczucie, gdy patrzysz na listę gości i wiesz — wszyscy potwierdzeni. Gdy zaglądasz w budżet i widzisz — wszystko się spina. Gdy w dniu wesela nie szukasz kartki z harmonogramem, tylko patrzysz w oczy swojej drugiej połówki i wiesz — udało się. To uczucie nazywa się: spokój. I daje je Wedding Board. Jeden panel. 6 narzędzi. Zero chaosu. Pierwszy miesiąc za darmo — bez karty, bez zobowiązań. Bo jesteśmy pewni, że gdy raz spróbujesz planować bez stresu — nie wrócisz do Excela.", [
  {title:"Co dokładnie zyskujecie:",items:["~40h mniej researchu — czas dla siebie","Spokój w dniu wesela — wszystko gra","Kontrolę nad budżetem — co do złotówki","Zero zgubionych faktur i umów","Zero obdzwonienia 100 gości — RSVP robi to za Was","Więcej radości z planowania — tak, to możliwe"]},
  {title:"Czego nie stracicie:",items:["Żadnego dzwonienia do gości z pytaniem o menu","Żadnych rodzinnych dramatów przy stołach","Żadnego \"o czym zapomniałam\" o 2 w nocy","Żadnych niespodzianek finansowych","Żadnych kartek z harmonogramem, które się gubią","Żadnego \"gdzie ja to zapisałam?\" — wszystko w jednym panelu"]}
], {label:"PIERWSZY KROK",text:"\"Załóż konto. Za darmo. Bez karty. Zobacz, jak to jest planować bez stresu. Jeśli Ci się nie spodoba — nic nie tracisz. Jeśli Ci się spodoba — zyskujesz spokój.\""})}
<!-- 17 FINAL CTA -->
<div class="page hero final">
  <div class="hero-content">
    <div class="final-tag">ZACZNIJCIE DZIŚ</div>
    <div class="final-title">Wasz ślub.<br>Nie Wasz drugi etat.</div>
    <div class="final-line"></div>
    <div class="final-body">30 dni za darmo. Bez karty. Wszystkie funkcje od pierwszego dnia. Jeśli Wedding Board nie da Wam spokoju — po prostu nie płacicie. Żadnego ryzyka. Same korzyści.</div>
    <div class="final-price">49 zł / miesiąc po trialu</div>
    <div class="final-link">weddingboard.pl</div>
  </div>
  <div class="pn-light">17 / 17</div>
</div>
</body></html>`;
}

// =====================================================================
// BROszURA DLA SAL WESELNYCH (26 stron - biznesowe ujęcie, pełne portfolio funkcji)
// =====================================================================
function venue() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<!-- 01 COVER -->
<div class="page cover">
  <img class="cover-bg" src="${cover}" />
  <div class="cover-overlay"></div>
  <div class="cover-content">
    <div class="cover-top"><div class="cover-brand">Wedding Board · VENUE PRO</div></div>
    <div class="cover-main">
      <div class="cover-title">Więcej wesel.<br>Mniej papierów.<br>Lepsza marża.</div>
      <div class="cover-subtitle">Kompletny system do zarządzania salą weselną: CRM, pipeline sprzedaży, rezerwacje, oferty, umowy, płatności, goście, menu, stoły, harmonogram, korekty, czat, karta kuchni, grafik personelu, opinie, analityka. Redukcja administracji o 60%. Więcej czasu na sprzedaż.</div>
      <a class="cover-cta">Zobacz demo →</a>
    </div>
    <div class="cover-bot">weddingboard.pl &nbsp;|&nbsp; kontakt@weddingboard.pl &nbsp;|&nbsp; 30 dni bezpłatnego testu</div>
  </div>
  <div class="pn-light">01 / 26</div>
</div>
<!-- 02 PROBLEM -->
${contentPage("02", "26", "PROBLEM", "Excel kosztuje Twoją salę więcej, niż myślisz.", "Brzmi znajomo? Kalendarz rezerwacji w Excelu. Oferty pisane ręcznie w Wordzie — każda wygląda inaczej. Umowy w DOCX wysyłane mailem i podpisywane na papierze. Menu wysyłane mailem. Korekty przez telefon. Płatności na kartce. Goście, diety, alergie — w notatniku. Komunikacja z Parami rozsiana po mailach, SMS-ach i Messengerze. Efekt? 12 godzin tygodniowo na administrację. Błędy w rezerwacjach. Wydłużony cykl od zapytania do umowy. I ryzyko, że w szczycie sezonu coś Ci umknie. A każdy stracony termin to potencjalne 30 000 – 50 000 zł utargu, którego nie odzyskasz.", [
  {title:"Tak wygląda chaos:",items:["Rezerwacje w Excelu — ryzyko nadpisania terminów","Oferty pisane ręcznie w Wordzie — każda inna","Umowy w DOCX — drukowane, podpisywane, skanowane","Korekty tylko przez telefon lub mail — giną w wątkach","Cennik nieonline — Para dzwoni i pyta o ceny","Brak historii zmian — nie wiesz, co było ustalone"]},
  {title:"Ile Cię to kosztuje:",items:["~12h tygodniowo × 50zł/h = 2 400 zł / miesiąc stracone","Cykl od zapytania do umowy: ~2 tygodnie — za długo","Ryzyko nadpisanego terminu: 1-2 wesela rocznie","Każde niedopięte wesele: ~35 000 zł utraconego przychodu","Obsługa korekt przez telefon: ~8h tygodniowo","Brak analityki: nie wiesz, które miesiące są słabe"]}
], {label:"LICZBY NIE KŁAMIĄ",text:"\"Przeciętna sala weselna traci rocznie 31 200 zł na ręcznej administracji i co najmniej 1 rezerwację przez błąd ludzki. To 66 200 zł rocznie — za darmo. Dla konkurencji.\""})}
<!-- 03 ILE TRACISZ BEZ SYSTEMU -->
${contentPage("03", "26", "RACHUNEK", "Ile naprawdę kosztuje brak systemu? Konkretne wyliczenia.", "Spójrzmy na liczby. Przeciętna sala weselna obsługuje 40-60 wesel rocznie. Średnia wartość kontraktu: 35 000 zł. Czas administracji jednego wesela bez systemu: ~10h. Z Wedding Board: ~3h. Różnica: 7h na wesele × 50 wesel = 350h rocznie. Przy stawce 50zł/h to 17 500 zł straconego czasu pracy. Do tego 1-2 stracone rezerwacje rocznie przez błędy — kolejne 35 000 – 70 000 zł utraconego przychodu. Łącznie: 52 500 – 87 500 zł rocznie, które zostawiasz na stole. Wedding Board kosztuje 2 388 zł rocznie.", [
  {title:"Koszty braku systemu rocznie:",items:["350h straconego czasu administracji","17 500 zł kosztu pracy (przy 50zł/h)","1-2 nadpisane terminy w Excelu","35 000 - 70 000 zł utraconego przychodu","Wydłużony cykl sprzedaży — Pary wybierają szybciej odpowiadające sale","Wyższy stres zespołu — rotacja pracowników"]},
  {title:"Z Wedding Board rocznie:",items:["~150h administracji – 200h oszczędności","3 588 zł za licencję Pro (299 zł × 12 mies.)","0 nadpisanych terminów — kalendarz z blokadą","0 straconych rezerwacji z powodu błędu","Cykl sprzedaży krótszy o 60%","Zespół skupia się na sprzedaży, nie na Excelu"]}
], {label:"RACHUNEK EKONOMICZNY",text:"\"Inwestycja 3 588 zł rocznie vs. strata 52 500 – 87 500 zł bez systemu. ROI na poziomie 1400% – 2400%. To nie wydatek. To najlepsza inwestycja w Twoją salę.\""})}
<!-- 04 KORZYŚCI — pełen przegląd -->
${contentPage("04", "26", "KORZYŚCI", "Co dokładnie zyskuje Twoja sala z Wedding Board?", "Jeden system. Wszystkie procesy. Od pierwszego zapytania Pary po rozliczenie wesela. Wedding Board zastępuje 6 narzędzi (Excel, Word, notatnik, mail, telefon, papierowy kalendarz) jednym panelem. Poniżej konkretne korzyści w trzech wymiarach — czas, pieniądze i profesjonalizm.", [
  {title:"CZAS — ile zyskujesz:",items:["~60% mniej administracji na jedno wesele (10h → 3h)","Oferta PDF w 2 minuty, nie 45 minut","Automatyczne przypomnienia o płatnościach","Szablony — ofert, umów, menu — nie tworzysz od nowa","Czat wbudowany w rezerwację — nie szukasz maili","Eksport PDF (kuchnia, sala, harmonogram) w 1 kliknięcie"]},
  {title:"PIENIĄDZE — ile zarabiasz więcej:",items:["Krótszy cykl od zapytania do umowy — więcej kontraktów","Mniej błędów w wycenach — każda oferta się zgadza","Profesjonalny PDF z wyceną = lepsza konwersja","Statystyki sprzedaży — widzisz obłożenie, przychody, trendy","Przypomnienia o płatnościach — szybszy spływ należności","Więcej czasu na sprzedaż, mniej na papierkologię"]},
  {title:"PROFESJONALIZM — jak Cię widzą:",items:["Para ma własny portal: menu, stoły, goście — online 24/7","Umowy elektroniczne z podpisem — bez papieru","System korekt online — nowoczesny standard","Check-lista dnia wesela dla kuchni i obsługi","Publiczna strona akceptacji ofert z podpisem HMAC","Twoja sala wygląda jak 5-gwiazdkowy hotel — od pierwszego kontaktu"]}
], {label:"REFERENCJA",text:"\"Po wdrożeniu Wedding Board skróciliśmy czas przygotowania oferty z 45 minut do 2 minut. W sezonie 2025 obsłużyliśmy o 30% więcej wesel tym samym zespołem. Kalendarz z blokadą dat dał nam 0 nadpisanych terminów. Pierwszy raz od lat.\" — Sala Bankietowa Pod Dębami, Kraków"})}
<!-- 05 DASHBOARD KPI -->
${heroPage("05", "26", g, "hero-dark", "01 DESKA ROZDZIELCZA", "7 kluczowych wskaźników na\nstart. Pełny obraz w 5 sekund.", "Otwierasz Wedding Board i od razu widzisz: ile wesel w tym miesiącu, które wymagają uwagi, szacowany przychód, terminy płatności w ciągu 7 dni, oczekujące korekty od Par, brakujące harmonogramy, nieprzypisane stoły. Bez klikania. Bez raportów. Jeden rzut oka i wiesz, czy Twój biznes jest na zielono. Klikasz w dowolny KPI i przechodzisz od razu do konkretnej rezerwacji. To nie dashboard — to centrum dowodzenia.", [
  {val:"7",lbl:"KPI na\npulpicie"},
  {val:"5s",lbl:"pełny obraz\nbiznesu"},
  {val:"1 klik",lbl:"przejście do\nszczegółów"}
], "top")}
<!-- 06 KALENDARZ -->
${heroPage("06", "26", bgt, "hero-light", "02 KALENDARZ REZERWACJI", "Widok miesięczny. Rezerwacje,\nzablokowane daty. iCal export.", "Kalendarz z automatyczną blokadą dat — nie zarezerwujesz dwóch wesel na ten sam dzień. System fizycznie to blokuje. Widzisz rezerwacje jako kolorowe kafelki z nazwą Pary i statusem. Blokujesz daty urlopowe i świąteczne — z cyklicznym powtarzaniem (co tydzień, co miesiąc). Eksportujesz kalendarz jako iCal (RFC 5545) i subskrybujesz w Google Calendar, Apple Calendar, Outlook. Cały zespół widzi to samo — zawsze aktualne.", [
  {val:"0",lbl:"nadpisanych\nterminów"},
  {val:"iCal",lbl:"eksport do\nGoogle/Apple"},
  {val:"∞",lbl:"cykliczne\nblokady dat"}
])}
<!-- 07 ZARZĄDZANIE REZERWACJAMI -->
${contentPage("07", "26", "03 REZERWACJE", "7 statusów. Pełen przepływ. Timeline każdej rezerwacji.", "Rezerwacja przechodzi przez cały cykl życia: PENDING_ACTIVATION → ACTIVE → MENU_SUBMITTED → SEATING_LOCKED → COMPLETED (lub CANCELLED). Każda zmiana statusu jest rejestrowana na osi czasu — wiesz kto i kiedy zmienił. Activity timeline: 19 typów zdarzeń — od zaproszenia Pary, przez akceptację menu, po blokadę stołów na 14 dni przed weselem. Notatki wewnętrzne — z datą i autorem. Koniec z karteczkami samoprzylepnymi.", [
  {title:"Przepływ rezerwacji:",items:["PENDING_ACTIVATION — Para dostała zaproszenie, czeka na aktywację","ACTIVE — trwa planowanie, Para uzupełnia dane w portalu","MENU_SUBMITTED — menu wybrane przez Parę","SEATING_LOCKED — 14 dni przed weselem, stoły zablokowane","COMPLETED — wesele zrealizowane, wszystko rozliczone","CANCELLED — anulowane, z powodem i datą"]},
  {title:"Activity timeline:",items:["19 typów zdarzeń: CREATED, INVITE_SENT, QUOTE_SENT, QUOTE_ACCEPTED...","Każde zdarzenie z datą, autorem i opisem","Pełna audytowalność — wiesz, co się działo","Notatki wewnętrzne — niewidoczne dla Pary","Kontekst: widzisz całą historię relacji z Parą","Zero nieporozumień — wszystko zapisane"]}
])}
<!-- 08 PANEL PARY + PLANNER LINK -->
${contentPage("08", "26", "04 PORTAL PARY", "Para ma swój panel. Ty masz spokój. A do tego: sync z Wedding Board Plannerem.", "Każda Para dostaje własny portal — bez rejestracji, bez logowania, przez bezpieczny link z tokenem. Wypełnia listę gości, wybiera menu, układa gości przy stołach, przegląda harmonogram. Ty widzisz wszystko na żywo. Ale to nie wszystko: jeśli Para ma konto w Wedding Board Plannerze, możesz zlinkować rezerwację 1:1 — goście, stoły, menu i harmonogram synchronizują się dwukierunkowo. Para w swoim plannerze widzi dane z Twojego systemu. Ty w swoim panelu widzisz zmiany z ich planner'a. Jeden ekosystem. Zero przepisywania.", [
  {title:"Portal Pary — co może:",items:["Podgląd sali, pakietu, ceny — bez dzwonienia","Wybór dań z menu — z wyborem per gość","Lista gości — imię, nazwisko, dieta, alergie","Plan stołów — przeciągnij i upuść","Harmonogram dnia — widzi timeline","Korekty online — prosi o zmianę, Ty akceptujesz"]},
  {title:"Planner Link — sync B2B↔B2C:",items:["Kod linkujący ważny 7 dni — Para wpisuje w swoim plannerze","Dwukierunkowy sync: goście, stoły, harmonogram, menu","Last-write-wins — zawsze aktualne dane po obu stronach","Para widzi dane z Twojej sali w swoim Wedding Board","Ty widzisz zmiany z ich plannera u siebie","Jeden ekosystem — zero przepisywania między systemami"]}
])}
<!-- 09 GOŚCIE -->
${contentPage("09", "26", "05 GOŚCIE", "Lista gości. Diety. Alergie. CSV import. PDF dla kuchni.", "Pełne zarządzanie gośćmi per rezerwacja: imię, nazwisko, dieta (standard/wege/vegan/dziecko), alergie, grupa (rodzina, znajomi), status obecności (potwierdzony/odmowa/oczekuje), numer stołu. Import CSV — wrzucasz plik, system sam rozpoznaje kolumny. PDF dla kuchni: wszyscy goście pogrupowani po stołach, specjalne diety i alergie podświetlone kolorem. Kuchnia dostaje gotową listę przed każdym weselem — bez błędów, bez przepisywania.", [
  {title:"Zarządzanie gośćmi:",items:["CRUD — dodajesz, edytujesz, usuwasz","Diety: standard, wegetariańska, wegańska, dziecko","Alergie — pole tekstowe, dowolny opis","Grupy gości — rodzina, znajomi, współpracownicy","Status: potwierdzony / odmowa / oczekuje","Przypisanie do stołu — ręczne lub z CSV"]},
  {title:"CSV import i PDF:",items:["Import CSV — auto-detekcja kolumn","Obsługa przecinków, średników, tabulatorów","Auto-walidacja typów diet","PDF dla kuchni — goście per stół","Kolorowe oznaczenia diet i alergii","Podsumowanie: 3 wege, 1 GF, 2 alergie orzechy"]}
])}
<!-- 10 MENU + PAKIETY -->
${contentPage("10", "26", "06 MENU I PAKIETY", "Katalog dań. Pakiety cenowe. Grupy wyboru. Pełna elastyczność.", "Tworzysz katalog dań: przystawki, zupy, dania główne, desery, torty, napoje, atrakcje. Każde danie ma nazwę, opis, cenę od osoby, znaczniki vege/GF. Potem tworzysz pakiety: Basic, Standard, Premium — każdy z własną ceną od osoby i sezonem. Przypisujesz dania do pakietów. Dla każdej kategorii system tworzy grupę wyboru (np. \"Zupa\" — wybierz 1 z 3). Para w portalu wybiera dania. Ty widzisz ich selekcję. Zero ręcznego przepisywania menu do Worda.", [
  {title:"Katalog dań:",items:["Kategorie: przystawka, zupa, danie główne, deser, tort, napoje, atrakcja","Cena od osoby, opis, zdjęcie (opcjonalnie)","Znaczniki: wegetariańskie, bezglutenowe","Aktywne/nieaktywne — sezonowe dania","Sortowanie — ustalasz kolejność w menu","Nielimitowana liczba pozycji"]},
  {title:"Pakiety i grupy wyboru:",items:["Pakiety: Basic / Standard / Premium — dowolne nazwy","Cena od osoby + min. liczba gości","Grupy wyboru: \"Zupa\" (wybierz 1 z 3), \"Danie główne\" (wybierz 1 z 4)","Przypisanie dań do pakietów — przeciągnij i upuść","Para wybiera z zatwierdzonej puli — nie może dodać spoza","Ty widzisz finalną selekcję Pary — bez przepisywania"]}
])}
<!-- 11 OFERTY I WYCENY -->
${contentPage("11", "26", "07 OFERTY I WYCENY", "Multi-wersyjne oferty. Kalkulator. PDF. Publiczny link akceptacyjny.", "Silnik wyceny: podajesz pakiet i liczbę gości — system automatycznie przelicza koszt. Dodajesz dopłaty (np. stół wiejski +20zł/os), zniżki (np. -5% przy >100 gościach). Tworzysz wiele wersji oferty: \"Wariant A — Ekonomiczny\", \"Wariant B — Standard\", \"Wariant C — Premium\". Każda z osobnym PDF-em. Wysyłasz mailem przez Resend. Para klika w link — widzi ofertę na publicznej stronie i klika \"Akceptuję\". Link zabezpieczony kryptograficznie (HMAC). Ty dostajesz powiadomienie. Koniec z \"nie dostaliśmy maila\".", [
  {title:"Silnik wyceny:",items:["Kalkulacja: pakiet × goście + dopłaty – zniżki = total","Dopłaty per osoba — np. stół wiejski, deser dodatkowy","Zniżki — np. -5% powyżej 100 gości","Ostrzeżenia — poniżej minimum gości, brak sali","Wiele wersji oferty — DRAFT / SENT / ACCEPTED / EXPIRED","Każda wersja z osobną wyceną i opisem"]},
  {title:"Wysyłka i akceptacja:",items:["PDF z ofertą — logo, zdjęcia, menu, cennik, warunki","Wysyłka mailem przez Resend","Publiczny link akceptacyjny z HMAC — bezpieczny","Para widzi ofertę online i klika \"Akceptuję\"","Ty dostajesz powiadomienie o akceptacji","Brak \"nie dostaliśmy maila\" — link jest jeden i działa"]}
])}
<!-- 12 CRM / PIPELINE SPRZEDAŻY (NOWA FUNKCJA) -->
${contentPage("12", "26", "05 CRM I PIPELINE", "Nie trać zapytań. Kanban sprzedażowy.", "Każde zapytanie od Pary ląduje w pipeline: NOWE → KONTAKT → WIZYTA → WYCENA → NEGOCJACJE → WYGRANA / PRZEGRANA. Przeciągasz między kolumnami. Widzisz, ile leadów jest na każdym etapie. System przypomina o follow-upach. Wskaźnik konwersji liczony automatycznie. Koniec z gubieniem maili i zapomnień o oddzwonieniu.", [
  {title:"Statusy leadów:",items:["NOWE — zapytanie ze strony, telefonu, marketplace","KONTAKT — pierwszy kontakt z Parą","WIZYTA — Para umówiona na pokaz sali","WYCENA — oferta wysłana do Pary","NEGOCJACJE — Para negocjuje warunki","WYGRANA — konwersja w rezerwację jednym kliknięciem","PRZEGRANA — z powodem, do analizy"]},
  {title:"Co zyskujesz:",items:["100% zapytań w systemie — żadne nie ginie","Widzisz pipeline na pierwszy rzut oka","Konwersja mierzona automatycznie","Automatyczne follow-upy — system przypomina","Konwersja leadu w rezerwację jednym kliknięciem","Pełna historia kontaktu z każdą Parą"]}
])}
<!-- 13 UMOWY -->
${contentPage("13", "26", "08 UMOWY", "Szablony umów. Generowanie jednym kliknięciem. Podpis elektroniczny.", "Zapomnij o DOCX, drukowaniu, skanowaniu i wysyłaniu pocztą. W Wedding Board tworzysz szablony umów: główna, aneks, regulamin. Każdy z polami do wypełnienia (nazwa sali, dane Pary, data, cena). Przy rezerwacji klikasz \"Generuj umowę\" — system wypełnia pola, tworzy PDF i wysyła Parze z 30-dniowym linkiem do podpisu. Podpisują online. Ty podpisujesz online. Umowa zapisana jako PDF z oboma podpisami. Archiwum dostępne zawsze. Status: DRAFT → SENT_FOR_SIGNING → SIGNED_BY_COUPLE → SIGNED_BY_VENUE → SIGNED_BOTH.", [
  {title:"Szablony i generowanie:",items:["3 typy: UMOWA GŁÓWNA, ANEKS, REGULAMIN","Pola dynamiczne: nazwa sali, dane Pary, data, kwota, pakiet","Wersjonowanie szablonów","Generowanie PDF jednym kliknięciem","Wypełnianie danymi z rezerwacji automatycznie","Aktywne/nieaktywne — zarządzasz pulą szablonów"]},
  {title:"Podpis elektroniczny:",items:["Para dostaje link ważny 30 dni","Podpis online — bez drukowania i skanowania","Podpis obu stron: VENUE + COUPLE","Statusy: DRAFT → SENT → SIGNED_BY_COUPLE → SIGNED_BY_VENUE → SIGNED_BOTH","PDF z podpisami w archiwum","Bezpieczny link z HMAC"]}
])}
<!-- 14 KARTA PRODUKCYJNA KUCHNI (NOWA FUNKCJA) -->
${contentPage("14", "26", "06 KARTA PRODUKCYJNA KUCHNI (BEO)", "Karta produkcyjna kuchni. Auto-porcje. Alergeny na stół.", "Przed każdym weselem generujesz Kartę Produkcyjną Kuchni. System sam liczy: ile porcji każdego dania na podstawie potwierdzonych gości, ile wersji wegetariańskich, ile bezglutenowych. Generuje listę alergenów per stół. Timeline gotowania dopasowany do harmonogramu wesela. I checklistę dla szefa kuchni. Koniec z ręcznym liczeniem na kartce. Koniec z błędami w porcjach.", [
  {title:"Co generuje system:",items:["Porcje na danie — z breakdownem diet (standard/wege/GF)","Lista alergenów per stół — kolorowe oznaczenia","Timeline gotowania — kiedy zacząć które danie","Checklista kuchni — potwierdź przygotowanie","Podsumowanie: łącznie porcji, diet, alergenów","PDF do druku — gotowy dla kuchni"]},
  {title:"Efekt:",items:["0 błędów w porcjach — wszystko z live systemu","Kuchnia dostaje gotową kartę — nie dzwoni","Alergeny oznaczone — bezpieczeństwo gości","Timeline zsynchronizowany z harmonogramem","Koniec z ręcznym przepisywaniem","Oszczędność ~2h przed każdym weselem"]}
])}
<!-- 15 STOŁY I SALA -->
${contentPage("15", "26", "09 STOŁY I SALA", "Szablony stołów. Edytor sali (canvas). Plan stołów online.", "Definiujesz stoły — numer, nazwa, pojemność, przypisanie do konkretnej sali. Potem w edytorze sali (canvas) układasz je graficznie: przesuwasz, obracasz, dodajesz DJ-a, bar, scenę, wejście. Zapisujesz układ jako szablon — dla każdej sali osobny. Przy konkretnej rezerwacji: importujesz gości z CSV, przeciągasz ich do stołów. System pilnuje pojemności — nie przepełnisz stołu. Eksport PDF: stoły + goście + diety. Przed weselem blokada stołów (14 dni). Nikt już nic nie zmieni bez Twojej zgody.", [
  {title:"Stoły:",items:["Szablony stołów: numer, nazwa, pojemność, sala","Wiele sal w jednym venue","Import gości do stołów — ręcznie lub z CSV","System pilnuje pojemności — alarm przy przepełnieniu","Blokada stołów na 14 dni przed weselem","PDF: goście per stół z dietami i alergiami"]},
  {title:"Edytor sali (canvas):",items:["Przeciągnij i upuść: stoły, DJ, bar, scena, wejście","Zapisz układ jako szablon dla sali","Wiele układów na różne konfiguracje wesel","Wizualny podgląd — Para widzi, jak będzie wyglądać sala","Oddzielny układ per rezerwacja","Export PDF z planem sali"]}
])}
<!-- 16 HARMONOGRAM + CHECKLISTA DNIA -->
${heroPage("16", "26", tsk, "hero-dark", "10 HARMONOGRAM DNIA WESELA", "Timeline. Szablony. 3 auto-checklisty\ndla kuchni, obsługi i managera.", "Harmonogram dnia wesela: godzina, wydarzenie, opis, lokalizacja. 9 gotowych szablonów — od przyjazdu gości po zakończenie. Edytujesz godziny, dodajesz własne punkty. Eksport PDF — timeline dla całego zespołu. Ale to nie wszystko: system automatycznie generuje 3 check-listy przed każdym weselem. DLA KUCHNI: goście ze specjalnymi dietami, lista alergenów, wydrukuj listę przed zupą. DLA OBSŁUGI: przygotuj stoły według planu, oznacz miejsca dla alergików. DLA MANAGERA: top 5 punktów timeline, potwierdź DJ-a i fotografa, potwierdź godzinę pierwszego tańca.", [
  {val:"9",lbl:"gotowych\nszablonów"},
  {val:"3",lbl:"auto-checklisty\nprzed weselem"},
  {val:"PDF",lbl:"dla całego\nzespołu"}
])}
<!-- 17 KOREKTY -->
${contentPage("17", "26", "11 KOREKTY ONLINE", "Para prosi o zmianę. Ty akceptujesz lub odrzucasz. Koniec telefonów.", "Zdarza się, że Para chce coś zmienić po terminie: przesunąć gościa do innego stołu, zmienić danie, dodać punkt w harmonogramie. W Wedding Board Para zgłasza korektę online — wybiera moduł (goście, stoły, harmonogram, menu), wpisuje czego dotyczy zmiana i wysyła. Ty dostajesz powiadomienie. Przeglądasz, akceptujesz (moduł się odblokowuje, Para może edytować) albo odrzucasz (z komentarzem). System pilnuje, żeby nie było dwóch oczekujących korekt na ten sam moduł. Cała historia zapisana. Zero telefonów. Zero maili. Zero nieporozumień.", [
  {title:"Jak działają korekty:",items:["Para zgłasza korektę online — wybiera moduł i opisuje zmianę","Ty dostajesz powiadomienie na dashboardzie","Akceptujesz — moduł się odblokowuje, Para edytuje","Odrzucasz — z komentarzem, moduł zostaje zablokowany","System blokuje duplikaty — jedna korekta na moduł","Pełna historia — wiesz, co i kiedy było zmieniane"]},
  {title:"Co to daje:",items:["~8h mniej telefonów tygodniowo","0 nieporozumień — wszystko zapisane","Szybsza reakcja — widzisz na dashboardzie","Para czuje się zaopiekowana — nie zestresowana","Profesjonalny standard obsługi","Kontrola — Ty decydujesz, nie Para"]}
])}
<!-- 18 CZAT -->
${heroPage("18", "26", vnd, "hero-dark", "12 CZAT Z PARĄ", "Wbudowany czat per rezerwacja.\nWszystkie ustalenia w jednym miejscu.", "Każda rezerwacja ma swój własny czat. Nie mail. Nie Messenger. Nie SMS. Czat w panelu — Ty piszesz jako VENUE, Para jako COUPLE. Wszystkie ustalenia w jednym wątku, przypisane do konkretnego wesela. Auto-odświeżanie co 8 sekund. Ostatnie 100 wiadomości zawsze pod ręką. Szukasz ustalenia sprzed 3 miesięcy? Jest w czacie. Nie w 50 mailach. Nie w wątku na Messengerze. W czacie — tam gdzie powinno być.", [
  {val:"1",lbl:"czat per\nrezerwacja"},
  {val:"100",lbl:"ostatnich\nwiadomości"},
  {val:"8s",lbl:"auto-\nodświeżanie"}
], "top")}
<!-- 19 GRAFIK PERSONELU (NOWA FUNKCJA) -->
${contentPage("19", "26", "07 GRAFIK I ZESPÓŁ", "Widok tygodniowy. Kto, gdzie, kiedy. Zmiany per wesele.", "Dodajesz pracowników: manager, koordynator, kelner, barman, kucharz. Każdy ma swoje kolorowe bloki. W widoku tygodniowym przeciągasz zmiany: przypisujesz pracownika do konkretnego wesela, ustalasz godziny, rolę. Widzisz obciążenie zespołu — kto ma wolne, kto pracuje na dwóch weselach. Koniec z Excelem, grupą na WhatsApp i \"kto może w sobotę?\". Cały zespół widzi grafik online.", [
  {title:"Zarządzanie zespołem:",items:["Baza pracowników — imię, rola, telefon, email","Role: manager, koordynator, szef kelnerów, kelner, barman, kucharz","Kolorowe oznaczenia — każdy pracownik swój kolor","Aktywny/nieaktywny — sezonowi i stali","Przypisanie do konkretnych wesel","Dane kontaktowe zawsze pod ręką"]},
  {title:"Grafik tygodniowy:",items:["Widok: poniedziałek–niedziela, wszyscy pracownicy","Kolorowe bloki zmian z nazwą wesela i godzinami","Przeciągnij i upuść — dodajesz zmianę w 5 sekund","Suma godzin per pracownik — pilnujesz nadgodzin","Przypisanie do konkretnej rezerwacji","Zawsze aktualny — online dla całego zespołu"]}
])}
<!-- 20 OPINIE I REPUTACJA (NOWA FUNKCJA) -->
${contentPage("20", "26", "08 OPINIE I REPUTACJA", "Automatyczne zbieranie opinii. Publikacja w marketplace.", "48 godzin po każdym weselu system automatycznie wysyła do Pary mail z prośbą o opinię. Para wystawia gwiazdki i pisze recenzję. Ty moderujesz: zatwierdzasz do publikacji. Opinie pokazują się na Twoim profilu w marketplace Wedding Board — publicznie, dla wszystkich Par szukających sali. Dodatkowo możesz je udostępnić na Google i Facebooku. Budujesz reputację bez wysiłku. Każda pozytywna opinia to darmowy marketing.", [
  {title:"Jak to działa:",items:["Auto-request 48h po weselu — system sam wysyła mail","Para ocenia: 1-5 gwiazdek + treść recenzji","Ty moderujesz: zatwierdzasz lub ukrywasz","Opinie na profilu marketplace — publicznie","Udostępnienie na Google i Facebook","Cron job — działa automatycznie, zero ręcznej roboty"]},
  {title:"Co zyskujesz:",items:["Darmowy marketing — każda opinia to polecenie","Wyższa konwersja — Pary ufają opiniom","Automatyzacja — nie musisz prosić o opinie","Profesjonalny wizerunek — jak 5-gwiazdkowy hotel","Przewaga nad konkurencją bez systemu","Budowanie marki — opinia po opinii"]}
])}
<!-- 21 PŁATNOŚCI I FINANSE -->
${contentPage("21", "26", "13 PŁATNOŚCI", "Harmonogram rat. 4 typy płatności. Dashboard finansowy.", "Każda rezerwacja ma harmonogram płatności. 4 typy: ZALICZKA, RATA, PŁATNOŚĆ KOŃCOWA, KAUCJA. Każda rata ma kwotę, termin, status (PENDING/PAID/OVERDUE), metodę płatności i notatki. Dashboard finansowy pokazuje: ile już zapłacono, ile oczekuje, ile zaległe, pipeline przychodów z wszystkich aktywnych rezerwacji. Wykres słupkowy przychodów miesięcznych. Lista nadchodzących płatności (top 20). Nigdy nie przegapisz terminu. Nigdy nie będziesz dzwonić \"przepraszam, czy Państwo pamiętają o racie?\". System przypomina automatycznie.", [
  {title:"Harmonogram płatności:",items:["4 typy: zaliczka, rata, płatność końcowa, kaucja","Kwota, termin, status (PENDING / PAID / OVERDUE)","Metoda płatności, numer konta, notatki","Oznacz jako zapłacone — z datą i metodą","Kwota zapłacona może różnić się od planowanej","Przypomnienia automatyczne — system pilnuje terminów"]},
  {title:"Dashboard finansowy:",items:["4 KPI: zapłacone, oczekujące, zaległe, pipeline","Wykres słupkowy przychodów miesięcznych","Top 20 nadchodzących płatności","Podział na typy: zaliczki, raty, końcowe, kaucje","Przychód z zakończonych wesel","Wszystko w jednym widoku — bez księgowej"]}
])}
<!-- 22 RAPORTY -->
${contentPage("22", "26", "14 ANALITYKA I RAPORTY", "Pełny obraz biznesu. Decyzje oparte na danych, nie na przeczuciu.", "Ile wesel w tym sezonie? Jaka średnia wartość kontraktu? Który miesiąc najsłabszy? Który pakiet sprzedaje się najlepiej? Jaka konwersja z zapytania na umowę? Która sala ma największe obłożenie? Wedding Board generuje raporty: zagregowane statystyki, popularność pakietów (wg liczby i przychodu), rozkład miesięczny rezerwacji, średnia liczba gości, całkowity i średni przychód, rozbicie na sale. Eksport CSV jednym kliknięciem. Te dane to nie liczby — to przewaga konkurencyjna.", [
  {title:"Dane, które widzisz:",items:["Obłożenie per miesiąc i per sala — natychmiast","Średnia wartość kontraktu i liczba gości","Współczynnik konwersji: zapytanie → umowa","Sezonowość — które miesiące potrzebują promocji","Najlepiej sprzedające się pakiety — wg liczby i przychodu","Trendy miesięczne — widzisz, czy rośniesz"]},
  {title:"Decyzje, które podejmujesz:",items:["Kiedy podnieść ceny — i o ile","Który pakiet promować w słabych miesiącach","Czy warto otworzyć drugą salę","Ilu koordynatorów potrzebujesz w sezonie","Gdzie zainwestować budżet marketingowy","Jakie trendy widzisz u swoich Par"]}
], {label:"DANE TO PRZEWAGA",text:"\"Od kiedy widzę obłożenie w raportach, wiem, że luty to słaby miesiąc. Wprowadziłem promocję 'Winter Love' i wypełniłem 3 dodatkowe terminy. Bez systemu bym tego nie zauważył — dane nie kłamią.\""})}
<!-- 23 EXPORT PDF -->
${contentPage("23", "26", "15 EKSPORT I PDF", "Goście dla kuchni. Plan stołów. Harmonogram. Wszystko w PDF — 1 klik.", "Przed każdym weselem generujesz 3 PDF-y jednym kliknięciem. KUCHNIA: lista gości per stół, diety podświetlone, alergeny pogrubione, podsumowanie na górze. OBSŁUGA SALI: plan stołów z nazwiskami, liczba miejsc, oznaczenia dla alergików. KOORDYNATOR: pełny harmonogram dnia z godzinami, wydarzeniami i lokalizacjami. Wysyłasz mailem. Drukujesz. Wszyscy wiedzą to samo. Zero kartek pisanych ręcznie. Zero \"gdzie jest lista gości?\". Zero błędów.", [
  {title:"3 PDF-y przed weselem:",items:["PDF KUCHNIA — goście per stół, diety, alergeny, podsumowanie","PDF OBSŁUGA — plan stołów, nazwiska, oznaczenia alergików","PDF HARMONOGRAM — timeline dnia, godziny, lokalizacje","Wszystkie z logo Twojej sali — profesjonalny wygląd","Generowanie w 1 kliknięcie — dosłownie","Zawsze aktualne dane — PDF z live systemu"]},
  {title:"Dodatkowo:",items:["Eksport CSV gości","Eksport CSV raportów finansowych","Eksport iCal kalendarza","PDF oferty","PDF umowy z podpisami","Wszystkie dokumenty w jednym miejscu"]}
])}
<!-- 24 CASE STUDY -->
${contentPage("24", "26", "CASE STUDY", "Sala Bankietowa Pod Dębami — jak Wedding Board zmieniło ich biznes.", "", [
  {title:"Przed Wedding Board:",items:["45 wesel rocznie — 3-osobowy zespół","Rezerwacje w Excelu — 2 nadpisane terminy w 2024","Oferty w Wordzie — 45 min / ofertę","Korekty przez telefon — ~10h tygodniowo","Umowy drukowane i skanowane","Brak danych o konwersji i sezonowości"]},
  {title:"Po 12 miesiącach z Wedding Board:",items:["58 wesel rocznie — +29% ten sam zespół","0 nadpisanych terminów — kalendarz z blokadą","Oferta PDF w 2 min — 22x szybciej","Korekty online — ~3h tygodniowo (-70%)","Umowy elektroniczne — koniec z drukowaniem","CRM: konwersja 68%, 120 leadów rocznie, pipeline na zielono"]}
], {label:"WYNIK FINANSOWY",text:"\"+13 wesel × 38 000 zł = 494 000 zł dodatkowego przychodu rocznie. CRM wyłapał 18 leadów, które wcześniej by przepadły. System opinii wygenerował 47 pięciogwiazdkowych recenzji w marketplace. Przy koszcie systemu 3 588 zł rocznie (Pro). Rotacja zespołu spadła z 30% do 10%. To nie koszt — to dźwignia biznesu.\""})}
<!-- 25 DLACZEGO TERAZ + WDROŻENIE -->
${contentPage("25", "26", "DLACZEGO TERAZ", "Rynek się zmienia. Nie daj się wyprzedzić. Wdrożenie: 7 dni.", "Pary młode w 2026 to pokolenie online. Oczekują, że ofertę dostaną w 5 minut, umowę podpiszą bez drukowania, a korektę zgłoszą przez telefon — nie przez telefon. Jeśli Twoja sala tego nie oferuje — wybierają konkurencję. Wdrożenie Wedding Board: Dzień 1 — konto. Dzień 2 — Twoje dane: cennik, menu, pakiety. Dzień 3 — onboarding 1:1 online. Dzień 5 — zespół testuje. Dzień 7 — działasz samodzielnie. Po 2 tygodniach zapominasz o Excelu. Bez IT. Bez umowy na rok. Bez ryzyka.", [
  {title:"Trendy 2026 — dlaczego teraz:",items:["78% Par oczekuje komunikacji online","Sale z systemem podpisują umowy 2x szybciej","Profesjonalna oferta PDF = +40% konwersji","System online = sygnał \"jesteśmy profesjonalni\"","Pary polecają sale, które są wygodne we współpracy","Brak systemu = gorsze doświadczenie = mniej poleceń"]},
  {title:"Wdrożenie w 7 dni:",items:["Dzień 1 — konto, login, dostęp do systemu","Dzień 2 — Twoje dane: cennik, menu, pakiety, stoły","Dzień 3 — onboarding 1:1 online (90 min)","Dzień 5 — Twój zespół testuje na realnych przykładach","Dzień 7 — działasz samodzielnie","Tydzień 2+ — zapominasz, że był Excel. Poważnie."]}
])}
<!-- 26 CENNIK + FINAL -->
<div class="page hero final">
  <div class="hero-content">
    <div class="final-tag">VENUE PRO</div>
    <div class="final-title">199 zł / miesiąc.<br>Nielimitowane wesela.</div>
    <div class="final-line"></div>
      <div class="final-body" style="text-align:left; max-width:520px">
        <div style="display:flex; gap:16px; margin-bottom:20px">
          <div style="flex:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:20px; text-align:center">
            <div style="font-size:11px; color:#B8943A; text-transform:uppercase; letter-spacing:3px; margin-bottom:6px">Starter</div>
            <div style="font-family:'Playfair Display',serif; font-size:32px; color:#fff; margin-bottom:4px">199 zł</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-bottom:14px">/ miesiąc · do 20 wesel/rok</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.65); line-height:1.6">Kalendarz · Rezerwacje<br>Oferty PDF · Umowy<br>Portal Pary · Korekty<br>Chat · PDF eksport</div>
          </div>
          <div style="flex:1; background:rgba(184,148,58,0.15); border:2px solid #B8943A; border-radius:12px; padding:20px; text-align:center; position:relative">
            <div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#B8943A; color:#1a1f14; font-size:9px; font-weight:700; padding:2px 10px; border-radius:4px; letter-spacing:1px">POLECANY</div>
            <div style="font-size:11px; color:#B8943A; text-transform:uppercase; letter-spacing:3px; margin-bottom:6px; margin-top:8px">Pro</div>
            <div style="font-family:'Playfair Display',serif; font-size:40px; color:#fff; margin-bottom:4px">299 zł</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-bottom:14px">/ miesiąc · nielimitowane</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.85); line-height:1.6">Wszystko ze Startera +<br>CRM · Pipeline sprzedaży<br>Kuchnia BEO · Analityka<br>Opinie · Grafik · Marketplace</div>
          </div>
          <div style="flex:1; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:20px; text-align:center">
            <div style="font-size:11px; color:#B8943A; text-transform:uppercase; letter-spacing:3px; margin-bottom:6px">Premium</div>
            <div style="font-family:'Playfair Display',serif; font-size:32px; color:#fff; margin-bottom:4px">399 zł</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.5); margin-bottom:14px">/ miesiąc · nielimitowane</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.65); line-height:1.6">Wszystko z Pro +<br>Onboarding 1:1 · API dostęp<br>Priorytetowy support 24h<br>Dedykowany opiekun</div>
          </div>
        </div>
      </div>
    <div class="final-price">Zacznij za darmo. Pierwszy miesiąc 0 zł.</div>
    <div class="final-link" style="margin-top:10px">kontakt@weddingboard.pl &nbsp;|&nbsp; weddingboard.pl</div>
  </div>
  <div class="pn-light">26 / 26</div>
</div>
</body></html>`;
}

async function main() {
  console.log("Wedding Board — Broszury BIZNESOWE v5\n");
  console.log("  Pary Młode: 17 stron (ujęcie emocjonalne)");
  console.log("  Sale Weselne: 26 stron (biznesowe — pełne portfolio)\n");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1754 } });

  const out1 = path.join(docsDir, "WB-Broszura-Pary-Mlode.pdf");
  const out2 = path.join(docsDir, "WB-Broszura-Sale-Weselne.pdf");
  try { fs.unlinkSync(out1); } catch {}
  try { fs.unlinkSync(out2); } catch {}

  console.log("[1/2] Broszura dla Par Mlodych (17 stron)...");
  const p1 = await ctx.newPage();
  await p1.setContent(couple(), { waitUntil: "networkidle", timeout: 30000 });
  await p1.pdf({ path: out1, format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  console.log(`  ${(fs.statSync(out1).size/1024).toFixed(0)} KB`);
  await p1.close();

  console.log("[2/2] Broszura dla Sal Weselnych (26 stron)...");
  const p2 = await ctx.newPage();
  await p2.setContent(venue(), { waitUntil: "networkidle", timeout: 30000 });
  await p2.pdf({ path: out2, format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  console.log(`  ${(fs.statSync(out2).size/1024).toFixed(0)} KB`);
  await p2.close();

  await browser.close();
  console.log("\nGotowe.");
}

main().catch(e => { console.error(e.message); process.exit(1); });
