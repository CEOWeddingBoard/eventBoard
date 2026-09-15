import { Check } from "lucide-react";

/**
 * Problemy obiektu i to, co dostaje w zamian.
 *
 * Wcześniej była to lista „najczęstszych pytań”. Pytanie jest słabą formą
 * sprzedaży: zakłada, że ktoś już chce kupić i tylko wyjaśnia wątpliwości.
 * Ta sama treść ustawiona jako problem — zdanie, które właściciel sali
 * naprawdę wypowiada — mówi mu, że rozumiemy jego robotę, i dopiero potem
 * pokazuje, co z tym robimy.
 *
 * Prawa kolumna opisuje stan faktyczny produktu. Jeśli któraś przestanie
 * być prawdziwa, to jest obietnica bez pokrycia, a nie drobiazg
 * marketingowy — sprawdzaj przy większych zmianach.
 */

const problemy = [
  {
    problem: "„Zapytanie przyszło mailem w sobotę i zginęło. Dowiedziałem się, jak klient zarezerwował gdzie indziej.”",
    rozwiazanie:
      "Zapytania z Twojej wizytówki trafiają prosto do panelu — z datą, liczbą gości i treścią. Widzisz, które są nowe, a które czekają na odpowiedź. Nie giną w skrzynce.",
  },
  {
    problem: "„Kupiliśmy już system, którego nikt nie skonfigurował. Stoi pusty do dziś.”",
    rozwiazanie:
      "Nie konfigurujesz niczego sam. Proces obsługi ustawiamy razem z Tobą, na Twoich przyjęciach — zwykle jedno spotkanie i kilka dni. Konto dostajesz gotowe do pracy, z procesem, rolami i menu.",
  },
  {
    problem: "„Nie przeszkolę kucharza i kelnerów z kolejnej aplikacji.”",
    rozwiazanie:
      "Nie ma czego się uczyć poza własną robotą. Każdy widzi tylko swoje kroki — kucharz kuchenne, kelner swoje, manager całość. Krok mówi wprost, kto go wypełnia i kto zatwierdza.",
  },
  {
    problem: "„Klient nie założy konta i nie wypełni żadnego formularza. Zadzwoni.”",
    rozwiazanie:
      "I nie musi zakładać. Dostaje od Ciebie link i uzupełnia ustalenia z telefonu — bez hasła, bez instalowania aplikacji. Link ma termin ważności i możesz go unieważnić w każdej chwili.",
  },
  {
    problem: "„Mamy terminy w kalendarzach Google i menu w Wordzie. Nie będziemy tego przepisywać.”",
    rozwiazanie:
      "I nie przepisujecie. Terminy z kalendarzy Google widać na grafiku po podłączeniu konta, a menu wkleja się z oferty jako tekst — system sam rozpoznaje sekcje i dania według reguł, które raz ustawiamy.",
  },
  {
    problem: "„Wesele i bankiet firmowy to zupełnie inna obsługa. Jeden sztywny proces nam nie pasuje.”",
    rozwiazanie:
      "Każdy rodzaj przyjęcia może mieć własne kroki, role i akceptacje. Proces ustawiasz raz dla danego rodzaju, a potem tylko go używasz — wesele swoje, komunia swoje, bankiet firmowy swoje.",
  },
  {
    problem: "„Obsługa na sali nie siedzi przy komputerze, a kuchnia chce kartkę.”",
    rozwiazanie:
      "Obsługa pracuje na telefonie, a agendę eventu pobierasz jako jeden dokument do druku — z osobnymi sekcjami uwag dla kuchni i dla obsługi, z logo i danymi obiektu.",
  },
  {
    problem: "„Nie wiem, ile klient jeszcze dopłacił i komu mam przypomnieć o zaliczce.”",
    rozwiazanie:
      "Zaliczki, raty i dopłatę końcową odnotowujesz przy evencie. Widzisz, ile wpłynęło i ile zostało, a system sam przypomina o terminach zaliczek — przed i po dacie płatności.",
  },
  {
    problem: "„A jeśli za rok stwierdzę, że to nie dla nas? Dane zostaną u was.”",
    rozwiazanie:
      "Nie zostaną. Komplet danych — przyjęcia, menu, agendy, procesy, zapytania — pobierzesz jako jeden plik, w każdej chwili. Bez rozmów o tym, czy się da, i bez opłat za wyjście.",
  },
];

export function LandingProblemy() {
  return (
    <section id="problemy" className="bg-[#f6f7f9] py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a22]">
            Co rozwiązujemy
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Dziewięć rzeczy, które słyszymy od właścicieli sal
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Po lewej zdania, które padają na pierwszym spotkaniu. Po prawej to,
            co dostajesz w zamian — bez obietnic na wyrost.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {problemy.map((p) => (
            <div
              key={p.problem}
              className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-[1fr_1.25fr] sm:gap-8"
            >
              <p className="border-l-2 border-slate-300 pl-4 text-[15px] italic leading-relaxed text-slate-500">
                {p.problem}
              </p>
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                  <Check className="h-3 w-3 text-emerald-600" />
                </span>
                <p className="text-sm leading-relaxed text-slate-700">{p.rozwiazanie}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Masz problem, którego tu nie ma?{" "}
          <a
            href="#kontakt"
            className="font-semibold text-[#8a6a22] underline-offset-4 hover:underline"
          >
            Napisz — powiemy wprost, czy to rozwiązujemy
          </a>
          .
        </p>
      </div>
    </section>
  );
}
