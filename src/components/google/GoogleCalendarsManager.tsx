"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateGoogleCalendar,
  removeGoogleCalendar,
  type KalendarzWKonfiguracji,
} from "@/lib/actions/google-calendar.actions";

/**
 * Kalendarze Google przestrzeni.
 *
 * Obiekt prowadzi zwykle kilka kalendarzy na różnych kontach — sali,
 * właściciela, koordynatora. Każdy dostaje własny kolor na grafiku, bo bez tego
 * nie da się odróżnić, skąd wzięła się rezerwacja. Przypisanie do sali jest
 * opcjonalne: kalendarz bez sali dotyczy całego obiektu.
 */

const PALETA = ["#0ea5e9", "#f97316", "#8b5cf6", "#10b981", "#ec4899", "#eab308", "#ef4444", "#64748b"];

export function GoogleCalendarsManager({
  locale,
  initial,
  halls,
  configured,
  limit,
  status,
}: {
  locale: string;
  initial: KalendarzWKonfiguracji[];
  halls: { id: string; name: string }[];
  configured: boolean;
  /** null = pakiet bez limitu kalendarzy. */
  limit: number | null;
  /** Wynik powrotu z Google — przekazany w adresie przez callback. */
  status?: string;
}) {
  const [kalendarze, setKalendarze] = useState(initial);
  const [zapisuje, setZapisuje] = useState<string | null>(null);

  async function zapisz(id: string, patch: Parameters<typeof updateGoogleCalendar>[1]) {
    setZapisuje(id);
    try {
      const res = await updateGoogleCalendar(id, patch);
      if (res.ok) {
        setKalendarze((prev) =>
          prev.map((k) =>
            k.id === id
              ? {
                  ...k,
                  ...patch,
                  venueHallName:
                    patch.venueHallId !== undefined
                      ? (halls.find((h) => h.id === patch.venueHallId)?.name ?? null)
                      : k.venueHallName,
                }
              : k,
          ),
        );
      } else {
        toast.error(res.error ?? "Nie udało się zapisać");
      }
    } finally {
      setZapisuje(null);
    }
  }

  async function usun(id: string, label: string) {
    const res = await removeGoogleCalendar(id);
    if (res.ok) {
      setKalendarze((prev) => prev.filter((k) => k.id !== id));
      toast.success(`Odłączono „${label}”`);
    } else {
      toast.error(res.error ?? "Nie udało się odłączyć");
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-neutral-800">Kalendarze Google</h2>
        <span className="text-xs tabular-nums text-neutral-400">
          {limit == null
            ? `${kalendarze.length} podłączonych · bez limitu`
            : `${kalendarze.length} z ${limit} w tym pakiecie`}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Podłącz kalendarze, z których rezerwacje mają być widoczne na grafiku. Możesz podłączyć
        kilka kont — każdy kalendarz dostaje swój kolor. Synchronizacja działa w obie strony:
        rezerwacje z Google widać na grafiku, a przyjęcia z EventBoarda trafiają do
        przypisanego kalendarza.
      </p>

      {status && (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-xs ${
            status === "polaczono"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {status === "polaczono" && "Kalendarz podłączony. Nadaj mu nazwę i kolor poniżej."}
          {status === "limit" && "Osiągnięto limit kalendarzy w tym pakiecie — podnieś pakiet albo odłącz jeden z istniejących."}
          {status === "brak-dostepu" && "Nie masz dostępu do tej przestrzeni."}
          {status === "sesja" && "Sesja wygasła w trakcie autoryzacji. Zaloguj się i spróbuj ponownie."}
          {status === "blad" && "Autoryzacja nie powiodła się. Spróbuj ponownie."}
        </p>
      )}

      {!configured && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Serwer nie ma ustawionych <code>GOOGLE_CLIENT_ID</code> i <code>GOOGLE_CLIENT_SECRET</code> —
          podłączanie kalendarzy będzie działać dopiero po ich uzupełnieniu.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {kalendarze.length === 0 && (
          <p className="text-xs text-neutral-400">Nie podłączono jeszcze żadnego kalendarza.</p>
        )}

        {kalendarze.map((k) => (
          <div
            key={k.id}
            className="rounded-lg border border-neutral-200 p-3"
            style={{ borderLeftWidth: 3, borderLeftColor: k.color }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Input
                defaultValue={k.label}
                onBlur={(e) => {
                  const label = e.target.value.trim();
                  if (label && label !== k.label) zapisz(k.id, { label });
                }}
                className="h-8 max-w-[220px] text-sm"
                aria-label="Nazwa kalendarza"
              />

              <div className="flex items-center gap-1">
                {PALETA.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => zapisz(k.id, { color: c })}
                    aria-label={`Kolor ${c}`}
                    className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      k.color.toLowerCase() === c ? "border-neutral-800" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <select
                value={k.venueHallId ?? ""}
                onChange={(e) => zapisz(k.id, { venueHallId: e.target.value || null })}
                className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
                aria-label="Sala"
              >
                <option value="">Cały obiekt</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => zapisz(k.id, { isActive: !k.isActive })}
                  disabled={zapisuje === k.id}
                  title={k.isActive ? "Ukryj na grafiku" : "Pokaż na grafiku"}
                  className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
                >
                  {k.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => usun(k.id, k.label)}
                  title="Odłącz kalendarz"
                  className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-1.5 text-[11px] text-neutral-400">
              {k.isActive ? "Widoczny na grafiku" : "Ukryty — rezerwacje nie pojawiają się na grafiku"}
              {k.podlaczyl && ` · podłączył: ${k.podlaczyl}`}
            </p>
          </div>
        ))}
      </div>

      {!configured ? (
        <span
          className="mt-4 inline-flex cursor-not-allowed items-center gap-1.5 rounded-md bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-500"
          title="Najpierw uzupełnij GOOGLE_CLIENT_ID i GOOGLE_CLIENT_SECRET na serwerze"
          aria-disabled="true"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Podłącz kalendarz Google
        </span>
      ) : limit != null && kalendarze.length >= limit ? (
        <p className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          Wykorzystano limit {limit} kalendarzy w tym pakiecie. Odłącz jeden albo podnieś pakiet.
        </p>
      ) : (
        <a
          href={`/${locale}/api/google/oauth?locale=${locale}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Podłącz kalendarz Google
        </a>
      )}

      {halls.length === 0 && kalendarze.length > 0 && (
        <p className="mt-2 text-[11px] text-neutral-400">
          Nie masz jeszcze zdefiniowanych sal — kalendarze dotyczą całego obiektu.
        </p>
      )}
    </section>
  );
}
