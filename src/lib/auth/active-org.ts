import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Aktywna organizacja („wejście w przestrzeń" przez serviceUser).
 *
 * Konto serwisowe jest członkiem KAŻDEJ przestrzeni, więc ustalanie organizacji
 * „po pierwszym członkostwie" dawało dla niego przypadkowy wynik — event zakładany
 * po wejściu w przestrzeń klienta B lądował u klienta A. Dlatego jedynym źródłem
 * prawdy jest ciasteczko aktywnej przestrzeni; fallback działa wyłącznie wtedy,
 * gdy użytkownik należy dokładnie do jednej organizacji i nie ma czego mylić.
 */
export const ACTIVE_ORG_COOKIE = "eb_active_org";

/** Nie da się jednoznacznie ustalić przestrzeni — nie zgadujemy. */
export class OrgContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrgContextError";
  }
}

async function readActiveOrgCookie(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get(ACTIVE_ORG_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

type Resolution =
  | { ok: true; membership: { id: string; organizationId: string } }
  | { ok: false; reason: "no-membership" | "foreign-space" | "ambiguous" };

/**
 * Wspólna logika dla wszystkich helperów poniżej — jedno miejsce, które decyduje,
 * w której przestrzeni pracuje to żądanie.
 */
async function resolveMembership(userId: string): Promise<Resolution> {
  const active = await readActiveOrgCookie();

  if (active) {
    const m = await prisma.organizationMember.findFirst({
      where: { userId, organizationId: active },
      select: { id: true, organizationId: true },
    });
    // Ciasteczko wskazuje przestrzeń, do której użytkownik nie należy —
    // cichy fallback oznaczałby pracę w cudzych danych.
    return m ? { ok: true, membership: m } : { ok: false, reason: "foreign-space" };
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { id: true, organizationId: true },
    orderBy: { createdAt: "asc" },
    take: 2,
  });

  if (memberships.length === 0) return { ok: false, reason: "no-membership" };
  if (memberships.length > 1) return { ok: false, reason: "ambiguous" };
  return { ok: true, membership: memberships[0] };
}

function messageFor(reason: "no-membership" | "foreign-space" | "ambiguous"): string {
  if (reason === "no-membership") return "Twoje konto nie należy do żadnej przestrzeni.";
  if (reason === "foreign-space") return "Nie masz dostępu do wskazanej przestrzeni.";
  return "Wybierz przestrzeń, w której pracujesz — konto należy do kilku.";
}

/** Membership do użycia w tym żądaniu. `null`, gdy przestrzeni nie da się ustalić. */
export async function getActiveMembership(userId: string) {
  const r = await resolveMembership(userId);
  if (!r.ok) return null;
  return prisma.organizationMember.findUnique({ where: { id: r.membership.id } });
}

/** Samo ID aktywnej organizacji. `null`, gdy przestrzeni nie da się ustalić. */
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const r = await resolveMembership(userId);
  return r.ok ? r.membership.organizationId : null;
}

/**
 * Jak `getActiveOrgId`, ale zamiast `null` rzuca wyjątkiem z powodem. Używaj
 * w akcjach zapisu — zapis „gdzieś" jest gorszy niż zapis nieudany.
 */
export async function requireOrgId(userId: string): Promise<string> {
  const r = await resolveMembership(userId);
  if (!r.ok) throw new OrgContextError(messageFor(r.reason));
  return r.membership.organizationId;
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
