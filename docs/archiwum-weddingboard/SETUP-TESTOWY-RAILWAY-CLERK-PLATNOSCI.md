# Setup testowy: Railway (staging) + Clerk + Płatności – krok po kroku

Środowisko **tylko do testów** – bez produkcji, bez prawdziwych płatności.

---

## Spis treści

1. [Przygotowanie pliku z zmiennymi lokalnie](#1-przygotowanie-pliku-z-zmiennymi-lokalnie)
2. [Clerk – konfiguracja i klucze testowe](#2-clerk--konfiguracja-i-klucze-testowe)
3. [Uruchomienie lokalne (do testów)](#3-uruchomienie-lokalne-do-testów)
4. [Railway – projekt, baza, deploy ze zdalnego repo](#4-railway--projekt-baza-deploy-ze-zdalnego-repo)
5. [Clerk – dopuszczenie domeny Railway](#5-clerk--dopuszczenie-domeny-railway)
6. [Stripe – klucze testowe (bez integracji w kodzie)](#6-stripe--klucze-testowe-bez-integracji-w-kodzie)
7. [Sprawdzenie i typowe problemy](#7-sprawdzenie-i-typowe-problemy)

---

## 1. Przygotowanie pliku z zmiennymi lokalnie

**Cel:** Mieć jeden plik z zmiennymi tylko na swoim komputerze (nie w repo).

1. W katalogu projektu (tam gdzie jest `package.json`) otwórz terminal.
2. Sprawdź, czy istnieje `.env.example`:
   ```bash
   dir .env.example
   ```
3. Skopiuj zawartość przykładu do pliku lokalnego (Windows PowerShell):
   ```powershell
   Copy-Item .env.example .env.local
   ```
   Lub ręcznie: skopiuj całą zawartość `.env.example`, utwórz nowy plik `.env.local` i wklej. Zapisz.
4. Upewnij się, że `.env.local` jest w `.gitignore` (w tym projekcie zwykle jest) – **nigdy** nie commituj `.env.local`.

Dalej w tym pliku będziesz wklejać prawdziwe wartości (Clerk, Stripe itd.); `.env.example` zostaw z placeholderami.

---

## 2. Clerk – konfiguracja i klucze testowe

**Cel:** Pobranie kluczy testowych z Clerk i wpisanie ich do `.env.local`, żeby logowanie działało lokalnie.

### 2.1 Logowanie do Clerk

1. Wejdź na [https://dashboard.clerk.com](https://dashboard.clerk.com).
2. Zaloguj się (lub załóż konto).
3. Upewnij się, że jesteś w **Development** (nie Production) – w lewym menu / u góry nie powinno być przełącznika na Production.

### 2.2 Wybór aplikacji (instance)

1. Na liście aplikacji wybierz swoją (np. „Wedding Board” / „Wedding Guide”) lub kliknij **Add application** i utwórz nową (np. „Wedding Board Test”).
2. Wejdź w tę aplikację – zobaczysz panel z zakładkami (Overview, Users, Configure itp.).

### 2.3 Pobranie kluczy API

1. W lewym menu kliknij **API Keys** (lub **Configure** → **API Keys**).
2. Zobaczysz dwa klucze:
   - **Publishable key** – zaczyna się od `pk_test_...` (w trybie Development).
   - **Secret key** – przyciskiem **Show** / **Reveal** pokażesz wartość; zaczyna się od `sk_test_...`.
3. Skopiuj oba (np. Ctrl+C):
   - `pk_test_...` (cały string).
   - `sk_test_...` (cały string, bez spacji na początku/końcu).

### 2.4 Wpisanie kluczy do `.env.local`

1. Otwórz plik `.env.local` w edytorze.
2. Znajdź linijki:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. Zamień `pk_test_...` na skopiowany **Publishable key** (bez cudzysłowów).
4. Zamień `sk_test_...` na skopiowany **Secret key**.
5. Upewnij się, że poniżej są (możesz zostawić dokładnie tak):
   ```env
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```
   W Next.js z `[locale]` ścieżki mogą być np. `/[locale]/sign-in` – jeśli tak masz w projekcie, wpisz te. Zapisuj plik.

### 2.5 (Opcjonalnie) Ścieżki w Clerk Dashboard

1. W Clerk: **Configure** → **Paths** (lub **Paths & URLs**).
2. Sprawdź, czy **Sign-in URL** i **Sign-up URL** są spójne z tym, co masz w `.env.local` (np. `/sign-in`, `/sign-up` albo z prefiksem locale).
3. **After sign-in / After sign-up** – np. `/dashboard` (lub `/[locale]/dashboard`). Nie zmieniaj na razie, jeśli domyślne działają.

Na tym etapie Clerk jest gotowy do testów **lokalnie**. Railway dopuścimy w kroku 5.

---

## 3. Uruchomienie lokalne (do testów)

**Cel:** Uruchomić aplikację na swoim komputerze z bazą w Dockerze i Clerk.

### 3.1 Baza danych (PostgreSQL w Dockerze)

1. W katalogu projektu (gdzie jest `docker-compose.yml`) otwórz terminal.
2. Uruchom kontenery w tle:
   ```powershell
   docker-compose up -d
   ```
3. Sprawdź, czy kontenery działają:
   ```powershell
   docker-compose ps
   ```
   Powinny być dwa: `app` (opcjonalnie) i `db` – ważne, żeby `db` był „Up”.
4. W `.env.local` upewnij się, że masz:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wedding_planner?schema=public"
   ```
   (To jest to samo co w `docker-compose` dla lokalnej bazy.)

### 3.2 Migracje bazy (jeśli jeszcze nie robione)

1. W tym samym katalogu:
   ```powershell
   npx prisma migrate dev
   ```
   Lub jeśli wolisz tylko „zastosować” schemat bez plików migracji:
   ```powershell
   npx prisma db push
   ```
2. (Opcjonalnie) Seed danych testowych:
   ```powershell
   npm run db:seed
   ```

### 3.3 Uruchomienie aplikacji

1. W katalogu projektu:
   ```powershell
   npm run dev
   ```
2. Poczekaj, aż zobaczysz coś w stylu: `Ready on http://localhost:3000` (może być inny port, np. 3001, jeśli 3000 jest zajęty).
3. Otwórz przeglądarkę: **http://localhost:3000** (albo podany port).
4. Sprawdzenie Clerk:
   - Wejdź na stronę logowania (np. **/sign-in** lub **/pl/sign-in**).
   - Zarejestruj nowego użytkownika (e-mail + hasło).
   - Po rejestracji powinno przekierować na dashboard – wtedy Clerk działa lokalnie.

Jeśli coś się wywala (błąd 500, „Clerk not configured”), wróć do kroku 2 i sprawdź, czy w `.env.local` są dokładnie wklejone klucze bez błędów i czy po zmianach zrestartowałeś `npm run dev`.

---

## 4. Railway – projekt, baza, deploy ze zdalnego repo

**Cel:** Deploy aplikacji z gałęzi **develop** na Railway (środowisko testowe), z osobną bazą PostgreSQL.

### 4.1 Logowanie i nowy projekt

1. Wejdź na [https://railway.app](https://railway.app).
2. Zaloguj się (np. **Login with GitHub**).
3. Na stronie głównej (Dashboard) kliknij **New Project**.

### 4.2 Podłączenie repozytorium GitHub

1. W oknie **Create a new project** wybierz **Deploy from GitHub repo**.
2. Jeśli pierwszy raz – autoryzuj Railway do dostępu do GitHub (wybierz konto/organizację).
3. Z listy repozytoriów wybierz **WeddingBoard** (lub dokładną nazwę repo).
4. Kliknij **Deploy now** lub **Add repository** – Railway utworzy „usługę” z tego repo. Na razie może być bez bazy.

### 4.3 Ustawienie gałęzi (branch) na develop

1. Kliknij w utworzoną usługę (kafelek z nazwą repo).
2. Wejdź w **Settings** (zakładka u góry lub w menu).
3. Znajdź **Source** / **Branch**.
4. Ustaw **Branch** na **develop** (z listy lub wpisz `develop`).
5. Zapisz. Kolejne deploye będą budowane z gałęzi `develop`.

### 4.4 Dodanie bazy PostgreSQL

1. W tym samym **projekcie** (nie w ustawieniach usługi), na stronie projektu kliknij **+ New** (lub **Add service**).
2. Wybierz **Database** → **PostgreSQL** (lub **Add PostgreSQL**).
3. Railway utworzy nową usługę z PostgreSQL i automatycznie utworzy zmienną `DATABASE_URL`.
4. Aby aplikacja mogła z niej skorzystać:
   - Kliknij w **usługę z Twoją aplikacją** (repo).
   - Wejdź w **Variables** (zakładka).
   - Powinna być już zmienna **DATABASE_URL** z **Reference** (odniesienie do bazy) – jeśli Railway oferuje „Reference”, wybierz zmienną z bazy (np. `DATABASE_URL` z usługi PostgreSQL).  
   - Jeśli nie ma: w usłudze PostgreSQL wejdź w **Variables**, skopiuj wartość `DATABASE_URL`, i w usłudze aplikacji w **Variables** dodaj ręcznie: nazwa `DATABASE_URL`, wartość wklejona.

### 4.5 Zmienne środowiskowe aplikacji na Railway

1. W usłudze aplikacji (repo) wejdź w **Variables**.
2. Dodaj **wszystkie** zmienne potrzebne do działania (te same co w `.env.local`, **bez** wpisywania prawdziwych haseł do repo). Minimum do testów:
   - **DATABASE_URL** – z kroku 4.4 (reference lub wklejona wartość).
   - **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** – ta sama wartość co w `.env.local` (`pk_test_...`).
   - **CLERK_SECRET_KEY** – ta sama wartość co w `.env.local` (`sk_test_...`).
   - **NEXT_PUBLIC_CLERK_SIGN_IN_URL** – np. `/sign-in` (lub z locale, jak w projekcie).
   - **NEXT_PUBLIC_CLERK_SIGN_UP_URL** – np. `/sign-up`.
   - **NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL** – np. `/dashboard`.
   - **NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL** – np. `/dashboard`.
3. Opcjonalnie (żeby aplikacja nie wywalała się): **AI_PROVIDER** = `mock`, **RESEND_API_KEY** jeśli używasz (można na razie pominąć lub dać placeholder).
4. Zapisz zmienne. Railway zwykle automatycznie przebuduje deploy po zapisaniu Variables.

### 4.6 Build i start (Next.js na Railway)

1. Railway wykrywa Next.js i uruchomi `build` + `start`. Jeśli w projekcie jest **Dockerfile**, może użyć Docker – zależy od konfiguracji.
2. W **Settings** usługi aplikacji sprawdź:
   - **Build Command** – np. `npm run build` lub puste (domyślne).
   - **Start Command** – np. `npm start` lub `npx next start`.
   - **Root Directory** – puste, jeśli repo to jeden projekt; jeśli masz monorepo, wskaż podkatalog.
3. **Deploy** – jeśli nie zrobił się sam, w zakładce **Deployments** kliknij **Deploy** / **Redeploy**.

### 4.7 Adres publiczny (domena Railway)

1. W usłudze aplikacji wejdź w **Settings** → **Networking** (lub **Generate domain**).
2. Kliknij **Generate domain** (lub **Add domain**). Railway nada adres typu: `nazwa-usługi-production-xxxx.up.railway.app`.
3. Skopiuj ten URL (np. `https://weddingboard-production-abc123.up.railway.app`) – będzie potrzebny w kroku 5 dla Clerk.

Po zakończeniu tego kroku masz działający deploy **tylko do testów** (staging); nie podpinamy jeszcze domeny z home.pl.

---

## 5. Clerk – dopuszczenie domeny Railway

**Cel:** Żeby logowanie (sign-in/sign-up) działało na adresie Railway, Clerk musi „widzieć” ten adres jako dozwolony.

1. Wróć do [Clerk Dashboard](https://dashboard.clerk.com) → Twoja aplikacja (Development).
2. Wejdź w **Configure** → **Domains** (lub **Paths** / **Allowed redirect URLs** – nazwa zależy od wersji panelu).
3. Szukaj sekcji typu **Allowed origins** / **Redirect allowlist** / **Authorized redirect URLs** / **Domains**.
4. Dodaj:
   - Pełny URL Railway, np. `https://weddingboard-production-abc123.up.railway.app`
   - Czasem trzeba dodać też bez `https://`, tylko domena: `weddingboard-production-abc123.up.railway.app`
5. Jeśli jest pole **Sign-in URL** / **Sign-up URL** i wymaga pełnego URL – możesz ustawić np. `https://twoja-domena.up.railway.app/sign-in` (dostosuj do swojego routingu, np. z `[locale]`).
6. Zapisz.

Teraz otwórz w przeglądarce adres Railway – wejdź na `/sign-in`, zarejestruj innego użytkownika niż lokalnie. Jeśli przekieruje na dashboard bez błędów, Clerk na Railway działa.

---

## 6. Stripe – klucze testowe (bez integracji w kodzie)

**Cel:** Mieć konto Stripe w trybie test i klucze wpisane w env; **nie** implementujemy jeszcze Checkoutu ani webhooków.

### 6.1 Konto Stripe

1. Wejdź na [https://stripe.com](https://stripe.com) → **Sign in** lub **Create account**.
2. Załóż konto (e-mail, hasło itd.).

### 6.2 Tryb testowy

1. Po zalogowaniu wejdź w [Stripe Dashboard](https://dashboard.stripe.com).
2. U góry strony (prawa strona) znajdź przełącznik **Test mode** / **Tryb testowy**.
3. Włącz go (powinien być pomarańczowy / „On”). Wszystko dalej dotyczy tylko testów – żadne prawdziwe płatności.

### 6.3 Pobranie kluczy API (test)

1. W lewym menu kliknij **Developers** → **API keys** (lub **Developers** → **API keys**).
2. Upewnij się, że nadal jest włączony **Test mode** (na stronie kluczy też to widać).
3. Skopiuj:
   - **Publishable key** – `pk_test_...`
   - **Secret key** – **Reveal** i skopiuj `sk_test_...`

### 6.4 Wpisanie kluczy do `.env.local` i Railway

1. W `.env.local` dodaj (na końcu lub przy innych Stripe):
   ```env
   STRIPE_SECRET_KEY=sk_test_...twoja_wartość...
   STRIPE_PUBLISHABLE_KEY=pk_test_...twoja_wartość...
   ```
2. W Railway w **Variables** usługi aplikacji dodaj te same dwie zmienne z tymi samymi wartościami.
3. **Nie** commituj tych wartości do repo – w `.env.example` są tylko placeholdery (`sk_test_...`, `pk_test_...`).

**Webhook** (`STRIPE_WEBHOOK_SECRET`) – pomijamy na etapie „tylko testowo”. Będzie potrzebny, gdy dodasz endpoint do Stripe (np. Checkout Session completed); wtedy w Stripe utworzysz webhook i wkleisz `whsec_...` do zmiennych.

Na tym etapie masz **zdefiniowane** płatności testowo (klucze w env); sama integracja (przyciski „Zapłać”, subskrypcje) to kolejny etap rozwoju aplikacji.

---

## 7. Sprawdzenie i typowe problemy

### Checklist po konfiguracji

- [ ] `.env.local` istnieje, ma Clerk (pk_test, sk_test) i DATABASE_URL; nie jest w repo.
- [ ] Lokalnie: `docker-compose up -d`, `npx prisma migrate dev` (lub `db push`), `npm run dev` – strona się ładuje, rejestracja/logowanie działa.
- [ ] Railway: projekt z repo, branch **develop**, dodana baza PostgreSQL, Variables uzupełnione (DATABASE_URL, Clerk).
- [ ] Railway: wygenerowana domena, URL skopiowany.
- [ ] Clerk: domena Railway dodana do dozwolonych (Allowed origins / redirect URLs).
- [ ] Na adresie Railway: otwarcie `/sign-in`, rejestracja – działa bez błędów.
- [ ] Stripe: klucze testowe w `.env.local` i w Railway Variables (opcjonalnie na start).

### Typowe błędy

| Objaw | Co sprawdzić |
|-------|----------------|
| „Clerk not configured” / brak logowania | Obie zmienne Clerk w `.env.local` (i na Railway); brak spacji wokół `=`; restart `npm run dev` / redeploy. |
| 404 / błąd po zalogowaniu na Railway | Clerk → dopuszczona dokładnie ta domena (https://...) i ewentualnie ścieżki after sign-in/sign-up. |
| Błąd bazy na Railway | W usłudze aplikacji zmienna `DATABASE_URL` wskazuje na PostgreSQL z tego samego projektu (reference lub skopiowana wartość). |
| Build fails na Railway | W **Settings** sprawdź Build/Start command i Node version (np. 18); w repo niech będzie `package-lock.json` i poprawne `package.json` scripts. |
| „Repository not found” przy push | To problem Git/GitHub (dostęp do repo, konto w Credential Manager) – nie Railway. |

### Kolejność przy pierwszym uruchomieniu

1. Clerk (klucze + ścieżki) → lokalnie.
2. Lokalnie: baza + migracje + `npm run dev` + test logowania.
3. Railway: projekt, repo develop, PostgreSQL, Variables, domena.
4. Clerk: dopuszczenie domeny Railway.
5. Test logowania na URL Railway.
6. Stripe: klucze testowe w env (lokalnie + Railway) – bez kodu płatności na razie.

Gdy to wszystko działa, masz środowisko **tylko do testów** (lokalnie + staging na Railway) z Clerk i z gotowością na późniejszą integrację Stripe.
