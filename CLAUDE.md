# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Czym jest ta aplikacja

**EventBoard** – wielodostępna platforma SaaS dla sal, restauracji i obiektów eventowych.
Obiekt prowadzi obsługę przyjęć: kalendarz, wydarzenia, **procesy obsługi**, warianty menu,
agenda dla kuchni i obsługi, zespół z uprawnieniami, zapytania ofertowe.

Sercem produktu jest **proces**: konfigurowalne kroki z rolami („kto wypełnia”, „kto akceptuje”),
z których **automatycznie składa się agenda**. Agenda nie ma osobnej konfiguracji — jedynym
źródłem prawdy jest proces.

Język interfejsu, kodu i komentarzy: **polski** (`pl`). Warstwa i18n obsługuje też `en`.

**Model dostępu:** brak publicznej rejestracji. Przestrzenie klientów zakłada administrator
platformy (`/pl/admin`, konto `User.role = "ADMIN"`), on też generuje dane logowania.
Płatności są ręczne (faktury poza systemem); status opłacenia ustawia admin.

Wcześniejszy produkt weselny (panel pary młodej, marketplace, RSVP, Stripe) został wycofany z UI.
**Uwaga:** jego modele nadal są w `schema.prisma`, a część kodu w `src/lib` i `src/components` to
pozostałości — obecność modelu lub pliku nie znaczy, że funkcja żyje w EventBoard.

---

## Komendy

```bash
npm run dev            # Turbopack, port 3000, distDir .next-dev
npm run dev:clean      # czyści .next/.next-dev i startuje
npm run dev:fresh      # Windows: scripts\fix-next-eperm.bat (naprawa blokad .next)
npm run build && npm run start
npm run lint           # next lint (eslint flat config)
```

Baza:

```bash
npm run db:seed        # ts-node prisma/seed.ts
npm run db:reset       # prisma migrate reset --force && seed
npm run db:reset:fresh # node scripts/reset-db.js
npx prisma migrate dev --name <nazwa>
```

Testy:

```bash
npm test               # jest --config jest.config.simple.js --passWithNoTests
npm run test:watch
npm run test:ci
npx jest --config jest.config.simple.js src/lib/__tests__/plan-progress.test.ts   # jeden plik
npx jest --config jest.config.simple.js -t "fragment nazwy testu"                 # jeden test

npm run test:e2e
npx playwright test e2e/auth.spec.ts --project=chromium   # jeden plik / jedna przeglądarka
```

`jest.config.js` (przez `next/jest`) istnieje, ale **nie jest używany przez skrypty npm** — wszystkie
odwołują się do `jest.config.simple.js`. Playwright sam podnosi `npm run dev` na :3000.

---

## Architektura — rzeczy, których nie widać z jednego pliku

### Auth: własna sesja, nie Clerk

`package.json` zawiera `@clerk/*`, ale **żaden plik w `src` nie importuje Clerka**. Logowanie to
e-mail + hasło (bcrypt) i podpisany JWT (`jose`) w cookie:

- `src/lib/auth/session-token.ts` — cookie `wb_session`, 7 dni, sekret z
  `AUTH_SESSION_SECRET` → `JWT_SECRET` → `PARTNER_ACCESS_SECRET` → wartość deweloperska.
- `src/lib/auth/session.ts` — odczyt/zapis cookie w server components i actions.
- `src/lib/auth/utils.ts` → `getCurrentUser()` — podstawowy helper w actions.
- `src/lib/auth/session-user.ts` → `getSessionUser()` — user + membership + metadata billingowe.

Nazwy `clerk-helper.ts`, `ClerkBillingMetadata`, `User.clerkId`, `auth-mock.ts` to **osierocone
nazewnictwo** po migracji — nie sugeruj się nimi.

> **Pułapka:** `getCurrentUser()` w `NODE_ENV=development` (lub `NEXT_PUBLIC_DEV_MODE=true`)
> zwraca `MOCK_DEV_USER` o `id: "mock-user-id"` **bez sprawdzania cookie**. Lokalnie jesteś
> zawsze zalogowany jako mock, a seed zakłada takiego użytkownika. Testując realny przepływ
> logowania i uprawnień, licz się z tym obejściem.

### Organizacja bieżącego żądania

`src/lib/auth/active-org.ts` — cookie `eb_active_org` („wejście w przestrzeń” przez admina
platformy). Jedna funkcja `resolveMembership` decyduje o przestrzeni żądania: ciasteczko jest
źródłem prawdy, a fallback działa **tylko** gdy użytkownik należy dokładnie do jednej
organizacji. Ciasteczko wskazujące obcą przestrzeń nie powoduje cichego fallbacku.

- `getActiveOrgId(userId)` / `getActiveMembership(userId)` — `null`, gdy nie da się ustalić.
- `requireOrgId(userId)` — rzuca `OrgContextError`; używaj w akcjach **zapisu**, bo zapis
  „gdzieś” jest gorszy niż zapis nieudany.

> **Pułapka:** konto serwisowe (`OrganizationMember.role = "SERVICE"`) należy do *każdej*
> organizacji. Dlatego „pierwsze membership” nigdy nie jest poprawną odpowiedzią —
> `prisma.organizationMember.findFirst({ where: { userId } })` bez `organizationId` to błąd.
> Pilnuje tego `src/lib/auth/__tests__/active-org.test.ts`.

### Uprawnienia modułowe

`src/lib/permissions/modules.ts` definiuje moduły (`dashboard`, `calendar`, `events`, `leads`,
`finances`, `team`, `configuration`, `settings`) i poziomy `none | view | edit`.
Macierz rola × moduł siedzi w `Organization.modulePermissionsJson`; poziom członka =
maksimum z jego ról (`OrganizationMember.rolesJson`). Owner / `isAdmin` / `SERVICE` /
`User.role = "ADMIN"` mają wszędzie `edit`.

Egzekwowanie ma dwie warstwy i obie są konieczne:

- **Podgląd:** `assertModuleView(moduleKey, locale)` w `layout.tsx` segmentu modułu
  (każdy moduł ma własny; `/app/settings/*` też, osobno od `settings/configuration`).
- **Zapis:** `assertModuleEdit(moduleKey)` na początku akcji serwerowej — rzuca
  `ModulePermissionError`. Ukrycie przycisku niczego nie chroni, bo akcję można wywołać
  bezpośrednio. Podpięte w ~40 akcjach zapisu. **Dodając akcję zapisu, dopisz bramkę.**
  Wyjątek: `createOrgLead` jest świadomie otwarty — to publiczny formularz zapytania.
- W UI: `canEditModule(moduleKey)` przekazywane jako `canEdit` do komponentu, który chowa
  przyciski zapisu.

### Portal klienta (bez konta)

`/{locale}/portal/[token]` — jedyne miejsce, gdzie klient końcowy wypełnia swoje kroki.
Wejście wyłącznie tokenem z `generateEventClientLink`; token nieznany i wygasły dają
**ten sam** komunikat, żeby nie zdradzać, który przypadek zaszedł.

> **Bezpieczeństwo:** `completeProcessNode` to server action, czyli zwykły endpoint HTTP.
> Klient legitymuje się tokenem (`clientToken`, z kontrolą wygaśnięcia), zespół obiektu —
> sesją i przynależnością eventu do aktywnej przestrzeni. **Dodając akcję wołaną z portalu,
> zweryfikuj token tak samo** — inaczej wystarczy znać ID eventu.

### Routing i dwa drzewa API

`src/middleware.ts` łączy bramę sesji z `next-intl` (`localePrefix: "always"`). Konsekwencje:

- **`src/app/[locale]/api/*`** — endpointy wołane z przeglądarki, adresy `/pl/api/...`.
- **`src/app/api/*`** — endpointy maszynowe pod gołym `/api/...` (`/api/cron/*`, `/api/webhooks/*`,
  `/api/admin/bootstrap`, `/api/health`, `/api/upload`). intlMiddleware przepisałby je na
  `/pl/api/...` → 404, dlatego **muszą być jawnie dopisane do `isLocaleAgnosticPublicRoute`**.
  Dodajesz nowy endpoint maszynowy — dopisz go tam.
- `/pl/admin` **celowo nie jest** w `isProtectedRoute`: strona sama zwraca `notFound()` dla
  nie-adminów, żeby przekierowanie na logowanie nie zdradziło, że panel istnieje. Nie „naprawiaj” tego.
- `src/app/org/[slug]` (publiczny profil obiektu + formularz zapytania) też omija i18n.
- Crony chronione `CRON_SECRET`.

### Proces → agenda (główny przepływ danych)

```
OrganizationWorkflow --< WorkflowNode      definicja procesu
                            fieldsJson         pola kroku [{key,label,type,targetAgendaKey,scheduleLine}]
                            fieldMappingsJson  [{sourceKey -> targetAgendaKey}]
                            fillRole / approveRole / assigneeRole / menuMode
        |
        v  src/lib/actions/process-runtime.actions.ts
EventProcessState      currentNodeId, completedNodeIds, nodeDataJson {nodeId: {data, completedBy...}}
        |  (mapowanie pól po ukończeniu kroku)
        v
EventAgendaData.dataJson   płaski obiekt kluczy `agenda.*`
        |
        v
src/lib/agenda/agenda-docx.ts   ZASZYTY układ DOCX (ręcznie składany OOXML)
```

- `src/lib/workflow-agenda-fields.ts` — słownik: co dany `actionType` oddaje do agendy i w jakie
  klucze agendy da się to zmapować. Dodając typ akcji, uzupełnij go tutaj, inaczej krok nie
  zasili agendy.
- **Agenda nie używa `AgendaDocumentTemplate`.** Szablony dokumentów
  (`/app/settings/document-templates`) to oferty i umowy — osobna ścieżka (`src/lib/documents`,
  `src/lib/contracts`, `docxtemplater`).
- `OrganizationWorkflow.stagesJson` jest DEPRECATED — proces to węzły `WorkflowNode`.
- **Krok `TABLE`** — `fieldsJson` opisuje wtedy KOLUMNY, nie pola. Kolumna ze wskazanym
  `targetAgendaKey` oddaje do agendy swoje wartości ze wszystkich wypełnionych wierszy
  (`tableAgendaEntries`); wiersze jadą w danych kroku pod `TABLE_ROWS_KEY`.
- **Krok `MENU_IMPORT`** — otwiera `MenuImportDialog`; reguły rozpoznawania menu są
  ustawieniem obiektu (`/app/settings/menu-parser`), a nie konfiguracją kroku.
- `src/lib/workflow-agenda-preview.ts` liczy, co proces odłoży w agendzie, i **musi
  odwzorowywać runtime**. Zmieniasz `applyStepFields` — zmień też podgląd, bo inaczej
  edytor obiecuje coś, czego agenda nie zrobi. Pilnują tego testy po obu stronach.

### Runtime DDL zamiast migracji

`ensureUserAuthColumns()` (`src/lib/auth/schema-migration.ts`), `ensureAgendaEventColumns()`
(`src/lib/agenda/agenda-schema-migration.ts`) i `ensureEventP1Columns()` (`src/lib/events/…`)
wykonują idempotentne `ALTER TABLE … ADD COLUMN IF NOT EXISTS` przy pierwszym użyciu, żeby
produkcja nie wywracała się na brakującej kolumnie. Actions wołają je przed zapytaniami.
To obejście, nie wzorzec — **nowe kolumny dodawaj migracją Prisma**; do list DDL dopisuj tylko,
gdy zmiana musi zadziałać na bazie bez świeżej migracji.

### Server actions

Cała logika zapisu to `"use server"` w `src/lib/actions/*.actions.ts`. Konwencja: akcja sama
ustala użytkownika (`getCurrentUser`) i organizację (`getActiveOrgId`), sama sprawdza uprawnienia,
kończy `revalidatePath(...)` i zwraca `{ ok: boolean; error?: string }`. Komponenty nie dotykają
Prismy bezpośrednio.

### Przestrzeń klienta startuje pusta

Nowa przestrzeń nie dostaje nic domyślnego — żadnych kategorii ani procesów. Co klient
dostaje, ustala administrator na wdrożeniu, przypisując wzorce z **biblioteki procesów**
(organizacja o slugu wzorcowym; `getTemplateLibrary`, `assignProcessToSpace`). Przypisanie
tworzy **kopię**, a drugie przypisanie tego samego wzorca jest odrzucane, żeby klient nie
zobaczył dwóch identycznych procesów.

`EventCategory` („typy eventów") jest **wycofany z UI** — ekran `/app/settings/event-types`
i sekcja kategorii w Ustawieniach nie istnieją, auto-seed pięciu kategorii systemowych
został usunięty. Model i relacje zostają w bazie (odczyt jest null-safe); nie przywracaj
konfiguracji kategorii bez wyraźnej decyzji.

### Plany i limity

`src/lib/plans.ts` — `START | PRO | ENTERPRISE` z limitami `maxAdmins`/`maxUsers`.
`Organization.plan` ma w bazie default `"FREE"` i stare wartości (`BASIC`) — dlatego **zawsze**
czytaj przez `normalizePlan()`, a limity przez `effectiveLimits()` (ręczne nadpisanie per
przestrzeń wygrywa z planem). `SERVICE` nie liczy się do limitów.

---

## Struktura (tylko nieoczywiste miejsca)

```
src/app/[locale]/app/        panel obiektu — dashboard, calendar, events, finances, leads, team, settings
src/app/[locale]/admin/      panel administratora platformy (404 dla nie-adminów)
src/app/[locale]/(auth)/     logowanie; obok onboarding/, after-auth/, legal/
src/app/[locale]/api/        API przeglądarkowe (prefiks locale)
src/app/api/                 API maszynowe (bez locale) — cron, webhooks, bootstrap, health, upload
src/app/org/[slug]/          publiczny profil obiektu + zapytanie ofertowe (poza i18n)
src/lib/actions/             server actions — całość logiki zapisu
src/lib/auth/                sesja, hasła, dostęp do eventu, aktywna organizacja
src/lib/permissions/         macierz uprawnień i strażnik modułów
src/lib/agenda/              generator DOCX agendy (zaszyty układ)
src/locales/{pl,en}.json     tłumaczenia ładowane przez src/lib/locale-messages.ts → src/i18n.ts
prisma/schema.prisma         ~85 modeli; EventBoard używa ich podzbioru
```

---

## Zmienne środowiskowe

Wzorzec: `.env.example` (częściowo nieaktualny — zawiera klucze Clerk, nie zawiera
`AUTH_SESSION_SECRET`, `TWILIO_*`). Lokalne nadpisania: `.env.local`.

Realnie używane: `DATABASE_URL` · `AUTH_SESSION_SECRET` (lub `JWT_SECRET`) ·
`NEXT_PUBLIC_APP_URL` · `CRON_SECRET` · `RESEND_API_KEY` / `RESEND_FROM` ·
`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` ·
`AI_PROVIDER` + `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY`
(`AI_PROVIDER=mock` działa bez klucza) · `AWS_*` · `ALLOWED_IPS` (whitelista IP w produkcji) ·
`NEXT_PUBLIC_DEV_MODE` (zakazany w produkcji — `getCurrentUser` rzuca wyjątkiem).

> **Pułapka:** schemat Prisma jest pod PostgreSQL, a `.env.local` potrafi wskazywać
> `file:./dev.db`. Do pracy lokalnej potrzebny prawdziwy `DATABASE_URL` (np. z Railway).

Deploy: Railway (`railway.json`, `railway.toml`, `npm run build:railway`).
`docker-compose.yml` podnosi PostgreSQL 15 lokalnie.

---

## Testy — stan faktyczny

`jest.setup.tsx` **globalnie mockuje** `@/lib/prisma`, `@/lib/permissions/guard`,
`@/lib/validations/sanitize`, `next/navigation`, `next-intl`, `@tanstack/react-query`, `sonner`,
część komponentów `ui` i `@dnd-kit`. Testy jednostkowe nie dotykają bazy — jeśli test wymaga
prawdziwych danych, zrób go jako E2E albo świadomie odmockuj Prismę w danym pliku.

Dwa mocki wymagają wyjaśnienia:

- **bramka uprawnień** jest domyślnie przepuszczająca, żeby nie być przedmiotem każdego testu;
  test samej bramki robi `jest.unmock("@/lib/permissions/guard")`,
- **`sanitize.ts`** uruchamia jsdom, a jsdom w środowisku jsdom wywracał Jestowi całe suity
  na zależności ESM.

Moduł serwerowy (jose, OOXML, Node crypto) testuj w środowisku `node` — pierwszą linią pliku
`/** @jest-environment node */`. `jest.setup.tsx` dokłada polyfille `TextEncoder`, WebCrypto
i `structuredClone`, bo jsdom ich nie ma.

Osiem suit z czasów produktu weselnego (guest/seating/task/event actions, seating-ai,
welcome-email, integration) ma nieaktualne asercje i jest czerwonych — to nie regresja.

E2E: `e2e/auth.spec.ts` + `e2e/api/`; przeglądarki Chromium, Firefox, WebKit, Pixel 5, iPhone 12.

---

## Konwencje

- Logika biznesowa wyłącznie w `src/lib/`; komponenty w `src/components/` pogrupowane tematycznie;
  hooki w `src/hooks/`.
- shadcn/ui jako baza UI (`components.json`), Tailwind, alias `@/` → `src/`.
- Tłumaczenia zawsze przez next-intl (`useTranslations` / `getTranslations`).
- Komentarze tylko tam, gdzie WHY jest nieoczywiste — istniejące komentarze są po polsku
  i tłumaczą decyzje, nie mechanikę; trzymaj ten styl.
- **Typy i lint blokują build** (`ignoreBuildErrors: false`, `ignoreDuringBuilds: false`)
  i są krokami blokującymi w CI. Lint jest wyczyszczony do zera i ma tak zostać.
  `noUnusedLocals`/`noUnusedParameters` w `tsconfig.json` są `false` — nieużywane zmienne
  raportuje ESLint jako ostrzeżenia.
- **Uwaga przy czytaniu lintu:** `eslint-config-next` zgłasza ten sam błąd kilkanaście
  razy. Licz zgłoszenia unikalne (plik + linia + reguła), nie surowe wiersze.
- `next.config.mjs` → `experimental.serverActions.allowedOrigins` — nowa domena wymaga wpisu tutaj.
- Reguła repo (`.cursor/rules/git-push-after-changes.mdc`): po skończonej zmianie commit i push na
  bieżący branch, chyba że użytkownik powie „tylko lokalnie”. Potwierdź przed pushem.
- Reguła repo (`.cursorrules.txt`): nowa funkcja ma mieć testy, uruchamiane zaraz po napisaniu kodu.

---

## Limity prób i eksport danych

- `src/lib/api/rate-limit-db.ts` — trwały licznik prób (tabela `rate_limit_hits`).
  Używany przy logowaniu i resecie hasła, bo licznik w pamięci procesu nie przeżywa
  restartu ani drugiej instancji. **Awaria bazy nie blokuje logowania** — licznik ma
  hamować zgadywanie haseł, a nie być kolejnym punktem awarii.
  `src/lib/api/rate-limit.ts` (w pamięci) zostaje do ochrony przed zalewem żądań.
- `GET /api/admin/space-export/<orgId>` — pełny JSON przestrzeni (RODO). Bez haseł
  i tokenów. Dla nie-adminów **404, nie 403**.
- Crony uwierzytelnia `isValidCronSecret` (nagłówek `x-cron-secret`; query dla zgodności).
  Harmonogram: `.github/workflows/cron.yml`, wymaga sekretów `APP_URL` i `CRON_SECRET`.

## Monitoring

`src/instrumentation.ts` — `register()` wypisuje dzienny kod dostępu admina i inicjalizuje
Sentry, ale **tylko gdy jest `SENTRY_DSN`**; `onRequestError` łapie 5xx z renderowania i tras API.
`src/lib/errors/alerting.ts` wysyła e-mail (Resend) i SMS (Twilio) na `ALERT_EMAIL` / `ALERT_SMS_TO`
przy błędach 5xx, z tłumieniem powtórek tego samego błędu. `sendDefaultPii: false` — dane
o alergiach gości nie wychodzą do zewnętrznego dostawcy.

---

## Znane rozbieżności

- `src/lib/actions/event-client.actions.ts:71` generuje link dla klienta
  `/${locale}/portal/${token}`, ale **trasa `[locale]/portal` nie istnieje** — link daje 404.
- `README.md` opisuje stary produkt („Wedding AI Planner”, Clerk, mock auth) i jest nieaktualny.
- `PLAN-NAPRAWY.md` — bieżący plan naprawy blokerów produkcyjnych (izolacja danych między
  klientami, reset hasła, domknięcie typów, monitoring). Zajrzyj tam przed większą zmianą.
