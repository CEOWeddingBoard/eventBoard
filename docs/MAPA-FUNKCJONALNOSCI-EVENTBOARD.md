# Mapa Funkcjonalności — EventBoard + Wedding Board

> **Wersja:** 2.0 | **Branch:** `feature/6` | **Data:** 06.08.2026

---

## Diagram Architektury Funkcjonalnej

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│                              🏢  E V E N T B O A R D                                │
│                         Platforma do zarządzania eventami                            │
│                              (aplikacja biznesowa B2B)                               │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐  │
│  │                       │  │                       │  │                        │  │
│  │   🏠 LANDING PAGE     │  │  👤 KONTO / AUTH      │  │  💳 PAKIETY / STRIPE   │  │
│  │                       │  │                       │  │                        │  │
│  │  • Hero section       │  │  • Clerk (email/SSO)  │  │  • Free (1 event)      │  │
│  │  • Funkcje platformy  │  │  • Rejestracja org.   │  │  • Basic (5 ev, 3us)   │  │
│  │  • Typy eventów       │  │  • Onboarding         │  │  • Pro (20 ev, 10us)   │  │
│  │  • Cennik             │  │  • Zarządzanie prof.  │  │  • Enterprise (∞)      │  │
│  │  • Case studies       │  │                       │  │  • Feature gating      │  │
│  │  • Kontakt            │  │                       │  │                        │  │
│  └───────────────────────┘  └───────────────────────┘  └────────────────────────┘  │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                              │  │
│  │                      📊  D A S H B O A R D   O R G A N I Z A T O R A          │  │
│  │                                                                              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐  │  │
│  │  │  KPI / FINANSE   │  │  KALENDARZ       │  │  ZESPÓŁ (RBAC)             │  │  │
│  │  │  • Aktywne ev.   │  │  • Widok miesięc.│  │  • Lista członków          │  │  │
│  │  │  • Przychód      │  │  • Blokady termin │  │  • Dodaj/Zaproś            │  │  │
│  │  │  • Płatności     │  │  • Google Sync    │  │  • Role: OWNER/MANAGER/    │  │  │
│  │  │  • Pipeline      │  │  • iCal Feed      │  │    STAFF/VIEWER            │  │  │
│  │  │  • Raporty       │  │  • Import eventów │  │  • Uprawnienia per moduł   │  │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────────────┘  │  │
│  │                                                                              │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                     📋  LISTA EVENTÓW                                │    │  │
│  │  │  • Filtry: status, typ, data, sala                                  │    │  │
│  │  │  • Szybkie akcje: edytuj, duplikuj, archiwizuj                       │    │  │
│  │  │  • + Nowy event → wybór kategorii → konfiguracja modułów            │    │  │
│  │  └──────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                              │  │
│  │                 ⚙️  K O N F I G U R A T O R   K A T E G O R I I               │  │
│  │                                                                              │  │
│  │  Organizator tworzy WŁASNE kategorie eventów i wybiera dostępne moduły:       │  │
│  │                                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐    │  │
│  │  │ Kategoria: "Chrzciny"                                               │    │  │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │  │
│  │  │ │☑ Goście  │ │☑ Menu   │ │☑ Agenda │ │☐ Budżet  │ │☐ Stoliki │   │    │  │
│  │  │ │ allergens │ │ A/B/C   │ │          │ │          │ │          │   │    │  │
│  │  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │  │
│  │  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │  │
│  │  │ │☐ Dostawcy│ │☐ Zdjęcia │ │☐ Finanse │ │☐ Zadania │ │☐ Linki  │   │    │  │
│  │  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │  │
│  │  └─────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                              │  │
│  │  Kategoria: "Wesele" → automatycznie:                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────┐           │  │
│  │  │ Wszystkie podstawowe  +  🔔 WEDDING BOARD (moduły premium)   │           │  │
│  │  └──────────────────────────────────────────────────────────────┘           │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│                      💒  W E D D I N G   B O A R D                                   │
│                Moduł ślubny — aktywny tylko gdy eventType = WESELE                   │
│                         (aplikacja dla pary młodej B2C)                               │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐  │  │
│  │  🎨 MOODBOARD        │  │  💌 ZAPROSZENIA       │  │  🌐 STRONA WESELNA      │  │  │
│  │  • Tablica inspiracji │  │  • Szablony PDF       │  │  • w/[slug]             │  │  │
│  │  • Zapis zdjęć        │  │  • Personalizacja     │  │  • Info dla gości       │  │  │
│  │  • Dzielenie z parter.│  │  • Eksport do druku   │  │  • Zdjęcia, mapa        │  │  │
│  │                       │  │  • Winietki            │  │  • RSVP online          │  │  │
│  └───────────────────────┘  └───────────────────────┘  └────────────────────────┘  │  │
│                                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐  │  │
│  │  📋 PORTAL GOŚCI      │  │  🤖 AI PLANER ŚLUBNY  │  │  📰 MAGAZYN (BLOG)     │  │  │
│  │  • Potwierdzenia RSVP │  │  • Lista zadań        │  │  • Artykuły ślubne     │  │  │
│  │  • Preferencje diety  │  │  • Timeline 18 mies.  │  │  • Porady              │  │  │
│  │  • Noclegi/transport  │  │  • Role: Panna/Pan     │  │  • Inspiracje          │  │  │
│  │  • Życzenia           │  │  • Budżet szacunkowy  │  │  • Trendy              │  │  │
│  │  • Zdjęcia gości      │  │                       │  │                        │  │  │
│  └───────────────────────┘  └───────────────────────┘  └────────────────────────┘  │  │
│                                                                                     │
│  ┌───────────────────────┐  ┌───────────────────────┐                               │  │
│  │  🎁 PREZENTY          │  │  📊 BUDŻET ŚLUBNY     │                               │  │
│  │  • Lista prezentów    │  │  • Plan vs Rzeczywiste │                               │  │
│  │  • Status rezerwacji  │  │  • Kategorie kosztów  │                               │  │
│  │                       │  │  • Płatności           │                               │  │
│  └───────────────────────┘  └───────────────────────┘                               │  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘


## Mapa Modułów — widok szczegółowy

### LEGENDA:
```
✅ Gotowe    🔶 Częściowo    ❌ Do zrobienia    🆕 Nowe w EventBoard
```

---

### BLOK A: ORGANIZACJA (nowy fundament)

```
┌──────────────────────────────────────────────────────────┐
│ 🆕 ORGANIZATION                                          │
│ ├── name, slug, logo, address, phone, email              │
│ ├── plan: FREE | BASIC | PRO | ENTERPRISE                │
│ └── 🆕 OrganizationMember (users → role → permissions)    │
│     ├── OWNER       (wszystko)                           │
│     ├── MANAGER     (zarządzanie eventami, zespół)        │
│     ├── STAFF       (edycja gości, menu, harmonogram)     │
│     └── VIEWER      (tylko podgląd)                      │
├──────────────────────────────────────────────────────────┤
│ 🆕 EventCategory (własne kategorie organizatora)          │
│ ├── name, icon, color                                    │
│ ├── modulesJson: ["guests","menu","schedule",...]        │
│ ├── defaultsJson: { guestListMode, ... }                 │
│ └── isSystem: true dla predefiniowanych                   │
└──────────────────────────────────────────────────────────┘
```

---

### BLOK B: MODUŁY PODSTAWOWE (wszystkie typy eventów)

```
┌─────────────────────────────────────────────────────────────┐
│ 👥 GOŚCIE                                          ✅       │
│ ├── tryb: FULL (pełna lista)                              │
│ │   ├── Imię, nazwisko, email, telefon                     │
│ │   ├── Dieta: vege, vegan, bezgluten                      │
│ │   ├── Alergie, preferencje alkoholowe                    │
│ │   ├── Nocleg, transport                                  │
│ │   ├── Grupa (rodzina, znajomi...)                        │
│ │   ├── Import CSV / Eksport                               │
│ │   └── Przypisanie do stołu                               │
│ └── tryb: ALLERGENS_ONLY (tylko alergeny)        ✅        │
│     ├── Imię + checkboxy: vege, gluten, bezgluten, inne    │
│     └── Notatki                                            │
├─────────────────────────────────────────────────────────────┤
│ 🍽️  MENU (warianty A/B/C)                       ✅        │
│ ├── MenuVariant: "MENU A", "MENU B", "MENU WIGILIJNE"     │
│ ├── Grupy wyboru: przystawka, zupa, danie, deser          │
│ ├── Alergeny per danie: vege, gluten, bezgluten            │
│ ├── Ceny: bazowa + dopłaty                                 │
│ ├── 🔶 AI Menu Editor (funkcje są, brak UI)               │
│ └── 🔶 Eksport PDF/JPG (zwraca text/plain, nie PDF)       │
├─────────────────────────────────────────────────────────────┤
│ 📅 HARMONOGRAM / AGENDA                           ✅       │
│ ├── AI Schedule Generator (mock + OpenAI)                  │
│ ├── DayScheduleItem: start, end, tytuł, opis, lokacja     │
│ ├── 🔶 Drag & drop do sortowania                          │
│ ├── Głosowe notatki (VoiceNote + Whisper transkrypcja) ✅  │
│ ├── Głosowe odtwarzanie agendy (TTS)              ✅       │
│ ├── AgendaApproval: 5 sekcji × akceptacja bossa   ✅       │
│ │   ├── SCHEDULE → ktoś musi zatwierdzić                  │
│ │   ├── MENU     → szef kuchni zatwierdza                  │
│ │   ├── GUESTS   → manager zatwierdza                      │
│ │   ├── KITCHEN  → szef kuchni zatwierdza                  │
│ │   └── GENERAL  → owner zatwierdza                        │
│ └── 🔶 Finalna agenda PDF (jest .txt, brak PDF)           │
├─────────────────────────────────────────────────────────────┤
│ 🪑 STOLIKI / USADZENIE                           ✅       │
│ ├── Table: nazwa, pojemność, kształt, pozycja              │
│ ├── Stół pary młodej (isCoupleTable)                       │
│ ├── RoomCanvas: wizualny plan sali (drag & drop) ✅        │
│ ├── RoomElement: DJ, scena, wejście                        │
│ ├── SeatingRule: reguły automatycznego usadzania           │
│ └── Eksport: PDF winietek + plan stołów                    │
├─────────────────────────────────────────────────────────────┤
│ 💰 BUDŻET                                          ✅       │
│ ├── BudgetItem: kategoria, plan, rzeczywiste               │
│ ├── Porównanie plan vs fakt                                │
│ └── Raporty                                                │
├─────────────────────────────────────────────────────────────┤
│ 📋 ZADANIA                                         ✅       │
│ ├── Task: tytuł, status, priorytet, termin                 │
│ ├── assigneeRole: BRIDE | GROOM | TOGETHER                 │
│ ├── AI generowanie zadań (mock + OpenAI)          ✅       │
│ └── Filtry po roli                                         │
├─────────────────────────────────────────────────────────────┤
│ 🔗 EVENT BOARD LINKI                              ✅       │
│ ├── EventBoardLink: label, url, icon, sortOrder            │
│ └── Renderowanie na dashboardzie + portalu gości           │
├─────────────────────────────────────────────────────────────┤
│ 📸 ZDJĘCIA                                         🔶      │
│ ├── Photo: url, uploadedBy                                 │
│ └── Galeria per event                                      │
├─────────────────────────────────────────────────────────────┤
│ 🏪 DOSTAWCY                                        ✅       │
│ ├── Vendor: nazwa, kategoria, kontakt                      │
│ ├── VendorDocument: umowy, faktury                         │
│ └── Portal dostawcy (token-based)                          │
├─────────────────────────────────────────────────────────────┤
│ 📊 FINANSE (dashboard organizatora)               🔶      │
│ ├── KPI: przychód, oczekujące, pipeline                    │
│ ├── Wykresy miesięczne                                     │
│ └── Eksport CSV                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### BLOK C: MODUŁY PREMIUM / ŚLUBNE (tylko WESELE → Wedding Board)

```
┌─────────────────────────────────────────────────────────────┐
│ 💒 WEDDING BOARD                                  🔶      │
│ (aktywacja per event typu WESELE)                          │
│                                                             │
│ ├── 🎨 MOODBOARD                                   ✅      │
│ │   └── Tablica inspiracji (zapis zdjęć, kategorie)        │
│ │                                                          │
│ ├── 💌 ZAPROSZENIA / PAPETERIA                     ✅      │
│ │   ├── Szablony: DL, A5, A6                              │
│ │   ├── Personalizacja: kolory, fonty, tekst               │
│ │   ├── Dane z Guest modelu                                │
│ │   └── PDF do druku                                       │
│ │                                                          │
│ ├── 🌐 STRONA WESELNA (w/[slug])                   ✅      │
│ │   ├── Publiczny URL                                      │
│ │   ├── Info: data, miejsce, dress code                    │
│ │   ├── Mapa dojazdu                                       │
│ │   └── Linki: RSVP, prezenty, kontakt                     │
│ │                                                          │
│ ├── 📋 PORTAL GOŚCI + RSVP                         ✅      │
│ │   ├── Potwierdzenie obecności                            │
│ │   ├── Preferencje: dieta, nocleg, transport              │
│ │   ├── Życzenia                                           │
│ │   ├── Zdjęcia od gości                                   │
│ │   └── Token-based access                                 │
│ │                                                          │
│ ├── 🤖 AI PLANER ŚLUBNY                            ✅      │
│ │   ├── GenerateTasksAI: pełna lista z rolami              │
│ │   ├── Timeline: od 18 mies. przed do dnia ślubu          │
│ │   └── OpenAI + mock fallback                             │
│ │                                                          │
│ ├── 🎁 PREZENTY                                    ✅      │
│ │   └── Wish: nazwa, link, status, kto rezerwuje           │
│ │                                                          │
│ └── 📰 MAGAZYN (blog)                               ✅      │
│     ├── Artykuły, porady, inspiracje                       │
│     └── /magazyn route                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### BLOK D: SALA / VENUE MANAGER (B2B)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 VENUE MANAGER (Sala / Restauracja)             ✅      │
│                                                             │
│ ├── 📋 REZERWACJE (VenueReservation)                       │
│ │   ├── Status pipeline: DRAFT → ACTIVE → CONFIRMED → DONE │
│ │   ├── Sala + pakiet + liczba gości + cena                │
│ │   └── Token dostępu dla pary                              │
│ │                                                           │
│ ├── 📊 CRM / PIPELINE (VenueLead)                          │
│ │   ├── Statusy: NEW → CONTACTED → QUOTE → NEGOTIATING     │
│ │   ├── Kanban board (drag & drop)                         │
│ │   └── Marketplace inquiries → auto lead                   │
│ │                                                           │
│ ├── 💰 OFERTY (VenueQuote)                                 │
│ │   └── Wycena: pakiet × goście = cena                     │
│ │                                                           │
│ ├── 📄 UMOWY (Contract)                                    │
│ │   ├── Szablony DOCX z placeholderami                      │
│ │   └── Podpis SMS OTP                                     │
│ │                                                           │
│ ├── 💳 PŁATNOŚCI (VenuePaymentInstallment)                 │
│ │   ├── Harmonogram: zadatek + raty + końcowe + kaucja     │
│ │   └── Status: oczekujące / opłacone / zaległe            │
│ │                                                           │
│ ├── 🗓️  KALENDARZ SALI                                     │
│ │   ├── Rezerwacje + blokady                                │
│ │   ├── Blokady cykliczne (np. poniedziałki)                │
│ │   └── iCal export                                         │
│ │                                                           │
│ ├── 🍽️  KATALOG MENU (VenueMenuPackage)                    │
│ │   ├── Pakiety + dania + grupy wyboru                      │
│ │   └── Sezonowość cen                                      │
│ │                                                           │
│ ├── 💬 CZAT Z PARĄ (VenueMessage)                          │
│ │   └── Auto-odświeżanie co 8s                              │
│ │                                                           │
│ ├── 📊 RAPORTY I FINANSE                                   │
│ │   ├── KPI: przychód, rezerwacje, średnia wartość         │
│ │   └── Popularność sal/pakietów                            │
│ │                                                           │
│ └── 👥 STAFF / GRAFIK                                      │
│     └── VenueStaff + VenueStaffShift                        │
└─────────────────────────────────────────────────────────────┘
```

---

### BLOK E: KALENDARZ GOOGLE

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 GOOGLE CALENDAR INTEGRATION                    ✅       │
│                                                             │
│ ├── OAuth (Clerk + dedykowany)                              │
│ ├── Import eventów z Google → EventCloud                   │
│ ├── Synchronizacja: EventCloud → Google (2-way sync)       │
│ │   ├── Event jako główne wydarzenie                        │
│ │   ├── DayScheduleItem jako szczegółowe punkty             │
│ │   └── extendedProperties: eventType, guestCount, menu     │
│ ├── iCal Feed (token URL)                                  │
│ └── Eksport .ics do pobrania                                │
└─────────────────────────────────────────────────────────────┘
```

---

### BLOK F: AUTENTYKACJA I UPRAWNIENIA

```
┌─────────────────────────────────────────────────────────────┐
│ 🔐 AUTH & RBAC                                    🔶      │
│                                                             │
│ ├── CLERK (autentykacja)                           ✅      │
│ │   ├── Email + Google SSO                                 │
│ │   ├── Custom sign-in/up pages                             │
│ │   └── Middleware protect                                   │
│ │                                                          │
│ ├── RBAC (autoryzacja)                             🔶      │
│ │   ├── Role: OWNER, MANAGER, KITCHEN_CHIEF, STAFF ✅      │
│ │   ├── SectionPermission: canView/canEdit/canApprove ✅   │
│ │   ├── 🆕 OrganizationMember (globalne role w org)        │
│ │   ├── 🆕 Permissions JSON per user (override)            │
│ │   └── 🔶 UI enforcement (sidebar, button hiding)         │
│ │                                                          │
│ ├── PARTNER ACCESS (bez konta Clerk)               ✅      │
│ │   ├── Partner session JWT cookie                          │
│ │   └── PIN-based access                                    │
│ │                                                          │
│ └── VENDOR / CLIENT TOKENS                         ✅      │
│     ├── Vendor portal: [token]                              │
│     ├── Wedding client: [token]                             │
│     └── RSVP: [token]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow użytkownika (ścieżka główna)

```
                        ┌─────────────────────┐
                        │   Odwiedzający       │
                        │ wchodzi na landing   │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ eventboard.pl/      │
                        │ Landing page        │
                        │ (prezentacja)       │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼                             ▼
           ┌──────────────┐             ┌──────────────┐
           │ "Załóż konto" │             │ Przegląda    │
           │ (Clerk)       │             │ cennik, case │
           └──────┬───────┘             │ studies      │
                  │                     └──────────────┘
                  ▼
           ┌──────────────┐
           │ Onboarding    │
           │ • Nazwa firmy │
           │ • Adres       │
           │ • Pakiet      │
           └──────┬───────┘
                  │
                  ▼
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │       DASHBOARD ORGANIZATORA                    │
    │                                                 │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
    │  │Konfiguruj│  │Dodaj     │  │Utwórz        │ │
    │  │kategorie │  │pracownik.│  │pierwszy event│ │
    │  │eventów   │  │          │  │              │ │
    │  └──────────┘  └──────────┘  └──────┬───────┘ │
    │                                     │         │
    └─────────────────────────────────────┼─────────┘
                                          │
                                          ▼
    ┌─────────────────────────────────────────────────┐
    │             TWORZENIE EVENTU                    │
    │                                                 │
    │  1. Wybierz kategorię (np. "Chrzciny")          │
    │  2. System ładuje moduły zdefiniowane per kat.  │
    │  3. Opcjonalnie: nadpisz checkboxami per event  │
    │  4. Uzupełnij podstawowe dane                   │
    │                                                 │
    │  Jeśli kategoria = WESELE:                      │
    │  ┌─────────────────────────────────────────┐   │
    │  │ 🔔 Automatycznie aktywuje się            │   │
    │  │    WEDDING BOARD z modułami premium      │   │
    │  └─────────────────────────────────────────┘   │
    │                                                 │
    └────────────────────┬────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────────┐
    │          ZARZĄDZANIE EVENTEM                    │
    │                                                 │
    │  Sidebar (dynamiczny — zależny od kategorii):   │
    │  • Goście        (jeśli włączone)               │
    │  • Menu A/B/C    (jeśli włączone)               │
    │  • Harmonogram   (jeśli włączone)               │
    │  • Budżet        (jeśli włączone)               │
    │  • Stoliki       (jeśli włączone)               │
    │  • Dostawcy      (jeśli włączone)               │
    │  • Zdjęcia       (jeśli włączone)               │
    │  • Finanse       (jeśli włączone)               │
    │  • Linki         (jeśli włączone)               │
    │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─        │
    │  • 🎨 Moodboard     (tylko WESELE)             │
    │  • 💌 Zaproszenia   (tylko WESELE)             │
    │  • 🌐 Strona WWW    (tylko WESELE)             │
    │  • 📋 Portal gości  (tylko WESELE)             │
    │  • 🤖 AI Planner    (tylko WESELE)             │
    │  • 🎁 Prezenty      (tylko WESELE)             │
    │                                                 │
    └────────────────────┬────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────────┐
    │        FINALIZACJA EVENTU                       │
    │                                                 │
    │  • Wszystkie sekcje zaakceptowane               │
    │  • Agenda wygenerowana (tekst/PDF)              │
    │  • Menu PDF wysłane do klienta                  │
    │  • Lista gości przekazana kuchni                │
    │  • Event → COMPLETED                            │
    │  • Raporty zaktualizowane                       │
    └─────────────────────────────────────────────────┘
```

---

## Stos technologiczny

| Warstwa | Technologia | Status |
|---------|-------------|--------|
| Framework | Next.js 15 (App Router) | ✅ |
| Język | TypeScript 5 | ✅ |
| UI | React 18 + Tailwind CSS + shadcn/ui | ✅ |
| Baza danych | Prisma ORM (PostgreSQL / SQLite) | ✅ |
| Auth | Clerk (autentykacja) | ✅ |
| RBAC | Własny system (Role + SectionPermission) | ✅ |
| Płatności | Stripe (subskrypcje) | ✅ |
| Email | Resend | ✅ |
| i18n | next-intl (pl + en) | ✅ |
| AI | OpenAI (GPT-4o, Whisper, TTS) | ✅ |
| Kalendarz | Google Calendar API (OAuth) | ✅ |
| State | TanStack React Query + React Hook Form + Zod | ✅ |
| PWA | @serwist (Service Worker) | ✅ |

---

**Koniec mapy funkcjonalności.**
