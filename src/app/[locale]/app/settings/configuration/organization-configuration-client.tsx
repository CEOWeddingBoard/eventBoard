"use client";

import { useState } from "react";
import {
  Trash2, Pencil, GripVertical, Type, Hash, CalendarDays, Coins, ListChecks,
  Check, ExternalLink, CalendarCheck, Users, ClipboardList, FileText, MessageSquare, Wallet, Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  OBJECT_TYPE_PLACEMENT_LABELS,
  type ObjectTypePlacement,
} from "@/lib/object-type-placements";
import {
  createOrganizationObjectType,
  updateOrganizationObjectType,
  deleteOrganizationObjectType,
  assignWorkflowToEvents,
} from "@/lib/actions/organization-config.actions";

type Field = { key: string; label: string; type: string; required: boolean };
type ObjectType = {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
  visibleIn: string[];
  workflowId: string | null;
};
type Workflow = {
  id: string;
  name: string;
  description: string | null;
  eventType: string | null;
  stages: { id: string }[];
  nodeCount: number;
};
type EventRef = { id: string; name: string; date: string; workflowId: string | null };

const FIELD_PRESETS: Array<{ type: string; label: string; icon: typeof Type }> = [
  { type: "text", label: "Tekst", icon: Type },
  { type: "number", label: "Liczba", icon: Hash },
  { type: "date", label: "Data", icon: CalendarDays },
  { type: "money", label: "Kwota", icon: Coins },
  { type: "select", label: "Lista", icon: ListChecks },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Tekst",
  number: "Liczba",
  date: "Data",
  money: "Kwota",
  select: "Lista",
};

/** Kartoteki, w których obiekt może się pojawić. */
const PLACEMENTS: Array<{ value: ObjectTypePlacement; hint: string; icon: typeof Type }> = [
  { value: "EVENT", hint: "Zakładka szczegółów eventu", icon: CalendarCheck },
  { value: "PORTAL", hint: "Widoczne dla pary/klienta", icon: Users },
  { value: "AGENDA", hint: "Harmonogram dnia", icon: ClipboardList },
  { value: "DOCUMENT", hint: "Umowy i wydruki", icon: FileText },
  { value: "LEAD", hint: "Kartoteka zapytań ofertowych", icon: MessageSquare },
  { value: "FINANCE", hint: "Płatności i rozliczenia", icon: Wallet },
];

const PLACEMENT_LABELS: Record<string, string> = OBJECT_TYPE_PLACEMENT_LABELS;

export function OrganizationConfigurationClient({
  initialObjectTypes,
  initialWorkflows,
  events,
}: {
  initialObjectTypes: ObjectType[];
  initialWorkflows: Workflow[];
  events: EventRef[];
}) {
  const [objects, setObjects] = useState(initialObjectTypes);
  const workflows = initialWorkflows;
  const [eventList] = useState<EventRef[]>(events);
  const [assignWorkflowId, setAssignWorkflowId] = useState("");
  const [assignEventIds, setAssignEventIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [objectName, setObjectName] = useState("");
  const [objectDescription, setObjectDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [placements, setPlacements] = useState<string[]>(["EVENT"]);
  const [objectWorkflowId, setObjectWorkflowId] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<number | null>(null);

  const togglePlacement = (value: string) =>
    setPlacements((current) =>
      current.includes(value) ? current.filter((x) => x !== value) : [...current, value],
    );

  const addField = (type: string = "text") =>
    setFields((current) => [...current, { key: `field_${Date.now()}`, label: "", type, required: false }]);

  const reorderFields = (from: number, to: number) => {
    if (from === to) return;
    setFields((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const loadObject = (item: ObjectType) => {
    setEditingObjectId(item.id);
    setObjectName(item.name);
    setObjectDescription(item.description ?? "");
    setFields(item.fields);
    setPlacements(item.visibleIn.length > 0 ? item.visibleIn : ["EVENT"]);
    setObjectWorkflowId(item.workflowId ?? "");
  };

  const resetObject = () => {
    setEditingObjectId(null);
    setObjectName("");
    setObjectDescription("");
    setFields([]);
    setPlacements(["EVENT"]);
    setObjectWorkflowId("");
  };

  async function saveObject() {
    if (!objectName.trim()) return toast.error("Podaj nazwę obiektu");
    if (placements.length === 0) return toast.error("Wskaż co najmniej jedną kartotekę");
    setBusy(true);
    try {
      const payload = {
        name: objectName,
        description: objectDescription,
        fields,
        visibleIn: placements,
        workflowId: objectWorkflowId || null,
      };
      if (editingObjectId) {
        await updateOrganizationObjectType(editingObjectId, payload);
        toast.success("Typ obiektu zaktualizowany");
      } else {
        await createOrganizationObjectType(payload);
        toast.success("Typ obiektu zapisany");
      }
      window.location.reload();
    } catch { toast.error("Nie udało się zapisać typu obiektu"); } finally { setBusy(false); }
  }

  const toggleAssignEvent = (id: string) => setAssignEventIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  async function handleAssignWorkflow() {
    if (!assignWorkflowId) return toast.error("Wybierz proces");
    setAssigning(true);
    try {
      await assignWorkflowToEvents(assignWorkflowId, assignEventIds);
      toast.success("Proces przypisany do wybranych eventów");
      window.location.reload();
    } catch { toast.error("Nie udało się przypisać procesu"); } finally { setAssigning(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Obiekty */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-bold text-neutral-800">Własne typy obiektów</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Zdefiniuj obiekt, wskaż w których kartotekach ma się pojawiać i opcjonalnie powiąż go z procesem.
        </p>

        <div className="mt-4 space-y-4">
          {/* Krok 1 — podstawy */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">1 · Podstawowe dane</p>
            <Input placeholder="Nazwa obiektu, np. Klient" value={objectName} onChange={(e) => setObjectName(e.target.value)} />
            <Textarea placeholder="Opis obiektu" value={objectDescription} onChange={(e) => setObjectDescription(e.target.value)} rows={2} />
          </div>

          {/* Krok 2 — gdzie widoczny */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              2 · Gdzie ma być widoczny
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {PLACEMENTS.map((place) => {
                const active = placements.includes(place.value);
                return (
                  <button
                    key={place.value}
                    type="button"
                    onClick={() => togglePlacement(place.value)}
                    className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                      active
                        ? "border-blue-400 bg-blue-50"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        active ? "border-blue-500 bg-blue-500 text-white" : "border-neutral-300"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${active ? "text-blue-900" : "text-neutral-700"}`}>
                        <place.icon className="h-3.5 w-3.5" />
                        {PLACEMENT_LABELS[place.value]}
                      </span>
                      <span className="block text-[11px] text-neutral-400">{place.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Krok 3 — powiązanie z procesem */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              3 · Powiązanie z procesem <span className="font-normal normal-case tracking-normal">(opcjonalne)</span>
            </p>
            <div className="flex items-center gap-2">
              <Workflow className="h-4 w-4 shrink-0 text-neutral-400" />
              <select
                className="h-9 flex-1 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                value={objectWorkflowId}
                onChange={(e) => setObjectWorkflowId(e.target.value)}
              >
                <option value="">Bez powiązania — obiekt niezależny</option>
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-neutral-400">
              Powiązany obiekt zbiera dane dla wskazanego procesu — jego pola są dostępne przy mapowaniu do agendy.
            </p>
          </div>

          {/* Krok 4 — pola */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              4 · Pola obiektu
            </p>
            <p className="text-[11px] text-neutral-400">Kliknij typ pola, aby je dodać. Przeciągaj, by zmienić kolejność.</p>
            <div className="flex flex-wrap gap-1.5">
              {FIELD_PRESETS.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => addField(preset.type)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700 hover:border-blue-400 hover:bg-blue-50"
                >
                  <preset.icon className="h-3.5 w-3.5 text-neutral-500" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {fields.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-dashed border-neutral-200 p-2">
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  draggable
                  onDragStart={() => setDraggedField(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (draggedField !== null) reorderFields(draggedField, index); setDraggedField(null); }}
                  className="flex items-center gap-2 rounded border border-neutral-100 bg-white p-2"
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-neutral-300" />
                  <span className="rounded bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-500">{FIELD_TYPE_LABELS[field.type]}</span>
                  <Input
                    className="h-8 flex-1"
                    placeholder="Nazwa pola"
                    value={field.label}
                    onChange={(e) => setFields((current) => current.map((item, i) => i === index ? { ...item, label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") } : item))}
                  />
                  <label className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-500">
                    <input type="checkbox" checked={field.required} onChange={(e) => setFields((current) => current.map((item, i) => i === index ? { ...item, required: e.target.checked } : item))} />
                    wymagane
                  </label>
                  <button type="button" onClick={() => setFields((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-red-500" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={saveObject} disabled={busy}>{editingObjectId ? "Zapisz zmiany" : "Zapisz typ obiektu"}</Button>
            {editingObjectId && <Button type="button" size="sm" variant="ghost" onClick={resetObject}>Anuluj</Button>}
          </div>
        </div>
        <div className="mt-5 space-y-2 border-t pt-4">
          {objects.length === 0 && (
            <p className="text-xs text-neutral-400">Brak zapisanych typów obiektów.</p>
          )}
          {objects.map((item) => {
            const workflowName = workflows.find((w) => w.id === item.workflowId)?.name;
            return (
              <div key={item.id} className="rounded-lg border border-neutral-200 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800">
                      {item.name} <small className="font-normal text-neutral-400">({item.fields.length} pól)</small>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(item.visibleIn.length > 0 ? item.visibleIn : ["EVENT"]).map((place) => (
                        <span key={place} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                          {PLACEMENT_LABELS[place] ?? place}
                        </span>
                      ))}
                      {workflowName && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          <Workflow className="h-2.5 w-2.5" />
                          {workflowName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => loadObject(item)}><Pencil className="h-4 w-4 text-neutral-500" /></button>
                    <button type="button" onClick={async () => { await deleteOrganizationObjectType(item.id); setObjects((current) => current.filter((x) => x.id !== item.id)); }}><Trash2 className="h-4 w-4 text-red-500" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Procesy — link do nowego buildera */}
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-sm font-bold text-blue-900">Procesy / drzewo decyzyjne</h2>
        <p className="mt-1 text-xs text-blue-700">
          Definiowanie procesów przeniesiono do dedykowanego edytora węzłów. Możesz tworzyć procesy z rozgałęzieniami, warunkami i mapowaniem pól do agendy.
        </p>
        <div className="mt-4 space-y-2">
          {workflows.length > 0 && (
            <div className="space-y-1">
              {workflows.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-xs text-blue-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span>{item.name}</span>
                  <span className="text-blue-500">
                    {item.nodeCount === 1 ? "(1 krok)" : `(${item.nodeCount} kroków)`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/settings/workflows"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Otwórz edytor procesów
            </Link>
          </div>
        </div>
      </section>

      {/* Przypisz proces do eventów */}
      <section className="rounded-lg border border-neutral-200 bg-white p-5 lg:col-span-2">
        <h2 className="text-sm font-bold text-neutral-800">Przypisz proces do eventów</h2>
        <p className="mt-1 text-xs text-neutral-500">Wybierz proces i zaznacz eventy, które mają go używać.</p>
        <div className="mt-4 space-y-3">
          <select className="h-9 w-full max-w-xs rounded-md border border-neutral-300 bg-white px-2 text-sm" value={assignWorkflowId} onChange={(e) => setAssignWorkflowId(e.target.value)}>
            <option value="">Wybierz proces</option>
            {workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {eventList.length === 0 ? (
            <p className="text-xs text-neutral-400">Brak eventów do przypisania.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {eventList.map((event) => {
                const isSelected = assignEventIds.includes(event.id);
                return (
                  <button key={event.id} type="button" onClick={() => toggleAssignEvent(event.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${isSelected ? "border-blue-400 bg-blue-50 text-blue-800" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"}`}>
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-neutral-300"}`}>{isSelected && <Check className="h-3 w-3" />}</span>
                    <span className="min-w-0 flex-1 truncate">{event.name}</span>
                    {event.workflowId && <span className="shrink-0 text-[10px] text-emerald-600">ma proces</span>}
                  </button>
                );
              })}
            </div>
          )}
          <Button size="sm" onClick={handleAssignWorkflow} disabled={assigning || !assignWorkflowId}>Zapisz przypisanie</Button>
        </div>
      </section>
    </div>
  );
}
