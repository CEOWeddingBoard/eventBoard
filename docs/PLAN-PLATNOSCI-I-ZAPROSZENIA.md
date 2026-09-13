# Plan: płatność + zarządzanie kontem (zaproszenie współmałżonka)

## Co chcesz osiągnąć

1. **Płatność** – po zalogowaniu użytkownik musi wykonać płatność, zanim dostanie pełny dostęp do funkcji.
2. **Zarządzanie kontem** – możliwość zaproszenia współmałżonka (Pani Młoda / Pan Młody), żeby oboje mogli pracować na tym samym weselu.

---

## 1. Płatność (paywall)

### Propozycja flow

1. Użytkownik loguje się przez Clerk → trafia na dashboard (lub dedykowaną stronę „Wybierz plan”).
2. **Sprawdzenie statusu płatności**: czy użytkownik/wedding ma aktywną subskrypcję lub jednorazową płatność.
3. **Jeśli NIE** – pokazujesz stronę **paywall** (np. „Wybierz plan”, cennik, przycisk „Opłać i korzystaj”) zamiast pełnego dashboardu.
4. **Po udanej płatności** (Stripe) – zapisujesz status (np. w DB), użytkownik dostaje dostęp do wszystkich funkcji.

### Technicznie

- **Stripe** – masz już placeholdery w `.env.example` (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET).
- **Model danych** – potrzebna informacja „czy opłacone”:
  - **Opcja A**: tabela `Subscription` (userId, stripeCustomerId, stripeSubscriptionId, status, plan, periodEnd).
  - **Opcja B**: pole na `User` lub na `Wedding`, np. `subscriptionStatus` (NONE | TRIAL | ACTIVE | CANCELLED) + opcjonalnie `stripeCustomerId`.
- **Stripe Checkout** – jedna sesja Checkout (one-time payment lub subscription). Po powrocie z Stripe (success_url) użytkownik ma dostęp; webhook `checkout.session.completed` aktualizuje status w DB.
- **Miejsce gatingu** – w **layoutcie dashboardu** (lub middleware): jeśli użytkownik zalogowany, ale brak aktywnej płatności → redirect na `/pl/dashboard/upgrade` (strona z paywallem). Reszta tras dashboardu chroniona tym samym warunkiem.

Rekomendacja: **Opcja B** na start (pole przy User lub Wedding), Stripe Checkout + webhook; paywall w layoutcie dashboardu.

---

## 2. Zarządzanie kontem – zaproszenie współmałżonka

### Obecny stan

- W **Prisma** masz model **WeddingParticipant** (weddingId, userId, role).
- W **API** (`/api/events/[id]/participants`) są role: **COUPLE_PRIMARY**, **COUPLE_SECONDARY**, **CO_ORGANIZER**, **WEDDING_PLANNER**.
- Zaproszenie dziś działa tak: podajesz **email**; **użytkownik musi już mieć konto** – w przeciwnym razie API zwraca „User with this email does not exist. Please ask them to sign up first.”.

To jest dobre jako baza; brakuje tylko **zaproszenia „na zapas”** (email bez konta → link do rejestracji + dołączenie do wesela).

### Propozycja flow „Zaproszenie współmałżonka”

1. **Pani Młoda / Pan Młody** (właściciel wesela) w ustawieniach konta/wesela klika np. **„Zaprosić współmałżonka”**.
2. Podaje **email** współmałżonka i wybiera rolę (np. **Pan Młody** / **Pani Młoda** – mapowanie na COUPLE_SECONDARY lub osobna etykieta).
3. System:
   - tworzy **zaproszenie oczekujące** (pending invite): email, weddingId, rola, token, expiresAt;
   - wysyła **email** z linkiem typu: `https://app.example.com/pl/accept-invite?token=xxx`.
4. **Odbiorca** klika link:
   - jeśli **nie ma konta** → przekierowanie na rejestrację (Clerk sign-up), po rejestracji automatyczne dołączenie do wesela z daną rolą;
   - jeśli **ma konto** → logowanie (jeśli trzeba) + dołączenie do wesela (dodanie WeddingParticipant).
5. Od tego momentu **oboje** widzą to samo wedding i mogą edytować (w zależności od roli).

### Model danych (rozszerzenie)

- **Tabela `WeddingInvitation`** (lub `PendingWeddingInvite`):
  - id, weddingId, email, role (COUPLE_SECONDARY itd.), token (unique), expiresAt, createdAt.
- Po zaakceptowaniu: tworzysz **WeddingParticipant** (userId, weddingId, role) i usuwasz (lub oznaczasz used) zaproszenie.

### Rola „Pani Młoda” / „Pan Młody”

- W UI możesz pokazywać etykiety **Pani Młoda** / **Pan Młody**; w DB zostawiasz np. COUPLE_PRIMARY (właściciel) i COUPLE_SECONDARY (zaproszony współmałżonek), ewentualnie osobne pole `displayRole` jeśli chcesz rozróżniać w interfejsie.
- Zadania już mają `assigneeRole` (TOGETHER | BRIDE | GROOM) – to się ładnie składa z „praca we dwoje na jednym weselu”.

---

## 3. Kolejność wdrożenia (rekomendacja)

1. **Płatność**
   - Dodać pole statusu (User lub Wedding) + Stripe Checkout + webhook.
   - W layoutcie dashboardu (lub middleware) – sprawdzanie płatności i przekierowanie na stronę „Wybierz plan” / paywall.
2. **Zaproszenie współmałżonka**
   - Dodać tabelę zaproszeń (pending), endpoint „wyślij zaproszenie” (email + rola) i stronę `accept-invite?token=...` (rejestracja / logowanie + dołączenie do wesela).
   - W UI: sekcja „Zarządzanie kontem” lub „Zaproszenie współmałżonka” w ustawieniach wesela/konta.

---

## 4. Podsumowanie

- **Płatność**: paywall po logowaniu, Stripe (Checkout + webhook), status w DB, gating w dashboardzie – sensowne i standardowe.
- **Współmałżonek**: zaproszenie mailem z linkiem, rejestracja/logowanie + dołączenie do tego samego wedding (WeddingParticipant) – pasuje do Twojego modelu; API uczestników już masz, brakuje tylko pending invites i flow „accept invite”.

Jeśli chcesz, mogę w kolejnym kroku rozpisać konkretne zmiany w schemacie Prisma (modele Subscription / WeddingInvitation), listę endpointów (Stripe checkout, webhook, invite/accept) i dokładne miejsca w kodzie (layout dashboardu, nowe strony).