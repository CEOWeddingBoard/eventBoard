# Produkcja, 3 środowiska i podgląd bazy na Railway

Przewodnik krok po kroku: uruchomienie produkcji, utrzymanie środowisk **developerskie**, **release** i **master** bez utraty danych oraz podgląd bazy w Railway.

---

## 1. Trzy środowiska

| Środowisko   | Branch w repo | Przeznaczenie                    | Baza danych      |
|-------------|---------------|----------------------------------|------------------|
| **developerskie** | `develop` (lub `dev`) | Codzienna praca, testy funkcji   | Osobna PostgreSQL (dev) |
| **release** | `release`     | Testy przed produkcją, QA        | Osobna PostgreSQL (release) |
| **master**  | `main` / `master` | Produkcja — prawdziwi użytkownicy | Osobna PostgreSQL (prod) |

Zasada: **jedna baza na środowisko**. Nigdy nie łącz develop/release/master z tą samą bazą — unikasz przypadkowego nadpisania lub utraty danych produkcyjnych.

---

## 2. Konfiguracja środowisk w Railway

### 2.1 Utworzenie środowisk

1. Zaloguj się na [railway.app](https://railway.app) → projekt **WeddingBoard**.
2. W górnym pasku wybierz **Environment** (domyślnie: Production).
3. Kliknij **+ New Environment**.
4. Utwórz:
   - **developerskie** (Empty Environment lub Duplicate, jeśli chcesz skopiować konfigurację).
   - **release** (Empty Environment).
   - Domyślne **production** potraktuj jako **master** (możesz je przemianować w Settings → Environments, jeśli Railway na to pozwala; nazwa „production” = master w tym dokumencie).

Jeśli w projekcie jest już tylko **production**:
- Dodaj środowiska **developerskie** i **release** przez **+ New Environment**.

### 2.2 Usługi w każdym środowisku

Dla **każdego** środowiska (developerskie, release, master):

1. **PostgreSQL** — osobna usługa bazy w każdym środowisku:
   - W wybranym środowisku: **+ New** → **Database** → **PostgreSQL**.
   - Powstanie usługa z zmienną `DATABASE_URL` (lub `PGHOST`, `PGUSER` itd. — Railway często wystawia `DATABASE_URL`).
2. **Aplikacja Next.js** — osobna usługa w każdym środowisku:
   - **+ New** → **GitHub Repo** → wybierz repozytorium.
   - Dla tej usługi ustaw **Branch** (patrz tabela wyżej): `develop` → developerskie, `release` → release, `main`/`master` → master.

Nie dziel jednej bazy między środowiskami. Developerskie i release mogą mieć tańsze/ mniejsze plany; master — stabilna baza produkcyjna.

### 2.3 Zmienne środowiskowe per środowisko

W każdym środowisku zmienne są **osobne**. Ustaw je w **Variables** dla danej usługi (aplikacji):

- **developerskie / release:**  
  Clerk (test), Stripe (test), `DATABASE_URL` z usługi Postgres **tego samego** środowiska, AI (test/deepseek), itd.
- **master (produkcja):**  
  Clerk (Live), Stripe (Live), `STRIPE_WEBHOOK_SECRET` z webhooka Live, `DATABASE_URL` z Postgresa w **master**, AI (produkcyjne klucze).

Aby aplikacja w danym środowisku używała bazy z tego samego środowiska:
- W usłudze **aplikacji** dodaj zmienną `DATABASE_URL` i ustaw ją na **Reference** do usługi PostgreSQL w tym środowisku (np. `${{Postgres.DATABASE_URL}}`), albo skopiuj wartość z zakładki Variables usługi PostgreSQL.

---

## 3. Uruchomienie produkcji krok po kroku

### Krok 1: Baza i migracje na master

1. W środowisku **master** (production) upewnij się, że jest usługa **PostgreSQL** i że usługa aplikacji ma ustawione `DATABASE_URL` z tej bazy.
2. W `prisma/schema.prisma` dla wdrożenia upewnij się, że `provider = "postgresql"` (na Railway nie używaj SQLite).
3. Migracje na produkcję wykonaj **jednorazowo** z maszyny, na której masz dostęp do sieci i Prisma (np. lokalnie z `.env` wskazującym na produkcyjny `DATABASE_URL`):
   - Skopiuj **DATABASE_URL** z Railway: projekt → środowisko **master** → usługa PostgreSQL → Variables (lub Connect).
   - Lokalnie: w pliku `.env.production` (nie commituj) ustaw `DATABASE_URL=<skopiowany_url>`.
   - Uruchom:
     ```bash
     npx prisma migrate deploy
     ```
   Dzięki temu tabele w bazie master będą zgodne ze schematem bez resetowania bazy.

### Krok 2: Zmienne produkcyjne (master)

W Railway → środowisko **master** → usługa **aplikacji** → **Variables** ustaw m.in.:

- `DATABASE_URL` — z usługi PostgreSQL w master (reference lub wklejony).
- Clerk (Live): `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`.
- Stripe (Live): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (webhook w Stripe wskazuje na URL aplikacji w master).
- AI / inne: według potrzeb (np. `AI_PROVIDER`, `DEEPSEEK_API_KEY`).

Szczegóły Stripe/Clerk: [WDROZENIE-PRODUKCJA-PLATNOSCI.md](./WDROZENIE-PRODUKCJA-PLATNOSCI.md).

### Krok 3: Domena i webhook

- W Stripe (Live): Webhooks → Add endpoint → URL: `https://TWOJA-DOMENA/api/webhooks/stripe`, event `checkout.session.completed` → skopiuj **Signing secret** → wklej do `STRIPE_WEBHOOK_SECRET` w master.
- W Clerk: Allowed redirect URLs na domenę produkcyjną.
- W Railway dla usługi w master: ustaw domenę (np. Custom Domain lub domyślny `*.up.railway.app`).

### Krok 4: Deploy

- W master deploy następuje po pushu na branch `main`/`master` (jeśli masz włączony auto-deploy z GitHub).
- Po wdrożeniu sprawdź: logi w Railway, health endpoint (np. `/api/health`), logowanie, płatność testowa.

---

## 4. Dbanie o środowiska (na co dzień)

### 4.1 Priorytet: produkcja (master)

- **Master to świętość** — zmiany kodu i schematu trafiają tam na końcu, po develop i release.
- Na master **nigdy** nie uruchamiaj: `prisma migrate reset`, `prisma db push`, `db:seed` ani niczego, co nadpisuje lub czyści dane.
- Na master używaj wyłącznie: `prisma migrate deploy` (stosuje oczekujące migracje bez resetu).
- Zmienne w master (Clerk, Stripe, `DATABASE_URL`) trzymaj tylko dla produkcji; nie podmieniaj ich „na test”.

### 4.2 Osobna baza na środowisko

- **developerskie** → baza tylko dla develop (testowe dane, seed).
- **release** → baza tylko dla release (kopie/testy, bez danych z produkcji).
- **master** → jedyna baza z danymi użytkowników; **nie** używaj jej w develop/release.

Dzięki temu migracje testujesz na develop/release przed wdrożeniem na master, a przypadkowy reset/seed nie niszczy produkcji.

### 4.3 Codzienne zasady

| Środowisko   | Co robisz                                                                 |
|-------------|---------------------------------------------------------------------------|
| **developerskie** | Praca na `develop`, `prisma migrate dev`, seed, testy, eksperymenty.     |
| **release** | Deploy z `release`; testy QA; tu najpierw wjeżdża ta sama migracja co potem na master. |
| **master**  | Deploy tylko z `main`/`master`; tylko `prisma migrate deploy`; backupy przed migracją. |

### 4.4 Backupy bazy (master)

- Railway: w planie płatnym włącz **Backups** dla PostgreSQL w master.
- Przed każdą migracją na produkcji: zrób ręczny backup (dump) lub upewnij się, że jest świeży automatyczny.
- Lokalny dump (opcjonalnie): `pg_dump "$DATABASE_URL" -Fc -f backup_$(date +%Y%m%d_%H%M).dump` — trzymaj w bezpiecznym miejscu, nie w repo.

### 4.5 Sync konfiguracji między środowiskami

- **Sync** w Railway przenosi **definicje usług i zmiennych** (nie dane). Używaj go, gdy chcesz dodać nowe zmienne z release do master; wartości wrażliwe (klucze Live) ustaw ręcznie w master.
- Bazy pozostają rozdzielone — Sync nie kopiuje danych.

---

## 5. Jak dodawać zmiany, gdy w bazie są już wpisy (migracje na żywych danych)

Gdy w produkcji są już użytkownicy i dane, każda zmiana schematu musi być **bezpieczna**: nie usuwać danych, nie łamać działającej aplikacji.

### 5.1 Złota zasada: najpierw develop → release → master

1. **Develop:** zmiana w `schema.prisma` → `npx prisma migrate dev --name opis_zmiany` → powstaje plik w `prisma/migrations/`.
2. **Release:** wgraj migrację na bazę release (np. ustaw lokalnie `DATABASE_URL` z release i uruchom `npx prisma migrate deploy`), zdeployuj branch `release`, przetestuj.
3. **Master:** po sukcesie na release — backup bazy master → ustaw lokalnie `DATABASE_URL` z master → `npx prisma migrate deploy` → deploy kodu z `main`/`master`.

Na master **nigdy** nie uruchamiaj `prisma migrate dev` (tworzy/zmienia migracje w locie). Używaj tylko gotowych migracji z repo i `prisma migrate deploy`.

### 5.2 Bezpieczne typy zmian (gdy w tabelach są już wiersze)

- **Dodanie nowej tabeli** — bezpieczne; migracja tworzy pustą tabelę.
- **Dodanie kolumny opcjonalnej (nullable)** — bezpieczne: `name String?` albo w SQL `ALTER TABLE ... ADD COLUMN ... NULL`.
- **Dodanie kolumny z `@default(...)`** — Prisma wygeneruje `ADD COLUMN ... DEFAULT ...`; istniejące wiersze dostaną wartość domyślną — zwykle OK.
- **Dodanie kolumny wymaganej bez defaulta** — **niebezpieczne**: stare wiersze nie mają wartości. Unikaj na żywych danych albo rób w dwóch krokach (patrz niżej).

### 5.3 Niebezpieczne zmiany — jak je robić w dwóch krokach

**Przykład: chcesz dodać wymaganą kolumnę `phone String` do tabeli z istniejącymi użytkownikami.**

- **Krok 1 (migracja A):** dodaj kolumnę jako opcjonalną i ewentualnie wypełnij dane:
  - W schemacie: `phone String?`
  - `prisma migrate dev --name add_phone_nullable`
  - Opcjonalnie: napisz skrypt lub ręcznie (SQL/Prisma) uzupełnij `phone` tam, gdzie możesz; dla reszty zostaw NULL.
- **Krok 2 (migracja B):** uczyń kolumnę wymaganą dopiero gdy nie ma już (lub prawie nie ma) NULLi:
  - W schemacie: `phone String` (bez `?`)
  - `prisma migrate dev --name make_phone_required`
  - Prisma wygeneruje `ALTER COLUMN ... SET NOT NULL`. Uruchom tylko wtedy, gdy wiesz, że wszystkie wiersze mają wartość (albo zaakceptujesz błąd i cofniesz migrację).

**Usuwanie kolumny:** najpierw upewnij się, że kod nigdzie jej nie używa (deploy bez tej kolumny), potem dopiero migracja usuwająca kolumnę. W razie pomyłki przywracasz z backupu.

### 5.4 Checklist przed migracją na master

1. [ ] Migracja jest w repo (commit na `main`/`master`).
2. [ ] Ta sama migracja była już zastosowana i przetestowana na **release** (baza + aplikacja).
3. [ ] Backup bazy master zrobiony (Railway lub `pg_dump`).
4. [ ] Lokalnie: `DATABASE_URL` wskazuje na master (np. `.env.production`), **nie** na dev/release.
5. [ ] Uruchamiasz: `npx prisma migrate deploy` (nic innego).
6. [ ] Po deployu: sprawdzasz logi aplikacji i ewentualnie health/endpointy; w razie problemu masz plan rollbacku (np. przywrócenie backupu + cofnięcie deployu).

### 5.5 Gdy coś pójdzie nie tak na master

- **Błąd migracji:** nie restartuj aplikacji w kółko z tą samą migracją. Napraw schemat/migrację (najlepiej na develop), przetestuj na release, dopiero potem poprawkę wdróż na master. W skrajnym przypadku: przywróć bazę z backupu i wdróż poprzednią wersję kodu.
- **Rollback kodu:** cofnięcie deployu w Railway (poprzedni deployment) przywraca stary kod; baza zostaje w stanie po ostatniej migracji. Dlatego migracje powinny być „do przodu” (nowe kolumny/tabele), a usuwanie kolumn/tabel rób ostrożnie i po wycofaniu użycia w kodzie.

---

## 6. Jak podejrzeć bazę danych w Railway

Masz trzy główne sposoby:

### 6.1 Panel Railway — zakładka Data (PostgreSQL)

1. [railway.app](https://railway.app) → projekt → wybierz **środowisko** (developerskie / release / master).
2. Kliknij **usługę PostgreSQL** (nie usługę aplikacji).
3. W górnym menu wejdź w **Data** (lub **Query** / **Tables**).
4. Możesz przeglądać tabele i wykonywać zapytania SQL.

To najszybszy sposób „na szybko” bez klienta z zewnątrz.

### 6.2 Klient lokalny (TablePlus, DBeaver, pgAdmin)

1. W Railway: wybierz środowisko → usługa **PostgreSQL** → **Variables** (lub **Connect**).
2. Skopiuj **DATABASE_URL** (np. `postgresql://user:password@host:port/railway`).
3. W kliencie: nowe połączenie PostgreSQL, wklej URL lub wpisz host, port, użytkownik, hasło, baza.
4. Dla połączenia z zewnątrz: na darmowym planie może być wymagane **Public Networking** dla usługi Postgres.

### 6.3 Prisma Studio (lokalnie, z bazą z Railway)

1. Skopiuj `DATABASE_URL` z wybranego środowiska (develop/release/master) z usługi Postgres.
2. Lokalnie ustaw w `.env`: `DATABASE_URL=<url_z_railway>`.
3. Uruchom: `npx prisma studio` — otworzy się podgląd tabel; widzisz dokładnie dane z wybranej bazy Railway.

Więcej szczegółów: [RAILWAY-PODGLAD-BAZY.md](./RAILWAY-PODGLAD-BAZY.md).

---

## 7. Podsumowanie

| Cel | Działanie |
|-----|-----------|
| 3 środowiska | Utwórz w Railway: developerskie, release; production = master. Osobna usługa Postgres + osobna usługa aplikacji w każdym, z odpowiednim branchem. |
| Uruchomienie produkcji | Postgres w master → `DATABASE_URL` w app → `prisma migrate deploy` → zmienne Clerk/Stripe (Live) + webhook → domena → deploy z `main`/`master`. |
| Dbanie o środowiska | Master = tylko produkcja; nigdy `migrate reset`/`db push`/seed na master. Develop/release do testów i migracji przed master. Backupy master przed każdą migracją. |
| Dodawanie zmian przy istniejących danych | Zmiana w `schema.prisma` → `migrate dev` na develop → test na release (`migrate deploy`) → backup master → `migrate deploy` na master → deploy kodu. Nowe kolumny wymagane dodawaj w dwóch krokach (najpierw nullable). |
| Podgląd bazy w Railway | Środowisko → usługa PostgreSQL → Data/Query; albo klient + `DATABASE_URL`; albo lokalnie Prisma Studio z `DATABASE_URL` z Railway. |

Po wdrożeniu utrzymuj zmienne i klucze per środowisko (test vs Live) i nie łącz nigdy bazy master z develop/release.
