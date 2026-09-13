# Przypadki testowe i wdrożenie telemetrii

Dokument opisuje: **jakie przypadki testowe są sprawdzane** (jednostkowo i E2E) oraz **jak wdrożyć telemetrię**, żeby analizować działanie aplikacji na produkcji.

---

## 1. Przypadki testowe – co jest sprawdzane

### 1.1 Testy jednostkowe (Jest)

Uruchomienie: `npm run test` / `npm run test:ci`.

#### Wydarzenia (Event / weselo)

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| createEvent – sukces | Tworzenie wydarzenia z poprawnymi danymi (name, date, userId, brideName, groomName, estimatedGuestCount, targetBudget), revalidatePath dla /pl, /en, dashboard |
| createEvent – błąd bazy | Rzucenie błędu przy nieudanym zapisie do DB |
| getEvents – użytkownik zalogowany | Zwrot listy wydarzeń (demo/DB) dla zalogowanego użytkownika |
| getEvents – brak użytkownika | Zwrot demo events (np. „Nasze Wesele”) gdy user = null |
| Event list (komponent) | Wyświetlanie listy wydarzeń |

#### Zadania (Tasks)

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| createTask | Tworzenie zadania z walidacją (title, category, status, priority, eventId) |
| updateTaskStatus | Aktualizacja statusu (TODO, IN_PROGRESS, DONE, SKIPPED) |
| deleteTask | Usunięcie zadania |
| Task validation | createTaskSchema: wymagane pola, status enum, priority enum |
| TaskList | Stan ładowania, błąd, wyświetlanie zadań |
| TaskBoard | Render z zadaniami |
| task-generator (AI) | Generowanie zadań na podstawie danych wydarzenia |

#### Goście (Guests)

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| createGuest | Dodanie gościa z danymi (name, eventId, status itd.) |
| updateGuest | Aktualizacja gościa |
| deleteGuest | Usunięcie gościa |
| updateGuestTable / unassign | Przypisanie do stołu i odpięcie (tableId = null) |
| Guest validation | createGuestSchema: wymagane pola, email, telefon; updateGuestSchema: CUID id |
| Guest form validation | Błąd przy pustym imieniu, akceptacja poprawnych danych |
| GuestList | Dodanie gościa przez mock formularza |
| GET export-csv | 401 gdy brak autoryzacji; poprawne CSV z nagłówkami i danymi; pusta lista = tylko nagłówek |

#### Budżet (Budget)

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| createBudgetItem / budget.actions | CRUD pozycji budżetu |
| Budget validation | createBudgetItemSchema: poprawne dane, odrzucenie ujemnych kwot, zero dla actualAmount |
| BudgetList | Dodanie pozycji przez formularz |

#### Seating (Rozsadzenie)

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| generateSeatingPlan – grupa przy jednym stole | Umieszczenie grupy (SAME_TABLE) przy jednym stole |
| generateSeatingPlan – grupa za duża | Błąd gdy grupa nie mieści się przy żadnym stole |
| generateSeatingPlan – nie wszyscy usadzeni | Komunikat „Nie udało się usadzić N gości” |
| generateSeatingPlanAI – sukces / brak auth / błąd DB | AI plan gdy user OK; failure gdy brak usera lub błąd bazy |
| SeatingRulesManager | Dodanie reguły (wybór gości, przycisk), wyświetlanie reguł z null/invalid guestIds (noGuests, unknownGuests) |
| SeatingPlanVisualizer | Render stołów i gości; pusty stan; komunikat gdy wszyscy przypisani |
| seating-ai (algorytm) | Poprawny plan, pusta lista gości, reguły, pojemność stołów, diety, ostrzeżenia, sugestie, duża lista gości |

#### Vendory

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| createVendor | Tworzenie z name, category (enum np. „Muzyka / DJ”), eventId, phone |
| updateVendor | Aktualizacja dostawcy |
| deleteVendor | Usunięcie |

#### RSVP

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| RSVP – aktualizacja statusu | Zapis potwierdzenia/odmowy z danymi (food, allergies, notes) |
| RSVP – declined | Obsługa odmowy |
| RSVP – expired invitation | Odrzucenie wygasłego zaproszenia |
| RSVP – invalid token | Odrzucenie nieprawidłowego tokenu |
| RSVP – walidacja | food preferences, allergies, notes |
| RSVP – statystyki | Obliczanie statystyk potwierdzeń |
| RSVP – dietary requirements | Śledzenie wymagań żywieniowych |

#### Walidacje (schematy Zod)

| Obszar | Przypadki |
|--------|-----------|
| common | email, telefon (PL), futureDate, positiveNumber, requiredString, id (CUID), taskStatus, taskPriority |
| guest | createGuestSchema, updateGuestSchema (partial, id) |
| task | createTaskSchema (required, status, priority) |
| budget | createBudgetItemSchema (valid, negative, zero actualAmount) |
| validation-utils | validate, safeValidate, formatValidationErrors, getFirstValidationError, isValidationError |

#### Integracja i funkcjonalność

| Przypadek testowy | Co sprawdza |
|-------------------|-------------|
| Integration – flow | Tworzenie wydarzenia → goście → seating (mock DB) |
| Integration – auth errors | createEvent rzuca przy braku usera; generateSeatingPlanAI zwraca failure |
| Integration – DB errors | createEvent rzuca przy błędzie połączenia z DB |
| Integration – walidacja | Odrzucenie pustej nazwy wydarzenia, walidacja danych gościa |
| Integration – wydajność | Wiele gości (batch) |
| Functionality verification | Checklisty: startup, auth, dashboard, tasks, guests, budget, seating, vendors, RSVP, i18n, AI, performance, security, a11y, cross-browser (obecnie głównie placeholdery) |
| Performance | getUrlUserEvent, getEventWithTasks/Guests/Budget – czas ładowania; TaskBoard/GuestList – duże listy; bundle size |

#### Komponenty UI

| Komponent | Przypadki |
|-----------|-----------|
| AiPlanGenerator | Render, loading, wywołanie mutate po kliknięciu, komunikat błędu przy failure |

---

### 1.2 Testy E2E (Playwright)

Uruchomienie: `npm run test:e2e`. Strony chronione wymagają logowania (bez Clerk test keys E2E widzą głównie landing/auth).

| Obszar | Przypadek testowy | Co sprawdza |
|--------|-------------------|-------------|
| Auth | Wyświetlenie strony sign-in | Tytuł / Zaloguj |
| Auth | Nawigacja do sign-up | Link „Zarejestruj” → URL zawiera sign-up |
| Dashboard | Wyświetlenie dashboardu | Nagłówek H1 widoczny |
| Dashboard | Nawigacja do zadań | Link tasks/zadania → URL z tasks |
| Dashboard | Nawigacja do gości | Link guests/goście → URL z guests |
| Tasks | Lista zadań | Widoczna lista |
| Tasks | Widok Kanban | Przełączenie na Kanban |
| Tasks | Widok Timeline | Przełączenie na Timeline |
| Guests | Lista gości | Nagłówek goście/guests |
| Guests | Formularz dodawania | Przycisk „Dodaj gościa” → dialog widoczny |
| Guests | Walidacja formularza | Submit pustego formularza → komunikat wymagane/required |
| Budget | Lista budżetu | Wyświetlenie listy |
| Budget | Formularz pozycji | Walidacja formularza |
| Budget | Ujemne kwoty | Odrzucenie ujemnych wartości |
| Seating | Wizard rozsadzenia | Wyświetlenie wizarda |
| Seating | Dodawanie stołów | Możliwość dodania stołu |
| Seating | Pojemność stołu | Walidacja pojemności |

---

## 2. Wdrożenie telemetrii – analiza działania produkcji

Poniżej konkretne kroki, żeby włączyć telemetrię i analizować zachowanie aplikacji na żywo.

### 2.1 Health check (uptime + dostępność)

**Cel:** Wiedzieć, czy aplikacja i (opcjonalnie) baza odpowiadają.

1. **Endpoint w aplikacji**

W repozytorium jest już route **`src/app/api/health/route.ts`**: `GET /api/health` zwraca 200 z `{ status: "ok", db: "connected" }` gdy baza odpowiada, 503 gdy połączenie z DB się nie uda.

2. **Monitor zewnętrzny**

- [UptimeRobot](https://uptimerobot.com), [Better Stack](https://betterstack.com) lub inny: dodaj monitor HTTP dla `https://twoja-domena.com/api/health`, interwał np. 5 min.
- Alert e-mailem/SMS gdy 2–3 kolejne sprawdzenia zwrócą 5xx lub timeout.

Efekt: widzisz uptime i czas odpowiedzi; możesz śledzić „działanie produkcji” w jednym miejscu.

---

### 2.2 Błędy (Sentry)

**Cel:** Łapanie wyjątków i błędów po stronie klienta i serwera, z kontekstem (user, release, breadcrumbs).

1. **Konto i projekt**

- Załóż konto na [sentry.io](https://sentry.io), utwórz projekt typu **Next.js**.

2. **Instalacja**

```bash
npx @sentry/wizard@latest -i nextjs
```

Wizard doda `@sentry/nextjs`, pliki konfiguracyjne (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) oraz zmienne środowiskowe.

3. **Zmienne (Railway / Vercel)**

- `SENTRY_DSN` – z projektu Sentry (Client Keys → DSN).
- Opcjonalnie: `SENTRY_AUTH_TOKEN` (dla uploadu source maps w buildzie).

4. **Co będziesz analizować**

- **Issues:** grupowane błędy z stack trace, środowisko, release.
- **Performance:** transakcje (strony, API) – włączenie w Sentry Next.js daje automatyczne transakcje.
- Filtrowanie po: środowisko (production), release, użytkownik (jeśli przekażesz id).

---

### 2.3 Analytics (ruch + Web Vitals + konwersje)

**Cel:** Ruch, wydajność stron (LCP, INP, CLS) oraz kluczowe zdarzenia (rejestracja, onboarding, pierwsze wydarzenie, płatność).

#### Opcja A: Vercel Analytics (jeśli hostujesz na Vercel)

```bash
npm i @vercel/analytics
```

W głównym layoutcie (np. `app/[locale]/layout.tsx`):

```tsx
import { Analytics } from "@vercel/analytics/react";

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

- W Vercel Dashboard: **Analytics** – page views, Web Vitals (LCP, FID, CLS).
- Konwersje: zdarzenia niestandardowe (patrz niżej).

#### Opcja B: PostHog / Plausible / Google Analytics 4

- **PostHog:** `npm i posthog-js`; inicjalizacja w layout lub _app; eventy `posthog.capture('event_name', { ... })`.
- **Plausible:** skrypt w `<head>`; lekki, bez ciasteczek.
- **GA4:** dodanie gtag.js i `gtag('event', ...)`.

---

### 2.4 Zdarzenia niestandardowe (konwersje)

Żeby analizować **działanie** produkcji (nie tylko błędy), warto wysyłać eventy w kluczowych momentach.

Przykład helpera (np. `lib/analytics.ts`):

```ts
// lib/analytics.ts – przykład; dostosuj do wybranej platformy (Vercel, PostHog, GA4)

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  // Vercel Analytics: import { track } from '@vercel/analytics'; track(name, props);
  // PostHog: posthog.capture(name, props);
  // GA4: gtag('event', name, props);
  console.debug("[analytics]", name, props);
}
```

Sugerowane eventy i gdzie je wywołać:

| Zdarzenie | Gdzie wywołać | Po co |
|-----------|----------------|-------|
| `sign_up` | Po udanej rejestracji (Clerk callback / after-auth) | Konwersja rejestracji |
| `onboarding_terms_accepted` | Po zapisie akceptacji regulaminu | Funnel onboarding |
| `onboarding_payment_done` | Po powrocie z Stripe (success) | Funnel płatności |
| `wedding_created` | Po utworzeniu wydarzenia (createEvent) | Aktywacja użytkownika |
| `first_guest_added` | Po pierwszym dodanym gościu (opcjonalnie) | Zaangażowanie |
| `checkout_started` / `checkout_completed` | Stripe / przycisk płatności | Funnel płatności |

Dzięki temu w narzędziu analytics zobaczysz: ile rejestracji, ile ukończonych onboardingów, ile utworzonych wesel, gdzie użytkownicy odpadają.

---

### 2.5 Płatności (Stripe)

- **Stripe Dashboard** → Payments, Customers, Subscriptions: liczba płatności, MRR, failed payments.
- **Webhooks** → Stripe: logi dostarczeń; przy błędach (np. 5xx) Stripe retry – w Sentry zobaczysz błędy z webhooka.
- Nie trzeba osobnej „telemetrii” w kodzie dla samych płatności – Stripe jest źródłem prawdy; ewentualnie event `checkout_completed` w analytics dla korelacji z ruchem.

---

### 2.6 Podsumowanie – co analizować na produkcji

| Obszar | Narzędzie | Co analizujesz |
|--------|-----------|-----------------|
| Dostępność | Health + UptimeRobot / Better Stack | Uptime, czas odpowiedzi `/api/health` |
| Błędy | Sentry | Wyjątki, 5xx, stack trace, release, user |
| Wydajność frontu | Vercel Analytics / Sentry Performance | LCP, INP, CLS, czas ładowania stron |
| Ruch i konwersje | Vercel / PostHog / GA4 + eventy | Page views, sign_up, onboarding_*, wedding_created, checkout_* |
| Płatności | Stripe Dashboard | Płatności, subskrypcje, webhook delivery |

Minimalny zestaw do „analizy działania produkcji”: **health endpoint + monitor** + **Sentry** + **jedna platforma analytics z eventami konwersji**. Potem możesz dodać Sentry Performance lub Vercel Analytics dla Web Vitals.
