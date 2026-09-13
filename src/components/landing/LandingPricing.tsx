"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

type Plan = {
  name: string;
  scale: string;
  /** Cena miesięczna w zł; null dla planu na wycenę. */
  monthly: number | null;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
// Rozliczenie roczne = 2 miesiące gratis (płatne za 10, efektywnie /12).
const MONTHS_FREE = 2;

/**
 * Progi wyznacza liczba sal w obiekcie, nie liczba imprez.
 * Każda kolejna sala to osobny kalendarz i równoległe przyjęcia tego samego
 * dnia, więc złożoność pracy rośnie razem z nią. Pełen zakres funkcji jest
 * już w najniższym pakiecie — różnicuje skala, nie okrajanie.
 */
const plans: Plan[] = [
  {
    name: "Start",
    scale: "1 sala · do 3 osób w zespole",
    monthly: 249,
    price: "249 zł",
    period: "/ mies.",
    features: [
      "Kalendarz z blokadami terminów",
      "Wydarzenia, warianty menu i harmonogram",
      "Proces obsługi z rolami (kto wypełnia, kto akceptuje)",
      "Agenda składana z procesu + dokument DOCX",
      "Portal klienta: menu, alergie, godziny, akceptacje",
      "Wizytówka publiczna z zapytaniami",
      "Do 3 kont w zespole",
    ],
    cta: "Zacznij",
  },
  {
    name: "Pro",
    scale: "do 5 sal · do 10 osób w zespole",
    monthly: 599,
    price: "599 zł",
    period: "/ mies.",
    features: [
      "Wszystko ze Start — dla maksymalnie 5 sal",
      "Obłożenie wszystkich sal w jednym widoku",
      "Wspólne szablony procesów i dokumentów",
      "Role obsługi: kuchnia, kelnerzy, bar",
      "Kosztorys i umowy per event",
      "Do 10 kont w zespole",
    ],
    cta: "Zacznij",
    popular: true,
  },
  {
    name: "Enterprise",
    scale: "powyżej 5 sal · bez limitu osób",
    monthly: null,
    price: "Wycena",
    period: "",
    features: [
      "Wszystko z Pro, powyżej 5 sal",
      "Bez limitu kont w zespole",
      "Wdrożenie i przeniesienie danych",
      "Dedykowany kontakt",
      "Ustalenia SLA",
    ],
    cta: "Porozmawiajmy",
  },
];

export function LandingPricing({
  dashboardUrl,
  loggedIn,
}: {
  dashboardUrl: string;
  loggedIn: boolean;
}) {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="bg-[#faf9f7] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7a5f28]">Cennik</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Płacisz za wielkość obiektu, nie za liczbę imprez
          </h2>
          <p className="mt-4 text-base text-stone-700">
            Wszystkie funkcje są w każdym pakiecie. Próg wyznacza liczba sal,
            a każdy plan ma przypisany limit osób pracujących w systemie.
          </p>

          {/* Przełącznik: miesięcznie / rocznie (2 miesiące gratis) */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                !annual ? "bg-[#0f172a] text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Miesięcznie
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                annual ? "bg-[#0f172a] text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Rocznie
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  annual ? "bg-amber-400 text-[#0f172a]" : "bg-amber-100 text-amber-800"
                }`}
              >
                2 mies. gratis
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.popular
                  ? "border-2 border-[#0f172a] bg-[#0f172a] text-white shadow-2xl shadow-slate-900/25 lg:scale-[1.03]"
                  : "border border-stone-200 bg-[#fefdfb] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/70"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] shadow-lg shadow-amber-500/30">
                  Najczęściej wybierany
                </span>
              )}

              <h3
                className={`text-sm font-bold uppercase tracking-wide ${
                  plan.popular ? "text-amber-200" : "text-stone-700"
                }`}
              >
                {plan.name}
              </h3>
              <p className={`mt-1 text-sm ${plan.popular ? "text-stone-300" : "text-stone-600"}`}>
                {plan.scale}
              </p>

              {(() => {
                if (plan.monthly === null) {
                  return (
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? "text-white" : "text-stone-900"}`}>
                        {plan.price}
                      </span>
                    </div>
                  );
                }
                const annualTotal = plan.monthly * (12 - MONTHS_FREE);
                const effMonthly = Math.round(annualTotal / 12);
                const shown = annual ? effMonthly : plan.monthly;
                return (
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-4xl font-extrabold tracking-tight ${plan.popular ? "text-white" : "text-stone-900"}`}>
                        {zl(shown)}
                      </span>
                      <span className={`text-sm font-medium ${plan.popular ? "text-stone-300" : "text-stone-600"}`}>
                        / mies.
                      </span>
                    </div>
                    {annual ? (
                      <p className={`mt-1 text-xs ${plan.popular ? "text-stone-400" : "text-stone-500"}`}>
                        <span className="line-through">{zl(plan.monthly)}</span> · rozliczane rocznie {zl(annualTotal)}
                      </p>
                    ) : (
                      <p className={`mt-1 text-xs ${plan.popular ? "text-stone-400" : "text-stone-500"}`}>
                        lub {zl(effMonthly)}/mies. przy rozliczeniu rocznym
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className={`mt-6 h-px ${plan.popular ? "bg-white/10" : "bg-stone-100"}`} />

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 text-sm ${
                      plan.popular ? "text-stone-200" : "text-stone-700"
                    }`}
                  >
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        plan.popular ? "text-amber-300" : "text-emerald-600"
                      }`}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={loggedIn ? dashboardUrl : "#kontakt"}
                className={`mt-8 block w-full rounded-full py-2.5 text-center text-sm transition-all ${
                  plan.popular
                    ? "bg-amber-400 font-bold text-[#0f172a] shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 hover:bg-amber-300"
                    : "border-2 border-[#0f172a] font-semibold text-[#0f172a] hover:-translate-y-0.5 hover:bg-[#0f172a] hover:text-white"
                }`}
              >
                {loggedIn ? "Przejdź do panelu" : "Umów spotkanie demo"}
              </Link>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-stone-600">
          Salą jest osobno rezerwowalna przestrzeń z własnym kalendarzem — taka, w której
          może odbywać się przyjęcie niezależne od pozostałych. „Osoby w zespole” to konta
          pracowników z dostępem do systemu (właściciel, manager, kuchnia, obsługa).
          Rozliczenie roczne z rabatem dwóch miesięcy.
        </p>
      </div>
    </section>
  );
}
