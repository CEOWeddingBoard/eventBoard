"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HardHat, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listStaff,
  addStaff,
  updateStaff,
  removeStaff,
  type OsobaZPersonelu,
} from "@/lib/actions/staff.actions";
import { assigneeRoleLabel } from "@/lib/workflow-roles";

/**
 * Personel obiektu — ludzie bez kont w systemie.
 *
 * Świadomie osobna lista od „Konta zespołu”: kelner czy kucharz ma trafić na
 * obsadę przyjęcia i do agendy, ale nie musi się logować. Dzięki temu nie zajmuje
 * miejsca w limicie pakietu, a manager nie zakłada dziesięciu kont, z których
 * nikt nie korzysta.
 */
export function StaffManager({
  canManage,
  roleOptions,
}: {
  canManage: boolean;
  roleOptions: { value: string; label: string }[];
}) {
  const [osoby, setOsoby] = useState<OsobaZPersonelu[] | null>(null);
  const [form, setForm] = useState({ name: "", role: "STAFF", phone: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listStaff().then(setOsoby);
  }, []);

  async function dodaj() {
    const name = form.name.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await addStaff({ name, role: form.role, phone: form.phone || null });
      if (res.ok && res.osoba) {
        setOsoby((prev) => [...(prev ?? []), res.osoba!]);
        setForm({ name: "", role: form.role, phone: "" });
      } else {
        toast.error(res.error ?? "Nie udało się dodać");
      }
    } finally {
      setBusy(false);
    }
  }

  async function przelacz(o: OsobaZPersonelu) {
    const res = await updateStaff(o.id, { isActive: !o.isActive });
    if (res.ok) {
      setOsoby((prev) => (prev ?? []).map((x) => (x.id === o.id ? { ...x, isActive: !x.isActive } : x)));
    } else {
      toast.error(res.error ?? "Nie udało się zapisać");
    }
  }

  async function usun(o: OsobaZPersonelu) {
    const res = await removeStaff(o.id);
    if (res.ok) setOsoby((prev) => (prev ?? []).filter((x) => x.id !== o.id));
    else toast.error(res.error ?? "Nie udało się usunąć");
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800">
        <HardHat className="h-4 w-4 text-[#7a5f28]" />
        Personel (bez kont)
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Kelnerzy, kucharze, barmani — ludzie, których przypisujesz do obsady przyjęcia.
        Nie logują się do systemu i <b>nie liczą się do limitu kont</b> w pakiecie.
      </p>

      {osoby && osoby.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {osoby.map((o) => (
            <li
              key={o.id}
              className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-2 ${
                o.isActive ? "bg-neutral-50" : "bg-neutral-50/50 opacity-60"
              }`}
            >
              <span className="text-sm font-medium text-neutral-800">{o.name}</span>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                {assigneeRoleLabel(o.role)}
              </span>
              {o.phone && <span className="text-[11px] text-neutral-500">{o.phone}</span>}
              {!o.isActive && <span className="text-[10px] text-neutral-400">nieaktywny</span>}

              {canManage && (
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => przelacz(o)}
                    title={o.isActive ? "Ukryj na listach obsady" : "Przywróć"}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-200"
                  >
                    {o.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => usun(o)}
                    title="Usuń z personelu"
                    className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {osoby && osoby.length === 0 && (
        <p className="mt-3 text-xs text-neutral-400">Lista personelu jest pusta.</p>
      )}

      {canManage && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Imię i nazwisko"
            className="h-8 max-w-[220px] text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                dodaj();
              }
            }}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
            aria-label="Rola"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefon (opcjonalnie)"
            className="h-8 w-44 text-sm"
          />
          <Button type="button" size="sm" variant="outline" onClick={dodaj} disabled={busy || !form.name.trim()}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Dodaj osobę
          </Button>
        </div>
      )}
    </section>
  );
}
