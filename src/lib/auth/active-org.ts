import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Aktywna organizacja („wejście w przestrzeń" przez serviceUser).
 *
 * Bez ustawionego ciasteczka wszystko działa jak dotąd — brany jest pierwszy
 * (najstarszy) membership użytkownika. Gdy admin platformy wejdzie w przestrzeń,
 * ciasteczko wskazuje którą organizację ma pod ręką, a helpery zwracają JĄ.
 */
export const ACTIVE_ORG_COOKIE = "eb_active_org";

async function readActiveOrgCookie(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get(ACTIVE_ORG_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/** Membership do użycia w tym żądaniu — aktywna org (jeśli ustawiona) albo pierwsza. */
export async function getActiveMembership(userId: string) {
  const active = await readActiveOrgCookie();
  if (active) {
    const m = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: active },
    });
    if (m) return m;
  }
  return prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/** Samo ID aktywnej organizacji (albo pierwszej). */
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const active = await readActiveOrgCookie();
  if (active) {
    const m = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: active },
      select: { organizationId: true },
    });
    if (m) return m.organizationId;
  }
  const first = await prisma.organizationMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  return first?.organizationId ?? null;
}

/** Informacja dla belki „pracujesz w przestrzeni…". */
export async function getActiveSpaceBanner(userId: string): Promise<{ orgId: string; name: string } | null> {
  const active = await readActiveOrgCookie();
  if (!active) return null;
  const m = await prisma.organizationMember.findFirst({
    where: { userId, organizationId: active },
    select: { organizationId: true, organization: { select: { name: true } } },
  });
  if (!m) return null;
  return { orgId: m.organizationId, name: m.organization.name };
}
