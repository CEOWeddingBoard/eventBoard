# WeddingBoard — Case Study: System zarządzania salą weselną

---

## Scenariusz: Sala "Pałac pod Dębami"

**Bohaterka:** Ania — managerka sali weselnej (120-200 gości, 3 sale, 3 pakiety)  
**Klient:** Kasia i Tomek — para młoda (ślub 15.08.2026, 95 gości)

---

## FAZA 1: ONBOARDING SALI

**Dzień 1 — Rejestracja**

Ania wchodzi na WeddingBoard → klika "Jestem Organizatorem"  
→ rejestruje się (email + Google)  
→ wypełnia onboarding: nazwa "Pałac pod Dębami", adres, email, telefon, max gości: 200  
→ system tworzy profil sali z unikalnym slugiem  
→ przekierowanie na dashboard managera

---

## FAZA 2: KONFIGURACJA OFERTY

**Sekcja: Ustawienia → Sale**

Ania definiuje 3 sale:
| Sala | Pojemność |
|------|-----------|
| Sala Balowa | 200 os. |
| Sala Kominkowa | 80 os. |
| Oranżeria | 120 os. |

**Sekcja: Ustawienia → Pakiety**

Ania tworzy 3 pakiety:
| Pakiet | Cena/os. | Sezon |
|--------|----------|-------|
| Basic | 180 zł | ALL |
| Premium | 240 zł | ALL |
| Basic Zimowy | 160 zł | WINTER |

**Sekcja: Skład pakietu Premium**

Każdy pakiet ma grupy wyboru (choice groups):
- Zupa: 1 z 3 dań (rosół, krem z pomidorów, żurek)
- Danie główne: 1 z 4 (schabowy, de volaille, łosoś, stek)
- Deser: 1 z 3 (szarlotka, tiramisu, sernik)

Każde danie oznaczone: wege, bezglutenowe, cena dopłaty.

**Sekcja: Ustawienia → Stoły**

20 stołów okrągłych (10 os.) + 5 prostokątnych (12 os.)

**Sekcja: Ustawienia → Umowy**

Ania wgrywa wzór `umowa-glowna.docx` z placeholderami:
```
{{coupleName}} | {{weddingDate}} | {{hallName}}
{{packageName}} | {{guestCount}} | {{totalPrice}}
```

System parsuje DOCX i pokazuje listę wykrytych zmiennych do mapowania.

---

## FAZA 3: PIERWSZA REZERWACJA

**Tydzień 2 — Nowa rezerwacja**

Ania: Dashboard → "+ Nowa rezerwacja" → formularz:
- Imiona: Kasia i Tomek
- Email: kasia@example.com
- Data: 15.08.2026
- Sala: Oranżeria
- Pakiet: Premium
- Goście (szac.): 100
- System auto: 100 × 240 zł = **24 000 zł szacunkowo**

Ania klika "Zapisz i wyślij zaproszenie"

→ System generuje unikalny token dostępu  
→ Wysyła email do Kasi z linkiem: `weddingboard.pl/wedding-client/abc123`

---

## FAZA 4: PORTAL PARY MŁODEJ

Kasia dostaje email → klika link → portal:

### Krok 1: Aktywacja
Widzi: "Witaj w Pałac pod Dębami | Kasia i Tomek | 15 sierpnia 2026"  
Klika "Potwierdzam" → rezerwacja przechodzi w status ACTIVE

### Krok 2: Zakładki portalu

System pokazuje 5 zakładek (wg konfiguracji sali):

**ZAKŁADKA 1 — Lista gości**
- Dodaje gości ręcznie: imię, nazwisko, dieta (wege/vegan/dziecko), alergie (orzechy, gluten), grupa (rodzina Pana Młodego)
- Import CSV: wrzuca plik 40-gości-od-rodzicow.csv → system parsuje i dodaje
- Łącznie 95 gości, 3 wege, 2 vegan, 4 dzieci
- Klika "Przekaż listę sali" → `guestsCompleted = true`

**ZAKŁADKA 2 — Menu**
- Widzi pakiety zdefiniowane przez salę
- Wybiera: rosół, łosoś, tiramisu
- System pokazuje szacunkowy koszt: 95 × 240 = 22 800 zł
- Klika "Zapisz i zatwierdź" → `menuCompleted = true`

**ZAKŁADKA 3 — Usadzenie**
- Widzi 20 stołów z pojemnością (10 os. każdy)
- Przypisuje gości do stołów przez select
- System pilnuje: stół nr 5 ma 11 gości → czerwone ostrzeżenie "Przekroczono pojemność"
- Kasia przenosi jednego gościa do stołu nr 8
- Klika "Przekaż usadzenie sali" → `seatingCompleted = true`

**ZAKŁADKA 4 — Harmonogram**
- Klika "Szablon wesela" → system ładuje 9-punktowy timeline:
  ```
  15:00 Przyjazd gości
  16:00 Ceremonia / powitanie
  17:00 Koktajl
  18:00 Zupa
  19:30 Danie główne
  21:00 Pierwszy taniec
  22:00 Tort weselny
  23:30 Oczepiny
  01:00 Zakończenie
  ```
- Kasia dostosowuje godziny, dodaje "19:00 Przemówienia"
- Klika "Przekaż harmonogram sali" → `scheduleCompleted = true`

**ZAKŁADKA 5 — Wiadomości (czat)**
- Kasia pisze: "Czy możemy dostać dodatkowy stół dla dzieci?"
- Ania (sala) widzi wiadomość w swoim panelu
- Ania odpowiada: "Tak, przygotujemy stół dziecięcy obok stołu nr 3"

---

## FAZA 5: PANEL SALI — ZARZĄDZANIE REZERWACJĄ

Ania wchodzi w: Dashboard → Rezerwacje → Kasia i Tomek

### Widok: Przegląd (Overview)
- Progress card: 4/4 moduły zielone (zatwierdzone)
- Edytowalne info o parze: imiona, email, data, sala, pakiet, goście
- Zmiana gości na 95 → koszt auto-aktualizuje się: 22 800 zł
- Historia aktywności: `CREATED → INVITE_SENT → GUESTS_SUBMITTED → MENU_SUBMITTED → ...`

### Widok: Goście (VenueGuestEditor)
- Tabela z wszystkimi 95 gośćmi (sortowalna, filtrowalna)
- Może edytować dowolnego gościa inline: dieta, alergie, stół, status
- Może dodać/usunąć gościa
- Import CSV po stronie sali
- Eksport PDF listy gości dla kuchni

### Widok: Menu (VenueMenuEditor)
- Widzi pakiety i grupy wyboru
- Widzi wybory Kasi: rosół, łosoś, tiramisu
- Może zmienić wybory, zapisać zmiany

### Widok: Usadzenie — Lista stołów
- Karty stołów z gośćmi, dietami, ostrzeżeniami
- Nieprzypisani goście (czerwona sekcja)
- Może przypisywać gości do stołów

### Widok: Usadzenie — Plan sali (VenueRoomCanvas)
- Wizualny canvas: 20 stołów na planie Oranżerii
- Przeciąga stoły myszką, ustawia układ
- Widzi gości na stołach z kolorowymi kropkami:
  - Zielona = wege
  - Niebieska = vegan
  - Pomarańczowa = dziecko
- Dodaje elementy sali: scena, DJ, bar, wejście
- Zoom: 50% / 100% / 150%
- Zapisuje układ jako szablon "Oranżeria układ A"
- Ładuje szablon "Oranżeria układ B" dla porównania

### Widok: Harmonogram (VenueScheduleEditor)
- Timeline z 10 punktami
- Przeciąganie góra/dół do zmiany kolejności
- Edycja inline każdego punktu
- Dodawanie nowych punktów
- Szablon wesela (reset do default)

### Widok: Oferty (VenueQuotesPanel)
- Tworzy ofertę: Premium × 95 gości = 22 800 zł
- Wysyła do Kasi przez system
- Kasia dostaje link, widzi ofertę, akceptuje

### Widok: Umowy (VenueContractsPanel)
- Wybiera szablon "Umowa główna"
- System podpowiada pola: `coupleName="Kasia i Tomek"`, `totalPrice="22800"`
- Uzupełnia ręczne pola: adres, NIP, warunki dodatkowe
- Klika "Generuj i wyślij do podpisu"

#### Proces podpisu uproszczonego:
1. Kasia dostaje email z unikalnym linkiem
2. Klika → weryfikacja SMS (OTP)
3. Widzi dokument, podpisuje odręcznie na ekranie (myszką/dotykiem)
4. System zmienia status: `SENT_FOR_SIGNING → SIGNED_BY_COUPLE`
5. Ania dostaje powiadomienie (w czacie)
6. Ania klika "Podpisz jako sala" → `SIGNED_BOTH`

### Widok: Płatności (VenuePaymentsPanel)
- Z propozycją 30% zadatku: 6 840 zł
- Harmonogram:
  | Typ | Kwota | Termin |
  |-----|-------|--------|
  | Zadatek (30%) | 6 840 zł | 30 dni od umowy |
  | Rata 2 (40%) | 9 120 zł | 30 dni przed weselem |
  | Końcowe (30%) | 6 840 zł | 7 dni po weselu |
  | Kaucja zwrotna | 2 000 zł | — |
- Oznacza wpłaty jako "opłacone" po przelewie

### Widok: Wiadomości (czat)
- Pełna historia konwersacji z parą
- Sala pisze → para widzi w portalu
- Para pisze → sala widzi w panelu
- Auto-odświeżanie co 8 sekund

---

## FAZA 6: KALENDARZ I PLANOWANIE

**Panel: Kalendarz**

Ania widzi:
- Sierpień 2026 — 4 rezerwacje (olive)
- 14.08 — zablokowane "Przygotowanie sali, 8:00-22:00" (czerwone)
- Każdy poniedziałek — blokada cykliczna "Dzień techniczny"

**Blokowanie terminu:**
1. Klika "+" → dialog
2. Wybiera: data: 14.08, sala: Oranżeria, godziny: 08:00-22:00, powtarzanie: jednorazowo
3. Powód: "Przygotowanie sali + próba generalna"
4. Zapisz — dzień czerwony na kalendarzu

**Eksport kalendarza:**
- Klika "iCal" → pobiera plik `.ics`
- Dodaje do Google Calendar → automatyczna synchronizacja

---

## FAZA 7: FINANSE I RAPORTY

**Dashboard → Finanse (VenueFinanceDashboard)**

Karty KPI:
| Metryka | Wartość |
|---------|---------|
| Opłacone | 45 600 zł |
| Oczekujące | 22 800 zł |
| Zaległe | 0 zł |
| Pipeline | 96 000 zł |

Wykres słupkowy: przychody miesięczne (czerwiec – grudzień)  
Nadchodzące płatności: lista z datami i kwotami  
Podział: zadatki 2, raty 4, końcowe 2, kaucje 2  

**Dashboard → Raporty (VenueReports)**

| Metryka | Wartość |
|---------|---------|
| Aktywne rezerwacje | 4 |
| Ukończone | 12 |
| Łącznie gości | 380 |
| Śr. rezerwacja | 24 000 zł |

Popularne pakiety:
```
Premium     ████████████ 72 000 zł
Basic       ██████       36 000 zł
Basic Zima  ████         24 000 zł
```

Sale:
```
Oranżeria        ████████████ 4 rezerwacje
Sala Balowa      ██████       2 rezerwacje
Sala Kominkowa   ████         1 rezerwacja
```

CSV Export: przycisk pobiera raport do Excela

---

## FAZA 8: DZIEŃ WESELA

**Panel: Dzień wesela w rezerwacji**

Ania otwiera rezerwację → "Dzień wesela":

**Checklista kuchnia:**
```
☑ Rosół — 95 porcji (w tym 3 wege, 2 vegan)
☑ Łosoś — 93 porcje
☑ Tiramisu — 95 porcji
☑ Tort weselny — dostarczony 14:30
```

**Checklista serwis:**
```
☑ Stół 1: Nowak, Kowalski, Wiśniewscy... (10 os.)
☑ Stół 2: ... (10 os.)
⚠ Stół 5: 1 alergia (orzechy) — Anna K.
...
```

**Checklista manager:**
```
15:00 ✓ Przyjazd gości
16:00 ✓ Ceremonia
17:00 ✓ Koktajl (obsługa baru potwierdzona)
...
```

**Eksport PDF:**
- Lista gości (kuchnia)
- Plan stołów (serwis)
- Harmonogram (manager)
- Wizualny plan sali (koordynator)

---

## FAZA 9: PO WESELU

1. Ania oznacza ostatnią ratę jako opłaconą
2. Kaucja: zmienia status na "Zwrócona"
3. Rezerwacja → COMPLETED
4. Raporty aktualizują się automatycznie
5. Ania widzi, że Premium to 70% rezerwacji → podnosi cenę do 260 zł

---

## PEŁNY FLOW — DIAGRAM

```
                            ┌──────────────────────────────┐
                            │     SALA (VENUE MANAGER)      │
                            │                              │
    ┌───────────────────────┤ 1. Onboarding                 │
    │                       │ 2. Konfiguracja:              │
    │                       │    - Sale, pakiety, dania     │
    │                       │    - Stoły, szablony umów     │
    │                       │ 3. Dashboard + Kalendarz      │
    │                       │ 4. Tworzy rezerwację          │
    │                       │    └→ wysyła link do pary     │
    │                       │                              │
    │                       └────────────┬─────────────────┘
    │                                    │
    │                    link z tokenem  │
    │                                    ▼
    │                       ┌──────────────────────────────┐
    │                       │     PARA (WEDDING CLIENT)     │
    │                       │                              │
    │                       │ 5. Aktywacja portalu          │
    │                       │ 6. Goście (ręcznie + CSV)     │
    │                       │ 7. Menu (wybory z pakietu)    │
    │                       │ 8. Usadzenie (stoły)          │
    │                       │ 9. Harmonogram (szablon)      │
    │                       │ 10. Czat z salą               │
    │                       │                              │
    │                       └────────────┬─────────────────┘
    │                                    │
    │                                    ▼
    │                       ┌──────────────────────────────┐
    │                       │     SALA (DALSZE KROKI)       │
    │                       │                              │
    │                       │ 11. Edytuje dane (goście,     │
    │                       │     menu, usadzenie,          │
    │                       │     harmonogram)              │
    │                       │ 12. Plan sali (canvas)        │
    │                       │ 13. Tworzy ofertę             │
    │                       │ 14. Generuje umowę             │
    │                       │     └→ podpis uproszczony     │
    │                       │ 15. Harmonogram płatności     │
    │                       │ 16. Dashboard finansowy       │
    │                       └────────────┬─────────────────┘
    │                                    │
    │                                    ▼
    │                       ┌──────────────────────────────┐
    │                       │      DZIEŃ WESELA             │
    │                       │                              │
    │                       │ 17. Checklisty                │
    │                       │     - Kuchnia                 │
    │                       │     - Serwis                  │
    │                       │     - Manager                 │
    │                       │ 18. PDF export dla obsługi    │
    │                       │                              │
    │                       └────────────┬─────────────────┘
    │                                    │
    │                                    ▼
    │                       ┌──────────────────────────────┐
    │                       │       PO WESELU               │
    │                       │                              │
    │                       │ 19. Rozliczenie finansowe     │
    │                       │ 20. Zamknięcie rezerwacji     │
    │                       │ 21. Raporty i statystyki      │
    │                       │                              │
    │                       └──────────────────────────────┘
```

---

## KLUCZOWE FUNKCJONALNOŚCI

### Panel sali (venue)
- Dashboard z KPI, finansami, raportami
- Kalendarz z blokadami godzinowymi/cyklicznymi + iCal export
- Pełna edycja danych rezerwacji (goście, menu, usadzenie, harmonogram)
- Wizualny plan sali (canvas z drag & drop)
- System umów (DOCX → PDF + podpis uproszczony SMS)
- Harmonogram płatności (zadatki, raty, kaucje)
- Czat z parą (obie strony)

### Portal pary (wedding-client)
- 5 modułów: goście, menu, usadzenie, harmonogram, czat
- CSV import gości
- Wybór menu z pakietów (grupy wyboru, min/max)
- Przypisywanie do stołów z kontrolą pojemności
- Szablon harmonogramu dnia wesela
- Czat z salą
- Premium: synchronizacja z plannerem WeddingBoard

---

**WeddingBoard — sala + para = jeden system**
