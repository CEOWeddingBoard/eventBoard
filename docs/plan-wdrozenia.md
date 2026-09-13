# Plan Wdrożenia — Restaurant Event Software (v2.0)

## Spis treści
1. [Wizja produktu](#wizja-produktu)
2. [Mapa user stories](#mapa-user-stories)
3. [Faza 1: Kategorie eventów + fundament modelu danych](#faza-1-kategorie-eventów--fundament-modelu-danych)
4. [Faza 2: Google Calendar — rozbudowa](#faza-2-google-calendar--rozbudowa)
5. [Faza 3: System Menu A/B/C](#faza-3-system-menu-abc)
6. [Faza 4: AI — Harmonogram i Agenda](#faza-4-ai--harmonogram-i-agenda)
7. [Faza 5: Event Board z linkami](#faza-5-event-board-z-linkami)
8. [Faza 6: Uprawnienia RBAC](#faza-6-uprawnienia-rbac)
9. [Faza 7: Voice — TTS i transkrypcja](#faza-7-voice--tts-i-transkrypcja)
10. [Harmonogram i zależności](#harmonogram-i-zależności)

---

## Wizja produktu

Rozszerzenie istniejącej platformy Wedding Board o obsługę różnorodnych eventów restauracyjnych: komunii, wigilii firmowych, przyjęć okolicznościowych. Kluczowe filary nowej wersji:

1. **Elastyczność** — jeden system obsługuje wesela, komunie, wigilie i inne eventy
2. **AI-first** — harmonogram, agenda i menu generowane przez AI z akceptacją człowieka
3. **Menu A/B/C** — ustandaryzowany system wariantów menu z eksportem PDF/JPG
4. **Voice** — odsłuchiwanie agendy i notatki głosowe z transkrypcją
5. **Integracje** — pełna dwukierunkowa synchronizacja z Google Calendar
6. **Uprawnienia** — RBAC dla szefów sekcji z workflow akceptacji

---

## Mapa User Stories

```
┌─────────────────────────────────────────────────────────────────┐
│  EPIC 1: Różne typy eventów (Faza 1)                            │
│  ├── US-1.1  Wybór typu eventu przy tworzeniu                   │
│  ├── US-1.2  Dostosowanie UI do typu eventu                      │
│  ├── US-1.3  Tryb "tylko alergeny" zamiast pełnej listy gości   │
│  └── US-1.4  Usunięcie opcji BAR z room layout                  │
├─────────────────────────────────────────────────────────────────┤
│  EPIC 2: Google Calendar (Faza 2)                                │
│  ├── US-2.1  Import wydarzeń z Google Calendar do appki         │
│  ├── US-2.2  Własne pola w Google Calendar (typ, goście, menu)  │
│  └── US-2.3  Zastąpienie kalendarza e-mail Google+iCal          │
├─────────────────────────────────────────────────────────────────┤
│  EPIC 3: Menu A/B/C (Faza 3)                                     │
│  ├── US-3.1  Definiowanie wariantów menu (A, B, C, Wigilia)     │
│  ├── US-3.2  Eksport menu do PDF per para/klient                │
│  ├── US-3.3  Eksport menu do JPG                                │
│  └── US-3.4  AI — proponowanie i edycja menu                    │
├─────────────────────────────────────────────────────────────────┤
│  EPIC 4: AI Harmonogram i Agenda (Faza 4)                        │
│  ├── US-4.1  AI generuje harmonogram dnia eventu                │
│  ├── US-4.2  AI generuje finalną agendę (podsumowanie)          │
│  └── US-4.3  Workflow akceptacji agendy przez szefów sekcji     │
├─────────────────────────────────────────────────────────────────┤
│  EPIC 5: Event Board (Faza 5)                                    │
│  └── US-5.1  Konfigurowalne linki na publicznej stronie eventu  │
├─────────────────────────────────────────────────────────────────┤
│  EPIC 6: Uprawnienia RBAC (Faza 6)                               │
│  ├── US-6.1  Definiowanie ról z uprawnieniami per sekcja        │
│  ├── US-6.2  Ograniczenie dostępu na podstawie roli             │
│  └── US-6.3  Panel zarządzania uprawnieniami                    │
├─────────────────────────────────────────────────────────────────┤
│  EPIC 7: Voice (Faza 7)                                          │
│  ├── US-7.1  Odsłuchiwanie agendy głosowo (TTS)                 │
│  └── US-7.2  Notatki głosowe z automatyczną transkrypcją        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Faza 1: Kategorie eventów + fundament modelu danych

### US-1.1: Wybór typu eventu przy tworzeniu

**Jako** menadżer restauracji,
**Chcę** wybrać typ eventu (wesele/komunia/wigilia/inny) podczas tworzenia nowego wydarzenia,
**Aby** system automatycznie dostosował wymagane pola i układ dashboardu.

#### Kryteria akceptacji
- [ ] Przy tworzeniu eventu lista rozwijana z typami: `WESELE`, `KOMUNIA`, `WIGILIA`, `FIRMOWA`, `INNE`
- [ ] Wybór typu zapisywany w `Event.eventType`
- [ ] Typ eventu widoczny na liście eventów (etykieta/badge)
- [ ] Możliwość zmiany typu eventu (z ostrzeżeniem o utracie danych specyficznych dla typu)

#### Zadania techniczne
- [ ] Migracja Prisma: `eventType` w modelu `Event` z default `WEDDING`
- [ ] Enum `EventType` w TypeScript
- [ ] Aktualizacja `create-event` action
- [ ] UI: `EventTypeSelector` w dialogu tworzenia eventu
- [ ] Walidacja Zod

---

### US-1.2: Dostosowanie UI do typu eventu

**Jako** menadżer restauracji,
**Chcę** widzieć tylko pola i sekcje istotne dla wybranego typu eventu,
**Aby** nie zaśmiecać interfejsu niepotrzebnymi danymi (np. "para młoda" przy komunii).

#### Kryteria akceptacji
- [ ] `WESELE`: pełny dashboard (para młoda, goście, menu, sale, harmonogram)
- [ ] `KOMUNIA`: ukryte pola "pan młody"/"panna młoda", uproszczona lista gości, menu dziecięce
- [ ] `WIGILIA`: ukryte pole pary młodej, dedykowana sekcja menu wigilijnego, lista gości z alergenami
- [ ] `FIRMOWA`: ukryte pola ślubne, dodane pole "firma", lista gości + menu
- [ ] `INNE`: wszystkie pola opcjonalne, dowolna konfiguracja

#### Zadania techniczne
- [ ] Hook `useEventTypeConfig(eventType)` zwracający konfigurację widoczności sekcji
- [ ] Warunkowe renderowanie w dashboard layout
- [ ] Mapowanie: które modele są aktywne per typ eventu
- [ ] Testy integracyjne per typ

#### Konfiguracja per typ eventu

| Sekcja / Pole | WESELE | KOMUNIA | WIGILIA | FIRMOWA | INNE |
|---|---|---|---|---|---|
| brideName / groomName | ✅ | ❌ | ❌ | ❌ | ⬜ |
| Lista gości (pełna) | ✅ | ⬜ | ❌ | ✅ | ⬜ |
| Goście — tylko alergeny | ❌ | ✅ | ✅ | ❌ | ⬜ |
| Menu A/B/C | ✅ | ✅ | ✅ | ✅ | ⬜ |
| Sala / stoły | ✅ | ✅ | ✅ | ✅ | ⬜ |
| Harmonogram dnia | ✅ | ✅ | ✅ | ✅ | ⬜ |
| Budżet | ✅ | ❌ | ❌ | ✅ | ⬜ |
| Vendors | ✅ | ✅ | ❌ | ✅ | ⬜ |
| RSVP / portal gości | ✅ | ❌ | ❌ | ❌ | ⬜ |
| Zadania (checklista) | ✅ | ✅ | ✅ | ✅ | ⬜ |

> ✅ = domyślnie włączone / ❌ = domyślnie ukryte / ⬜ = konfigurowalne

---

### US-1.3: Tryb "tylko alergeny" zamiast pełnej listy gości

**Jako** menadżer sali bankietowej,
**Chcę** dla komunii i wigilii prowadzić tylko listę alergenów bez pełnych danych gości,
**Aby** kuchnia dostała tylko to, co jest jej potrzebne do przygotowania posiłków.

#### Kryteria akceptacji
- [ ] Nowe pole `Event.guestListMode`: `FULL` | `ALLERGENS_ONLY`
- [ ] Tryb `ALLERGENS_ONLY`: formularz z polami: imię (opcjonalne), vege ☐, gluten ☐, bezgluten ☐, inne alergie (text), uwagi
- [ ] Widok tabeli: kolumny Vege, Gluten, Bezgluten, Inne, Uwagi
- [ ] Eksport CSV/PDF listy alergenów dla kuchni
- [ ] Automatyczne ustawienie `ALLERGENS_ONLY` dla `KOMUNIA` i `WIGILIA`

#### Zadania techniczne
- [ ] Migracja Prisma: `guestListMode` w modelu `Event`
- [ ] Nowy komponent `AllergenGuestList` z uproszczonym formularzem
- [ ] Komponent `AllergenKitchenExport` (tabela + CSV + PDF)
- [ ] Integracja z istniejącym `KitchenProductionSheet.tsx`

---

### US-1.4: Usunięcie opcji BAR

**Jako** właściciel restauracji,
**Chcę** usunąć opcję "BAR" z układu sali,
**Aby** uprościć edytor i uniknąć nieporozumień (restauracja nie obsługuje baru jako osobnego elementu).

#### Kryteria akceptacji
- [ ] `BAR` usunięty z `RoomElementType` enum
- [ ] `BAR` usunięty z listy elementów w UI `AddElementDialog`
- [ ] Istniejące elementy BAR na salach oznaczone jako `OTHER` (migracja)
- [ ] `BARTENDER` usunięty z `StaffRole` w `scheduling-types.ts`

#### Zadania techniczne
- [ ] Aktualizacja: `src/components/seating/RoomCanvas.tsx:21`, `AddElementDialog.tsx:23-28`
- [ ] Aktualizacja: `src/app/[locale]/api/events/[id]/room-elements/route.ts:7`, `[elementId]/route.ts:7`
- [ ] Aktualizacja: `src/lib/venue/scheduling-types.ts:6`
- [ ] Aktualizacja: `src/app/[locale]/api/events/[id]/seating/export-layout-pdf/route.ts:170`
- [ ] Skrypt migracyjny: aktualizacja istniejących `RoomElement` z `type=BAR` → `type=OTHER`
- [ ] Lokalizacja: usunięcie kluczy `BAR` z plików tłumaczeń

---

## Faza 2: Google Calendar — rozbudowa

### US-2.1: Import wydarzeń z Google Calendar

**Jako** menadżer restauracji,
**Chcę** importować wydarzenia z firmowego Google Calendar do systemu,
**Aby** wszystkie rezerwacje były w jednym miejscu i nie musieć przepisywać danych ręcznie.

#### Kryteria akceptacji
- [ ] Przycisk "Importuj z Google Calendar" w dashboard
- [ ] Wybór kalendarza źródłowego (lista kalendarzy użytkownika)
- [ ] Wybór zakresu dat do importu
- [ ] Podgląd wydarzeń przed importem z checkboxami wyboru
- [ ] Import tworzy nowe eventy w systemie z mapowaniem pól
- [ ] Dedyplikacja: nie importuje wydarzeń, które już mają `googleEventId`

#### Zadania techniczne
- [ ] Nowa funkcja `listCalendars()` w `src/lib/google-calendar.ts`
- [ ] Nowa funkcja `importEvents()` — pobiera wydarzenia z Google API
- [ ] Mapowanie Google Event → systemowy Event
- [ ] UI: `GoogleCalendarImportDialog` z podglądem i wyborem
- [ ] Endpoint `POST /api/events/import-from-google`

---

### US-2.2: Własne pola w Google Calendar

**Jako** menadżer restauracji,
**Chcę** widzieć w Google Calendar dodatkowe informacje o evencie (typ, liczba gości, wariant menu),
**Aby** mieć pełny obraz w jednym widoku kalendarza bez wchodzenia do systemu.

#### Kryteria akceptacji
- [ ] Rozszerzenie istniejących extended properties w `google-calendar.ts`:
  - `eventType` → typ eventu
  - `guestCount` → liczba gości
  - `menuLabel` → wariant menu (A/B/C/Wigilia)
  - `status` → status eventu
- [ ] Synchronizacja tych pól w obie strony przy każdej operacji CRUD
- [ ] Widoczne w Google Calendar UI jako "Właściwości rozszerzone"

#### Zadania techniczne
- [ ] Rozszerzenie `EXTENDED_PROP_SOURCE` / `EXTENDED_PROP_ID` (już istnieją w liniach 9-10)
- [ ] Funkcja `syncExtendedProperties(eventId)` w `src/lib/google-calendar-sync.ts`
- [ ] Wywołanie przy create/update/delete eventu

---

### US-2.3: Zastąpienie kalendarza e-mail kalendarzem Google + iCal

**Jako** użytkownik systemu,
**Chcę** subskrybować kalendarz eventu przez Google Calendar lub iCal zamiast dostawać maile,
**Aby** mieć zawsze aktualny kalendarz bez zarządzania wiadomościami.

#### Kryteria akceptacji
- [ ] Inwentaryzacja: lista wszystkich miejsc gdzie system wysyła kalendarz e-mailem
- [ ] Dla każdego: zastąpienie linkiem do subskrypcji Google Calendar lub iCal feed
- [ ] Instrukcja subskrypcji w UI (Google: "Dodaj przez URL", Apple: "Subskrybuj kalendarz", Outlook)
- [ ] Zachowanie istniejącego endpointu `GET /api/calendar/feed/[token]`
- [ ] Usunięcie/usunięcie starych maili kalendarzowych (Resend)

#### Zadania techniczne
- [ ] Przegląd kodu — znalezienie wszystkich wysyłek e-mail z załącznikiem kalendarza
- [ ] Komponent `CalendarSubscribeSection` z linkami Google/Apple/Outlook/iCal
- [ ] Aktualizacja tekstów maili — zamiast załącznika `.ics` → link do subskrypcji
- [ ] Testy: weryfikacja działania feedu iCal po zmianach

---

## Faza 3: System Menu A/B/C

### US-3.1: Definiowanie wariantów menu

**Jako** szef kuchni,
**Chcę** zdefiniować kilka wariantów menu dla eventu (np. Menu A, Menu B, Menu C, Menu Wigilijne),
**Aby** klienci mogli wybrać odpowiadający im zestaw dań.

#### Kryteria akceptacji
- [ ] Nowa zakładka "Menu" w dashboard z listą wariantów
- [ ] Przycisk "Dodaj wariant menu" → formularz: nazwa (A/B/C/Wigilia), lista dań
- [ ] Każde danie: nazwa, kategoria (przystawka/zupa/danie główne/deser), alergeny (vege, gluten, bezgluten, inne)
- [ ] Drag & drop kolejności dań w wariancie
- [ ] Możliwość skopiowania całego wariantu (np. Menu A → Menu A')
- [ ] Podgląd menu w formie karty

#### Zadania techniczne
- [ ] Migracja Prisma: nowe modele `MenuVariant`, `MenuVariantCourse`
- [ ] Migracja danych: istniejące `MenuCourse` → nowy model
- [ ] Nowe komponenty: `MenuVariantList`, `MenuVariantEditor`, `MenuCourseEditor`
- [ ] Server actions: create/update/delete/reorder variant + courses
- [ ] Walidacja Zod
- [ ] Integracja z venue-side `VenueMenuPackage` (przypisywanie wariantów do pakietów)

#### Model danych

```prisma
model MenuVariant {
  id        String              @id @default(cuid())
  eventId   String
  event     Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  label     String              // "MENU A", "MENU B", "MENU C", "MENU WIGILIJNE"
  courses   MenuVariantCourse[]
  sortOrder Int                 @default(0)
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  @@map("menu_variants")
}

model MenuVariantCourse {
  id            String      @id @default(cuid())
  menuVariantId String
  menuVariant   MenuVariant @relation(fields: [menuVariantId], references: [id], onDelete: Cascade)
  name          String
  courseType    String      // APPETIZER, SOUP, MAIN, DESSERT
  description   String?
  allergens     String?     // JSON: { vege: bool, gluten: bool, bezgluten: bool, inne: string }
  sortOrder     Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@map("menu_variant_courses")
}
```

---

### US-3.2: Eksport menu do PDF per para/klient

**Jako** menadżer restauracji,
**Chcę** wyeksportować wybrane menu dla konkretnej pary młodej/klienta jako plik PDF,
**Aby** przekazać im elegancki dokument z wybranymi daniami.

#### Kryteria akceptacji
- [ ] Przycisk "Eksportuj PDF" przy każdym wariancie menu
- [ ] Szablon PDF: logo restauracji, nazwa eventu, data, wariant menu, lista dań z alergenami
- [ ] Elegancki układ (nawiązujący do istniejącego `day-export-pdf.ts`)
- [ ] PDF zapisywany w S3/R2, zwracany link do pobrania

#### Zadania techniczne
- [ ] Nowy plik `src/lib/pdf/menu-export-pdf.ts`
- [ ] Szablon PDF z użyciem `pdf-lib`
- [ ] Endpoint `GET /api/events/[id]/menu/[variantId]/export-pdf`
- [ ] Przycisk + UI w komponencie `MenuVariantList`

---

### US-3.3: Eksport menu do JPG

**Jako** menadżer restauracji,
**Chcę** wyeksportować menu jako obraz JPG,
**Aby** szybko wysłać je przez WhatsApp/Messenger lub wstawić na stronę eventu.

#### Kryteria akceptacji
- [ ] Przycisk "Eksportuj JPG" obok "Eksportuj PDF"
- [ ] Generowanie obrazu 1080×1920 (format Instagram Stories / telefon)
- [ ] Alternatywnie 1920×1080 (format landscape)
- [ ] Obraz zawiera logo, nazwę eventu, wariant menu, dania

#### Zadania techniczne
- [ ] Nowy endpoint `GET /api/events/[id]/menu/[variantId]/export-jpg`
- [ ] Generowanie JPG server-side (sharp lub html-to-image na serwerze)
- [ ] Opcjonalnie: renderowanie React component → image (użycie istniejącego `@react-pdf/renderer` lub nowy `satori`)
- [ ] UI: wybór formatu (9:16 / 16:9) przed eksportem

---

### US-3.4: AI — proponowanie i edycja menu

**Jako** szef kuchni,
**Chcę** użyć AI do zaproponowania lub zmodyfikowania menu na podstawie typu eventu i preferencji,
**Aby** zaoszczędzić czas na układaniu zestawów dań.

#### Kryteria akceptacji
- [ ] Przycisk "Zaproponuj menu z AI" w edytorze wariantów
- [ ] Przycisk "Popraw z AI" przy istniejącym menu
- [ ] AI bierze pod uwagę: typ eventu, sezon, liczbę gości, zadeklarowane alergeny, budżet
- [ ] AI zwraca propozycję dań (nazwa, opis, alergeny)
- [ ] Użytkownik może zaakceptować całość, edytować lub odrzucić
- [ ] Historia propozycji AI (możliwość cofnięcia)

#### Zadania techniczne
- [ ] Nowy moduł `src/lib/ai/menu-editor.ts`
- [ ] Prompt engineering: szablon promptu dla OpenAI/DeepSeek
- [ ] Kontekst: `eventType`, `guestCount`, `season`, `budget`, istniejące menu, historia
- [ ] Funkcja `generateMenu(prompt, context)` → `MenuAISuggestion`
- [ ] Funkcja `improveMenu(currentMenu, instructions)` → `MenuAISuggestion`
- [ ] UI: `AIMenuDialog` z loaderem, podglądem i akceptacją
- [ ] Endpoint `POST /api/events/[id]/menu/ai-suggest`
- [ ] Endpoint `POST /api/events/[id]/menu/ai-improve`

---

## Faza 4: AI — Harmonogram i Agenda

### US-4.1: AI generuje harmonogram dnia eventu

**Jako** menadżer restauracji,
**Chcę** wygenerować szczegółowy harmonogram dnia eventu jednym kliknięciem,
**Aby** nie układać ręcznie osi czasu dla każdego wydarzenia.

#### Kryteria akceptacji
- [ ] Przycisk "Generuj harmonogram (AI)" w sekcji harmonogramu
- [ ] Krótki formularz kontekstu (opcjonalnie): typ eventu, godzina rozpoczęcia, liczba gości, styl
- [ ] AI generuje listę `DayScheduleItem` z tytułem, opisem, godziną startu i końca
- [ ] Podgląd wygenerowanego harmonogramu przed zapisaniem
- [ ] Możliwość ręcznej edycji każdego elementu po wygenerowaniu
- [ ] Przycisk "Regeneruj" z możliwością dodania instrukcji ("przesuń obiad o 30 min później")

#### Zadania techniczne
- [ ] Przebudowa `src/lib/tasks/ai-timeline-generator.ts`:
  - Zamiana reguł na faktyczne wywołanie AI (OpenAI)
  - Output: `DayScheduleItem[]` zamiast `AiTimelineTask[]`
- [ ] Nowy endpoint `POST /api/events/[id]/schedule/generate`
- [ ] Uwzględnienie danych z menu (przerwy na posiłki) w harmonogramie
- [ ] UI: `AIScheduleGenerator` z loaderem i podglądem
- [ ] Integracja z Google Calendar sync po zapisaniu

---

### US-4.2: AI generuje finalną agendę

**Jako** menadżer restauracji,
**Chcę** na zakończenie procesu planowania wygenerować kompletną agendę PDF łączącą harmonogram, menu i listę gości,
**Aby** przekazać jeden dokument wszystkim zaangażowanym (kuchnia, sala, obsługa).

#### Kryteria akceptacji
- [ ] Ostatni krok w flow — przycisk "Generuj finalną agendę"
- [ ] AI agreguje: harmonogram, menu (A/B/C z przydziałem do gości), listę gości/alergenów, notatki
- [ ] Generuje ustrukturyzowany dokument PDF
- [ ] Sekcje agendy:
  - Strona tytułowa (nazwa eventu, data, typ)
  - Harmonogram dnia (oś czasu)
  - Menu (warianty z listą dań i alergenami)
  - Goście / Alergeny (tabela)
  - Notatki organizacyjne
- [ ] Przycisk "Pobierz PDF" i "Wyślij e-mailem"

#### Zadania techniczne
- [ ] Nowy moduł `src/lib/ai/agenda-generator.ts`
- [ ] Agregacja danych z wielu modeli (Event, DayScheduleItem, MenuVariant, Guest, VoiceNote)
- [ ] Prompt dla AI: strukturyzacja agendy z kontekstem
- [ ] Generowanie PDF z użyciem `pdf-lib` (szablon wielostronicowy)
- [ ] Endpoint `POST /api/events/[id]/agenda/generate`
- [ ] UI: `AgendaGenerator` w dashboard

---

### US-4.3: Workflow akceptacji agendy przez szefów sekcji

**Jako** właściciel restauracji,
**Chcę** aby każdy szef sekcji (kuchnia, sala, obsługa) zaakceptował swoją część agendy,
**Aby** finalna agenda była potwierdzona przez wszystkich odpowiedzialnych.

#### Kryteria akceptacji
- [ ] Agenda podzielona na sekcje: `SCHEDULE`, `MENU`, `GUESTS`, `KITCHEN`, `GENERAL`
- [ ] Każda sekcja ma przypisaną rolę odpowiedzialną za akceptację
- [ ] Widok approvals: lista sekcji z avatarem szefa i statusem (oczekuje ✅ / odrzucono ❌)
- [ ] Szef sekcji widzi tylko swoją część → przycisk "Akceptuję" / "Odrzucam" + opcjonalny komentarz
- [ ] Po akceptacji wszystkich sekcji → agendę można wygenerować finalnie
- [ ] Blokada generowania agendy dopóki nie ma wszystkich akceptacji
- [ ] Powiadomienia: email/push do szefa gdy jego akceptacja jest wymagana

#### Zadania techniczne
- [ ] Migracja Prisma: model `AgendaApproval`
- [ ] Rozszerzenie `SectionPermission` (z Fazy 6) o `canApprove`
- [ ] Server action `approveAgendaSection(section, comment?)`
- [ ] Server action `rejectAgendaSection(section, reason)`
- [ ] UI: `AgendaApprovalPanel` z progress barem
- [ ] UI: `AgendaSectionReview` z akceptacją/odrzuceniem
- [ ] Middleware: blokada endpointu generowania agendy
- [ ] Powiadomienia Resend dla szefów sekcji

#### Model danych

```prisma
model AgendaApproval {
  id         String   @id @default(cuid())
  eventId    String
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  section    String   // SCHEDULE, MENU, GUESTS, KITCHEN, GENERAL
  approvedBy String?  // userId — null dopóki niezaakceptowane
  approvedAt DateTime?
  status     String   @default("PENDING") // PENDING, APPROVED, REJECTED
  comment    String?

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([eventId, section])
  @@map("agenda_approvals")
}
```

---

## Faza 5: Event Board z linkami

### US-5.1: Konfigurowalne linki na publicznej stronie eventu

**Jako** menadżer restauracji,
**Chcę** dodać na publicznej stronie eventu przyciski/linki (np. do Google Maps, menu PDF, Spotify, albumu zdjęć),
**Aby** goście mieli wszystkie informacje w jednym miejscu.

#### Kryteria akceptacji
- [ ] Nowa sekcja "Linki" w dashboard → builder linków
- [ ] Dodawanie linku: nazwa (label), URL, ikona (🧭 map, 🎵 music, 📷 photos, 📄 menu, 📅 calendar)
- [ ] Drag & drop zmiany kolejności
- [ ] Toggle włącz/wyłącz per link
- [ ] Publiczna strona `/w/[slug]` wyświetla linki jako przyciski/karty
- [ ] Responsywny układ (grid na desktop, lista na mobile)

#### Zadania techniczne
- [ ] Migracja Prisma: model `EventBoardLink`
- [ ] Server actions: create/update/delete/reorder links
- [ ] Nowy komponent `EventBoardLinkBuilder` (dashboard)
- [ ] Nowy komponent `EventBoardLinks` (publiczna strona)
- [ ] Integracja z istniejącą stroną `src/app/[locale]/w/[slug]/page.tsx`
- [ ] Walidacja URL (bezpieczeństwo: tylko http/https)

#### Model danych

```prisma
model EventBoardLink {
  id        String  @id @default(cuid())
  eventId   String
  event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  label     String
  url       String
  icon      String? // map | music | camera | menu | calendar | link
  enabled   Boolean @default(true)
  sortOrder Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("event_board_links")
}
```

---

## Faza 6: Uprawnienia RBAC

### US-6.1: Definiowanie ról z uprawnieniami per sekcja

**Jako** właściciel restauracji,
**Chcę** zdefiniować role (Szef Kuchni, Manager Sali, Szef Obsługi) z konkretnymi uprawnieniami,
**Aby** każdy pracownik widział i mógł edytować tylko swoją część systemu.

#### Kryteria akceptacji
- [ ] Predefiniowane role: `OWNER`, `VENUE_MANAGER`, `KITCHEN_CHIEF`, `BANQUET_CHIEF`, `STAFF`
- [ ] Dla każdej roli konfiguracja per sekcja:
  - `SCHEDULE` — widok / edycja / akceptacja
  - `MENU` — widok / edycja / akceptacja
  - `GUESTS` — widok / edycja
  - `KITCHEN` — widok / edycja / akceptacja
  - `VENDORS` — widok / edycja
  - `SETTINGS` — widok / edycja
  - `ANALYTICS` — widok
- [ ] `OWNER` ma zawsze pełny dostęp (nieusuwalny)

#### Zadania techniczne
- [ ] Migracja Prisma: modele `Role` i `SectionPermission`
- [ ] Seed: domyślne role i uprawnienia
- [ ] Hook `usePermissions(userId, eventId)` zwracający uprawnienia
- [ ] Middleware sprawdzające `canEdit(section)` / `canView(section)` / `canApprove(section)`
- [ ] UI: `PermissionMatrix` w panelu ustawień (widoczne tylko dla OWNER)

---

### US-6.2: Ograniczenie dostępu na podstawie roli

**Jako** szef kuchni,
**Chcę** widzieć tylko sekcje MENU i KITCHEN w dashboard,
**Aby** nie rozpraszać się nieistotnymi dla mnie funkcjami.

#### Kryteria akceptacji
- [ ] Dashboard renderuje tylko sekcje, do których użytkownik ma `canView`
- [ ] Przyciski edycji/usuwania widoczne tylko przy `canEdit`
- [ ] Przyciski akceptacji widoczne tylko przy `canApprove`
- [ ] API routes sprawdzają uprawnienia przed wykonaniem operacji
- [ ] Próba dostępu do nieuprawnionej sekcji → redirect / komunikat

#### Zadania techniczne
- [ ] Wrapper `withPermission(section, action)` dla server actions
- [ ] Hook `useCan(section, action)` dla komponentów React
- [ ] Warunkowe renderowanie sidebar items
- [ ] Warunkowe renderowanie przycisków akcji w komponentach
- [ ] Testy integracyjne per rola

---

### US-6.3: Panel zarządzania uprawnieniami

**Jako** właściciel restauracji,
**Chcę** mieć panel gdzie mogę przypisać role użytkownikom i modyfikować uprawnienia,
**Aby** elastycznie zarządzać dostępem w organizacji.

#### Kryteria akceptacji
- [ ] Widok: lista użytkowników z przypisaną rolą
- [ ] Zmiana roli użytkownika (dropdown)
- [ ] Widok: macierz uprawnień (tabela: sekcje × akcje) dla wybranej roli
- [ ] Edycja uprawnień per rola (checkboxes)
- [ ] Przycisk "Reset do domyślnych" per rola
- [ ] Widoczny tylko dla OWNER

#### Zadania techniczne
- [ ] Nowa strona: `/dashboard/settings/permissions`
- [ ] Komponent `UserRoleManager` (lista użytkowników + role)
- [ ] Komponent `PermissionMatrix` (macierz uprawnień)
- [ ] Server actions: `updateUserRole()`, `updateRolePermissions()`, `resetRolePermissions()`

#### Model danych

```prisma
model Role {
  id          String              @id @default(cuid())
  eventId     String
  event       Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name        String              // KITCHEN_CHIEF, BANQUET_CHIEF, STAFF
  label       String              // "Szef Kuchni", "Szef Sali", "Obsługa"
  isSystem    Boolean             @default(false) // OWNER — nieusuwalny
  permissions SectionPermission[]

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@map("roles")
}

model SectionPermission {
  id         String  @id @default(cuid())
  roleId     String
  role       Role    @relation(fields: [roleId], references: [id], onDelete: Cascade)
  section    String  // SCHEDULE, MENU, GUESTS, KITCHEN, VENDORS, SETTINGS, ANALYTICS
  canView    Boolean @default(false)
  canEdit    Boolean @default(false)
  canApprove Boolean @default(false)

  @@unique([roleId, section])
  @@map("section_permissions")
}
```

Rozszerzenie istniejącego `EventParticipant`:

```prisma
// Dodane pole:
model EventParticipant {
  // ... istniejące pola
  roleId String?  // FK → Role (nadpisuje legacy `role` string)
}
```

---

## Faza 7: Voice — TTS i transkrypcja

### US-7.1: Odsłuchiwanie agendy głosowo (TTS)

**Jako** szef kuchni przygotowujący się do eventu,
**Chcę** odsłuchać agendę w formie audio (np. podczas dojazdu do pracy),
**Aby** przyswoić plan dnia bez czytania dokumentu.

#### Kryteria akceptacji
- [ ] Przycisk "Posłuchaj agendy" (🎧) na widoku agendy
- [ ] Generowanie audio z tekstu agendy (TTS — OpenAI / ElevenLabs)
- [ ] Odtwarzacz audio w UI:
  - Play/Pause
  - Pasek postępu
  - Podświetlanie aktualnie czytanej sekcji w tekście
- [ ] Cache: wygenerowane audio zapisywane (nie generuje ponownie dla tej samej agendy)
- [ ] Język: polski (priorytet)

#### Zadania techniczne
- [ ] Nowy moduł `src/lib/voice/tts.ts`
- [ ] Integracja z OpenAI TTS API (model `tts-1` lub `tts-1-hd`, voice `alloy`/`nova`)
- [ ] Funkcja `generateAgendaAudio(eventId)` → URL do audio
- [ ] Nowy model `AgendaAudio` (cache)
- [ ] Endpoint `POST /api/events/[id]/agenda/tts`
- [ ] Endpoint `GET /api/events/[id]/agenda/tts` (zwraca URL audio lub generuje)
- [ ] Komponent `AgendaAudioPlayer` z podświetlaniem (synchronizacja time-coded)
- [ ] Wymóg odblokowania `microphone` w `Permissions-Policy` (obecnie zablokowany w `next.config.mjs`)

---

### US-7.2: Notatki głosowe z automatyczną transkrypcją

**Jako** menadżer restauracji na spotkaniu,
**Chcę** nagrać notatkę głosową, która automatycznie zamieni się na tekst i zapisze przy evencie,
**Aby** szybko zanotować ustalenia bez pisania.

#### Kryteria akceptacji
- [ ] Przycisk mikrofonu (🎤) w dashboard — nagrywanie notatki
- [ ] Nagrywanie audio z mikrofonu (Web Audio API / MediaRecorder)
- [ ] Po zakończeniu nagrywania — automatyczna transkrypcja (Whisper API)
- [ ] Wyświetlenie transkrypcji z możliwością edycji przed zapisaniem
- [ ] Lista notatek głosowych przy evencie:
  - Data i godzina nagrania
  - Długość nagrania
  - Transkrypcja (tekst)
  - Przycisk odsłuchania oryginalnego audio
- [ ] Powiązanie notatki z konkretną sekcją (opcjonalnie: harmonogram, menu, goście)

#### Zadania techniczne
- [ ] Nowy moduł `src/lib/voice/transcription.ts`
- [ ] Integracja z OpenAI Whisper API dla transkrypcji
- [ ] Nowy model `VoiceNote`
- [ ] Upload audio do S3/R2
- [ ] Server action: `createVoiceNote(audioBlob, section?)`
- [ ] Endpoint `POST /api/events/[id]/voice-notes`
- [ ] Endpoint `GET /api/events/[id]/voice-notes`
- [ ] Komponent `VoiceNoteRecorder` (nagrywanie, wizualizacja waveform)
- [ ] Komponent `VoiceNoteList` (lista z transkrypcjami i odtwarzaczem)
- [ ] Wymóg: odblokowanie `microphone` w `Permissions-Policy` (obecnie zablokowany w `next.config.mjs`)

#### Model danych

```prisma
model VoiceNote {
  id             String   @id @default(cuid())
  eventId        String
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  audioUrl       String   // S3 URL
  transcription  String?  // tekst z Whisper
  duration       Int?     // długość w sekundach
  section        String?  // SCHEDULE, MENU, GUESTS, GENERAL (opcjonalne przypisanie)
  createdBy      String?  // userId
  createdAt      DateTime @default(now())

  @@map("voice_notes")
}
```

---

## Harmonogram i zależności

```
Tydzień 1          Tydzień 2          Tydzień 3          Tydzień 4          Tydzień 5          Tydzień 6
═══════════════════════════════════════════════════════════════════════════════════════════════════════════
│                                                                                                      │
│  FAZA 1: Kategorie eventów + BAR + alergeny                                                          │
│  ████████████████                                                                                    │
│  US-1.1 ████████                                                                                     │
│  US-1.2 ████████████                                                                                 │
│  US-1.3         ████████████                                                                         │
│  US-1.4                 ████                                                                         │
│                                                                                                      │
│  FAZA 5: Event Board                                                                                 │
│                    ████████                                                                          │
│  US-5.1            ████████                                                                          │
│                                                                                                      │
│  FAZA 2: Google Calendar                                                                             │
│                    ████████████████                                                                  │
│  US-2.3            ████████                                                                          │
│  US-2.1                    ████████                                                                  │
│  US-2.2                            ████████                                                          │
│                                                                                                      │
│                              FAZA 3: Menu A/B/C                                                      │
│                              ████████████████████████                                                │
│                              US-3.1 ████████████                                                     │
│                              US-3.2           ████████                                               │
│                              US-3.3                   ████                                           │
│                              US-3.4                         ████████                                 │
│                                                                                                      │
│                                                          FAZA 6: Uprawnienia                         │
│                                                          ████████████████                            │
│                                                          US-6.1 ████████                             │
│                                                          US-6.2         ████████                     │
│                                                          US-6.3                 ████                 │
│                                                                                                      │
│                                                                          FAZA 4: AI Agenda           │
│                                                                          ████████████████████████    │
│                                                                          US-4.1 ████████             │
│                                                                          US-4.2         ████████     │
│                                                                          US-4.3                 ████ │
│                                                                                                      │
│                                                                                      FAZA 7: Voice  │
│                                                                                      ████████████████│
│                                                                                      US-7.1 ████████ │
│                                                                                      US-7.2 ████████ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Zależności między fazami

```
Faza 1 ───┬──► Faza 3 (Menu — wymaga typów eventów)
          ├──► Faza 4 (AI Agenda — wymaga typów + menu)
          ├──► Faza 5 (Event Board — wymaga typów)
          └──► Faza 6 (Uprawnienia — wymaga typów i sekcji)

Faza 2 ─── niezależna (może iść równolegle)

Faza 3 ───► Faza 4 (AI Agenda używa menu)

Faza 6 ───► Faza 4 (US-4.3 — akceptacje używają uprawnień)

Faza 7 ─── niezależna (ale potrzebuje Fazy 4 dla US-7.1)
```

### Szacunkowy czas (dni robocze)

| Faza | US | Szacowany czas | Równolegle z |
|------|----|---------------|-------------|
| Faza 1 | 1.1–1.4 | 5 dni | — |
| Faza 5 | 5.1 | 3 dni | Faza 2 |
| Faza 2 | 2.1–2.3 | 5 dni | Faza 5 |
| Faza 3 | 3.1–3.4 | 7 dni | — |
| Faza 6 | 6.1–6.3 | 5 dni | Faza 4 |
| Faza 4 | 4.1–4.3 | 8 dni | Faza 6 |
| Faza 7 | 7.1–7.2 | 6 dni | — |

**Łącznie (sekwencyjnie): ~39 dni roboczych**
**Łącznie (z równoległością): ~25-28 dni roboczych**

---

## Podsumowanie user stories — priorytety

| Priorytet | US | Tytuł | Wartość biznesowa |
|-----------|----|-------|-------------------|
| 🔴 P0 | US-1.1 | Wybór typu eventu | Fundament — bez tego nic nie działa |
| 🔴 P0 | US-1.2 | UI per typ eventu | Niezbędne dla komunii/wigilii |
| 🔴 P0 | US-1.3 | Tryb "tylko alergeny" | Kluczowe dla kuchni |
| 🔴 P0 | US-1.4 | Usunięcie BAR | Czystość danych |
| 🟡 P1 | US-5.1 | Event Board z linkami | Szybka wygrana, widoczny efekt |
| 🟡 P1 | US-3.1 | Menu A/B/C | Core biznesowe |
| 🟡 P1 | US-3.4 | AI edycja menu | Wyróżnik rynkowy |
| 🟡 P1 | US-4.1 | AI harmonogram | Największa wartość dodana |
| 🟡 P1 | US-4.2 | AI agenda | Kluczowy deliverable |
| 🟢 P2 | US-2.1 | Import z Google Calendar | Operacyjnie ważne |
| 🟢 P2 | US-2.3 | Zastąpienie kalendarza e-mail | Redukcja kosztów maili |
| 🟢 P2 | US-4.3 | Akceptacje agendy | Workflow quality-of-life |
| 🟢 P2 | US-6.1 | Role i uprawnienia | Bezpieczeństwo |
| 🟢 P2 | US-6.2 | Ograniczenie dostępu | Bezpieczeństwo |
| 🔵 P3 | US-3.2 | PDF menu | Wygoda klienta |
| 🔵 P3 | US-3.3 | JPG menu | Wygoda klienta |
| 🔵 P3 | US-2.2 | Custom fields Google | Integracja |
| 🔵 P3 | US-6.3 | Panel uprawnień | Admin UX |
| 🔵 P3 | US-7.1 | TTS agendy | Innowacja |
| 🔵 P3 | US-7.2 | Notatki głosowe | Innowacja |
