"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { sanitizePlacements } from "@/lib/object-type-placements";

async function getOrganizationId() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("Brak organizacji");
  return orgId;
}

export async function listOrganizationConfiguration() {
  const id = await getOrganizationId();
  const [objectTypes, workflows] = await Promise.all([
    prisma.organizationObjectType.findMany({ where: { organizationId: id }, orderBy: { name: "asc" } }),
    prisma.organizationWorkflow.findMany({
      where: { organizationId: id },
      orderBy: { name: "asc" },
      // stagesJson jest przestarzałe — liczbę kroków bierzemy z węzłów.
      include: { _count: { select: { nodes: true } } },
    }),
  ]);
  return {
    objectTypes: objectTypes.map((item) => ({
      ...item,
      fields: JSON.parse(item.fieldsJson),
      visibleIn: item.visibleInJson ? JSON.parse(item.visibleInJson) : [],
      workflowId: item.workflowId ?? null,
    })),
    workflows: workflows.map((item) => ({
      ...item,
      stages: JSON.parse(item.stagesJson),
      nodeCount: item._count.nodes,
    })),
  };
}

async function resolveWorkflowId(organizationId: string, workflowId?: string | null) {
  if (!workflowId) return null;
  const workflow = await prisma.organizationWorkflow.findFirst({
    where: { id: workflowId, organizationId },
    select: { id: true },
  });
  if (!workflow) throw new Error("Nie znaleziono procesu");
  return workflow.id;
}

export async function createOrganizationObjectType(input: {
  name: string;
  description?: string;
  icon?: string;
  fields: unknown[];
  visibleIn: string[];
  workflowId?: string | null;
}) {
  const id = await getOrganizationId();
  const result = await prisma.organizationObjectType.create({
    data: {
      organizationId: id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      icon: input.icon || null,
      fieldsJson: JSON.stringify(input.fields),
      visibleInJson: JSON.stringify(sanitizePlacements(input.visibleIn)),
      workflowId: await resolveWorkflowId(id, input.workflowId),
    },
  });
  revalidatePath("/app/settings/configuration");
  return result;
}

export async function updateOrganizationObjectType(id: string, input: {
  name: string;
  description?: string;
  fields: unknown[];
  visibleIn: string[];
  workflowId?: string | null;
}) {
  const organizationId = await getOrganizationId();
  const result = await prisma.organizationObjectType.updateMany({
    where: { id, organizationId, isSystem: false },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      fieldsJson: JSON.stringify(input.fields),
      visibleInJson: JSON.stringify(sanitizePlacements(input.visibleIn)),
      workflowId: await resolveWorkflowId(organizationId, input.workflowId),
    },
  });
  if (!result.count) throw new Error("Nie znaleziono typu obiektu");
  revalidatePath("/app/settings/configuration");
  return { ok: true };
}

export async function deleteOrganizationObjectType(id: string) {
  const organizationId = await getOrganizationId();
  const result = await prisma.organizationObjectType.deleteMany({ where: { id, organizationId, isSystem: false } });
  if (!result.count) throw new Error("Nie znaleziono typu obiektu");
  revalidatePath("/app/settings/configuration");
  return { ok: true };
}

export async function createOrganizationWorkflow(input: {
  name: string;
  description?: string;
  eventType?: string;
  stages: unknown[];
}) {
  const id = await getOrganizationId();
  const result = await prisma.organizationWorkflow.create({
    data: {
      organizationId: id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      eventType: input.eventType?.trim() || null,
      stagesJson: JSON.stringify(input.stages),
    },
  });
  revalidatePath("/app/settings/configuration");
  return result;
}

export async function updateOrganizationWorkflow(id: string, input: {
  name: string;
  description?: string;
  eventType?: string;
  stages: unknown[];
}) {
  const organizationId = await getOrganizationId();
  const result = await prisma.organizationWorkflow.updateMany({
    where: { id, organizationId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      eventType: input.eventType?.trim() || null,
      stagesJson: JSON.stringify(input.stages),
    },
  });
  if (!result.count) throw new Error("Nie znaleziono procesu");
  revalidatePath("/app/settings/configuration");
  return { ok: true };
}

export async function deleteOrganizationWorkflow(id: string) {
  const organizationId = await getOrganizationId();
  const result = await prisma.organizationWorkflow.deleteMany({ where: { id, organizationId } });
  if (!result.count) throw new Error("Nie znaleziono procesu");
  revalidatePath("/app/settings/configuration");
  return { ok: true };
}

export async function listOrganizationWorkflows() {
  const id = await getOrganizationId();
  const workflows = await prisma.organizationWorkflow.findMany({
    where: { organizationId: id },
    orderBy: { name: "asc" },
  });
  return workflows.map((workflow) => ({
    id: workflow.id,
    name: workflow.name,
    stages: JSON.parse(workflow.stagesJson),
  }));
}

/**
 * Sale organizacji pogrupowane po obiektach — do wyboru przy wydarzeniu.
 * Obiekt z kilkoma salami prowadzi równoległe imprezy tego samego dnia,
 * więc sala jest właściwą jednostką rezerwacyjną, nie sam obiekt.
 */
export async function listOrganizationHalls(): Promise<
  { venueId: string; venueName: string; halls: { id: string; name: string; capacity: number }[] }[]
> {
  const organizationId = await getOrganizationId();
  const venues = await prisma.venue.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      halls: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, capacity: true },
      },
    },
  });
  return venues.map((v) => ({ venueId: v.id, venueName: v.name, halls: v.halls }));
}

/** Lista eventów organizacji z przypisanym procesem. */
export async function listOrganizationEventsWithWorkflow() {
  const id = await getOrganizationId();
  const events = await prisma.event.findMany({
    where: { organizationId: id },
    select: { id: true, name: true, date: true, workflowId: true },
    orderBy: { date: "asc" },
  });
  return events;
}

/** Przypisuje proces do wskazanych eventów i usuwa z pozostałych. */
export async function assignWorkflowToEvents(workflowId: string, eventIds: string[]) {
  const organizationId = await getOrganizationId();
  const workflow = await prisma.organizationWorkflow.findFirst({ where: { id: workflowId, organizationId } });
  if (!workflow) throw new Error("Nie znaleziono procesu");

  const stages = JSON.parse(workflow.stagesJson) as Array<{ id: string }>;
  const firstStage = stages[0]?.id ?? null;

  await prisma.$transaction([
    prisma.event.updateMany({ where: { organizationId, workflowId }, data: { workflowId: null, workflowStageId: null } }),
    prisma.event.updateMany({ where: { organizationId, id: { in: eventIds } }, data: { workflowId, workflowStageId: firstStage } }),
  ]);

  revalidatePath("/app/settings/configuration");
  revalidatePath("/app/events");
  return { ok: true };
}

export async function assignWorkflowToEvent(eventId: string, workflowId: string) {
  const organizationId = await getOrganizationId();
  const workflow = await prisma.organizationWorkflow.findFirst({ where: { id: workflowId, organizationId } });
  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId }, select: { id: true, workflowStageId: true } });
  if (!workflow || !event) throw new Error("Nie znaleziono procesu lub eventu");
  const stages = JSON.parse(workflow.stagesJson) as Array<{ id: string }>;
  const firstStage = stages[0]?.id ?? null;
  await prisma.event.update({ where: { id: eventId }, data: { workflowId, workflowStageId: firstStage } });
  if (firstStage) await prisma.eventWorkflowHistory.create({ data: { eventId, toStage: firstStage } });
  revalidatePath("/app/events");
  return { ok: true, stageId: firstStage };
}

export async function advanceEventWorkflow(eventId: string, stageId: string, note?: string) {
  const organizationId = await getOrganizationId();
  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId }, include: { workflow: true } });
  if (!event?.workflow) throw new Error("Event nie ma przypisanego procesu");
  const stages = JSON.parse(event.workflow.stagesJson) as Array<{ id: string }>;
  if (!stages.some((stage) => stage.id === stageId)) throw new Error("Nieprawidłowy etap");
  await prisma.$transaction([
    prisma.event.update({ where: { id: eventId }, data: { workflowStageId: stageId } }),
    prisma.eventWorkflowHistory.create({ data: { eventId, fromStage: event.workflowStageId, toStage: stageId, note: note?.trim() || null } }),
  ]);
  revalidatePath("/app/events");
  return { ok: true };
}

/** Tworzy domyślny proces, jeśli organizacja nie ma żadnego. */
export async function ensureDefaultWorkflow() {
  const organizationId = await getOrganizationId();
  const count = await prisma.organizationWorkflow.count({ where: { organizationId } });
  if (count > 0) return null;

  const stages = [
    { id: "stage_1", name: "Zapytanie", action: "NONE", assigneeRole: "MANAGER", requiredFields: [] },
    { id: "stage_2", name: "Oferta", action: "DOCUMENT", assigneeRole: "MANAGER", requiredFields: [] },
    { id: "stage_3", name: "Menu wysłane", action: "SEND_MESSAGE", assigneeRole: "MANAGER", requiredFields: [] },
    { id: "stage_4", name: "Wybór klienta", action: "CLIENT_FORM", assigneeRole: "CLIENT", requiredFields: [] },
    { id: "stage_5", name: "Umowa", action: "DOCUMENT", assigneeRole: "MANAGER", requiredFields: [] },
    { id: "stage_6", name: "Zadatek", action: "PAYMENT", assigneeRole: "CLIENT", requiredFields: [] },
    { id: "stage_7", name: "Potwierdzone", action: "NONE", assigneeRole: "MANAGER", requiredFields: [] },
  ];

  const workflow = await prisma.organizationWorkflow.create({
    data: {
      organizationId,
      name: "Obsługa eventu",
      description: "Domyślny proces obsługi eventu: od zapytania do potwierdzenia.",
      stagesJson: JSON.stringify(stages),
      isDefault: true,
    },
  });

  revalidatePath("/app/settings/configuration");
  return workflow;
}
