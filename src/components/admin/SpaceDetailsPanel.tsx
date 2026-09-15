"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Workflow, KeyRound, Copy, Check, Users, Loader2 } from "lucide-react";
import {
  getSpaceDetails,
  resetAccountPassword,
  type SzczegolyPrzestrzeni,
} from "@/lib/actions/admin.actions";

/**
 * Szczegóły przestrzeni klienta: jakie ma procesy i kto ma w niej konto.
 *
 * Dane doczytują się przy rozwinięciu, a nie razem z listą klientów — to dwa
 * dodatkowe zapytania na przestrzeń, a patrzy się na nie przy jednym kliencie
 * naraz. Reset hasła siedzi przy koncie, bo wcześniej trzeba było przepisać
 * e-mail do osobnego pola, mając go na ekranie obok.
 */
export function SpaceDetailsPanel({ orgId }: { orgId: string }) {
  const [dane, setDane] = useState<SzczegolyPrzestrzeni | null>(null);
  const [resetowane, setResetowane] = useState<string | null>(null);
  const [haslo, setHaslo] = useState<Record<string, string>>({});
  const [skopiowane, setSkopiowane] = useState<string | null>(null);

  useEffect(() => {
    let aktualny = true;
    getSpaceDetails(orgId)
      .then((d) => {
        if (aktualny) setDane(d);
      })
      .catch(() => {
        if (aktualny) toast.error("Nie udało się wczytać szczegółów");
      });
    return () => {
      aktualny = false;
    };
  }, [orgId]);

  async function resetuj(email: string) {
    setResetowane(email);
    try {
      const res = await resetAccountPassword(email);
      if (res.ok && res.password) {
        setHaslo((p) => ({ ...p, [email]: res.password! }));
        toast.success("Nowe hasło wygenerowane");
      } else {
        toast.error(res.error ?? "Nie udało się");
      }
    } finally {
      setResetowane(null);
    }
  }

  async function kopiuj(email: string) {
    const h = haslo[email];
    if (!h) return;
    try {
      await navigator.clipboard.writeText(`${email} / ${h}`);
      setSkopiowane(email);
    } catch {
      toast.error("Skopiuj dane ręcznie — przeglądarka nie dała dostępu do schowka.");
    }
  }

  if (!dane) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Wczytuję szczegóły…
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 lg:grid-cols-2">
      {/* Procesy */}
      <section>
        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          <Workflow className="h-3.5 w-3.5" />
          Procesy ({dane.procesy.length})
        </h4>
        {dane.procesy.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-400">
            Brak procesów — klient nie ma jeszcze czym prowadzić przyjęcia.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {dane.procesy.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-md bg-white px-2.5 py-1.5"
              >
                <span className="text-xs font-medium text-neutral-800">{p.name}</span>
                <span className="text-[11px] text-neutral-500">{p.liczbaKrokow} kroków</span>
                {/* Proces bez użyć po wdrożeniu znaczy, że klient go nie potrzebuje
                    albo nie wie, że go ma — jedno i drugie warto zobaczyć. */}
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p.liczbaEventow > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {p.liczbaEventow > 0 ? `używany: ${p.liczbaEventow}` : "nieużywany"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Konta */}
      <section>
        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          <Users className="h-3.5 w-3.5" />
          Konta ({dane.konta.length})
        </h4>
        {dane.konta.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-400">Brak kont w tej przestrzeni.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {dane.konta.map((k) => (
              <li key={k.userId} className="rounded-md bg-white px-2.5 py-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-neutral-800">
                    {k.name || k.email}
                  </span>
                  {k.name && <span className="text-[11px] text-neutral-500">{k.email}</span>}
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                    {k.isAdmin ? "Administrator" : k.role}
                  </span>
                  {k.roleOperacyjne.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                    >
                      {r}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => resetuj(k.email)}
                    disabled={resetowane === k.email}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    {resetowane === k.email ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <KeyRound className="h-3 w-3" />
                    )}
                    Nowe hasło
                  </button>
                </div>

                {/* Hasło pokazujemy raz, po wygenerowaniu — w bazie jest już
                    wyłącznie jego skrót, więc drugi raz go nie odtworzymy. */}
                {haslo[k.email] && (
                  <div className="mt-1.5 flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5">
                    <code className="min-w-0 flex-1 truncate text-[11px] text-neutral-800">
                      {k.email} / {haslo[k.email]}
                    </code>
                    <button
                      type="button"
                      onClick={() => kopiuj(k.email)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      {skopiowane === k.email ? (
                        <>
                          <Check className="h-3 w-3" /> Skopiowano
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Kopiuj
                        </>
                      )}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
