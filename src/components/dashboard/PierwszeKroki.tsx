import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

/**
 * Pierwsze kroki w świeżej przestrzeni.
 *
 * Nowa przestrzeń startuje pusta — to świadoma decyzja — ale do tej pory
 * właściciel sali widział przy pierwszym logowaniu wyłącznie „Brak eventów.”
 * bez żadnej wskazówki, co dalej. To jest moment, w którym wyrabia sobie zdanie
 * o produkcie, więc dostaje trzy konkretne kroki zamiast pustki.
 *
 * Kafelek znika sam, gdy wszystkie trzy są zrobione — nie zostaje na stałe
 * jako ozdoba.
 */

export type StanPierwszychKrokow = {
  maProces: boolean;
  maEvent: boolean;
  maLinkDlaKlienta: boolean;
};

export function PierwszeKroki({
  stan,
  locale,
}: {
  stan: StanPierwszychKrokow;
  locale: string;
}) {
  const kroki = [
    {
      zrobione: stan.maProces,
      tytul: "Ustaw proces obsługi",
      opis: "Kroki, role i to, co trafia do agendy. Z niego składa się cała reszta.",
      href: `/${locale}/app/settings/workflows`,
      cta: "Przejdź do procesów",
    },
    {
      zrobione: stan.maEvent,
      tytul: "Dodaj pierwsze przyjęcie",
      opis: "Data, nazwa, liczba gości. Proces przypnie się automatycznie.",
      href: `/${locale}/app/events`,
      cta: "Dodaj event",
    },
    {
      zrobione: stan.maLinkDlaKlienta,
      tytul: "Wyślij klientowi link do jego kroków",
      opis: "Klient wypełnia swoje ustalenia sam — bez konta i bez SMS-ów w tę i z powrotem.",
      href: `/${locale}/app/events`,
      cta: "Otwórz event",
    },
  ];

  const zrobionych = kroki.filter((k) => k.zrobione).length;
  if (zrobionych === kroki.length) return null;

  const nastepny = kroki.find((k) => !k.zrobione);

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">Zacznij tutaj</h2>
        <span className="text-xs text-neutral-500 tabular-nums">
          {zrobionych} z {kroki.length}
        </span>
      </div>

      <ol className="mt-3 space-y-2">
        {kroki.map((krok, i) => {
          const biezacy = krok === nastepny;
          return (
            <li
              key={krok.tytul}
              className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
                krok.zrobione
                  ? "border-transparent bg-white/60"
                  : biezacy
                    ? "border-blue-300 bg-white"
                    : "border-transparent bg-white/60"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  krok.zrobione
                    ? "bg-emerald-500 text-white"
                    : biezacy
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {krok.zrobione ? <Check className="h-3 w-3" /> : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    krok.zrobione ? "text-neutral-400 line-through" : "text-neutral-800"
                  }`}
                >
                  {krok.tytul}
                </p>
                {!krok.zrobione && (
                  <p className="mt-0.5 text-xs text-neutral-500">{krok.opis}</p>
                )}
              </div>

              {biezacy && (
                <Link
                  href={krok.href}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  {krok.cta}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
