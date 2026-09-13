import { SERVICE_NAME } from "@/lib/brand";

export const PRIVACY_POLICY_TITLE = `Polityka Prywatności serwisu ${SERVICE_NAME}`;

export function PrivacyPolicyContent() {
  return (
    <div className="prose prose-olive max-w-none text-ink text-sm leading-relaxed">
      <h2 className="font-serif text-lg font-medium text-ink mb-3">1. Postanowienia ogólne</h2>
      <p className="mb-3">
        Niniejsza Polityka Prywatności określa zasady przetwarzania danych osobowych użytkowników
        serwisu {SERVICE_NAME} (&bdquo;Serwis&rdquo;) oraz osób, których dane są wprowadzane do
        Serwisu (m.in. gości weselnych, usługodawców). Dokument został przygotowany z uwzględnieniem
        wymogów Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016
        r. (&bdquo;RODO&rdquo;), ale przed wdrożeniem powinien zostać zweryfikowany przez prawnika.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        2. Administrator danych i dane kontaktowe
      </h2>
      <p className="mb-3">
        Administratorem danych osobowych jest{" "}
        <span className="font-medium">
          Koda Labs Prosta Spółka Akcyjna, NIP 6252503614, KRS 0001208186
        </span>
        , prowadząca Serwis {SERVICE_NAME} (&bdquo;Administrator&rdquo;).
      </p>
      <p className="mb-3">
        Z Administratorem można skontaktować się w sprawach dotyczących ochrony danych osobowych,
        w szczególności w celu realizacji praw wynikających z RODO, poprzez:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>adres e-mail wskazany w Serwisie w zakładce &bdquo;Kontakt&rdquo;,</li>
        <li>formularz kontaktowy dostępny w Serwisie.</li>
      </ul>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        3. Zakres przetwarzanych danych
      </h2>
      <p className="mb-3">
        W zależności od sposobu korzystania z Serwisu Administrator może przetwarzać następujące
        kategorie danych:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>
          <span className="font-medium">Dane konta użytkownika:</span> imię, nazwisko, adres e-mail,
          identyfikator nadany przez dostawcę logowania (np. Clerk), zdjęcie profilowe (jeśli
          udostępnione), dane rozliczeniowe w przypadku planów płatnych.
        </li>
        <li>
          <span className="font-medium">Dane dotyczące wydarzenia:</span> nazwa i data wydarzenia,
          miejsce, opis, preferencje pary młodej, konfiguracje budżetu, listy zadań i inne dane
          wprowadzone w ramach planowania wesela.
        </li>
        <li>
          <span className="font-medium">Dane gości weselnych:</span> imię, nazwisko, dane kontaktowe
          (adres e-mail, numer telefonu), status RSVP, preferencje żywieniowe, informacje o alergiach,
          potrzebie noclegu i transportu, przypisanie do stolika, inne informacje dobrowolnie
          wprowadzone przez użytkownika w ramach organizacji wesela.
        </li>
        <li>
          <span className="font-medium">Dane usługodawców:</span> nazwa firmy lub imię i nazwisko,
          kategoria usług, dane kontaktowe, linki do strony internetowej i profili społecznościowych,
          przykładowe realizacje (zdjęcia, opisy).
        </li>
        <li>
          <span className="font-medium">Dane techniczne i eksploatacyjne:</span> adres IP, dane
          urządzenia, informacje o przeglądarce, logi serwera, informacje o aktywności w Serwisie
          (np. data logowania, użyte funkcjonalności), dane zbierane za pomocą plików cookies i
          podobnych technologii.
        </li>
      </ul>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        4. Cele i podstawy prawne przetwarzania danych
      </h2>
      <p className="mb-3">Dane osobowe są przetwarzane w szczególności w następujących celach:</p>
      <ul className="list-disc list-inside mb-3">
        <li>
          <span className="font-medium">Założenie i obsługa konta w Serwisie</span> – na podstawie
          art. 6 ust. 1 lit. b RODO (niezbędność do wykonania umowy).
        </li>
        <li>
          <span className="font-medium">
            Umożliwienie korzystania z funkcjonalności Serwisu (planowanie wesela)
          </span>{" "}
          – w tym zarządzanie budżetem, zadaniami, listą gości, miejscami przy stołach, komunikacją
          z gośćmi oraz usługodawcami – na podstawie art. 6 ust. 1 lit. b RODO.
        </li>
        <li>
          <span className="font-medium">Obsługa płatności i rozliczeń</span> – na podstawie art. 6
          ust. 1 lit. b i c RODO (niezbędność do wykonania umowy i wypełnienie obowiązków
          prawnych dotyczących rozliczeń).
        </li>
        <li>
          <span className="font-medium">
            Wysyłka komunikacji e-mail/SMS związanej z organizacją wesela
          </span>{" "}
          (np. przypomnienia RSVP, podziękowania, informacje organizacyjne) – na podstawie art. 6
          ust. 1 lit. b RODO, a w zakresie marketingu własnych usług także art. 6 ust. 1 lit. f
          RODO (prawnie uzasadniony interes Administratora).
        </li>
        <li>
          <span className="font-medium">Zapewnienie bezpieczeństwa Serwisu</span> (monitorowanie
          nadużyć, ochrona przed atakami, logi techniczne) – na podstawie art. 6 ust. 1 lit. f
          RODO.
        </li>
        <li>
          <span className="font-medium">Analiza działania Serwisu i rozwój funkcjonalności</span> –
          na podstawie art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes Administratora,
          polegający na prowadzeniu statystyk i ulepszaniu usług).
        </li>
        <li>
          <span className="font-medium">Realizacja obowiązków prawnych</span> (np. podatkowych,
          rachunkowych, dotyczących rozpatrywania reklamacji) – na podstawie art. 6 ust. 1 lit. c
          RODO.
        </li>
      </ul>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        5. Źródła danych i dane osób trzecich
      </h2>
      <p className="mb-3">
        Dane osobowe przetwarzane w Serwisie pochodzą przede wszystkim bezpośrednio od użytkownika
        (np. podczas zakładania konta i konfiguracji wydarzenia). W przypadku danych gości i
        usługodawców, użytkownik wprowadzający dane zobowiązuje się posiadać odpowiednią podstawę
        do ich przekazania Administratorowi (np. zgodę lub inny tytuł prawny).
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        6. Odbiorcy danych i przekazywanie danych
      </h2>
      <p className="mb-3">
        Dane mogą być przekazywane podmiotom współpracującym z Administratorem przy świadczeniu
        usług związanych z funkcjonowaniem Serwisu, w szczególności:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>dostawcom hostingu i infrastruktury chmurowej,</li>
        <li>dostawcom narzędzi do wysyłki wiadomości e-mail i SMS,</li>
        <li>dostawcom narzędzi analitycznych i systemów do monitorowania działania aplikacji,</li>
        <li>podmiotom świadczącym usługi księgowe, prawne i doradcze.</li>
      </ul>
      <p className="mb-3">
        Administrator zawiera z ww. podmiotami umowy powierzenia przetwarzania danych osobowych, w
        których zobowiązuje je do stosowania odpowiednich środków bezpieczeństwa. Dane mogą być
        przekazywane poza Europejski Obszar Gospodarczy wyłącznie w przypadku zapewnienia poziomu
        ochrony wymaganego przez RODO (np. na podstawie standardowych klauzul umownych).
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        7. Okres przechowywania danych
      </h2>
      <p className="mb-3">
        Dane osobowe będą przechowywane przez okres niezbędny do realizacji celów, dla których
        zostały zebrane, w szczególności:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>
          dane konta użytkownika – przez czas trwania umowy o korzystanie z Serwisu, a następnie
          przez okres wynikający z przepisów o przedawnieniu roszczeń,
        </li>
        <li>
          dane gości i usługodawców – przez czas realizacji wydarzenia i korzystania z Serwisu,
          chyba że użytkownik wcześniej usunie dane z systemu,
        </li>
        <li>
          dane rozliczeniowe – przez okres wymagany przez przepisy prawa podatkowego i
          rachunkowości,
        </li>
        <li>
          dane przetwarzane na podstawie zgody – do czasu jej cofnięcia.
        </li>
      </ul>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        8. Prawa osób, których dane dotyczą
      </h2>
      <p className="mb-3">
        Osobom, których dane są przetwarzane, przysługują prawa określone w RODO, w szczególności:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>prawo dostępu do danych,</li>
        <li>prawo do sprostowania (poprawiania) danych,</li>
        <li>prawo do usunięcia danych (&bdquo;prawo do bycia zapomnianym&rdquo;),</li>
        <li>prawo do ograniczenia przetwarzania,</li>
        <li>prawo do przenoszenia danych,</li>
        <li>prawo do wniesienia sprzeciwu wobec przetwarzania danych,</li>
        <li>
          prawo do cofnięcia zgody w dowolnym momencie – w zakresie, w jakim przetwarzanie odbywa
          się na podstawie zgody.
        </li>
      </ul>
      <p className="mb-3">
        Osobie, której dane dotyczą, przysługuje również prawo wniesienia skargi do Prezesa Urzędu
        Ochrony Danych Osobowych, jeśli uzna, że przetwarzanie danych narusza przepisy RODO.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">9. Pliki cookies</h2>
      <p className="mb-3">
        Serwis może wykorzystywać pliki cookies lub podobne technologie w celu zapewnienia
        prawidłowego działania, dostosowania treści do preferencji użytkownika, prowadzenia statystyk
        i poprawy jakości usług. Użytkownik może zarządzać ustawieniami cookies za pomocą ustawień
        przeglądarki. Ograniczenie stosowania cookies może wpłynąć na niektóre funkcjonalności
        Serwisu.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        10. Zautomatyzowane podejmowanie decyzji i profilowanie
      </h2>
      <p className="mb-3">
        Serwis może wykorzystywać funkcjonalności oparte na sztucznej inteligencji oraz elementy
        automatyzacji (np. propozycje zadań, sugestie komunikacji z gośćmi). Co do zasady
        przetwarzanie to nie prowadzi do podejmowania wobec użytkownika decyzji wywołujących skutki
        prawne w rozumieniu art. 22 RODO, a służy jedynie ułatwieniu planowania wydarzenia.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        11. Bezpieczeństwo danych
      </h2>
      <p className="mb-3">
        Administrator stosuje odpowiednie środki techniczne i organizacyjne mające na celu ochronę
        danych osobowych przed utratą, zniszczeniem, nieuprawnionym dostępem, ujawnieniem lub
        innym naruszeniem. W szczególności wdrożono kontrolę dostępu do systemu, szyfrowanie
        transmisji (HTTPS) oraz cykliczne aktualizacje oprogramowania wykorzystywanego do
        świadczenia usług.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">
        12. Zmiany Polityki Prywatności
      </h2>
      <p className="mb-3">
        Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce
        Prywatności, w szczególności w przypadku zmiany przepisów prawa, technologii wykorzystywanej
        w Serwisie lub zakresu świadczonych usług. O istotnych zmianach użytkownicy zostaną
        poinformowani w Serwisie lub za pośrednictwem wiadomości e-mail. Dalsze korzystanie z
        Serwisu po wejściu w życie zmian oznacza ich akceptację.
      </p>
    </div>
  );
}

