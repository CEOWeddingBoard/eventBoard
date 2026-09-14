import { Check, Link2, Smartphone } from "lucide-react";

/**
 * Co dostaje klient końcowy — para młoda albo organizator przyjęcia.
 *
 * To jest argument, którego właściciel sali używa w rozmowie sprzedażowej ze
 * SWOIM klientem, więc musi go najpierw zobaczyć u nas. Landing opisywał
 * wyłącznie korzyści obiektu, a połowa wartości leży po stronie pary.
 */

const korzysci = [
  "Bez zakładania konta i wymyślania hasła — wchodzi z linku",
  "Widzi plan dnia i wybrane menu, zawsze aktualne",
  "Wybiera menu i wpisuje ustalenia wtedy, kiedy mu wygodnie",
  "Listę gości i teksty na winietki wkleja prosto z Excela",
  "Dopisuje uwagi do każdego kroku — alergie, prośby, wyjątki",
];

export function LandingDlaKlienta() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7a5f28]">
              Strona klienta
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Twój klient też coś dostaje
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-700">
              Para młoda albo firma organizująca przyjęcie dostaje od Ciebie jeden link.
              Bez konta, bez aplikacji do zainstalowania, bez hasła do zapomnienia.
              Wypełnia swoje kroki z telefonu, a Ty widzisz to u siebie od razu.
            </p>

            <ul className="mt-7 space-y-3">
              {korzysci.map((k) => (
                <li key={k} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </span>
                  <span className="text-sm leading-relaxed text-stone-700">{k}</span>
                </li>
              ))}
            </ul>

            <p className="mt-7 flex items-start gap-2 rounded-xl border border-stone-200 bg-[#faf9f7] px-4 py-3 text-sm text-stone-600">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#7a5f28]" />
              Link ma termin ważności i możesz go unieważnić w każdej chwili — po weselu
              dostęp gaśnie sam.
            </p>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-amber-100/60 to-rose-100/40 blur-2xl"
              aria-hidden
            />
            <div className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                <Smartphone className="h-4 w-4 text-[#7a5f28]" />
                Portal klienta — widok na telefonie
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4">
                  <p className="text-sm font-semibold text-stone-900">Wesele Anny i Tomasza</p>
                  <p className="text-xs text-stone-500">14 czerwca 2026 · Sala Bankietowa</p>
                </div>

                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Twój krok
                  </p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">Wybór menu</p>
                  <p className="mt-0.5 text-xs text-stone-600">
                    Wskaż wariant i liczbę osób. Możesz dopisać uwagi.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-stone-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-stone-500">Ustalenia wstępne — gotowe</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-stone-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                  <span className="text-xs text-stone-400">Lista gości — wkrótce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
