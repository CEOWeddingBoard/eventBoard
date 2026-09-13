import { verifyEventAccess, verifyPartnerEventAccess } from "@/lib/api/auth-helper";
import { getCurrentUser } from "@/lib/auth/utils";

/** Clerk user lub sesja linku partnerskiego. */
export async function canAccessEvent(eventId: string): Promise<boolean> {
  if (await verifyPartnerEventAccess(eventId)) return true;
  const user = await getCurrentUser();
  if (!user) return false;
  return verifyEventAccess(user.id, eventId);
}

export async function canEditEvent(eventId: string): Promise<boolean> {
  return canAccessEvent(eventId);
}
