import { prisma } from "@/lib/prisma";
import type { ClerkBillingMetadata } from "@/lib/billing";
import { ensureUserAuthColumns } from "@/lib/auth/schema-migration";

/** Metadane bilingowe użytkownika (dawniej Clerk publicMetadata) — w Prisma. */
export async function getUserBillingMetadata(
  userId: string,
): Promise<ClerkBillingMetadata> {
  try {
    await ensureUserAuthColumns();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadataJson: true },
    });
    if (!user?.metadataJson) return {};
    const parsed = JSON.parse(user.metadataJson);
    return (parsed && typeof parsed === "object" ? parsed : {}) as ClerkBillingMetadata;
  } catch {
    return {};
  }
}

export async function updateUserBillingMetadata(
  userId: string,
  patch: Partial<ClerkBillingMetadata>,
): Promise<ClerkBillingMetadata> {
  const existing = await getUserBillingMetadata(userId);
  const next: ClerkBillingMetadata = { ...existing, ...patch };
  await prisma.user.update({
    where: { id: userId },
    data: { metadataJson: JSON.stringify(next) },
  });
  return next;
}
