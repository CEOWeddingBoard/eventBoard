"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
  timeZone?: string;
}

interface ParsedGoogleEvent {
  googleEventId: string;
  summary: string;
  description?: string;
  location?: string;
  startDate: string;
  isAllDay: boolean;
  htmlLink?: string;
  existingOurId?: string;
}

interface GoogleCalendarImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  onImported?: () => void;
}

export function GoogleCalendarImportDialog({
  open,
  onOpenChange,
  locale,
  onImported,
}: GoogleCalendarImportDialogProps) {
  const [step, setStep] = useState<"calendars" | "events" | "importing">("calendars");
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [events, setEvents] = useState<ParsedGoogleEvent[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("primary");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const reset = useCallback(() => {
    setStep("calendars");
    setCalendars([]);
    setEvents([]);
    setSelectedCalendar("primary");
    setSelectedEvents(new Set());
    setImportedCount(0);
  }, []);

  useEffect(() => {
    if (open) {
      reset();
      loadCalendars();
    }
  }, [open]);

  const loadCalendars = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/google/calendars`, { credentials: "include" });
      const data = await res.json();
      if (data.calendars) {
        setCalendars(data.calendars);
        const primary = data.calendars.find((c: GoogleCalendar) => c.primary);
        if (primary) setSelectedCalendar(primary.id);
      }
    } catch {
      toast.error("Nie udało się pobrać kalendarzy");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/${locale}/api/google/calendar-events?calendarId=${encodeURIComponent(selectedCalendar)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.events) {
        const notImported = data.events.filter(
          (e: ParsedGoogleEvent) => !e.existingOurId
        );
        setEvents(notImported);
        setStep("events");
      }
    } catch {
      toast.error("Nie udało się pobrać wydarzeń");
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map((e) => e.googleEventId)));
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");
    const toImport = events.filter((e) => selectedEvents.has(e.googleEventId));

    try {
      const res = await fetch(`/${locale}/api/google/import-events`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: toImport }),
      });
      const data = await res.json();
      if (data.ok) {
        setImportedCount(data.count ?? toImport.length);
        toast.success(`Zaimportowano ${data.count ?? toImport.length} wydarzeń`);
        onImported?.();
      } else {
        toast.error(data.error ?? "Błąd importu");
      }
    } catch {
      toast.error("Błąd importu");
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    if (d.length === 10) return new Date(d).toLocaleDateString(locale, { dateStyle: "medium" });
    return new Date(d).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-olive" />
            Importuj wydarzenia z Google Calendar
          </DialogTitle>
          <DialogDescription>
            {step === "calendars" && "Wybierz kalendarz źródłowy"}
            {step === "events" && `Wybierz wydarzenia do zaimportowania (${events.length} dostępnych)`}
            {step === "importing" && "Importowanie..."}
          </DialogDescription>
        </DialogHeader>

        {step === "calendars" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-olive" />
              </div>
            ) : (
              <>
                <Label>Kalendarz źródłowy</Label>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="elegant-input h-11 w-full"
                >
                  {calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary} {cal.primary ? "(główny)" : ""}
                    </option>
                  ))}
                </select>
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Anuluj
                  </Button>
                  <Button onClick={loadEvents} disabled={!selectedCalendar}>
                    Pobierz wydarzenia
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}

        {step === "events" && (
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-ink-muted py-4 text-center">
                Brak nowych wydarzeń do zaimportowania z tego kalendarza.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Button variant="ghost" size="sm" onClick={toggleAll}>
                    {selectedEvents.size === events.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                  </Button>
                  <Badge variant="secondary">
                    {selectedEvents.size} / {events.length} wybrano
                  </Badge>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {events.map((ev) => (
                    <label
                      key={ev.googleEventId}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEvents.has(ev.googleEventId)
                          ? "border-olive bg-olive-muted/20"
                          : "border-olive/10 hover:border-olive/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(ev.googleEventId)}
                        onChange={() => toggleEvent(ev.googleEventId)}
                        className="mt-1 h-4 w-4 rounded border-olive/40 accent-olive"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink text-sm truncate">{ev.summary}</p>
                        <p className="text-xs text-ink-muted">
                          {formatDate(ev.startDate)}
                          {ev.isAllDay && " (całodniowe)"}
                        </p>
                        {ev.location && (
                          <p className="text-xs text-ink-muted truncate">{ev.location}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("calendars")}>
                Wstecz
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedEvents.size === 0}
              >
                Importuj ({selectedEvents.size})
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            {importing ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-olive" />
                <p className="text-ink-muted">Importowanie wydarzeń...</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-12 w-12 text-olive" />
                <p className="text-ink font-medium">
                  Zaimportowano {importedCount} wydarzeń
                </p>
                <Button onClick={() => onOpenChange(false)}>Zamknij</Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
