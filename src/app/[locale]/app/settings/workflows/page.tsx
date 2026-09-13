import { listWorkflowsWithNodes } from "@/lib/actions/workflow-builder.actions";
import { deleteWorkflow, duplicateWorkflow } from "@/lib/actions/workflow-builder.actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  GitBranch,
  Copy,
  Pencil,
  Trash2,
  ArrowRight,
  CheckSquare,
  CreditCard,
  FileText,
  Calendar,
  MessageSquare,
  ClipboardList,
  UtensilsCrossed,
  Layers,
} from "lucide-react";

function actionIcon(actionType: string) {
  const icons: Record<string, React.ElementType> = {
    CLIENT_FORM: ClipboardList,
    MENU_SELECTION: UtensilsCrossed,
    APPROVAL: CheckSquare,
    PAYMENT: CreditCard,
    DOCUMENT: FileText,
    AGENDA: Calendar,
    SEND_MESSAGE: MessageSquare,
    NONE: Layers,
  };
  const Icon = icons[actionType] ?? Layers;
  return <Icon className="w-3 h-3" />;
}

async function DeleteButton({ workflowId }: { workflowId: string }) {
  async function action() {
    "use server";
    await deleteWorkflow(workflowId);
    redirect("/app/settings/workflows");
  }
  return (
    <form action={action}>
      <button
        type="submit"
        className="p-1.5 rounded hover:bg-red-100 text-neutral-400 hover:text-red-500 transition-colors"
        title="Usuń"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}

async function DuplicateButton({ workflowId }: { workflowId: string }) {
  async function action() {
    "use server";
    await duplicateWorkflow(workflowId);
    redirect("/app/settings/workflows");
  }
  return (
    <form action={action}>
      <button
        type="submit"
        className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
        title="Duplikuj"
      >
        <Copy className="w-4 h-4" />
      </button>
    </form>
  );
}

export default async function WorkflowsListPage() {
  let workflows: Awaited<ReturnType<typeof listWorkflowsWithNodes>> = [];
  let dbError = false;
  try {
    workflows = await listWorkflowsWithNodes();
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <GitBranch className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-neutral-700 mb-2">Trwa aktualizacja bazy danych</h2>
        <p className="text-sm text-neutral-500">
          Nowe tabele procesów są instalowane. Odśwież stronę za chwilę lub poczekaj na zakończenie deployu.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Procesy obsługi</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Definiuj ścieżki obsługi eventów z drzewem decyzyjnym i mapowaniem agendy
          </p>
        </div>
        <Link
          href="/app/settings/workflows/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nowy proces
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white py-16 text-center">
          <GitBranch className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">Brak procesów</p>
          <p className="text-sm text-neutral-400 mt-1 mb-4">
            Utwórz pierwszy proces obsługi eventu
          </p>
          <Link
            href="/app/settings/workflows/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Utwórz proces
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-neutral-800 truncate">
                      {w.name}
                    </h2>
                    {w.isDefault && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 font-semibold flex-shrink-0">
                        DOMYŚLNY
                      </span>
                    )}
                    {w.eventType && (
                      <span className="text-[10px] bg-neutral-100 text-neutral-500 rounded px-1.5 py-0.5 flex-shrink-0">
                        {w.eventType}
                      </span>
                    )}
                  </div>
                  {w.description && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {w.description}
                    </p>
                  )}

                  {/* Node flow preview */}
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    {w.nodes.map((n, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            n.isStart
                              ? "bg-blue-50 border-blue-200 text-blue-600"
                              : n.nodeType === "DECISION"
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : n.nodeType === "END"
                              ? "bg-green-50 border-green-200 text-green-600"
                              : "bg-neutral-50 border-neutral-200 text-neutral-500"
                          }`}
                        >
                          {actionIcon(n.actionType)}
                          <span>{n.name}</span>
                        </div>
                        {i < w.nodes.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-neutral-300" />
                        )}
                      </div>
                    ))}
                    {w.nodes.length === 0 && (
                      <span className="text-xs text-neutral-400 italic">
                        Brak kroków
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <DuplicateButton workflowId={w.id} />
                  <Link
                    href={`/app/settings/workflows/${w.id}`}
                    className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="Edytuj"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteButton workflowId={w.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
