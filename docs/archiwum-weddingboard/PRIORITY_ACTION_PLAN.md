# 🚨 PLAN DZIAŁAŃ PRIORYTETOWYCH

**Data**: 2024  
**Status**: ⚠️ W trakcie realizacji (~30-40% wykonane)
**Ostatnia aktualizacja**: 2025-01-15

---

## 🔴 PRIORYTET 1: KRYTYCZNE - Aplikacja musi działać (1-2 dni)

### 1.1. Usunięcie duplikatów API routes i ujednolicenie autentykacji
**Problem**: 
- Duplikaty w `src/app/api/` i `src/app/[locale]/api/`
- Niektóre routes używają starego `@/lib/auth` zamiast Clerk
- Mieszane systemy autentykacji powodują błędy

**Zadania**:
- [x] Zidentyfikować wszystkie duplikaty API routes
- [x] Sprawdzić które routes używają `@/lib/auth` zamiast `@clerk/nextjs/server`
- [x] Usunąć lub przenieść duplikaty do `[locale]/api/`
- [x] Zaktualizować wszystkie routes do używania Clerk
- [x] Przetestować wszystkie endpointy po zmianach

**Wykonane**:
- Usunięto 22 duplikaty z `src/app/api/events/[id]/**`
- Wszystkie routes w `[locale]/api/` używają `requireAuth` z `@/lib/api/auth-helper` (Clerk)
- Zaktualizowano `src/components/ai-plan-generator.tsx` i `src/components/rsvp-form.tsx` do używania `[locale]/api/`
- Zachowano `src/app/api/rsvp/route.ts` (publiczny endpoint z tokenem)
- Zachowano `src/app/api/upload/route.ts` (placeholder)
- Usunięto deprecated `src/app/api/webhook/clerk/route.ts`
- **2025-01-15**: Ujednolicono wywołania API w `task-list`, `guest-list`, `budget-summary`, `onboarding-form` → `useLocale()` + `/[locale]/api/events/...`
- Usunięto osierocone testy API w `src/app/api/events/` (budget export-csv, tables export, plan-versions restore, households guests, guests import) oraz `api/ai/generate-plan`; test `[locale]/api/events/[id]/guests/export-csv` przechodzi
- Testy: mocki auth → `@/lib/auth/utils` (Clerk) w `integration`, `event.actions`, `seating.actions`; `TaskList` z mockiem `useLocale`; asercje `revalidatePath` w event.actions dopasowane do `/pl/`, `/en/`; wykluczono `test-helpers.ts`, `test-setup.ts` z Jest

**Podsumowanie wykonania 1.1 (2025-01-15):**
1. **API** – źródło prawdy: `[locale]/api/events/...`. Komponenty `task-list`, `guest-list`, `budget-summary`, `onboarding-form` wywołują `/${locale}/api/events/...` (useLocale).
2. **Auth** – routes używają Clerk (`auth-helper` / `auth-utils`). Testy mockują `@/lib/auth/utils`.
3. **Testy** – usunięto osierocone route testy z `api/`; przechodzą m.in. export-csv, event.actions, seating.actions, TaskList. Część testów (integration, walidacje, GuestList, SeatingPlanVisualizer) nadal failuje – poza zakresem 1.1.

**Wpływ**: 🔴 Krytyczny - aplikacja może nie działać poprawnie

---

### 1.2. Naprawa TypeScript build errors
**Problem**: 
- `ignoreBuildErrors: true` w `next.config.js`
- `ignoreDuringBuilds: true` dla ESLint
- To maskuje rzeczywiste błędy

**Zadania**:
- [x] Uruchomić `npm run build` i sprawdzić wszystkie błędy TypeScript
- [ ] Naprawić wszystkie błędy typów ⚠️ **BŁĄD W BUILDZIE**: `src/app/api/rsvp/route.ts` - nieprawidłowe params
- [x] Zmienić `ignoreBuildErrors: false`
- [ ] Naprawić błędy ESLint
- [x] Zmienić `ignoreDuringBuilds: false`

**Status**: ⚠️ **CZĘŚCIOWO WYKONANE** - config zmieniony, ale build nadal nie przechodzi

**Wpływ**: 🔴 Krytyczny - błędy w produkcji

---

### 1.3. Zastosowanie loading states we wszystkich komponentach
**Problem**: 
- Niektóre komponenty używają starego `<p>Loading...</p>`
- Brak skeleton loaders w wielu miejscach

**Komponenty do poprawy**:
- [ ] `src/components/task-list.tsx` - używa `<p>Loading tasks...</p>` ❌ **NIE NAPRAWIONE**
- [ ] `src/components/guest-list.tsx` - używa `<p>Loading guests...</p>` ❌ **NIE NAPRAWIONE**
- [ ] `src/components/dashboard/GuestsClient.tsx` - używa `<p>Loading guests...</p>` ❌ **NIE NAPRAWIONE**
- [ ] Wszystkie inne komponenty z `isLoading` bez skeleton loaders

**Status**: ❌ **NIE WYKONANE** - komponenty skeleton istnieją, ale nie są używane

**Zadania**:
- [ ] Zastąpić wszystkie `<p>Loading...</p>` przez `<SkeletonTable>` lub odpowiednie skeleton loaders
- [ ] Dodać `ErrorState` zamiast `<p className="text-red-500">`
- [ ] Dodać `EmptyState` dla pustych list

**Wpływ**: 🟡 Średni - UX, ale ważne dla profesjonalnego wyglądu

---

## 🟡 PRIORYTET 2: WAŻNE - Bezpieczeństwo i stabilność (2-3 dni)

### 2.1. Rate Limiting
**Problem**: 
- Brak rate limiting
- Ryzyko DDoS i nadużyć API
- Kosztowne AI calls bez ograniczeń

**Zadania**:
- [ ] Zaimplementować rate limiting middleware ❌ **NIE WYKONANE**
- [ ] Dodać rate limiting dla API routes (np. `@upstash/ratelimit`) ❌ **NIE WYKONANE**
- [ ] Dodać specjalne limity dla AI endpoints ❌ **NIE WYKONANE**
- [ ] Dodać rate limiting dla form submissions ❌ **NIE WYKONANE**
- [ ] Skonfigurować różne limity dla różnych typów użytkowników ❌ **NIE WYKONANE**

**Status**: ❌ **NIE WYKONANE** - brak jakiejkolwiek implementacji

**Wpływ**: 🔴 Krytyczny dla produkcji

---

### 2.2. Input Sanitization
**Problem**: 
- Brak sanitization inputów
- Potencjalne XSS vulnerabilities
- SQL injection risk (choć Prisma pomaga)

**Zadania**:
- [x] Dodać sanitization dla wszystkich user inputs ⚠️ **CZĘŚCIOWO** - Zod validation
- [ ] Użyć biblioteki jak `DOMPurify` dla HTML content ❌ **BRAK**
- [ ] Sanityzować stringi przed zapisem do DB ❌ **BRAK** - tylko walidacja
- [x] Dodać validation na poziomie formularzy ✅ **WYKONANE** - Zod schematy

**Status**: ⚠️ **CZĘŚCIOWO WYKONANE** - Zod validation istnieje, ale brak DOMPurify

**Wpływ**: 🔴 Krytyczny - bezpieczeństwo

---

### 2.3. CORS i CSRF Protection
**Problem**: 
- Brak konfiguracji CORS
- Brak CSRF protection

**Zadania**:
- [ ] Skonfigurować CORS dla API routes ❌ **NIE WYKONANE**
- [ ] Dodać CSRF tokens dla form submissions ❌ **NIE WYKONANE**
- [ ] Skonfigurować `next.config.js` dla CORS ❌ **NIE WYKONANE**
- [ ] Przetestować z różnymi originami ❌ **NIE WYKONANE**

**Status**: ❌ **NIE WYKONANE** - brak jakiejkolwiek implementacji

**Wpływ**: 🟡 Średni - bezpieczeństwo

---

## 🟢 PRIORYTET 3: FUNKCJONALNOŚĆ (3-5 dni)

### 3.1. Prawdziwa integracja AI (zamiast mock)
**Problem**: 
- Obecnie tylko mock data
- Brak prawdziwej integracji OpenAI/Anthropic
- Brak cache'owania odpowiedzi AI

**Zadania**:
- [ ] Skonfigurować OpenAI/Anthropic API key ❌ **NIE WYKONANE** - nadal mock
- [ ] Zaimplementować prawdziwe AI calls ❌ **NIE WYKONANE** - kod zakomentowany
- [ ] Dodać cache'owanie odpowiedzi AI (Redis lub DB) ❌ **NIE WYKONANE**
- [ ] Dodać retry logic dla AI calls ❌ **NIE WYKONANE**
- [ ] Dodać error handling dla AI failures ❌ **NIE WYKONANE**
- [ ] Dodać rate limiting dla AI endpoints ❌ **NIE WYKONANE**

**Status**: ❌ **NIE WYKONANE** - nadal używany mock provider (`src/lib/ai.ts` linia 3)

**Wpływ**: 🟡 Średni - funkcjonalność, ale core feature aplikacji

---

### 3.2. Eksport PDF dla planowania stołów
**Problem**: 
- TODO w `SeatingPrintView.tsx`
- Brak implementacji PDF export

**Zadania**:
- [ ] Zaimplementować PDF export (np. `react-pdf` lub `jsPDF`) ❌ **NIE WYKONANE**
- [x] Dodać przycisk "Export PDF" w `SeatingPrintView` ✅ **WYKONANE** - ale tylko alert
- [ ] Wygenerować PDF z wszystkimi stołami i gośćmi ❌ **NIE WYKONANE** - TODO w kodzie
- [ ] Dodać winietki dla każdego gościa ❌ **NIE WYKONANE**
- [ ] Przetestować wydruk ❌ **NIE WYKONANE**

**Status**: ❌ **NIE WYKONANE** - `SeatingPrintView.tsx` linia 56-58: `// TODO: Implement PDF export`

**Wpływ**: 🟢 Niski - nice to have

---

### 3.3. Porównywarka dostawców
**Problem**: 
- Wymieniona w README, ale nie zaimplementowana

**Zadania**:
- [ ] Stworzyć komponent `VendorComparison` ❌ **NIE WYKONANE**
- [ ] Dodać możliwość wyboru wielu dostawców do porównania ❌ **NIE WYKONANE**
- [ ] Wyświetlić porównanie w tabeli (cena, rating, dostępność, etc.) ❌ **NIE WYKONANE**
- [ ] Dodać sortowanie i filtrowanie ❌ **NIE WYKONANE**

**Status**: ❌ **NIE WYKONANE** - tylko komentarz w `vendor-list.tsx` linia 192

**Wpływ**: 🟢 Niski - nice to have

---

## 📊 PRIORYTET 4: JAKOŚĆ KODU (1-2 tygodnie)

### 4.1. Zwiększenie pokrycia testami
**Problem**: 
- Obecnie ~30-40% pokrycia
- Brak testów dla wielu komponentów

**Zadania**:
- [ ] Napisać testy dla brakujących komponentów ❓ **TRUDNO OCENIĆ** - wymaga sprawdzenia coverage
- [ ] Dodać testy integracyjne dla API routes ⚠️ **CZĘŚCIOWO** - niektóre testy istnieją
- [ ] Rozszerzyć E2E testy ❓ **TRUDNO OCENIĆ**
- [ ] Cel: >80% pokrycia ❓ **NIEZNANE** - trzeba uruchomić `npm test -- --coverage`

**Status**: ❓ **TRUDNO OCENIĆ** - testy istnieją, ale nieznane aktualne pokrycie

**Wpływ**: 🟡 Średni - jakość, ale ważne długoterminowo

---

### 4.2. Integracja z error tracking service
**Problem**: 
- TODO w `error-logger.ts`
- Brak integracji z Sentry/logRocket

**Zadania**:
- [ ] Wybrać error tracking service (Sentry rekomendowany) ❌ **NIE WYKONANE**
- [ ] Zintegrować z `error-logger.ts` ❌ **NIE WYKONANE** - tylko `console.error`
- [ ] Skonfigurować source maps ❌ **NIE WYKONANE**
- [ ] Dodać environment-based error tracking ❌ **NIE WYKONANE**

**Status**: ❌ **NIE WYKONANE** - `error.tsx` używa tylko `console.error`

**Wpływ**: 🟡 Średni - monitoring, ale ważne dla produkcji

---

## 📋 CHECKLIST WYKONANIA

### Tydzień 1: Krytyczne
- [x] Usunięcie duplikatów API routes i ujednolicenie autentykacji (1.1)
- [ ] Naprawa wszystkich TypeScript errors
- [ ] Zastosowanie loading states wszędzie
- [ ] Rate limiting

### Tydzień 2: Bezpieczeństwo
- [ ] Input sanitization
- [ ] CORS i CSRF protection
- [ ] Prawdziwa integracja AI

### Tydzień 3-4: Jakość
- [ ] Testy
- [ ] Error tracking
- [ ] PDF export
- [ ] Porównywarka dostawców

---

## 🎯 PODSUMOWANIE

**Gotowość produkcyjna obecna**: ⚠️ **4/10** (zmniejszona z powodu błędów w buildzie)

**Po wykonaniu Priorytetu 1 i 2**: 8/10

**Po wykonaniu wszystkich priorytetów**: 9/10

---

## 📊 AKTUALNY STAN WYKONANIA

**Ostatnia analiza**: 2025-01-15

### Wykonane w pełni: 1/11 (9%)
- ✅ 1.1. Usunięcie duplikatów API routes i ujednolicenie autentykacji (w tym testy endpointów, ujednolicone wywołania `[locale]/api`)

### Częściowo wykonane: 2/11 (18%)
- ⚠️ 1.2. Naprawa TypeScript errors (config OK, ale build nie przechodzi)
- ⚠️ 2.2. Input Sanitization (Zod OK, brak DOMPurify)

### Nie wykonane: 7/11 (64%)
- ❌ 1.3. Loading states
- ❌ 2.1. Rate Limiting
- ❌ 2.3. CORS i CSRF Protection
- ❌ 3.1. Prawdziwa integracja AI
- ❌ 3.2. PDF export
- ❌ 3.3. Porównywarka dostawców
- ❌ 4.2. Error tracking

### Trudno ocenić: 1/11 (9%)
- ❓ 4.1. Testy (wymaga sprawdzenia coverage)

**Ogólny postęp**: ~30-40% zadań

**Szczegółowa analiza**: Zobacz `ANALIZA_STANU_WYKONANIA.md`

**Najważniejsze**: 
1. Usunięcie duplikatów i naprawa autentykacji (1.1)
2. Naprawa TypeScript errors (1.2)
3. Rate limiting (2.1)
4. Input sanitization (2.2)

---

**Uwaga**: Ten plan powinien być wykonany sekwencyjnie - każdy priorytet blokuje następny. Nie można przejść do produkcji bez wykonania Priorytetu 1 i 2.
