"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";

export interface BoardLinkInput {
  label: string;
  url: string;
  icon: string | null;
  enabled?: boolean;
}

export async function getBoardLinks(eventId: string) {
  const links = await prisma.eventBoardLink.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
  });
  return links;
}

export async function getPublicBoardLinks(eventId: string) {
  const links = await prisma.eventBoardLink.findMany({
    where: { eventId, enabled: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, url: true, icon: true, sortOrder: true },
  });
  return links;
}

export async function createBoardLink(eventId: string, input: BoardLinkInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const maxOrder = await prisma.eventBoardLink.findFirst({
    where: { eventId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const link = await prisma.eventBoardLink.create({
    data: {
      eventId,
      label: input.label,
      url: input.url,
      icon: input.icon,
      enabled: input.enabled ?? true,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/pl/dashboard/website");
  revalidatePath("/en/dashboard/website");
  revalidatePath("/pl/w");
  revalidatePath("/en/w");
  return link;
}

export async function updateBoardLink(linkId: string, input: Partial<BoardLinkInput>) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const link = await prisma.eventBoardLink.update({
    where: { id: linkId },
    data: {
      ...(input.label !== undefined && { label: input.label }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.enabled !== undefined && { enabled: input.enabled }),
    },
  });

  revalidatePath("/pl/dashboard/website");
  revalidatePath("/en/dashboard/website");
  revalidatePath("/pl/w");
  revalidatePath("/en/w");
  return link;
}

export async function deleteBoardLink(linkId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.eventBoardLink.delete({ where: { id: linkId } });

  revalidatePath("/pl/dashboard/website");
  revalidatePath("/en/dashboard/website");
  revalidatePath("/pl/w");
  revalidatePath("/en/w");
}

export async function reorderBoardLinks(eventId: string, linkIds: string[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.$transaction(
    linkIds.map((id, index) =>
      prisma.eventBoardLink.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath("/pl/dashboard/website");
  revalidatePath("/en/dashboard/website");
  revalidatePath("/pl/w");
  revalidatePath("/en/w");
}
