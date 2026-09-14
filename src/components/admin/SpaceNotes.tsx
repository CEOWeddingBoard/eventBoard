"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addSpaceNote,
  removeSpaceNote,
  listSpaceNotes,
  type NotatkaKlienta,
} from "@/lib/actions/admin.actions";
import { RODZAJE_NOTATEK } from "@/lib/admin-notes";

/**
 * Dziennik notatek o kliencie.
 *
 * Z tych wpisów wiadomo, w którą stronę rozwijać produkt — czego klienci
 * proszą, na czym się potykają, co im obiecaliśmy. Dlatego notatki się
 * dopisuje, a nie nadpisuje: historia jest tu treścią.
 */

const KOLOR: Record<string, string> = {
  UWAGA: "bg-neutral-100 text-neutral-600",
  POMYSL: "bg-blue-50 text-blue-700",
  PROBLEM: "bg-red-50 text-red-700",
  USTALENIE: "bg-emerald-50 text-emerald-700",
};

const ETYKIETA = Object.fromEntries(RODZAJE_NOTATEK.map((r) => [r.value, r.label]));

export function SpaceNotes({ orgId }: { orgId: string }) {
  const [notatki, setNotatki] = useState<NotatkaKlienta[] | null>(null);
  const [tresc, setTresc] = useState("");
  const [rodzaj, setRodzaj] = useState<string>("UWAGA");
  const [busy, setBusy] = useState(false);

  async function wczytaj() {
    if (notatki !== null) return;
    setNotatki(await listSpaceNotes(orgId));
  }

  async function dodaj() {
    const content = tresc.trim();
    if (!content) return;
    setBusy(true);
    try {
      const res = await addSpaceNote(orgId, { kind: rodzaj, content });
      if (res.ok && res.notatka) {
        setNotatki((prev) => [res.notatka!, ...(prev ?? [])]);
        setTresc("");
      } else {
        toast.error(res.error ?? "Nie udało się zapisać notatki");
      }
    } finally {
      setBusy(false);
    }
  }

  async function usun(id: string) {
    const res = await removeSpaceNote(id);
    if (res.ok) setNotatki((prev) => (prev ?? []).filter((n) => n.id !== id));
    else toast.error(res.error ?? "Nie udało się usunąć");
  }

  return (
    <div className="border-b border-neutral-200 py-3" onMouseEnter={wczytaj}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold text-neutral-600">Notatki i pomysły:</span>
        {notatki && <span className="text-[11px] text-neutral-400">{notatki.length}</span>}
      </div>

      <div className="mt-2 flex flex-wrap items-start gap-2">
        <select
          value={rodzaj}
          onChange={(e) => setRodzaj(e.target.value)}
          className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
          aria-label="Rodzaj notatki"
        >
          {RODZAJE_NOTATEK.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <textarea
          value={tresc}
          onFocus={wczytaj}
          onChange={(e) => setTresc(e.target.value)}
          placeholder="np. prosi o eksport listy gości do PDF — wraca drugi raz"
          rows={2}
          className="min-w-[280px] flex-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={dodaj} disabled={busy || !tresc.trim()}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
          Dopisz
        </Button>
      </div>

      {notatki && notatki.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {notatki.map((n) => (
            <li key={n.id} className="flex items-start gap-2 rounded-md bg-neutral-50 px-2.5 py-2">
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${KOLOR[n.kind] ?? KOLOR.UWAGA}`}>
                {ETYKIETA[n.kind] ?? n.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-xs text-neutral-700">{n.content}</p>
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  {new Date(n.createdAt).toLocaleDateString("pl-PL")}
                  {n.autor && ` · ${n.autor}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => usun(n.id)}
                aria-label="Usuń notatkę"
                className="shrink-0 rounded p-1 text-neutral-300 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {notatki && notatki.length === 0 && (
        <p className="mt-2 text-[11px] text-neutral-400">
          Brak notatek. Zapisuj tu prośby i potknięcia klienta — z tego wychodzi plan rozwoju.
        </p>
      )}
    </div>
  );
}
