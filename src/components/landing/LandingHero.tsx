import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  FileText,
  GitBranch,
  LayoutGrid,
  Users,
  Utensils,
  Wallet,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Makieta ma pokazywać produkt, który istnieje. Wcześniej reklamowała listę
// gości, stoliki i moduł dokumentów z wycofanego produktu weselnego — czyli
// obiecywała klientowi funkcje, których po zalogowaniu by nie znalazł.
const sideNav: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: LayoutGrid, label: "Pulpit", active: true },
  { icon: CalendarDays, label: "Kalendarz" },
  { icon: FileText, label: "Eventy" },
  { icon: Users, label: "Zapytania" },
  { icon: Wallet, label: "Finanse" },
  { icon: Utensils, label: "Konfiguracja" },
];

// Bez zmyślonych wskaźników wzrostu — to były liczby udające wynik produktu.
const stats = [
  { label: "Przyjęcia", value: "18", delta: "w tym sezonie" },
  { label: "Krok procesu", value: "3 z 7", delta: "Wesele Anny i Tomasza" },
  { label: "Zapytania", value: "5", delta: "2 nowe" },
  { label: "Liczba gości", value: "128", delta: "z kroku procesu" },
];

const daySchedule: { time: string; title: string; status: string; tone: "emerald" | "amber" | "stone" }[] = [
  { time: "14:00", title: "Ceremonia", status: "Zatwierdzono", tone: "emerald" },
  { time: "15:30", title: "Koktajl powitalny", status: "W trakcie", tone: "amber" },
  { time: "17:00", title: "Kolacja — menu B", status: "Do akceptacji", tone: "stone" },
  { time: "21:00", title: "Tort i pierwszy taniec", status: "Zaplanowano", tone: "stone" },
];

const statusTone = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  stone: "bg-stone-100 text-stone-600 ring-stone-200",
};

const processRows = [
  { label: "Wybór menu", role: "Klient", dot: "bg-emerald-500" },
  { label: "Alergie i diety", role: "Klient", dot: "bg-emerald-500" },
  { label: "Akceptacja — kuchnia", role: "Kuchnia", dot: "bg-amber-400" },
  { label: "Akceptacja harmonogramu", role: "Manager", dot: "bg-stone-300" },
];

// Agenda składa się automatycznie z kroków procesu — to jest sedno produktu,
// więc to pokazujemy zamiast listy gości, której w aplikacji nie ma.
const agendaRows = [
  { label: "Menu", value: "Wariant B — 96 os." },
  { label: "Uczulenia", value: "orzechy, gluten" },
  { label: "Uwagi dla kuchni", value: "tort bez laktozy" },
];

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

        {/* Product Preview Mockup — jasny motyw */}
        <div className="relative z-10 mx-auto max-w-5xl translate-y-16 sm:translate-y-24">
          <div
            className="absolute -inset-x-10 -top-10 bottom-0 bg-gradient-to-t from-amber-200/40 via-rose-100/30 to-transparent blur-3xl"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xl shadow-slate-300/60">
            {/* Bez paska przeglądarki: to jest rysunek poglądowy, nie zrzut
                ekranu, a ramka okna sugerowałaby, że patrzysz na prawdziwy panel.
                Prawdziwe zrzuty robi scripts/capture-product-screenshots.cjs. */}
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Tak wygląda praca na jednym przyjęciu
              </span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                widok poglądowy
              </span>
            </div>

            <div className="flex">
              {/* Sidebar */}
              <aside className="hidden w-44 shrink-0 border-r border-stone-100 bg-stone-50/60 p-3 sm:block">
                <nav className="space-y-1">
                  {sideNav.map((item) => (
                    <span
                      key={item.label}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        item.active
                          ? "bg-[#0f172a] text-white shadow-sm"
                          : "text-stone-600"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                  ))}
                </nav>
              </aside>

              {/* Główny panel */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Wesele Anny i Tomasza</p>
                    <p className="text-xs text-stone-600">14 cze 2026 · Sala Bankietowa Pod Lipami</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Aktywny
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-xl border border-stone-100 bg-stone-50/60 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-600">{s.label}</p>
                      <p className="mt-1 text-base font-bold text-stone-900 sm:text-lg">{s.value}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                        {s.delta}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-5">
                  {/* Harmonogram dnia */}
                  <div className="rounded-xl border border-stone-100 bg-white p-4 sm:col-span-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                        Harmonogram dnia
                      </p>
                      <Clock className="h-3.5 w-3.5 text-[#7a5f28]" />
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {daySchedule.map((d) => (
                        <div key={d.time} className="flex items-center gap-3">
                          <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-stone-600">
                            {d.time}
                          </span>
                          <span className="h-6 w-px bg-stone-200" />
                          <span className="flex-1 truncate text-xs font-medium text-stone-700">{d.title}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${statusTone[d.tone]}`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Proces obsługi i goście */}
                  <div className="flex flex-col gap-3 sm:col-span-2">
                    <div className="rounded-xl border border-stone-100 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">Proces obsługi</p>
                        <GitBranch className="h-3.5 w-3.5 text-[#7a5f28]" />
                      </div>
                      <div className="mt-3 space-y-2">
                        {processRows.map((p) => (
                          <div key={p.label} className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.dot}`} />
                            <span className="flex-1 truncate text-[11px] font-medium text-stone-700">{p.label}</span>
                            <span className="truncate text-[10px] text-stone-500">{p.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl border border-stone-100 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                        Agenda dla kuchni
                      </p>
                      <div className="mt-3 space-y-2">
                        {agendaRows.map((a) => (
                          <div key={a.label} className="flex items-center gap-2">
                            <span className="w-24 shrink-0 truncate text-[10px] uppercase tracking-wide text-stone-500">
                              {a.label}
                            </span>
                            <span className="flex-1 truncate text-xs font-medium text-stone-700">{a.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Miękki cień pod mockupem */}
          <div
            className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-[100%] bg-[#0f172a]/15 blur-2xl"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
