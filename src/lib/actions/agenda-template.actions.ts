"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

async function getUserOrgId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return membership?.organizationId ?? null;
}

export async function listAgendaTemplates(categoryId?: string) {
  const organizationId = await getUserOrgId();
  if (!organizationId) return [];

  const where: any = { organizationId };
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const templates = await prisma.agendaTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return templates.map((t) => {
    let sections: any[] = [];
    try {
      sections = JSON.parse(t.sectionsJson);
    } catch {}

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      categoryId: t.categoryId,
      sections,
      isDefault: t.isDefault,
    };
  });
}

export async function createAgendaTemplate(input: {
  name: string;
  description?: string;
  categoryId?: string;
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      required?: boolean;
      placeholder?: string;
      llmPrompt?: string;
    }>;
  }>;
}) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const template = await prisma.agendaTemplate.create({
    data: {
      organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      categoryId: input.categoryId || null,
      sectionsJson: JSON.stringify(input.sections),
    },
  });

  revalidatePath("/app/settings/agenda-templates");
  return template;
}

export async function updateAgendaTemplate(
  id: string,
  input: {
    name?: string;
    description?: string;
    categoryId?: string | null;
    sections?: Array<{
      id: string;
      title: string;
      description?: string;
      fields: Array<{
        key: string;
        label: string;
        type: string;
        required?: boolean;
        placeholder?: string;
        llmPrompt?: string;
      }>;
    }>;
    isDefault?: boolean;
  }
) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const template = await prisma.agendaTemplate.findFirst({
    where: { id, organizationId },
  });
  if (!template) throw new Error("Not found");

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.sections !== undefined) updateData.sectionsJson = JSON.stringify(input.sections);
  if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

  const updated = await prisma.agendaTemplate.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/app/settings/agenda-templates");
  return updated;
}

export async function deleteAgendaTemplate(id: string) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const template = await prisma.agendaTemplate.findFirst({
    where: { id, organizationId },
  });
  if (!template) throw new Error("Not found");

  await prisma.agendaTemplate.delete({ where: { id } });
  revalidatePath("/app/settings/agenda-templates");
  return { ok: true };
}

export async function generateAgendaWithLLM(
  templateId: string,
  eventData: {
    name: string;
    date: string;
    estimatedGuestCount?: number;
    customFields?: Record<string, string>;
  }
) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const template = await prisma.agendaTemplate.findFirst({
    where: { id: templateId, organizationId },
  });
  if (!template) throw new Error("Not found");

  let sections: any[] = [];
  try {
    sections = JSON.parse(template.sectionsJson);
  } catch {
    throw new Error("Invalid template structure");
  }

  // TODO: Integrate with LLM API (OpenAI/Claude/etc)
  // For now, return placeholder data
  const generatedSections = sections.map((section: any) => ({
    ...section,
    fields: section.fields.map((field: any) => ({
      ...field,
      value: `[LLM Generated: ${field.label} for ${eventData.name}]`,
    })),
  }));

  return {
    templateId,
    sections: generatedSections,
  };
}
