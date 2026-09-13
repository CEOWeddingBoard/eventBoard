# Płatności Stripe — Wedding Planner

**Plan wdrożenia na produkcję:** [WDROZENIE-PRODUKCJA-PLATNOSCI.md](./WDROZENIE-PRODUKCJA-PLATNOSCI.md)

## Zmienne środowiskowe

- `STRIPE_SECRET_KEY` — klucz sekretny z Stripe Dashboard (Developers → API keys), tryb test/produkcja.
- `STRIPE_PUBLISHABLE_KEY` — klucz publiczny (opcjonalnie, jeśli frontend będzie używał Stripe.js).
- `STRIPE_WEBHOOK_SECRET` — sygnatura webhooka (whsec_...), po utworzeniu endpointu w Stripe.

## Powiązanie Clerk ↔ Stripe (wymagane)

Nie ma osobnego „pluginu Clerk–Stripe” w Dashboard — link robisz **metadanymi** (zalecane przez [Stripe](https://docs.stripe.com/billing/subscriptions/import-subscriptions) przy migracjach).

| Gdzie | Pole | Znaczenie |
|-------|------|-----------|
| Clerk `publicMetadata` | `stripeCustomerId` | `cus_...` — portal płatności, kolejny checkout |
| Clerk `publicMetadata` | `stripeSubscriptionId`, `subscriptionStatus`, `paidAt` | dostęp w aplikacji |
| Stripe Customer `metadata` | `clerkUserId` | powrót z webhooków |
| Checkout Session / Subscription `metadata` | `clerkUserId` | pierwsze dopasowanie po płatności |

Przepływ: zalogowany użytkownik → `getOrCreateStripeCustomerForClerkUser` (e-mail, imię z Clerk) → Checkout → webhook ustawia subskrypcję w Clerk.

## Przepływ

1. **Nowe konto** — 30 dni trialu (`TRIAL_DAYS` w `src/lib/trial.ts`).
2. **Checkout** — Customer Stripe z **e-mail i imieniem/nazwiskiem z Clerk**; adres w formularzu Checkout → faktura.
3. **Cena** — 59 PLN brutto, sprzedawca zwolniony z VAT (stopka art. 113 na fakturze).
4. **Webhook** — `POST /api/webhooks/stripe` → subskrypcja i dostęp w Clerk.

Szczegóły produkcji (Live, BLIK, faktury): [WDROZENIE-PRODUKCJA-PLATNOSCI.md](./WDROZENIE-PRODUKCJA-PLATNOSCI.md).

## Konfiguracja webhooka w Stripe

1. Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://twoja-domena.pl/api/webhooks/stripe`
3. Zdarzenia: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Skopiuj „Signing secret” do `STRIPE_WEBHOOK_SECRET`.

## Testowanie (tryb test)

- Użyj kluczy testowych (sk_test_..., pk_test_...).
- Karta testowa: `4242 4242 4242 4242`.
- Webhook w dev: Stripe CLI `stripe listen --forward-to localhost:3000/api/webhooks/stripe` i wyświetlony signing secret ustaw w `.env.local`.
