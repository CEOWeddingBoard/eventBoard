import { Mail, ArrowRight, Calculator } from "lucide-react";

/**
 * Domknięcie sprzedażowe. Model jest wdrożeniowy (bez samorejestracji), więc
 * CTA prowadzi do kontaktu. Adres/telefon podmień na własne dane kontaktowe.
 */
const CONTACT_EMAIL = "kontakt@kodalabs.pl";
const CONTACT_PHONE = "666 328 996";
const CONTACT_PHONE_HREF = "+48666328996";

export function LandingCta() {
  return (
    <section id="kontakt" className="bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] px-8 py-14 text-center shadow-2xl shadow-slate-900/20 sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" aria-hidden />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Spotkanie demonstracyjne</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Umów się na demo, poznamy Twoje potrzeby
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-300">
              Na krótkim spotkaniu pokażemy system na przykładzie Twoich przyjęć i wspólnie
              sprawdzimy, jak dopasować procesy, menu i role do tego, jak pracujecie.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Spotkanie demonstracyjne EventBoard`}
                className="group inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3 text-sm font-bold text-[#0f172a] shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 hover:bg-amber-300"
              >
                <Mail className="h-4 w-4" />
                Umów spotkanie demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="#kalkulator"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 px-7 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Calculator className="h-4 w-4" />
                Policz oszczędności
              </a>
            </div>

            <p className="mt-6 text-sm text-stone-400">
              Wolisz mailem lub telefonem?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-amber-200 hover:underline">
                {CONTACT_EMAIL}
              </a>
              {" · "}
              <a href={`tel:${CONTACT_PHONE_HREF}`} className="font-semibold text-amber-200 hover:underline">
                {CONTACT_PHONE}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
