import type { ClerkBillingMetadata } from "@/lib/billing";
import { trialEndsAtFromCreatedAt } from "@/lib/trial";
import { updateUserBillingMetadata } from "@/lib/user-metadata";

type UserLike = { createdAt?: Date | number | string | null };

/** Uzupełnia trialEndsAt u starszych kont (30 dni od rejestracji). */
export async function ensureTrialEndsAt(
  userId: string,
  user: UserLike,
  meta: ClerkBillingMetadata
): Promise<ClerkBillingMetadata> {
  if (meta.trialEndsAt) return meta;

  const raw = user.createdAt;
  let createdAtMs = Date.now();
  if (raw instanceof Date) {
    createdAtMs = raw.getTime();
  } else if (typeof raw === "number") {
    createdAtMs = raw;
  } else if (typeof raw === "string") {
    const parsed = new Date(raw).getTime();
    if (!isNaN(parsed)) createdAtMs = parsed;
  }

  const trialEndsAt = trialEndsAtFromCreatedAt(createdAtMs);
  await updateUserBillingMetadata(userId, { trialEndsAt });
  return { ...meta, trialEndsAt };
}
