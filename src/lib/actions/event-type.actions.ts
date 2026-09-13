"use server";

import { prisma } from "@/lib/prisma";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

type CustomField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  required?: boolean;
};

async function getUserOrgId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getActiveOrgId(user.id);
}

export async function listEventTypes() {
  const organizationId = await getUserOrgId();
  if (!organizationId) return [];

  const categories = await prisma.eventCategory.findMany({
    where: { organizationId },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return categories.map((c) => {
    let customFields: CustomField[] = [];
    try {
      const parsed: Array<{ key: string; label: string; type: string; options?: string[]; required?: boolean }> =
        c.customFieldsJson ? JSON.parse(c.customFieldsJson) : [];
      const validTypes = ["text", "number", "date", "select"] as const;
      customFields = parsed.map((f) => ({
        ...f,
        type: validTypes.includes(f.type as CustomField["type"]) ? (f.type as CustomField["type"]) : "text",
      }));
    } catch {}

    return {
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      customFields,
      agendaTemplateId: c.agendaTemplateId,
      agendaTemplateName: null,
      isSystem: c.isSystem,
    };
  });
}

export async function createEventType(input: {
  name: string;
  icon?: string;
  color?: string;
  customFields?: CustomField[];
  agendaTemplateId?: string;
}) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const category = await prisma.eventCategory.create({
    data: {
      organizationId,
      name: input.name.trim(),
      icon: input.icon || null,
      color: input.color || null,
      customFieldsJson: input.customFields ? JSON.stringify(input.customFields) : null,
      agendaTemplateId: input.agendaTemplateId || null,
      modulesJson: JSON.stringify(["guests_full", "menu", "schedule"]),
      isSystem: false,
    },
  });

  revalidatePath("/app/settings/event-types");
  return category;
}

export async function updateEventType(
  id: string,
  input: {
    name?: string;
    icon?: string;
    color?: string;
    customFields?: CustomField[];
    agendaTemplateId?: string | null;
  }
) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const category = await prisma.eventCategory.findFirst({
    where: { id, organizationId },
  });
  if (!category) throw new Error("Not found");

  const updated = await prisma.eventCategory.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      icon: input.icon,
      color: input.color,
      customFieldsJson: input.customFields ? JSON.stringify(input.customFields) : undefined,
      agendaTemplateId: input.agendaTemplateId,
    },
  });

  revalidatePath("/app/settings/event-types");
  return updated;
}

export async function deleteEventType(id: string) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const category = await prisma.eventCategory.findFirst({
    where: { id, organizationId, isSystem: false },
  });
  if (!category) throw new Error("Not found or system category");

  await prisma.eventCategory.delete({ where: { id } });
  revalidatePath("/app/settings/event-types");
  return { ok: true };
}

export async function getEventTypeWithTemplate(id: string) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const category = await prisma.eventCategory.findFirst({
    where: { id, organizationId },
  });
  if (!category) throw new Error("Not found");

  let customFields: CustomField[] = [];
  try {
    customFields = category.customFieldsJson ? JSON.parse(category.customFieldsJson) : [];
  } catch {}

  let agendaTemplate = null;
  if (category.agendaTemplateId) {
    agendaTemplate = await prisma.orgTemplate.findFirst({
      where: { id: category.agendaTemplateId, organizationId },
    });
  }

  return {
    ...category,
    customFields,
    agendaTemplate,
  };
}
