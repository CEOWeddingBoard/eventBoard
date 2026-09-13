"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/auth/active-org";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

// =============================================================================
// ORGANIZATION CRUD
// =============================================================================

const PLAN_LIMITS: Record<string, { maxEvents: number; maxMembers: number; weddingBoard: boolean }> = {
  FREE:       { maxEvents: 1,   maxMembers: 1,   weddingBoard: false },
  BASIC:      { maxEvents: 5,   maxMembers: 3,   weddingBoard: true  },
  PRO:        { maxEvents: 20,  maxMembers: 10,  weddingBoard: true  },
  ENTERPRISE: { maxEvents: Infinity, maxMembers: Infinity, weddingBoard: true },
};

export async function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

interface CreateOrganizationInput {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  plan?: string;
  // Pola wizytówki publicznej (/org/<slug>). Strona pokazywała je od początku,
  // ale nie było ich gdzie uzupełnić, więc profil wysyłany klientom po
  // zapytanie ofertowe zawsze pozostawał pusty.
  city?: string | null;
  postalCode?: string | null;
  website?: string | null;
  description?: string | null;
  capacity?: number | null;
  priceRange?: string | null;
}

export async function createOrganization(data: CreateOrganizationInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: slug || `org-${Date.now().toString(36)}`,
      ownerId: user.id,
      address: data.address,
      phone: data.phone,
      email: data.email,
      plan: data.plan ?? "FREE",
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
    include: { members: true },
  });

  revalidatePath("/pl/app");
  return { ok: true, data: org };
}

export async function getUserOrganizations() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.organization.findMany({
    where: {
      OR: [
        { members: { some: { userId: user.id } } },
        { ownerId: { equals: undefined } }, // fallback — never matches
      ],
    },
    include: {
      _count: { select: { events: true, members: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOrganization(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) throw new Error("Brak dostępu do organizacji");

  return prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    include: {
      _count: { select: { events: true, members: true } },
    },
  });
}

export async function updateOrganization(organizationId: string, data: Partial<CreateOrganizationInput>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member || member.role !== "OWNER") throw new Error("Tylko właściciel może edytować organizację");

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data,
  });

  revalidatePath("/pl/app");
  return { ok: true, data: org };
}

/** Zapisuje skróty pulpitu organizacji. */
export async function updateDashboardShortcuts(shortcuts: Array<{ label: string; href: string }>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const organizationId = await requireOrgId(user.id);

  await prisma.organization.update({
    where: { id: organizationId },
    data: { dashboardShortcutsJson: JSON.stringify(shortcuts) },
  });

  revalidatePath("/pl/app/dashboard");
  revalidatePath("/en/app/dashboard");
  return { ok: true };
}

// =============================================================================
// ORGANIZATION MEMBERS
// =============================================================================

export async function getOrganizationMembers(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) throw new Error("Brak dostępu");

  return prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, email: true, name: true, clerkId: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addOrganizationMember(organizationId: string, targetUserId: string, role: string = "STAFF") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "MANAGER")) {
    throw new Error("Brak uprawnień do dodawania członków");
  }

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const limits = PLAN_LIMITS[org.plan] ?? PLAN_LIMITS.FREE;
  const currentCount = await prisma.organizationMember.count({ where: { organizationId } });
  if (currentCount >= limits.maxMembers) {
    throw new Error(`Limit członków (${limits.maxMembers}) dla planu ${org.plan} został osiągnięty`);
  }

  const newMember = await prisma.organizationMember.create({
    data: { organizationId, userId: targetUserId, role },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  revalidatePath("/pl/app/team");
  return { ok: true, data: newMember };
}

export async function updateMemberRole(organizationId: string, memberId: string, role: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const currentMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!currentMember || currentMember.role !== "OWNER") {
    throw new Error("Tylko właściciel może zmieniać role");
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });

  revalidatePath("/pl/app/team");
  return { ok: true };
}

export async function removeOrganizationMember(organizationId: string, memberId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const currentMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!currentMember || currentMember.role !== "OWNER") {
    throw new Error("Tylko właściciel może usuwać członków");
  }

  const target = await prisma.organizationMember.findUniqueOrThrow({ where: { id: memberId } });
  if (target.role === "OWNER") throw new Error("Nie można usunąć właściciela");

  await prisma.organizationMember.delete({ where: { id: memberId } });

  revalidatePath("/pl/app/team");
  return { ok: true };
}

// =============================================================================
// EVENT CATEGORIES (własne kategorie organizatora)
// =============================================================================

interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
  modulesJson?: string;
  defaultsJson?: string;
}

export async function getEventCategories(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return [];

  return prisma.eventCategory.findMany({
    where: { organizationId },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
  });
}

export async function createEventCategory(organizationId: string, data: CreateCategoryInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "MANAGER")) {
    throw new Error("Brak uprawnień");
  }

  const category = await prisma.eventCategory.create({
    data: { organizationId, ...data },
  });

  revalidatePath("/pl/app/settings");
  return { ok: true, data: category };
}

export async function updateEventCategory(categoryId: string, data: Partial<CreateCategoryInput>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const category = await prisma.eventCategory.findUniqueOrThrow({
    where: { id: categoryId },
    include: { organization: { include: { members: true } } },
  });

  const member = category.organization.members.find((m) => m.userId === user.id);
  if (!member || (member.role !== "OWNER" && member.role !== "MANAGER")) {
    throw new Error("Brak uprawnień");
  }

  if (category.isSystem) throw new Error("Nie można edytować kategorii systemowej");

  const updated = await prisma.eventCategory.update({
    where: { id: categoryId },
    data,
  });

  revalidatePath("/pl/app/settings");
  return { ok: true, data: updated };
}

export async function deleteEventCategory(categoryId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const category = await prisma.eventCategory.findUniqueOrThrow({
    where: { id: categoryId },
    include: { organization: { include: { members: true } } },
  });

  const member = category.organization.members.find((m) => m.userId === user.id);
  if (!member || member.role !== "OWNER") {
    throw new Error("Tylko właściciel może usuwać kategorie");
  }

  if (category.isSystem) throw new Error("Nie można usunąć kategorii systemowej");

  await prisma.eventCategory.delete({ where: { id: categoryId } });

  revalidatePath("/pl/app/settings");
  return { ok: true };
}
