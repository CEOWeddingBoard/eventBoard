"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { DayScheduleItem, MenuCourse, Guest } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle, Trash2, Pencil, Clock, MapPin, UtensilsCrossed, FileDown, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateEvent } from "@/lib/actions/event.actions";
import { sendTaskReminderSms } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const COURSE_TYPES = [
  { value: "APPETIZER", label: "Przystawka" },
  { value: "SOUP", label: "Zupa" },
  { value: "MAIN", label: "Danie główne" },
  { value: "DESSERT", label: "Deser" },
  { value: "CAKE", label: "Tort" },
  { value: "COLD_PLATTER", label: "Zimna płyta" },
  { value: "BUFFET", label: "Bufet" },
  { value: "DINNER", label: "Kolacja" },
  { value: "COFFEE_TEA", label: "Kawa i herbata" },
  { value: "DRINKS", label: "Napoje" },
  { value: "ALCOHOL", label: "Alkohol" },
  { value: "OTHER", label: "Inne" },
] as const;

function toDatetimeLocal(d: Date): string {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  const h = String(x.getHours()).padStart(2, "0");
  const min = String(x.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  initialSchedule: DayScheduleItem[];
  initialMenu: MenuCourse[];
  eventId: string;
  eventDate: Date;
  initialGuests: Pick<Guest, "id" | "name" | "phone" | "status">[];
  notificationPhone?: string | null;
  notificationDailyEnabled?: boolean | null;
  notificationWeeklyEnabled?: boolean | null;
}

export function DayScheduleAndMenu({
  initialSchedule,
  initialMenu,
  eventId,
  eventDate,
  initialGuests,
  notificationPhone: initialNotificationPhone = null,
  notificationDailyEnabled: initialNotificationDaily = false,
  notificationWeeklyEnabled: initialNotificationWeekly = false,
}: Props) {
  const smsFeaturesEnabled = false;
  const params = useParams();
  const locale = (params?.locale as string) || "pl";
  const base = `/${locale}/api/events/${eventId}`;

  const [schedule, setSchedule] = React.useState<DayScheduleItem[]>(initialSchedule);
  const [menu, setMenu] = React.useState<MenuCourse[]>(initialMenu);
  const [guests] = React.useState(initialGuests);
  const [smsOpen, setSmsOpen] = React.useState(false);
  const [smsMessage, setSmsMessage] = React.useState("");
  const [smsSelected, setSmsSelected] = React.useState<string[]>(() =>
    initialGuests.filter((g) => g.phone).map((g) => g.id),
  );
  const [smsSending, setSmsSending] = React.useState(false);
  const [smsResult, setSmsResult] = React.useState<string | null>(null);
  const [smsGenerateLoading, setSmsGenerateLoading] = React.useState(false);
  type SmsScenario = "rsvp_reminder" | "one_week_before" | "thanks";
  const [smsScenario, setSmsScenario] = React.useState<SmsScenario>("rsvp_reminder");

  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<DayScheduleItem | null>(null);
  const [scheduleForm, setScheduleForm] = React.useState({
    title: "",
    startTime: "",
    endTime: "",
    description: "",
    location: "",
  });

  const [menuDialogOpen, setMenuDialogOpen] = React.useState(false);
  const [editingMenu, setEditingMenu] = React.useState<MenuCourse | null>(null);
  const [menuForm, setMenuForm] = React.useState({
    name: "",
    courseType: "MAIN" as string,
    description: "",
  });

  const [notificationPhone, setNotificationPhone] = React.useState(initialNotificationPhone ?? "");
  const [notificationDaily, setNotificationDaily] = React.useState(!!initialNotificationDaily);
  const [notificationWeekly, setNotificationWeekly] = React.useState(!!initialNotificationWeekly);
  const [notificationSaving, setNotificationSaving] = React.useState(false);
  const [notificationTestResult, setNotificationTestResult] = React.useState<string | null>(null);

  const openScheduleForm = (item?: DayScheduleItem) => {
    if (item) {
      setEditingSchedule(item);
      setScheduleForm({
        title: item.title,
        startTime: toDatetimeLocal(item.startTime),
        endTime: item.endTime ? toDatetimeLocal(item.endTime) : "",
        description: item.description ?? "",
        location: item.location ?? "",
      });
    } else {
      setEditingSchedule(null);
      const d = new Date(eventDate);
      d.setHours(14, 0, 0, 0);
      setScheduleForm({
        title: "",
        startTime: toDatetimeLocal(d),
        endTime: "",
        description: "",
        location: "",
      });
    }
    setScheduleDialogOpen(true);
  };

  const saveSchedule = async () => {
    const payload = {
      title: scheduleForm.title.trim(),
      startTime: new Date(scheduleForm.startTime).toISOString(),
      endTime: scheduleForm.endTime
        ? new Date(scheduleForm.endTime).toISOString()
        : null,
      description: scheduleForm.description.trim() || null,
      location: scheduleForm.location.trim() || null,
    };
    try {
      if (editingSchedule) {
        const res = await fetch(`${base}/day-schedule/${editingSchedule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        const updated = await res.json();
        setSchedule((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i))
        );
        toast.success("Punkt harmonogramu zaktualizowany.");
      } else {
        const res = await fetch(`${base}/day-schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");
        const created = await res.json();
        setSchedule((prev) => [...prev, created].sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));
        toast.success("Punkt harmonogramu dodany.");
      }
      setScheduleDialogOpen(false);
    } catch {
      toast.error("Nie udało się zapisać.");
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`${base}/day-schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSchedule((prev) => prev.filter((i) => i.id !== id));
      toast.success("Punkt harmonogramu usunięty.");
    } catch {
      toast.error("Nie udało się usunąć.");
    }
  };

  const openMenuForm = (course?: MenuCourse) => {
    if (course) {
      setEditingMenu(course);
      setMenuForm({
        name: course.name,
        courseType: course.courseType,
        description: course.description ?? "",
      });
    } else {
      setEditingMenu(null);
      setMenuForm({ name: "", courseType: "MAIN", description: "" });
    }
    setMenuDialogOpen(true);
  };

  const saveMenu = async () => {
    const payload = {
      name: menuForm.name.trim(),
      courseType: menuForm.courseType,
      description: menuForm.description.trim() || null,
    };
    try {
      if (editingMenu) {
        const res = await fetch(`${base}/menu/${editingMenu.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        const updated = await res.json();
        setMenu((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i))
        );
        toast.success("Pozycja menu zaktualizowana.");
      } else {
        const res = await fetch(`${base}/menu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");
        const created = await res.json();
        setMenu((prev) => [...prev, created]);
        toast.success("Pozycja menu dodana.");
      }
      setMenuDialogOpen(false);
    } catch {
      toast.error("Nie udało się zapisać.");
    }
  };

  const deleteMenu = async (id: string) => {
    try {
      const res = await fetch(`${base}/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMenu((prev) => prev.filter((i) => i.id !== id));
      toast.success("Pozycja menu usunięta.");
    } catch {
      toast.error("Nie udało się usunąć.");
    }
  };

  const courseTypeLabel = (t: string) =>
    COURSE_TYPES.find((c) => c.value === t)?.label ?? t;

  const exportSchedulePdfUrl = `${base}/day/export-pdf?type=schedule`;
  const exportMenuPdfUrl = `${base}/day/export-pdf?type=menu`;
  const smsApiUrl = `${base}/sms/bulk`;

  const saveNotificationSettings = async () => {
    setNotificationSaving(true);
    setNotificationTestResult(null);
    try {
      await updateEvent(eventId, {
        notificationPhone: notificationPhone.trim() || undefined,
        notificationDailyEnabled: notificationDaily,
        notificationWeeklyEnabled: notificationWeekly,
      });
      toast.success("Ustawienia powiadomień zapisane.");
    } catch (e) {
      toast.error("Nie udało się zapisać.");
    } finally {
      setNotificationSaving(false);
    }
  };

  const sendTestReminder = async (kind: "daily" | "weekly") => {
    setNotificationTestResult(null);
    try {
      const result = await sendTaskReminderSms(eventId, kind);
      if (result.ok && result.sent) {
        toast.success("SMS wysłany.");
        setNotificationTestResult(`Wysłano (${kind === "daily" ? "zadania na dziś" : "zadania na tydzień"}).`);
      } else {
        toast.error(result.message ?? "Nie wysłano SMS.");
        setNotificationTestResult(result.message ?? "Błąd.");
      }
    } catch (e) {
      toast.error("Błąd wysyłania.");
      setNotificationTestResult("Błąd.");
    }
  };

  return (
    <div className="space-y-10">
      {smsFeaturesEnabled && <Card className="elegant-card border-olive/20">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Powiadomienia SMS (przypomnienia o zadaniach)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-muted">
            Podaj numer telefonu, na który mają przychodzić przypomnienia: co do zrobienia dziś i w tym tygodniu.
            Wymaga skonfigurowanego Twilio (Organizacja → wysyłanie SMS).
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="notification-phone">Numer telefonu</Label>
              <Input
                id="notification-phone"
                value={notificationPhone}
                onChange={(e) => setNotificationPhone(e.target.value)}
                placeholder="+48..."
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notificationDaily}
                  onCheckedChange={(c) => setNotificationDaily(!!c)}
                />
                <span className="text-sm">Codziennie (zadania na dziś)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notificationWeekly}
                  onCheckedChange={(c) => setNotificationWeekly(!!c)}
                />
                <span className="text-sm">Tygodniowo (zadania na 7 dni)</span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={saveNotificationSettings}
              disabled={notificationSaving}
            >
              {notificationSaving ? "Zapisywanie…" : "Zapisz ustawienia"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => sendTestReminder("daily")}
              disabled={!notificationPhone.trim()}
            >
              Wyślij test (zadania na dziś)
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => sendTestReminder("weekly")}
              disabled={!notificationPhone.trim()}
            >
              Wyślij test (tydzień)
            </Button>
          </div>
          {notificationTestResult && (
            <p className="text-sm text-ink-muted">{notificationTestResult}</p>
          )}
        </CardContent>
      </Card>}

      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        {smsFeaturesEnabled && <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-olive/30"
          onClick={() => setSmsOpen(true)}
        >
          Wyślij SMS do gości
        </Button>}
        <Link
          href={exportSchedulePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-olive/30 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink hover:bg-olive-muted hover:border-olive/50 transition-all"
        >
          <FileDown className="h-4 w-4" />
          Pobierz PDF – harmonogram dnia
        </Link>
        <Link
          href={exportMenuPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-olive/30 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink hover:bg-olive-muted hover:border-olive/50 transition-all"
        >
          <FileDown className="h-4 w-4" />
          Pobierz PDF – menu
        </Link>
      </div>
      {smsFeaturesEnabled && smsOpen && (
        <section className="rounded-xl border border-olive/25 bg-wedding-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-medium text-ink">Wiadomości SMS do gości</h2>
              <p className="text-sm text-ink-muted mt-1">
                Wybierz gości z numerem telefonu i wyślij im krótką wiadomość (np. przypomnienie o godzinie
                ceremonii).
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSmsOpen(false)}>
              Zamknij
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
            <div className="space-y-2">
              <Label>Wiadomość SMS</Label>
              <p className="text-xs text-ink-muted mb-1">
                Wybierz scenariusz i wygeneruj treść z AI, albo wpisz wiadomość ręcznie.
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Button
                  type="button"
                  size="sm"
                  variant={smsScenario === "rsvp_reminder" ? "secondary" : "outline"}
                  onClick={() => setSmsScenario("rsvp_reminder")}
                >
                  Przypomnienie RSVP
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={smsScenario === "one_week_before" ? "secondary" : "outline"}
                  onClick={() => setSmsScenario("one_week_before")}
                >
                  Tydzień przed
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={smsScenario === "thanks" ? "secondary" : "outline"}
                  onClick={() => setSmsScenario("thanks")}
                >
                  Podziękowania
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={smsGenerateLoading}
                  onClick={async () => {
                    setSmsGenerateLoading(true);
                    try {
                      const res = await fetch(`${base}/ai/sms-message`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ scenario: smsScenario }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        toast.error(err?.error ?? "Nie udało się wygenerować wiadomości.");
                        return;
                      }
                      const data = await res.json();
                      if (data?.content) setSmsMessage(data.content);
                    } catch {
                      toast.error("Nie udało się wygenerować wiadomości.");
                    } finally {
                      setSmsGenerateLoading(false);
                    }
                  }}
                >
                  {smsGenerateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <Sparkles className="h-4 w-4 shrink-0" />
                  )}
                  Generuj z AI
                </Button>
              </div>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-olive/30 bg-white/60 px-3 py-2 text-sm text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/60"
                maxLength={320}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="np. Przypominamy: ceremonia o 15:00 w Kościele św. Anny, przyjęcie od 17:00 w Sali Magnolia."
              />
              <p className="text-xs text-ink-muted">
                {smsMessage.length}/320 znaków. Wiadomości dłuższe niż 160 znaków mogą być policzone jako 2 SMS-y.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Odbiorcy ({smsSelected.length} z {guests.length})</Label>
              <div className="h-40 overflow-y-auto rounded-md border border-olive/20 bg-white/60 px-3 py-2 space-y-1">
                {guests.length === 0 ? (
                  <p className="text-sm text-ink-muted">Brak gości z przypisanym numerem telefonu.</p>
                ) : (
                  guests.map((g) => {
                    const hasPhone = !!g.phone;
                    const checked = smsSelected.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`flex items-center justify-between gap-2 text-sm ${
                          hasPhone ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <input
                            type="checkbox"
                            className="shrink-0"
                            disabled={!hasPhone}
                            checked={checked}
                            onChange={(e) => {
                              setSmsSelected((prev) =>
                                e.target.checked ? [...prev, g.id] : prev.filter((id) => id !== g.id),
                              );
                            }}
                          />
                          <span className="truncate">{g.name}</span>
                        </div>
                        <span className="text-xs text-ink-muted truncate max-w-[140px]">
                          {g.phone || "brak numeru"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-ink-muted">
              SMS-y wysyłane są przez skonfigurowaną bramkę (Twilio). Jeśli nie jest ustawiona, zobaczysz tylko
              podgląd (bez wysyłki).
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSmsSelected(guests.filter((g) => g.phone).map((g) => g.id));
                }}
                disabled={guests.length === 0}
              >
                Wybierz z numerem
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={smsSending || !smsMessage.trim() || smsSelected.length === 0}
                onClick={async () => {
                  setSmsSending(true);
                  setSmsResult(null);
                  try {
                    const res = await fetch(smsApiUrl, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ guestIds: smsSelected, message: smsMessage.trim() }),
                    });
                    const json = await res.json();
                    if (json.dryRun) {
                      setSmsResult(
                        `Tryb podglądu: wysłano by SMS do ${json.recipients.length} gości. Skonfiguruj TWILIO_* w zmiennych środowiskowych, aby włączyć wysyłkę.`,
                      );
                      toast.info("Podgląd wysyłki SMS (brak skonfigurowanej bramki).");
                    } else if (json.sent !== undefined) {
                      setSmsResult(`Wysłano ${json.sent} SMS, niepowodzenia: ${json.failed || 0}.`);
                      if (json.sent > 0) {
                        toast.success(`Wysłano ${json.sent} SMS.`);
                      } else {
                        toast.error("Nie udało się wysłać SMS-ów.");
                      }
                    } else if (json.error) {
                      setSmsResult(json.error);
                      toast.error(json.error);
                    }
                  } catch {
                    setSmsResult("Nie udało się połączyć z serwerem SMS.");
                    toast.error("Nie udało się wysłać SMS-ów.");
                  } finally {
                    setSmsSending(false);
                  }
                }}
              >
                {smsSending ? "Wysyłanie..." : "Wyślij SMS"}
              </Button>
            </div>
          </div>
          {smsResult && (
            <p className="text-xs text-ink-muted border-t border-olive/20 pt-2 mt-2">{smsResult}</p>
          )}
        </section>
      )}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-medium text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            Harmonogram dnia
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-olive/30"
            onClick={() => openScheduleForm()}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Dodaj punkt
          </Button>
        </div>
        <div className="rounded-xl border border-olive/20 bg-wedding-card overflow-hidden">
          {schedule.length === 0 ? (
            <p className="font-sans text-ink-muted text-sm font-light p-6 text-center">
              Brak punktów. Dodaj godziny, miejsca i opisy (np. ceremonia, przyjęcie, tort).
            </p>
          ) : (
            <ul className="divide-y divide-olive/15">
              {schedule.map((item) => (
                <li key={item.id} className="p-4 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-sans font-medium text-ink">
                      {formatTime(item.startTime)}
                      {item.endTime && ` – ${formatTime(item.endTime)}`}
                    </span>
                    <span className="ml-2 font-serif text-ink">{item.title}</span>
                    {item.location && (
                      <p className="flex items-center gap-1 mt-1 text-sm text-ink-muted">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.location}
                      </p>
                    )}
                    {item.description && (
                      <p className="mt-1 text-sm text-ink-muted font-light">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-ink-muted hover:text-ink"
                      onClick={() => openScheduleForm(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-ink-muted hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć ten punkt?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSchedule(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Usuń
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Pozycje menu (MenuCourse) usunięte z widoku eventu — dubluje edytor
          wariantów menu (MenuVariantEditor). Menu prowadzi się przez warianty
          i wybór klienta w procesie. */}

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-xl overflow-visible max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "Edytuj punkt harmonogramu" : "Dodaj punkt harmonogramu"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-visible">
            <div>
              <Label htmlFor="schedule-title">Co</Label>
              <Input
                id="schedule-title"
                value={scheduleForm.title}
                onChange={(e) =>
                  setScheduleForm((s) => ({ ...s, title: e.target.value }))
                }
                placeholder="np. Ceremonia, Przyjęcie, Tort"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-visible">
              <div className="overflow-visible">
                <Label htmlFor="schedule-start">Od</Label>
                <Input
                  id="schedule-start"
                  type="datetime-local"
                  className="min-h-[2.75rem] w-full"
                  value={scheduleForm.startTime}
                  onChange={(e) =>
                    setScheduleForm((s) => ({ ...s, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="overflow-visible">
                <Label htmlFor="schedule-end">Do (opcjonalnie)</Label>
                <Input
                  id="schedule-end"
                  type="datetime-local"
                  className="min-h-[2.75rem] w-full"
                  value={scheduleForm.endTime}
                  onChange={(e) =>
                    setScheduleForm((s) => ({ ...s, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="schedule-location">Gdzie</Label>
              <Input
                id="schedule-location"
                value={scheduleForm.location}
                onChange={(e) =>
                  setScheduleForm((s) => ({ ...s, location: e.target.value }))
                }
                placeholder="np. Sala główna, Ogród"
              />
            </div>
            <div>
              <Label htmlFor="schedule-desc">Opis (opcjonalnie)</Label>
              <Input
                id="schedule-desc"
                value={scheduleForm.description}
                onChange={(e) =>
                  setScheduleForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="Krótki opis"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={saveSchedule}
              disabled={!scheduleForm.title.trim()}
            >
              Zapisz
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "Edytuj pozycję menu" : "Dodaj pozycję menu"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Typ</Label>
              <Select
                value={menuForm.courseType}
                onValueChange={(v) =>
                  setMenuForm((s) => ({ ...s, courseType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_TYPES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="menu-name">Nazwa</Label>
              <Input
                id="menu-name"
                value={menuForm.name}
                onChange={(e) =>
                  setMenuForm((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="np. Zupa pomidorowa, Filet z łososia"
              />
            </div>
            <div>
              <Label htmlFor="menu-desc">Opis (opcjonalnie)</Label>
              <Input
                id="menu-desc"
                value={menuForm.description}
                onChange={(e) =>
                  setMenuForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="Składniki, uwagi"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={saveMenu}
              disabled={!menuForm.name.trim()}
            >
              Zapisz
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
