# WEDDING AI PLANNER - PLAN NAPRAWYCZY
## Szczegółowy plan naprawczy aplikacji podzielony na sprinty

**Data utworzenia:** 2026-01-23
**Status:** Aktualny
**Szacowany czas całkowity:** 9-17 dni

---

## SPIS TREŚCI

1. [SPRINT 1: INFRASTRUKTURA I WALIDACJA](#sprint-1-infrastruktura-i-walidacja)
2. [SPRINT 2: KOMPONENTY UI](#sprint-2-komponenty-ui)
3. [SPRINT 3: INTEGRACJA I CSV](#sprint-3-integracja-i-csv)
4. [SPRINT 4: FUNKCJONALNOŚCI AI](#sprint-4-funkcjonalności-ai)
5. [SPRINT 5: TESTY E2E I INTEGRACJA](#sprint-5-testy-e2e-i-integracja)
6. [SPRINT 6: OPTYMALIZACJA I PRODUKCJA](#sprint-6-optymalizacja-i-produkcja)

---

## SPRINT 1: INFRASTRUKTURA I WALIDACJA
**Czas trwania:** 1-2 dni
**Priorytet:** Krytyczny
**Cel:** Przywrócić podstawową funkcjonalność aplikacji poprzez naprawę walidacji i obsługi danych

### Zadania główne:

#### 1.1 Naprawa schematów walidacji Zod
**Opis:** Poprawić niespójności między schematami walidacji a oczekiwaniami funkcji oraz testów.

**Podzadania:**
- **1.1.1** Analiza schematów walidacji w `/src/lib/validations/`
  - Sprawdzić wszystkie pliki: `guest.ts`, `task.ts`, `vendor.ts`, `budget.ts`, `common.ts`
  - Zidentyfikować niespójności między schematami a używaniem w akcjach

- **1.1.2** Poprawić `updateGuestSchema`
  - Usunąć wymaganie ID z schematu (ID przekazywane osobno w funkcji `updateGuest`)
  - Zaktualizować testy walidacji w `/src/__tests__/validations/guest.test.ts`

- **1.1.3** Sprawdzić pozostałe schematy
  - `updateTaskSchema`, `updateVendorSchema`, `updateBudgetItemSchema`
  - Zapewnić spójność między create/update schematami

#### 1.2 Poprawa obsługi FormData w akcjach
**Opis:** Funkcje akcji muszą konsekwentnie obsługiwać albo FormData albo zwykłe obiekty.

**Podzadania:**
- **1.2.1** Analiza funkcji akcji
  - Sprawdzić wszystkie pliki w `/src/lib/actions/`
  - Zidentyfikować które funkcje przyjmują FormData, a które obiekty

- **1.2.2** Poprawić `createEvent` w `event.actions.ts`
  - Dodać przeciążenie funkcji: jedno dla FormData, jedno dla obiektu
  - Zaktualizować testy integracyjne aby używały odpowiedniego formatu

- **1.2.3** Standaryzować podejście
  - Wszystkie akcje CRUD powinny przyjmować obiekty (nie FormData)
  - FormData powinno być obsługiwane tylko w komponentach/formularzach

#### 1.3 Naprawa testów jednostkowych akcji
**Opis:** Wszystkie testy akcji muszą przechodzić bez błędów walidacji.

**Podzadania:**
- **1.3.1** Testy gości (`guest.actions.test.ts`)
  - Poprawić mocki Prisma aby zwracały poprawne dane
  - Zaktualizować wywołania funkcji po zmianach schematów

- **1.3.2** Testy zadań (`task.actions.test.ts`)
  - Naprawić dane testowe aby przechodziły walidację
  - Sprawdzić mocki i asercje

- **1.3.3** Testy dostawców (`vendor.actions.test.ts`)
  - Poprawić oczekiwane dane w testach
  - Sprawdzić status domyślny

- **1.3.4** Testy budżetu (`budget.actions.test.ts`)
  - Zaktualizować dane testowe
  - Poprawić wywołania funkcji

### Kryteria sukcesu Sprint 1:
- [ ] Wszystkie testy walidacji przechodzą (0 błędów)
- [ ] Wszystkie testy akcji przechodzą (0 błędów)
- [ ] Funkcje create/update/delete działają dla wszystkich encji
- [ ] Aplikacja uruchamia się bez błędów konsoli

---

## SPRINT 2: KOMPONENTY UI
**Czas trwania:** 2-3 dni
**Priorytet:** Krytyczny
**Cel:** Naprawić wszystkie błędne komponenty i ich testy

### Zadania główne:

#### 2.1 Naprawa SeatingPlanVisualizer
**Opis:** Komponent nie renderuje się poprawnie w testach.

**Podzadania:**
- **2.1.1** Analiza błędów renderowania
  - Sprawdzić plik `/src/components/seating/SeatingPlanVisualizer.tsx`
  - Zidentyfikować problemy z props i stanem komponentu

- **2.1.2** Poprawić obsługę stanu ładowania
  - Dodać odpowiednie warunki dla pustych danych
  - Poprawić wyświetlanie "Nieprzypisani (X/X)" gdy nie ma gości

- **2.1.3** Zaktualizować testy komponentu
  - Poprawić dane testowe w `SeatingPlanVisualizer.test.tsx`
  - Dodać brakujące props i stany

#### 2.2 Naprawa SeatingRulesManager
**Opis:** Błędy parsowania JSON w komponencie reguł rozmieszczenia.

**Podzadania:**
- **2.2.1** Analiza problemów z JSON
  - Sprawdzić `/src/components/seating/SeatingRulesManager.tsx`
  - Problem: `JSON.parse(rule.guestIds)` gdzie `guestIds` to string "g1,g2"

- **2.2.2** Poprawić format przechowywania guestIds
  - Zmienić z stringa rozdzielanego przecinkami na JSON array
  - Zaktualizować schemat bazy danych jeśli potrzebne

- **2.2.3** Poprawić logikę wyświetlania reguł
  - Poprawić mapowanie ID gości na ich nazwy
  - Dodać obsługę błędów parsowania

- **2.2.4** Zaktualizować testy
  - Poprawić dane testowe aby używały poprawnego formatu JSON

#### 2.3 Naprawa TaskList komponentu
**Opis:** Błędy ładowania i wyświetlania zadań.

**Podzadania:**
- **2.3.1** Sprawdzić TaskList component
  - Analiza błędów w `TaskList.test.tsx`
  - Problem z tekstem "loading tasks"

- **2.3.2** Poprawić stany ładowania
  - Dodać odpowiednie warunki dla różnych stanów
  - Poprawić komunikaty błędów

- **2.3.3** Zaktualizować testy komponentu
  - Poprawić asercje i oczekiwane teksty

### Kryteria sukcesu Sprint 2:
- [ ] Wszystkie komponenty renderują się bez błędów
- [ ] Testy komponentów przechodzą (0 błędów)
- [ ] UI działa poprawnie w przeglądarce
- [ ] Brak błędów konsoli w dev tools

---

## SPRINT 3: INTEGRACJA I CSV
**Czas trwania:** 1-2 dni
**Priorytet:** Ważny
**Cel:** Naprawić integrację między modułami i eksport danych

### Zadania główne:

#### 3.1 Naprawa eksportu CSV gości
**Opis:** Nagłówki CSV nie zgadzają się z danymi.

**Podzadania:**
- **3.1.1** Analiza endpointu CSV
  - Sprawdzić `/src/app/[locale]/api/events/[id]/guests/export-csv/route.ts`
  - Porównać nagłówki z rzeczywistymi danymi

- **3.1.2** Poprawić mapowanie pól
  - Zaktualizować nagłówki aby odpowiadały polom w bazie danych
  - Poprawić kolejność kolumn

- **3.1.3** Zaktualizować testy CSV
  - Poprawić oczekiwane nagłówki w `route.test.ts`
  - Sprawdzić wszystkie przypadki testowe

#### 3.2 Poprawa testów integracyjnych
**Opis:** Testy integracyjne używają błędnych formatów danych.

**Podzadania:**
- **3.2.1** Naprawa testu tworzenia eventu
  - W `integration.test.ts` zmienić wywołanie `createEvent(object)` na `createEvent(formData)`
  - Lub stworzyć funkcję pomocniczą dla testów

- **3.2.2** Poprawić flow testów
  - Sprawdzić wszystkie kroki w teście integracyjnym
  - Zapewnić spójność danych między krokami

#### 3.3 Testy RSVP flow
**Opis:** Dodać kompleksowe testy dla funkcjonalności RSVP.

**Podzadania:**
- **3.3.1** Testy tworzenia zaproszeń
  - Testy generowania linków RSVP
  - Testy kodów QR

- **3.3.2** Testy formularza RSVP
  - Testy różnych stanów odpowiedzi (tak/nie/może)
  - Testy preferencji żywieniowych i alergii

- **3.3.3** Testy aktualizacji statusów
  - Automatyczna aktualizacja w panelu administracyjnym
  - Statystyki w czasie rzeczywistym

### Kryteria sukcesu Sprint 3:
- [ ] Eksport CSV działa poprawnie ze wszystkimi polami
- [ ] Testy integracyjne przechodzą (0 błędów)
- [ ] RSVP flow kompletny i przetestowany
- [ ] Integracja między modułami działa

---

## SPRINT 4: FUNKCJONALNOŚCI AI
**Czas trwania:** 2-3 dni
**Priorytet:** Ważny
**Cel:** Zaimplementować brakujące funkcjonalności AI zgodnie ze specyfikacją

### Zadania główne:

#### 4.1 AI Seating Planner (główna funkcjonalność)
**Opis:** Algorytm automatycznego rozmieszczania gości przy stołach.

**Podzadania:**
- **4.1.1** Implementacja kreatora stołów
  - Krok 1: Wybór kształtu stołów (okrągłe/prostokątne)
  - Krok 2: Definiowanie liczby miejsc
  - Krok 3: Przypisywanie reguł (razem/osobno/VIP)

- **4.1.2** Algorytm rozmieszczania
  - Analiza reguł i konfliktów
  - Algorytm optymalizacji (można użyć constraint satisfaction)
  - Obsługa niemożliwych do rozwiązania przypadków

- **4.1.3** Ręczne korekty
  - Drag & drop między stołami
  - Zapisywanie wersji planów

- **4.1.4** Eksport planów
  - PDF z rozmieszczeniem gości
  - Winietki i listy dla obsługi

#### 4.2 AI w module Planer (Zadania)
**Opis:** Sugestie podzadań i treści dla dostawców.

**Podzadania:**
- **4.2.1** Sugestie podzadań
  - Na podstawie typu zadania (ślub, wesele, itp.)
  - Automatyczne generowanie checklist

- **4.2.2** Generowanie treści wiadomości
  - Szablony maili do dostawców
  - Listy pytań do negocjacji

#### 4.3 AI w module Budżet
**Opis:** Optymalizacja kosztów i wykrywanie przekroczeń.

**Podzadania:**
- **4.3.1** Analiza budżetu
  - Wykrywanie przekroczeń
  - Sugestie cięć kosztów

- **4.3.2** Generowanie planów alternatywnych
  - Wersja "minimalna" vs "premium"
  - Optymalizacja według priorytetów

#### 4.4 AI w module Dostawcy
**Opis:** Wsparcie negocjacji i porównywania ofert.

**Podzadania:**
- **4.4.1** Porównywarka ofert
  - Tabela porównawcza 2-5 dostawców
  - Wizualizacja różnic cenowych

- **4.4.2** Asystent negocjacji
  - Generowanie argumentów negocjacyjnych
  - Checklisty warunków umowy

#### 4.5 Testy AI funkcjonalności
**Opis:** Kompletne pokrycie testami dla wszystkich funkcji AI.

**Podzadania:**
- **4.5.1** Testy jednostkowe algorytmów
  - Testy rozmieszczania gości z różnymi regułami
  - Testy edge cases (brak rozwiązań)

- **4.5.2** Testy integracyjne AI
  - Pełne flow z AI suggestions
  - Testy zapisywania i wczytywania planów

### Kryteria sukcesu Sprint 4:
- [ ] AI Seating Planner generuje poprawne plany stołów
- [ ] Wszystkie funkcje AI mają pełne testy jednostkowe
- [ ] AI suggestions działają we wszystkich modułach
- [ ] Możliwość ręcznych korekt planów AI

---

## SPRINT 5: TESTY E2E I INTEGRACJA
**Czas trwania:** 2-3 dni
**Priorytet:** Ważny
**Cel:** Kompletne pokrycie testami end-to-end i stabilność aplikacji

### Zadania główne:

#### 5.1 Konfiguracja Playwright
**Opis:** Skonfigurować środowisko testów E2E.

**Podzadania:**
- **5.1.1** Instalacja i konfiguracja
  - Playwright już zainstalowany, sprawdzić konfigurację
  - Skonfigurować przeglądarki (Chrome, Firefox)

- **5.1.2** Skrypt testów E2E
  - Utworzyć bazowe testy nawigacji
  - Skonfigurować test database (może SQLite in-memory)

#### 5.2 Testy kompletnego flow tworzenia wesela
**Opis:** Testy E2E dla całego procesu planowania wesela.

**Podzadania:**
- **5.2.1** Flow: Tworzenie eventu
  - Test tworzenia nowego wesela
  - Walidacja formularza

- **5.2.2** Flow: Zarządzanie gośćmi
  - Dodawanie gości pojedynczo i masowo (CSV)
  - Edycja i usuwanie gości
  - Zarządzanie household'ami

- **5.2.3** Flow: Wysyłanie zaproszeń i RSVP
  - Generowanie zaproszeń
  - Testowanie linków RSVP
  - Wypełnianie formularzy RSVP

- **5.2.4** Flow: Planowanie stołów
  - Konfiguracja sali i stołów
  - Definiowanie reguł rozmieszczenia
  - Generowanie planu AI
  - Ręczne korekty

#### 5.3 Testy funkcjonalności biznesowych
**Opis:** Testy dla wszystkich kluczowych funkcji aplikacji.

**Podzadania:**
- **5.3.1** Moduł Planer (Zadania)
  - CRUD zadań
  - Timeline view
  - Filtrowanie i sortowanie

- **5.3.2** Moduł Budżet
  - Zarządzanie pozycjami kosztowymi
  - Kategorie i statusy
  - Raporty i eksport

- **5.3.3** Moduł Dostawcy
  - Katalog dostawców
  - Porównywarka ofert
  - Statusy i notatki

#### 5.4 Testy wielojęzyczności
**Opis:** Sprawdzenie wsparcia dla polskiego i angielskiego.

**Podzadania:**
- **5.4.1** Przełączanie języków
  - Test przycisku zmiany języka
  - Zapamiętywanie preferencji

- **5.4.2** Tłumaczenia interfejsu
  - Sprawdzenie wszystkich etykiet UI
  - Tłumaczenia formularzy i komunikatów

- **5.4.3** Tłumaczenia treści
  - Szablony zaproszeń
  - E-maile i powiadomienia

#### 5.5 Code Coverage i optymalizacja testów
**Opis:** Zapewnić wysokie pokrycie kodu testami.

**Podzadania:**
- **5.5.1** Analiza pokrycia
  - Uruchomić coverage report
  - Zidentyfikować niepokryte obszary

- **5.5.2** Dodanie brakujących testów
  - Testy dla error cases
  - Testy dla edge cases

- **5.5.3** Optymalizacja wydajności testów
  - Parallel execution
  - Shared setup/teardown

### Kryteria sukcesu Sprint 5:
- [ ] Wszystkie E2E testy przechodzą
- [ ] Code coverage > 80%
- [ ] Testy wielojęzyczności przechodzą
- [ ] Pełne pokrycie krytycznych flow

---

## SPRINT 6: OPTYMALIZACJA I PRODUKCJA
**Czas trwania:** 1-2 dni
**Priorytet:** Nice to have
**Cel:** Przygotowanie aplikacji do produkcji i optymalizacja

### Zadania główne:

#### 6.1 Optymalizacja wydajności
**Opis:** Poprawić wydajność aplikacji.

**Podzadania:**
- **6.1.1** Lazy loading komponentów
  - Implementacja React.lazy dla dużych komponentów
  - Code splitting dla różnych modułów

- **6.1.2** Caching i optymalizacja
  - Next.js caching strategies
  - Database query optimization
  - Image optimization

- **6.1.3** Bundle size optimization
  - Analiza bundle size
  - Usuwanie nieużywanych zależności

#### 6.2 Poprawki UX/UI
**Opis:** Poprawić doświadczenie użytkownika.

**Podzadania:**
- **6.2.1** Responsywność
  - Testowanie na różnych urządzeniach
  - Poprawki mobile-first approach

- **6.2.2** Accessibility
  - Dodanie ARIA labels
  - Keyboard navigation
  - Screen reader support

- **6.2.3** Performance UX
  - Loading states
  - Error boundaries
  - Progressive enhancement

#### 6.3 Przygotowanie do deploymentu
**Opis:** Skonfigurować środowisko produkcyjne.

**Podzadania:**
- **6.3.1** Konfiguracja CI/CD
  - GitHub Actions workflow
  - Automated testing
  - Build optimization

- **6.3.2** Environment setup
  - Production database (PostgreSQL)
  - Environment variables
  - Secrets management

- **6.3.3** Monitoring i logging
  - Error tracking (Sentry)
  - Performance monitoring
  - Analytics setup

#### 6.4 Dokumentacja
**Opis:** Utworzyć kompletną dokumentację.

**Podzadania:**
- **6.4.1** Dokumentacja API
  - OpenAPI/Swagger specs
  - Endpoint documentation

- **6.4.2** User documentation
  - User guide
  - FAQ
  - Video tutorials

- **6.4.3** Developer documentation
  - Code documentation
  - Architecture decisions
  - Deployment guide

### Kryteria sukcesu Sprint 6:
- [ ] Aplikacja zoptymalizowana pod kątem wydajności
- [ ] UX/UI spełnia standardy dostępności
- [ ] Środowisko CI/CD skonfigurowane
- [ ] Dokumentacja kompletna
- [ ] Gotowa do deploymentu produkcyjnego

---

## MONITOROWANIE POSTĘPU

### Metryki sukcesu:
- **Sprint 1-3:** 0 błędów w testach, aplikacja uruchamia się
- **Sprint 4:** Wszystkie funkcjonalności AI działają
- **Sprint 5:** Code coverage > 80%, E2E testy przechodzą
- **Sprint 6:** Performance benchmarks spełnione

### Ryzyka i zależności:
- **Zewnętrzne API:** OpenAI dla funkcji AI
- **Baza danych:** Migracja z SQLite do PostgreSQL
- **Hosting:** Konfiguracja Vercel/Netlify

### Kontrola jakości:
- **Code Review:** Wszystkie zmiany zatwierdzane przez code review
- **Automated Testing:** Wszystkie testy muszą przechodzić przed merge
- **Manual Testing:** Krytyczne funkcjonalności testowane manualnie

---

**Legenda priorytetów:**
- 🔴 Krytyczny - aplikacja nie działa bez tego
- 🟡 Ważny - kluczowa funkcjonalność biznesowa
- 🟢 Nice to have - poprawa jakości

**Status:** Plan gotowy do realizacji