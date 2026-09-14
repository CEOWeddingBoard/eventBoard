import { CalendarCheck, Headphones, PlugZap, ShieldCheck } from "lucide-react";

/**
 * Co się dzieje po umówieniu demo.
 *
 * Model sprzedaży nie ma samorejestracji, więc odwiedzający nie może niczego
 * wypróbować sam — a landing milczał o tym, jak wygląda start. To są pytania,
 * które realnie blokują decyzję: ile to trwa, kto przenosi dane, czy zespół
 * będzie się musiał uczyć.
 *
 * Świadomie BEZ opinii i logo klientów: wymyślona referencja jest gorsza niż
 * jej brak. Gdy pojawią się prawdziwe, ich miejsce jest właśnie tutaj.
 */

const kroki = [
  {
    icon: Headphones,
    tytul: "Rozmowa o tym, jak pracujecie",
    opis:
      "Pokazujesz, jak dziś prowadzisz przyjęcie — od zapytania po dzień imprezy. Z tego powstaje proces w systemie.",
  },
  {
    icon: PlugZap,
    tytul: "Przestrzeń gotowa do pracy",
    opis:
      "Zakładamy konto Twojego obiektu, ustawiamy proces, role i menu. Dostajesz dane logowania dla siebie i zespołu.",
  },
  {
    icon: CalendarCheck,
    tytul: "Pierwsze przyjęcie prowadzone w systemie",
    opis:
      "Wprowadzasz najbliższy termin i wysyłasz klientowi link do jego kroków. Agenda składa się sama z tego, co uzupełnicie.",
  },
];

export function LandingOnboarding() {
  return (
    <section id="wdrozenie" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7a5f28]">Wdrożenie</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Nie zostajesz z pustym systemem
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-stone-700">
            Nie ma samodzielnej rejestracji i nie ma konfiguracji „zrób sobie sam”.
            Proces obsługi ustawiamy razem z Tobą, na Twoich przyjęciach.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {kroki.map((krok, i) => (
            <li
              key={krok.tytul}
              className="relative rounded-2xl border border-stone-200 bg-[#faf9f7] p-6"
            >
              <span className="absolute right-5 top-5 text-3xl font-black text-stone-200">
                {i + 1}
              </span>
              <krok.icon className="h-6 w-6 text-[#7a5f28]" />
              <h3 className="mt-4 text-base font-bold text-stone-900">{krok.tytul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{krok.opis}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-stone-200 bg-[#faf9f7] px-6 py-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7a5f28]" />
          <p className="text-sm leading-relaxed text-stone-700">
            <span className="font-semibold text-stone-900">Twoje dane zostają Twoje.</span>{" "}
            Każdy obiekt ma osobne, odseparowane konto, a komplet danych — przyjęcia, menu, agendy,
            procesy — pobierzesz w każdej chwili jako jeden plik. Bez rozmów o tym,
            czy da się wyjść.
          </p>
        </div>
      </div>
    </section>
  );
}
