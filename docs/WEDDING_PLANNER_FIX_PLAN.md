# 🛠️ PLAN NAPRAWY WEDDING AI PLANNER - WERSJA TESTOWA

**Data utworzenia**: 2026-01-23
**Metodologia**: Agile/Scrum - sprinty 3-5 dni każdy
**Cel**: W pełni funkcjonalna aplikacja testowa działająca lokalnie z 3 kontami testowymi

---

## 🎯 OBECNA SYTUACJA APLIKACJI

### ✅ Co już działa:
- Struktura Next.js 15 z App Router
- Routing wielojęzyczny ([locale])
- TailwindCSS + shadcn/ui
- Prisma ORM z SQLite
- Clerk authentication (częściowo zaimplementowany)
- Podstawowe komponenty UI

### ❌ Krytyczne problemy:
1. **Autentykacja**: Nadal używa Clerk zamiast lokalnej z 3 kontami testowymi
2. **Baza danych**: SQLite zamiast PostgreSQL
3. **Build**: Błędy TypeScript i ESLint
4. **Routing**: Możliwe konflikty między ścieżkami
5. **Funkcjonalności**: Brakuje pełnej implementacji wszystkich modułów (tasks, guests, budget, seating, vendors)
6. **UI/UX**: Brak loading states, error states, empty states

---

## 🚀 PLAN NAPRAWY - SPRINTY

### SPRINT 1: KRYTYCZNE NAPRAWY (3 dni)
**Sprint Goal**: Aplikacja buduje się i uruchamia bez błędów

#### Zadania:
1. **Naprawa błędów TypeScript** (1 dzień)
   - `npm run build` przechodzi bez błędów
   - Naprawić wszystkie błędy typu w komponentach

2. **Migracja autentykacji na lokalną** (1 dzień)
   - Usunąć wszystkie referencje do Clerk
   - Zaimplementować system 3 kont testowych:
     - **Pani Młoda** (bride@example.com) - pełny dostęp do wszystkiego
     - **Pan Młody** (groom@example.com) - pełny dostęp do wszystkiego
     - **Gość** (guest@example.com) - tylko RSVP i podgląd
   - Switch w UI: "Tryb deweloperski" - pomija logowanie

3. **Naprawa routingu** (1 dzień)
   - Usunąć konflikty między ścieżkami
   - Ujednolicić strukturę `[locale]/(dashboard)/`

#### ✅ Kryteria akceptacji:
- `npm run build` - sukces bez błędów
- `npm run dev` - aplikacja uruchamia się
- Logowanie działa z 3 kontami testowymi
- Nawigacja między wszystkimi sekcjami działa

---

### SPRINT 2: BAZA DANYCH I INFRASTRUKTURA (4 dni)
**Sprint Goal**: PostgreSQL działa, aplikacja połączona z bazą

#### Zadania:
1. **Migracja na PostgreSQL** (2 dni)
   - Zmienić schema.prisma na PostgreSQL
   - Zaktualizować docker-compose.yml
   - Przeprowadzić migrację danych

2. **Seed danych testowych** (1 dzień)
   - Utworzyć przykładowe wydarzenie ślubne
   - Dodać testowych gości, zadania, budżet
   - Wypełnić wszystkie tabele przykładowymi danymi

3. **Testy połączenia z bazą** (1 dzień)
   - Wszystkie API routes działają
   - CRUD operations dla wszystkich modeli

#### ✅ Kryteria akceptacji:
- PostgreSQL container działa
- `npx prisma migrate dev` - sukces
- `npx prisma db seed` - wypełnia bazę danymi testowymi
- Wszystkie API endpoints zwracają dane

---

### SPRINT 3: ZADANIA I BUDŻET (4 dni)
**Sprint Goal**: Pełna funkcjonalność zarządzania zadaniami i budżetem

#### Zadania:
1. **Kompletny moduł zadań** (2 dni)
   - Lista zadań z filtrowaniem i sortowaniem
   - Dodawanie/edycja/usuwanie zadań
   - Statusy: TODO, IN_PROGRESS, DONE
   - Priorytety i kategorie

2. **Kompletny moduł budżetu** (2 dni)
   - Lista pozycji budżetowych
   - Dodawanie kategorii wydatków
   - Śledzenie kosztów planowanych vs rzeczywistych
   - Podsumowanie budżetu z wykresami

#### ✅ Kryteria akceptacji:
- Można tworzyć, edytować, usuwać zadania
- Zadania mają statusy, priorytety, terminy
- Budżet pokazuje wszystkie pozycje z kategoriami
- Wykresy budżetu wyświetlają się poprawnie

---

### SPRINT 4: GOŚCIE I STOŁY (5 dni)
**Sprint Goal**: Kompletne zarządzanie gośćmi i planowanie stołów

#### Zadania:
1. **Zaawansowany moduł gości** (2 dni)
   - Lista gości z wyszukiwaniem i filtrowaniem
   - Import/eksport CSV
   - Zarządzanie household'ami (grupami gości)
   - RSVP system z tokenami

2. **System usadzenia gości** (2 dni)
   - Tworzenie stołów z różnymi kształtami
   - Przeciąganie gości między stołami (drag & drop)
   - Reguły usadzenia (musi siedzieć razem, nie może siedzieć razem)
   - Zapisywanie wersji planu stołów

3. **Integracja gości ze stołami** (1 dzień)
   - Wizualizacja rozmieszczenia gości
   - Statystyki zajętości stołów

#### ✅ Kryteria akceptacji:
- Można dodać wszystkich gości ślubu
- Import CSV działa poprawnie
- Można utworzyć stoły i przeciągać gości
- System zapisuje różne wersje planu stołów

---

### SPRINT 5: DOSTAWCY I AI (5 dni)
**Sprint Goal**: Zarządzanie dostawcami + AI do planowania

#### Zadania:
1. **Moduł dostawców** (2 dni)
   - Lista dostawców z kategoriami (catering, muzyka, foto, etc.)
   - Dodawanie kontaktów i notatek
   - Porównywarka dostawców

2. **Integracja OpenAI** (2 dni)
   - Konfiguracja API key
   - AI do generowania planu ślubu
   - AI do sugestii budżetu
   - AI do planowania usadzenia

3. **Rate limiting dla AI** (1 dzień)
   - Ograniczenie wywołań AI (np. 5/h dla testów)

#### ✅ Kryteria akceptacji:
- Można dodać wszystkich dostawców ślubu
- Porównywarka pokazuje oferty obok siebie
- AI generuje spersonalizowane plany ślubu
- Rate limiting chroni przed nadużyciami

---

### SPRINT 6: UI/UX POLISH (4 dni)
**Sprint Goal**: Profesjonalne UI z pełną obsługą stanów

#### Zadania:
1. **Loading states** (1 dzień)
   - Skeleton loaders dla wszystkich list
   - Loading spinners dla akcji
   - Suspense boundaries

2. **Error states** (1 dzień)
   - Error boundaries dla komponentów
   - Error messages dla API failures
   - Retry mechanisms

3. **Empty states** (1 dzień)
   - Puste stany dla wszystkich sekcji
   - Call-to-action buttons
   - Przydatne komunikaty

4. **Responsive design** (1 dzień)
   - Testy na różnych urządzeniach
   - Poprawki layoutu dla mobile

#### ✅ Kryteria akceptacji:
- Wszystkie komponenty mają loading states
- Błędy są obsługiwane gracefully
- Puste listy pokazują pomocne komunikaty
- Aplikacja działa płynnie na wszystkich urządzeniach

---

### SPRINT 7: TESTY I WDROŻENIE (3 dni)
**Sprint Goal**: Stabilna wersja testowa gotowa do użycia

#### Zadania:
1. **Testy funkcjonalne** (1 dzień)
   - Testy dla głównych flow (CRUD operations)
   - Testy integracyjne API
   - Zwiększenie pokrycia testami do 70%

2. **E2E testy** (1 dzień)
   - Testy pełnych scenariuszy (od logowania do RSVP)
   - Testy drag & drop dla stołów

3. **Finalne testy i dokumentacja** (1 dzień)
   - Testy manualne wszystkich funkcjonalności
   - Zaktualizowana dokumentacja README
   - Cleanup kodu

#### ✅ Kryteria akceptacji:
- Wszystkie główne funkcjonalności działają
- Testy przechodzą z >70% pokryciem
- Dokumentacja opisuje jak używać aplikacji
- Aplikacja jest stabilna i gotowa do testów

---

## 📊 SZACOWANE CZASY I PRIORYTETY

### Łączne statystyki:
- **Sprintów**: 7
- **Czas**: ~28 dni (4 tygodnie)
- **Priorytet**: 🔴 Krytyczny - Sprinty 1-2 (infrastruktura)
- **Priorytet**: 🟡 Ważny - Sprinty 3-5 (funkcjonalności)
- **Priorytet**: 🟢 Nice to have - Sprinty 6-7 (polish)

### Dzienny plan pracy:
- **Sprint 1-2**: 6-8h/dzień (krytyczne naprawy)
- **Sprint 3-5**: 8-10h/dzień (implementacja funkcjonalności)
- **Sprint 6-7**: 4-6h/dzień (polish i testy)

---

## 🔧 TECHNICZNE SZCZEGÓŁY IMPLEMENTACJI

### System autentykacji deweloperskiej:
```typescript
// src/lib/auth/dev-auth.ts
export const DEV_USERS = {
  BRIDE: { email: 'bride@example.com', name: 'Pani Młoda', role: 'bride' },
  GROOM: { email: 'groom@example.com', name: 'Pan Młody', role: 'groom' },
  GUEST: { email: 'guest@example.com', name: 'Gość', role: 'guest' }
};

export function getDevUser(email: string) {
  return Object.values(DEV_USERS).find(user => user.email === email);
}
```

### Switch w UI:
```typescript
// src/components/dev-mode-switch.tsx
export function DevModeSwitch() {
  const [isDevMode, setIsDevMode] = useState(true);

  if (!isDevMode) return null;

  return (
    <Select onValueChange={(value) => loginAsDevUser(value)}>
      <option value="bride">Pani Młoda</option>
      <option value="groom">Pan Młody</option>
      <option value="guest">Gość</option>
    </Select>
  );
}
```

### Migracja na PostgreSQL:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Struktura projektu docelowa:
```
src/
├── app/[locale]/(dashboard)/
│   ├── layout.tsx
│   ├── page.tsx (dashboard główny)
│   ├── tasks/page.tsx
│   ├── budget/page.tsx
│   ├── guests/page.tsx
│   ├── seating/page.tsx
│   └── vendors/page.tsx
├── lib/
│   ├── auth/dev-auth.ts (nowy system auth)
│   ├── db/ (repozytoria)
│   ├── ai/ (OpenAI integration)
│   └── ui/ (loading, error, empty states)
└── components/
    ├── tasks/
    ├── guests/
    ├── budget/
    └── ...
```

---

## ✅ DEFINICJA DONE DLA KAŻDEGO SPRINTU

### Sprint 1: DONE gdy:
- ✅ `npm run build` - zero błędów
- ✅ `npm run dev` - aplikacja uruchamia się
- ✅ Można się zalogować jako każde z 3 kont testowych
- ✅ Wszystkie strony dashboard'u są dostępne

### Sprint 2: DONE gdy:
- ✅ PostgreSQL container działa
- ✅ Baza jest wypełniona przykładowymi danymi
- ✅ Wszystkie API routes zwracają poprawne dane

### Sprint 3: DONE gdy:
- ✅ Można zarządzać wszystkimi zadaniami ślubu
- ✅ Budżet pokazuje wszystkie koszty z wykresami
- ✅ Można śledzić postępy prac

### Sprint 4: DONE gdy:
- ✅ Lista gości jest kompletna z RSVP
- ✅ Można przeciągać gości między stołami
- ✅ Plan stołów można zapisywać i wersjonować

### Sprint 5: DONE gdy:
- ✅ Wszyscy dostawcy są dodani i skategoryzowani
- ✅ AI generuje spersonalizowane plany
- ✅ Rate limiting działa

### Sprint 6: DONE gdy:
- ✅ Wszystkie komponenty mają loading/error/empty states
- ✅ Aplikacja działa płynnie na mobile
- ✅ UX jest profesjonalne

### Sprint 7: DONE gdy:
- ✅ Wszystkie funkcjonalności działają end-to-end
- ✅ Testy pokrywają główne scenariusze
- ✅ Dokumentacja jest kompletna

---

## 🚨 RYZYKA I MITIGACJE

### Ryzyka techniczne:
1. **Migracja bazy**: Backup SQLite przed migracją
2. **OpenAI API**: Fallback na mock data jeśli API niedostępne
3. **Performance**: Implementacja pagination dla dużych list

### Ryzyka biznesowe:
1. **Zakres**: Skupienie na MVP - pełna funkcjonalność bez over-engineering
2. **Czas**: Dzienny limit 8h - realistyczne szacunki
3. **Zależności**: Wszystkie zewnętrzne API mają fallbacks

---

## 🎯 KOŃCOWY EFEKT

Po zakończeniu wszystkich sprintów będziesz miał:

- **W pełni funkcjonalną aplikację ślubną** działającą lokalnie
- **3 konta testowe** (pani młoda, pan młody, gość) bez potrzeby logowania
- **Wszystkie moduły** (zadania, budżet, goście, stoły, dostawcy)
- **AI assistance** do planowania ślubu
- **Profesjonalne UI** z pełną obsługą błędów i stanów ładowania
- **PostgreSQL bazę** z kompletnymi danymi testowymi

Aplikacja będzie gotowa do demonstracji i dalszego rozwoju!

---

**Gotowy do rozpoczęcia Sprint 1? Zacznijmy od krytycznych napraw!** 🚀