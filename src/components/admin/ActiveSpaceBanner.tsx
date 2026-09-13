"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { exitSpace } from "@/lib/actions/admin.actions";

export function ActiveSpaceBanner({ name, locale }: { name: string; locale: string }) {
  const [busy, setBusy] = useState(false);
  async function handleExit() {
    setBusy(true);
    try {
      await exitSpace();
      window.location.href = `/${locale}/admin`;
    } catch {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-3 bg-amber-500 px-5 py-1.5 text-xs font-medium text-[#1a2332]">
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>
        Tryb serwisowy — pracujesz w przestrzeni: <b>{name}</b>
      </span>
      <Link href={`/${locale}/admin`} className="ml-auto rounded bg-white/30 px-2 py-0.5 hover:bg-white/50">
        Panel admina
      </Link>
      <button onClick={handleExit} disabled={busy} className="inline-flex items-center gap-1 rounded bg-[#1a2332] px-2 py-0.5 text-white hover:bg-[#0f172a] disabled:opacity-60">
        <LogOut className="h-3 w-3" /> Wyjdź
      </button>
    </div>
  );
}
