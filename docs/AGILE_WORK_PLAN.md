# 📋 PLAN PRACY AGILE - Wedding Planner

**Data utworzenia**: 2025-01-15  
**Metodologia**: Agile/Scrum - małe, wykonalne zadania (1-4h każdy)  
**Cel**: Przygotowanie aplikacji do produkcji

---

## 🎯 SPRINT 1: KRYTYCZNE NAPRAWY (Priorytet 1)

### Sprint Goal: Aplikacja musi się budować i działać poprawnie

#### Task 1.2.1: Naprawa błędu TypeScript w `src/app/api/rsvp/route.ts`
**Szacunek**: 1-2h
**Priorytet**: 🔴 Krytyczny
**Opis**: Naprawić błąd build związany z nieprawidłowymi params w route handler
**Status**: ✅ **WYKONANE**
**Akceptacja**:
- [x] `npm run build` przechodzi bez błędów dla tego pliku (TypeScript errors naprawione)
- [x] Route działa poprawnie z prawidłowymi parametrami (zmienione wyszukiwanie z `id` na `invitationToken`)
- [x] Kod używa prawidłowych pól z modelu Guest w Prisma schema

---

#### Task 1.2.1.1: Naprawa błędu middleware w `src/middleware.ts`
**Szacunek**: 1h
**Priorytet**: 🔴 Krytyczny
**Opis**: Naprawić nieprawidłowe użycie `clerkMiddleware` z callback function
**Status**: ✅ **WYKONANE**
**Akceptacja**:
- [x] Middleware używa prawidłowej składni Clerk v6
- [x] Usunięte nieprawidłowe wywołanie `clerkMiddleware()(request)`
- [x] TypeScript errors w middleware.ts naprawione

---

#### Task 1.2.2: Naprawa pozostałych błędów TypeScript w buildzie
**Szacunek**: 2-3h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Uruchomić `npm run build`, zidentyfikować wszystkie błędy TypeScript i naprawić je  
**Status**: 🔄 **W TRAKCIE** - TypeScript errors naprawione, ale build się zawiesza
**Problemy zidentyfikowane**:
- Build Next.js się zatrzymuje po ~45+ sekundach, prawdopodobnie z powodu `output: "standalone"` w `next.config.js`
- Dla development build zalecane jest tymczasowe wyłączenie standalone output
**Akceptacja**:
- [x] `npm run build` przechodzi bez błędów TypeScript (naprawione middleware i RSVP route)
- [x] Wszystkie typy są poprawne
- [ ] `npm run build` kończy się sukcesem (wymaga dalszego investigation)

---

#### Task 1.2.3: Naprawa błędów ESLint
**Szacunek**: 1-2h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Naprawić wszystkie błędy ESLint zgłoszone podczas builda  
**Akceptacja**:
- [ ] `npm run build` przechodzi bez błędów ESLint
- [ ] `npm run lint` przechodzi bez błędów

---

#### Task 1.3.1: Zastąpienie loading states w `task-list.tsx`
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zastąpić `<p>Loading tasks...</p>` przez `<SkeletonTable>`  
**Akceptacja**:
- [ ] Komponent używa `<SkeletonTable>` podczas ładowania
- [ ] Brak prostych `<p>Loading...</p>` w komponencie

---

#### Task 1.3.2: Zastąpienie loading states w `guest-list.tsx`
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zastąpić `<p>Loading guests...</p>` przez `<SkeletonTable>`  
**Akceptacja**:
- [ ] Komponent używa `<SkeletonTable>` podczas ładowania
- [ ] Brak prostych `<p>Loading...</p>` w komponencie

---

#### Task 1.3.3: Zastąpienie loading states w `GuestsClient.tsx`
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zastąpić `<p>Loading guests...</p>` przez odpowiedni skeleton loader  
**Akceptacja**:
- [ ] Komponent używa skeleton loadera podczas ładowania
- [ ] Brak prostych `<p>Loading...</p>` w komponencie

---

#### Task 1.3.4: Dodanie ErrorState do wszystkich komponentów list
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zastąpić wszystkie `<p className="text-red-500">` przez komponent `ErrorState`  
**Komponenty do sprawdzenia**: `task-list`, `guest-list`, `budget-summary`, `vendor-list`  
**Akceptacja**:
- [ ] Wszystkie komponenty używają `ErrorState` zamiast prostych `<p>` z błędami
- [ ] Błędy są wyświetlane w spójny sposób

---

#### Task 1.3.5: Dodanie EmptyState do wszystkich komponentów list
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać komponenty `EmptyState` dla pustych list w `task-list`, `guest-list`, `vendor-list`  
**Akceptacja**:
- [ ] Wszystkie puste listy wyświetlają `EmptyState`
- [ ] EmptyState zawiera odpowiedni komunikat i akcję (jeśli potrzebna)

---

## 🛡️ SPRINT 2: BEZPIECZEŃSTWO - Rate Limiting (Priorytet 2.1)

### Sprint Goal: Ochrona przed nadużyciami API

#### Task 2.1.1: Instalacja i konfiguracja `@upstash/ratelimit`
**Szacunek**: 1h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Zainstalować `@upstash/ratelimit` i `@upstash/redis`, skonfigurować połączenie  
**Akceptacja**:
- [ ] Biblioteki zainstalowane
- [ ] Konfiguracja Upstash Redis w `.env.local`
- [ ] Helper function do tworzenia rate limitera

---

#### Task 2.1.2: Utworzenie middleware rate limiting
**Szacunek**: 2h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Utworzyć middleware w `src/middleware.ts` z rate limiting dla wszystkich requestów  
**Akceptacja**:
- [ ] Middleware sprawdza rate limit przed każdym requestem
- [ ] Zwraca 429 Too Many Requests gdy limit przekroczony
- [ ] Loguje próby przekroczenia limitu

---

#### Task 2.1.3: Dodanie rate limiting do API routes - podstawowe limity
**Szacunek**: 2h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Dodać rate limiting do wszystkich API routes w `[locale]/api/events/` z podstawowymi limitami (np. 100 req/min)  
**Akceptacja**:
- [ ] Wszystkie API routes mają rate limiting
- [ ] Podstawowe limity są ustawione
- [ ] Testy potwierdzają działanie

---

#### Task 2.1.4: Specjalne limity dla AI endpoints
**Szacunek**: 1h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Dodać bardziej restrykcyjne limity dla `/api/events/[id]/ai/generate-plan` (np. 5 req/godzina)  
**Akceptacja**:
- [ ] AI endpoint ma specjalne, niższe limity
- [ ] Zwraca odpowiedni komunikat o limicie
- [ ] Testy potwierdzają działanie

---

#### Task 2.1.5: Rate limiting dla form submissions
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać rate limiting dla formularzy (RSVP, guest import, etc.) - np. 10 submissions/godzinę  
**Akceptacja**:
- [ ] Formularze mają rate limiting
- [ ] Użytkownik widzi komunikat o przekroczeniu limitu
- [ ] Testy potwierdzają działanie

---

#### Task 2.1.6: Różne limity dla różnych typów użytkowników
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zaimplementować różne limity dla free/premium użytkowników (jeśli istnieje system subskrypcji)  
**Akceptacja**:
- [ ] Premium użytkownicy mają wyższe limity
- [ ] Free użytkownicy mają standardowe limity
- [ ] Logika jest testowana

---

## 🛡️ SPRINT 3: BEZPIECZEŃSTWO - Sanitization i CORS (Priorytet 2.2, 2.3)

### Sprint Goal: Ochrona przed XSS i atakami CSRF

#### Task 2.2.1: Instalacja i konfiguracja DOMPurify
**Szacunek**: 1h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Zainstalować `isomorphic-dompurify` i utworzyć helper function do sanitizacji HTML  
**Akceptacja**:
- [ ] Biblioteka zainstalowana
- [ ] Helper function `sanitizeHtml()` w `src/lib/security.ts`
- [ ] Helper jest testowany

---

#### Task 2.2.2: Sanityzacja stringów przed zapisem do DB
**Szacunek**: 3h  
**Priorytet**: 🔴 Krytyczny  
**Opis**: Dodać sanityzację wszystkich user inputs przed zapisem do bazy danych w API routes  
**Lokalizacje**: Wszystkie POST/PUT/PATCH endpoints w `[locale]/api/events/`  
**Akceptacja**:
- [ ] Wszystkie stringi są sanityzowane przed zapisem
- [ ] HTML content jest sanityzowany przez DOMPurify
- [ ] Testy potwierdzają sanityzację

---

#### Task 2.2.3: Sanityzacja w formularzach po stronie klienta
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać sanityzację w komponentach formularzy (RSVP, guest form, etc.)  
**Akceptacja**:
- [ ] Formularze sanityzują input przed wysłaniem
- [ ] XSS attempts są blokowane
- [ ] Testy potwierdzają działanie

---

#### Task 2.3.1: Konfiguracja CORS w `next.config.js`
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Skonfigurować CORS headers w `next.config.js` dla API routes  
**Akceptacja**:
- [ ] CORS jest skonfigurowany
- [ ] Dozwolone origins są zdefiniowane
- [ ] Testy z różnymi originami przechodzą

---

#### Task 2.3.2: Dodanie CSRF tokens dla form submissions
**Szacunek**: 3h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zaimplementować CSRF protection dla wszystkich form submissions  
**Akceptacja**:
- [ ] CSRF tokens są generowane i weryfikowane
- [ ] Wszystkie formularze używają CSRF tokens
- [ ] Testy potwierdzają ochronę CSRF

---

#### Task 2.3.3: Testy CORS z różnymi originami
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Przetestować CORS z różnymi originami (dozwolone i niedozwolone)  
**Akceptacja**:
- [ ] Testy przechodzą dla dozwolonych origins
- [ ] Testy blokują niedozwolone origins
- [ ] Dokumentacja CORS jest zaktualizowana

---

## 🤖 SPRINT 4: INTEGRACJA AI (Priorytet 3.1)

### Sprint Goal: Prawdziwa integracja AI zamiast mock

#### Task 3.1.1: Konfiguracja OpenAI/Anthropic API key
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać API key do `.env.local`, zaktualizować `src/lib/ai.ts` do używania prawdziwego providera  
**Akceptacja**:
- [ ] API key jest w `.env.local`
- [ ] `src/lib/ai.ts` używa prawdziwego providera (nie mock)
- [ ] `.env.example` zawiera placeholder dla API key

---

#### Task 3.1.2: Implementacja prawdziwych AI calls
**Szacunek**: 3h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zaimplementować prawdziwe wywołania AI w `src/app/[locale]/api/events/[id]/ai/generate-plan/route.ts`  
**Akceptacja**:
- [ ] AI endpoint używa prawdziwego API
- [ ] Generuje prawdziwe plany wydarzeń
- [ ] Testy potwierdzają działanie

---

#### Task 3.1.3: Dodanie retry logic dla AI calls
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać retry logic z exponential backoff dla AI calls  
**Akceptacja**:
- [ ] Retry logic działa dla timeoutów
- [ ] Retry logic działa dla rate limit errors
- [ ] Maksymalna liczba retries jest skonfigurowana

---

#### Task 3.1.4: Error handling dla AI failures
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać comprehensive error handling dla różnych typów błędów AI (timeout, rate limit, invalid response, etc.)  
**Akceptacja**:
- [ ] Wszystkie typy błędów są obsługiwane
- [ ] Użytkownik widzi odpowiednie komunikaty błędów
- [ ] Błędy są logowane

---

#### Task 3.1.5: Cache'owanie odpowiedzi AI w Redis/DB
**Szacunek**: 3h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Zaimplementować cache'owanie odpowiedzi AI w Redis lub DB, aby uniknąć ponownych wywołań dla tych samych parametrów  
**Akceptacja**:
- [ ] Odpowiedzi AI są cache'owane
- [ ] Cache ma TTL (np. 24h)
- [ ] Cache jest invalidowany gdy potrzebne
- [ ] Testy potwierdzają działanie cache

---

## 📄 SPRINT 5: PDF EXPORT (Priorytet 3.2)

### Sprint Goal: Eksport planowania stołów do PDF

#### Task 3.2.1: Instalacja biblioteki do generowania PDF
**Szacunek**: 1h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Zainstalować `react-pdf` lub `jsPDF` + `html2canvas`  
**Akceptacja**:
- [ ] Biblioteka zainstalowana
- [ ] Wybór biblioteki jest udokumentowany

---

#### Task 3.2.2: Implementacja generowania PDF z tabelami
**Szacunek**: 4h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Zaimplementować generowanie PDF z wszystkimi stołami i gośćmi w `SeatingPrintView.tsx`  
**Akceptacja**:
- [ ] PDF zawiera wszystkie stoły
- [ ] PDF zawiera listę gości przy każdym stole
- [ ] Layout PDF jest czytelny

---

#### Task 3.2.3: Dodanie winietek dla każdego gościa
**Szacunek**: 3h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Dodać możliwość generowania winietek (place cards) dla każdego gościa w PDF  
**Akceptacja**:
- [ ] PDF zawiera winietki dla wszystkich gości
- [ ] Winietki zawierają imię i nazwisko
- [ ] Winietki są odpowiednio sformatowane

---

#### Task 3.2.4: Testy wydruku i poprawki layoutu
**Szacunek**: 2h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Przetestować wydruk PDF, poprawić layout jeśli potrzebne  
**Akceptacja**:
- [ ] PDF wygląda dobrze po wydruku
- [ ] Wszystkie elementy są widoczne
- [ ] Layout jest responsywny dla różnych rozmiarów papieru

---

## 🔍 SPRINT 6: PORÓWNYWARKA DOSTAWCÓW (Priorytet 3.3)

### Sprint Goal: Funkcja porównywania dostawców

#### Task 3.3.1: Utworzenie komponentu `VendorComparison`
**Szacunek**: 3h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Stworzyć komponent `VendorComparison.tsx` z podstawową strukturą  
**Akceptacja**:
- [ ] Komponent istnieje
- [ ] Komponent przyjmuje listę dostawców jako props
- [ ] Komponent renderuje się poprawnie

---

#### Task 3.3.2: Dodanie możliwości wyboru wielu dostawców
**Szacunek**: 2h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Dodać UI do wyboru wielu dostawców do porównania (checkboxes lub multi-select)  
**Akceptacja**:
- [ ] Użytkownik może wybrać wielu dostawców
- [ ] Wybór jest wizualnie oznaczony
- [ ] Można odznaczyć dostawców

---

#### Task 3.3.3: Implementacja tabeli porównawczej
**Szacunek**: 4h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Wyświetlić porównanie w tabeli z kolumnami: cena, rating, dostępność, usługi, etc.  
**Akceptacja**:
- [ ] Tabela wyświetla wszystkie wybrane dostawców
- [ ] Wszystkie kolumny są wypełnione danymi
- [ ] Tabela jest responsywna

---

#### Task 3.3.4: Dodanie sortowania i filtrowania
**Szacunek**: 2h  
**Priorytet**: 🟢 Nice to have  
**Opis**: Dodać sortowanie po kolumnach i filtrowanie po kategoriach  
**Akceptacja**:
- [ ] Użytkownik może sortować po każdej kolumnie
- [ ] Użytkownik może filtrować po kategoriach
- [ ] Sortowanie i filtrowanie działają razem

---

## 🧪 SPRINT 7: TESTY (Priorytet 4.1)

### Sprint Goal: Zwiększenie pokrycia testami do >80%

#### Task 4.1.1: Analiza obecnego pokrycia testami
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Uruchomić `npm test -- --coverage` i zidentyfikować obszary bez testów  
**Akceptacja**:
- [ ] Raport coverage jest wygenerowany
- [ ] Lista komponentów bez testów jest zidentyfikowana
- [ ] Priorytety testów są ustalone

---

#### Task 4.1.2: Testy dla brakujących komponentów - część 1
**Szacunek**: 4h  
**Priorytet**: 🟡 Ważny  
**Opis**: Napisać testy dla 3-5 najważniejszych komponentów bez testów  
**Akceptacja**:
- [ ] Testy są napisane
- [ ] Testy przechodzą
- [ ] Coverage wzrósł o ~10-15%

---

#### Task 4.1.3: Testy dla brakujących komponentów - część 2
**Szacunek**: 4h  
**Priorytet**: 🟡 Ważny  
**Opis**: Napisać testy dla kolejnych 3-5 komponentów  
**Akceptacja**:
- [ ] Testy są napisane
- [ ] Testy przechodzą
- [ ] Coverage wzrósł o kolejne ~10-15%

---

#### Task 4.1.4: Rozszerzenie testów integracyjnych API
**Szacunek**: 4h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać testy integracyjne dla brakujących API routes  
**Akceptacja**:
- [ ] Wszystkie główne API routes mają testy
- [ ] Testy pokrywają happy path i error cases
- [ ] Testy przechodzą

---

#### Task 4.1.5: E2E testy dla głównych flow
**Szacunek**: 4h  
**Priorytet**: 🟡 Ważny  
**Opis**: Dodać E2E testy dla głównych flow (logowanie, tworzenie eventu, dodawanie gości, etc.)  
**Akceptacja**:
- [ ] E2E testy są napisane
- [ ] Testy pokrywają główne flow
- [ ] Testy przechodzą w CI/CD

---

#### Task 4.1.6: Weryfikacja pokrycia >80%
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Uruchomić `npm test -- --coverage` i zweryfikować, że coverage >80%  
**Akceptacja**:
- [ ] Coverage >80%
- [ ] Raport coverage jest zaktualizowany
- [ ] Dokumentacja testów jest zaktualizowana

---

## 📊 SPRINT 8: ERROR TRACKING (Priorytet 4.2)

### Sprint Goal: Integracja z error tracking service

#### Task 4.2.1: Wybór i konfiguracja Sentry
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Założyć konto Sentry, zainstalować `@sentry/nextjs`, skonfigurować podstawową integrację  
**Akceptacja**:
- [ ] Sentry jest zainstalowany
- [ ] Podstawowa konfiguracja w `sentry.client.config.ts` i `sentry.server.config.ts`
- [ ] DSN jest w `.env.local`

---

#### Task 4.2.2: Integracja z `error-logger.ts`
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zaktualizować `src/lib/error-logger.ts` do wysyłania błędów do Sentry zamiast tylko `console.error`  
**Akceptacja**:
- [ ] Error logger wysyła błędy do Sentry
- [ ] Błędy są kategoryzowane
- [ ] Testy potwierdzają integrację

---

#### Task 4.2.3: Konfiguracja source maps
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Skonfigurować source maps dla Sentry w production build  
**Akceptacja**:
- [ ] Source maps są uploadowane do Sentry
- [ ] Błędy w Sentry pokazują prawidłowe stack trace
- [ ] Konfiguracja jest w `next.config.js`

---

#### Task 4.2.4: Environment-based error tracking
**Szacunek**: 1h  
**Priorytet**: 🟡 Ważny  
**Opis**: Skonfigurować różne projekty Sentry dla development/production  
**Akceptacja**:
- [ ] Development errors idą do dev projektu
- [ ] Production errors idą do production projektu
- [ ] Konfiguracja jest w `.env.local` i `.env.production`

---

#### Task 4.2.5: Integracja z `error.tsx` i `global-error.tsx`
**Szacunek**: 2h  
**Priorytet**: 🟡 Ważny  
**Opis**: Zaktualizować `error.tsx` i `global-error.tsx` do wysyłania błędów do Sentry  
**Akceptacja**:
- [ ] Błędy z error boundaries są wysyłane do Sentry
- [ ] Błędy zawierają kontekst użytkownika
- [ ] Testy potwierdzają działanie

---

## 📈 PODSUMOWANIE PLANU

### Statystyki
- **Łączna liczba zadań**: 45
- **Szacowany czas**: ~120-140 godzin (3-4 tygodnie pracy)
- **Liczba sprintów**: 8

### Priorytety
- 🔴 **Krytyczne** (Sprint 1-3): 18 zadań - aplikacja musi działać i być bezpieczna
- 🟡 **Ważne** (Sprint 4, 7-8): 20 zadań - funkcjonalność i jakość
- 🟢 **Nice to have** (Sprint 5-6): 7 zadań - dodatkowe funkcje

### Rekomendowany plan wykonania
1. **Tydzień 1**: Sprint 1 (Krytyczne naprawy)
2. **Tydzień 2**: Sprint 2-3 (Bezpieczeństwo)
3. **Tydzień 3**: Sprint 4 (AI) + Sprint 7 (Testy - część 1)
4. **Tydzień 4**: Sprint 5-6 (PDF, Porównywarka) + Sprint 7-8 (Testy część 2, Error tracking)

### Uwagi
- Każde zadanie jest zaprojektowane jako **małe, wykonalne** (1-4h)
- Zadania mogą być wykonywane równolegle w ramach sprintu (jeśli nie ma zależności)
- Po każdym sprincie należy zrobić **review** i **retrospective**
- **Definition of Done** dla każdego zadania jest w sekcji "Akceptacja"

---

**Ostatnia aktualizacja**: 2025-01-15
