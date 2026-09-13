"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkflowWithNodes,
  updateWorkflowWithNodes,
  type WorkflowNodeData,
  type FieldMapping,
  type NodeCondition,
  type WorkflowWithNodes,
} from "@/lib/actions/workflow-builder.actions";
import { ASSIGNEE_ROLE_OPTIONS, PRESET_ROLE_VALUES } from "@/lib/workflow-roles";
import {
  AGENDA_TARGETS,
  AGENDA_TARGET_GROUPS,
  DEFAULT_MENU_MODE,
  MENU_SELECTION_MODES,
  STEP_FIELD_TYPES,
  TRANSFORMS,
  sourceFieldsFor,
  type StepField,
} from "@/lib/workflow-agenda-fields";
import { AgendaPreview } from "@/components/workflow/AgendaPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  GitBranch,
  Layers,
  CheckSquare,
  CreditCard,
  FileText,
  Calendar,
  MessageSquare,
  ClipboardList,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";

const NODE_TYPES: { value: WorkflowNodeData["nodeType"]; label: string }[] = [
  { value: "ACTION", label: "Akcja (liniowa)" },
  { value: "DECISION", label: "Decyzja (rozgałęzienie)" },
  { value: "PARALLEL", label: "Równoległe" },
  { value: "END", label: "Koniec procesu" },
];

const ACTION_TYPES: {
  value: WorkflowNodeData["actionType"];
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "NONE", label: "Brak akcji", icon: Layers, color: "text-neutral-400" },
  { value: "CLIENT_FORM", label: "Formularz klienta", icon: ClipboardList, color: "text-blue-500" },
  { value: "MENU_SELECTION", label: "Wybór menu", icon: UtensilsCrossed, color: "text-orange-500" },
  { value: "APPROVAL", label: "Zatwierdzenie", icon: CheckSquare, color: "text-green-500" },
  { value: "PAYMENT", label: "Płatność", icon: CreditCard, color: "text-emerald-600" },
  { value: "DOCUMENT", label: "Dokument", icon: FileText, color: "text-violet-500" },
  { value: "AGENDA", label: "Agenda", icon: Calendar, color: "text-indigo-500" },
  { value: "SEND_MESSAGE", label: "Wiadomość", icon: MessageSquare, color: "text-sky-500" },
];

const ASSIGNEE_ROLES = ASSIGNEE_ROLE_OPTIONS;

const CONDITION_TYPES: { value: NodeCondition["conditionType"]; label: string }[] = [
  { value: "always", label: "Zawsze" },
  { value: "client_choice", label: "Wybór klienta" },
  { value: "field_equals", label: "Pole równa się" },
  { value: "manual", label: "Ręcznie" },
];

function newNode(sortOrder: number, isStart = false): WorkflowNodeData {
  return {
    name: "",
    nodeType: "ACTION",
    actionType: "NONE",
    assigneeRole: "MANAGER",
    sortOrder,
    fieldMappings: [],
    conditions: [],
    isStart,
    fields: [],
  };
}

/** Klucz pola z etykiety: „Godzina kolacji" → „godzinaKolacji". */
function keyFromLabel(label: string): string {
  const parts = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/);
  return parts
    .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
}

function ActionIcon({
  actionType,
}: {
  actionType: WorkflowNodeData["actionType"];
}) {
  const found = ACTION_TYPES.find((a) => a.value === actionType);
  if (!found) return null;
  const Icon = found.icon;
  return <Icon className={`w-4 h-4 ${found.color}`} />;
}

function NodeTypeIcon({ nodeType }: { nodeType: WorkflowNodeData["nodeType"] }) {
  if (nodeType === "DECISION") return <GitBranch className="w-3 h-3 text-amber-500" />;
  if (nodeType === "PARALLEL") return <Layers className="w-3 h-3 text-purple-500" />;
  if (nodeType === "END") return <CheckSquare className="w-3 h-3 text-green-500" />;
  return <ArrowRight className="w-3 h-3 text-neutral-400" />;
}

type Tab = "basic" | "fields" | "mappings" | "conditions";

/** Krok, na który może wskazywać skok albo gałąź warunku. */
type NodeTarget = { id: string; label: string };

function NodeEditor({
  node,
  index,
  total,
  nodeTargets,
  roleOptions,
  presetValues,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  node: WorkflowNodeData;
  index: number;
  total: number;
  nodeTargets: NodeTarget[];
  roleOptions: { value: string; label: string }[];
  presetValues: string[];
  onChange: (updated: WorkflowNodeData) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const [tab, setTab] = useState<Tab>("basic");

  function updateField<K extends keyof WorkflowNodeData>(
    key: K,
    value: WorkflowNodeData[K]
  ) {
    onChange({ ...node, [key]: value });
  }

  function addMapping() {
    onChange({
      ...node,
      fieldMappings: [
        ...node.fieldMappings,
        { sourceKey: "", targetAgendaKey: "", transform: "none" },
      ],
    });
  }

  function updateMapping(i: number, m: FieldMapping) {
    const next = [...node.fieldMappings];
    next[i] = m;
    onChange({ ...node, fieldMappings: next });
  }

  function removeMapping(i: number) {
    onChange({
      ...node,
      fieldMappings: node.fieldMappings.filter((_, idx) => idx !== i),
    });
  }

  function addStepField() {
    onChange({
      ...node,
      fields: [
        ...(node.fields ?? []),
        { key: "", label: "", type: "text", targetAgendaKey: "" },
      ],
    });
  }

  function updateStepField(i: number, f: StepField) {
    const next = [...(node.fields ?? [])];
    next[i] = f;
    onChange({ ...node, fields: next });
  }

  function removeStepField(i: number) {
    onChange({ ...node, fields: (node.fields ?? []).filter((_, idx) => idx !== i) });
  }

  function addCondition() {
    onChange({
      ...node,
      conditions: [
        ...node.conditions,
        { label: "", conditionType: "always", nextNodeId: "" },
      ],
    });
  }

  function updateCondition(i: number, c: NodeCondition) {
    const next = [...node.conditions];
    next[i] = c;
    onChange({ ...node, conditions: next });
  }

  function removeCondition(i: number) {
    onChange({
      ...node,
      conditions: node.conditions.filter((_, idx) => idx !== i),
    });
  }

  const actionDef = ACTION_TYPES.find((a) => a.value === node.actionType);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Node header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          {node.isStart && (
            <span className="text-[10px] bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 font-semibold flex-shrink-0">
              START
            </span>
          )}
          <NodeTypeIcon nodeType={node.nodeType} />
          <ActionIcon actionType={node.actionType} />
          <span className="text-sm font-medium text-neutral-700 truncate">
            {node.name || "Nowy węzeł"}
          </span>
          {actionDef && node.actionType !== "NONE" && (
            <span className="text-[10px] text-neutral-400 flex-shrink-0 hidden sm:inline">
              · {actionDef.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="p-1 rounded hover:bg-neutral-200 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="p-1 rounded hover:bg-neutral-200 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 text-sm">
        {(["basic", "fields", "mappings", "conditions"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t === "basic" && "Podstawowe"}
            {t === "fields" && `Pola (${(node.fields ?? []).length})`}
            {t === "mappings" && `Mapowanie pól (${node.fieldMappings.length})`}
            {t === "conditions" && `Warunki (${node.conditions.length})`}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tab === "basic" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Nazwa kroku *
                </label>
                <Input
                  value={node.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="np. Wybór menu przez klienta"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Typ węzła
                </label>
                <select
                  value={node.nodeType}
                  onChange={(e) =>
                    updateField(
                      "nodeType",
                      e.target.value as WorkflowNodeData["nodeType"]
                    )
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {NODE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Akcja
                </label>
                <select
                  value={node.actionType}
                  onChange={(e) =>
                    updateField(
                      "actionType",
                      e.target.value as WorkflowNodeData["actionType"]
                    )
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Wykonuje
                </label>
                <select
                  value={presetValues.includes(node.assigneeRole) ? node.assigneeRole : "CUSTOM"}
                  onChange={(e) => {
                    if (e.target.value !== "CUSTOM") {
                      updateField("assigneeRole", e.target.value as WorkflowNodeData["assigneeRole"]);
                    } else {
                      updateField("assigneeRole", "" as WorkflowNodeData["assigneeRole"]);
                    }
                  }}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {!presetValues.includes(node.assigneeRole) && (
                  <input
                    type="text"
                    value={node.assigneeRole}
                    onChange={(e) => updateField("assigneeRole", e.target.value as WorkflowNodeData["assigneeRole"])}
                    placeholder="np. Kucharz, Kelner, DJ…"
                    className="mt-1.5 w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Kto wypełnia
                </label>
                <select
                  value={presetValues.includes(node.fillRole ?? "") ? (node.fillRole ?? "") : (node.fillRole ? "CUSTOM" : "")}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") updateField("fillRole", "");
                    else updateField("fillRole", e.target.value || undefined);
                  }}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— jak „Wykonuje" —</option>
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {node.fillRole !== undefined && !presetValues.includes(node.fillRole) && (
                  <input
                    type="text"
                    value={node.fillRole}
                    onChange={(e) => updateField("fillRole", e.target.value)}
                    placeholder="np. Kucharz, Kelner…"
                    className="mt-1.5 w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Kto akceptuje
                </label>
                <select
                  value={presetValues.includes(node.approveRole ?? "") ? (node.approveRole ?? "") : (node.approveRole ? "CUSTOM" : "")}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") updateField("approveRole", "");
                    else updateField("approveRole", e.target.value || undefined);
                  }}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— bez osobnej akceptacji —</option>
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {node.approveRole !== undefined && node.approveRole !== "" && !presetValues.includes(node.approveRole) && (
                  <input
                    type="text"
                    value={node.approveRole}
                    onChange={(e) => updateField("approveRole", e.target.value)}
                    placeholder="np. Manager…"
                    className="mt-1.5 w-full rounded-md border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {node.nodeType === "ACTION" && (
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Następny krok
                </label>
                <select
                  value={node.nextNodeId ?? ""}
                  onChange={(e) =>
                    updateField("nextNodeId", e.target.value || undefined)
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— automatycznie (kolejny) —</option>
                  {nodeTargets
                    .filter((t) => t.id !== node.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Sposób wyboru menu jest decyzją projektową procesu, nie
                ustawieniem eventu: jedna sala sprzedaje gotowe zestawy,
                inna pozwala parze złożyć menu z pojedynczych dań. */}
            {node.actionType === "MENU_SELECTION" && (
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">
                  Jak klient wybiera menu
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MENU_SELECTION_MODES.map((tryb) => {
                    const aktywny = (node.menuMode ?? DEFAULT_MENU_MODE) === tryb.value;
                    return (
                      <button
                        key={tryb.value}
                        type="button"
                        onClick={() => updateField("menuMode", tryb.value)}
                        className={`rounded-lg border-2 p-2.5 text-left transition-colors ${
                          aktywny
                            ? "border-blue-500 bg-blue-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span className={`block text-xs font-semibold ${aktywny ? "text-blue-800" : "text-neutral-700"}`}>
                          {tryb.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">
                          {tryb.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                Opis (opcjonalny)
              </label>
              <Textarea
                value={node.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Co powinno się wydarzyć w tym kroku?"
                rows={2}
                className="text-sm"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={node.isStart ?? false}
                onChange={(e) => updateField("isStart", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-neutral-600">
                Węzeł startowy (pierwszy w procesie)
              </span>
            </label>
          </>
        )}

        {tab === "fields" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Pola, które wypełnia osoba odpowiedzialna za krok (klient w portalu
              albo zespół w panelu). Po zatwierdzeniu wartość trafia do agendy pod
              wskazane miejsce. Pole typu „Godzina" oznaczone jako pozycja
              harmonogramu tworzy linię w harmonogramie agendy.
            </p>
            {(node.fields ?? []).map((f, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={f.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateStepField(i, { ...f, label, key: f.key || keyFromLabel(label) });
                    }}
                    placeholder="Etykieta pola, np. Godzina kolacji"
                    className="h-8 text-xs flex-1"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => updateStepField(i, { ...f, type: e.target.value as StepField["type"] })}
                    className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs"
                  >
                    {STEP_FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeStepField(i)} className="rounded p-1 hover:bg-red-100">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                  <select
                    value={AGENDA_TARGETS.some((t) => t.key === f.targetAgendaKey) ? f.targetAgendaKey : (f.targetAgendaKey ? "__custom__" : "")}
                    onChange={(e) =>
                      updateStepField(i, { ...f, targetAgendaKey: e.target.value === "__custom__" ? "" : e.target.value })
                    }
                    className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs"
                  >
                    <option value="" disabled>— gdzie w agendzie —</option>
                    {AGENDA_TARGET_GROUPS.map((grupa) => (
                      <optgroup key={grupa} label={grupa}>
                        {AGENDA_TARGETS.filter((t) => t.group === grupa).map((t) => (
                          <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="__custom__">Własny klucz…</option>
                  </select>
                </div>
                {!AGENDA_TARGETS.some((t) => t.key === f.targetAgendaKey) && (
                  <Input
                    value={f.targetAgendaKey}
                    onChange={(e) => updateStepField(i, { ...f, targetAgendaKey: e.target.value })}
                    placeholder="Własny klucz agendy, np. agenda.dekoracje"
                    className="h-8 text-xs"
                  />
                )}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-600">
                    <input type="checkbox" checked={f.required ?? false} onChange={(e) => updateStepField(i, { ...f, required: e.target.checked })} className="rounded" />
                    Wymagane
                  </label>
                  {f.type === "time" && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-600">
                      <input type="checkbox" checked={f.scheduleLine ?? false} onChange={(e) => updateStepField(i, { ...f, scheduleLine: e.target.checked })} className="rounded" />
                      Pozycja harmonogramu
                    </label>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStepField} className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Dodaj pole
            </Button>
          </div>
        )}

        {tab === "mappings" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Po ukończeniu kroku wskazane dane trafiają wprost do agendy eventu.
              Lista po lewej pokazuje, co ten krok w ogóle wystawia — zależy to od
              wybranej akcji.
            </p>

            {/* Szybkie dołożenie notatki: najczęstszy przypadek, a wcześniej
                wymagał znajomości klucza `note`. */}
            {!node.fieldMappings.some((m) => m.sourceKey === "note") && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...node,
                    fieldMappings: [
                      ...node.fieldMappings,
                      { sourceKey: "note", targetAgendaKey: "agenda.uwagiFinalne", transform: "join_newline" },
                    ],
                  })
                }
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                + Odkładaj notatkę z tego kroku w uwagach agendy
              </button>
            )}

            {node.fieldMappings.map((m, i) => {
              const zrodla = sourceFieldsFor(node.actionType);
              const znaneZrodlo = zrodla.some((z) => z.key === m.sourceKey);
              const znanyCel = AGENDA_TARGETS.some((t) => t.key === m.targetAgendaKey);
              const opis = zrodla.find((z) => z.key === m.sourceKey)?.hint;
              return (
                <div key={i} className="rounded-lg border border-neutral-200 p-2.5">
                  <div className="flex items-center gap-2">
                    <select
                      value={znaneZrodlo ? m.sourceKey : "__custom__"}
                      onChange={(e) =>
                        updateMapping(i, {
                          ...m,
                          sourceKey: e.target.value === "__custom__" ? "" : e.target.value,
                        })
                      }
                      className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs"
                    >
                      <option value="" disabled>
                        — co odłożyć —
                      </option>
                      {zrodla.map((z) => (
                        <option key={z.key} value={z.key}>
                          {z.label}
                        </option>
                      ))}
                      <option value="__custom__">Własny klucz…</option>
                    </select>

                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-neutral-400" />

                    <select
                      value={znanyCel ? m.targetAgendaKey : "__custom__"}
                      onChange={(e) =>
                        updateMapping(i, {
                          ...m,
                          targetAgendaKey: e.target.value === "__custom__" ? "" : e.target.value,
                        })
                      }
                      className="min-w-0 flex-1 rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs"
                    >
                      <option value="" disabled>
                        — gdzie w agendzie —
                      </option>
                      {AGENDA_TARGET_GROUPS.map((grupa) => (
                        <optgroup key={grupa} label={grupa}>
                          {AGENDA_TARGETS.filter((t) => t.group === grupa).map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="__custom__">Własny klucz…</option>
                    </select>

                    <select
                      value={m.transform ?? "none"}
                      onChange={(e) =>
                        updateMapping(i, {
                          ...m,
                          transform: e.target.value as FieldMapping["transform"],
                        })
                      }
                      className="rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs"
                    >
                      {TRANSFORMS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeMapping(i)}
                      className="rounded p-1 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>

                  {(!znaneZrodlo || !znanyCel) && (
                    <div className="mt-2 flex items-center gap-2">
                      {!znaneZrodlo && (
                        <Input
                          value={m.sourceKey}
                          onChange={(e) => updateMapping(i, { ...m, sourceKey: e.target.value })}
                          placeholder="Własny klucz źródłowy"
                          className="h-8 text-xs"
                        />
                      )}
                      {!znanyCel && (
                        <Input
                          value={m.targetAgendaKey}
                          onChange={(e) => updateMapping(i, { ...m, targetAgendaKey: e.target.value })}
                          placeholder="Własny klucz agendy, np. agenda.dekoracje"
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  )}

                  {opis && <p className="mt-1.5 text-[11px] text-neutral-500">{opis}</p>}
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMapping}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Dodaj mapowanie
            </Button>
          </div>
        )}

        {tab === "conditions" && (
          <div className="space-y-3">
            {node.nodeType !== "DECISION" && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                Warunki są dostępne tylko dla węzłów typu{" "}
                <strong>Decyzja</strong>. Zmień typ węzła powyżej.
              </p>
            )}
            {node.conditions.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 items-center bg-neutral-50 rounded p-2"
              >
                <Input
                  value={c.label}
                  onChange={(e) =>
                    updateCondition(i, { ...c, label: e.target.value })
                  }
                  placeholder="Etykieta (np. Menu A)"
                  className="text-xs col-span-1"
                />
                <select
                  value={c.conditionType}
                  onChange={(e) =>
                    updateCondition(i, {
                      ...c,
                      conditionType: e.target
                        .value as NodeCondition["conditionType"],
                    })
                  }
                  className="rounded-md border border-neutral-300 px-2 py-2 text-xs bg-white"
                >
                  {CONDITION_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={c.conditionValue ?? ""}
                  onChange={(e) =>
                    updateCondition(i, {
                      ...c,
                      conditionValue: e.target.value || undefined,
                    })
                  }
                  placeholder="Wartość (opcjonalna)"
                  className="text-xs"
                />
                <div className="flex items-center gap-1">
                  <select
                    value={c.nextNodeId}
                    onChange={(e) =>
                      updateCondition(i, { ...c, nextNodeId: e.target.value })
                    }
                    className="flex-1 min-w-0 rounded-md border border-neutral-300 px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— dokąd prowadzi —</option>
                    {nodeTargets
                      .filter((t) => t.id !== node.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    {c.nextNodeId && !nodeTargets.some((t) => t.id === c.nextNodeId) && (
                      <option value={c.nextNodeId}>⚠ krok już nie istnieje</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="p-1 hover:bg-red-100 rounded flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCondition}
              disabled={node.nodeType !== "DECISION"}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Dodaj warunek
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkflowBuilder({
  initial,
  customRoles = [],
}: {
  initial?: WorkflowWithNodes;
  customRoles?: { value: string; label: string }[];
}) {
  const router = useRouter();
  // Role stałe + własne role organizacji (przed opcją „Własna rola…").
  const roleOptions = [
    ...ASSIGNEE_ROLES.filter((r) => r.value !== "CUSTOM"),
    ...customRoles,
    ...ASSIGNEE_ROLES.filter((r) => r.value === "CUSTOM"),
  ];
  const presetValues = [...PRESET_ROLE_VALUES, ...customRoles.map((r) => r.value)];
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [eventType, setEventType] = useState(initial?.eventType ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [nodes, setNodes] = useState<WorkflowNodeData[]>(
    initial?.nodes ?? [newNode(0, true)]
  );

  // Cele skoków opisujemy numerem i nazwą kroku — samo cuid nic nie mówi
  // osobie układającej rozgałęzienie. Węzły jeszcze niezapisane nie mają ID,
  // więc nie mogą być celem, dopóki proces nie zostanie zapisany.
  const nodeTargets: NodeTarget[] = nodes
    .map((n, i) => ({ id: n.id, label: `${i + 1}. ${n.name?.trim() || "Krok bez nazwy"}` }))
    .filter((t): t is NodeTarget => Boolean(t.id));

  function addNode() {
    setNodes((prev) => [...prev, newNode(prev.length)]);
  }

  function updateNode(index: number, updated: WorkflowNodeData) {
    setNodes((prev) => prev.map((n, i) => (i === index ? updated : n)));
  }

  function removeNode(index: number) {
    setNodes((prev) => prev.filter((_, i) => i !== index));
  }

  function moveNode(index: number, direction: "up" | "down") {
    setNodes((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((n, i) => ({ ...n, sortOrder: i }));
    });
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        eventType: eventType.trim() || undefined,
        isDefault,
        nodes: nodes.map((n, i) => ({ ...n, sortOrder: i })),
      };
      if (initial?.id) {
        await updateWorkflowWithNodes(initial.id, payload);
        router.refresh();
      } else {
        const id = await createWorkflowWithNodes(payload);
        router.push(`/app/settings/workflows/${id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header metadata */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-semibold text-neutral-800">
          Informacje o procesie
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">
              Nazwa procesu *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Proces obsługi wesela"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">
              Typ eventu (opcjonalnie)
            </label>
            <Input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              placeholder="WEDDING, CORPORATE, …"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-neutral-600 mb-1 block">
            Opis
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krótki opis procesu…"
            rows={2}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-neutral-600">
            Domyślny proces (automatycznie przypisywany do nowych eventów)
          </span>
        </label>
      </div>

      {/* Kroki + podgląd agendy obok. Bez podglądu efekt konfiguracji widać
          dopiero na prawdziwym evencie, czyli zwykle tydzień później. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <div className="space-y-3 min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-800">
            Kroki procesu
          </h2>
          <span className="text-sm text-neutral-400">{nodes.length} kroków</span>
        </div>

        {/* Visual flow preview */}
        <div className="flex items-center gap-1 flex-wrap">
          {nodes.map((n, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  n.isStart
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : n.nodeType === "DECISION"
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : n.nodeType === "END"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-neutral-50 border-neutral-300 text-neutral-600"
                }`}
              >
                <ActionIcon actionType={n.actionType} />
                <span>{n.name || `Krok ${i + 1}`}</span>
              </div>
              {i < nodes.length - 1 && (
                <ArrowRight className="w-3 h-3 text-neutral-300" />
              )}
            </div>
          ))}
        </div>

        {nodes.map((node, index) => (
          <NodeEditor
            key={index}
            node={node}
            index={index}
            total={nodes.length}
            nodeTargets={nodeTargets}
            roleOptions={roleOptions}
            presetValues={presetValues}
            onChange={(updated) => updateNode(index, updated)}
            onMoveUp={() => moveNode(index, "up")}
            onMoveDown={() => moveNode(index, "down")}
            onRemove={() => removeNode(index)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addNode}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj krok
        </Button>
      </div>

      <div className="xl:sticky xl:top-4">
        <AgendaPreview nodes={nodes} />
      </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Zapisywanie…" : "Zapisz proces"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/app/settings/workflows")}
        >
          Anuluj
        </Button>
      </div>
    </div>
  );
}
