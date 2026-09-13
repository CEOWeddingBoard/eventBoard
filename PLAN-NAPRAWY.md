# Plan naprawy — EventBoard

Stan na: 13 września 2026 · gałąź `feature/P1` · commit początkowy `6e45a29`

Ten plik jest źródłem prawdy o tym, co zostało do zrobienia, żeby aplikacja była
gotowa produkcyjnie. Odhaczaj zadania bezpośrednio tutaj (`- [x]`) i commituj razem
ze zmianą, której dotyczą.

---

## Kontekst

| | |
|---|---|
| Repozytorium | `CEOWeddingBoard/eventBoard`, gałąź `feature/P1` |
| Katalog pracy | `D:\EventBoard` |
| Stary produkt | `CEOWeddingBoard/WeddingBoard`, gałąź `develop` — nietknięty, nie ruszamy |
| Kontakt | Koda Labs PSA · kontakt@kodalabs.pl · 666 328 996 |

**Czym jest produkt:** SaaS dla sal, restauracji i obiektów eventowych. Sercem jest
**proces** — konfigurowalne kroki z rolami („kto wypełnia", „kto akceptuje"), z których
**automatycznie składa się agenda**. Agenda nie ma osobnej konfiguracji.

**Model sprzedaży:** brak publicznej rejestracji. Przestrzenie klientów zakłada
administrator platformy w `/pl/admin`, on też generuje dane logowania.

---

## Zasady pracy — pułapki, które już kosztowały czas

- **middleware i `/api`** — `localePrefix: "always"` przepisuje gołe `/api/...` na
  `/pl/api/...`, co daje 404. Endpointy maszynowe (`/api/cron/*`, `/api/webhooks/*`,
  `/api/admin/bootstrap`) muszą być jawnie wyłączone z i18n w `isLocaleAgnosticPublicRoute`.
  **Dodając nowy endpoint maszynowy — dopisz go tam.**
- **`/pl/admin` celowo NIE jest w `isProtectedRoute`** — strona sama zwraca 404 dla
  nie-adminów. Przekierowanie na logowanie zdradzałoby, że panel istnieje. Nie „naprawiaj" tego.
- **Agenda nie używa szablonów dokumentów.** Ma zaszyty układ w
  `src/lib/agenda/agenda-docx.ts`. `document-templates` to oferty i umowy — osobna sprawa.
- **`typescript.ignoreBuildErrors: true`** jest wciąż włączone w `next.config.mjs`.
  Dopóki tak jest, build przechodzi mimo realnych błędów. Wyłączamy to w Fazie 2.
- **Baza lokalnie** — `.env.local` wskazuje `file:./dev.db`, a schemat Prisma jest pod
  PostgreSQL. Do pracy lokalnej potrzebny prawdziwy `DATABASE_URL` (np. z Railway).
- **Konto serwisowe należy do każdej organizacji.** To dlatego Faza 3 jest krytyczna —
  każde ustalanie organizacji „po pierwszym członkostwie" daje zły wynik dla admina.

---

## Faza 2 — Domknij typy i zablokuj regresję

**Po co:** dziś build przechodzi mimo błędów, więc nie masz informacji zwrotnej o tym,
co jest zepsute. Dowiadujesz się od klienta. Zostało 8 realnych błędów — wszystkie
w kodzie współdzielonym, którego EventBoard używa.

**Szacunek:** 0,5 dnia

- [ ] **2.1 Napraw 8 realnych błędów typów**

  Pliki:
  ```
  src/components/ui/button.tsx                (TS2769 — używany w całej aplikacji)
  src/lib/pdf-response.ts                     (TS2345)
  src/lib/validations/sanitize.ts             (TS2345)
  src/lib/notifications.ts                    (TS2322)
  src/lib/guide-steps.ts                      (TS2322)
  src/components/google/GoogleCalendarSection.tsx (TS2552 — literówka: canDisconnect)
  src/app/api/cron/event-reminders/route.ts   (2× TS2345 — null tam, gdzie wymagany string)
  ```

  Uwaga: `event-reminders` przekazuje `null` do funkcji wymagającej `string` — ten cron
  może się wywalać w locie, czyli przypomnienia o terminach mogą nie działać.

  **Gotowe, gdy:** `npx tsc --noEmit` nie pokazuje błędów innych niż `TS6133` (nieużywane zmienne).

- [ ] **2.2 Przestań ignorować błędy przy budowaniu**

  Plik: `next.config.mjs` — usuń `typescript.ignoreBuildErrors` i `eslint.ignoreDuringBuilds`.

  **Gotowe, gdy:** `npm run build` przechodzi bez wyłączonych sprawdzeń.

- [ ] **2.3 Dodaj typecheck jako krok blokujący w CI**

  Plik: `.github/workflows/ci.yml` — krok `npx tsc --noEmit`.

  **Gotowe, gdy:** pull request z błędem typu nie przechodzi CI.

---

## Faza 3 — Izolacja danych między klientami ⚠️

**Po co:** to nie jest ryzyko teoretyczne. Ten błąd jest w kodzie i uruchamia się
dokładnie wtedy, gdy masz więcej niż jednego klienta.

**Na czym polega:** dwanaście plików akcji ustala organizację przez
`organizationMember.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } })` —
bierze **najstarsze członkostwo** użytkownika i ignoruje ciasteczko aktywnej przestrzeni.
Konto serwisowe jest członkiem **każdej** organizacji. Efekt: klikasz „Wejdź w przestrzeń:
Klient B", tworzysz event — a on zapisuje się u Klienta A.

**Szacunek:** 1–2 dni

- [ ] **3.1 Odtwórz błąd, zanim go naprawisz**

  Dwie testowe przestrzenie, wejście jako konto serwisowe w drugą, utworzenie eventu,
  sprawdzenie gdzie wylądował.

  **Gotowe, gdy:** masz potwierdzony przypadek (zrzut ekranu z eventem w złej przestrzeni).

- [ ] **3.2 Jedno źródło prawdy o aktywnej organizacji**

  Plik: `src/lib/auth/active-org.ts` — dodaj `requireOrgId()`, które czyta ciasteczko
  aktywnej przestrzeni i **rzuca wyjątkiem**, gdy nie da się jej ustalić. Cichy fallback
  do „pierwszej lepszej" organizacji jest źródłem tego błędu — nie powielaj go.

  **Gotowe, gdy:** `requireOrgId()` istnieje i nigdy nie zwraca organizacji spoza aktywnej przestrzeni.

- [ ] **3.3 Przepnij wszystkie akcje na `requireOrgId()`**

  Pliki:
  ```
  src/lib/actions/event.actions.ts
  src/lib/actions/event-client.actions.ts
  src/lib/actions/organization.actions.ts
  src/lib/actions/org-ecosystem.actions.ts
  src/lib/actions/org-blocked.actions.ts
  src/lib/actions/menu-variant.actions.ts
  src/lib/actions/agenda-template.actions.ts
  src/lib/actions/agenda-template-seed.ts
  src/lib/actions/auth.actions.ts
  src/lib/actions/venue-config.actions.ts
  ```

  **Gotowe, gdy:** `grep -rn "organizationMember.findFirst" src/lib/actions` nie znajduje
  wywołania bez ograniczenia do aktywnej organizacji.

- [ ] **3.4 Test, który pilnuje tego na zawsze**

  Plik: `e2e/tenant-isolation.spec.ts` — dwie przestrzenie, wejście w drugą, utworzenie
  eventu, asercja na przestrzeń docelową.

  **Gotowe, gdy:** test przechodzi i wywala się po przywróceniu starego `findFirst`.

---

## Faza 4 — Samodzielny reset hasła

**Po co:** dziś hasło resetuje wyłącznie administrator platformy, ręcznie. Klient
zablokowany w sobotę wieczorem czeka do poniedziałku — i to zapamięta o produkcie.

**Szacunek:** 0,5 dnia

- [ ] **4.1 Token resetu z krótkim czasem życia**

  Jednorazowy, podpisany, ważny 1 godzinę. Wzorzec podpisywania: `src/lib/auth/session-token.ts`.
  Akcje w `src/lib/actions/auth.actions.ts`: `requestPasswordReset`, `resetPasswordWithToken`.

  **Gotowe, gdy:** token wygasa po godzinie i nie da się użyć go dwa razy.

- [ ] **4.2 Ekrany resetu**

  ```
  src/app/[locale]/(auth)/auth/reset/page.tsx          — prośba o link
  src/app/[locale]/(auth)/auth/reset/[token]/page.tsx  — ustawienie hasła
  ```
  E-mail przez Resend (już skonfigurowany).

  **Gotowe, gdy:** klient odzyskuje dostęp bez kontaktu z Tobą.

- [ ] **4.3 Ogranicz liczbę prób (logowanie + reset)**

  Dziś nie ma żadnego limitu — to zaproszenie do zgadywania haseł.

  **Gotowe, gdy:** po kilku nieudanych próbach z tego samego adresu kolejne są odrzucane.

---

## Faza 5 — Monitoring i alerty

**Po co:** jest lokalny `error-logger`, ale nic nie wysyła alertu. O awarii dowiesz się
telefonem od klienta w trakcie wesela — najgorszy możliwy moment.

**Szacunek:** 0,5 dnia

- [ ] **5.1 Podłącz Sentry**

  Plik: `src/lib/errors/error-logger.ts` — wysyłaj też do Sentry. Zmienna `SENTRY_DSN` na Railway.

  **Gotowe, gdy:** celowo wywołany błąd pojawia się w Sentry w ciągu minuty.

- [ ] **5.2 Alert, który realnie dotrze**

  Powiadomienie na e-mail lub SMS przy błędach 5xx. Sam dashboard nie wystarczy —
  nie będziesz go oglądał w sobotę.

  **Gotowe, gdy:** testowy błąd 5xx powoduje powiadomienie.

---

## Faza 6 — Dokończ uprawnienia

**Po co:** uprawnienia modułowe są egzekwowane w menu i przy wejściu do modułu. Brakuje
ostatniej warstwy — „Podgląd" nie blokuje jeszcze samego zapisu. Bez tego obietnica
złożona klientowi jest tylko częściowo prawdziwa.

**Szacunek:** 1 dzień

- [ ] **6.1 Zablokuj zapis w akcjach serwerowych**

  Helper `canEditModule` jest gotowy w `src/lib/permissions/guard.ts` — trzeba go wywołać
  w akcjach zapisu (finanse, eventy, menu, ustawienia). Sama blokada w interfejsie nie
  wystarczy, bo akcję można wywołać bezpośrednio.

  **Gotowe, gdy:** konto z poziomem „Podgląd" nie zapisze zmiany nawet przy bezpośrednim
  wywołaniu akcji.

- [ ] **6.2 Ukryj przyciski zapisu przy samym podglądzie**

  Pokazywanie przycisku, który zawsze kończy się błędem, to zła robota.

  **Gotowe, gdy:** przy poziomie „Podgląd" nie ma widocznych przycisków zapisu.

- [ ] **6.3 Test uprawnień**

  Plik: `e2e/permissions.spec.ts` — wszystkie trzy poziomy: brak, podgląd, edycja.

  **Gotowe, gdy:** test pokrywa trzy poziomy i przechodzi.

---

## Decyzje otwarte

- [ ] **Treści prawne do weryfikacji prawnika.** `src/lib/legal.ts` zawiera kompletny
      wzorzec (regulamin, polityka prywatności, umowa powierzenia RODO) — ale to wzorzec,
      nie opinia prawna. **Zweryfikuj przed pierwszym płacącym klientem**, zwłaszcza RODO:
      system przechowuje dane o alergiach gości, czyli dane szczególnej kategorii.
      Po zmianie treści podbij `TERMS_VERSION` — wymusi ponowną akceptację.
- [ ] **`docs/` (69 plików)** — dokumentacja z czasów WeddingBoard. Do przejrzenia i wycięcia.
- [ ] **Schemat bazy** — po wycięciu starego produktu zostały nieużywane modele.
      Usuwaj wyłącznie te, których żaden plik w `src/` nie importuje, i osobną migracją.
      **Modele `Guest`, `Table`, `SeatingRule` zostaw** — to baza pod listę gości jako krok
      procesu i pod stoły.
- [ ] **Eksport danych klienta** — wymóg RODO (prawo do przenoszenia) i argument sprzedażowy.
- [ ] **Historia zmian (audit log)** — kto zmienił menu/godzinę. Dopiero **po Fazie 3**;
      logowanie zmian w systemie zapisującym do złej przestrzeni utrwala tylko bałagan.

---

## Czego świadomie NIE robimy teraz

Każda z tych rzeczy brzmi rozsądnie i każda odciągnęłaby od zdobycia referencji.

- **Moduł rozsadzania gości i stolików** — skomodytyzowana funkcja, tygodnie pracy, nie
  decyduje o wygraniu klienta. Doraźnie wystarczą pola liczbowe w kroku procesu
  („liczba stołów", „osób przy stole") — lądują w agendzie, którą widzi kuchnia i obsługa.
- **Pełna personalizacja wyglądu** (czcionki, grafiki, tapety) — logo i kolor przewodni
  już są i dają efekt „to jest nasze". Reszta to koszt bez zwrotu na tym etapie.
- **Samoobsługowe płatności / Stripe** — przy kilku klientach faktura ręczna jest szybsza
  niż utrzymywanie integracji. Status opłacenia ustawia admin w `/pl/admin`.
- **Łączenie kodu z WeddingBoard** — niepotrzebne. Portal klienta w EventBoard **już jest**
  powierzchnią dla pary młodej: kroki procesu z rolą `CLIENT` widzi klient końcowy.
  WeddingBoard wystarczy, że podeśle parze link. Zero API, zero duplikacji.

---

## Zanim ruszysz

- [ ] **Przepnij Railway na to repo** — Railway → serwis → Settings → Source →
      `CEOWeddingBoard/eventBoard`, gałąź `feature/P1`. Zmienne środowiskowe zostają.
- [ ] Sprawdź po wdrożeniu: `/pl/app/dashboard` i `/pl/admin` działają.
