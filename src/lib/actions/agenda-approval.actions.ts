"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

const AGENDA_SECTIONS = ["SCHEDULE", "MENU", "GUESTS", "KITCHEN", "GENERAL"] as const;

export async function getAgendaApprovals(eventId: string) {
  return prisma.agendaApproval.findMany({
    where: { eventId },
    orderBy: { section: "asc" },
  });
}

export async function initializeAgendaApprovals(eventId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.$transaction(
    AGENDA_SECTIONS.map((section) =>
      prisma.agendaApproval.upsert({
        where: { eventId_section: { eventId, section } },
        create: { eventId, section, status: "PENDING" },
        update: {},
      })
    )
  );

  revalidatePath("/pl/dashboard");
  return { ok: true };
}

export async function approveAgendaSection(eventId: string, section: string, comment?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.agendaApproval.upsert({
    where: { eventId_section: { eventId, section } },
    create: { eventId, section, status: "APPROVED", approvedBy: user.id, approvedAt: new Date(), comment: comment ?? null },
    update: { status: "APPROVED", approvedBy: user.id, approvedAt: new Date(), comment: comment ?? null },
  });

  revalidatePath("/pl/dashboard");
  return { ok: true };
}

export async function rejectAgendaSection(eventId: string, section: string, comment: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.agendaApproval.upsert({
    where: { eventId_section: { eventId, section } },
    create: { eventId, section, status: "REJECTED", approvedBy: user.id, comment },
    update: { status: "REJECTED", approvedBy: user.id, approvedAt: new Date(), comment },
  });

  revalidatePath("/pl/dashboard");
  return { ok: true };
}

export async function resetAgendaApprovals(eventId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.agendaApproval.updateMany({
    where: { eventId },
    data: { status: "PENDING", approvedBy: null, approvedAt: null, comment: null },
  });

  revalidatePath("/pl/dashboard");
  return { ok: true };
}
