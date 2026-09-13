# EventBoard – CLAUDE.md

## Czym jest ta aplikacja

**EventBoard** – wielodostępna platforma SaaS dla sal, restauracji i obiektów eventowych.
Obiekt prowadzi obsługę przyjęć: kalendarz i sale, wydarzenia, **procesy obsługi**, warianty menu,
agenda dla kuchni i obsługi, zespół z uprawnieniami, zapytania ofertowe.

Sercem produktu jest **proces**: konfigurowalne kroki z rolami („kto wypełnia”, „kto akceptuje”),
z których **automatycznie składa się agenda**. Agenda nie ma osobnej konfiguracji — jedynym
źródłem prawdy jest proces.

Język interfejsu: **polski** (`pl`). Warstwa i18n obsługuje też `en`.

### Zakres produktu (decyzja, wrzesień 2026)

Produktem jest **wyłącznie EventBoard** (panel obiektu + panel administratora platformy).
Wcześniejszy produkt weselny — panel pary młodej, marketplace dostawców, strona weselna,
papeteria, RSVP, moodboard, sesje partnerskie, rozliczenia Stripe — **został usunięty z repo**.
Nie dodawaj tych modułów z powrotem bez wyraźnej decyzji; jeśli trzeba je odzyskać, są w historii
gita przed commitem czyszczącym.

**Model dostępu:** brak publicznej rejestracji. Przestrzenie klientów zakłada administrator
platformy (`/pl/admin`, konto `User.role = "ADMIN"`), on też generuje dane logowania.

---

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 15, App Router, Turbopack (dev) |
| Język | TypeScript 5 |
| UI | React 18, TailwindCSS 3, shadcn/ui (Radix UI) |
| ORM | Prisma 5 |
| Baza danych | PostgreSQL (prod), SQLite (`prisma/dev.db`) lokalnie |
| Auth | **własna** — e-mail + hasło (bcrypt), podpisany token sesji w cookie (`src/lib/auth/*`). Clerk NIE jest używany do logowania |
| Płatności | **ręczne** — faktury poza systemem; status opłacenia klienta ustawia admin w `/pl/admin` |
| Email | Resend |
| SMS | Twilio |
| AI | OpenAI / DeepSeek / OpenRouter (wybór przez `AI_PROVIDER` env) |
| i18n | next-intl 4 |
| PDF | pdf-lib, @react-pdf/renderer |
| Drag & Drop | @dnd-kit |
| Wykresy | Recharts |
| Tabele | TanStack React Table |
| Przechowywanie plików | AWS S3 / Cloudflare R2 |
| PWA | Serwist |
| Deploy | Railway (`railway.json`, `railway.toml`) |
| State / fetch | TanStack React Query 5, React Hook Form 7 |

---

## Uruchomienie projektu

```bash
# development (Turbopack)
npm run dev

# development – czysty start (czyści cache)
npm run dev:clean

# produkcja
npm run build && npm run start
```

Baza danych:
```bash
# seed
npm run db:seed

# reset + seed
npm run db:reset

# pełny reset (fresh)
npm run db:reset:fresh
```

**Port domyślny:** 3000  
**distDir w dev:** `.next-dev` (nie `.next`) – ważne przy cachowaniu.

---

## Zmienne środowiskowe

Wzorzec: `.env.example` (komentarze po polsku).  
Lokalne nadpisania: `.env.local`.

Kluczowe zmienne:
- `DATABASE_URL` – połączenie z PostgreSQL
- `CLERK_*` – auth
- `STRIPE_*` – płatności
- `RESEND_API_KEY` – email
- `TWILIO_*` – SMS
- `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` + `AI_PROVIDER`
- `AWS_*` / `R2_*` – storage
- `CRON_SECRET` – zabezpieczenie endpointów cron
- `NEXT_PUBLIC_APP_URL` – publiczny URL aplikacji

---

## Struktura katalogów (kluczowe miejsca)

```
src/
  app/
    [locale]/           # Strony publiczne i dashboard (Next.js App Router)
      dashboard/        # Panel pary młodej
      portal/           # Panel organizatora (sala)
    api/                # API routes
    org/                # Dodatkowe strony organizatora
  components/           # Komponenty React (bardzo rozbudowane)
  lib/                  # Logika biznesowa, integracje
    prisma.ts           # Singleton Prisma client
    auth.ts / auth-utils.ts
    ai.ts
    stripe-billing.ts / billing.ts
    google-calendar.ts / google-calendar-sync.ts
    pdf-invitation.ts
    notifications.ts / sms.ts
    seating-planner.ts
    feature-flags.ts
    event-modules.ts    # Konfiguracja modułów per-event
  hooks/                # Custom React hooks
  locales/
    pl.json             # Tłumaczenia PL
    en.json             # Tłumaczenia EN
  types/                # TypeScript types
prisma/
  schema.prisma         # Schemat (30+ modeli, PostgreSQL)
  migrations/           # Migracje (30+, od 2025-02-02)
  seed.ts
__tests__/              # Testy jednostkowe (Jest)
e2e/                    # Testy E2E (Playwright)
docs/                   # Dokumentacja markdown
```

---

## Kluczowe modele Prisma

- `User` – konto; `role`: `ADMIN` (admin platformy / serviceUser) lub `STAFF`. Hasło jako skrót bcrypt,
  `acceptedTermsVersion` / `acceptedTermsAt` – akceptacja regulaminu
- `Organization` – przestrzeń klienta (obiekt); `plan` (START/PRO/ENTERPRISE), limity `maxAdmins`/`maxUsers`,
  `customRolesJson` (własne role), `modulePermissionsJson` (uprawnienia rola × moduł),
  `notifyDaysBefore`/`notifyEmail`/`notifySms`, `billingPaidUntil`, `brandColor`/`brandLogoUrl`, `archivedAt`
- `OrganizationMember` – `role` (OWNER/MANAGER/STAFF/VIEWER/**SERVICE**), `isAdmin` (może nadawać uprawnienia),
  `rolesJson` (wiele ról operacyjnych). `SERVICE` = admin platformy, nie liczy się do limitów
- `Event` – wydarzenie obiektu; `approvalReminderAt` (dedup powiadomień o akceptacji)
- `OrganizationWorkflow` / `WorkflowNode` – definicja procesu; węzeł ma `assigneeRole`, `fillRole`,
  `approveRole`, `fieldsJson`, `fieldMappingsJson`, `menuMode`
- `EventProcessState` – stan procesu eventu (`currentNodeId`, `completedNodeIds`, `nodeDataJson`)
- `EventAgendaData` – płaskie `dataJson`, z którego składa się agenda (klucze `agenda.*`)
- `MenuVariant` / `MenuVariantCourse` – warianty menu (cena/os., porcje, zatwierdzenie, skan menu)
- `AgendaDocumentTemplate` – szablony **dokumentów** (oferty, umowy). **Agenda ich NIE używa** –
  ma własny, zaszyty układ w `src/lib/agenda/agenda-docx.ts`
- `OrgLead` – zapytania ofertowe · `OrgBlockedDate` – zablokowane terminy
- `EventPayment` – ręczne śledzenie płatności za event
- `Guest` / `Table` / `SeatingRule` – **zachowane, obecnie nieużywane** w UI; baza pod ewentualną listę
  gości jako krok procesu i stoły
- `GoogleCalendarConnection` – tokeny OAuth Google Calendar

---

## Testy

```bash
# unit (Jest)
npm test
npm run test:watch
npm run test:coverage
npm run test:ci

# E2E (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug
```

E2E automatycznie uruchamia `npm run dev` jako serwer.  
Przeglądarki E2E: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12).

---

## Linting / Formatting

```bash
npm run lint        # ESLint (flat config)
```

Prettier: `.prettierrc` (konfiguracja w root).  
`typescript.ignoreBuildErrors: true` i `eslint.ignoreDuringBuilds: true` w `next.config.mjs` – build nie blokuje na błędach TS/lint.

---

## Routing i middleware

- Middleware: `src/middleware.ts` – brama sesji (własnej) + routing locale.
  **Uwaga:** `localePrefix: "always"` przepisuje gołe `/api/...` na `/pl/api/...` (404), dlatego
  endpointy maszynowe (`/api/cron/*`, `/api/webhooks/*`, `/api/admin/bootstrap`) są jawnie
  wyłączone z i18n w `isLocaleAgnosticPublicRoute`.
- `/pl/admin` celowo NIE jest w `isProtectedRoute` – strona sama zwraca 404 dla nie-adminów,
  żeby przekierowanie na logowanie nie zdradzało, że panel istnieje.
- i18n setup: `src/i18n.ts`
- Wszystkie strony publiczne i dashboard pod `src/app/[locale]/`
- API: `src/app/api/` (CORS skonfigurowany dla `weddingboard.pl`)
- Nagłówki bezpieczeństwa w `next.config.mjs`: X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy

---

## Deploy

- **Railway** – główny deployment (`railway.json`, `railway.toml`)
- **Docker** – `docker-compose.yml` (app + PostgreSQL 15-alpine)
- Build script na Railway: `npm run build:railway` (alias dla `next build`)

---

## Konwencje kodowania

- Komponenty w `src/components/` pogrupowane tematycznie
- Logika biznesowa wyłącznie w `src/lib/`
- Custom hooks w `src/hooks/`
- Server Actions i API routes w `src/app/api/`
- Tłumaczenia zawsze przez next-intl (`useTranslations` / `getTranslations`)
- Nie dodawaj komentarzy do kodu – tylko gdy WHY jest nieoczywiste
- Nie mockuj bazy danych w testach – używaj prawdziwego połączenia
- shadcn/ui jako baza komponentów UI (config: `components.json`)
