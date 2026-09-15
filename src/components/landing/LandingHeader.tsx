import Link from "next/link";
import { CalendarDays } from "lucide-react";

export function LandingHeader({
  homeUrl,
}: {
  homeUrl: string;
}) {
  // Ciemny pasek, bo hero jest ciemne — jasny, półprzezroczysty header
  // rozjeżdżał się z sekcją pod sobą przy każdym przewinięciu.
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={homeUrl} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <CalendarDays className="h-4 w-4 text-[#e2c46b]" />
          </span>
          <span className="text-base font-bold tracking-tight text-white">
            EVENT<span className="text-[#e2c46b]">BOARD</span>
          </span>
        </Link>
        <nav
          aria-label="Nawigacja główna"
          className="hidden items-center gap-7 text-sm text-slate-300 lg:flex"
        >
          <a href="#jak-to-dziala" className="transition-colors hover:text-white">Jak to działa</a>
          <a href="#features" className="transition-colors hover:text-white">Funkcje</a>
          <a href="#dla-kogo" className="transition-colors hover:text-white">Dla kogo</a>
          <a href="#kalkulator" className="transition-colors hover:text-white">Ile odzyskasz</a>
          <a href="#pricing" className="transition-colors hover:text-white">Cennik</a>
        </nav>
        {/* Świadomie BEZ linku do panelu. Strona sprzedażowa nie może być
            drogą do aplikacji — dostęp do panelu daje wyłącznie adres
            przekazany przez administratora przy wdrożeniu. */}
        <a
          href="#kontakt"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0b1220] transition-colors hover:bg-slate-100"
        >
          Umów demo
        </a>
      </div>
    </header>
  );
}
