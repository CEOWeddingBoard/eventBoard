import Link from "next/link";
import { CalendarDays } from "lucide-react";

export function LandingHeader({
  homeUrl,
}: {
  homeUrl: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#faf9f7]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href={homeUrl} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f172a] shadow-md shadow-slate-900/10">
            <CalendarDays className="h-4 w-4 text-amber-100" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-stone-900">
            EVENT<span className="text-[#7a5f28]">BOARD</span>
          </span>
        </Link>
        <nav aria-label="Nawigacja główna" className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
          <a href="#jak-to-dziala" className="transition-colors hover:text-stone-900">Jak to działa</a>
          <a href="#features" className="transition-colors hover:text-stone-900">Funkcje</a>
          <a href="#kalkulator" className="transition-colors hover:text-stone-900">Ile oszczędzisz</a>
          <a href="#pricing" className="transition-colors hover:text-stone-900">Cennik</a>
        </nav>
        {/* Świadomie BEZ linku do panelu. Strona sprzedażowa nie może być
            drogą do aplikacji — dostęp do przestrzeni daje wyłącznie adres
            przekazany przez administratora przy wdrożeniu. */}
        <div className="flex items-center gap-3">
          <a
            href="#kontakt"
            className="rounded-full bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-[#1e293b] hover:shadow-lg"
          >
            Umów spotkanie demo
          </a>
        </div>
      </div>
    </header>
  );
}
