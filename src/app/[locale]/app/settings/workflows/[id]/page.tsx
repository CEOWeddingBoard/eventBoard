import { getWorkflowWithNodes } from "@/lib/actions/workflow-builder.actions";
import { getOrgCustomRoles } from "@/lib/actions/team.actions";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let workflow;
  try {
    workflow = await getWorkflowWithNodes(id);
  } catch {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <p className="text-sm text-neutral-500">Trwa aktualizacja bazy danych. Odśwież za chwilę.</p>
      </div>
    );
  }
  if (!workflow) notFound();

  const customRoles = await getOrgCustomRoles();

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-4">
      <Link
        href="/app/settings/workflows"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Wróć do listy procesów
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">
        Edytuj: {workflow.name}
      </h1>
      <WorkflowBuilder initial={workflow} customRoles={customRoles} />
    </div>
  );
}
