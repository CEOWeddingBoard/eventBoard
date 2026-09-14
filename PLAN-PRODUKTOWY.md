# Czego brakuje, żeby pokryć obsługę eventów

Stan na: 14 września 2026 · gałąź `feature/P1`

Przegląd od strony właściciela sali: co realnie dzieje się przy prowadzeniu przyjęcia
i czego system do tego nie ma. Każda luka jest **sprawdzona w kodzie**, nie wydedukowana
z opisu funkcji.

---

## Co produkt już pokrywa

| Obszar | Stan |
|---|---|
| Kalendarz i terminy | grafik, blokady dat, rezerwacje z wielu kalendarzy Google z kolorami i mapowaniem na sale |
| Proces obsługi | konfigurowalne kroki, role „kto wypełnia / kto akceptuje", warunki, pola i kolumny |
| Agenda | składa się automatycznie z procesu, DOCX z logo i stopką obiektu |
| Klient końcowy | portal bez konta, wybór menu, formularze, tabele (goście, winietki), uwagi |
| Menu | warianty, porcje, import z wklejonego tekstu wg reguł obiektu |
| Sprzedaż | publiczny profil obiektu, zapytania ofertowe, wycena eventu |
| Pieniądze | płatności per event (zaliczki, raty), ręczne rozliczenie abonamentu |
| Zespół | konta, role własne, uprawnienia rola × moduł, reset hasła |
| Powiadomienia | e-mail i SMS o terminach i krokach czekających na akceptację |

---

## Luki — uszeregowane wpływem na obsługę

### ⛔ P0 · Brak wykrywania kolizji terminów

**Sprawdzone:** w `createEvent` i na grafiku nie ma **żadnej** kontroli, czy sala jest
już zajęta. Dwa przyjęcia na tej samej sali tego samego dnia zapisują się bez słowa
ostrzeżenia.

Dla sali to najkosztowniejszy możliwy błąd — podwójna rezerwacja oznacza odwoływanie
wesela. Blokady dat (`OrgBlockedDate`) chronią przed wpisaniem czegokolwiek w dniu
zamkniętym, ale nie przed dwoma przyjęciami w dniu otwartym.

**Do zrobienia:** ostrzeżenie przy zapisie (nie blokada — bywają dwa wesela na dwóch
salach i bankiet w ogrodzie), z podaniem, co koliduje. Uwzględnić także rezerwacje
z kalendarzy Google, bo już je mamy.

### ⛔ P0 · Umowa i podpis są martwym kodem

**Sprawdzone:** `src/lib/contracts/` zawiera `build-contract-pdf.ts`, `contract-signing.ts`,
`docx-engine.ts` i `contract-email.ts`, a modele `ContractTemplate` i `Contract` są
w bazie. **Żaden ekran tego nie używa.**

Umowa to standardowy krok sprzedaży sali, zaraz po zaakceptowanej ofercie. Dziś klient
dostaje PDF mailem spoza systemu, a obiekt nie wie z poziomu eventu, czy umowa wróciła
podpisana.

**Do zrobienia:** krok procesu „Umowa" + widok statusu na evencie. Kod generujący jest,
brakuje podpięcia i decyzji, czy podpis ma być elektroniczny, czy wystarczy odznaczenie
„umowa podpisana, skan w załączniku".

### ⛔ P0 · Nikt nie przypomina o zaliczkach

**Sprawdzone:** `EventPayment` ma `dueDate` i `status`, ale **żaden cron ich nie czyta**.
Przypomnienia dotyczą wyłącznie terminu menu i listy gości.

Niezapłacona w terminie zaliczka to najczęstszy powód strat przy przyjęciach — a system
ma komplet danych, żeby o niej przypomnieć.

**Do zrobienia:** cron sprawdzający zbliżające się i przeterminowane płatności; e-mail
do obiektu, opcjonalnie wiadomość do klienta. Infrastruktura powiadomień już działa.

### ⚠️ P1 · Brak jakichkolwiek raportów

Ekran Finanse pokazuje listę, nie pokazuje **obłożenia sal**, przychodu w czasie ani
sezonowości. To są dane, na podstawie których właściciel ustala ceny i decyduje, czy
otwierać kolejny termin.

**Do zrobienia:** obłożenie per sala i miesiąc, przychód w czasie, średnia wartość
przyjęcia, konwersja zapytań na rezerwacje. Wszystko liczalne z tego, co już jest w bazie.

### ⚠️ P1 · Personel na przyjęciu

**Sprawdzone:** `VenueStaff` i `VenueStaffShift` są w bazie i **nieużywane w UI**.

„Kto pracuje na tym weselu" to pytanie padające przy każdym przyjęciu. Dziś odpowiedź
jest w głowie managera albo w osobnym arkuszu.

**Do zrobienia:** obsada eventu — kto z zespołu pracuje, na jakiej zmianie. Naturalnie
łączy się z rolami procesu, które już mamy.

### ⚠️ P1 · Dostawcy i podwykonawcy

**Sprawdzone:** model `Vendor` istnieje i **nie jest używany** w EventBoardzie.

Sala koordynuje DJ-a, fotografa, dekoratora, cukiernię — a w agendzie dla obsługi nie ma
kto, o której i z czym przyjeżdża.

**Do zrobienia:** lista podwykonawców przypisanych do eventu z godziną wejścia, wpinana
do agendy. To jest dokładnie ten sam wzorzec, co krok tabelaryczny — da się zrobić tanio.

### ⚠️ P1 · Historia zmian

Kto zmienił menu, kto przesunął godzinę. Odłożone świadomie do czasu naprawy izolacji
danych — izolacja jest naprawiona, więc to odblokowane. Przy sporze z klientem
(„przecież ustaliliśmy inaczej") to jedyny rozstrzygający dowód.

### ◻️ P2 · Drobniejsze

- **Wyszukiwanie i filtry eventów** — przy 200 przyjęciach lista przestaje wystarczać.
- **Przyjęcia cykliczne** — wigilie firmowe, bale, komunie wracają co roku.
- **Szablony wiadomości do klienta** — dziś każdą trzeba napisać od zera.
- **Eksport listy gości do druku** — winietki i plan stołów są w tabeli, brakuje wydruku.

---

## Czego świadomie NIE polecam

- **Rozsadzanie gości przy stołach** — po raz kolejny: tygodnie pracy, funkcja
  skomodytyzowana, nie decyduje o wygraniu klienta. Krok tabelaryczny z kolumną „Stół"
  pokrywa większość potrzeby.
- **Moduł magazynowy i zamówienia do kuchni** — inna klasa produktu, inny kupujący.
- **Własna bramka płatnicza** — przy fakturach ręcznych nie zwraca się.

---

## Kolejność, którą bym przyjął

1. **Kolizje terminów** — najtańsze do zrobienia, najdroższe w skutkach, gdy zabraknie.
2. **Przypomnienia o zaliczkach** — infrastruktura gotowa, wprost przekłada się na pieniądze.
3. **Umowa** — kod jest, brakuje podpięcia; domyka ścieżkę sprzedaży.
4. **Raporty** — argument przy odnowieniu abonamentu.
5. **Obsada i podwykonawcy** — domykają agendę jako dokument operacyjny.
