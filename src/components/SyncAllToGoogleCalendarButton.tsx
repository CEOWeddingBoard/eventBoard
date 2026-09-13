"use client";

import { CalendarPlus, Loader2 } from "lucide-react";
import { useState } from "react";

interface SyncAllToGoogleCalendarButtonProps {
  locale: string;
  label?: string;
  className?: string;
}

export function SyncAllToGoogleCalendarButton({
  locale,
  label = "Synchronizuj wszystkie z Google Kalendarzem",
  className,
}: SyncAllToGoogleCalendarButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/calendar/export`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Zaloguj się");
        if (res.status === 404) throw new Error("Brak wydarzenia");
        throw new Error("Błąd eksportu");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "wesele.ics";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Nie udało się pobrać kalendarza.");
    } finally {
      setLoading(false);
    }
  }

  const baseClass =
    "inline-flex items-center gap-2 rounded-xl border border-olive/30 bg-olive-muted px-4 py-2.5 text-sm font-medium text-olive-light hover:bg-olive/20 hover:border-olive/50 transition-all duration-300 disabled:opacity-60";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className ?? baseClass}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CalendarPlus className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
