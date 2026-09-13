"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { ensureEventP1Columns } from "@/lib/events/event-schema-migration";

async function getUserOrgId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  return membership?.organizationId ?? null;
}

export async function listOrgBlockedDates(organizationId: string) {
  await ensureEventP1Columns();
  return prisma.orgBlockedDate.findMany({
    where: { organizationId },
    orderBy: { date: "asc" },
  });
}

export async function createOrgBlockedDate(input: { date: string; reason?: string }) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Unauthorized");
  await ensureEventP1Columns();

  const date = new Date(input.date);
  if (isNaN(date.getTime())) throw new Error("Nieprawidłowa data");

  await prisma.orgBlockedDate.upsert({
    where: { organizationId_date: { organizationId, date } },
    create: { organizationId, date, reason: input.reason?.trim() || null },
    update: { reason: input.reason?.trim() || null },
  });

  revalidatePath("/pl/app");
  return { ok: true };
}

export async function deleteOrgBlockedDate(blockedDateId: string) {
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Unauthorized");

  await prisma.orgBlockedDate.deleteMany({
    where: { id: blockedDateId, organizationId },
  });

  revalidatePath("/pl/app");
  return { ok: true };
}
