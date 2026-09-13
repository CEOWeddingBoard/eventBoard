/**
 * Dokumenty prawne SaaS + wersjonowanie akceptacji.
 *
 * Treści to kompletny wzorzec dla tego typu usługi (SaaS B2B, dane osobowe
 * gości). Zaleca się końcową weryfikację przez radcę prawnego przed produkcyjnym
 * uruchomieniem. Po każdej zmianie treści podbij TERMS_VERSION — wszyscy
 * użytkownicy zostaną poproszeni o ponowną akceptację.
 */

export const TERMS_VERSION = "2026-09-13.1";

// Dane usługodawcy — podmień na aktualne dane rejestrowe (KRS/NIP/adres).
export const PROVIDER = {
  name: "Koda Labs PSA",
  email: "kontakt@kodalabs.pl",
  phone: "666 328 996",
  // Uzupełnij przed publikacją:
  address: "[adres siedziby]",
  nip: "[NIP]",
  krs: "[KRS]",
};

export type LegalDoc = { slug: string; title: string; requiresAccept: boolean; body: string };

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "regulamin",
    title: "Regulamin świadczenia usługi EventBoard",
    requiresAccept: true,
    body: `Data wejścia w życie: ${TERMS_VERSION}

§1. Definicje
1. Usługodawca — ${PROVIDER.name}, e-mail: ${PROVIDER.email}, tel. ${PROVIDER.phone}, adres: ${PROVIDER.address}, NIP: ${PROVIDER.nip}, KRS: ${PROVIDER.krs}.
2. Usługa / EventBoard — internetowa aplikacja (SaaS) do zarządzania obsługą wydarzeń: kalendarz, wydarzenia, procesy obsługi, menu, agenda, zespół, konta i uprawnienia, udostępniana w modelu dostępu przez przeglądarkę.
3. Klient — przedsiębiorca (sala, restauracja, obiekt eventowy), na rzecz którego świadczona jest Usługa w ramach dedykowanej Przestrzeni.
4. Przestrzeń — wydzielone środowisko pracy Klienta wraz z danymi i kontami użytkowników.
5. Użytkownik — osoba fizyczna korzystająca z Usługi w ramach konta założonego w Przestrzeni Klienta (właściciel, administrator obiektu, pracownik).
6. Administrator platformy — Usługodawca (konto serwisowe) zakładający i konfigurujący Przestrzenie.

§2. Zakres i zasady świadczenia Usługi
1. Usługa świadczona jest drogą elektroniczną, przez całą dobę, z zastrzeżeniem przerw technicznych i serwisowych.
2. Do korzystania z Usługi niezbędne są: urządzenie z dostępem do Internetu, aktualna przeglądarka i aktywne konto.
3. Konta w Przestrzeni zakłada i zarządza nimi Administrator platformy oraz administrator obiektu wyznaczony przez Klienta. Publiczna samodzielna rejestracja jest wyłączona.
4. Uprawnienia poszczególnych Użytkowników do modułów (brak / podgląd / edycja) ustala administrator obiektu.

§3. Konta i bezpieczeństwo
1. Użytkownik zobowiązany jest chronić dane logowania i nie udostępniać ich osobom trzecim.
2. Usługodawca udostępnia mechanizm resetu hasła. Klient odpowiada za działania Użytkowników w ramach swojej Przestrzeni.
3. Usługodawca może zablokować konto naruszające Regulamin lub przepisy prawa, informując Klienta.

§4. Płatności
1. Usługa świadczona jest odpłatnie, według planu subskrypcji uzgodnionego z Klientem (miesięcznie lub rocznie).
2. Szczegóły ceny, zakresu i limitów (liczba sal, kont) określa oferta/umowa z Klientem.
3. Brak płatności w terminie może skutkować zawieszeniem dostępu do Przestrzeni po uprzednim powiadomieniu.

§5. Prawa i obowiązki Klienta
1. Klient zobowiązuje się korzystać z Usługi zgodnie z prawem i Regulaminem oraz wprowadzać wyłącznie dane, do których przetwarzania jest uprawniony.
2. Klient jest administratorem danych osobowych gości i pracowników wprowadzanych do Usługi; zasady powierzenia przetwarzania określa odrębna Umowa powierzenia (RODO).
3. Zakazane jest dostarczanie treści bezprawnych oraz działania zakłócające funkcjonowanie Usługi.

§6. Odpowiedzialność
1. Usługodawca dokłada należytej staranności w zapewnieniu ciągłości i bezpieczeństwa Usługi.
2. Usługodawca nie odpowiada za szkody wynikłe z przyczyn niezależnych (siła wyższa, awarie dostawców infrastruktury, działania Użytkowników).
3. Odpowiedzialność Usługodawcy wobec Klienta z tytułu Usługi ogranicza się do wysokości opłat wniesionych przez Klienta w okresie 3 miesięcy poprzedzających zdarzenie, w zakresie dopuszczalnym prawem.

§7. Dostępność, kopie i dane
1. Usługodawca wykonuje kopie zapasowe środowiska produkcyjnego.
2. Na żądanie Klienta i w rozsądnym zakresie Usługodawca umożliwia eksport danych Klienta.
3. Po zakończeniu współpracy dane Klienta są usuwane lub anonimizowane w terminie uzgodnionym, z zastrzeżeniem obowiązków prawnych.

§8. Reklamacje
1. Reklamacje należy zgłaszać na adres ${PROVIDER.email}.
2. Usługodawca rozpatruje reklamację w terminie 14 dni.

§9. Zmiany Regulaminu
1. Usługodawca może zmienić Regulamin z ważnych przyczyn (zmiana prawa, zakresu Usługi, względy bezpieczeństwa).
2. O zmianie Klient jest informowany; dalsze korzystanie z Usługi po wejściu zmian w życie oznacza ich akceptację.

§10. Postanowienia końcowe
1. W sprawach nieuregulowanych stosuje się prawo polskie.
2. Ewentualne spory rozstrzyga sąd właściwy dla siedziby Usługodawcy, o ile przepisy bezwzględnie obowiązujące nie stanowią inaczej.`,
  },
  {
    slug: "prywatnosc",
    title: "Polityka prywatności",
    requiresAccept: false,
    body: `Data wejścia w życie: ${TERMS_VERSION}

1. Administrator danych
Administratorem danych Użytkowników Usługi (konta) jest ${PROVIDER.name}, e-mail: ${PROVIDER.email}, adres: ${PROVIDER.address}, NIP: ${PROVIDER.nip}.
W odniesieniu do danych gości i pracowników wprowadzanych do Przestrzeni administratorem jest Klient (obiekt), a Usługodawca występuje jako podmiot przetwarzający — na podstawie Umowy powierzenia (RODO).

2. Zakres i cele przetwarzania (konta Użytkowników)
- dane konta (imię, e-mail, rola, hasło w postaci skrótu) — w celu świadczenia Usługi i uwierzytelniania, art. 6 ust. 1 lit. b i f RODO;
- dane techniczne (logi, adres IP) — w celu zapewnienia bezpieczeństwa i diagnostyki, art. 6 ust. 1 lit. f RODO;
- dane rozliczeniowe — w celu realizacji umowy i obowiązków podatkowych, art. 6 ust. 1 lit. b i c RODO.

3. Odbiorcy danych
Dostawcy infrastruktury i usług niezbędnych do działania (hosting, wysyłka e-mail i SMS), działający na podstawie umów powierzenia. Dane nie są sprzedawane.

4. Okres przechowywania
Przez czas trwania umowy oraz okresy wymagane prawem (m.in. podatkowe). Logi techniczne — przez okres niezbędny dla bezpieczeństwa.

5. Prawa osób
Prawo dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia, sprzeciwu oraz skargi do Prezesa UODO. Kontakt: ${PROVIDER.email}.

6. Przekazywanie poza EOG
Co do zasady dane przetwarzane są w EOG. Ewentualne transfery odbywają się na podstawie zabezpieczeń zgodnych z RODO.

7. Pliki cookies
Aplikacja używa plików niezbędnych do działania (sesja, bezpieczeństwo). Nie stosujemy śledzenia marketingowego bez zgody.

8. Kontakt
We wszystkich sprawach dotyczących danych: ${PROVIDER.email}.`,
  },
  {
    slug: "rodo",
    title: "Umowa powierzenia przetwarzania danych osobowych (RODO)",
    requiresAccept: true,
    body: `Data wejścia w życie: ${TERMS_VERSION}

Niniejsza Umowa powierzenia („Umowa") zawierana jest pomiędzy Klientem („Administrator") a ${PROVIDER.name} („Podmiot przetwarzający") i stanowi integralną część Regulaminu. Akceptacja Regulaminu oznacza zawarcie niniejszej Umowy.

§1. Przedmiot i cel
1. Administrator powierza Podmiotowi przetwarzającemu przetwarzanie danych osobowych w zakresie niezbędnym do świadczenia Usługi EventBoard.
2. Cel przetwarzania: obsługa wydarzeń Administratora w aplikacji (procesy, menu, agenda, harmonogram, komunikacja).

§2. Zakres i kategorie danych
1. Kategorie osób: goście wydarzeń, osoby kontaktowe klientów Administratora, pracownicy Administratora.
2. Kategorie danych: dane identyfikacyjne i kontaktowe (imię, nazwisko, telefon, e-mail), dane dotyczące uczestnictwa i preferencji (menu, liczba osób), a także — jeżeli Administrator je wprowadzi — dane szczególnej kategorii, w szczególności informacje o alergiach i dietach (art. 9 RODO).
3. Administrator zobowiązuje się wprowadzać dane szczególnej kategorii wyłącznie w zakresie niezbędnym i posiadając odpowiednią podstawę prawną.

§3. Obowiązki Podmiotu przetwarzającego
1. Przetwarza dane wyłącznie na udokumentowane polecenie Administratora (w tym korzystanie z funkcji Usługi).
2. Zapewnia, by osoby upoważnione do przetwarzania zachowały poufność.
3. Stosuje środki techniczne i organizacyjne zapewniające bezpieczeństwo odpowiednie do ryzyka (m.in. szyfrowanie transmisji, kontrola dostępu i uprawnień, kopie zapasowe, hasła w postaci skrótu).
4. Pomaga Administratorowi w realizacji praw osób oraz w wywiązaniu się z obowiązków z art. 32–36 RODO, w rozsądnym zakresie.
5. Zgłasza Administratorowi naruszenie ochrony danych bez zbędnej zwłoki po jego stwierdzeniu.
6. Po zakończeniu świadczenia usług usuwa lub zwraca dane oraz usuwa istniejące kopie, o ile prawo nie nakazuje ich przechowywania.
7. Udostępnia Administratorowi informacje niezbędne do wykazania zgodności oraz umożliwia audyty w uzgodnionym trybie.

§4. Podpowierzenie
1. Administrator wyraża ogólną zgodę na korzystanie z dalszych podmiotów przetwarzających (dostawcy hostingu, poczty e-mail, bramki SMS), niezbędnych do działania Usługi.
2. Podmiot przetwarzający zapewnia, że dalsze podmioty podlegają obowiązkom nie mniej rygorystycznym niż niniejsza Umowa, i informuje o istotnych zmianach, umożliwiając sprzeciw.

§5. Czas trwania i odpowiedzialność
1. Umowa obowiązuje przez okres świadczenia Usługi.
2. Każda ze stron odpowiada za szkody spowodowane naruszeniem RODO na zasadach określonych w art. 82 RODO.

§6. Postanowienia końcowe
1. W sprawach nieuregulowanych stosuje się RODO oraz prawo polskie.
2. Kontakt w sprawach ochrony danych: ${PROVIDER.email}.`,
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}

export const ACCEPT_DOCS = LEGAL_DOCS.filter((d) => d.requiresAccept);
