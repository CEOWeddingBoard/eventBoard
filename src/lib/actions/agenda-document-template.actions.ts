"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getActiveMembership } from "@/lib/auth/active-org";
import { getCurrentUser } from "@/lib/auth/utils";
import { ensureEventP1Columns } from "@/lib/events/event-schema-migration";

export async function listAgendaDocumentTemplates() {
  await ensureEventP1Columns();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await getActiveMembership(user.id);
  if (!membership) throw new Error("No organization");

  const templates = await prisma.agendaDocumentTemplate.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return templates.map((t) => ({
    ...t,
    pages: JSON.parse(t.pagesJson),
    settings: t.settingsJson ? JSON.parse(t.settingsJson) : null,
  }));
}

export async function getAgendaDocumentTemplate(id: string) {
  await ensureEventP1Columns();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await getActiveMembership(user.id);
  if (!membership) throw new Error("No organization");

  const template = await prisma.agendaDocumentTemplate.findFirst({
    where: { id, organizationId: membership.organizationId },
  });
  if (!template) throw new Error("Template not found");

  return {
    ...template,
    pages: JSON.parse(template.pagesJson),
    settings: template.settingsJson ? JSON.parse(template.settingsJson) : null,
  };
}

export async function createAgendaDocumentTemplate(data: {
  name: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- struktura kreatora dokumentow nie ma jeszcze opisanego kontraktu; zaostrzenie wymaga osobnej przebudowy
  pages: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- struktura kreatora dokumentow nie ma jeszcze opisanego kontraktu; zaostrzenie wymaga osobnej przebudowy
  settings?: any;
}) {
  await ensureEventP1Columns();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await getActiveMembership(user.id);
  if (!membership) throw new Error("No organization");

  const template = await prisma.agendaDocumentTemplate.create({
    data: {
      organizationId: membership.organizationId,
      name: data.name,
      description: data.description,
      pagesJson: JSON.stringify(data.pages),
      settingsJson: data.settings ? JSON.stringify(data.settings) : null,
    },
  });

  revalidatePath("/app/settings/document-templates");
  return template;
}

export async function updateAgendaDocumentTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    pages?: unknown[];
    settings?: Record<string, unknown>;
  }
) {
  await ensureEventP1Columns();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await getActiveMembership(user.id);
  if (!membership) throw new Error("No organization");

  const updateData: Prisma.AgendaDocumentTemplateUncheckedUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.pages !== undefined) updateData.pagesJson = JSON.stringify(data.pages);
  if (data.settings !== undefined) updateData.settingsJson = JSON.stringify(data.settings);

  const template = await prisma.agendaDocumentTemplate.update({
    where: { id, organizationId: membership.organizationId },
    data: updateData,
  });

  revalidatePath("/app/settings/document-templates");
  return template;
}

export async function deleteAgendaDocumentTemplate(id: string) {
  await ensureEventP1Columns();
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await getActiveMembership(user.id);
  if (!membership) throw new Error("No organization");

  await prisma.agendaDocumentTemplate.delete({
    where: { id, organizationId: membership.organizationId },
  });

  revalidatePath("/app/settings/document-templates");
}
