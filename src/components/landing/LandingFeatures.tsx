import {
  GitBranch,
  FileText,
  UtensilsCrossed,
  UserCheck,
  CalendarDays,
  Globe,
  Receipt,
  Wallet,
  Users2,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
} from "lucide-react";

// Kroki realnego procesu obsługi — dokładnie ten mechanizm, który napędza agendę.
const processSteps = [
  { name: "Wybór menu i liczba osób", role: "Klient", status: "done" },
  { name: "Alergie i diety", role: "Klient", status: "done" },
  { name: "Godzina rozpoczęcia", role: "Klient", status: "current" },
  { name: "Akceptacja menu — kuchnia", role: "Kuchnia", status: "pending" },
  { name: "Akceptacja harmonogramu", role: "Manager", status: "pending" },
];

const agendaLines = [
  { label: "Menu", value: "Menu A (30 os.), Menu B (30 os.)" },
  { label: "Harmonogram", value: "18:00 rozpoczęcie · 23:30 zakończenie" },
  { label: "Uwagi dla kuchni", value: "2× bezglutenowe, 1× wege" },
  { label: "Płatności", value: "Zaliczka 2000 zł — opłacona" },
];

const menuChips = ["Menu A", "Menu B", "Menu wigilijne"];

const cardBase =
  "group relative flex flex-col rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300";

const iconTile = "flex h-12 w-12 items-center justify-center rounded-xl bg-[#0b1220] text-[#e2c46b]";

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white pb-24 pt-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a6a22]">Funkcje</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">
            Jeden proces — od zapytania do gotowej agendy
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Definiujesz kroki obsługi raz. Klient i zespół realizują je po kolei,
            a agenda dla kuchni i obsługi składa się z tych ustaleń automatycznie.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-6 lg:grid-cols-12">
          {/* Proces obsługi — kafelek flagowy */}
          <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 md:col-span-6 lg:col-span-7 lg:p-8">
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fdf8ec] text-[#6b5216]">
                <GitBranch className="h-6 w-6" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf8ec] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6b5216] ring-1 ring-[#e8d9ae]">
                Sedno systemu
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 lg:text-lg">Proces obsługi z rolami</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
              Na każdym kroku ustalasz, kto go wypełnia (klient czy zespół) i kto akceptuje.
              Zamiast maili tam i z powrotem — jedna czytelna ścieżka, którą widać na wskroś.
            </p>
            <div className="mt-6 rounded-xl border border-slate-100 bg-white/80 p-4">
              <div className="space-y-2.5">
                {processSteps.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    {s.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : s.status === "current" ? (
                      <Circle className="h-4 w-4 shrink-0 fill-blue-100 text-blue-600" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                    )}
                    <span
                      className={`flex-1 truncate text-xs font-medium ${
                        s.status === "done"
                          ? "text-slate-400 line-through"
                          : s.status === "current"
                          ? "text-blue-700"
                          : "text-slate-600"
                      }`}
                    >
                      {s.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      {s.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agenda z procesu — kafelek flagowy */}
          <div className={`${cardBase} md:col-span-6 lg:col-span-5 lg:p-8`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <FileText className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 lg:text-lg">Agenda składa się sama</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Każdy zatwierdzony krok odkłada dane we właściwym miejscu agendy.
              Na koniec pobierasz gotowy dokument DOCX — ze skanami menu włącznie.
            </p>
            <div className="mt-6 space-y-2.5">
              {agendaLines.map((a) => (
                <div key={a.label} className="rounded-lg border border-slate-100 bg-white/80 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a6a22]">{a.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">{a.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Warianty menu ze skanami */}
          <div className={`${cardBase} md:col-span-3 lg:col-span-5`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <UtensilsCrossed className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Warianty menu ze skanami</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              MENU A/B/C z cenami, dopłatami i oznaczeniem dań wege oraz bezglutenowych.
              Dodaj skan lub zdjęcie wariantu — trafi też do agendy.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {menuChips.map((chip) => (
                <span key={chip} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600">
                  {chip}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Vege
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf8ec] px-3.5 py-2 text-sm font-medium text-[#8a6a22] ring-1 ring-[#eee2c2]">
                <ImageIcon className="h-3.5 w-3.5" /> Skan menu
              </span>
            </div>
          </div>

          {/* Portal klienta */}
          <div className={`${cardBase} md:col-span-3 lg:col-span-4`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <UserCheck className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Portal klienta</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Klient dostaje link i sam wybiera menu z liczbą osób, podaje alergie i godziny
              oraz zatwierdza ustalenia. Wszystko wraca prosto do procesu.
            </p>
            <div className="mt-6 space-y-2">
              {["Wybór menu — wysłane", "Alergie i diety — wysłane", "Godzina kolacji — Twój ruch"].map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  {i < 2 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 fill-blue-100 text-blue-600" />
                  )}
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Płatności — cashflow */}
          <div className={`${cardBase} md:col-span-6 lg:col-span-3`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <Wallet className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Płatności i cashflow</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Zapisujesz zaliczki, raty i wpłaty w jednym miejscu. Od razu widzisz,
              ile jest opłacone, a ile zostało do zapłaty.
            </p>
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Opłacone</span>
                <span className="text-emerald-600">68%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div className="h-full w-[68%] rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Kosztorys i umowa */}
          <div className={`${cardBase} md:col-span-6 lg:col-span-6 lg:p-8`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <Receipt className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 lg:text-lg">Kosztorys i umowa</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              Wycena liczona z menu (cena za osobę + dopłaty) i liczby gości. Gotową
              umowę pobierasz jako dokument DOCX jednym kliknięciem.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600">
                <FileText className="h-4 w-4 text-slate-500" /> Umowa DOCX
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600">
                Wycena per osoba
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600">
                Checklista produkcyjna
              </span>
            </div>
          </div>

          {/* Kalendarz z blokadami */}
          <div className={`${cardBase} md:col-span-3 lg:col-span-4`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <CalendarDays className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Kalendarz i obłożenie</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Terminy, blokady dat i obłożenie — osobno dla każdej sali.
            </p>
          </div>

          {/* Wizytówka + zapytania */}
          <div className={`${cardBase} md:col-span-3 lg:col-span-4`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <Globe className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Wizytówka i zapytania</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Publiczna strona obiektu z formularzem — zapytania trafiają prosto do systemu.
            </p>
          </div>

          {/* Zespół z rolami */}
          <div className={`${cardBase} md:col-span-3 lg:col-span-4`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className={iconTile}>
                <Users2 className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Zespół z rolami</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Właściciel, manager, kuchnia, obsługa, bar — każdy widzi i akceptuje swoje kroki.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
