"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Copy, Check, Smartphone, Monitor, Download } from "lucide-react";

interface CalendarSubscribeSectionProps {
  calendarFeedToken: string;
  eventName: string;
  locale: string;
}

export function CalendarSubscribeSection({
  calendarFeedToken,
  eventName,
  locale,
}: CalendarSubscribeSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const feedUrl = `${window.location.origin}/${locale}/api/calendar/feed/${calendarFeedToken}`;
  const googleSubscribeUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(feedUrl)}`;

  const copyFeedUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = feedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [feedUrl]);

  const handleDownloadIcs = useCallback(() => {
    window.open(`/${locale}/api/calendar/export?eventName=${encodeURIComponent(eventName)}`, "_blank");
  }, [locale, eventName]);

  return (
    <section className="rounded-2xl border border-olive/20 bg-wedding-card p-6 shadow-wedding">
      <h2 className="font-serif text-lg font-medium text-ink mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-olive" />
        Kalendarz wydarzenia
      </h2>
      <p className="text-sm text-ink-muted mb-4">
        Subskrybuj kalendarz w swojej aplikacji — będzie zawsze aktualny, bez konieczności pobierania plików e-mailem.
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        <a
          href={googleSubscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-olive/30 text-ink hover:bg-olive-muted text-sm font-medium transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Dodaj do Google Calendar
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadIcs}
        >
          <Download className="mr-1 h-4 w-4" />
          Pobierz plik .ics
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Input
          className="h-9 text-sm font-mono bg-olive-muted/20"
          value={feedUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={copyFeedUrl}
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-sm text-olive hover:underline"
      >
        {showInstructions ? "Ukryj instrukcje" : "Jak subskrybować w innych aplikacjach?"}
      </button>

      {showInstructions && (
        <div className="mt-3 space-y-2 text-sm text-ink-muted">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Apple Calendar (iPhone/Mac):</strong> Skopiuj link powyżej. Otwórz Kalendarz → Plik → Nowa subskrypcja kalendarza → wklej URL.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Monitor className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Outlook:</strong> Skopiuj link powyżej. Otwórz Kalendarz → Dodaj kalendarz → Subskrybuj z Internetu → wklej URL.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Monitor className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Inne aplikacje:</strong> Każda aplikacja kalendarza obsługująca format iCal (standard ICS) może subskrybować ten link. Poszukaj opcji "Dodaj przez URL" lub "Subskrybuj kalendarz".
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
