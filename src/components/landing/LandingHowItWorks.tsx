import {
  MessageSquare,
  CalendarCheck,
  GitBranch,
  UtensilsCrossed,
  FileText,
  Wallet,
} from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Zapytanie trafia do systemu",
    body:
      "Klient wysyła formularz z publicznej wizytówki obiektu. Zapytanie ląduje w panelu z datą, liczbą gości i treścią wiadomości — nie w skrzynce mailowej.",
  },
  {
    icon: CalendarCheck,
    title: "Zapytanie staje się wydarzeniem",
    body:
      "Sprawdzasz termin w kalendarzu z zablokowanymi datami i zakładasz event: typ, data, liczba osób. Od tej chwili wszystko dotyczące tego przyjęcia ma jedno miejsce.",
  },
  {
    icon: GitBranch,
    title: "Proces prowadzi obsługę krok po kroku",
    body:
      "Definiujesz własną ścieżkę: oferta, wybór menu, akceptacja kuchni, zadatek. Każdy krok ma przypisaną rolę, a wybór klienta potrafi rozgałęzić proces na inną ścieżkę.",
  },
  {
    icon: UtensilsCrossed,
    title: "Klient decyduje w swoim portalu",
    body:
      "Zamiast wymiany maili klient dostaje link, w którym wybiera wariant menu i zatwierdza ustalenia. Odpowiedź od razu popycha proces dalej i powiadamia zespół.",
  },
  {
    icon: FileText,
    title: "Agenda składa się z zebranych danych",
    body:
      "Menu, harmonogram i decyzje z procesu wchodzą do dokumentu automatycznie. Nie ma etapu przepisywania ustaleń do Worda dzień przed imprezą.",
  },
  {
    icon: Wallet,
    title: "Rozliczenie w tym samym miejscu",
    body:
      "Zadatek, raty i dopłata końcowa odnotowane przy evencie sumują się w widoku finansów — widzisz, co wpłynęło, a po co trzeba zadzwonić.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="jak-to-dziala" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a22]">
            Jak to działa
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Od pierwszego pytania o termin do rozliczonej imprezy
          </h2>
          <p className="mt-4 text-base text-slate-600">
            EventBoard prowadzi jedno wydarzenie przez całą obsługę. Każdy etap zostawia
            dane, z których składa się kolejny — aż po gotową agendę na dzień imprezy.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f1e6] text-[#8a6a22]">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-sm font-semibold text-[#8a6a22]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-14 max-w-3xl rounded-xl border border-slate-200/80 bg-[#f6f7f9] p-8 text-center">
          <h3 className="text-lg font-bold text-slate-900">
            Jedna baza danych zamiast maili, arkuszy i notesu
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Kalendarz z blokadami terminów, karty wydarzeń z menu i harmonogramem, procesy
            z rolami dla kuchni, baru i obsługi, portal dla klienta oraz
            finanse — wszystko opisuje to samo wydarzenie, więc informacja wpisana raz
            pojawia się wszędzie tam, gdzie jest potrzebna.
          </p>
        </div>
      </div>
    </section>
  );
}
