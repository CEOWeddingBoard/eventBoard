"use client";

import { useState } from "react";
import { Check, ExternalLink, Workflow } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { assignWorkflowToEvents } from "@/lib/actions/organization-config.actions";

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

export function OrganizationConfigurationClient({
  initialObjectTypes: _initialObjectTypes,
  initialWorkflows,
  events,
}: {
  /** Nieużywane po wycofaniu ekranu własnych typów obiektów. */
  initialObjectTypes: ObjectType[];
  initialWorkflows: Workflow[];
  events: EventRef[];
}) {
  const workflows = initialWorkflows;
  const [eventList] = useState<EventRef[]>(events);
  const [assignWorkflowId, setAssignWorkflowId] = useState("");
  const [assignEventIds, setAssignEventIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

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
      {/*
        Sekcja „Własne typy obiektów” została usunięta z interfejsu.

        Formularz zapisywał `OrganizationObjectType` i pozwalał wskazać,
        w których kartotekach obiekt ma się pojawiać — ale żaden ekran tych
        definicji nie czytał. Zbierał więc konfigurację, która nigdzie nie
        działała, i obiecywał między innymi kartotekę „Dokumenty”, usuniętą
        razem z szablonami dokumentów.

        Model i akcje zostają w kodzie (dane klientów nie znikają), tak samo
        jak przy wycofaniu kategorii eventów. Nie przywracaj tego ekranu bez
        zbudowania miejsca, które te obiekty realnie wyświetla.
      */}

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
