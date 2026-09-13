# Plan rozwoju funkcji – Wedding AI Planner

## Podsumowanie wymagań

| # | Funkcja | Opis |
|---|---------|------|
| 1 | **Zapis/odczyt dla każdej opcji** | Każda sekcja (zadania, budżet, goście, stoły, usadzenie) ma zapisywać i wczytywać dane spójnie z wydarzeniem/weselem. |
| 2 | **Generowanie zadań AI** | AI generuje pełną listę zadań ślubnych z rólami (Pan Młody, Pani Młoda, Wspólnie), timeline dopasowany do daty ślubu (nawet 6+ miesięcy). **API KEY**: miejsce na konfigurację. |
| 3 | **Canvas ustawienia sali** | Edytowalny plan sali: przeciąganie stołów, DJ, scena, wejścia – wizualna edycja układu. |
| 4 | **Preferencje gości** | Nowe pola: preferencje usadzenia, żywieniowe, noclegowe, alkoholowe; wykorzystanie przy stołach i winietkach. |
| 5 | **Usadzenie + PDF** | Logika: max osób przy stole, osobny stół pary młodej; propozycja liczby stołów z uwzględnieniem preferencji; PDF: stół, numer, imię/nazwisko, winietka, dieta. |

---

## Stan obecny (co już jest)

- **Zapis/odczyt**: Dane są zapisywane w Prisma (Event/Wedding, Task, BudgetItem, Guest, Table, Household). Część API używa `eventId`, część `weddingId` – trzeba to ujednolicić i upewnić się, że każda sekcja ma spójny zapis/odczyt.
- **AI – plan ogólny**: Route `api/events/[id]/ai/generate-plan` – generuje zadania + budżet; obecnie **mock** (bez prawdziwego OpenAI). **API KEY**: w `.env` / `.env.local`: `OPENAI_API_KEY` oraz `AI_PROVIDER=mock|openai`.
- **AI – zadania**: `generateTasksAI` w `task.actions.ts` – prosta lista zadań bez ról i bez treści z pliku `weedingPlaner`. `task-generator.ts` ma bogatszą listę zadań (bez ról Pan/Pani Młoda).
- **Goście**: Model `Guest` ma już: `dietaryRestrictions`, `seatingNotes`, `foodPreference`, `allergies`, `needsHotel`, `needsTransport`. Brakuje: osobnych pól na preferencje usadzenia (tekst na winietkę), preferencje noclegowe (szczegóły), preferencje alkoholowe.
- **Stoły**: Model `Table` (name, capacity, type). Brak: pozycja (x, y) i wymiary na planie sali, typ „stół pary młodej”.
- **Plan sali**: Brak canvasu – tylko lista stołów i przypisanie gości.
- **Usadzenie**: Reguły w `SeatingRule`, algorytm w `seating-ai.ts`. Brak: osobnego stołu dla pary młodej, generowania liczby stołów z preferencjami, PDF z winietką i dietą.

---

## Proponowana kolejność realizacji

### Faza 1 – Fundament (zapis + API key + preferencje gości) ✅ Zrealizowane

**1.1 Spójny zapis/odczyt dla każdej opcji**  
- Ujednolicenie: czy dane zawsze wiążemy z `Wedding`, czy z `Event` (obecnie mieszanka).  
- Upewnienie się, że: Zadania, Budżet, Goście, Stoły, Wersje planu – wszystkie zapisują/ładują po tym samym kluczu (np. `weddingId`) i że UI zawsze po odświeżeniu pokazuje zapisane dane.  
- **Efekt**: Jedno źródło prawdy, brak „gubienia” danych między sekcjami.

**1.2 Miejsce na API KEY do AI**  
- Plik: **`.env.local`** (nie commituj go) i **`.env.example`** (wzór do commita).  
- Zmienne już istnieją: `AI_PROVIDER=mock`, `OPENAI_API_KEY=sk-...`.  
- Dodać w README lub osobnym `docs/KONFIGURACJA-AI.md` krótką instrukcję:  
  - „Aby włączyć generowanie zadań i planu przez OpenAI, ustaw w `.env.local`:  
    `AI_PROVIDER=openai` i `OPENAI_API_KEY=sk-twoj-klucz`.”  
- W kodzie: w route `api/events/[id]/ai/generate-plan` oraz w przyszłym generatorze zadań – sprawdzać `process.env.OPENAI_API_KEY` i ewentualnie zwracać czytelny błąd (np. 400 + komunikat), jeśli wymagany jest OpenAI a klucza nie ma.

**1.3 Preferencje gości (rozszerzenie modelu + UI)**  
- W **Prisma**: dodać pola do `Guest`, np.:  
  - `seatingPreference` (preferencje usadzenia / tekst na winietkę),  
  - `dietaryPreference` (można rozszerzyć/zastąpić `foodPreference`),  
  - `accommodationPreference` (noclegi),  
  - `alcoholPreference` (alkohol).  
- W formularzu gościa (i listach/eksportach): pola do edycji tych preferencji.  
- **Efekt**: Dane gotowe pod generowanie usadzeń, winietek i PDF.

**Dlaczego najpierw:** Bez spójnego zapisu i bez miejsca na API key dalsze funkcje (AI, canvas, PDF) będą stać na chwiejnym gruncie. Preferencje gości są wejściem do usadzenia i PDF, więc warto je mieć wcześniej.

**Zrobione (Faza 1):**
- Generowanie planu AI (`/api/events/[id]/ai/generate-plan`) używa **Event** i `eventId`; zapis zadań i budżetu po `eventId`. Spójny zapis/odczyt z dashboardem (getUrlUserEvent).
- Route AI: przy `AI_PROVIDER=openai` i braku `OPENAI_API_KEY` zwracany jest błąd 400 z komunikatem, gdzie ustawić klucz (`.env.local`).
- Goście: w Prisma dodane pola `seatingPreference`, `accommodationPreference`, `alcoholPreference`; walidacja i formularz gościa rozszerzone o preferencje żywieniowe, usadzenia (tekst na winietkę), noclegowe, alkoholowe, potrzeba noclegu/transportu.
- API households (PATCH/DELETE gościa) używa `verifyEventAccess` i obsługuje nowe pola preferencji.

---

### Faza 2 – Generowanie zadań przez AI ✅ Zrealizowane

**2.1 Treść z pliku `weedingPlaner`**  
- Przenieść etapy i zadania z pliku `weedingPlaner` do promptu lub do struktury (np. JSON/TS), którą AI uzupełnia/dopasowuje.  
- Role: **Pan Młody**, **Pani Młoda**, **Wspólnie** – w modelu `Task` dodać pole `assigneeRole` (enum lub string).  
- Timeline: na podstawie `ceremonyDate` (lub `date` wydarzenia) – AI zwraca zadania z `dueDate` rozłożone od „18 miesięcy przed” do „dzień przed”, tak by przy 6 miesiącach do ślubu też dało się wykonać sensowny podzbiór.

**2.2 Integracja OpenAI w route generowania planu**  
- W `api/events/[id]/ai/generate-plan` (lub osobny route tylko dla zadań):  
  - Jeśli `AI_PROVIDER=openai` i brak `OPENAI_API_KEY` → 400 + komunikat „Ustaw OPENAI_API_KEY w .env.local”.  
  - Jeśli klucz jest: wywołanie OpenAI (np. `gpt-4o` / `gpt-4o-mini`) z promptem zawierającym etapy z `weedingPlaner`, liczbę miesięcy do ślubu, styl wesela.  
  - Odpowiedź parsowana (np. JSON schema) do listy zadań z: tytuł, opis, rola, dueDate, kategoria.  
  - Zapis do `Task` z `weddingId`/`eventId` i `assigneeRole`.

**2.3 UI zadań**  
- Lista zadań z filtrem/oznaczeniem roli (Pan Młody / Pani Młoda / Wspólnie).  
- Przycisk „Wygeneruj plan zadań AI” wywołujący nowy/rozszerzony endpoint.  
- Zapis/odczyt jak w fazie 1 – wszystko powiązane z jednym weselem/wydarzeniem.

**Efekt**: Jedno jasne miejsce na API KEY (`.env.local` + docs), pełna lista zadań z rólami i timeline dopasowany do daty ślubu.

**Zrobione (Faza 2):**
- Model **Task**: pole `assigneeRole` (TOGETHER | BRIDE | GROOM).
- **weedingPlaner**: lista zadań w `src/lib/ai/wedding-tasks-data.ts` z etapami, rolami i `monthsBefore`; filtrowanie po miesiącach do ślubu.
- **Route** `POST /api/events/[id]/ai/generate-tasks`: Event + OpenAI (gdy klucz) lub mock; zapis zadań z `eventId`, `assigneeRole`, `dueDate`.
- **Akcja** `generateTasksAI(eventId)` + **UI**: przycisk „Wygeneruj plan zadań AI”, filtry roli (Wspólnie / Pani Młoda / Pan Młody), rola na kartach.

---

### Faza 3 – Canvas ustawienia sali ✅ Zrealizowane

**3.1 Model i API**  
- Rozszerzyć **Table**: np. `positionX`, `positionY`, `width`, `height`, `shape` (round/rect), `isCoupleTable` (boolean).  
- Opcjonalnie osobna encja **RoomElement** (DJ, scena, bar, wejście) z pozycją i wymiarami.  
- API: PATCH stołu – aktualizacja pozycji i wymiarów; zapis layoutu (np. jako JSON w `WeddingPlanVersion` lub osobna tabela `RoomLayout`).

**3.2 Frontend – canvas**  
- Biblioteka: np. **React Flow**, **Konva**, **Fabric.js** lub **Excalidraw**-podobna – umożliwiająca przeciąganie prostokątów/okręgów (stoły, DJ, scena).  
- Warstwa: tło (plan sali – opcjonalnie upload obrazka), warstwa stołów, warstwa elementów.  
- Zapis: przy zmianie pozycji – debounced request do API, żeby zapis był spójny z fazą 1.

**Efekt**: Wizualna edycja układu stołów i elementów sali z zapisem w bazie.

**Zrobione (Faza 3):**
- **Table**: pola `positionX`, `positionY`, `width`, `height`, `isCoupleTable`; API PATCH stołu z pozycją i wymiarami; API stołów używa `eventId` i `verifyEventAccess`.
- **RoomElement**: model (eventId, type: DJ/STAGE/BAR/ENTRANCE/OTHER, label, positionX, positionY, width, height); API GET/POST `/api/events/[id]/room-elements`, PATCH/DELETE `.../room-elements/[elementId]`.
- **Canvas**: komponent `RoomCanvas` – plan sali 900×600 px, przeciąganie stołów i elementów (pointer events), zapis pozycji po puszczeniu (PATCH). Zakładki na stronie Stoły: **Lista stołów** | **Układ sali**.
- **Dodaj stół**: checkbox „Stół pary młodej”. W dev bez logowania API stołów i room-elements dopuszcza dostęp przy istnieniu wydarzenia.

---

### Faza 4 – Usadzenie z preferencjami + PDF

**4.1 Reguły usadzenia**  
- Parametry: max osób przy stole, osobny stół dla pary młodej (tak/nie), lista gości z preferencjami.  
- Algorytm (w `seating-ai.ts` lub osobnym serwisie):  
  - Grupowanie po `seatingPreference` (np. „z rodziną X”, „przy znajomych z pracy”);  
  - Przydział do stołów z uwzględnieniem `dietaryPreference` (np. ten sam stół dla wegetarian przy jednym serwisie);  
  - Generowanie minimalnej liczby stołów tak, aby wszyscy się pomieścili i preferencje były maksymalnie spełnione.

**4.2 Stół pary młodej**  
- W UI: checkbox „Osobny stół dla pary młodej”; w modelu `Table` flaga `isCoupleTable`.  
- Algorytm nie przypisuje zwykłych gości do tego stołu; tylko para (opcjonalnie świadkowie – do ustalenia).

**4.3 PDF**  
- Szablon: na jedną stronę (lub kartkę A6) – numer stołu, imię i nazwisko, winietka (tekst z preferencji usadzenia lub osobne pole), dieta.  
- Biblioteka: np. **@react-pdf/renderer** lub **puppeteer** (HTML → PDF).  
- Endpoint: np. `GET api/events/[id]/seating/export-place-cards-pdf` – zwraca PDF do pobrania.

**Efekt**: Usadzenie zgodne z preferencjami, osobny stół pary młodej, drukowalne winietki z numerem stołu i dietą.

---

## Podsumowanie kolejności

| Kolejność | Element | Uzasadnienie |
|-----------|---------|--------------|
| **1** | Zapis/odczyt + API KEY (docs) + preferencje gości | Stabilna baza i konfiguracja AI; dane wejściowe pod usadzenie i PDF. |
| **2** | Generowanie zadań AI (weedingPlaner, role, timeline) | Wymaga tylko API key i spójnego zapisu; duża wartość dla użytkownika. |
| **3** | Canvas ustawienia sali | Niezależny blok; wymaga rozszerzenia modelu stołów i frontendu. |
| **4** | Usadzenie z preferencjami + stół pary młodej + PDF | Wykorzystuje preferencje i stoły; finalny output dla gości. |

---

## Gdzie podać API KEY do AI

- **Plik**: `.env.local` (lokalnie; nie jest commitowany).  
- **Zmienne**:  
  - `AI_PROVIDER=openai`  
  - `OPENAI_API_KEY=sk-...`  
- **Wzór**: `.env.example` – już zawiera te zmienne; w dokumentacji (np. `docs/KONFIGURACJA-AI.md` lub README) doprecyzować, że to miejsce na klucz OpenAI do generowania planu i zadań.

Rekomendacja: **zaczynamy od Fazy 1** (zapis/odczyt, dokumentacja API KEY, preferencje gości), potem Faza 2 (generowanie zadań AI z pliku weedingPlaner i rolami).

---

## Zaproszenia PDF – funkcja premium (karta przetargowa)

**Cel:** Profesjonalne zaproszenia ślubne w PDF jako opcja **dodatkowo płatna** i element wyróżniający oferty.

**Stan:**  
- Generowanie PDF z `pdf-lib`: szablon z ramką, wyśrodkowanym nagłówkiem, blokiem daty/miejsca, podpisem.  
- Obsługa polskich znaków (Noto Sans lub fallback WinAnsi).  
- Kolory z ankiety (primary/secondary), personalizacja po gościu.

**Propozycja produktowa:**  
- **Podstawowy plan:** eksport listy gości, winietki, usadzenie – bez gotowych zaproszeń.  
- **Plan premium / add-on:** „Profesjonalne zaproszenia PDF” – szablony A5, spójna typografia, ramka, opcjonalnie kilka wariantów kolorystycznych. Cena: jednorazowa dopłata lub w pakiecie wyższego planu.

**Wartość:** Gotowy do wydruku PDF zamiast ręcznego projektowania lub zleceń u grafika; spójność z resztą narzędzia (dane gości, wydarzenie); możliwość A/B testów szablonów i monetyzacji.
