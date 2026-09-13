# Produkcja, telemetria i testy – Wedding Planner

Jak panować nad wdrożeniem produkcyjnym, co mierzyć i jak uruchamiać testy jednostkowe oraz E2E.

---

## 1. Uruchamianie testów

### Testy jednostkowe (Jest)

```bash
# Wszystkie testy
npm run test

# Z pokryciem kodu
npm run test:coverage

# Tryb watch (podczas developmentu)
npm run test:watch

# Tryb CI (bez watch, z coverage, fail przy --bail)
npm run test:ci
```

- Konfiguracja: `jest.config.simple.js`
- Setup: `jest.setup.tsx` (mocki: Clerk, Prisma, next/navigation, UI)
- Testy są w:
  - `src/**/__tests__/**/*.test.[jt]s(x)`
  - `src/**/*.spec.[jt]s(x)`
  - `__tests__/**/*.test.[jt]s(x)` (katalog główny)

### Testy E2E (Playwright)

```bash
# Uruchom E2E (uruchomi dev server, potem testy)
npm run test:e2e

# UI Playwright (debugowanie)
npm run test:e2e:ui

# Debug krok po kroku
npm run test:e2e:debug
```

- Konfiguracja: `playwright.config.ts`
- Katalog: `e2e/`
- `baseURL`: `PLAYWRIGHT_TEST_BASE_URL` lub `http://localhost:3000`
- W CI: `reuseExistingServer: false`, retry 2, 1 worker.

Strony chronione (dashboard, goście, zadania, budżet, seating) wymagają logowania. E2E bez Clerk test keys będą na landingu lub przekierowaniu do `/auth`. Do pełnego E2E po zalogowaniu: skonfiguruj [Clerk testing](https://clerk.com/docs/testing/overview) lub używaj tylko testów publicznych (landing, sign-in/sign-up widok).

---

## 2. Pokrycie funkcjonalności testami

### Mapowanie: co jest testowane

| Obszar | Testy jednostkowe | Testy E2E | Uwagi |
|--------|--------------------|-----------|--------|
| **Auth** | – | `e2e/auth.spec.ts` (widok sign-in, link do sign-up) | Brak mocka pełnego flow Clerk w E2E |
| **Event / weselo** | `event.actions.test.ts`, `event-list.test.tsx` | – | Tworzenie wydarzenia, lista |
| **Zadania** | `task.actions.test.ts`, `TaskList.test.tsx`, `TaskBoard.test.tsx`, `task-generator.test.ts` | `e2e/tasks.spec.ts` | Lista, Kanban, Timeline |
| **Goście** | `guest.actions.test.ts`, `GuestList.test.tsx`, `guest-form-validation.test.tsx`, `export-csv/route.test.ts` | `e2e/guests.spec.ts` | Lista, formularz, eksport CSV |
| **Budżet** | `budget.actions.test.ts`, `BudgetList.test.tsx`, `budget.test.ts` | `e2e/budget.spec.ts` | Lista, walidacja, ujemne kwoty |
| **Seating** | `seating.actions.test.ts`, `SeatingRulesManager.test.tsx`, `SeatingPlanVisualizer.test.tsx`, `seating-ai.test.ts` | `e2e/seating.spec.ts` | Reguły, wizualizacja, AI |
| **Vendors** | `vendor.actions.test.ts` | – | CRUD |
| **RSVP** | `rsvp-integration.test.ts` | – | Logika RSVP |
| **Walidacje** | `validations/*.test.ts`, `guest.test.ts`, `task.test.ts`, `budget.test.ts` | – | Zod/schematy |
| **AI** | `seating-ai.test.ts`, `task-generator.test.ts`, `AiPlanGenerator.test.tsx` | – | Generowanie zadań, planu, seating |
| **Dashboard** | – | `e2e/dashboard.spec.ts` | Nawigacja (strona główna) |
| **API routes** | `export-csv/route.test.ts` | – | Eksport gości CSV; reszta przez Server Actions / integrację |

### Co warto dalej pokryć

- **API:** `accept-terms`, `create-checkout-session`, `onboarding-payment-done` – testy jednostkowe z mockiem `auth()`.
- **Onboarding:** komponent `OnboardingWizard` – kolejność kroków (regulamin → płatność → wydarzenie).
- **E2E z auth:** po włączeniu Clerk test mode – pełny flow: rejestracja → onboarding → dashboard → goście/zadania.
- **Seating:** test „should not place conflicting guests at the same table” jest wyłączony (`it.skip`) – algorytm w pewnych konfiguracjach może przypisać obu gości do tego samego stołu; warto wrócić i poprawić algorytm lub dane testowe.

---

## 3. Uruchamianie testów na Railway

Tak – testy jednostkowe możesz uruchamiać **podczas buildu na Railway**. Dzięki temu deploy nie przejdzie, jeśli testy się wywalą.

### Opcja A: Build Command z testami (zalecane)

1. W **Railway** → Twój serwis → **Settings** → **Build**.
2. W polu **Build Command** ustaw:
   ```bash
   npm run build:railway
   ```
   (skrypt `build:railway` w `package.json` robi `test:ci` potem `build`).

Albo ręcznie:
   ```bash
   npm ci && npm run test:ci && npm run build
   ```

3. **Start Command** zostaw jak jest (np. `npm start` lub puste, jeśli używasz Dockerfile).

Efekt: przy każdym deployu Railway najpierw uruchomi testy. Jeśli któreś failują, build się nie uda i wdrożenie się nie wykona.

### Opcja B: Tylko build (bez testów na Railway)

Jeśli wolisz, żeby testy biegały tylko w CI (np. GitHub Actions), a na Railway sam build:

- **Build Command** pozostaw domyślny (np. `npm run build` albo puste) i nie używaj `build:railway`.

### E2E na Railway

Testów E2E (Playwright) **nie warto** odpalać na Railway w ramach buildu: potrzebują przeglądarki, dłuższego czasu i często działającej aplikacji. Lepiej trzymać E2E w GitHub Actions (np. przed merge do `main`) i na Railway uruchamiać tylko `npm run test:ci`.

---

## 4. Produkcja – jak uruchamiać i panować

### Build i start

```bash
npm run build
npm run start
```

- `start` używa `NODE_OPTIONS='--disable-warning=ExperimentalWarning' next start` (w Windows może być ustawienie w zmiennej środowiskowej).

### Zmienne środowiskowe (produkcja)

- **Next.js:** `NODE_ENV=production`
- **Baza:** `DATABASE_URL`
- **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (opcjonalnie `CLERK_WEBHOOK_*`)
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **i18n:** `NEXT_PUBLIC_APP_URL` (np. do linków w mailach)

### Wdrożenie (Vercel / inny host)

- Build: `npm run build`, output: `.next`
- Start: `npm run start` lub użycie platformy (Vercel uruchamia Next.js automatycznie).
- Webhook Stripe: w produkcji ustaw URL np. `https://twoja-domena.com/api/webhooks/stripe` i ten sam `STRIPE_WEBHOOK_SECRET`.

### Rollback

- Przy wdrożeniu z Git: cofnięcie do poprzedniego commita i ponowne deploy.
- Przy migracjach Prisma: przed rollbackem kodu rozważyć czy migracje wstecz są potrzebne; w razie problemów – przywrócić backup bazy.

---

## 5. Telemetria i monitoring

### Rekomendowane narzędzia

1. **Vercel Analytics** (jeśli hostujesz na Vercel)  
   - Page views, Web Vitals (LCP, FID, CLS).  
   - Dodanie: `@vercel/analytics` i `<Analytics />` w layout.

2. **Sentry (Next.js)**  
   - Błędy po stronie klienta i serwera, release tracking.  
   - Instalacja: `@sentry/nextjs`, konfiguracja w `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`.

3. **Uptime / health**  
   - Endpoint np. `GET /api/health` zwracający 200 gdy app i (opcjonalnie) DB są dostępne.  
   - Zewnętrzny monitor (UptimeRobot, Better Stack, Cron) co 5 min.

4. **Stripe Dashboard**  
   - Płatności, subskrypcje, webhook delivery – jako „telemetria” płatności.

### Co mierzyć

- Błędy (4xx/5xx) i wyjątki (Sentry).
- Web Vitals (LCP, INP, CLS).
- Konwersje: rejestracja, ukończony onboarding, pierwsze utworzone wydarzenie, pierwsza płatność (eventy w analytics).
- Uptime i czas odpowiedzi `/api/health`.

---

## 6. CI/CD (GitHub Actions)

W repozytorium jest workflow `.github/workflows/ci.yml`, który:

- Dla każdego pusha i PR:
  - **Lint:** `npm run lint`
  - **Testy jednostkowe:** `npm run test:ci` (z coverage)
- Opcjonalnie (np. przed release’em lub nocny build):
  - **E2E:** `npm run test:e2e` (wymaga uruchomienia aplikacji z działającym backendem; w CI bez Clerk test keys E2E mogą być ograniczone do stron publicznych).

Przed wdrożeniem na produkcję upewnij się, że:

- `npm run lint` przechodzi,
- `npm run test:ci` przechodzi,
- Build: `npm run build` kończy się sukcesem.

---

## 7. Szybka checklista przed release

- [ ] `npm run lint` – brak błędów
- [ ] `npm run test:ci` – wszystkie testy zielone, coverage bez regresji
- [ ] `npm run build` – build OK
- [ ] Zmienne produkcyjne ustawione (Clerk, Stripe, DB, `NEXT_PUBLIC_APP_URL`)
- [ ] Webhook Stripe w Stripe Dashboard wskazuje na produkcyjny URL i pasujący secret
- [ ] Health/uptime monitor skonfigurowany (opcjonalnie)
- [ ] Sentry / Analytics włączone (opcjonalnie)
