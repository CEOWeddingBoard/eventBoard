"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HardHat, Plus, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listEventStaff,
  listStaff,
  assignStaffToEvent,
  removeStaffFromEvent,
  type ObsadaPozycja,
  type OsobaZPersonelu,
} from "@/lib/actions/staff.actions";
import { assigneeRoleLabel } from "@/lib/workflow-roles";

/**
 * Obsada przyjęcia — kto pracuje i od której godziny.
 *
 * Osoby pochodzą z listy personelu obiektu i NIE mają kont w systemie:
 * kelner nie musi się logować, żeby trafić na obsadę i do agendy. Konta
 * zakłada się tylko tym, którzy pracują w panelu — i tylko one liczą się
 * do limitu pakietu.
 */
export function EventStaffPanel({ eventId, canEdit }: { eventId: string; canEdit: boolean }) {
  const [obsada, setObsada] = useState<ObsadaPozycja[]>([]);
  const [personel, setPersonel] = useState<OsobaZPersonelu[]>([]);
  const [wybrany, setWybrany] = useState("");
  const [od, setOd] = useState("");
  const [doKiedy, setDoKiedy] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listEventStaff(eventId).then(setObsada);
    if (canEdit) listStaff().then((l) => setPersonel(l.filter((o) => o.isActive)));
  }, [eventId, canEdit]);

  const wolni = personel.filter((o) => !obsada.some((p) => p.staffId === o.id));

  async function dodaj() {
    if (!wybrany) return;
    setBusy(true);
    try {
      const res = await assignStaffToEvent(eventId, {
        staffId: wybrany,
        startTime: od || null,
        endTime: doKiedy || null,
      });
      if (res.ok) {
        setObsada(await listEventStaff(eventId));
        setWybrany("");
        setOd("");
        setDoKiedy("");
      } else {
        toast.error(res.error ?? "Nie udało się dodać do obsady");
      }
    } finally {
      setBusy(false);
    }
  }

  async function usun(id: string) {
    const res = await removeStaffFromEvent(id);
    if (res.ok) setObsada((prev) => prev.filter((p) => p.id !== id));
    else toast.error(res.error ?? "Nie udało się usunąć");
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800">
        <HardHat className="h-4 w-4 text-[#7a5f28]" />
        Obsada przyjęcia
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Kto pracuje na tym przyjęciu. Te osoby nie potrzebują kont w systemie.
      </p>

      {obsada.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {obsada.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-2">
              <span className="text-sm font-medium text-neutral-800">{p.name}</span>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                {assigneeRoleLabel(p.role)}
              </span>
              {(p.startTime || p.endTime) && (
                <span className="font-mono text-[11px] text-neutral-500">
                  {p.startTime ?? "?"}–{p.endTime ?? "?"}
                </span>
              )}
              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800"
                >
                  <Phone className="h-3 w-3" />
                  {p.phone}
                </a>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => usun(p.id)}
                  aria-label={`Usuń ${p.name} z obsady`}
                  className="ml-auto rounded p-1 text-neutral-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-neutral-400">Nikt jeszcze nie przypisany.</p>
      )}

      {canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={wybrany}
            onChange={(e) => setWybrany(e.target.value)}
            className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
            aria-label="Osoba z personelu"
          >
            <option value="">— wybierz osobę —</option>
            {wolni.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {assigneeRoleLabel(o.role)}
              </option>
            ))}
          </select>
          <Input
            type="time"
            value={od}
            onChange={(e) => setOd(e.target.value)}
            className="h-8 w-28 text-xs"
            aria-label="Od godziny"
          />
          <Input
            type="time"
            value={doKiedy}
            onChange={(e) => setDoKiedy(e.target.value)}
            className="h-8 w-28 text-xs"
            aria-label="Do godziny"
          />
          <Button type="button" size="sm" variant="outline" onClick={dodaj} disabled={busy || !wybrany}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Dodaj do obsady
          </Button>

          {personel.length === 0 && (
            <p className="w-full text-[11px] text-neutral-400">
              Lista personelu jest pusta — dodaj ludzi w zakładce Zespół.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
