"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";

export async function getMenuVariantForExport(variantId: string) {
  const variant = await prisma.menuVariant.findUnique({
    where: { id: variantId },
    include: {
      courses: { orderBy: { sortOrder: "asc" } },
      event: { select: { name: true, date: true, eventType: true } },
    },
  });
  return variant;
}
