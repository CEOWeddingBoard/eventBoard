# Historyjki Użytkownika — EventCloud + Wedding Board

> **Wersja:** 1.0 | **Branch:** `feature/6` | **Data:** 06.08.2026
>
> EventCloud to samodzielna aplikacja biznesowa do zarządzania eventami przez organizatorów (sale, firmy eventowe, restauracje).
> Wedding Board to moduł rozszerzający dla eventów typu WESELE — widoczny tylko dla pary młodej.
>
> Statusy: ✅ Gotowe | 🔶 Częściowo gotowe | ❌ Do zrobienia

---

## Architektura — widok warstw

```
┌──────────────────────────────────────────────────────────────────┐
│                     EVENT CLOUD (BIZNESOWA)                       │
│  Organizator / Manager sali                                       │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Landing    │ │Dashboard │ │ Zespół   │ │ Zarządzanie salą  │  │
│  │ (prezent.) │ │ eventów  │ │ (RBAC)   │ │ (kalendarz,CRM)   │  │
│  └────────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ EVENTY (wszystkie typy)                                     │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│  │
│  │ │ KOMUNIA  │ │ WIGILIA  │ │ FIRMOWE  │ │     WESELE       ││  │
│  │ │ goście   │ │ goście   │ │ goście   │ │ goście           ││  │
│  │ │ menu     │ │ menu A/C │ │ menu     │ │ menu A/B/C       ││  │
│  │ │ agenda   │ │ agenda   │ │ agenda   │ │ agenda           ││  │
│  │ │ finanse  │ │ finanse  │ │ finanse  │ │ finanse          ││  │
│  │ └──────────┘ └──────────┘ └──────────┘ │ + WEDDING BOARD ↓││  │
│  └─────────────────────────────────────────┴──────────────────┘│  │
└──────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┘
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                WEDDING BOARD (DLA PARY MŁODEJ)                     │
│  Aktywne tylko gdy eventType = WEDDING                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │Moodboard │ │Zaprosz.  │ │Portal    │ │ Strona weselna   │    │
│  │          │ │Papeteria │ │gości     │ │ (w/[slug])       │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ AI Planer│ │ Magazyn  │ │ Prezenty │ │                  │    │
│  │ ślubny   │ │ (blog)   │ │          │ │                  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## EPAK 1: Organizacja i konto — fundament EventCloud

### US-1.1: Rejestracja organizatora
**Jako** nowy użytkownik **chcę** założyć konto organizatora przez Clerk (email/Google) **aby** uzyskać dostęp do panelu EventCloud.

- **Status:** ✅ Gotowe (Clerk + middleware + custom auth pages)
- **Kod:** `src/middleware.ts`, `src/app/[locale]/auth/`

### US-1.2: Tworzenie organizacji (firmy)
**Jako** zalogowany użytkownik **chcę** utworzyć organizację (np. "Pałac pod Dębami") z nazwą, adresem, logo **aby** reprezentować mój biznes w systemie.

- **Status:** ❌ Do zrobienia
- **Model:** Nowy model `Organization` w Prisma
- **Akceptacja:** Organizacja ma unikalny slug, przypisanego właściciela (clerkId), pola: name, logo, address, phone, email

### US-1.3: Wybór pakietu subskrypcyjnego
**Jako** organizator **chcę** wybrać pakiet (Free/Basic/Pro/Enterprise) podczas onboardingu **aby** odblokować funkcje odpowiednie do skali mojego biznesu.

- **Status:** 🔶 Częściowo (Stripe jest skonfigurowany, brak logiki pakietów)
- **Akceptacja:** Pakiety: Free (1 event, 1 user), Basic (5 eventów, 3 users, WeddingBoard), Pro (20 eventów, 10 users), Enterprise (nielimitowane)

### US-1.4: Dodawanie pracowników do organizacji
**Jako** właściciel organizacji **chcę** zapraszać pracowników (email) i przydzielać im role (Manager, Kuchnia, Staff, Viewer) **aby** mogli współzarządzać eventami.

- **Status:** 🔶 Częściowo (Role + SectionPermission + EventParticipant istnieją, brak OrganizationMember)
- **Kod:** `prisma/schema.prisma:257-299`, `src/lib/actions/permissions.actions.ts`
- **Brakuje:** Model `OrganizationMember`, UI zapraszania, przypisywanie ról globalnych

### US-1.5: Przełączanie kontekstu organizacji
**Jako** użytkownik należący do kilku organizacji **chcę** przełączać się między nimi **aby** zarządzać eventami różnych firm z jednego konta.

- **Status:** ❌ Do zrobienia
- **Akceptacja:** OrgSwitcher w sidebarze, przełączanie bez wylogowania

---

## EPAK 2: Konfiguracja eventu

### US-2.1: Predefiniowane kategorie eventów (systemowe)
**Jako** organizator **chcę** przy tworzeniu eventu wybrać typ: Wesele, Komunia, Wigilia, Firmowe, Inne **aby** system automatycznie dostosował dostępne sekcje i formularze.

- **Status:** ✅ Gotowe (ale ograniczone — tylko 5 sztywnych typów)
- **Kod:** `prisma/schema.prisma:148`, `src/lib/event-type-config.ts:1-193`

### US-2.2: Konfiguracja listy gości (pełna vs tylko alergeny)
**Jako** organizator **chcę** przy komunii/wigilii ustawić tryb "tylko alergeny" zamiast pełnej listy gości **aby** kuchnia dostała tylko informacje o vege, gluten, bezgluten.

- **Status:** ✅ Gotowe
- **Kod:** `guestListMode` (FULL | ALLERGENS_ONLY), `src/components/guests/allergen-guest-list.tsx`

### US-2.3: Konfiguracja widocznych sekcji eventu
**Jako** organizator **chcę** per typ eventu widzieć tylko odpowiednie sekcje (np. brak moodboardu dla komunii) **aby** interfejs był czysty i dopasowany.

- **Status:** 🔶 Częściowo (event-type-config.ts definiuje, ale nie wszystkie strony sprawdzają `isSectionVisible()`)
- **Brakuje:** Spójne egzekwowanie na każdej stronie dashboardu

### US-2.6: 🆕 Tworzenie własnych kategorii eventu (konfigurator)
**Jako** organizator **chcę** tworzyć własne kategorie eventów (np. "Chrzciny", "Urodziny firmowe", "Bankiet", "Szkolenie") i dla każdej samodzielnie wybrać, które moduły mają być dostępne **aby** system pasował do mojego biznesu, a nie tylko do 5 predefiniowanych typów.

- **Status:** ❌ Do zrobienia
- **Akceptacja:**
  - Konfigurator kategorii: nazwa, ikona, kolor
  - Checkboxy wyboru modułów podstawowych: Goście (pełna lista / tylko alergeny), Menu, Harmonogram, Budżet, Stoliki, Dostawcy, Zdjęcia, Finanse, Zadania
  - Checkboxy modułów premium/ślubnych: Moodboard, Zaproszenia, Portal gości, Strona WWW, Prezenty, AI Planner (tylko dla WESELE)
  - Domyślne wartości: guestListMode, widoczność pól (imię panny młodej/pana młodego, partnerEmail itp.)
  - Zapis jako szablon organizacji — przy tworzeniu nowego eventu wybiera się z listy własnych kategorii
- **Model:** Nowa tabela `EventCategory` w Prisma: `id, organizationId, name, icon, color, modulesJson (string[]), defaultsJson (JSON), isSystem (bool)`

### US-2.7: 🆕 Per-event nadpisywanie konfiguracji modułów
**Jako** organizator **chcę** po wybraniu kategorii móc dla konkretnego eventu włączyć/wyłączyć dodatkowe moduły (np. dla konkretnej komunii dodać budżet, mimo że kategoria domyślnie go nie ma) **aby** elastycznie dostosować każdy event.

- **Status:** ❌ Do zrobienia
- **Akceptacja:** W ustawieniach eventu sekcja "Moduły" — checkboxy do nadpisania per event. Zapis w polu JSON na Evencie.

### US-2.4: Wyłączenie opcji baru
**Jako** organizator **chcę** móc wyłączyć funkcje baru/alkoholu dla eventu **aby** nie pokazywać zbędnych opcji.

- **Status:** ✅ Gotowe (BAR usunięty z RoomElement, migracja wykonana)

### US-2.5: Tryb "menu A/B/C" zamiast sztywnego menu weselnego
**Jako** organizator **chcę** tworzyć warianty menu (MENU A, MENU B, MENU C, MENU WIGILIJNE) **aby** dać klientowi wybór między pakietami.

- **Status:** ✅ Gotowe
- **Kod:** `MenuVariant`, `MenuVariantCourse`, `src/components/menu/MenuVariantEditor.tsx`

---

## EPAK 3: Dashboard organizatora (EventCloud)

### US-3.1: Nowy layout z sidebar nawigacją
**Jako** organizator **chcę** mieć lewy sidebar z: przełącznikiem organizacji, listą eventów, nawigacją per event **aby** szybko poruszać się po aplikacji.

- **Status:** ❌ Do zrobienia
- **Akceptacja:** AppSidebar (org switcher + lista eventów), EventSidebar (sekcje per event zależne od eventType), TeamSwitcher

### US-3.2: Kolorystyka biznesowa EventCloud
**Jako** organizator **chcę** widzieć profesjonalny, biznesowy interfejs (ciemny/czysty, bez ślubnych ozdobników) **aby** aplikacja pasowała do różnych typów eventów.

- **Status:** ❌ Do zrobienia
- **Akceptacja:** Nowa paleta kolorów dla EventCloud (np. granat + szarość + biel), oddzielna od Wedding Board (który zostaje w stylu eleganckim/ślubnym)

### US-3.3: Event board z konfigurowalnymi linkami
**Jako** organizator **chcę** dodać na dashboardzie eventu przyciski/skróty (np. "Mapa dojazdu", "Menu PDF", "Playlista Spotify") **aby** wszystkie ważne linki były w jednym miejscu.

- **Status:** ✅ Gotowe
- **Kod:** `EventBoardLink`, `src/components/dashboard/EventBoardLinkBuilder.tsx`, `src/components/guest-portal/EventBoardLinks.tsx`

### US-3.4: Dashboard z KPI i finansami
**Jako** organizator **chcę** na głównym dashboardzie widzieć: liczbę aktywnych eventów, przychód, oczekujące płatności, pipeline **aby** mieć szybki przegląd biznesu.

- **Status:** 🔶 Częściowo (istnieje VenueFinanceDashboard, brak dla wszystkich typów eventu)
- **Brakuje:** Dashboard KPI dla organizacji (nie tylko venue)

---

## EPAK 4: Goście i lista alergenów

### US-4.1: Pełna lista gości z preferencjami
**Jako** organizator **chcę** zarządzać pełną listą gości: dodawać, importować CSV, edytować preferencje żywieniowe/usadzenia/noclegowe/alkoholowe **aby** mieć wszystkie dane w jednym miejscu.

- **Status:** ✅ Gotowe
- **Kod:** `Guest` model, `src/app/[locale]/dashboard/guests/`

### US-4.2: Tryb "tylko alergeny" dla komunii i wigilii
**Jako** organizator komunii **chcę** zamiast pełnej listy gości podać tylko listę osób z alergenami (vege/gluten/bezgluten/inne) **aby** kuchnia szybko wiedziała co przygotować.

- **Status:** ✅ Gotowe
- **Kod:** `src/components/guests/allergen-guest-list.tsx`, `src/lib/actions/allergen-guests.actions.ts`

### US-4.3: Eksport listy gości dla kuchni i serwisu
**Jako** organizator **chcę** wyeksportować listę gości jako PDF z podziałem na diety i alergeny **aby** przekazać kuchni przed eventem.

- **Status:** 🔶 Częściowo (jest eksport CSV, PDF tylko dla winietek/menu)
- **Brakuje:** PDF "lista gości dla kuchni" z filtrami po dietach

---

## EPAK 5: Menu i pakiety

### US-5.1: Zarządzanie wariantami menu (A/B/C)
**Jako** organizator **chcę** tworzyć warianty menu z grupami wyboru (przystawka, zupa, danie główne, deser) i przypisywać do nich dania **aby** dać klientowi wybór.

- **Status:** ✅ Gotowe
- **Kod:** `MenuVariant`, `MenuVariantCourse`, `MenuVariantEditor`

### US-5.2: Menu wigilijne jako szablon
**Jako** organizator wigilii **chcę** mieć predefiniowany szablon menu wigilijnego (12 dań, postne) **aby** szybko skonfigurować event.

- **Status:** ❌ Do zrobienia
- **Akceptacja:** Szablon "MENU WIGILIJNE" z tradycyjnymi 12 daniami jako preset

### US-5.3: Edycja menu z pomocą AI
**Jako** organizator **chcę** kliknąć "Zaproponuj menu AI" aby AI wygenerowało propozycje dań dopasowane do typu eventu (wesele/komunia/wigilia) **aby** zaoszczędzić czas na wymyślaniu menu.

- **Status:** 🔶 Częściowo (AI funkcje istnieją w `src/lib/ai/menu-editor.ts`, brak UI)
- **Brakuje:** Przycisk "Sugeruj AI" w MenuVariantEditor, integracja `improveMenuWithAI()`

### US-5.4: Menu per para w PDF/JPG
**Jako** organizator **chcę** wygenerować kartę menu (PDF lub JPG) z wybranymi daniami, ceną i alergenami **aby** wysłać klientowi do akceptacji lub wydrukować.

- **Status:** 🔶 Częściowo (variant export route zwraca text/plain, nie PDF)
- **Brakuje:** Prawdziwy PDF z menu, opcjonalnie JPG, per wariant

---

## EPAK 6: Harmonogram i agenda

### US-6.1: Generowanie harmonogramu AI
**Jako** organizator **chcę** wygenerować harmonogram dnia eventu (przyjazd, powitanie, posiłki, zakończenie) przy pomocy AI **aby** mieć gotowy szablon do edycji.

- **Status:** ✅ Gotowe
- **Kod:** `src/lib/ai/schedule-generator.ts`, `src/components/schedule/AIScheduleGenerator.tsx`

### US-6.2: Edycja harmonogramu (drag & drop)
**Jako** organizator **chcę** edytować harmonogram: zmieniać godziny, kolejność, dodawać punkty **aby** dopasować timeline do konkretnego eventu.

- **Status:** 🔶 Częściowo (lista z edycją inline, brak drag & drop)
- **Kod:** `DayScheduleItem`, `src/app/[locale]/dashboard/day/page.tsx`

### US-6.3: Głosowe dyktowanie agendy
**Jako** organizator **chcę** nagrać notatkę głosową z punktami agendy, która zostanie automatycznie transkrybowana **aby** szybko dodać uwagi bez pisania.

- **Status:** ✅ Gotowe
- **Kod:** `VoiceNote`, `src/lib/voice/transcription.ts`, `src/components/voice/VoiceNoteRecorder.tsx`

### US-6.4: Głosowe odtwarzanie agendy (TTS)
**Jako** organizator **chcę** odsłuchać agendę jako audio wygenerowane przez AI **aby** przesłuchać plan dnia lub puścić go zespołowi.

- **Status:** ✅ Gotowe (podstawowe)
- **Kod:** `src/lib/voice/tts.ts`, `src/components/voice/AgendaAudioPlayer.tsx`

### US-6.5: Akceptacja agendy przez szefa kuchni/managerów
**Jako** organizator **chcę** aby agenda przechodziła przez ścieżkę akceptacji: każda sekcja (harmonogram, menu, goście, kuchnia, ogólne) musi być zatwierdzona przez uprawnioną osobę zanim zostanie wygenerowana finalna agenda.

- **Status:** ✅ Gotowe
- **Kod:** `AgendaApproval`, `src/lib/actions/agenda-approval.actions.ts`, `src/components/agenda/AgendaApprovalPanel.tsx`

### US-6.6: Generowanie finalnej agendy
**Jako** organizator **chcę** po zaakceptowaniu wszystkich sekcji wygenerować finalną agendę (tekst/PDF) **aby** rozesłać zespołowi przed eventem.

- **Status:** 🔶 Częściowo (generuje .txt, brak PDF)
- **Kod:** `src/lib/ai/agenda-generator.ts`

---

## EPAK 7: Kalendarz Google

### US-7.1: Podłączenie Google Calendar
**Jako** organizator **chcę** połączyć moje konto Google Calendar z EventCloud **aby** synchronizować eventy między kalendarzami.

- **Status:** ✅ Gotowe
- **Kod:** `GoogleCalendarConnection`, `src/components/google/GoogleCalendarSection.tsx`

### US-7.2: Import eventów z Google Calendar
**Jako** organizator **chcę** zaimportować istniejące wydarzenia z Google Calendar do EventCloud **aby** nie przepisywać ich ręcznie.

- **Status:** ✅ Gotowe
- **Kod:** `src/components/google/GoogleCalendarImportDialog.tsx`

### US-7.3: Synchronizacja harmonogramu z Google Calendar
**Jako** organizator **chcę** aby punkty harmonogramu (DayScheduleItem) automatycznie synchronizowały się jako wydarzenia w Google Calendar **aby** zespół widział je w swoim kalendarzu.

- **Status:** ✅ Gotowe
- **Kod:** `src/lib/google-calendar-sync.ts`

### US-7.4: Własne pola/metadane w Google Calendar
**Jako** organizator **chcę** aby w Google Calendar przy zsynchronizowanych eventach widniały dodatkowe informacje: typ eventu, liczba gości, wariant menu **aby** mieć kontekst bez wchodzenia do EventCloud.

- **Status:** 🔶 Częściowo (extendedProperties wysyłane, ale tylko 3 hardcodowane pola)
- **Brakuje:** UI do konfiguracji które pola synchronizować

### US-7.5: Subskrypcja kalendarza przez URL (iCal feed)
**Jako** organizator **chcę** dostać link do subskrypcji kalendarza (iCal feed) z tokenem dostępu **aby** dodać go do dowolnej aplikacji kalendarza bez OAuth.

- **Status:** ✅ Gotowe
- **Kod:** `api/calendar/feed/[token]/route.ts`, `api/calendar/export/route.ts`

---

## EPAK 8: Uprawnienia i zespół

### US-8.1: Role systemowe (Owner, Manager, Kuchnia, Staff)
**Jako** właściciel organizacji **chcę** aby system miał predefiniowane role z odpowiednimi uprawnieniami **aby** od razu działał bez ręcznej konfiguracji.

- **Status:** ✅ Gotowe
- **Kod:** `Role`, `SectionPermission`, `src/lib/actions/permissions.actions.ts`

### US-8.2: Zarządzanie uprawnieniami per sekcja
**Jako** właściciel **chcę** per rola ustawić co może: przeglądać, edytować, zatwierdzać w danej sekcji (goście, menu, harmonogram) **aby** kontrolować dostęp precyzyjnie.

- **Status:** 🔶 Częściowo (PermissionManager UI istnieje, brak egzekwowania w UI)
- **Brakuje:** Ukrywanie sekcji w sidebarze per rola, blokowanie przycisków edycji

### US-8.3: Zapraszanie pracowników z przypisaniem roli
**Jako** właściciel **chcę** wysłać zaproszenie email do pracownika z przypisaną rolą **aby** po akceptacji od razu miał odpowiednie uprawnienia.

- **Status:** ❌ Do zrobienia (brak modelu OrganizationMember, brak zaproszeń email)

### US-8.4: Akceptacja agendy przez szefa kuchni (dedykowana rola)
**Jako** szef kuchni **chcę** widzieć tylko sekcje MENU i KUCHNIA z możliwością zatwierdzenia/odrzucenia **aby** skupić się na swojej odpowiedzialności.

- **Status:** ✅ Gotowe (KITCHEN_CHIEF ma canApprove tylko na MENU i KITCHEN)

---

## EPAK 9: Wedding Board (moduł ślubny)

### US-9.1: Aktywacja Wedding Board dla eventu typu WESELE
**Jako** organizator **chcę** aby przy wyborze typu WESELE automatycznie pojawiły się dodatkowe sekcje (moodboard, zaproszenia, portal gości, strona ślubna) **aby** móc zaoferować parze pełen pakiet ślubny.

- **Status:** ❌ Do zrobienia (trzeba scalić obecne dashboard z nową architekturą)

### US-9.2: Moodboard dla pary młodej
**Jako** para młoda **chcę** mieć tablicę inspiracji (moodboard) gdzie mogę zapisywać zdjęcia i pomysły **aby** dzielić się wizją z organizatorem.

- **Status:** ✅ Gotowe (istnieje w `/dashboard/moodboard`)

### US-9.3: Zaproszenia i papeteria
**Jako** para młoda **chcę** wygenerować personalizowane zaproszenia ślubne z danymi gości **aby** wysłać je przed ślubem.

- **Status:** ✅ Gotowe (istnieje w `/dashboard/stationery`)

### US-9.4: Strona weselna (publiczny URL)
**Jako** para młoda **chcę** mieć publiczną stronę wesela pod adresem `weddingboard.pl/w/[slug]` z informacjami dla gości **aby** goście mieli wszystkie szczegóły w jednym miejscu.

- **Status:** ✅ Gotowe (istnieje w `src/app/[locale]/w/[slug]/`)

### US-9.5: Portal gości z RSVP
**Jako** para młoda **chcę** aby goście mogli potwierdzić obecność przez stronę wesela **aby** automatycznie aktualizować listę gości.

- **Status:** ✅ Gotowe (istnieje w `/dashboard/portal`, `/rsvp/[token]`)

### US-9.6: Magazyn (blog) w Wedding Board
**Jako** para młoda **chcę** przeglądać artykuły i porady ślubne w sekcji Magazyn **aby** czerpać inspiracje.

- **Status:** ✅ Gotowe (istnieje w `/magazyn`)

### US-9.7: AI Planer ślubny
**Jako** para młoda **chcę** otrzymać od AI spersonalizowany plan przygotowań ślubnych z zadaniami i timeline **aby** niczego nie przegapić.

- **Status:** ✅ Gotowe (istnieje w `generateTasksAI`)

---

## EPAK 10: Landing page EventCloud

### US-10.1: Strona główna EventCloud
**Jako** odwiedzający **chcę** zobaczyć profesjonalną stronę prezentującą EventCloud: hero, funkcje, typy eventów, cennik, opinie **aby** zdecydować czy założyć konto.

- **Status:** ❌ Do zrobienia
- **Akceptacja:** Nowa strona pod `/(marketing)` z routingiem: `/`, `/features`, `/pricing`, `/contact`

### US-10.2: Sekcja "Wedding Board" jako wyróżniony moduł
**Jako** odwiedzający **chcę** na stronie EventCloud zobaczyć wyróżnioną sekcję o Wedding Board jako module premium **aby** zrozumieć, że planowanie wesela ma dodatkowe narzędzia.

- **Status:** ❌ Do zrobienia

### US-10.3: Cennik z pakietami
**Jako** odwiedzający **chcę** zobaczyć przejrzysty cennik: Free vs Basic vs Pro vs Enterprise **aby** wybrać odpowiedni pakiet.

- **Status:** ❌ Do zrobienia (Stripe produkty istnieją, brak strony cennika)

---

## EPAK 11: CRM i pipeline (Sala B2B)

### US-11.1: Pipeline zapytań (Leads)
**Jako** organizator z salą **chcę** widzieć pipeline zapytań: Nowe → Kontakt → Oferta → Negocjacje → Umowa → Zarezerwowane → Utracone **aby** zarządzać procesem sprzedaży.

- **Status:** ✅ Gotowe
- **Kod:** `VenueLead`, `src/app/[locale]/venue/dashboard/crm/`

### US-11.2: Oferty i wyceny
**Jako** organizator **chcę** tworzyć oferty cenowe dla klientów na podstawie wybranego pakietu i liczby gości **aby** szybko wysyłać profesjonalne wyceny.

- **Status:** ✅ Gotowe
- **Kod:** `VenueQuote`, `src/app/[locale]/venue-offer/[quoteId]/`

### US-11.3: Umowy i podpisy
**Jako** organizator **chcę** generować umowy z szablonów DOCX i wysyłać do podpisu (SMS OTP) **aby** zamknąć rezerwację formalnie.

- **Status:** ✅ Gotowe
- **Kod:** `ContractTemplate`, `Contract`, `src/app/[locale]/venue/dashboard/reservations/[id]/contracts/`

### US-11.4: Płatności — harmonogram i śledzenie
**Jako** organizator **chcę** rozłożyć płatność na raty (zadatek, rata 2, końcowe, kaucja) i śledzić które są opłacone **aby** kontrolować finanse rezerwacji.

- **Status:** ✅ Gotowe
- **Kod:** `VenuePaymentInstallment`

### US-11.5: Czat z klientem
**Jako** organizator **chcę** komunikować się z parą przez wbudowany czat **aby** cała historia konwersacji była w jednym miejscu.

- **Status:** ✅ Gotowe
- **Kod:** `VenueMessage`

---

## EPAK 12: Powiadomienia i dostarczanie

### US-12.1: Powiadomienia w aplikacji (dzwonek)
**Jako** organizator **chcę** widzieć powiadomienia o nowych wiadomościach, zmianach statusu, akceptacjach **aby** być na bieżąco.

- **Status:** ✅ Gotowe
- **Kod:** `VenueNotification`, notification bell w headerze

### US-12.2: Powiadomienia email
**Jako** organizator **chcę** dostawać email gdy klient wyśle wiadomość lub zaakceptuje agendę **aby** nie przegapić ważnych akcji.

- **Status:** 🔶 Częściowo (Resend skonfigurowany, brak dla wszystkich triggerów)

### US-12.3: Powiadomienia push (PWA)
**Jako** organizator **chcę** dostawać push notyfikacje na telefon **aby** reagować natychmiast.

- **Status:** 🔶 Częściowo (web-push i serwist są, nie w pełni wykorzystane)

---

## Mapa zależności — kolejność implementacji

```
Faza 1 (Fundament — Organization + RBAC)
├── US-1.1 ✅ Rejestracja (już jest)
├── US-1.2 ❌ Organization
├── US-1.4 ❌ OrganizationMember + RBAC
├── US-1.3 ❌ Pakiety subskrypcyjne
├── US-2.6 ❌ Konfigurator własnych kategorii eventu  ← NOWE
│
Faza 2 (Dashboard EventCloud)
├── US-3.1 ❌ Nowy layout + sidebar
├── US-3.2 ❌ Kolorystyka biznesowa
├── US-2.3 ❌ Egzekwowanie widoczności sekcji
├── US-2.7 ❌ Per-event nadpisywanie modułów  ← NOWE
│
Faza 3 (Konfigurator kategorii — kluczowy feature)
├── US-2.6 ❌ UI konfiguratora kategorii (drag & drop modułów?)
├── US-2.7 ❌ Zapis szablonu → użycie przy tworzeniu eventu
│
Faza 4 (Eventy — integracja)
├── US-4.x ✅ Goście (już jest)
├── US-5.x 🔶 Menu (integracja AI, PDF)
├── US-6.x 🔶 Agenda (PDF)
├── US-7.x ✅ Kalendarz Google (już jest)
│
Faza 5 (Wedding Board jako moduł)
├── US-9.1 ❌ Aktywacja Wedding Board per WEDDING
├── US-9.2-9.7 ✅ Funkcje ślubne (już są)
│
Faza 6 (Biznes)
├── US-10.x ❌ Landing page EventCloud
├── US-11.x ✅ CRM / Sala B2B (już jest)
├── US-12.x 🔶 Powiadomienia
│
Faza 7 (Polerowanie)
├── US-5.3 ❌ AI menu w UI
├── US-5.4 ❌ Menu PDF
├── US-6.6 ❌ Agenda PDF
└── US-8.3 ❌ Zaproszenia pracowników
```

---

## Legenda statusów

| Symbol | Znaczenie |
|--------|-----------|
| ✅ | Gotowe — działa w produkcji |
| 🔶 | Częściowo — kod istnieje ale wymaga integracji/rozbudowy |
| ❌ | Do zrobienia — nie istnieje, trzeba zbudować od zera |

---

**Koniec dokumentu.** Następny krok: implementacja Fazy 1 na branchu `feature/6`.
