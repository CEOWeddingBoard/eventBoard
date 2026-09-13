# Rzetelna analiza szans na rynku polskim — Wedding AI Planner

Ocena szans **mocnego zaistnienia** na rynku planerów weselnych w Polsce. Rynek docelowy: pary planujące wesele (~135 tys. ślubów rocznie).

---

## 1. Co rozumieć przez „mocne zaistnienie”

Przyjmuję za punkt odniesienia:
- **Słabe zaistnienie:** produkt istnieje, nieliczni użytkownicy, brak rozpoznawalności.
- **Mocne zaistnienie:** rozpoznawalna marka w niszy, stabilna baza płacących użytkowników (rzędu 0,5–1% par + wzrost), możliwość utrzymania i rozwoju biznesu z przychodów.

Poniżej ocena szans na **mocne** zaistnienie.

---

## 2. Mocne strony produktu

| Aspekt | Ocena | Uzasadnienie |
|--------|--------|---------------|
| **All-in-one** | ✅ Silna | Jedno miejsce: goście, budżet, plan stołów, zadania, dostawcy. Landing trafnie mówi o bólu (Excel, rozjechane pliki). |
| **Plan stołów z AI** | ✅ Różnicator | Reguły + jeden przycisk → AI proponuje rozsadzenie; PDF do sali i winietki. Na rynku PL dominuje ręczne przeciąganie (Planning.wedding, Magic Table Planner, Ślubeo). **„AI rozsadza za Ciebie”** to czytelna, trudna do skopiowania w jednym kroku przewaga, jeśli działa stabilnie. |
| **Język i cena w PLN** | ✅ | Pełna polszczyzna, 59 zł/mies., 7 dni trialu bez karty — dopasowanie do rynku PL. |
| **Technologia** | ✅ | Next.js, płatności Stripe, baza, auth — sensowny stack pod skalowanie i utrzymanie. |
| **Prosty cennik** | ✅ | Jedna cena miesięczna, brak ukrytych opłat; plan Premium (zaproszenia, papeteria) jako jasna ścieżka upsell. |

---

## 3. Słabości i luki

| Aspekt | Ocena | Uzasadnienie |
|--------|--------|---------------|
| **Rozpoznawalność marki** | ❌ | Nowy produkt. Pary szukają „planer weselny”, „lista gości Excel”, „plan stołów” — dominują portale (wedding.pl, slubeo.pl, planery.com.pl), grupy FB i Excel. Trzeba aktywnie zdobywać ruch i zaufanie. |
| **Brak katalogu sal/dostawców** | ⚠️ | WeddingWire, Bridebook, MyWed budują wartość przez katalogi, opinie, porównywarki. U Ciebie: lista dostawców „własna”, bez ekosystemu. To ogranicza wejścia z wyszukiwania (np. „sala weselna Kraków”) i siłę przyciągania. |
| **Generator zaproszeń AI** | ⚠️ | W UI jest, ale `INVITATION_AI_ENABLED = false`. Plan Premium (79 zł) obiecuje generator zaproszeń i papeterię — dopóki nie są dostępne, trudno monetyzować i budować wizerunek „wszystko w jednym”. |
| **Tylko web** | ⚠️ | Brak natywnej aplikacji mobilnej. Responsywność pomaga, ale część użytkowników woli „apkę do wesela” w sklepie. Nie blokuje to wejścia, ale ogranicza dotarcie do grupy przyzwyczajonej do aplikacji. |
| **Zależność od trialu** | ⚠️ | Sukces zależy od konwersji trial → płatność. Przy 59 zł i krótkim cyklu planowania łatwo o „użyję 7 dni i anuluję”. Wymaga dobrego onboardingu i momentu „aha” (np. AI plan stołów) w trakcie trialu. |

---

## 4. Rynek i konkurencja (Polska)

- **Dominujące zachowania:** Excel (szablony z planery.com.pl, Lutys, PaniOdSlubu), grupy Facebook, portale (wedding.pl, slubeo.pl), pojedyncze narzędzia (np. plan stołów na planning.wedding).
- **„Planer weselny” jako całość:** słabo zdominowany przez jeden produkt. Większość to zlepek Excela + Notion/Drive + pojedyncze narzędzia.
- **Aplikacje ogólnoświatowe (Bridebook, MyWed, WeddingWire):** duże budżety, katalogi, często słabsze dopasowanie do PL (język, ceny, zwyczaje). Nie wykluczają niszy „planer po polsku, wszystko w jednym”.
- **Plan stołów:** głównie ręczne narzędzia (drag & drop). **AI rozsadzający według reguł i preferencji** w PL praktycznie nie jest masowo oferowany — to realna luka.
- **Płatność za planer:** wiele osób oczekuje „darmowego” (Excel, darmowe narzędzia). 59 zł/mies. jest niskie w kontekście kosztów wesela; bariera to raczej przyzwyczajenie i brak świadomości niż cena.

**Wniosek:** Rynek nie jest zablokowany przez jednego gracza. Jest miejsce na **„planer weselny po polsku + AI (plan stołów, zadania)”** pod warunkiem dotarcia i przekonania do wartości.

---

## 5. Szanse na mocne zaistnienie — szczera ocena

**Czy mocne zaistnienie jest możliwe? Tak — ale z warunkami.**

- **Scenariusz optymistyczny (np. 0,5–1% par, rozpoznawalna marka w niszy):**
  - Produkt: działający w pełni plan stołów AI, budżet, goście, zadania; w perspektywie Premium z zaproszeniami/papeterią.
  - Marketing: stały ruch (SEO: „plan stołów weselnych”, „planer weselny”, „lista gości”), content (Reels/Instagram jak w CONTENT-MARKETING), ewentualnie płatne testy (Meta/Google) z jasnym CTA (trial).
  - Doświadczenie: trial prowadzi do szybkiego „wow” (np. import listy + wygenerowanie planu stołów), a nie do zagubienia.
  - Szacunkowo: **szansa na ten scenariusz w horyzoncie 1,5–2 lat: 25–40%** — zależna od wykonania (produkt, content, konwersja), a nie od samego pomysłu.

- **Scenariusz pesymistyczny:**
  - Produkt zostaje w obecnej formie (Premium/zaproszenia nie wdrożone), brak systematycznego marketingu, niski ruch i konwersja z trialu.
  - Efekt: nieliczni użytkownicy, brak rozpoznawalności. **Szansa na mocne zaistnienie wtedy: niska (<15%).**

- **Scenariusz „średni” (kilkaset płacących, brak dużej rozpoznawalności):**
  - Działający produkt, umiarkowany ruch, konwersja trial→płatność na poziomie kilkunastu–kilkudziesięciu procent.
  - Możliwy przychód rzędu dziesiątek–niewielkiej setki tys. PLN rocznie, bez „mocnej” pozycji w głowach par. **Szansa na ten wynik: 40–50%.**

---

## 6. Co zwiększa szanse na mocne zaistnienie

1. **Dokończenie wartości Premium** — włączenie i dopracowanie generatora zaproszeń AI oraz papeterii (winietki, menu). To wzmacnia „wszystko w jednym” i upsell.
2. **Jedna „flagowa” funkcja w content marketingu** — np. „Plan stołów w 2 minuty z AI” (Reels, posty, SEO). Powtarzalny przekaz, łatwy do zrozumienia.
3. **SEO i treści** — artykuły/poradniki („Jak zrobić plan stołów na wesele”, „Lista gości w Excelu vs planer”), linki do trialu. Długoterminowy ruch bez wielkiego budżetu.
4. **Onboarding trialu** — krótka ścieżka: założenie wesela → import listy (lub kilka gości) → wygenerowanie planu stołów. Im szybciej użytkownik zobaczy wartość, tym wyższa konwersja.
5. **Social proof** — opinie, case’y (np. „X par już rozsadziło gości z nami”), nawet skromne, budują zaufanie.
6. **Opcjonalnie:** współpraca z blogami/portalem ślubnym (np. 1–2 artykuły sponsorowane lub współpraca merytoryczna) dla ruchu i wiarygodności.

---

## 7. Podsumowanie

| Pytanie | Odpowiedź |
|--------|-----------|
| Czy aplikacja ma **potencjał** na mocne zaistnienie w PL? | **Tak.** All-in-one + AI (plan stołów, zadania), cena i język są dopasowane; rynek nie jest zablokowany; AI do rozsadzania to realny różnicator. |
| Czy to **pewne**? | **Nie.** Zależy od wykonania: dokończenia Premium, marketingu (SEO, content, ewentualnie reklama), konwersji trialu i retencji. |
| Realistyczna **szansa na mocne zaistnienie** (0,5–1% par + rozpoznawalna marka w niszy) w 1,5–2 lata? | **Około 25–40%** przy konsekwentnym rozwoju produktu i marketingu; **<15%** przy braku tych działań. |
| Co jest **największym atutem**? | **Plan stołów z AI** (reguły + jeden przycisk + PDF/winietki) przy słabej konkurencji w tym obszarze w PL. |
| Co **najbardziej ogranicza**? | Brak rozpoznawalności i ruchu oraz niewykorzystany potencjał Premium (zaproszenia, papeteria). |

**Rekomendacja:** Traktować rynek PL jako realny do „mocnego zaistnienia”, ale uzależnić sukces od **systematycznego wdrożenia** (produkt + content/SEO + konwersja trialu), z planem stołów AI jako głównym motorem przekazu.
