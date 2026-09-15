import { Mail, Phone, ArrowRight, Check } from "lucide-react";

/**
 * Domknięcie sprzedażowe. Model jest wdrożeniowy (bez samorejestracji), więc
 * CTA prowadzi do kontaktu. Adres/telefon podmień na własne dane kontaktowe.
 *
 * Samo „umów demo” jest słabą prośbą: człowiek po drugiej stronie nie wie,
 * ile go to kosztuje ani co dostanie. Dlatego obok przycisku stoi wprost,
 * co się wydarzy na spotkaniu i czego nie będzie.
 */
const CONTACT_EMAIL = "kontakt@kodalabs.pl";
const CONTACT_PHONE = "666 328 996";
const CONTACT_PHONE_HREF = "+48666328996";

const CO_DOSTANIESZ = [
  "Pokazujemy system na Twoim najbliższym przyjęciu, nie na przykładowych danych",
  "Mówimy wprost, czy EventBoard da Ci oszczędność przy Twojej skali",
  "Dostajesz wycenę wdrożenia — bez zobowiązania i bez podawania karty",
];

export function LandingCta() {
  return (
    <section id="kontakt" className="bg-[#0b1220] py-24 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e2c46b]">
              Spotkanie demonstracyjne
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl">
              30 minut, po których będziesz wiedzieć, czy to ma sens
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Nie zakładasz konta i niczego nie konfigurujesz samodzielnie. Opowiadasz,
              jak prowadzisz przyjęcia, a my mówimy, ile z tego system zabierze z głowy.
            </p>

            <ul className="mt-7 space-y-3">
              {CO_DOSTANIESZ.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#e2c46b]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-7">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Spotkanie demonstracyjne EventBoard`}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1220] transition-colors hover:bg-slate-100"
            >
              <Mail className="h-4 w-4" />
              Umów spotkanie demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2.5 text-slate-300 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-slate-500" />
                {CONTACT_EMAIL}
              </a>
              <a
                href={`tel:${CONTACT_PHONE_HREF}`}
                className="flex items-center gap-2.5 text-slate-300 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                {CONTACT_PHONE}
              </a>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Twoje dane zostają Twoje. Każdy obiekt ma osobne konto, a komplet danych
              pobierzesz w każdej chwili jako jeden plik.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
