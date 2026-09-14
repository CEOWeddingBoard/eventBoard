"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eksportujEventDoGoogle } from "@/lib/actions/google-calendar.actions";

/**
 * Wysłanie przyjęcia do Google Calendar.
 *
 * Kalendarz docelowy wynika z mapowania sali w Konfiguracji — przycisk nie
 * pyta, do którego kalendarza, bo to ustawienie obiektu, nie decyzja
 * podejmowana przy każdym przyjęciu.
 */
export function ExportEventToGoogle({ eventId, juzWyslany }: { eventId: string; juzWyslany: boolean }) {
  const [busy, setBusy] = useState(false);

  async function wyslij() {
    setBusy(true);
    try {
      const res = await eksportujEventDoGoogle(eventId);
      if (res.ok) {
        toast.success(
          res.kalendarz ? `Zapisano w kalendarzu „${res.kalendarz}”` : "Zapisano w Google Calendar",
        );
      } else {
        toast.error(res.error ?? "Nie udało się zapisać");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={wyslij} disabled={busy}>
      {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />}
      {juzWyslany ? "Zaktualizuj w Google" : "Dodaj do Google Calendar"}
    </Button>
  );
}
