# Plan produkcyjny — EventBoard

Stan na: 13 września 2026 · gałąź `feature/P1`

Uzupełnienie [PLAN-NAPRAWY.md](PLAN-NAPRAWY.md), który domknął fazy 2–6 (typy, izolacja
danych, reset hasła, monitoring, uprawnienia). Ten plik zbiera to, czego **brakuje, żeby
produkt dało się sprzedać i obsłużyć** — znalezione przy przeglądzie kodu, nie zgadnięte.

Każdy punkt ma odnośnik do miejsca w kodzie, żeby dało się sprawdzić, że problem jest realny.

---

## Analiza — co jest zepsute albo czego nie ma

### ⛔ P0 · Portal klienta jest nieosiągalny

**Najpoważniejsza rzecz w całym repo.** Obietnica produktu brzmi: „klient końcowy wypełnia
swoje kroki sam — koniec z ustaleniami w SMS-ach". Dziś to nie działa.

| Element | Stan |
|---|---|
| Generowanie linku | działa — `generateEventClientLink` (`event-client.actions.ts:70`) zwraca `/{locale}/portal/{token}` |
| Token: hash, wygaśnięcie, unieważnienie | działa |
| Stan procesu po tokenie | `getEventProcessStateForPortal` (`process-runtime.actions.ts:492`) — **nikt tego nie woła** |
| Interfejs kroków dla klienta | `ClientProcessStep.tsx`, 583 linie — **nikt tego nie renderuje** |
| **Trasa `/{locale}/portal/{token}`** | **nie istnieje** |

Czyli: obiekt generuje link, wysyła go parze młodej, a para dostaje **404**. Backend i
interfejs są gotowe — brakuje strony, która je łączy.

### ⛔ P0 · Powiadomienia nigdy się nie wysyłają

Pięć endpointów cron istnieje i jest zabezpieczonych `CRON_SECRET`:
`event-reminders`, `step-approval-reminders`, `task-reminders`, `wedding-notifications`,
`admin-access-code`. **Nic ich nie wywołuje** — w repo nie ma harmonogramu:
`railway.json` i `railway.toml` mają tylko `startCommand`, nie ma `vercel.json`, a
`.github/workflows/ci.yml` nie ma wyzwalacza `schedule`.

Skutek: przypomnienie „za 3 dni mija termin wyboru menu" i „krok czeka na akceptację,
a event jest za tydzień" nie dojdą do nikogo. To jest funkcja, za którą klient płaci.

### ⚠️ P1 · Limity prób żyją w pamięci procesu

`src/lib/api/rate-limit.ts` trzyma liczniki w `Map` w pamięci. Przy dwóch instancjach na
Railway limit logowania jest de facto dwa razy wyższy, a po restarcie instancji zeruje się
całkiem. Dla ochrony przed zgadywaniem haseł to za mało.

### ⚠️ P1 · Brak eksportu i usunięcia danych klienta (RODO)

System przechowuje dane o alergiach gości — dane szczególnej kategorii. Nie ma ani eksportu
(prawo do przenoszenia), ani trwałego usunięcia przestrzeni z danymi. `deleteSpace` istnieje
w `admin.actions.ts`, ale nie ma ścieżki „klient prosi o swoje dane".

### ⚠️ P1 · Krok „Tabela / arkusz" w połowie

Zaczęty w tej sesji: typy i runtime gotowe (`workflow-agenda-fields.ts`,
`process-runtime.actions.ts`), **brak interfejsu** — w edytorze nie da się dodać takiego
kroku, a klient nie ma czego wypełnić. Trzeba dokończyć albo wycofać; zostawienie tak jest
najgorszą opcją.

### ◻️ P2 · Martwe zależności i śmieci

- `@serwist/*` (6 pakietów) w zależnościach, ale `withSerwist` nie owija `next.config.mjs` —
  PWA nie działa, a paczki idą do builda.
- `@clerk/*` w zależnościach, zero importów w `src`.
- W repo: `Wedding AI Planner.pdf`, `build-output{,2,3,4}.txt`, `error.txt`, `zdj.png`,
  `logo.jfif`, `test-invitation.pdf`, `weedingPlaner`, `test-app/`.
- `package.json` → `"name": "wedding-ai-planner"`.
- `docs/` — 69 plików z czasów WeddingBoard.

### ◻️ P2 · Jakość: lint i czerwone testy

90 błędów ESLint (37× `no-html-link-for-pages`, 30× `no-explicit-any`, 15×
`no-unescaped-entities`, 2× `rules-of-hooks`) i 8 czerwonych suit z nieaktualnymi asercjami
po produkcie weselnym.

---

## Plan

### Etap 1 — Portal klienta (P0)

- [x] **1.1 Trasa `/{locale}/portal/[token]`** — weryfikacja tokenu, obsługa wygasłego
      i unieważnionego linku, `notFound()` dla śmieci. Bez sesji: middleware musi ją
      przepuszczać (dopisać do `isRegistrationFlowRoute` albo do publicznych).
- [x] **1.2 Renderowanie kroków klienta** — podpiąć `ClientProcessStep` pod stan
      z `getEventProcessStateForPortal`, pokazywać tylko kroki roli `CLIENT`/`BOTH`.
- [x] **1.3 Testy autoryzacji** — jednostkowe; E2E czeka na środowisko — token ważny / wygasły / unieważniony / obcy.

**Zrobione.** Przy okazji znalazła się dziura, której nie było w analizie:
`completeProcessNode` **nie sprawdzał niczego** — znając ID eventu dało się zamknąć
dowolny krok cudzego przyjęcia, w dowolnej roli. Server action to zwykły endpoint HTTP,
więc było to wykonalne bez portalu. Teraz klient legitymuje się tokenem z linku
(z kontrolą wygaśnięcia), a zespół obiektu sesją i przynależnością eventu do swojej
przestrzeni. Cztery testy pilnują obu ścieżek.

**Do sprawdzenia po wdrożeniu:** otworzyć wygenerowany link w trybie incognito
i ukończyć krok — tego nie da się zweryfikować bez bazy.

### Etap 2 — Uruchomić powiadomienia (P0)

- [ ] **2.1 Harmonogram cronów** — GitHub Actions z `schedule` wołający endpointy
      z nagłówkiem `x-cron-secret` (działa niezależnie od hostingu i jest widoczny w repo).
- [ ] **2.2 Okno czasowe i strefa** — crony liczą dni względem `new Date()`; ustalić porę
      wysyłki (rano), żeby SMS nie szedł w nocy.
- [ ] **2.3 Log wysyłek** — żeby dało się odpowiedzieć „czy klient dostał przypomnienie".

### Etap 3 — Dokończyć krok „Tabela / arkusz" (P1)

- [ ] **3.1 Edytor** — typ akcji „Tabela", zakładka „Pola" jako definicja kolumn.
- [ ] **3.2 Wypełnianie** — tabela z dodawaniem wierszy, **wklejaniem z Excela**,
      pobraniem szablonu CSV i wgraniem pliku. Wspólny komponent dla klienta i obsługi.
- [ ] **3.3 Podgląd agendy** — kolumny ze wskazanym miejscem w agendzie widoczne w panelu.
- [ ] **3.4 Testy** — wiersze → agenda, puste wiersze pomijane, wklejanie z Excela.

### Etap 4 — Krok „Wklej menu" (P1)

- [ ] **4.1** Typ akcji `MENU_IMPORT` otwierający istniejący `MenuImportDialog`
      (reguły z `/app/settings/menu-parser` już działają, `portions` jest w bazie).

### Etap 5 — Twardość produkcyjna (P1)

- [ ] **5.1 Limity prób trwałe** — licznik w bazie zamiast w pamięci procesu.
- [ ] **5.2 Eksport danych przestrzeni** — ZIP/JSON na żądanie klienta.
- [ ] **5.3 Usunięcie danych** — udokumentowana ścieżka i potwierdzenie.

### Etap 6 — Sprzątanie (P2)

- [ ] **6.1** Usunąć `@serwist/*` i `@clerk/*` albo podpiąć PWA świadomie.
- [ ] **6.2** Wyrzucić śmieci z repo, zmienić `name` w `package.json`.
- [ ] **6.3** Przejrzeć `docs/` i zostawić to, co dotyczy EventBoarda.
- [ ] **6.4** Lint do zera, czerwone suity naprawić albo usunąć.

---

## Czego świadomie NIE robimy

- **Rozsadzanie gości przy stołach** — kolejny raz: skomodytyzowane, tygodnie pracy.
  Krok „Tabela" z kolumną „Stół" załatwia 80% potrzeby za ułamek kosztu.
- **Samoobsługowa rejestracja** — model sprzedaży zakłada wdrożenie z człowiekiem.
- **Stripe** — faktury ręczne są tańsze niż utrzymanie integracji przy kilku klientach.
