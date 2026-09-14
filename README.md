# EventBoard

Platforma SaaS dla sal, restauracji i obiektów eventowych. Obiekt prowadzi w niej obsługę
przyjęć: kalendarz, wydarzenia, **procesy obsługi**, warianty menu, agendę dla kuchni
i obsługi, zespół z uprawnieniami oraz zapytania ofertowe.

Sercem produktu jest **proces**: konfigurowalne kroki z rolami („kto wypełnia", „kto
akceptuje"), z których **automatycznie składa się agenda**. Agenda nie ma osobnej
konfiguracji — jedynym źródłem prawdy jest proces.

## Model dostępu

Nie ma publicznej rejestracji. Przestrzenie klientów zakłada administrator platformy
(`/pl/admin`, konto z `User.role = "ADMIN"`), on też generuje dane logowania. Nowa
przestrzeń startuje **pusta** — co klient dostaje, ustala się na wdrożeniu, przypisując
wzorce z biblioteki procesów.

Klient końcowy (para młoda, organizator przyjęcia) **nie ma konta**. Dostaje link
z tokenem do portalu `/pl/portal/<token>`, gdzie wypełnia swoje kroki procesu.

Płatności są ręczne — faktura poza systemem, status opłacenia ustawia administrator.

## Stack

Next.js 15 (App Router) · TypeScript · React 18 · TailwindCSS + shadcn/ui · Prisma 5 +
PostgreSQL · next-intl · TanStack Query · Playwright + Jest · Railway

Logowanie jest **własne**: e-mail + hasło (bcrypt) i podpisany token sesji w cookie.

## Uruchomienie

Wymagania: Node 18.17+ (poniżej 22) i **PostgreSQL** — schemat Prisma jest pod Postgresa,
SQLite nie wystarczy.

```bash
npm install
cp .env.example .env.local     # uzupełnij DATABASE_URL i AUTH_SESSION_SECRET
npx prisma migrate deploy
npm run db:seed
npm run dev                    # http://localhost:3000
```

Bazę lokalnie najszybciej podniesiesz Dockerem:

```bash
docker-compose up -d
```

> **Uwaga przy pracy lokalnej:** w `NODE_ENV=development` `getCurrentUser()` zwraca
> użytkownika testowego **bez sprawdzania cookie**. Testując realny przepływ logowania
> i uprawnień, licz się z tym obejściem.

## Testy i jakość

```bash
npm test          # Jest
npm run test:e2e  # Playwright
npm run lint      # ESLint
npx tsc --noEmit  # typy
```

Typy i lint **blokują build** (`next.config.mjs`) i są krokami blokującymi w CI.
Testy E2E izolacji danych i uprawnień pomijają się bez kont testowych — patrz
`E2E_*` w `.env.example`.

## Dokumentacja

| Plik | Co zawiera |
|---|---|
| [CLAUDE.md](CLAUDE.md) | architektura, pułapki, konwencje — zacznij tutaj |
| [PLAN-NAPRAWY.md](PLAN-NAPRAWY.md) | domknięte fazy: typy, izolacja danych, uprawnienia, reset hasła, monitoring |
| [PLAN-PRODUKCJA.md](PLAN-PRODUKCJA.md) | domknięte etapy: portal klienta, powiadomienia, kroki procesu, RODO, sprzątanie |
| [docs/](docs/) | dokumentacja produktowa; `docs/archiwum-weddingboard/` to materiały poprzedniego produktu |

## Licencja

Prywatna. Koda Labs PSA.
