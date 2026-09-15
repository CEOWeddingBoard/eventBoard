import { Building2, ChefHat, Hotel, PartyPopper } from "lucide-react";

/**
 * Dla kogo jest produkt.
 *
 * Właściciel sali czyta landing pytaniem „czy to jest dla mnie”. Bez tej sekcji
 * odpowiedź musiał sobie złożyć sam z opisu funkcji, a to za dużo pracy jak na
 * pierwsze trzydzieści sekund.
 */

const segmenty = [
  {
    icon: PartyPopper,
    tytul: "Sale weselne",
    opis: "Wesela, poprawiny, komunie. Klient ustala menu i szczegóły sam, przez link — bez wieczornych telefonów.",
  },
  {
    icon: ChefHat,
    tytul: "Restauracje z salą",
    opis: "Przyjęcia obok zwykłego ruchu. Kuchnia dostaje jedną agendę zamiast wiadomości z trzech źródeł.",
  },
  {
    icon: Building2,
    tytul: "Domy weselne i dworki",
    opis: "Kilka sal, jeden kalendarz. Widać, co i kiedy jest zajęte, także rezerwacje z kalendarzy Google.",
  },
  {
    icon: Hotel,
    tytul: "Hotele i obiekty konferencyjne",
    opis: "Różne typy przyjęć, różne procesy obsługi. Każdy z własnymi krokami i odpowiedzialnościami.",
  },
];

export function LandingDlaKogo() {
  return (
    <section id="dla-kogo" className="bg-[#f6f7f9] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a22]">Dla kogo</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Jeśli prowadzisz przyjęcia, to jest dla Ciebie
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Im więcej ustaleń przechodzi przez telefon i Excela, tym więcej zyskasz.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {segmenty.map((s) => (
            <div
              key={s.tytul}
              className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#b49b3d] hover:shadow-md"
            >
              <s.icon className="h-6 w-6 text-[#8a6a22]" />
              <h3 className="mt-4 text-base font-bold text-slate-900">{s.tytul}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.opis}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
