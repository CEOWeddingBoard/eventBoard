"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Link2, Copy, Check, Heart, CalendarDays, Users, FileText, Edit2, MoreHorizontal, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EVENT_STATUS_OPTIONS, eventStatusFilterLabel } from "@/lib/event-status";
import { createEvent, updateEvent, duplicateEvent } from "@/lib/actions/event.actions";
import { EventClientLinkButton } from "@/components/eventboard/event-client-link-button";
import { listEventTypes } from "@/lib/actions/event-type.actions";
import { sprawdzTerminEventu } from "@/lib/actions/event.actions";
import type { Kolizja } from "@/lib/kolizje-terminow";

type EventType = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  customFields: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
  }>;
  agendaTemplateId: string | null;
  agendaTemplateName: string | null;
  isSystem: boolean;
};

type EventItem = {
  id: string;
  name: string;
  date: string;
  estimatedGuestCount: number | null;
  isWedding: boolean;
  organizerName: string | null;
  occasionLabel: string | null;
  status: string;
  workflowName: string | null;
  workflowStage: string | null;
  clientWorkflowStatus: string;
  categoryName: string | null;
  categoryColor: string | null;
  hallName: string | null;
  venueName: string | null;
};

type VenueHalls = {
  venueId: string;
  venueName: string;
  halls: { id: string; name: string; capacity: number }[];
};

const STATUS_OPTIONS = EVENT_STATUS_OPTIONS;

const FILTERS = [
  { value: "ALL", label: "Wszystkie" },
  ...["DRAFT", "CONFIRMED", "COMPLETED", "ARCHIVED"].map((v) => ({
    value: v,
    label: eventStatusFilterLabel(v),
  })),
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function EventBoardEventsList({
  locale,
  events,
  halls = [],
  canEdit = true,
}: {
  locale: string;
  events: EventItem[];
  halls?: VenueHalls[];
  /** Poziom „Podgląd" — chowamy akcje zapisu zamiast pokazywać przyciski, które zawsze kończą się błędem. */
  canEdit?: boolean;
}) {
  const hallCount = halls.reduce((sum, v) => sum + v.halls.length, 0);
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [linkResult, setLinkResult] = useState<{ url: string; pin: string } | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const visibleEvents = filter === "ALL" ? events : events.filter((e) => e.status === filter);

  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", guests: "", isWedding: false, hallId: "" });
  
  const [editOpen, setEditOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", date: "", guests: "", hallId: "" });
  const [editing, setEditing] = useState(false);

  const [kolizje, setKolizje] = useState<Kolizja[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (newOpen) {
      listEventTypes().then(setEventTypes);
    }
  }, [newOpen]);

  // Ostrzeżenie o zajętym terminie pojawia się PRZED kliknięciem „Utwórz”,
  // a nie po. Podwójna rezerwacja sali kończy się odwoływaniem przyjęcia.
  useEffect(() => {
    if (!newOpen || !form.date) {
      setKolizje([]);
      return;
    }
    let aktualne = true;
    sprawdzTerminEventu({ date: form.date, hallId: form.hallId || null }).then((k) => {
      if (aktualne) setKolizje(k);
    });
    return () => {
      aktualne = false;
    };
  }, [newOpen, form.date, form.hallId]);

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    const selectedType = eventTypes.find((t) => t.id === typeId);
    if (selectedType) {
      const defaults: Record<string, string> = {};
      selectedType.customFields.forEach((f) => {
        defaults[f.key] = "";
      });
      setCustomFieldValues(defaults);
    } else {
      setCustomFieldValues({});
    }
  };

  const handleWeddingToggle = async (event: EventItem) => {
    setBusyId(event.id);
    try {
      await updateEvent(event.id, { isWedding: !event.isWedding });
      toast.success(event.isWedding ? "Zdjęto flagę wesela" : "Oznaczono jako wesele");
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (event: EventItem, status: string) => {
    setBusyId(event.id);
    try {
      await updateEvent(event.id, { status });
      toast.success("Status zmieniony");
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (event: EventItem) => {
    setBusyId(event.id);
    try {
      await duplicateEvent(event.id);
      toast.success("Event skopiowany");
      router.refresh();
    } catch {
      toast.error("Nie udało się skopiować eventu");
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerateLink = async (event: EventItem) => {
    const pin = prompt("Ustaw PIN do linku (4–6 cyfr):", String(Math.floor(1000 + Math.random() * 9000)));
    if (!pin) return;
    setGeneratingLink(true);
    setLinkResult(null);
    try {
      const res = await fetch(`/${locale}/api/events/${event.id}/partner-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nie udało się wygenerować linku");
      setLinkResult({ url: data.url, pin: data.pin });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się wygenerować linku");
    } finally {
      setGeneratingLink(false);
    }
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) {
      toast.error("Podaj nazwę i datę");
      return;
    }
    setCreating(true);
    try {
      const selectedType = eventTypes.find((t) => t.id === selectedTypeId);
      const missingRequired = selectedType?.customFields.some(
        (field) => field.required && !customFieldValues[field.key]?.trim(),
      );
      if (missingRequired) {
        toast.error("Uzupełnij wymagane pola typu eventu");
        setCreating(false);
        return;
      }

      await createEvent({
        name: form.name.trim(),
        date: form.date,
        estimatedGuestCount: form.guests ? parseInt(form.guests, 10) : undefined,
        isWedding: form.isWedding,
        eventType: form.isWedding ? "WEDDING" : "OTHER",
        categoryId: selectedTypeId || undefined,
        hallId: form.hallId || undefined,
        customFieldValues,
        organizerName: form.name.trim(),
      });
      toast.success("Event utworzony");
      setNewOpen(false);
      setForm({ name: "", date: "", guests: "", isWedding: false, hallId: "" });
      setSelectedTypeId("");
      setCustomFieldValues({});
      router.refresh();
    } catch {
      toast.error("Nie udało się utworzyć eventu");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (event: EventItem) => {
    setEditEvent(event);
    setEditForm({
      name: event.name,
      date: event.date.split("T")[0],
      guests: event.estimatedGuestCount?.toString() || "",
      hallId: halls.flatMap((v) => v.halls).find((h) => h.name === event.hallName)?.id ?? "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEvent || !editForm.name.trim() || !editForm.date) {
      toast.error("Podaj nazwę i datę");
      return;
    }
    setEditing(true);
    try {
      await updateEvent(editEvent.id, {
        name: editForm.name.trim(),
        date: editForm.date,
        estimatedGuestCount: editForm.guests ? parseInt(editForm.guests, 10) : undefined,
        hallId: editForm.hallId,
      });
      toast.success("Event zaktualizowany");
      setEditOpen(false);
      setEditEvent(null);
      router.refresh();
    } catch {
      toast.error("Nie udało się zaktualizować eventu");
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-neutral-800">Eventy</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Zarządzaj imprezami. Flaga „Wesele” odblokowuje portal dla pary.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowy event
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-neutral-200">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              filter === f.value
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {f.label}
            {f.value !== "ALL" && (
              <span className="ml-1 text-neutral-400">
                {events.filter((e) => e.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="border border-neutral-200 text-center py-16 text-sm text-neutral-400">
          {canEdit ? "Brak eventów. Kliknij „Nowy event” aby utworzyć pierwszy." : "Brak eventów."}
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="border border-neutral-200 text-center py-16 text-sm text-neutral-400">
          Brak eventów w tym filtrze.
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 bg-white">
          {visibleEvents.map((event) => (
            <div key={event.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Serce oznacza wyłącznie wesele. Wcześniej stało przy każdym
                    evencie i sugerowało, że komunia czy gala też nim są. */}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                    event.isWedding ? "bg-rose-50 text-rose-500" : "bg-neutral-100 text-neutral-500"
                  }`}
                  title={event.isWedding ? "Wesele — portal dla pary włączony" : event.categoryName ?? "Wydarzenie"}
                >
                  {event.isWedding ? <Heart className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{event.name}</p>
                  <p className="text-xs text-neutral-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(event.date)}
                    </span>
                    {event.estimatedGuestCount != null && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Users className="h-3 w-3" />
                        {event.estimatedGuestCount} os.
                      </span>
                    )}
                    {event.hallName && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap" title={event.venueName ?? undefined}>
                        <DoorOpen className="h-3 w-3" />
                        {event.hallName}
                      </span>
                    )}
                    {event.categoryName && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: `${event.categoryColor ?? "#64748b"}1a`,
                          color: event.categoryColor ?? "#475569",
                        }}
                      >
                        {event.categoryName}
                      </span>
                    )}
                    {event.occasionLabel && <span>{event.occasionLabel}</span>}
                    {event.clientWorkflowStatus === "MENU_SUBMITTED" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Czeka na decyzję
                      </span>
                    ) : event.workflowStage ? (
                      <span
                        className="inline-flex max-w-[16rem] items-center gap-1 truncate whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                        title={event.workflowStage}
                      >
                        {event.workflowStage}
                      </span>
                    ) : event.workflowName ? (
                      <span
                        className="max-w-[16rem] truncate whitespace-nowrap rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                        title={event.workflowName}
                      >
                        {event.workflowName}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <Select
                value={event.status}
                onValueChange={(v) => handleStatusChange(event, v)}
                disabled={busyId === event.id}
              >
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Jedno działanie główne; reszta pod menu, żeby wiersz nie był
                  ścianą równorzędnych przycisków. */}
              <Link
                href={`/${locale}/app/events/${event.id}`}
                className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded inline-flex items-center gap-1 font-medium"
                title="Otwórz event"
              >
                <FileText className="h-3.5 w-3.5" />
                Otwórz
              </Link>

              {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-neutral-500"
                    disabled={busyId === event.id}
                    aria-label={`Więcej działań — ${event.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => handleOpenEdit(event)}>
                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                    Edytuj
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(event)}>
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplikuj
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleWeddingToggle(event)}>
                    <Heart className="mr-2 h-3.5 w-3.5" />
                    {event.isWedding ? "Zdejmij flagę wesela" : "Oznacz jako wesele"}
                  </DropdownMenuItem>
                  {event.isWedding && (
                    <DropdownMenuItem
                      onClick={() => {
                        setLinkFor(event.id);
                        handleGenerateLink(event);
                      }}
                      disabled={generatingLink && linkFor === event.id}
                    >
                      {generatingLink && linkFor === event.id ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="mr-2 h-3.5 w-3.5" />
                      )}
                      Link dla pary
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              )}

              {canEdit && !event.isWedding && (
                <EventClientLinkButton
                  locale={locale}
                  eventId={event.id}
                  eventName={event.name}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nowy event */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Typy eventów nie są już konfigurowane w przestrzeni klienta —
                przychodzą z biblioteki wzorców. Lista pusta = pole znika. */}
            {eventTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Typ eventu
                </label>
                <select
                  className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm"
                  value={selectedTypeId}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  <option value="">— wybierz typ —</option>
                  {eventTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nazwa imprezy</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Np. Wesele Ani i Tomka / Bal firmowy"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Data</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Liczba gości</label>
                <Input
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  placeholder="np. 120"
                />
              </div>
            </div>

            {selectedTypeId && eventTypes.find((t) => t.id === selectedTypeId)?.customFields && (
              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <p className="text-sm font-medium text-neutral-700">Pola dodatkowe</p>
                {eventTypes
                  .find((t) => t.id === selectedTypeId)
                  ?.customFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === "select" ? (
                        <select
                          className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm"
                          value={customFieldValues[field.key] || ""}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.key]: e.target.value,
                            })
                          }
                          required={field.required}
                        >
                          <option value="">— wybierz —</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={field.type}
                          value={customFieldValues[field.key] || ""}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.key]: e.target.value,
                            })
                          }
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}

            {hallCount > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Sala</label>
                <Select
                  value={form.hallId || "__none__"}
                  onValueChange={(v) => setForm({ ...form, hallId: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— nie przypisano —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— nie przypisano —</SelectItem>
                    {halls.map((v) =>
                      v.halls.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {halls.length > 1 ? v.venueName + " · " + h.name : h.name} ({h.capacity} os.)
                        </SelectItem>
                      )),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
              <Checkbox
                checked={form.isWedding}
                onCheckedChange={(checked) => setForm({ ...form, isWedding: checked === true })}
              />
              To jest wesele — udostępnij portal parze (link + PIN)
            </label>
            {kolizje.length > 0 && (
              <div
                className={`rounded-lg border px-3 py-2.5 ${
                  kolizje.some((k) => k.waga === "blokada")
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    kolizje.some((k) => k.waga === "blokada") ? "text-red-800" : "text-amber-800"
                  }`}
                >
                  {kolizje.some((k) => k.waga === "blokada")
                    ? "Termin jest zajęty"
                    : "Tego dnia coś już jest"}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {kolizje.map((k, i) => (
                    <li key={i} className="text-xs text-neutral-700">
                      • {k.opis}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  Możesz zapisać mimo to — decyzja należy do Ciebie.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {kolizje.some((k) => k.waga === "blokada") ? "Utwórz mimo to" : "Utwórz"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Wynik linku */}
      <Dialog
        open={!!linkResult}
        onOpenChange={(open) => {
          if (!open) setLinkResult(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link dla pary</DialogTitle>
          </DialogHeader>
          {linkResult && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Wyślij parze ten link oraz PIN. Po wejściu i podaniu PIN para zobaczy event
                w portalu pary i może go współplanować.
              </p>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-500">Link</label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={linkResult.url} className="text-xs" />
                  <Button size="sm" variant="outline" onClick={() => copy(linkResult.url, "url")}>
                    {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-500">PIN</label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={linkResult.pin} className="text-xs font-mono" />
                  <Button size="sm" variant="outline" onClick={() => copy(linkResult.pin, "pin")}>
                    {copied === "pin" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edytuj event */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nazwa imprezy</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Np. Wesele Ani i Tomka / Bal firmowy"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Data</label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Liczba gości</label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.guests}
                  onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })}
                  placeholder="np. 120"
                />
              </div>
            </div>

            {hallCount > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Sala</label>
                <Select
                  value={editForm.hallId || "__none__"}
                  onValueChange={(v) => setEditForm({ ...editForm, hallId: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— nie przypisano —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— nie przypisano —</SelectItem>
                    {halls.map((v) =>
                      v.halls.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {halls.length > 1 ? v.venueName + " · " + h.name : h.name} ({h.capacity} os.)
                        </SelectItem>
                      )),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={editing}>
                {editing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Zapisz
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
