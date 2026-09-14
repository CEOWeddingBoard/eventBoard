"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { hashPassword } from "@/lib/auth/password";
import { getActiveOrgId, getActiveMembership } from "@/lib/auth/active-org";
import { PRESET_ROLE_VALUES } from "@/lib/workflow-roles";
import { effectiveLimits } from "@/lib/plans";
import {
  effectiveModuleAccess,
  parseModulePermissions,
  type ModulePermissions,
  type PermLevel,
} from "@/lib/permissions/modules";
import { revalidatePath } from "next/cache";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generatePassword(len = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function ctx() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) throw new Error("Brak organizacji");
  const me = await getActiveMembership(user.id);
  const platformAdmin =
    (await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }))?.role === "ADMIN";
  const canManage = platformAdmin || (me as { isAdmin?: boolean } | null)?.isAdmin === true || me?.role === "OWNER";
  return { userId: user.id, orgId, canManage };
}

function parseRoles(json: string | null | undefined): string[] {
  try {
    const r = JSON.parse(json ?? "[]");
    return Array.isArray(r) ? r.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export type TeamMember = {
  memberId: string;
  userId: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  isOwner: boolean;
  roles: string[];
};

export type TeamContext = {
  canManage: boolean;
  adminsUsed: number;
  usersUsed: number;
  maxAdmins: number | null;
  maxUsers: number | null;
  members: TeamMember[];
  customRoles: { value: string; label: string }[];
  modulePermissions: ModulePermissions;
};

function parseCustomRoles(json: string | null | undefined): { value: string; label: string }[] {
  try {
    const arr = JSON.parse(json ?? "[]");
    return Array.isArray(arr)
      ? arr.filter((r) => r && typeof r.value === "string" && typeof r.label === "string").map((r) => ({ value: r.value, label: r.label }))
      : [];
  } catch {
    return [];
  }
}

/**
 * Efektywny dostęp bieżącego użytkownika do modułów aplikacji.
 * Używane przez layout (ukrywanie w menu) i guardy stron.
 */
export async function getMyModuleAccess(): Promise<Record<string, PermLevel>> {
  const user = await getCurrentUser();
  if (!user) return {};
  const orgId = await getActiveOrgId(user.id);
  if (!orgId) return {};
  const [org, me, dbUser] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { ownerId: true, modulePermissionsJson: true } }),
    getActiveMembership(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }),
  ]);
  const platformAdmin = dbUser?.role === "ADMIN";
  const isAdmin = (me as { isAdmin?: boolean } | null)?.isAdmin === true;
  const isOwner = me?.role === "OWNER" || user.id === org?.ownerId;
  const isService = me?.role === "SERVICE";
  const privileged = platformAdmin || isAdmin || isOwner || isService;
  const roles = parseRoles((me as { rolesJson?: string } | null)?.rolesJson);
  const perms = parseModulePermissions((org as { modulePermissionsJson?: string | null } | null)?.modulePermissionsJson);
  return effectiveModuleAccess(roles, privileged, perms);
}

/** Zapis jednego pola macierzy uprawnień (rola × moduł). Tylko admin. */
export async function setModulePermission(role: string, moduleKey: string, level: PermLevel): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może zmieniać uprawnienia." };
  const org = await prisma.organization.findUnique({ where: { id: c.orgId }, select: { modulePermissionsJson: true } });
  const perms: ModulePermissions = parseModulePermissions((org as { modulePermissionsJson?: string | null } | null)?.modulePermissionsJson);
  perms[role] = { ...(perms[role] ?? {}), [moduleKey]: level };
  await prisma.organization.update({ where: { id: c.orgId }, data: { modulePermissionsJson: JSON.stringify(perms) } });
  revalidatePath("/app");
  return { ok: true };
}

/** Branding aktywnej/podanej organizacji (kolor + logo) — do nagłówka panelu. */
export async function getOrgBranding(orgId: string): Promise<{ color: string | null; logoUrl: string | null }> {
  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { brandColor: true, brandLogoUrl: true } });
    const o = org as { brandColor?: string | null; brandLogoUrl?: string | null } | null;
    return { color: o?.brandColor ?? null, logoUrl: o?.brandLogoUrl ?? null };
  } catch {
    return { color: null, logoUrl: null };
  }
}

export type NotificationSettings = { daysBefore: number; email: boolean; sms: boolean };

/** Ustawienia powiadomień o krokach czekających na akceptację (aktywna org). */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const user = await getCurrentUser();
  const orgId = user ? await getActiveOrgId(user.id) : null;
  if (!orgId) return { daysBefore: 7, email: true, sms: false };
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { notifyDaysBefore: true, notifyEmail: true, notifySms: true },
  });
  const o = org as { notifyDaysBefore?: number | null; notifyEmail?: boolean; notifySms?: boolean } | null;
  return { daysBefore: o?.notifyDaysBefore ?? 7, email: o?.notifyEmail ?? true, sms: o?.notifySms ?? false };
}

/** Zapis ustawień powiadomień. Tylko admin organizacji. */
export async function saveNotificationSettings(input: NotificationSettings): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może zmieniać ustawienia." };
  const days = Math.max(0, Math.min(365, Math.floor(input.daysBefore)));
  await prisma.organization.update({
    where: { id: c.orgId },
    data: { notifyDaysBefore: days, notifyEmail: !!input.email, notifySms: !!input.sms },
  });
  revalidatePath("/app/settings");
  return { ok: true };
}

/** Własne role aktywnej organizacji — do wyboru w kreatorze procesu. */
export async function getOrgCustomRoles(): Promise<{ value: string; label: string }[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    const orgId = await getActiveOrgId(user.id);
    if (!orgId) return [];
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { customRolesJson: true } });
    return parseCustomRoles((org as { customRolesJson?: string | null } | null)?.customRolesJson);
  } catch {
    return [];
  }
}

export async function getTeamContext(): Promise<TeamContext> {
  const c = await ctx();
  const org = await prisma.organization.findUnique({
    where: { id: c.orgId },
    select: { plan: true, maxAdmins: true, maxUsers: true, ownerId: true, customRolesJson: true, modulePermissionsJson: true },
  });
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: c.orgId, role: { not: "SERVICE" } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const limits = effectiveLimits(org?.plan, { maxAdmins: org?.maxAdmins, maxUsers: org?.maxUsers });
  const list: TeamMember[] = members.map((m) => ({
    memberId: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    isAdmin: (m as { isAdmin?: boolean }).isAdmin ?? false,
    isOwner: m.user.id === org?.ownerId,
    roles: parseRoles((m as { rolesJson?: string }).rolesJson),
  }));
  return {
    canManage: c.canManage,
    adminsUsed: list.filter((m) => m.isAdmin).length,
    usersUsed: list.filter((m) => !m.isAdmin).length,
    maxAdmins: limits.maxAdmins,
    maxUsers: limits.maxUsers,
    members: list,
    customRoles: parseCustomRoles((org as { customRolesJson?: string | null } | null)?.customRolesJson),
    modulePermissions: parseModulePermissions((org as { modulePermissionsJson?: string | null } | null)?.modulePermissionsJson),
  };
}

export async function addTeamMember(input: {
  name?: string;
  email: string;
  isAdmin?: boolean;
  roles?: string[];
}): Promise<{ ok: boolean; error?: string; credentials?: { email: string; password: string } }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może dodawać konta." };

  const org = await prisma.organization.findUnique({ where: { id: c.orgId }, select: { plan: true, maxAdmins: true, maxUsers: true } });
  if (!org) return { ok: false, error: "Brak organizacji." };

  const email = input.email?.trim().toLowerCase();
  const name = input.name?.trim() || null;
  const isAdmin = !!input.isAdmin;
  const roles = Array.isArray(input.roles) ? input.roles.filter((r) => typeof r === "string" && r.trim()) : [];
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Podaj poprawny e-mail." };

  const limits = effectiveLimits(org.plan, { maxAdmins: org.maxAdmins, maxUsers: org.maxUsers });
  const used = await prisma.organizationMember.count({ where: { organizationId: c.orgId, role: { not: "SERVICE" }, isAdmin } });
  const max = isAdmin ? limits.maxAdmins : limits.maxUsers;
  if (max != null && used >= max) {
    return { ok: false, error: `Limit ${isAdmin ? "adminów" : "użytkowników"} osiągnięty (${max}).` };
  }

  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup) return { ok: false, error: "Konto z tym e-mailem już istnieje." };

  const password = generatePassword();
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { email, password: await hashPassword(password), name, role: "STAFF", isActive: true } });
    await tx.organizationMember.create({
      data: { organizationId: c.orgId, userId: u.id, role: isAdmin ? "MANAGER" : "STAFF", isAdmin, rolesJson: JSON.stringify(roles) },
    });
  });
  revalidatePath("/app/team");
  return { ok: true, credentials: { email, password } };
}

export async function updateTeamMember(memberId: string, patch: { isAdmin?: boolean; roles?: string[] }): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może zmieniać uprawnienia." };

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: c.orgId },
    include: { organization: { select: { ownerId: true, plan: true, maxAdmins: true, maxUsers: true } } },
  });
  if (!member) return { ok: false, error: "Nie znaleziono członka." };
  const isOwner = member.userId === member.organization.ownerId;

  const nextIsAdmin = patch.isAdmin ?? (member as { isAdmin?: boolean }).isAdmin ?? false;
  if (isOwner && !nextIsAdmin) return { ok: false, error: "Właściciel musi pozostać administratorem." };

  // Przy awansie na admina pilnujemy limitu adminów.
  const wasAdmin = (member as { isAdmin?: boolean }).isAdmin ?? false;
  if (nextIsAdmin && !wasAdmin) {
    const limits = effectiveLimits(member.organization.plan, { maxAdmins: member.organization.maxAdmins, maxUsers: member.organization.maxUsers });
    const adminsUsed = await prisma.organizationMember.count({ where: { organizationId: c.orgId, role: { not: "SERVICE" }, isAdmin: true } });
    if (limits.maxAdmins != null && adminsUsed >= limits.maxAdmins) {
      return { ok: false, error: `Limit adminów osiągnięty (${limits.maxAdmins}).` };
    }
  }

  const roles = Array.isArray(patch.roles) ? patch.roles.filter((r) => typeof r === "string" && r.trim()) : undefined;
  await prisma.organizationMember.update({
    where: { id: memberId },
    data: {
      isAdmin: nextIsAdmin,
      ...(roles ? { rolesJson: JSON.stringify(roles) } : {}),
    },
  });
  revalidatePath("/app/team");
  return { ok: true };
}

export async function removeTeamMember(memberId: string): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może usuwać konta." };
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: c.orgId },
    include: { organization: { select: { ownerId: true } } },
  });
  if (!member) return { ok: false, error: "Nie znaleziono członka." };
  if (member.userId === member.organization.ownerId) return { ok: false, error: "Nie można usunąć właściciela." };
  if (member.userId === c.userId) return { ok: false, error: "Nie można usunąć własnego konta." };
  await prisma.organizationMember.delete({ where: { id: memberId } });
  revalidatePath("/app/team");
  return { ok: true };
}

/**
 * Role własne przestrzeni — „Florysta", „DJ", „Barman od whisky".
 *
 * Do tej pory `customRolesJson` było wyłącznie ODCZYTYWANE: edytor procesu
 * pozwalał wpisać rolę własną na kroku, ale nigdzie nie dało się jej dodać do
 * listy obiektu, więc nie pojawiała się przy członkach zespołu. Rola, której
 * nikt nie ma, blokuje krok na zawsze.
 */
export async function saveOrgCustomRoles(
  roles: { value: string; label: string }[],
): Promise<{ ok: boolean; error?: string }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może zmieniać role." };

  const czyste: { value: string; label: string }[] = [];
  const zajete = new Set(PRESET_ROLE_VALUES.map((v) => v.toLowerCase()));

  for (const r of roles) {
    const label = (r.label ?? "").trim();
    if (!label) continue;
    if (label.length > 40) return { ok: false, error: "Nazwa roli może mieć najwyżej 40 znaków." };
    // Rola własna jest przechowywana pod swoją nazwą — dopasowanie ról działa
    // po nazwie i po etykiecie, więc kolizja z rolą gotową myliłaby obie strony.
    if (zajete.has(label.toLowerCase())) {
      return { ok: false, error: `Rola „${label}" już istnieje.` };
    }
    zajete.add(label.toLowerCase());
    czyste.push({ value: label, label });
  }

  if (czyste.length > 30) return { ok: false, error: "Najwyżej 30 ról własnych." };

  await prisma.organization.update({
    where: { id: c.orgId },
    data: { customRolesJson: JSON.stringify(czyste) },
  });
  revalidatePath("/app/team");
  return { ok: true };
}

/**
 * Reset hasła członka zespołu przez administratora przestrzeni.
 *
 * Dotąd hasło mógł zmienić wyłącznie administrator platformy
 * (`resetAccountPassword` w admin.actions). Właściciel sali, któremu kelner
 * zgubił hasło, musiał dzwonić do dostawcy — przy modelu bez samorejestracji
 * to była realna blokada.
 *
 * Nowe hasło zwracamy raz, do przekazania osobie; nie zapisujemy go nigdzie
 * w czytelnej postaci.
 */
export async function resetTeamMemberPassword(
  memberId: string,
): Promise<{ ok: boolean; password?: string; email?: string; error?: string }> {
  const c = await ctx();
  if (!c.canManage) return { ok: false, error: "Tylko administrator może resetować hasła." };

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: c.orgId },
    select: { role: true, user: { select: { id: true, email: true } } },
  });
  if (!member?.user) return { ok: false, error: "Nie znaleziono członka." };
  // Konto serwisowe należy do dostawcy, nie do przestrzeni klienta.
  if (member.role === "SERVICE") return { ok: false, error: "To konto obsługuje dostawca systemu." };

  const haslo = generateReadablePassword();
  await prisma.user.update({
    where: { id: member.user.id },
    data: { password: await hashPassword(haslo) },
  });

  return { ok: true, password: haslo, email: member.user.email };
}

/** Hasło do przekazania ustnie lub SMS-em — bez znaków mylących się w druku. */
function generateReadablePassword(len = 12): string {
  const znaki = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += znaki[Math.floor(Math.random() * znaki.length)];
  return out;
}
