"use client";

import { useEffect, useState } from "react";
import { History, Loader2, ArrowRight } from "lucide-react";
import { listGoogleAuditLog, type WpisDziennika } from "@/lib/actions/google-calendar.actions";

/**
 * Dziennik operacji na kalendarzach Google.
 *
 * Zapis w cudzym kalendarzu jest dla obiektu nieodwracalny: ktoś patrzy potem
 * na termin i musi wiedzieć, skąd się wziął albo czemu zniknął. Dlatego każdy
 * wiersz pokazuje OBA konta — osobę z EventBoarda i adres Google, na którym
 * operacja wylądowała. Brak osoby znaczy „zrobiła to synchronizacja po zapisie
 * przyjęcia", i tak jest opisany, zamiast zostawiać pustą komórkę.
 */

const OPIS_AKCJI: Record<string, { label: string; klasa: string }> = {
  CREATE: { label: "dodano wpis", klasa: "bg-emerald-50 text-emerald-700" },
  UPDATE: { label: "zmieniono wpis", klasa: "bg-blue-50 text-blue-700" },
  DELETE: { label: "usunięto wpis", klasa: "bg-red-50 text-red-700" },
  CONNECT: { label: "podłączono kalendarz", klasa: "bg-neutral-100 text-neutral-700" },
  DISCONNECT: { label: "odłączono kalendarz", klasa: "bg-neutral-100 text-neutral-700" },
  MODE_CHANGE: { label: "zmieniono poziom dostępu", klasa: "bg-amber-50 text-amber-800" },
};

function kiedyPl(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GoogleAuditLog() {
  const [wpisy, setWpisy] = useState<WpisDziennika[] | null>(null);

  useEffect(() => {
    listGoogleAuditLog().then(setWpisy);
  }, []);

  return (
    <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-800">
        <History className="h-4 w-4 text-[#7a5f28]" />
        Dziennik zmian w kalendarzach
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        Każda operacja z obydwoma kontami: kto działał w EventBoardzie i na jakim koncie Google
        to wylądowało.
      </p>

      {wpisy === null && (
        <p className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Wczytuję…
        </p>
      )}

      {wpisy?.length === 0 && (
        <p className="mt-3 text-xs text-neutral-400">
          Nic się jeszcze nie wydarzyło — dziennik zapełni się przy pierwszej synchronizacji.
        </p>
      )}

      {wpisy && wpisy.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[10px] uppercase tracking-wide text-neutral-400">
                <th className="py-2 pr-3 font-medium">Kiedy</th>
                <th className="py-2 pr-3 font-medium">Co</th>
                <th className="py-2 pr-3 font-medium">Czego dotyczy</th>
                <th className="py-2 pr-3 font-medium">Kto (EventBoard)</th>
                <th className="py-2 font-medium">Konto Google</th>
              </tr>
            </thead>
            <tbody>
              {wpisy.map((w) => {
                const akcja = OPIS_AKCJI[w.action] ?? {
                  label: w.action,
                  klasa: "bg-neutral-100 text-neutral-700",
                };
                return (
                  <tr key={w.id} className="border-b border-neutral-100 last:border-0">
                    <td className="whitespace-nowrap py-2 pr-3 text-neutral-500 tabular-nums">
                      {kiedyPl(w.kiedy)}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${akcja.klasa}`}>
                        {akcja.label}
                      </span>
                      {!w.ok && (
                        <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                          błąd
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-neutral-700">
                      {w.subject ?? "—"}
                      {w.message && (
                        <span className="mt-0.5 block text-[11px] text-neutral-400">{w.message}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-neutral-600">
                      {w.ktoEventBoard ?? (
                        <span className="text-neutral-400">synchronizacja automatyczna</span>
                      )}
                    </td>
                    <td className="py-2 text-neutral-600">
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 text-neutral-300" />
                        <span className="min-w-0">
                          {w.kontoGoogle ?? w.kalendarz ?? "—"}
                          {w.kontoGoogle && w.kalendarz && (
                            <span className="block text-[11px] text-neutral-400">{w.kalendarz}</span>
                          )}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
