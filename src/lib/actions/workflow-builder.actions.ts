"use server";

import { prisma } from "@/lib/prisma";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getCurrentUser } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";
import type { StepField } from "@/lib/workflow-agenda-fields";

export type WorkflowNodeData = {
  id?: string;
  name: string;
  description?: string;
  nodeType: "ACTION" | "DECISION" | "PARALLEL" | "END";
  actionType:
    | "NONE"
    | "CLIENT_FORM"
    | "MENU_SELECTION"
    | "APPROVAL"
    | "PAYMENT"
    | "DOCUMENT"
    | "AGENDA"
    | "SEND_MESSAGE";
  assigneeRole: "OWNER" | "MANAGER" | "STAFF" | "CLIENT" | "BOTH";
  sortOrder: number;
  color?: string;
  fieldMappings: FieldMapping[];
  conditions: NodeCondition[];
  nextNodeId?: string;
  isStart?: boolean;
  menuMode?: string;
  // Kto wypełnia krok, a kto akceptuje — definiowane na etapie procesu.
  fillRole?: string;
  approveRole?: string;
  // Pola wypełniane na kroku (wartości → agenda po akceptacji).
  fields?: StepField[];
};

export type FieldMapping = {
  sourceKey: string;
  targetAgendaKey: string;
  transform?: "join_comma" | "join_newline" | "date_pl" | "none";
};

export type NodeCondition = {
  label: string;
  conditionType: "always" | "field_equals" | "client_choice" | "manual";
  conditionValue?: string;
  nextNodeId: string;
};

export type WorkflowWithNodes = {
  id: string;
  name: string;
  description: string | null;
  eventType: string | null;
  isDefault: boolean;
  nodes: WorkflowNodeData[];
};

async function getOrgId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("Not a member of any organization");
  return orgId;
}

async function assertCanManage(orgId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const member = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizationId: orgId },
    select: { role: true },
  });
  if (!member || member.role === "VIEWER" || member.role === "STAFF") {
    throw new Error("Insufficient permissions");
  }
}

function parseNodes(
  nodes: {
    id: string;
    name: string;
    description: string | null;
    nodeType: string;
    actionType: string;
    assigneeRole: string;
    sortOrder: number;
    color: string | null;
    fieldMappingsJson: string;
    conditionsJson: string;
    nextNodeId: string | null;
    isStart: boolean;
    menuMode: string | null;
    fillRole?: string | null;
    approveRole?: string | null;
    fieldsJson?: string | null;
  }[]
): WorkflowNodeData[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    description: n.description ?? undefined,
    nodeType: n.nodeType as WorkflowNodeData["nodeType"],
    actionType: n.actionType as WorkflowNodeData["actionType"],
    assigneeRole: n.assigneeRole as WorkflowNodeData["assigneeRole"],
    sortOrder: n.sortOrder,
    color: n.color ?? undefined,
    fieldMappings: JSON.parse(n.fieldMappingsJson) as FieldMapping[],
    conditions: JSON.parse(n.conditionsJson) as NodeCondition[],
    nextNodeId: n.nextNodeId ?? undefined,
    isStart: n.isStart,
    menuMode: n.menuMode ?? undefined,
    fillRole: n.fillRole ?? undefined,
    approveRole: n.approveRole ?? undefined,
    fields: n.fieldsJson ? (JSON.parse(n.fieldsJson) as StepField[]) : [],
  }));
}

export async function listWorkflowsWithNodes(): Promise<WorkflowWithNodes[]> {
  const orgId = await getOrgId();
  const workflows = await prisma.organizationWorkflow.findMany({
    where: { organizationId: orgId },
    include: {
      nodes: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
  return workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    eventType: w.eventType,
    isDefault: w.isDefault,
    nodes: parseNodes(w.nodes),
  }));
}

export async function getWorkflowWithNodes(
  workflowId: string
): Promise<WorkflowWithNodes | null> {
  const orgId = await getOrgId();
  const workflow = await prisma.organizationWorkflow.findFirst({
    where: { id: workflowId, organizationId: orgId },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!workflow) return null;
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    eventType: workflow.eventType,
    isDefault: workflow.isDefault,
    nodes: parseNodes(workflow.nodes),
  };
}

export async function createWorkflowWithNodes(input: {
  name: string;
  description?: string;
  eventType?: string;
  isDefault?: boolean;
  nodes: WorkflowNodeData[];
}): Promise<string> {
  const orgId = await getOrgId();
  await assertCanManage(orgId);

  const workflow = await prisma.organizationWorkflow.create({
    data: {
      organizationId: orgId,
      name: input.name,
      description: input.description,
      eventType: input.eventType,
      isDefault: input.isDefault ?? false,
      stagesJson: "[]",
      nodes: {
        create: input.nodes.map((n, i) => ({
          name: n.name,
          description: n.description,
          nodeType: n.nodeType,
          actionType: n.actionType,
          assigneeRole: n.assigneeRole,
          sortOrder: n.sortOrder ?? i,
          color: n.color,
          fieldMappingsJson: JSON.stringify(n.fieldMappings ?? []),
          conditionsJson: JSON.stringify(n.conditions ?? []),
          nextNodeId: n.nextNodeId,
          isStart: n.isStart ?? i === 0,
          menuMode: n.menuMode ?? null,
          fillRole: n.fillRole ?? null,
          approveRole: n.approveRole ?? null,
          fieldsJson: JSON.stringify(n.fields ?? []),
        })),
      },
    },
  });

  revalidatePath("/app/settings/workflows");
  return workflow.id;
}

export async function updateWorkflowWithNodes(
  workflowId: string,
  input: {
    name: string;
    description?: string;
    eventType?: string;
    isDefault?: boolean;
    nodes: WorkflowNodeData[];
  }
): Promise<void> {
  const orgId = await getOrgId();
  await assertCanManage(orgId);

  await prisma.$transaction(async (tx) => {
    await tx.organizationWorkflow.update({
      where: { id: workflowId, organizationId: orgId },
      data: {
        name: input.name,
        description: input.description,
        eventType: input.eventType,
        isDefault: input.isDefault ?? false,
      },
    });

    const existing = await tx.workflowNode.findMany({
      where: { workflowId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((n) => n.id));

    // Węzły przysłane z istniejącym id aktualizujemy w miejscu. Podmiana
    // (deleteMany + createMany) generowała nowe identyfikatory, przez co
    // conditions[].nextNodeId, nextNodeId oraz EventProcessState.currentNodeId
    // wskazywały po zapisie na nieistniejące węzły i proces się zacinał.
    const keptIds = new Set(
      input.nodes
        .map((n) => n.id)
        .filter((id): id is string => Boolean(id) && existingIds.has(id as string)),
    );

    const removedIds = [...existingIds].filter((id) => !keptIds.has(id));
    if (removedIds.length > 0) {
      await tx.workflowNode.deleteMany({ where: { id: { in: removedIds } } });
    }

    const removed = new Set(removedIds);
    for (const [i, n] of input.nodes.entries()) {
      const data = {
        name: n.name,
        description: n.description,
        nodeType: n.nodeType,
        actionType: n.actionType,
        assigneeRole: n.assigneeRole,
        sortOrder: n.sortOrder ?? i,
        color: n.color,
        fieldMappingsJson: JSON.stringify(n.fieldMappings ?? []),
        // Referencje do skasowanych węzłów są odrzucane, żeby nie zostawić
        // gałęzi prowadzącej donikąd.
        conditionsJson: JSON.stringify(
          (n.conditions ?? []).filter((c) => !removed.has(c.nextNodeId)),
        ),
        nextNodeId: n.nextNodeId && !removed.has(n.nextNodeId) ? n.nextNodeId : null,
        isStart: n.isStart ?? i === 0,
        menuMode: n.menuMode ?? null,
        fillRole: n.fillRole ?? null,
        approveRole: n.approveRole ?? null,
        fieldsJson: JSON.stringify(n.fields ?? []),
      };

      if (n.id && keptIds.has(n.id)) {
        await tx.workflowNode.update({ where: { id: n.id }, data });
      } else {
        await tx.workflowNode.create({ data: { workflowId, ...data } });
      }
    }
  });

  revalidatePath("/app/settings/workflows");
  revalidatePath(`/app/settings/workflows/${workflowId}`);
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const orgId = await getOrgId();
  await assertCanManage(orgId);
  await prisma.organizationWorkflow.delete({
    where: { id: workflowId, organizationId: orgId },
  });
  revalidatePath("/app/settings/workflows");
}

export async function duplicateWorkflow(workflowId: string): Promise<string> {
  const orgId = await getOrgId();
  await assertCanManage(orgId);

  const source = await prisma.organizationWorkflow.findFirst({
    where: { id: workflowId, organizationId: orgId },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!source) throw new Error("Workflow not found");

  const copy = await prisma.organizationWorkflow.create({
    data: {
      organizationId: orgId,
      name: `${source.name} (kopia)`,
      description: source.description,
      eventType: source.eventType,
      isDefault: false,
      stagesJson: "[]",
      nodes: {
        create: source.nodes.map((n) => ({
          name: n.name,
          description: n.description,
          nodeType: n.nodeType,
          actionType: n.actionType,
          assigneeRole: n.assigneeRole,
          sortOrder: n.sortOrder,
          color: n.color,
          fieldMappingsJson: n.fieldMappingsJson,
          conditionsJson: n.conditionsJson,
          nextNodeId: n.nextNodeId,
          isStart: n.isStart,
          menuMode: n.menuMode,
          fillRole: n.fillRole,
          approveRole: n.approveRole,
          fieldsJson: n.fieldsJson,
        })),
      },
    },
  });

  revalidatePath("/app/settings/workflows");
  return copy.id;
}
