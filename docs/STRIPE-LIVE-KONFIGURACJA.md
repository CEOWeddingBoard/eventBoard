# Stripe Live — konfiguracja po stronie Dashboard (Koda Labs)

Stan konta **Live** po synchronizacji z kodem (czerwiec 2026).

## Produkt i cena (używane przez aplikację)

| Pole | Wartość |
|------|---------|
| Produkt | **Wedding Board — subskrypcja miesięczna** (`prod_UclD2DCBALoF7l`) |
| Cena miesięczna | **59,00 PLN brutto** (`price_1TdVhGGMuGF6sdAPZp392BaW`) |
| `STRIPE_PRICE_ID` w Railway | `price_1TdVhGGMuGF6sdAPZp392BaW` |

Stare ceny testowe (`price_1Td7BR...`, `price_1Td7WJ...`) zostały **dezaktywowane**.

## Co musisz włączyć ręcznie w Dashboard

Te ustawienia **nie da się** w pełni ustawić z MCP — zrób to raz w [Stripe Dashboard](https://dashboard.stripe.com) (tryb **Live**):

### 1. Dane sprzedawcy (faktury)

**Settings → Business** — nazwa, adres, **NIP**, logo → pojawią się jako wystawca na fakturze.

### 2. Metody płatności

**Settings → Payment methods** — włącz:

- **Karty** (Visa, Mastercard, …)
- **BLIK** (PLN, subskrypcje z zapisem metody)

Opcjonalnie utwórz **Payment method configuration** (karty + BLIK) i wklej ID do Railway:

```env
STRIPE_PAYMENT_METHOD_CONFIGURATION=pmc_...
```

**Przelewy24** — nie używaj przy subskrypcji Checkout (Stripe nie obsługuje P24 w `mode: subscription`).

### 3. Faktury e-mail

**Settings → Billing → Subscriptions and emails**:

- Włącz wysyłkę **PDF faktury** po opłaceniu subskrypcji.

Stopka VAT (art. 113) jest ustawiana **z kodu** przy tworzeniu subskrypcji (`subscription_data.invoice_settings.footer`).

### 4. Portal klienta

**Settings → Billing → Customer portal**:

- Historia faktur
- Zmiana metody płatności
- Anulowanie subskrypcji (zgodnie z regulaminem)

Opcjonalnie: skopiuj ID konfiguracji portalu → `STRIPE_BILLING_PORTAL_CONFIGURATION=bpc_...`

### 5. Webhook

**Developers → Webhooks → Add endpoint**

- URL: `https://weddingboard.pl/api/webhooks/stripe`
- Zdarzenia:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

Signing secret → `STRIPE_WEBHOOK_SECRET` w Railway → **restart** usługi.

## Zmienne Railway (minimum)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1TdVhGGMuGF6sdAPZp392BaW
NEXT_PUBLIC_APP_URL=https://weddingboard.pl
```

## Szkic faktury w Dashboard

Jeśli widzisz **szkic** faktury ręcznej (np. „Koda Labs PSA”) bez stopki VAT — **usuń lub anuluj** go w Dashboard → **Billing → Invoices**. Nowe faktury z subskrypcji będą miały poprawną pozycję z produktu Wedding Board i stopkę z aplikacji.

## Test końcowy

1. Nowe konto → onboarding → karta/BLIK w Checkout.
2. Stripe: Customer z `metadata.clerkUserId`, subskrypcja `trialing`.
3. Po trialu: faktura 59 PLN z stopką art. 113 na e-mail.
4. Webhook logs → odpowiedź **200**.
