import { ArrowRight, Check } from "lucide-react";

/**
 * Hero strony sprzedażowej.
 *
 * Poprzednia wersja była beżowa, z pastelowymi poświatami i gradientowym
 * napisem — wyglądała jak strona o weselach, a nie jak narzędzie, za które
 * obiekt płaci kilkaset złotych miesięcznie. Ciemny, kontrastowy blok robi
 * dwie rzeczy naraz: odcina produkt od poprzedniej marki i pozwala zrzutowi
 * z aplikacji wybić się jako jedyny jasny element na ekranie.
 */

const DOWODY = [
  { liczba: "1", opis: "agenda zamiast maili, SMS-ów i Excela" },
  { liczba: "0", opis: "kont do założenia po stronie klienta" },
  { liczba: "~24 h", opis: "koordynacji odzyskane miesięcznie" },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#0b1220] text-white">
      {/* Delikatna siatka zamiast kolorowych plam — porządek, nie nastrój. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-40 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e2c46b]">
            System do obsługi przyjęć
          </span>

          <h1 className="mt-7 text-[2.6rem] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl">
            Agenda dla kuchni składa się sama
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Ustalasz raz, jak wygląda obsługa przyjęcia: kto co wypełnia i kto zatwierdza.
            Klient uzupełnia swoje kroki sam, przez link bez zakładania konta — a dokument
            dla kuchni i obsługi powstaje z tego automatycznie.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#kontakt"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-[#0b1220] transition-colors hover:bg-slate-100 sm:w-auto"
            >
              Umów spotkanie demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#kalkulator"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Policz, ile odzyskasz
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#e2c46b]" />
              Wdrożenie i konfiguracja po naszej stronie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[#e2c46b]" />
              Gotowe procesy na start
            </span>
          </div>
        </div>

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {DOWODY.map((d) => (
            <div key={d.opis} className="bg-[#0b1220] px-5 py-5 text-center">
              <dt className="text-2xl font-bold tabular-nums tracking-tight text-white">
                {d.liczba}
              </dt>
              <dd className="mt-1 text-[13px] leading-snug text-slate-400">{d.opis}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Zrzut wchodzi w następną sekcję — jasny prostokąt na ciemnym tle
          jest tu jedynym „bohaterem” ekranu.
          Źródło: docs/screens/03-panel-procesu.webp, panel procesu na evencie. */}
      <div className="relative mx-auto -mb-28 max-w-5xl px-6 sm:-mb-36">
        <figure className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl shadow-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/panel-procesu.webp"
            alt="Panel procesu obsługi przyjęcia: kroki z przypisanymi rolami, ukończone odhaczone, bieżący krok czeka na działanie klienta w portalu."
            width={1400}
            height={819}
            className="w-full"
          />
          <figcaption className="border-t border-slate-100 bg-white px-4 py-2.5 text-center text-[11px] text-slate-500">
            Panel procesu w EventBoard — każdy krok ma rolę, a agenda składa się z tego,
            co w nich ustalicie.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
