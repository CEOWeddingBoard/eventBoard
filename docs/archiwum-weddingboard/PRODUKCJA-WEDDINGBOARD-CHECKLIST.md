# Produkcja weddingboard.pl — checklist (Ty vs automatyczne)

Domena: **weddingboard.pl** (home.pl, DNS: `dns.home.pl`, serwer `serwer2609485`).  
Aplikacja: Railway (master) + Clerk Production + Stripe Live.

---

## Co jest już w kodzie (gotowe)

| Obszar | Status |
|--------|--------|
| Checkout subskrypcja 59 PLN/mies., trial Stripe 30 dni | Gotowe |
| Powiązanie Clerk ↔ Stripe (`clerkUserId`, `stripeCustomerId`) | Gotowe |
| Faktury: stopka zwolnienia VAT art. 113, dane kupującego z Clerk + adres Checkout | Gotowe |
| Onboarding: regulamin → **karta** → wesele (bez dostępu bez karty) | Gotowe |
| Pierwszy login: brak komunikatu „wygaśnięcie trialu”; karta w onboardingu; opłata po 30 dniach | Gotowe |
| Paywall: „dodaj kartę” vs „płatność nie powiodła się” | Gotowe |
| Webhooki: checkout, subscription, invoice.payment_failed | Gotowe (wymaga URL Live) |

---

## Co musisz zrobić TY (nie da się z kodu)

### 1. home.pl / DNS (screen)

- [ ] Upewnij się, że **weddingboard.pl** wskazuje na produkcję (Railway lub reverse proxy na `serwer2609485`).
- [ ] **SSL** (HTTPS) — certyfikat aktywny dla `weddingboard.pl` i `www` (jeśli używasz).
- [ ] W Railway: domena custom **weddingboard.pl** podpięta do usługi master.

### 2. Stripe (tryb Live — wyłącz Test mode)

- [ ] **Settings → Business** — nazwa, adres, **NIP**, logo (sprzedawca na fakturze).
- [ ] **Developers → API keys** → `sk_live_...` → Railway `STRIPE_SECRET_KEY`.
- [ ] **Settings → Payment methods** — włącz **Karty** + **BLIK** (PLN).  
      (Przelewy24 **nie** działa w subskrypcji Checkout — tylko karta/BLIK.)
- [ ] **Settings → Billing → Subscriptions and emails** — **włącz wysyłkę faktury PDF** mailem po opłaceniu.
- [ ] **Settings → Billing → Invoice template** — podgląd faktury.
- [ ] **Settings → Billing → Customer portal** — faktury, zmiana karty, anulowanie.
- [ ] **Developers → Webhooks → Add endpoint**  
      URL: `https://weddingboard.pl/api/webhooks/stripe`  
      Zdarzenia: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`  
      → `STRIPE_WEBHOOK_SECRET` w Railway → **restart**.

### 3. Railway (master)

```env
NEXT_PUBLIC_APP_URL=https://weddingboard.pl
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1TdVhGGMuGF6sdAPZp392BaW
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=...
RESEND_API_KEY=...
CRON_SECRET=...
```

- [ ] Wszystkie zmienne Live (nie testowe).
- [ ] Redeploy / restart po zmianach.

### 4. Clerk (Production)

- [ ] Aplikacja **Production**.
- [ ] **Allowed redirect URLs**:  
      `https://weddingboard.pl/pl/dashboard`, `/pl/onboarding`, `/pl/auth`, `/en/...`
- [ ] Webhook Clerk → `https://weddingboard.pl/api/webhooks/clerk` (jeśli używasz maila powitalnego).

### 5. Resend / e-mail

- [ ] Domena `weddingboard.pl` zweryfikowana w Resend (DKIM masz włączony w home.pl — dopnij rekordy jeśli Resend wymaga).

### 6. Test końcowy (Live, mała kwota po trialu lub test card w Live jeśli dostępne)

1. Nowe konto → welcome → onboarding → karta (Stripe) → wesele → dashboard.
2. Clerk metadata: `stripeCustomerId`, `subscriptionStatus: trialing`.
3. Stripe: Customer z `metadata.clerkUserId`, subskrypcja `trialing`.
4. Mail z fakturą (jeśli włączone w Billing emails) — po pierwszej opłaconej fakturze (po trialu).
5. Webhook logs → **200**.

---

## Czy faktura idzie automatycznie mailem?

| Moment | Co się dzieje |
|--------|----------------|
| Po dodaniu karty (trial 30 dni) | Zwykle **brak** opłaconej faktury — subskrypcja w statusie `trialing`. |
| Po pierwszym pobraniu 59 zł (po ~30 dniach) | Stripe **tworzy fakturę** i — jeśli w Dashboard włączone — **wysyła PDF na e-mail** Customer (ten z Clerk). |
| Kolejne miesiące | Tak samo przy każdym odnowieniu. |

**Warunek:** w Stripe Live musisz mieć włączone **Subscriptions and emails** / wysyłkę invoice do klienta. Kod tego nie przełącza.

---

## Czego nam jeszcze brakuje (podsumowanie)

| Brak | Kto |
|------|-----|
| DNS + SSL weddingboard.pl → Railway | Ty (home.pl / Railway) |
| Stripe Live + webhook + emaile faktur | Ty (Dashboard) |
| Klucze Live w Railway | Ty |
| Clerk Production + redirect URLs | Ty |
| Potwierdzenie zwolnienia VAT z księgową (stopka na fakturze) | Ty / księgowa |
| KSeF (e-faktury PL) | Opcjonalnie później (Stripe/Billit) |
| Przelewy24 w subskrypcji | Nieobsługiwane przez Stripe w tym modelu |

---

## Przepływ użytkownika (po zmianach)

1. Rejestracja → ekran powitalny (karta za chwilę, nie „trial wygasa”).
2. Onboarding krok 2 → Checkout Stripe, trial 30 dni, **karta wymagana**.
3. 30 dni dostępu (`trialing`) — w Koncie: „Pierwsza opłata ok. {data}”.
4. Po 30 dniach — Stripe pobiera 59 zł; sukces → faktura e-mailem; błąd → paywall „Płatność nie powiodła się”.

Szczegóły techniczne: [PLATNOSCI-STRIPE.md](./PLATNOSCI-STRIPE.md), [WDROZENIE-PRODUKCJA-PLATNOSCI.md](./WDROZENIE-PRODUKCJA-PLATNOSCI.md).
