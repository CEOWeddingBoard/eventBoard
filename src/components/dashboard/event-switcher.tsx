"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EventOption = { id: string; name: string; date: string };

export function EventSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/${locale}/api/events/list`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setActiveId(data[0].id);
        }
      })
      .catch(() => {});
  }, [locale]);

  if (events.length < 2) return null;

  const onChange = async (eventId: string) => {
    setActiveId(eventId);
    setLoading(true);
    try {
      await fetch(`/${locale}/api/events/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="hidden sm:inline">Wesele:</span>
      <select
        value={activeId}
        disabled={loading}
        onChange={(e) => void onChange(e.target.value)}
        className="rounded-lg border border-olive/25 bg-white/90 px-2 py-1 text-xs text-ink max-w-[180px] truncate"
      >
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name}
          </option>
        ))}
      </select>
    </label>
  );
}
