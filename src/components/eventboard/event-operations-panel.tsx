"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Check, RotateCcw, FileDown, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  listOrgTemplates,
  saveEventAsTemplate,
  applyTemplateToEvent,
  listEventTasks,
  createEventTask,
  toggleEventTask,
  deleteEventTask,
  listEventPayments,
  addEventPayment,
  markEventPaymentPaid,
  markEventPaymentPending,
  deleteEventPayment,
  getEventQuote,
  saveEventQuote,
  saveEventDeadlines,
  generateEventContractDocxBase64,
} from "@/lib/actions/org-ecosystem.actions";

type Member = { id: string; name: string | null; email: string };
type Template = { id: string; name: string; kind: string };
type Task = { id: string; title: string; status: string; dueDate: Date | null; assignee: { id: string; name: string | null } | null };
type Payment = { id: string; label: string; amount: number; dueDate: Date | null; status: string; paidAt: Date | null; method: string | null };
type Quote = {
  guests: number | null;
  variants: { id: string; label: string; pricePerPerson: number; totalForGuests: number }[];
  extras: { label: string; amount: number }[];
  notes: string | null;
  menuDeadlineAt: string | null;
  guestListDeadlineAt: string | null;
};

export function EventOperationsPanel({
  eventId,
  members,
}: {
  eventId: string;
  members: Member[];
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [applyTemplateId, setApplyTemplateId] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState({ title: "", dueDate: "", assigneeId: "" });

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] = useState({ label: "", amount: "", dueDate: "", notes: "" });

  const [quote, setQuote] = useState<Quote | null>(null);
  const [extras, setExtras] = useState<{ label: string; amount: number }[]>([]);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [deadlines, setDeadlines] = useState({ menuDeadlineAt: "", guestListDeadlineAt: "" });

  const [busy, setBusy] = useState(false);
  const [contractBusy, setContractBusy] = useState(false);

  const toLocalInput = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 10) : "";

  const load = useCallback(async () => {
    try {
      const [t, tasksData, paymentsData, quoteData] = await Promise.all([
        listOrgTemplates(),
        listEventTasks(eventId),
        listEventPayments(eventId),
        getEventQuote(eventId),
      ]);
      setTemplates(t);
      setTasks(tasksData);
      setPayments(paymentsData);
      setQuote(quoteData);
      setExtras(quoteData.extras);
      setQuoteNotes(quoteData.notes ?? "");
      setDeadlines({
        menuDeadlineAt: toLocalInput(quoteData.menuDeadlineAt),
        guestListDeadlineAt: toLocalInput(quoteData.guestListDeadlineAt),
      });
    } catch {
      toast.error("Nie udało się pobrać danych");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const money = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Podaj nazwę szablonu");
      return;
    }
    setBusy(true);
    try {
      await saveEventAsTemplate(eventId, templateName);
      toast.success("Szablon zapisany");
      setTemplateName("");
      await load();
    } catch {
      toast.error("Nie udało się zapisać szablonu");
    } finally {
      setBusy(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (!applyTemplateId) return;
    setBusy(true);
    try {
      await applyTemplateToEvent(applyTemplateId, eventId);
      toast.success("Szablon zastosowany — harmonogram i menu skopiowane");
      await load();
    } catch {
      toast.error("Nie udało się zastosować szablonu");
    } finally {
      setBusy(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setBusy(true);
    try {
      await createEventTask(eventId, {
        title: taskForm.title,
        dueDate: taskForm.dueDate || undefined,
        assigneeId: taskForm.assigneeId || undefined,
      });
      setTaskForm({ title: "", dueDate: "", assigneeId: "" });
      await load();
    } catch {
      toast.error("Nie udało się dodać zadania");
    } finally {
      setBusy(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentForm.amount.replace(",", "."));
    if (!paymentForm.label.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Podaj nazwę i kwotę");
      return;
    }
    setBusy(true);
    try {
      await addEventPayment(eventId, {
        label: paymentForm.label,
        amount,
        dueDate: paymentForm.dueDate || undefined,
        notes: paymentForm.notes || undefined,
      });
      setPaymentForm({ label: "", amount: "", dueDate: "", notes: "" });
      await load();
    } catch {
      toast.error("Nie udało się dodać płatności");
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    const method = prompt("Metoda płatności (opcjonalnie): gotówka / przelew / karta", "przelew");
    setBusy(true);
    try {
      await markEventPaymentPaid(paymentId, method || undefined);
      await load();
    } catch {
      toast.error("Błąd");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveQuote = async () => {
    setBusy(true);
    try {
      await saveEventQuote(eventId, { items: extras, notes: quoteNotes });
      toast.success("Kosztorys zapisany");
      await load();
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDeadlines = async () => {
    setBusy(true);
    try {
      await saveEventDeadlines(eventId, {
        menuDeadlineAt: deadlines.menuDeadlineAt || null,
        guestListDeadlineAt: deadlines.guestListDeadlineAt || null,
      });
      toast.success("Terminy zapisane");
    } catch {
      toast.error("Błąd zapisu");
    } finally {
      setBusy(false);
    }
  };

  const handleContract = async () => {
    setContractBusy(true);
    try {
      const { base64, fileName } = await generateEventContractDocxBase64(eventId);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Umowa wygenerowana");
    } catch {
      toast.error("Nie udało się wygenerować umowy");
    } finally {
      setContractBusy(false);
    }
  };

  const paidSum = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pendingSum = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Checklista */}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold text-neutral-800">Checklista produkcyjna</h3>
        <form onSubmit={handleAddTask} className="mt-3 flex flex-wrap gap-2">
          <Input
            className="h-8 flex-1 min-w-[160px] text-xs"
            placeholder="Zadanie (np. zamówić kwiaty)"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
          />
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
          />
          <select
            className="h-8 w-40 rounded-md border border-neutral-200 px-2 text-xs"
            value={taskForm.assigneeId}
            onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
          >
            <option value="">— przypisz —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.email}
              </option>
            ))}
          </select>
          <Button size="sm" type="submit" disabled={busy}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Dodaj
          </Button>
        </form>
        <ul className="mt-3 space-y-1.5">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={task.status === "DONE"}
                onCheckedChange={() => toggleEventTask(task.id).then(load)}
              />
              <span className={task.status === "DONE" ? "line-through text-neutral-400 flex-1 truncate" : "flex-1 truncate text-neutral-700"}>
                {task.title}
              </span>
              {task.assignee && (
                <span className="text-[10px] text-neutral-400">{task.assignee.name ?? "?"}</span>
              )}
              {task.dueDate && (
                <span className="text-[10px] text-neutral-400 inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString("pl-PL")}
                </span>
              )}
              <button
                type="button"
                className="text-neutral-300 hover:text-red-500"
                onClick={() => deleteEventTask(task.id).then(load)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {tasks.length === 0 && <p className="text-xs text-neutral-400">Brak zadań.</p>}
        </ul>
      </section>

      {/* Kosztorys */}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold text-neutral-800">Kosztorys / wycena</h3>
        {quote && (
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-xs text-neutral-500">
              Goście: {quote.guests ?? "—"} · cena/os. wariantu lub suma dań × liczba gości
            </p>
            {quote.variants.map((v) => (
              <div key={v.id} className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-700">{v.label}</span>
                <span className="text-xs text-neutral-500">
                  {money(v.pricePerPerson)} zł/os.
                  {quote.guests ? ` · ${money(v.totalForGuests)} zł` : ""}
                </span>
              </div>
            ))}
            <div className="pt-2 space-y-1">
              {extras.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    className="h-7 flex-1 text-xs"
                    placeholder="Pozycja (np. fotobudka)"
                    value={item.label}
                    onChange={(e) =>
                      setExtras((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                    }
                  />
                  <Input
                    className="h-7 w-28 text-xs"
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) =>
                      setExtras((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-neutral-300 hover:text-red-500"
                    onClick={() => setExtras((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExtras((prev) => [...prev, { label: "", amount: 0 }])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Pozycja dodatkowa
              </Button>
            </div>
            <Input
              className="h-8 mt-1 text-xs"
              placeholder="Uwagi do wyceny"
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
            />
            <Button size="sm" onClick={handleSaveQuote} disabled={busy}>
              Zapisz kosztorys
            </Button>
          </div>
        )}
        <div className="mt-3 border-t border-neutral-100 pt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-500">Termin wyboru menu (klient)</label>
            <Input
              type="date"
              className="h-8 mt-1 text-xs"
              value={deadlines.menuDeadlineAt}
              onChange={(e) => setDeadlines({ ...deadlines, menuDeadlineAt: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-neutral-500">Termin listy gości</label>
            <Input
              type="date"
              className="h-8 mt-1 text-xs"
              value={deadlines.guestListDeadlineAt}
              onChange={(e) => setDeadlines({ ...deadlines, guestListDeadlineAt: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Button size="sm" variant="outline" onClick={handleSaveDeadlines} disabled={busy}>
              Zapisz terminy
            </Button>
          </div>
        </div>
      </section>

      {/* Płatności + umowa */}
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-bold text-neutral-800">Płatności klienta (cashflow)</h3>
        <form onSubmit={handleAddPayment} className="mt-3 flex flex-wrap gap-2">
          <Input
            className="h-8 flex-1 min-w-[140px] text-xs"
            placeholder="Np. Zadatek / Rata 1"
            value={paymentForm.label}
            onChange={(e) => setPaymentForm({ ...paymentForm, label: e.target.value })}
          />
          <Input
            className="h-8 w-28 text-xs"
            type="number"
            step="0.01"
            placeholder="kwota zł"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
          />
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={paymentForm.dueDate}
            onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
          />
          <Button size="sm" type="submit" disabled={busy}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Dodaj
          </Button>
        </form>
        <ul className="mt-3 space-y-1.5">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <Badge variant={p.status === "PAID" ? "default" : "secondary"} className="text-[10px]">
                {p.status === "PAID" ? "Opłacone" : "Do zapłaty"}
              </Badge>
              <span className={`flex-1 truncate ${p.status === "PAID" ? "text-neutral-500" : "text-neutral-800"}`}>
                {p.label} — {money(p.amount)} zł
                {p.dueDate && ` (do ${new Date(p.dueDate).toLocaleDateString("pl-PL")})`}
              </span>
              {p.status === "PENDING" ? (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkPaid(p.id)} disabled={busy}>
                  <Check className="mr-1 h-3 w-3" />
                  Oznacz zapłacone
                </Button>
              ) : (
                <>
                  {p.paidAt && (
                    <span className="text-[10px] text-neutral-400">
                      {new Date(p.paidAt).toLocaleDateString("pl-PL")}
                      {p.method ? ` · ${p.method}` : ""}
                    </span>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => markEventPaymentPending(p.id).then(load)} disabled={busy}>
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Cofnij
                  </Button>
                </>
              )}
              <button
                type="button"
                className="text-neutral-300 hover:text-red-500"
                onClick={() => deleteEventPayment(p.id).then(load)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          {payments.length === 0 && <p className="text-xs text-neutral-400">Brak płatności.</p>}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-100 pt-2 text-xs">
          <span className="text-emerald-700 font-medium">Opłacone: {money(paidSum)} zł</span>
          <span className="text-amber-700 font-medium">Do zapłaty: {money(pendingSum)} zł</span>
        </div>
        <Button size="sm" className="mt-3" onClick={handleContract} disabled={contractBusy}>
          {contractBusy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-1.5 h-4 w-4" />
          )}
          Generuj umowę (DOCX)
        </Button>
      </section>
    </div>
  );
}
