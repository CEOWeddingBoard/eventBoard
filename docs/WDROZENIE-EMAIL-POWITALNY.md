# Wdrożenie — e-mail powitalny po rejestracji

Po założeniu konta (Clerk `user.created`) aplikacja wysyła **HTML e-mail powitalny** przez Resend.  
Kod: `src/app/api/webhooks/clerk/route.ts`, szablon: `src/lib/email/welcome-email.ts`.

---

## Checklist (produkcja)

### 1. Resend

1. Konto na [resend.com](https://resend.com) → **API Keys** → utwórz klucz `re_...`.
2. **Domains** → dodaj domenę (np. `twoja-domena.pl`) → zweryfikuj DNS (SPF, DKIM).
3. W Railway (lub innym hostingu) ustaw:
   - `RESEND_API_KEY=re_...`
   - `RESEND_FROM="Planer Weselny <no-reply@twoja-domena.pl>"`  
     (adres musi być z zweryfikowanej domeny)

Bez zweryfikowanej domeny w produkcji maile często trafiają do spamu lub są odrzucane.

### 2. URL aplikacji

- `NEXT_PUBLIC_APP_URL=https://TWOJA-DOMENA`  
  Używane w przycisku „Rozpocznij planowanie” → `/{locale}/welcome`.

### 3. Webhook Clerk

1. [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks** → **Add endpoint**.
2. **URL:** `https://TWOJA-DOMENA/api/webhooks/clerk`  
   (bez `/pl` — ścieżka globalna).
3. **Subscribe to events:** `user.created` (wystarczy do powitania).
4. Skopiuj **Signing secret** (`whsec_...`) → w Railway: `CLERK_WEBHOOK_SECRET=whsec_...`.
5. **Zrestartuj** usługę po zapisaniu zmiennych.

### 4. Wyłącz duplikat z Clerka

Clerk → **Configure** → **Email** → wyłącz domyślny „Welcome email”, żeby użytkownik dostał **tylko** nasz mail z Resend.

### 5. Test

1. Zarejestruj **nowe** konto testowe (inny e-mail niż wcześniej).
2. Sprawdź skrzynkę (i spam).
3. Clerk → Webhooks → endpoint → **Message attempts** — status **200**.
4. Resend → **Logs** — status `delivered` lub `sent`.
5. W Clerk → użytkownik → **Public metadata** powinno być `welcomeEmailSentAt` (ISO data).

---

## Zmienne środowiskowe (podsumowanie)

| Zmienna | Wymagane | Opis |
|---------|----------|------|
| `CLERK_WEBHOOK_SECRET` | tak (do maila) | `whsec_...` z endpointu Clerk |
| `RESEND_API_KEY` | tak (do maila) | Klucz API Resend |
| `RESEND_FROM` | tak (produkcja) | Nadawca z zweryfikowanej domeny |
| `NEXT_PUBLIC_APP_URL` | tak (produkcja) | Bazowy URL aplikacji |

Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) musi być już skonfigurowany pod logowanie.

---

## Język maila

- Rejestracja e-mail/hasło z `/pl/sign-up` lub `/en/sign-up` zapisuje `locale` w `unsafeMetadata` → mail PL lub EN.
- Google OAuth z tej samej strony — `locale` przekazywane przy `authenticateWithRedirect`.
- Domyślnie: **polski**, jeśli brak metadanych.

---

## Rozwiązywanie problemów

| Objaw | Przyczyna |
|-------|-----------|
| Brak maila, webhook 503 | Brak `CLERK_WEBHOOK_SECRET` lub zły prefix |
| Brak maila, webhook 200, brak logu Resend | Brak `RESEND_API_KEY` (w logach: *skipping welcome email*) |
| Webhook 500 „Failed to send welcome email” | Zły `RESEND_FROM`, nieweryfikowana domena, limit Resend |
| Drugi mail przy ponownym evencie | Nie powinien — jest `welcomeEmailSentAt` w metadata |
| Link w mailu na localhost | Brak `NEXT_PUBLIC_APP_URL` na produkcji |

---

## Dev lokalnie (opcjonalnie)

1. [ngrok](https://ngrok.com) lub Cloudflare Tunnel → publiczny URL do `localhost:3000`.
2. Clerk webhook → ten URL + `/api/webhooks/clerk`.
3. `.env.local`: `CLERK_WEBHOOK_SECRET`, `RESEND_API_KEY`, opcjonalnie `RESEND_FROM` (w dev bez domeny można użyć `onboarding@resend.dev` tylko na swój e-mail testowy w Resend).

Po wdrożeniu tego kroku przejdź do płatności: [WDROZENIE-PRODUKCJA-PLATNOSCI.md](./WDROZENIE-PRODUKCJA-PLATNOSCI.md).
