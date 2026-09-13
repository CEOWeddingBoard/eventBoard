import { prisma } from "@/lib/prisma";
import { getSessionPayloadFromCookies } from "@/lib/auth/session";
import { getActiveMembership } from "@/lib/auth/active-org";
import { getUserBillingMetadata } from "@/lib/user-metadata";
import type { ClerkBillingMetadata } from "@/lib/billing";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  orgRole: string | null;
  organizationId: string | null;
  organizationName: string | null;
  metadata: ClerkBillingMetadata;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSessionPayloadFromCookies();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.isActive) return null;

  const active = await getActiveMembership(user.id);
  const membership = active
    ? await prisma.organizationMember.findUnique({
        where: { id: active.id },
        include: { organization: { select: { id: true, name: true } } },
      })
    : null;

  const metadata = await getUserBillingMetadata(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgRole: membership?.role ?? null,
    organizationId: membership?.organization.id ?? null,
    organizationName: membership?.organization.name ?? null,
    metadata,
  };
}
