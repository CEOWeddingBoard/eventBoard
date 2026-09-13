"use server";

import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";
import { SCHEDULE_AGENDA_KEY, type StepField } from "@/lib/workflow-agenda-fields";

export type ProcessNodeStatus = "pending" | "current" | "completed";

export type ProcessNodeView = {
  id: string;
  name: string;
  description: string | null;
  nodeType: string;
  actionType: string;
  assigneeRole: string;
  sortOrder: number;
  color: string | null;
  fieldMappings: { sourceKey: string; targetAgendaKey: string; transform?: string }[];
  conditions: { label: string; conditionType: string; conditionValue?: string; nextNodeId: string }[];
  nextNodeId: string | null;
  isStart: boolean;
  menuMode: string | null;
  fillRole: string | null;
  approveRole: string | null;
  fields: StepField[];
  status: ProcessNodeStatus;
  completedAt?: string;
  completedBy?: string;
  completedRole?: string;
  data?: Record<string, unknown>;
};

export type ProcessStateView = {
  eventId: string;
  workflowId: string;
  workflowName: string;
  currentNodeId: string;
  nodes: ProcessNodeView[];
};

async function getOrgForEvent(eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId },
    select: { organizationId: true },
  });
  return event?.organizationId ?? null;
}

export async function getEventProcessState(
  eventId: string
): Promise<ProcessStateView | null> {
  const state = await prisma.eventProcessState.findUnique({
    where: { eventId },
    select: {
      workflowId: true,
      currentNodeId: true,
      completedNodeIds: true,
      nodeDataJson: true,
    },
  });
  if (!state) return null;

  const workflow = await prisma.organizationWorkflow.findUnique({
    where: { id: state.workflowId },
    select: {
      name: true,
      nodes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!workflow) return null;

  const completedIds: string[] = JSON.parse(state.completedNodeIds);
  const nodeData: Record<string, { completedAt?: string; completedBy?: string; role?: string; data?: Record<string, unknown> }> =
    JSON.parse(state.nodeDataJson);

  const nodes: ProcessNodeView[] = workflow.nodes.map((n) => {
    const nd = nodeData[n.id];
    let status: ProcessNodeStatus = "pending";
    if (completedIds.includes(n.id)) status = "completed";
    else if (n.id === state.currentNodeId) status = "current";

    return {
      id: n.id,
      name: n.name,
      description: n.description,
      nodeType: n.nodeType,
      actionType: n.actionType,
      assigneeRole: n.assigneeRole,
      sortOrder: n.sortOrder,
      color: n.color,
      fieldMappings: JSON.parse(n.fieldMappingsJson),
      conditions: JSON.parse(n.conditionsJson),
      nextNodeId: n.nextNodeId,
      isStart: n.isStart,
      menuMode: n.menuMode ?? null,
      fillRole: (n as { fillRole?: string | null }).fillRole ?? null,
      approveRole: (n as { approveRole?: string | null }).approveRole ?? null,
      fields: (() => {
        try {
          return JSON.parse((n as { fieldsJson?: string | null }).fieldsJson ?? "[]") as StepField[];
        } catch {
          return [];
        }
      })(),
      status,
      completedAt: nd?.completedAt,
      completedBy: nd?.completedBy,
      completedRole: nd?.role,
      data: nd?.data,
    };
  });

  return {
    eventId,
    workflowId: state.workflowId,
    workflowName: workflow.name,
    currentNodeId: state.currentNodeId,
    nodes,
  };
}

export async function initEventProcess(
  eventId: string,
  workflowId: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const workflow = await prisma.organizationWorkflow.findFirst({
    where: { id: workflowId },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!workflow || workflow.nodes.length === 0) throw new Error("Workflow not found or empty");

  const startNode = workflow.nodes.find((n) => n.isStart) ?? workflow.nodes[0];

  await prisma.eventProcessState.upsert({
    where: { eventId },
    create: {
      eventId,
      workflowId,
      currentNodeId: startNode.id,
      completedNodeIds: "[]",
      nodeDataJson: "{}",
    },
    update: {
      workflowId,
      currentNodeId: startNode.id,
      completedNodeIds: "[]",
      nodeDataJson: "{}",
    },
  });

  // Keep legacy workflowStageId in sync
  await prisma.event.update({
    where: { id: eventId },
    data: { workflowId, workflowStageId: startNode.id },
  });

  await prisma.eventWorkflowHistory.create({
    data: { eventId, toStage: startNode.name, note: "Proces zainicjowany" },
  });

  revalidatePath(`/app/events/${eventId}`);
}

async function applyFieldMappings(
  eventId: string,
  fieldMappings: { sourceKey: string; targetAgendaKey: string; transform?: string }[],
  stepData: Record<string, unknown>
): Promise<void> {
  if (fieldMappings.length === 0) return;

  const current = await prisma.eventAgendaData.findUnique({
    where: { eventId },
    select: { dataJson: true },
  });
  const existing: Record<string, unknown> = current ? JSON.parse(current.dataJson) : {};

  for (const mapping of fieldMappings) {
    let value = stepData[mapping.sourceKey];
    if (value === undefined) continue;

    if (mapping.transform === "join_comma" && Array.isArray(value)) {
      value = value.join(", ");
    } else if (mapping.transform === "join_newline" && Array.isArray(value)) {
      value = value.join("\n");
    } else if (mapping.transform === "date_pl" && typeof value === "string") {
      try {
        value = new Date(value).toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {
        // keep original
      }
    }

    existing[mapping.targetAgendaKey] = value;
  }

  await prisma.eventAgendaData.upsert({
    where: { eventId },
    create: { eventId, dataJson: JSON.stringify(existing) },
    update: { dataJson: JSON.stringify(existing) },
  });
}

function formatFieldValue(field: StepField, raw: unknown): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (field.type === "date") {
    try {
      return new Date(value).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Zapisuje wartości pól kroku do agendy. Każde pole trafia pod swój
 * `targetAgendaKey`, a pola-czasy oznaczone jako pozycja harmonogramu składają
 * się na harmonogram Z PROCESU (posortowany po godzinie, jedna linia na krok).
 */
async function applyStepFields(
  eventId: string,
  nodeId: string,
  nodeName: string,
  fields: StepField[],
  stepData: Record<string, unknown>
): Promise<void> {
  if (fields.length === 0) return;

  const current = await prisma.eventAgendaData.findUnique({
    where: { eventId },
    select: { dataJson: true },
  });
  const existing: Record<string, unknown> = current ? JSON.parse(current.dataJson) : {};

  const scheduleByNode: Record<string, { time: string; title: string }> =
    (existing["__scheduleByNode"] as Record<string, { time: string; title: string }>) ?? {};

  for (const field of fields) {
    const value = formatFieldValue(field, stepData[field.key]);
    if (!value) continue;

    // Pole-czas oznaczone jako pozycja harmonogramu idzie WYŁĄCZNIE do
    // harmonogramu — inaczej ta sama godzina dublowałaby się jako osobny wpis.
    if (field.scheduleLine && field.type === "time") {
      scheduleByNode[nodeId] = { time: value, title: nodeName };
    } else {
      existing[field.targetAgendaKey] = value;
    }
  }

  // Odtwarzamy harmonogram z wszystkich kroków czasowych, posortowany po godzinie.
  if (Object.keys(scheduleByNode).length > 0) {
    existing["__scheduleByNode"] = scheduleByNode;
    const lines = Object.values(scheduleByNode)
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((s) => `${s.time} — ${s.title}`);
    existing[SCHEDULE_AGENDA_KEY] = lines.join("\n");
  }

  await prisma.eventAgendaData.upsert({
    where: { eventId },
    create: { eventId, dataJson: JSON.stringify(existing) },
    update: { dataJson: JSON.stringify(existing) },
  });
}

function resolveNextNode(
  currentNode: { conditions: { conditionType: string; conditionValue?: string; nextNodeId: string }[]; nextNodeId: string | null },
  stepData: Record<string, unknown>,
  allNodes: { id: string; sortOrder: number }[]
): string | null {
  // Decision node: evaluate conditions
  if (currentNode.conditions && currentNode.conditions.length > 0) {
    for (const cond of currentNode.conditions) {
      if (cond.conditionType === "always") return cond.nextNodeId;
      if (cond.conditionType === "manual") return cond.nextNodeId;
      if (cond.conditionType === "client_choice") {
        if (stepData["selectedVariantLabel"] === cond.conditionValue) return cond.nextNodeId;
      }
      if (cond.conditionType === "field_equals") {
        const [field, val] = (cond.conditionValue ?? "").split("=");
        if (stepData[field] === val) return cond.nextNodeId;
      }
    }
    // fallback: first condition
    return currentNode.conditions[0]?.nextNodeId ?? null;
  }

  // Explicit nextNodeId
  if (currentNode.nextNodeId) return currentNode.nextNodeId;

  // Linear fallback: next by sortOrder
  const sorted = [...allNodes].sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIdx = sorted.findIndex(
    (n) => n.id === (currentNode as unknown as { id?: string }).id
  );
  if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
    return sorted[currentIdx + 1].id;
  }
  return null;
}

export async function completeProcessNode(
  eventId: string,
  nodeId: string,
  data: Record<string, unknown>,
  completedByRole: "CLIENT" | "ORGANIZER"
): Promise<{ nextNodeId: string | null; done: boolean }> {
  const user = await getCurrentUser();
  const completedBy = user?.id ?? "client";

  const state = await prisma.eventProcessState.findUnique({
    where: { eventId },
  });
  if (!state) throw new Error("No process state found for event");
  if (state.currentNodeId !== nodeId) {
    throw new Error(`Node ${nodeId} is not the current node`);
  }

  const workflow = await prisma.organizationWorkflow.findUnique({
    where: { id: state.workflowId },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!workflow) throw new Error("Workflow not found");

  const currentNode = workflow.nodes.find((n) => n.id === nodeId);
  if (!currentNode) throw new Error("Node not found in workflow");

  // Apply field mappings (legacy sourceKey→target) + step fields (nowe pola kroku)
  await applyFieldMappings(eventId, JSON.parse(currentNode.fieldMappingsJson), data);
  let stepFields: StepField[] = [];
  try {
    stepFields = JSON.parse((currentNode as { fieldsJson?: string | null }).fieldsJson ?? "[]");
  } catch {
    stepFields = [];
  }
  await applyStepFields(eventId, currentNode.id, currentNode.name, stepFields, data);

  // Wybór menu to rzecz podstawowa — odkładamy go do agendy ZAWSZE, niezależnie
  // od tego, czy ktoś skonfigurował mapowanie na tym węźle. Bez tego procesy
  // zbudowane bez mapowania menu (np. przez wcześniejszy builder) gubiły menu
  // w dokumencie.
  if (currentNode.actionType === "MENU_SELECTION") {
    const menuText =
      (typeof data.menuSummary === "string" && data.menuSummary.trim()) ||
      (typeof data.selectedVariantLabel === "string" && data.selectedVariantLabel.trim()) ||
      "";
    if (menuText) {
      await applyStepFields(
        eventId,
        currentNode.id,
        currentNode.name,
        [{ key: "__menu", label: "Menu", type: "text", targetAgendaKey: "agenda.menu" }],
        { __menu: menuText },
      );
    }
    const dishes = Array.isArray(data.selectedDishes)
      ? data.selectedDishes.join(", ")
      : typeof data.selectedDishes === "string"
        ? data.selectedDishes
        : "";
    if (dishes.trim()) {
      await applyStepFields(
        eventId,
        currentNode.id,
        currentNode.name,
        [{ key: "__dishes", label: "Dania", type: "text", targetAgendaKey: "agenda.menuSzczegoly" }],
        { __dishes: dishes },
      );
    }
  }

  // Update node data
  const nodeDataMap: Record<string, unknown> = JSON.parse(state.nodeDataJson);
  nodeDataMap[nodeId] = {
    completedAt: new Date().toISOString(),
    completedBy,
    role: completedByRole,
    data,
  };

  const completedIds: string[] = JSON.parse(state.completedNodeIds);
  if (!completedIds.includes(nodeId)) completedIds.push(nodeId);

  // Resolve next node
  const nextNodeId = resolveNextNode(
    {
      conditions: JSON.parse(currentNode.conditionsJson),
      nextNodeId: currentNode.nextNodeId,
      id: currentNode.id,
    } as Parameters<typeof resolveNextNode>[0] & { id: string },
    data,
    workflow.nodes.map((n) => ({ id: n.id, sortOrder: n.sortOrder }))
  );

  const done = !nextNodeId;

  await prisma.eventProcessState.update({
    where: { eventId },
    data: {
      completedNodeIds: JSON.stringify(completedIds),
      nodeDataJson: JSON.stringify(nodeDataMap),
      currentNodeId: nextNodeId ?? nodeId,
    },
  });

  // Keep legacy field in sync
  if (nextNodeId) {
    const nextNode = workflow.nodes.find((n) => n.id === nextNodeId);
    await prisma.event.update({
      where: { id: eventId },
      data: { workflowStageId: nextNodeId },
    });
    await prisma.eventWorkflowHistory.create({
      data: {
        eventId,
        fromStage: currentNode.name,
        toStage: nextNode?.name ?? nextNodeId,
        note: `Ukończono przez ${completedByRole}`,
      },
    });
  }

  // Notify organization when client completes a step
  if (completedByRole === "CLIENT") {
    const event = await prisma.event.findFirst({
      where: { id: eventId },
      select: { organizationId: true, name: true },
    });
    if (event?.organizationId) {
      await prisma.orgNotification.create({
        data: {
          organizationId: event.organizationId,
          type: "CLIENT_REPLY",
          title: `Klient ukończył krok: ${currentNode.name}`,
          body: `Event: ${event.name}`,
          link: `/app/events/${eventId}`,
        },
      });
    }
  }

  revalidatePath(`/app/events/${eventId}`);
  revalidatePath(`/portal`);
  return { nextNodeId, done };
}

export async function getEventProcessStateForPortal(token: string): Promise<ProcessStateView | null> {
  // clientLinkTokenHash trzyma HASH tokenu (portal EventBoard), a weddingBoardToken
  // jest surowy (portal WeddingBoard). Wcześniej porównywano surowy token do hasha,
  // więc portal EventBoard nigdy nie odnajdywał procesu i krok klienta nie pokazywał się.
  const hashed = createHash("sha256").update(token).digest("hex");
  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { clientLinkTokenHash: hashed },
        { weddingBoardToken: token },
      ],
    },
    select: { id: true },
  });
  if (!event) return null;
  return getEventProcessState(event.id);
}
