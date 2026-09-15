/**
 * Pytania, które realnie blokują decyzję.
 *
 * Odpowiedzi opisują stan faktyczny produktu — jeśli któraś przestanie być
 * prawdziwa, jest to obietnica sprzedażowa bez pokrycia, a nie drobiazg
 * marketingowy. Sprawdzaj je przy większych zmianach.
 */

const pytania = [
  {
    p: "Ile trwa wdrożenie?",
    o: "Zwykle jedno spotkanie i kilka dni. Nie konfigurujesz niczego sam — proces obsługi ustawiamy razem z Tobą, na Twoich przyjęciach. Konto dostajesz gotowe do pracy, z procesem, rolami i menu.",
  },
  {
    p: "Czy muszę szkolić zespół?",
    o: "Nie. Każdy widzi tylko swoje kroki — kucharz kuchenne, kelner swoje, manager całość. Krok mówi wprost, kto go wypełnia i kto zatwierdza, więc nie ma czego się uczyć poza własną robotą.",
  },
  {
    p: "Czy klient musi zakładać konto?",
    o: "Nie. Dostaje od Ciebie link i wypełnia swoje ustalenia z telefonu. Bez hasła, bez instalowania aplikacji. Link ma termin ważności i możesz go unieważnić.",
  },
  {
    p: "Co z danymi, które już mamy?",
    o: "Terminy z kalendarzy Google widać na grafiku po podłączeniu konta — niczego nie przepisujesz. Menu wkleja się z oferty jako tekst, a system sam rozpoznaje sekcje i dania według reguł, które raz ustawiamy.",
  },
  {
    p: "A jeśli zechcemy odejść?",
    o: "Komplet danych — przyjęcia, menu, agendy, procesy, zapytania — pobierzesz jako jeden plik. Bez rozmów o tym, czy się da i bez opłat za wyjście.",
  },
  {
    p: "Czy to działa na telefonie?",
    o: "Tak. Obsługa na sali korzysta z telefonu, a klient prawie zawsze. Agendę eventu pobierasz jako jeden dokument do druku, z osobnymi sekcjami uwag dla kuchni i dla obsługi, z logo i danymi obiektu.",
  },
  {
    p: "Czy każde przyjęcie musi mieć ten sam proces?",
    o: "Nie. Wesele, komunia i bankiet firmowy mogą mieć własne kroki, role i akceptacje. Proces ustawiasz raz dla danego rodzaju przyjęcia, a potem tylko go używasz.",
  },
  {
    p: "Co z płatnościami?",
    o: "Fakturujemy poza systemem, bez wpinania karty. Zaliczki i dopłaty klienta odnotowujesz w evencie ręcznie — tak, jak robisz to dziś, tylko w jednym miejscu.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="bg-[#f6f7f9] py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a22]">
            Zanim zapytasz
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Najczęstsze pytania
          </h2>
        </div>

        <div className="mt-12 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pytania.map((q) => (
            <details key={q.p} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">{q.p}</span>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{q.o}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Nie ma Twojego pytania?{" "}
          <a href="#kontakt" className="font-semibold text-[#8a6a22] underline-offset-4 hover:underline">
            Napisz — odpowiemy konkretnie
          </a>
          .
        </p>
      </div>
    </section>
  );
}
