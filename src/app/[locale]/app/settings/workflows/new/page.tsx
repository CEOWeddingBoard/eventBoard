import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { getOrgCustomRoles } from "@/lib/actions/team.actions";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewWorkflowPage() {
  const customRoles = await getOrgCustomRoles();
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Link
        href="/app/settings/workflows"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Wróć do listy procesów
      </Link>
      <h1 className="text-xl font-bold text-neutral-900">Nowy proces</h1>
      <WorkflowBuilder customRoles={customRoles} />
    </div>
  );
}
