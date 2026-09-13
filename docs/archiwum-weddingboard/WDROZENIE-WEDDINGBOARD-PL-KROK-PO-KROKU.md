# Wdrożenie produkcyjne — weddingboard.pl (skrót operacyjny)

Pełna konfiguracja paneli: Stripe Live, Clerk Production, Railway, Resend.  
**Checklist produkcyjna (co Ty / co w kodzie):** [PRODUKCJA-WEDDINGBOARD-CHECKLIST.md](./PRODUKCJA-WEDDINGBOARD-CHECKLIST.md).  
Techniczny opis płatności w kodzie: [PLATNOSCI-STRIPE.md](./PLATNOSCI-STRIPE.md).

## Model cen w aplikacji

Jeden plan: **59 zł / miesiąc** (subskrypcja Stripe, `interval: month`).

Webhook: `https://weddingboard.pl/api/webhooks/stripe` — zdarzenia z [WDROZENIE-PRODUKCJA-PLATNOSCI.md](./WDROZENIE-PRODUKCJA-PLATNOSCI.md).

## Zmienne Railway (master)

`NEXT_PUBLIC_APP_URL`, Clerk Live, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Resend, `CLERK_WEBHOOK_SECRET`, `CRON_SECRET`, `DATABASE_URL`.

## Faktury

Konfiguracja w Stripe Dashboard (nie w kodzie): Invoice template, Subscriptions and emails, Customer portal.  
Szczegóły w instrukcji wdrożeniowej z planu produkcyjnego.

## Deploy i migracje (P3005 / P3009)

### P3009 — failed migration (częste na **pustej** bazie Railway)

Pierwsza migracja w repo to tylko `ALTER TABLE "guests" …`. Na **świeżym** Postgresie nie ma jeszcze tabel — migracja pada, w `_prisma_migrations` zostaje status **failed** i każdy restart kończy się P3009.

**Automatycznie:** od wersji ze zaktualizowanym `scripts/prisma-migrate-deploy.cjs` start robi: `resolve --rolled-back` → `db push` → baseline wszystkich migracji → `migrate deploy`.

**Jednorazowo ręcznie** (Railway → Postgres → **Connect** → skopiuj `DATABASE_URL` publiczny, lokalnie):

```bash
npx prisma migrate resolve --rolled-back "20250202000000_add_guest_preferences"
npx prisma db push
# potem baseline jak poniżej (wszystkie nazwy z prisma/migrations)
npx prisma migrate deploy
```

Albo **Reset database** w Railway (jeśli nie ma jeszcze danych użytkowników) i ponowny deploy z nowym skryptem.

### P3005 — baza z `db push` bez historii migracji

Baza utworzona wcześniej przez `db push` nie ma historii migracji → `migrate deploy` zwraca **P3005**.

**Automatycznie na Railway:** `node scripts/prisma-migrate-deploy.cjs` (baseline + deploy) przed `npm start`.

**Jednorazowo ręcznie** (lokalnie z produkcyjnym `DATABASE_URL`):

```bash
npx prisma migrate resolve --applied "20250202000000_add_guest_preferences"
npx prisma migrate resolve --applied "20260307120000_add_google_calendar_connection"
npx prisma migrate resolve --applied "20260315100000_add_calendar_feed_token"
npx prisma migrate resolve --applied "20260427164000_add_event_ceremony_reception_locations"
npx prisma migrate resolve --applied "20260427181000_add_vendor_day_schedule"
npx prisma migrate resolve --applied "20260528120000_add_partner_link_access"
npx prisma migrate deploy
```

Po baseline kolejne deploye tylko stosują nowe migracje z repo.
