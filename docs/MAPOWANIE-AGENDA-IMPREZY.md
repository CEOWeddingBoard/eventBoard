# MAPOWANIE AGENDY IMPREZY (docx) → POLA APLIKACJI

Analiza przykładowych agend klienta (docx z Downloads):

1. `13.03 Astra Zeneca.docx` — catering, 30 os., obiad bemarowo, wyjazd ze szpitala
2. `17.01. studniówka Jaworzno.docx` — 195 os., sala P 23, zimna płyta 2 warianty, kolacja
3. `24.01 Bal Dobrasława Krucińska.docx` — 78 os., Duża sala, bal, zimna płyta, kolacja
4. `magniflex.docx` — 42 os., moma, firma, bufet finger food, scenariusz techniczny

## 1. Struktura agendy (docx)

```
Agenda
Data: 13/03/2026
Ilość osób: 30
Miejsce: <sala / lokalizacja>
Organizator: <klient / firma>
Utworzył: <kto wpisał>
Odpowiedzialny: <kto prowadzi event>
Okoliczność: <bal / firma / wesele...>
                    <Dzień tygodnia>
<GG:MM>  <punkt harmonogramu> (+ opis / miejsce)
... menu w sekcjach: Obiad/Zupa/Danie główne/Deser/Zimna płyta/Kolacja/Napoje/Alko
Zakończenie <GG:MM>
Scenariusz: <uwagi techniczne / sprzęt / logistyka>
Podpis: Kuchnia / Bar
```

## 2. Mapowanie pól

### Nagłówek agendy

| Pole w agendzie | Przykłady | Skąd w aplikacji | Model.pole | Status |
|---|---|---|---|---|
| Data | 13/03/2026 | Data eventu | `Event.date` | ✅ jest |
| Ilość osób | 30 / 195 / 42 / 78 | Szac. liczba gości | `Event.estimatedGuestCount` | ✅ jest |
| Miejsce | Catering / P 23 / Duża sala / moma | Nazwa sali/miejsca | `Event.receptionLocationName` | ✅ jest (umownie sala) |
| **Organizator** | Astra Zeneca / Studniówka LO 2ka Jaworzno / Magniflex | **BRAK POLA** | — | ❌ BRAK |
| Utworzył | Edyta | Zalogowany user (właściciel eventu) | `User.name` przez `Event.userId` | ✅ jest (pobrać relację) |
| **Odpowiedzialny** | Edyta / Konrad | **BRAK POLA** | — | ❌ BRAK |
| **Okoliczność** | bal / firma / (puste) | Typ eventu | `Event.eventType` | ⚠️ częściowo — enum tylko WEDDING / COMMUNION / CHRISTMAS_EVE / CORPORATE / OTHER. Brakuje "bal", "studniówka", "spotkanie firmowe". → wolny tekst lub rozszerzenie enum |
| Dzień tygodnia | Piątek / Sobota | pochodna | z `Event.date` | ✅ jest |

### Harmonogram

| Pole w agendzie | Skąd | Model.pole | Status |
|---|---|---|---|
| `GG:MM + tytuł + opis + miejsce` | Harmonogram dnia | `DayScheduleItem`: `startTime`, `title`, `description`, `location` | ✅ jest |
| **Zakończenie `GG:MM`** (godzina końca imprezy) | **BRAK POLA** | — | ❌ BRAK (`Event.eventEndTime` lub ostatni item harmonogramu) |

### Menu

| Sekcja w agendzie | Skąd | Status |
|---|---|---|
| Obiad serwowany / Zupa / Danie główne / Deser | `MenuVariant` (label = wariant menu) + `MenuVariantCourse` (`courseType`: APPETIZER/SOUP/MAIN/DESSERT/CAKE/DRINKS/OTHER) | ✅ jest |
| **Zimna płyta** (lista pozycji, pieczywo/masło) | ❌ brak w enum `courseType` — trzeba wpisywać jako OTHER | ⚠️ rozszerzyć enum: `COLD_PLATTER`, `BUFFET`, `DINNER`, `COFFEE_TEA`, `ALCOHOL` |
| **Kolacja serwowana** | j.w. | ⚠️ j.w. |
| Napoje / Kawa herbata bufet | `courseType: DRINKS` | ✅ częściowo |
| **Alko (czyje — "ich"/"nasze")** | ❌ brak pola "alkohol: klient/restauracja" | ❌ BRAK |
| **Warianty ilościowe** ("7 x wege", "75%", "2 porcje na osobę", "2 x keto w tym 1 bez laktozy") | częściowo: `MenuVariantCourse.allergens` (JSON `{vege, gluten, bezgluten}`) + `description` | ⚠️ częściowo — liczba porcji wege tylko w wolnym opisie |
| **Podział grup** (studniówka: "4a - 43 osoby, 4b - 36...") | ❌ brak pola | ❌ BRAK (opcjonalnie wolny tekst w "Scenariuszu") |

### Scenariusz (logistyka / sprzęt)

| Pole w agendzie | Przykłady | Skąd | Status |
|---|---|---|---|
| **Scenariusz** | dj swój, światło swoje, fotograf swój, ścianka, fotobudka 360, projektor, panele LED RGB x6, stoły techniczne x2, krzesła teatralnie 42 szt., wieszaki x2, fotele x4, sofy x2, koktajlówki, "na naszej porcelanie, zabrać bemary", "płatność na miejscu — zabrać terminal" | ❌ `Event.description` istnieje ale służy portalowi gości | ❌ BRAK dedykowanego pola (`Event.scenarioNotes`, tekst wielolinijkowy) |

### Podpisy

| Pole w agendzie | Skąd | Status |
|---|---|---|
| Podpis: Kuchnia / Bar | statycznie w generatorze | ✅ na sztywno |

## 3. Czego brakuje — podsumowanie (nowe pola na `Event`, migracja Prisma)

1. **`organizerName`** `String?` — Organizator (klient). ⚠️ BUG: formularz `create-event-form.tsx` ma pole `companyName` dla CORPORATE, ale **nie jest zapisywane** (brak w payload + brak w schemie).
2. **`responsiblePerson`** `String?` — Odpowiedzialny (inny niż twórca).
3. **`eventEndTime`** `DateTime?` — Zakończenie imprezy.
4. **`occasionLabel`** `String?` — Okoliczność wolny tekst ("bal", "studniówka") — nadpisuje mapowanie z `eventType`.
5. **`scenarioNotes`** `String?` — Scenariusz / uwagi techniczne (wielolinijkowy).
6. Rozszerzenie `MenuVariantCourse.courseType` o: `COLD_PLATTER`, `BUFFET`, `DINNER`, `COFFEE_TEA`, `ALCOHOL` (+ pole `alcoholOwner: CLIENT/VENUE` opcjonalnie).
7. Pole na "liczba porcji wege/keto" przy daniu — minimum: konwencja w `description`.

## 4. Gdzie w kodzie

| Element | Plik |
|---|---|
| Generator agendy (obecny format .txt, nie przypomina docx) | `src/lib/ai/agenda-generator.ts` (`buildAgendaText`) |
| Przycisk "Generuj agendę" (aktywny dopiero po akceptacji WSZYSTKICH sekcji) | `src/components/agenda/AgendaApprovalPanel.tsx:112-129` |
| Workflow akceptacji sekcji (SCHEDULE/MENU/GUESTS/KITCHEN/GENERAL) | `src/lib/actions/agenda-approval.actions.ts` |
| Strona dnia (harmonogram + menu) | `src/app/[locale]/dashboard/day/page.tsx` |
| Formularz tworzenia eventu | `src/components/create-event-form.tsx` |
| Edycja eventu | `src/components/edit-event-dialog.tsx` |
| Schemat | `prisma/schema.prisma` (model `Event`) |
| Biblioteka DOCX już w projekcie | `docxtemplater` (package.json) — można generować .docx zamiast .txt |

## 5. Uwagi do "Generuj agendę"

- Obecnie przycisk pojawia się dopiero, gdy **wszystkie** sekcje są zaakceptowane w `AgendaApprovalPanel` — do potwierdzenia z klientem, czy restauracja chce ten workflow, czy przycisk ma być zawsze dostępny.
- Wynik to pobranie pliku `agenda.txt` — do zmiany na **DOCX wg szablonu klienta** (`docxtemplater` już jest w zależnościach).
- Kolejność sekcji w docx: nagłówek → harmonogram → menu (sekcje serwowane/bufet) → napoje/alko → zakończenie → scenariusz → podpisy. Obecny `buildAgendaText` ma inny układ i po angielsku nagłówki — do przebudowy.
