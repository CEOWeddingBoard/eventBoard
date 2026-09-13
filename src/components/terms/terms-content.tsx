import { SERVICE_NAME } from "@/lib/brand";

export const TERMS_TITLE = `Regulamin serwisu ${SERVICE_NAME}`;

export function TermsContent() {
  return (
    <div className="prose prose-olive max-w-none text-ink text-sm leading-relaxed">
      <h2 className="font-serif text-lg font-medium text-ink mb-3">§1 Postanowienia ogólne</h2>
      <p className="mb-3">
        Niniejszy Regulamin określa zasady korzystania z serwisu {SERVICE_NAME} (&bdquo;Serwis&rdquo;),
        udostępnianego przez Koda Labs Prosta Spółka Akcyjna (&bdquo;Operator&rdquo;). Korzystanie z Serwisu
        oznacza akceptację niniejszego Regulaminu.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§2 Rejestracja i logowanie</h2>
      <p className="mb-3">
        1. Korzystanie z pełnej funkcjonalności Serwisu wymaga założenia konta i logowania przy użyciu
        zewnętrznego dostawcy uwierzytelniania (np. Clerk).
      </p>
      <p className="mb-3">
        2. Rejestrując się i logując do Serwisu, użytkownik potwierdza, że zapoznał się z Regulaminem
        i Polityką Prywatności oraz je akceptuje.
      </p>
      <p className="mb-3">
        3. Dane uwierzytelniające są przetwarzane zgodnie z polityką prywatności właściwego
        dostawcy logowania oraz z obowiązującymi przepisami prawa, w szczególności RODO.
      </p>
      <p className="mb-3">
        4. Współmałżonek lub partner planowania może korzystać z Serwisu na podstawie linku
        i kodu PIN udostępnionych przez właściciela konta (bez zakładania osobnego konta),
        po uprzedniej akceptacji niniejszego Regulaminu.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§3 Zasady użytkowania</h2>
      <p className="mb-3">
        1. Użytkownik zobowiązuje się do korzystania z Serwisu w sposób zgodny z prawem, postanowieniami
        Regulaminu oraz dobrymi obyczajami, w szczególności z poszanowaniem praw osób trzecich.
      </p>
      <p className="mb-3">
        2. Zabronione jest w szczególności:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>udostępnianie danych dostępowych do konta osobom nieuprawnionym,</li>
        <li>wprowadzanie do Serwisu treści bezprawnych (np. naruszających dobra osobiste, prawa autorskie),</li>
        <li>podejmowanie działań zmierzających do zakłócenia pracy Serwisu lub obejścia zabezpieczeń.</li>
      </ul>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§4 Zakres i charakter usług</h2>
      <p className="mb-3">
        1. Serwis jest narzędziem on‑line wspierającym planowanie i organizację wesela. Umożliwia m.in.
        zarządzanie listą gości, budżetem, zadaniami, planem dnia, miejscami przy stołach, komunikacją
        z gośćmi oraz usługodawcami, a także korzystanie z funkcjonalności opartych o sztuczną
        inteligencję.
      </p>
      <p className="mb-3">
        2. Funkcje oparte o sztuczną inteligencję mają charakter pomocniczy i doradczy. Rekomendacje
        generowane automatycznie nie zastępują samodzielnych decyzji użytkownika.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§5 Dane osobowe</h2>
      <p className="mb-3">
        1. Dane osobowe użytkowników oraz danych wprowadzanych do Serwisu (w szczególności dane gości
        oraz usługodawców) są przetwarzane przez Operatora jako administratora danych, zgodnie z
        obowiązującymi przepisami prawa oraz Polityką Prywatności.
      </p>
      <p className="mb-3">
        2. Użytkownik, dodając dane osób trzecich (np. gości, usługodawców), oświadcza, że posiada
        podstawę do ich przekazania Operatorowi i przetwarzania w Serwisie (np. zgodę lub inny tytuł
        prawny).
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§6 Odpowiedzialność</h2>
      <p className="mb-3">
        1. Operator dokłada należytej staranności, aby Serwis działał w sposób ciągły i bezawaryjny,
        jednak nie gwarantuje nieprzerwanej dostępności wszystkich funkcjonalności.
      </p>
      <p className="mb-3">
        2. Operator nie ponosi odpowiedzialności za:
      </p>
      <ul className="list-disc list-inside mb-3">
        <li>skutki decyzji podjętych przez użytkownika na podstawie danych lub rekomendacji z Serwisu,</li>
        <li>treści i dane wprowadzone do Serwisu przez użytkowników,</li>
        <li>niewłaściwe korzystanie z Serwisu lub udostępnienie dostępu do konta osobom trzecim.</li>
      </ul>
      <p className="mb-3">
        3. Odpowiedzialność Operatora z tytułu niewykonania lub nienależytego wykonania umowy
        ograniczona jest – w najszerszym dopuszczalnym przez prawo zakresie – do rzeczywiście
        poniesionej szkody i nie obejmuje utraconych korzyści.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§7 Płatności i rozliczenia</h2>
      <p className="mb-3">
        1. Serwis może być dostępny w modelu subskrypcyjnym lub innym modelu płatności określonym
        w cenniku lub ofercie prezentowanej w Serwisie.
      </p>
      <p className="mb-3">
        2. Szczegółowe warunki płatności, okresów rozliczeniowych, promocji i wypowiedzenia umowy
        mogą być określone w odrębnych warunkach oferty lub w regulaminie płatności.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§8 Wypowiedzenie umowy</h2>
      <p className="mb-3">
        1. Użytkownik może w każdej chwili zakończyć korzystanie z Serwisu poprzez usunięcie konta
        lub zaprzestanie korzystania z usług, z zastrzeżeniem warunków wypowiedzenia wynikających
        z wybranego planu płatności.
      </p>
      <p className="mb-3">
        2. Operator może rozwiązać umowę ze skutkiem natychmiastowym, jeśli użytkownik rażąco
        narusza postanowienia Regulaminu lub wykorzystuje Serwis w sposób sprzeczny z jego
        przeznaczeniem.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§9 Reklamacje</h2>
      <p className="mb-3">
        1. Użytkownik ma prawo złożyć reklamację dotyczącą działania Serwisu lub jakości usług.
      </p>
      <p className="mb-3">
        2. Reklamacje można składać drogą elektroniczną na adres e‑mail wskazany w Serwisie lub za
        pośrednictwem formularza kontaktowego. W zgłoszeniu należy opisać przedmiot reklamacji oraz
        dane kontaktowe użytkownika.
      </p>
      <p className="mb-3">
        3. Operator dołoży starań, aby rozpatrzyć reklamację w rozsądnym terminie i poinformować
        użytkownika o wyniku postępowania reklamacyjnego.
      </p>

      <h2 className="font-serif text-lg font-medium text-ink mb-3 mt-6">§10 Postanowienia końcowe</h2>
      <p className="mb-3">
        1. Operator zastrzega sobie prawo do zmiany Regulaminu w przypadku zmiany przepisów prawa,
        technologii wykorzystywanej w Serwisie lub zakresu świadczonych usług. O istotnych zmianach
        użytkownicy zostaną poinformowani w Serwisie lub e‑mailem.
      </p>
      <p className="mb-3">
        2. Do spraw nieuregulowanych w Regulaminie zastosowanie mają odpowiednie przepisy prawa
        polskiego.
      </p>
      <p className="mb-3">
        3. Niniejszy Regulamin stanowi wzorzec umowny w rozumieniu przepisów Kodeksu cywilnego.
      </p>
    </div>
  );
}
