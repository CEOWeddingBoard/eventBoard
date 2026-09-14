import { ArrowRight, Check, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#faf9f7] text-stone-900">
      {/* Ciepłe, miękkie poświaty */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[-240px] h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-amber-200/30 blur-[140px]" />
        <div className="absolute right-[-180px] top-32 h-[380px] w-[380px] rounded-full bg-rose-200/25 blur-[120px]" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[320px] w-[420px] rounded-full bg-emerald-100/30 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl pb-16 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-800 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#7a5f28]" />
            System dla sal i restauracji
          </span>

          {/* Nagłówek mówi o wyniku, nie o bólu. „Koniec z Excelem” nazywał
              problem, ale nie obiecywał niczego konkretnego. */}
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            Agenda dla kuchni gotowa sama,
            <br />
            zanim{" "}
            <span className="bg-gradient-to-r from-[#9a7b32] to-[#7a5f28] bg-clip-text text-transparent">
              zadzwoni klient
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-700 sm:text-lg">
            Ustalasz raz, jak wygląda obsługa przyjęcia — kto co wypełnia i kto zatwierdza.
            Klient uzupełnia swoje kroki sam, przez link bez zakładania konta, a agenda dla
            kuchni i obsługi składa się z tego automatycznie. Bez przepisywania z Excela.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#kontakt"
              className="group inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-[#1e293b] hover:shadow-xl hover:shadow-slate-900/20"
            >
              Umów spotkanie demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            {/* Miękkie wejście: większość odwiedzających nie jest jeszcze gotowa
                rozmawiać z człowiekiem, a demo było jedynym dostępnym ruchem. */}
            <a
              href="#jak-to-dziala"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#0f172a] bg-white px-7 py-3 text-sm font-semibold text-[#0f172a] transition-all hover:-translate-y-0.5 hover:bg-[#0f172a] hover:text-white"
            >
              Zobacz, jak to działa
            </a>
            <a
              href="#kalkulator"
              className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 underline-offset-4 transition-colors hover:text-stone-900 hover:underline"
            >
              Policz, ile oszczędzisz
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              Wdrożenie i konfiguracja po naszej stronie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              Gotowe procesy na start
            </span>
          </div>
        </div>

        {/* Prawdziwy zrzut z aplikacji, nie rysunek.
            Źródło: docs/screens/03-panel-procesu.webp — panel procesu na evencie,
            czyli to, co obsługa widzi codziennie. Wcześniej była tu makieta HTML
            udająca ekran, z nawigacją i modułami, których produkt nie ma. */}
        <div className="relative z-10 mx-auto max-w-5xl translate-y-16 sm:translate-y-24">
          <div
            className="absolute -inset-x-10 -top-10 bottom-0 bg-gradient-to-t from-amber-200/40 via-rose-100/30 to-transparent blur-3xl"
            aria-hidden
          />
          <figure className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xl shadow-slate-300/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/panel-procesu.webp"
              alt="Panel procesu obsługi przyjęcia: kroki z przypisanymi rolami, ukończone odhaczone, bieżący krok czeka na działanie klienta w portalu."
              width={1400}
              height={819}
              className="w-full"
            />
            <figcaption className="border-t border-stone-100 px-4 py-2.5 text-center text-[11px] text-stone-500">
              Panel procesu w EventBoard — każdy krok ma rolę, a agenda składa się z tego, co w nich ustalicie.
            </figcaption>
          </figure>

          <div
            className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-[100%] bg-[#0f172a]/15 blur-2xl"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
