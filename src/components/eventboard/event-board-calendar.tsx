"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Plus, Loader2, Lock, DoorOpen } from "lucide-react";
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
import { createEvent } from "@/lib/actions/event.actions";
import { createOrgBlockedDate, deleteOrgBlockedDate } from "@/lib/actions/org-blocked.actions";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

export type CalendarEventItem = {
  id: string;
  name: string;
  date: string;
  isWedding: boolean;
  hallName: string | null;
};

export type BlockedDayItem = {
  id: string;
  date: string;
  reason: string | null;
};

export function EventBoardCalendar({
  locale,
  monthLabel,
  prevHref,
  nextHref,
  days,
  eventsByDay,
  blockedDates,
  categories,
  monthsWithEntries = [],
  currentMonth,
  canEdit = true,
}: {
  locale: string;
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  days: (string | null)[]; // ISO date lub null (puste pola siatki)
  eventsByDay: Record<string, CalendarEventItem[]>;
  blockedDates: BlockedDayItem[];
  categories: { id: string; name: string }[];
  monthsWithEntries?: string[];
  currentMonth?: string;
  /** Poziom „Podgląd" — kalendarz tylko do oglądania. */
  canEdit?: boolean;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    guests: "",
    isWedding: false,
    categoryId: "",
  });

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: "", reason: "" });
  const [savingBlock, setSavingBlock] = useState(false);

  const blockedByDay = new Map<string, BlockedDayItem>();
  for (const b of blockedDates) {
    blockedByDay.set(b.date.slice(0, 10), b);
  }

  const openForDay = (iso: string) => {
    if (!canEdit) return;
    setForm({ name: "", date: iso, guests: "", isWedding: false, categoryId: "" });
    setNewOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) {
      toast.error("Podaj nazwę i datę");
      return;
    }
    setCreating(true);
    try {
      await createEvent({
        name: form.name.trim(),
        date: form.date,
        estimatedGuestCount: form.guests ? parseInt(form.guests, 10) : undefined,
        isWedding: form.isWedding,
        eventType: form.isWedding ? "WEDDING" : "OTHER",
        organizerName: form.name.trim(),
        categoryId: form.categoryId || undefined,
      });
      toast.success("Event utworzony");
      setNewOpen(false);
      router.refresh();
    } catch {
      toast.error("Nie udało się utworzyć eventu");
    } finally {
      setCreating(false);
    }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.date) {
      toast.error("Wybierz datę blokady");
      return;
    }
    setSavingBlock(true);
    try {
      await createOrgBlockedDate({ date: blockForm.date, reason: blockForm.reason });
      toast.success("Blokada zapisana");
      setBlockOpen(false);
      setBlockForm({ date: "", reason: "" });
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać blokady");
    } finally {
      setSavingBlock(false);
    }
  };

  const handleRemoveBlock = async (block: BlockedDayItem) => {
    if (!confirm(`Usunąć blokadę ${block.date.slice(0, 10)}?`)) return;
    try {
      await deleteOrgBlockedDate(block.id);
      toast.success("Blokada usunięta");
      router.refresh();
    } catch {
      toast.error("Nie udało się usunąć blokady");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-neutral-800">Kalendarz</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kliknij dzień, aby dodać event. Kliknij event, aby otworzyć agendę.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={prevHref}
            className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[130px] text-center text-sm font-semibold text-neutral-800 capitalize">
            {monthLabel}
          </span>
          <Link
            href={nextHref}
            className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          {canEdit && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={() => {
                  setBlockForm({ date: today, reason: "" });
                  setBlockOpen(true);
                }}
              >
                <Lock className="mr-1 h-3.5 w-3.5" />
                Blokada
              </Button>
              <Button size="sm" className="ml-2" onClick={() => openForDay(today)}>
                <Plus className="mr-1 h-4 w-4" />
                Nowy event
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Pasek miesięcy, w których coś się dzieje. Bez niego kalendarz
          otwierał bieżący, zwykle pusty miesiąc i nie było wiadomo,
          w którą stronę klikać strzałkami. */}
      {monthsWithEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Z wpisami:
          </span>
          {monthsWithEntries.map((m) => {
            const [y, mm] = m.split("-");
            const nazwy = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
            const active = m === currentMonth;
            return (
              <Link
                key={m}
                href={`/${locale}/app/calendar?month=${m}`}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {nazwy[Number(mm) - 1]} {y}
              </Link>
            );
          })}
        </div>
      )}

      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((iso, idx) => {
            const dayEvents = iso ? eventsByDay[iso] ?? [] : [];
            const isToday = iso === today;
            const dayNumber = iso ? parseInt(iso.slice(8, 10), 10) : null;
            const block = iso ? blockedByDay.get(iso) ?? null : null;
            if (block) {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => canEdit && handleRemoveBlock(block)}
                  title={block.reason ? `Blokada: ${block.reason} (kliknij, aby usunąć)` : "Blokada (kliknij, aby usunąć)"}
                  className="min-h-[92px] border-b border-r border-neutral-100 bg-red-50/60 p-1.5 text-left align-top hover:bg-red-100 cursor-pointer"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-600 text-[11px] font-bold text-white">
                    {dayNumber}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-red-700">
                    <Lock className="h-2.5 w-2.5" />
                    Zablokowane
                  </div>
                  {block.reason && (
                    <p className="mt-0.5 truncate px-0.5 text-[10px] text-red-600/80">
                      {block.reason}
                    </p>
                  )}
                </button>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => iso && openForDay(iso)}
                className={`min-h-[92px] border-b border-r border-neutral-100 p-1.5 text-left align-top transition-colors ${
                  iso ? "hover:bg-blue-50/60 cursor-pointer" : "bg-neutral-50/60 cursor-default"
                } ${isToday ? "bg-blue-50/50" : ""}`}
              >
                {iso && dayNumber != null && (
                  <>
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] ${
                        isToday ? "bg-blue-600 font-bold text-white" : "text-neutral-500"
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/${locale}/app/events/${event.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-700 hover:bg-blue-100"
                          title={event.hallName ? `${event.name} — ${event.hallName}` : event.name}
                        >
                          <span className="flex items-center gap-1">
                            {event.isWedding && <Heart className="h-2.5 w-2.5 shrink-0 text-rose-500" />}
                            <span className="truncate">{event.name}</span>
                          </span>
                          {/* Sala widoczna wprost — przy kilku salach dzień
                              z dwiema imprezami nie oznacza konfliktu. */}
                          {event.hallName && (
                            <span className="mt-0.5 flex items-center gap-1 text-[9px] text-neutral-500">
                              <DoorOpen className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{event.hallName}</span>
                            </span>
                          )}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="px-1.5 text-[10px] text-neutral-400">
                          +{dayEvents.length - 3} więcej
                        </p>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nazwa imprezy</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Np. Wesele Ani i Tomka / Bal firmowy"
                required
                autoFocus
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
            <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
              <Checkbox
                checked={form.isWedding}
                onCheckedChange={(checked) => setForm({ ...form, isWedding: checked === true })}
              />
              To jest wesele — udostępnij portal parze (link + PIN)
            </label>
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Kategoria eventu
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="h-9 w-full rounded-md border border-neutral-300 px-2 text-sm text-neutral-800"
                >
                  <option value="">— bez kategorii —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Utwórz
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blokada terminu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Data</label>
              <Input
                type="date"
                value={blockForm.date}
                onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Powód (opcjonalnie)
              </label>
              <Input
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="Np. remont, impreza zamknięta"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBlockOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={savingBlock}>
                {savingBlock ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Zapisz blokadę
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
