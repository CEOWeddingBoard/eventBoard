"use client";

import { useState } from "react";
import {
  completeProcessNode,
  initEventProcess,
  type ProcessStateView,
  type ProcessNodeView,
} from "@/lib/actions/process-runtime.actions";
import { listWorkflowsWithNodes } from "@/lib/actions/workflow-builder.actions";
import { assigneeRoleLabel } from "@/lib/workflow-roles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  TABLE_ROWS_KEY,
  isTableStep,
  type StepField,
  type TableRow,
} from "@/lib/workflow-agenda-fields";
import { StepTable } from "@/components/workflow/StepTable";
import { MenuImportDialog } from "@/components/menu/MenuImportDialog";
import {
  CheckCircle2,
  Circle,
  GitBranch,
  Clock,
  ChevronRight,
  Play,
  ArrowRight,
  CheckSquare,
  CreditCard,
  FileText,
  Calendar,
  MessageSquare,
  ClipboardList,
  UtensilsCrossed,
  Layers,
  Lock,
  User,
  Users,
} from "lucide-react";

function ActionIcon({ actionType, className = "w-4 h-4" }: { actionType: string; className?: string }) {
  const map: Record<string, React.ElementType> = {
    CLIENT_FORM: ClipboardList,
    MENU_SELECTION: UtensilsCrossed,
    APPROVAL: CheckSquare,
    PAYMENT: CreditCard,
    DOCUMENT: FileText,
    AGENDA: Calendar,
    SEND_MESSAGE: MessageSquare,
    NONE: Layers,
  };
  const Icon = map[actionType] ?? Layers;
  return <Icon className={className} />;
}

function AssigneeIcon({ role }: { role: string }) {
  if (role === "CLIENT") return <User className="w-3 h-3 text-orange-500" />;
  if (role === "BOTH") return <Users className="w-3 h-3 text-purple-500" />;
  return <User className="w-3 h-3 text-blue-500" />;
}

const assigneeLabel = assigneeRoleLabel;

const normRole = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
/** Czy widz ma wymaganą rolę (dopasowanie po wartości i etykiecie, np. CHEF↔Kucharz). */
function viewerHasRole(required: string | null | undefined, roles: string[]): boolean {
  if (!required) return true;
  const req = normRole(required);
  const reqLabel = normRole(assigneeRoleLabel(required));
  return roles.some((r) => {
    const rv = normRole(r);
    return rv === req || rv === reqLabel || normRole(assigneeRoleLabel(r)) === req;
  });
}

function NodeStatusIcon({ status }: { status: ProcessNodeView["status"] }) {
  if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === "current") return <Circle className="w-5 h-5 text-blue-600 fill-blue-100" />;
  return <Circle className="w-5 h-5 text-neutral-300" />;
}

function NodeActionPanel({
  node,
  eventId,
  menuSelection,
  viewerRoles = [],
  canOverride = true,
  onDone,
}: {
  node: ProcessNodeView;
  eventId: string;
  menuSelection?: { variantLabel: string; guests: number }[];
  viewerRoles?: string[];
  canOverride?: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<TableRow[]>([]);
  const [menuImported, setMenuImported] = useState(false);
  const [menuSummary, setMenuSummary] = useState("");

  const fields = node.fields ?? [];
  const isTable = isTableStep(node.actionType);
  const filledRows = rows.filter((r) => Object.values(r).some((v) => String(v ?? "").trim()));
  const missingRequired = isTable
    ? filledRows.length === 0
    : fields.some((f) => f.required && !(fieldValues[f.key] ?? "").trim());

  async function complete(extraData: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      await completeProcessNode(eventId, node.id, { note, ...fieldValues, ...extraData }, "ORGANIZER");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  // Bramka ról: krok przypisany do roli operacyjnej wykona tylko osoba z tą
  // rolą; właściciel/admin/serwis nadpisują. Kroki klienta obsługuje portal —
  // ręczne przejście też tylko z prawem nadpisania.
  const requiredFill = node.fillRole || node.assigneeRole;
  const isClientStep = requiredFill === "CLIENT" || requiredFill === "BOTH";
  const allowed = canOverride || (!isClientStep && viewerHasRole(requiredFill, viewerRoles));
  if (!allowed) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
        <Lock className="w-4 h-4 flex-shrink-0 text-neutral-400" />
        <p className="text-sm text-neutral-500">
          Ten krok wykonuje: <b>{assigneeLabel(requiredFill)}</b>. Nie masz tej roli — poproś odpowiednią osobę.
        </p>
      </div>
    );
  }

  const fieldsUi =
    fields.length > 0 ? (
      <div className="space-y-2">
        {fields.map((f: StepField) => (
          <div key={f.key}>
            <label className="text-xs text-neutral-500 mb-1 block">
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>
            {f.type === "textarea" ? (
              <Textarea
                value={fieldValues[f.key] ?? ""}
                onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={2}
                className="text-sm"
              />
            ) : f.type === "select" ? (
              <select
                value={fieldValues[f.key] ?? ""}
                onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">— wybierz —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <Input
                type={f.type === "time" ? "time" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                value={fieldValues[f.key] ?? ""}
                onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="text-sm"
              />
            )}
          </div>
        ))}
      </div>
    ) : null;

  // Krok „Wklej menu": reguły rozpoznawania sekcji są ustawieniem obiektu
  // (/app/settings/menu-parser), a sam import tworzy warianty menu tego eventu.
  if (node.actionType === "MENU_IMPORT") {
    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs text-neutral-500">
          Wklej menu z oferty — system rozpozna sekcje i dania według reguł obiektu,
          a Ty uzupełnisz liczby porcji przy wariantach.
        </p>
        <MenuImportDialog eventId={eventId} onImported={() => setMenuImported(true)} />
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Podsumowanie do agendy</label>
          <Textarea
            value={menuSummary}
            onChange={(e) => setMenuSummary(e.target.value)}
            rows={2}
            className="text-sm"
            placeholder="np. Wariant Złoty — 80 os., Wariant Srebrny — 40 os."
          />
        </div>
        <Button
          onClick={() => complete({ menuSummary: menuSummary.trim() })}
          disabled={busy || (!menuImported && !menuSummary.trim())}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckSquare className="w-4 h-4 mr-1.5" />
          Zapisz i przejdź dalej
        </Button>
      </div>
    );
  }

  // Krok tabelaryczny: obsługa wypełnia arkusz tak samo jak klient w portalu.
  if (isTable) {
    return (
      <div className="mt-3 space-y-3">
        <StepTable columns={fields} rows={rows} onChange={setRows} />
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Notatka (opcjonalna)</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="Uwagi do kroku…" />
        </div>
        <Button
          onClick={() => complete({ [TABLE_ROWS_KEY]: filledRows, rowCount: String(filledRows.length) })}
          disabled={busy || missingRequired}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckSquare className="w-4 h-4 mr-1.5" />
          Zapisz i przejdź dalej ({filledRows.length})
        </Button>
      </div>
    );
  }

  // Kroki z polami (wypełnia zespół w panelu): pokaż pola + jeden przycisk zapisu.
  // Dla akcji klienta (MENU_SELECTION itp.) niżej są dedykowane widoki.
  if (fields.length > 0 && node.actionType !== "MENU_SELECTION") {
    return (
      <div className="mt-3 space-y-3">
        {fieldsUi}
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Notatka (opcjonalna)</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="Uwagi do kroku…" />
        </div>
        <Button
          onClick={() => complete({ approved: true, paid: true })}
          disabled={busy || missingRequired}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckSquare className="w-4 h-4 mr-1.5" />
          Zapisz i przejdź dalej
        </Button>
      </div>
    );
  }

  if (node.actionType === "MENU_SELECTION" && menuSelection && menuSelection.length > 0) {
    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs font-medium text-neutral-600">Wybór klienta:</p>
        <div className="space-y-1.5">
          {menuSelection.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-orange-800">{s.variantLabel}</span>
              <span className="text-xs text-orange-600">{s.guests} os.</span>
            </div>
          ))}
        </div>
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Notatka (opcjonalna)</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="Uwagi do wyboru menu…" />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => complete({ selectedVariantLabel: menuSelection[0]?.variantLabel, approved: true })}
            disabled={busy}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckSquare className="w-4 h-4 mr-1.5" />
            Zatwierdź wybór
          </Button>
          <Button
            onClick={() => complete({ approved: false })}
            disabled={busy}
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Poproś o korektę
          </Button>
        </div>
      </div>
    );
  }

  if (node.actionType === "APPROVAL") {
    return (
      <div className="mt-3 space-y-2">
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Komentarz</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="Opcjonalny komentarz do zatwierdzenia…" />
        </div>
        <Button onClick={() => complete({ approved: true })} disabled={busy} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <CheckSquare className="w-4 h-4 mr-1.5" />
          Zatwierdź i przejdź dalej
        </Button>
      </div>
    );
  }

  if (node.actionType === "SEND_MESSAGE") {
    return (
      <div className="mt-3 space-y-2">
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Treść wiadomości do klienta</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="text-sm" placeholder="Wiadomość dla klienta…" />
        </div>
        <Button onClick={() => complete()} disabled={busy || !note.trim()} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <MessageSquare className="w-4 h-4 mr-1.5" />
          Wyślij i przejdź dalej
        </Button>
      </div>
    );
  }

  if (node.actionType === "PAYMENT") {
    return (
      <div className="mt-3 space-y-2">
        <div>
          <label className="text-xs text-neutral-500 mb-1 block">Notatka o płatności</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="np. Zadatek 2000 zł — przelew potwierdzony" />
        </div>
        <Button onClick={() => complete({ paid: true })} disabled={busy} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <CreditCard className="w-4 h-4 mr-1.5" />
          Płatność potwierdzona
        </Button>
      </div>
    );
  }

  if (node.assigneeRole === "CLIENT" || node.assigneeRole === "BOTH") {
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
          <User className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">
            Oczekiwanie na działanie klienta w portalu
          </p>
        </div>
        <div className="mt-2">
          <label className="text-xs text-neutral-500 mb-1 block">Lub przejdź ręcznie</label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="Notatka…" />
        </div>
        <Button onClick={() => complete()} disabled={busy} size="sm" variant="outline" className="mt-2">
          Przejdź dalej ręcznie
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">Notatka (opcjonalna)</label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" placeholder="Uwagi do etapu…" />
      </div>
      <Button onClick={() => complete()} disabled={busy} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
        <ArrowRight className="w-4 h-4 mr-1.5" />
        Przejdź do następnego kroku
      </Button>
    </div>
  );
}

function WorkflowInitPanel({
  eventId,
  onInit,
}: {
  eventId: string;
  onInit: () => void;
}) {
  const [workflows, setWorkflows] = useState<{ id: string; name: string; nodes: { name: string }[] }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    if (loaded) return;
    setLoading(true);
    try {
      const data = await listWorkflowsWithNodes();
      setWorkflows(data);
      if (data.length > 0) setSelectedId(data[0].id);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  async function handleInit() {
    if (!selectedId) return;
    setLoading(true);
    try {
      await initEventProcess(eventId, selectedId);
      onInit();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500">
        Ten event nie ma przypisanego procesu. Wybierz proces, żeby rozpocząć obsługę.
      </p>
      {!loaded ? (
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? "Ładowanie…" : "Wybierz proces"}
        </Button>
      ) : (
        <div className="space-y-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white"
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.nodes.length} kroków)
              </option>
            ))}
          </select>
          <Button onClick={handleInit} disabled={loading || !selectedId} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="w-4 h-4 mr-1.5" />
            Rozpocznij proces
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProcessCenterPanel({
  eventId,
  initialState,
  menuSelection,
  viewerRoles = [],
  canOverride = true,
}: {
  eventId: string;
  initialState: ProcessStateView | null;
  menuSelection?: { variantLabel: string; guests: number }[];
  viewerRoles?: string[];
  canOverride?: boolean;
}) {
  const [state, setState] = useState<ProcessStateView | null>(initialState);
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
    // Full refresh via router.refresh() isn't available here — page server component will revalidate
    window.location.reload();
  }

  if (!state) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100 bg-neutral-50">
          <GitBranch className="w-5 h-5 text-blue-500" />
          <h2 className="text-base font-semibold text-neutral-800">Proces obsługi</h2>
        </div>
        <div className="px-5 py-4">
          <WorkflowInitPanel eventId={eventId} onInit={refresh} />
        </div>
      </section>
    );
  }

  const currentNode = state.nodes.find((n) => n.id === state.currentNodeId);
  const completedCount = state.nodes.filter((n) => n.status === "completed").length;
  const totalCount = state.nodes.length;
  const isDone = completedCount === totalCount;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GitBranch className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-800 truncate">
                {state.workflowName}
              </h2>
              <p className="text-xs text-neutral-500">
                {isDone ? "Proces zakończony" : `Krok ${completedCount + 1} z ${totalCount}`}
              </p>
            </div>
          </div>
          {!isDone && (
            <div className="flex-shrink-0 text-right">
              <span className="text-xs font-medium text-neutral-500">
                {Math.round((completedCount / totalCount) * 100)}%
              </span>
              <div className="w-24 h-1.5 bg-neutral-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Timeline */}
        <div className="space-y-1">
          {state.nodes.map((node, i) => (
            <div key={node.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <NodeStatusIcon status={node.status} />
                {i < state.nodes.length - 1 && (
                  <div className={`w-px flex-1 min-h-[16px] mt-1 ${node.status === "completed" ? "bg-emerald-300" : "bg-neutral-200"}`} />
                )}
              </div>
              <div className={`pb-3 flex-1 min-w-0 ${node.status === "current" ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${
                      node.status === "completed"
                        ? "text-emerald-700 line-through"
                        : node.status === "current"
                        ? "text-blue-700"
                        : "text-neutral-500"
                    }`}
                  >
                    {node.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <ActionIcon actionType={node.actionType} className="w-3 h-3 text-neutral-400" />
                    <AssigneeIcon role={node.assigneeRole} />
                    <span className="text-[10px] text-neutral-400">{assigneeLabel(node.assigneeRole)}</span>
                  </div>
                  {node.status === "completed" && node.completedAt && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(node.completedAt).toLocaleDateString("pl-PL")}
                    </span>
                  )}
                  {node.nodeType === "DECISION" && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 rounded px-1 py-0.5">DECYZJA</span>
                  )}
                </div>
                {node.description && node.status === "current" && (
                  <p className="text-xs text-neutral-500 mt-0.5">{node.description}</p>
                )}

                {/* Action panel for current node */}
                {node.status === "current" && !isDone && (
                  <NodeActionPanel
                    node={node}
                    eventId={eventId}
                    menuSelection={node.actionType === "MENU_SELECTION" ? menuSelection : undefined}
                    viewerRoles={viewerRoles}
                    canOverride={canOverride}
                    onDone={refresh}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {isDone && (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-700">
              Wszystkie kroki procesu zostały ukończone
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
