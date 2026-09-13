"use server";

import { prisma } from "@/lib/prisma";
import { assertModuleEdit } from "@/lib/permissions/guard";
import { getActiveOrgId, requireOrgId } from "@/lib/auth/active-org";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

export interface VariantCourseInput {
  name: string;
  courseType: string;
  description?: string;
  allergens?: string;
  priceBase?: number | null;
  priceExtra?: number | null;
  portions?: number | null;
  approved?: boolean;
}

export async function getMenuVariants(eventId: string) {
  return prisma.menuVariant.findMany({
    where: { eventId },
    include: { courses: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createMenuVariant(eventId: string, label: string, extra?: { description?: string | null; imageUrl?: string | null; notes?: string | null }) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const maxOrder = await prisma.menuVariant.findFirst({
    where: { eventId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const variant = await prisma.menuVariant.create({
    data: {
      eventId,
      label,
      description: extra?.description?.trim() || null,
      imageUrl: extra?.imageUrl || null,
      notes: extra?.notes?.trim() || null,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
    include: { courses: true },
  });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
  return variant;
}

export async function updateMenuVariant(variantId: string, data: { label?: string; description?: string | null; imageUrl?: string | null; notes?: string | null; pricePerPerson?: number | null }) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const variant = await prisma.menuVariant.update({
    where: { id: variantId },
    data: {
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.pricePerPerson !== undefined ? { pricePerPerson: data.pricePerPerson } : {}),
    },
  });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
  return variant;
}

export async function deleteMenuVariant(variantId: string) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.menuVariant.delete({ where: { id: variantId } });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
}

export async function addVariantCourse(variantId: string, input: VariantCourseInput) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const maxOrder = await prisma.menuVariantCourse.findFirst({
    where: { menuVariantId: variantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const course = await prisma.menuVariantCourse.create({
    data: {
      menuVariantId: variantId,
      name: input.name,
      courseType: input.courseType,
      description: input.description ?? null,
      allergens: input.allergens ?? null,
      priceBase: input.priceBase ?? null,
      priceExtra: input.priceExtra ?? null,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
  return course;
}

export async function updateVariantCourse(courseId: string, input: Partial<VariantCourseInput>) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const course = await prisma.menuVariantCourse.update({
    where: { id: courseId },
    data: input,
  });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
  return course;
}

export async function deleteVariantCourse(courseId: string) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.menuVariantCourse.delete({ where: { id: courseId } });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
}

/** Lista eventów organizacji (do wyboru widoczności wariantów menu). */
export async function listOrganizationEventsForMenu() {
  const user = await getCurrentUser();
  if (!user) return [];

  const organizationId = await getActiveOrgId(user.id);
  if (!organizationId) return [];

  return prisma.event.findMany({
    where: { organizationId: organizationId },
    select: { id: true, name: true, date: true },
    orderBy: { date: "asc" },
  });
}

/** Wszystkie warianty menu organizacji (wraz z eventem i daniami). */
export async function listOrganizationMenuVariants() {
  const user = await getCurrentUser();
  if (!user) return [];

  const organizationId = await getActiveOrgId(user.id);
  if (!organizationId) return [];

  return prisma.menuVariant.findMany({
    where: { event: { organizationId: organizationId } },
    include: {
      courses: { orderBy: { sortOrder: "asc" } },
      event: { select: { id: true, name: true } },
    },
    orderBy: [{ label: "asc" }, { sortOrder: "asc" }],
  });
}

/** Tworzy wariant menu i przypisuje go do wskazanych eventów. */
export async function createMenuVariantsForEvents(input: {
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  eventIds: string[];
}) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const organizationId = await requireOrgId(user.id);

  const created = await Promise.all(
    input.eventIds.map(async (eventId) => {
      const maxOrder = await prisma.menuVariant.findFirst({
        where: { eventId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      return prisma.menuVariant.create({
        data: {
          eventId,
          label: input.label.trim(),
          description: input.description?.trim() || null,
          imageUrl: input.imageUrl || null,
          notes: input.notes?.trim() || null,
          sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        },
      });
    })
  );

  revalidatePath("/app");
  return created;
}

export async function copyMenuVariant(variantId: string, newLabel: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const source = await prisma.menuVariant.findUnique({
    where: { id: variantId },
    include: { courses: true },
  });
  if (!source) throw new Error("Variant not found");

  const maxOrder = await prisma.menuVariant.findFirst({
    where: { eventId: source.eventId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const copy = await prisma.menuVariant.create({
    data: {
      eventId: source.eventId,
      label: newLabel,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      courses: {
        create: source.courses.map((c) => ({
          name: c.name,
          courseType: c.courseType,
          description: c.description,
          allergens: c.allergens,
          sortOrder: c.sortOrder,
        })),
      },
    },
    include: { courses: true },
  });

  revalidatePath("/pl/dashboard/day");
  revalidatePath("/en/dashboard/day");
  return copy;
}
