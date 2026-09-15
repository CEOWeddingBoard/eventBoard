"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { acceptTerms } from "@/lib/actions/legal.actions";

export function AcceptTermsForm({ locale }: { locale: string }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const res = await acceptTerms();
      if (res.ok) window.location.href = `/${locale}/app/dashboard`;
      else {
        toast.error(res.error ?? "Nie udało się");
        setBusy(false);
      }
    } catch {
      toast.error("Nie udało się");
      setBusy(false);
    }
  }

  // Stopka karty, nie osobny kafelek — akceptacja jest domknięciem tego samego
  // bloku co lista dokumentów, a nie kolejnym krokiem na stronie.
  return (
    <div className="border-t border-neutral-200 bg-neutral-50/60 px-6 py-5">
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300"
        />
        <span>Oświadczam, że zapoznałem/am się z powyższymi dokumentami i je akceptuję.</span>
      </label>
      <Button
        className="mt-4 w-full bg-[#0f172a] text-white hover:bg-[#1e293b] disabled:opacity-40"
        disabled={!checked || busy}
        onClick={submit}
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Akceptuję i przechodzę dalej
      </Button>
    </div>
  );
}
