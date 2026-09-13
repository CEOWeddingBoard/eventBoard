"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveNotificationSettings, type NotificationSettings as Settings } from "@/lib/actions/team.actions";

export function NotificationSettings({ initial, canManage }: { initial: Settings; canManage: boolean }) {
  const [s, setS] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await saveNotificationSettings(s);
      if (res.ok) toast.success("Zapisano ustawienia powiadomień");
      else toast.error(res.error ?? "Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800">
        <Bell className="h-4 w-4 text-[#7a5f28]" /> Powiadomienia o akceptacji kroku
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Gdy krok procesu czeka na akceptację, a event zbliża się w zadanym wyprzedzeniu, wyślemy przypomnienie
        do osób z rolą akceptującą (e-mail) i na numer obiektu (SMS).
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          Wyślij na
          <Input
            type="number" min="0" max="365" disabled={!canManage}
            className="h-8 w-20 text-sm"
            value={s.daysBefore}
            onChange={(e) => setS({ ...s, daysBefore: parseInt(e.target.value || "0", 10) })}
          />
          dni przed eventem
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" disabled={!canManage} checked={s.email} onChange={(e) => setS({ ...s, email: e.target.checked })} className="rounded" />
          E-mail
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" disabled={!canManage} checked={s.sms} onChange={(e) => setS({ ...s, sms: e.target.checked })} className="rounded" />
          SMS (na numer obiektu)
        </label>
      </div>

      {canManage ? (
        <Button size="sm" className="mt-4 bg-[#0f172a] text-white hover:bg-[#1e293b]" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Zapisz ustawienia
        </Button>
      ) : (
        <p className="mt-3 text-[11px] text-neutral-400">Tylko administrator może zmieniać te ustawienia.</p>
      )}
    </section>
  );
}
