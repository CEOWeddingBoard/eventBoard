# Plan wdrożenia produkcyjnego — płatności Stripe

Krótki plan: **Stripe (produkcja) → zmienne w Railway → webhook → metody płatności → faktury**.

---

## 1. Stripe — tryb produkcyjny (Live)

1. Zaloguj się do [Stripe Dashboard](https://dashboard.stripe.com).
2. **Wyłącz Test mode** (przełącznik w prawym górnym rogu).
3. **Settings → Business** — uzupełnij dane **sprzedawcy** (Koda Labs): nazwa, adres, **NIP**, logo. Te dane pojawią się na fakturze jako wystawca.
4. **Developers → API keys (Live)** — skopiuj **Secret key** (`sk_live_...`).

### Zwolnienie z VAT (limit 200 000 zł)

- Aplikacja **nie nalicza VAT** w Checkout (`tax_behavior: inclusive`, brak Stripe Tax).
- Na każdej fakturze subskrypcji jest stopka: *art. 113 ust. 1* (konfigurowalna przez `STRIPE_INVOICE_VAT_FOOTER`).
- **Księgowa** powinna potwierdzić brzmienie stopki i że nie używasz Stripe Tax do naliczania VAT.
- Cena **59 zł** traktowana jest jako kwota **końcowa** dla kupującego (osoba prywatna).

### Nabywca na fakturze (kupujący z konta)

- Przy checkout tworzony jest Customer Stripe z **e-mailem i imieniem/nazwiskiem z Clerk**.
- W Checkout użytkownik **uzupełnia/zweryfikuje adres** — trafia na fakturę jako nabywca.
- Upewnij się, że użytkownicy mają uzupełnione imię i nazwisko w profilu Clerk.

---

## 2. Metody płatności: karty, BLIK, Przelewy24

W **Settings → [Payment methods](https://dashboard.stripe.com/settings/payment_methods)** (tryb **Live**) włącz:

| Metoda | Subskrypcja miesięczna | Uwagi |
|--------|------------------------|--------|
| **Karty** | Tak | Główna metoda odnowień subskrypcji |
| **BLIK** | Tak* | PLN; *odnowienia — zapis metody; sprawdź [BLIK](https://docs.stripe.com/payments/blik) |
| **Przelewy24 (P24)** | **Nie** w Checkout `subscription` | Stripe: P24 **nie obsługuje** trybu subskrypcji w Checkout — tylko płatności jednorazowe |

Aplikacja **nie blokuje** metod w kodzie (dynamiczne metody z Dashboard). Opcjonalnie możesz ustawić:

`STRIPE_PAYMENT_METHOD_CONFIGURATION=pmc_...`

(ID z Dashboard → Payment method configurations), jeśli chcesz sztywno wybrać zestaw metod (np. karty + BLIK).

**Przelewy24:** dla modelu „59 zł co miesiąc” realnie używają się **karta lub BLIK** (z zapisem do kolejnych cykli), nie przelew P24 przy każdym odnowieniu.

---

## 3. Faktury (Stripe Billing)

1. **Settings → Billing → Subscriptions and emails** — włącz wysyłkę **PDF faktury** do klienta po opłaceniu.
2. **Settings → Billing → Invoice template** — sprawdź układ (sprzedawca z Business settings, nabywca z Customer).
3. **Settings → Billing → Customer portal** — włącz: historia faktur, zmiana karty, anulowanie (zgodnie z regulaminem).

---

## 4. Zmienne środowiskowe (Railway)

| Zmienna | Wartość |
|--------|---------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (po utworzeniu webhooka) |
| `STRIPE_PRICE_ID` | **`price_1TdVhGGMuGF6sdAPZp392BaW`** (Wedding Board — 59 PLN/mies.) |
| `STRIPE_PAYMENT_METHOD_CONFIGURATION` | opcjonalnie `pmc_...` (karty + BLIK) |
| `STRIPE_BILLING_PORTAL_CONFIGURATION` | opcjonalnie `bpc_...` (portal klienta) |
| `STRIPE_INVOICE_VAT_FOOTER` | opcjonalnie własna stopka VAT |
| `NEXT_PUBLIC_APP_URL` | np. `https://weddingboard.pl` |

Clerk **Live**, `DATABASE_URL` — jak w pozostałym wdrożeniu.

---

## 5. Webhook

1. **Developers → Webhooks → Add endpoint** (Live).
2. URL: `https://TWOJA-DOMENA/api/webhooks/stripe`
3. Zdarzenia:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Signing secret → `STRIPE_WEBHOOK_SECRET` w Railway → **restart** usługi.

---

## 6. Checklist

1. [ ] Live w Stripe, dane firmy + NIP w Business settings
2. [ ] Włączone karty + BLIK w Payment methods (Live)
3. [ ] Railway: `sk_live_...`, webhook, restart
4. [ ] Faktury e-mail + portal klienta
5. [ ] Test: konto z imieniem/nazwiskiem w Clerk → checkout → faktura PDF (nabywca + stopka VAT)

---

## 7. Testowanie lokalne (przed Live)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Signing secret z CLI → `STRIPE_WEBHOOK_SECRET` w `.env.local`, klucze **test** (`sk_test_...`).

---

## 8. Rozwiązywanie problemów

- **„Płatności nie są skonfigurowane”** — brak `STRIPE_SECRET_KEY` lub zły prefix.
- **Brak BLIK w Checkout** — włącz w Dashboard (Live); subskrypcja w PLN.
- **Brak P24 przy subskrypcji** — oczekiwane; użyj karty/BLIK.
- **Zła nazwa na fakturze** — uzupełnij profil Clerk; adres w Checkout.
- **Dostęp zablokowany po płatności** — Webhooks → Logs (odpowiedź 200).
