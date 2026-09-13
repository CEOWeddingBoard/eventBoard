"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Calendar, Loader2, Trash2, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleCalendarSectionProps {
  locale: string;
  connected: boolean;
  canDisconnect?: boolean;
}

interface SyncedEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  ourId: string;
  htmlLink?: string;
}

export function GoogleCalendarSection({
  locale,
  connected: initialConnected,
  canDisconnect = true,
}: GoogleCalendarSectionProps) {
  const t = useTranslations("GoogleCalendar");
  const [connected, setConnected] = useState(initialConnected);
  const [events, setEvents] = useState<SyncedEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!connected) return;
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/google/events`, { credentials: "include" });
      const data = await res.json();
      if (data.events) setEvents(data.events);
      if (data.error) setError(data.error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (connected) fetchEvents();
  }, [connected, locale]);

  const handleConnect = () => {
    window.location.href = `/${locale}/api/google/oauth?locale=${locale}`;
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/google/disconnect`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setConnected(false);
        setEvents([]);
      } else {
        const data = await res.json();
        setError(data.error ?? "Błąd");
      }
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/google/sync`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        await fetchEvents();
      } else {
        setError(data.error ?? "Błąd synchronizacji");
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteFromCalendar = async (googleEventId: string, ourId: string) => {
    setDeletingId(googleEventId);
    setError(null);
    try {
      const res = await fetch(`/${locale}/api/google/events/delete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleEventId, ourId }),
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== googleEventId));
      } else {
        const data = await res.json();
        setError(data.error ?? "Błąd usuwania");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    if (d.length === 10) return date.toLocaleDateString(locale, { dateStyle: "medium" });
    return date.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  };

  if (!connected) {
    return (
      <section className="rounded-2xl border border-olive/20 bg-wedding-card p-6 shadow-wedding">
        <p className="text-ink-muted mb-4">
          {t("connectDescription")}
        </p>
        <Button
          type="button"
          onClick={handleConnect}
          className="inline-flex items-center gap-2 bg-white/60 border border-olive/30 text-ink hover:bg-olive-muted"
        >
          <Calendar className="h-4 w-4" />
          {t("connectButton")}
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-olive/20 bg-wedding-card p-6 shadow-wedding">
        <h2 className="font-serif text-lg font-medium text-ink mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-olive" />
          {t("syncTitle")}
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          {t("syncDescription")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {syncing ? t("syncing") : t("syncNow")}
          </Button>
          {canDisconnect && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? t("disconnecting") : t("disconnect")}
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-olive/20 bg-wedding-card p-6 shadow-wedding">
        <h2 className="font-serif text-lg font-medium text-ink mb-4 flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-olive" />
          {t("previewTitle")}
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          {t("previewDescription")}
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loadingEvents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-olive" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-ink-muted text-sm py-4">
            {t("noEvents")}
          </p>
        ) : (
          <ul className="divide-y divide-olive/15">
            {events.map((ev) => (
              <li key={ev.id} className="py-4 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink truncate">{ev.summary}</p>
                  <p className="text-sm text-ink-muted">
                    {formatDate(ev.start)}
                    {ev.end && ev.end !== ev.start && ` – ${formatDate(ev.end)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ev.htmlLink && (
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-olive hover:underline text-sm inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("openInGoogle")}
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-ink-muted hover:text-destructive"
                    disabled={deletingId === ev.id}
                    onClick={() => handleDeleteFromCalendar(ev.id, ev.ourId)}
                  >
                    {deletingId === ev.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="ml-1">{t("removeFromCalendar")}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
