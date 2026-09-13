export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-xs text-stone-600">
            &copy; {new Date().getFullYear()} EventBoard — system do zarządzania eventami dla gastronomii
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Twórca: <span className="font-semibold text-stone-700">Koda Labs PSA</span>
            {" · "}
            <a href="mailto:kontakt@kodalabs.pl" className="transition-colors hover:text-stone-900">kontakt@kodalabs.pl</a>
            {" · "}
            <a href="tel:+48666328996" className="transition-colors hover:text-stone-900">666 328 996</a>
          </p>
        </div>
        <nav aria-label="Nawigacja w stopce" className="flex items-center gap-6 text-xs font-medium text-stone-600">
          <a href="#features" className="transition-colors hover:text-stone-900">Funkcje</a>
          <a href="#jak-to-dziala" className="transition-colors hover:text-stone-900">Jak to działa</a>
          <a href="#pricing" className="transition-colors hover:text-stone-900">Cennik</a>
          <a href="#kontakt" className="transition-colors hover:text-stone-900">Kontakt</a>
          <a href="/pl/legal/regulamin" className="transition-colors hover:text-stone-900">Regulamin</a>
          <a href="/pl/legal/prywatnosc" className="transition-colors hover:text-stone-900">Prywatność</a>
        </nav>
      </div>
    </footer>
  );
}
