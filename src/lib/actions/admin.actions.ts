"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { hashPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/active-org";
import { normalizePlan, effectiveLimits, type PlanKey } from "@/lib/plans";

/** Tylko konto platformy (serviceUser) — Ty. */
async function assertPlatformAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const db = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, role: true } });
  if (!db || db.role !== "ADMIN") throw new Error("Brak uprawnień administratora platformy");
  return db;
}

export async function isPlatformAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const db = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    return db?.role === "ADMIN";
  } catch {
    return false;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || `przestrzen-${Date.now().toString(36)}`;
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Czytelne hasło startowe (bez znaków mylących). */
function generatePassword(len = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EventSpace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: { name: string | null; email: string } | null;
  plan: PlanKey;
  adminsUsed: number;
  usersUsed: number;
  maxAdmins: number | null;
  maxUsers: number | null;
  eventCount: number;
  loginUrl: string;
  customRoles: { value: string; label: string }[];
  billingPaidUntil: string | null;
  billingNote: string | null;
  adminNote: string | null;
  archived: boolean;
  brandColor: string | null;
  brandLogoUrl: string | null;
};

/** Parsuje customRolesJson do listy {value,label}. */
function parseCustomRoles(json: string | null | undefined): { value: string; label: string }[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((r) => r && typeof r.value === "string" && typeof r.label === "string")
      .map((r) => ({ value: r.value, label: r.label }));
  } catch {
    return [];
  }
}

/** Wartość roli z etykiety: UPPER_SNAKE bez ogonków. */
function roleValueFromLabel(label: string): string {
  return (
    label
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "")
      .slice(0, 32) || `ROLE_${Date.now().toString(36).toUpperCase()}`
  );
}

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}

/** Lista przestrzeni (organizacji). Widzi je tylko admin platformy. */
export async function listEventSpaces(): Promise<EventSpace[]> {
  await assertPlatformAdmin();
  const orgs = (await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, createdAt: true, ownerId: true, plan: true,
      maxAdmins: true, maxUsers: true, customRolesJson: true, billingPaidUntil: true, billingNote: true,
      adminNote: true, archivedAt: true, brandColor: true, brandLogoUrl: true,
      _count: { select: { events: true } },
    },
  })).filter((o) => o.slug !== TEMPLATE_SLUG);
  const ownerIds = orgs.map((o) => o.ownerId).filter(Boolean);
  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, name: true, email: true },
  });
  const orgIds = orgs.map((o) => o.id);
  // Członkowie (bez SERVICE) — dzielimy na adminów i zwykłych użytkowników.
  const groups = await prisma.organizationMember.groupBy({
    by: ["organizationId", "isAdmin"],
    where: { organizationId: { in: orgIds }, role: { not: "SERVICE" } },
    _count: { _all: true },
  });
  const adminMap = new Map<string, number>();
  const userMap = new Map<string, number>();
  for (const g of groups) {
    (g.isAdmin ? adminMap : userMap).set(g.organizationId, g._count._all);
  }
  const base = appBase();
  return orgs.map((o) => {
    const owner = owners.find((u) => u.id === o.ownerId) ?? null;
    const plan = normalizePlan(o.plan);
    const limits = effectiveLimits(plan, { maxAdmins: o.maxAdmins, maxUsers: o.maxUsers });
    return {
      id: o.id,
      name: o.name,
      slug: o.slug,
      createdAt: o.createdAt.toISOString(),
      owner: owner ? { name: owner.name, email: owner.email } : null,
      plan,
      adminsUsed: adminMap.get(o.id) ?? 0,
      usersUsed: userMap.get(o.id) ?? 0,
      maxAdmins: limits.maxAdmins,
      maxUsers: limits.maxUsers,
      eventCount: o._count.events,
      loginUrl: `${base}/pl/auth?space=${o.slug}`,
      customRoles: parseCustomRoles(o.customRolesJson),
      billingPaidUntil: o.billingPaidUntil ? o.billingPaidUntil.toISOString() : null,
      billingNote: o.billingNote ?? null,
      adminNote: o.adminNote ?? null,
      archived: !!o.archivedAt,
      brandColor: o.brandColor ?? null,
      brandLogoUrl: o.brandLogoUrl ?? null,
    };
  });
}

/** Lekki branding klienta — kolor przewodni (hex) i logo (URL). */
export async function setSpaceBranding(orgId: string, input: { color: string | null; logoUrl: string | null }): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const color = input.color?.trim() || null;
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) return { ok: false, error: "Kolor w formacie #RRGGBB." };
  const logoUrl = input.logoUrl?.trim() || null;
  if (logoUrl && !/^https:\/\//.test(logoUrl)) return { ok: false, error: "Logo: podaj adres https://" };
  await prisma.organization.update({ where: { id: orgId }, data: { brandColor: color, brandLogoUrl: logoUrl } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Archiwizacja / przywrócenie przestrzeni (nie kasuje danych). */
export async function setSpaceArchived(orgId: string, archived: boolean): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  await prisma.organization.update({ where: { id: orgId }, data: { archivedAt: archived ? new Date() : null } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Notatka wewnętrzna admina o kliencie. */
export async function setSpaceNote(orgId: string, note: string): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  await prisma.organization.update({ where: { id: orgId }, data: { adminNote: note.trim() || null } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Trwałe usunięcie przestrzeni wraz z danymi (kaskada). Nieodwracalne. */
export async function deleteSpace(orgId: string): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { slug: true } });
  if (!org) return { ok: false, error: "Nie znaleziono przestrzeni." };
  if (org.slug === TEMPLATE_SLUG) return { ok: false, error: "Nie można usunąć biblioteki procesów." };
  try {
    await prisma.organization.delete({ where: { id: orgId } });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("[admin:deleteSpace]", e);
    return { ok: false, error: "Nie udało się usunąć — sprawdź powiązane dane." };
  }
}

/** Reset hasła dowolnego konta po e-mailu (np. kelner zgubił hasło). */
export async function resetAccountPassword(email: string): Promise<{ ok: boolean; email?: string; password?: string; error?: string }> {
  await assertPlatformAdmin();
  const clean = email?.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Podaj e-mail." };
  const user = await prisma.user.findUnique({ where: { email: clean }, select: { id: true, email: true } });
  if (!user) return { ok: false, error: "Nie znaleziono konta z tym e-mailem." };
  const password = generatePassword();
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });
  return { ok: true, email: user.email, password };
}

/** Dodaje własną rolę operacyjną do przestrzeni klienta. */
export async function addSpaceCustomRole(orgId: string, label: string): Promise<{ ok: boolean; error?: string; roles?: { value: string; label: string }[] }> {
  await assertPlatformAdmin();
  const clean = label?.trim();
  if (!clean) return { ok: false, error: "Podaj nazwę roli." };
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { customRolesJson: true } });
  if (!org) return { ok: false, error: "Nie znaleziono przestrzeni." };
  const roles = parseCustomRoles(org.customRolesJson);
  const value = roleValueFromLabel(clean);
  if (roles.some((r) => r.value === value)) return { ok: false, error: "Taka rola już istnieje." };
  const next = [...roles, { value, label: clean }];
  await prisma.organization.update({ where: { id: orgId }, data: { customRolesJson: JSON.stringify(next) } });
  revalidatePath("/admin");
  return { ok: true, roles: next };
}

/** Usuwa własną rolę z przestrzeni (istniejące przypisania na kontach zostają jako tekst). */
export async function removeSpaceCustomRole(orgId: string, value: string): Promise<{ ok: boolean; error?: string; roles?: { value: string; label: string }[] }> {
  await assertPlatformAdmin();
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { customRolesJson: true } });
  if (!org) return { ok: false, error: "Nie znaleziono przestrzeni." };
  const next = parseCustomRoles(org.customRolesJson).filter((r) => r.value !== value);
  await prisma.organization.update({ where: { id: orgId }, data: { customRolesJson: JSON.stringify(next) } });
  revalidatePath("/admin");
  return { ok: true, roles: next };
}

/** Ręczne oznaczenie płatności klienta (SaaS): opłacone do + notatka. */
export async function setSpaceBilling(orgId: string, input: { paidUntil: string | null; note: string | null }): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const paidUntil = input.paidUntil ? new Date(input.paidUntil) : null;
  if (input.paidUntil && Number.isNaN(paidUntil!.getTime())) return { ok: false, error: "Nieprawidłowa data." };
  await prisma.organization.update({
    where: { id: orgId },
    data: { billingPaidUntil: paidUntil, billingNote: input.note?.trim() || null },
  });
  revalidatePath("/admin");
  return { ok: true };
}

/** Slug wewnętrznej biblioteki procesów-wzorców (nie jest przestrzenią klienta). */
const TEMPLATE_SLUG = "eb-biblioteka-procesow";

type WorkflowWithNodes = {
  id: string;
  name: string;
  description: string | null;
  eventType: string | null;
  isDefault: boolean;
  nodes: Array<Record<string, unknown> & { id: string; nextNodeId: string | null; conditionsJson: string | null }>;
};

/**
 * Czy przestrzeń ma już proces o tej nazwie. Przypisanie wzorca jest kopią, więc
 * bez tego sprawdzenia drugie kliknięcie daje klientowi dwa identyczne procesy.
 */
async function workflowNameTakenInSpace(targetOrgId: string, name: string): Promise<boolean> {
  const existing = await prisma.organizationWorkflow.findFirst({
    where: { organizationId: targetOrgId, name },
    select: { id: true },
  });
  return !!existing;
}

/** Klonuje JEDEN workflow (z węzłami, remapem ID) do docelowej organizacji. */
async function cloneOneWorkflow(w: WorkflowWithNodes, targetOrgId: string): Promise<void> {
  const created = await prisma.organizationWorkflow.create({
    data: {
      organizationId: targetOrgId,
      name: w.name,
      description: w.description,
      eventType: w.eventType,
      isDefault: w.isDefault,
      stagesJson: "[]",
    },
  });
  const idMap = new Map<string, string>();
  for (const n of w.nodes) {
    const nn = await prisma.workflowNode.create({
      data: {
        workflowId: created.id,
        name: n.name as string,
        description: (n.description as string | null) ?? null,
        nodeType: n.nodeType as string,
        actionType: (n.actionType as string | null) ?? undefined,
        assigneeRole: (n.assigneeRole as string | null) ?? undefined,
        sortOrder: n.sortOrder as number,
        color: (n.color as string | null) ?? null,
        fieldMappingsJson: (n.fieldMappingsJson as string | null) ?? undefined,
        conditionsJson: "[]",
        nextNodeId: null,
        isStart: n.isStart as boolean,
        menuMode: (n.menuMode as string | null) ?? null,
        fillRole: (n.fillRole as string | null) ?? null,
        approveRole: (n.approveRole as string | null) ?? null,
        fieldsJson: (n.fieldsJson as string | null) ?? "[]",
      },
    });
    idMap.set(n.id, nn.id);
  }
  for (const n of w.nodes) {
    const newId = idMap.get(n.id);
    if (!newId) continue;
    const nextNodeId = n.nextNodeId ? idMap.get(n.nextNodeId) ?? null : null;
    let conditions: { nextNodeId?: string }[] = [];
    try {
      conditions = JSON.parse(n.conditionsJson || "[]");
    } catch {
      conditions = [];
    }
    const remapped = conditions.map((c) => ({
      ...c,
      nextNodeId: c.nextNodeId ? idMap.get(c.nextNodeId) ?? c.nextNodeId : c.nextNodeId,
    }));
    await prisma.workflowNode.update({
      where: { id: newId },
      data: { nextNodeId, conditionsJson: JSON.stringify(remapped) },
    });
  }
}

/**
 * Kopiuje wszystkie procesy z jednej przestrzeni do drugiej — „standardowe
 * procesy" na start nowego klienta.
 */
async function cloneWorkflows(sourceOrgId: string, targetOrgId: string): Promise<number> {
  const workflows = await prisma.organizationWorkflow.findMany({
    where: { organizationId: sourceOrgId },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
  });
  let cloned = 0;
  for (const w of workflows) {
    if (await workflowNameTakenInSpace(targetOrgId, w.name)) continue;
    await cloneOneWorkflow(w as unknown as WorkflowWithNodes, targetOrgId);
    cloned++;
  }
  return cloned;
}

/** Lista przestrzeni jako źródło standardowych procesów (do kopiowania). */
export async function listProcessSources(): Promise<{ id: string; name: string; count: number }[]> {
  await assertPlatformAdmin();
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { workflows: true } } },
  });
  return orgs
    .filter((o) => o._count.workflows > 0)
    .map((o) => ({
      id: o.id,
      name: o.slug === TEMPLATE_SLUG ? `Biblioteka procesów` : o.name,
      count: o._count.workflows,
    }));
}

export type TemplateLibrary = {
  orgId: string;
  processes: { id: string; name: string; eventType: string | null; nodeCount: number }[];
};

/**
 * Biblioteka procesów-wzorców admina. Zwraca (i w razie potrzeby zakłada)
 * wewnętrzną przestrzeń, w której admin buduje ogólne procesy u siebie, żeby
 * potem przypisywać je klientom. Nie jest liczona jako przestrzeń klienta.
 */
export async function getTemplateLibrary(): Promise<TemplateLibrary> {
  const admin = await assertPlatformAdmin();
  let org = await prisma.organization.findUnique({ where: { slug: TEMPLATE_SLUG }, select: { id: true } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Biblioteka procesów (wzorce)", slug: TEMPLATE_SLUG, ownerId: admin.id, plan: "ENTERPRISE" },
      select: { id: true },
    });
    await prisma.organizationMember.create({
      data: { organizationId: org.id, userId: admin.id, role: "OWNER", isAdmin: true },
    });
  }
  const workflows = await prisma.organizationWorkflow.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, eventType: true, _count: { select: { nodes: true } } },
  });
  return {
    orgId: org.id,
    processes: workflows.map((w) => ({ id: w.id, name: w.name, eventType: w.eventType, nodeCount: w._count.nodes })),
  };
}

/** Wchodzi do biblioteki procesów (ustawia aktywną org), by edytować wzorce. */
export async function openTemplateLibrary(): Promise<{ ok: boolean; error?: string }> {
  const { orgId } = await getTemplateLibrary();
  return enterSpace(orgId);
}

/** Przypisuje (klonuje) pojedynczy proces-wzorzec do przestrzeni klienta. */
export async function assignProcessToSpace(workflowId: string, targetOrgId: string): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const target = await prisma.organization.findUnique({ where: { id: targetOrgId }, select: { id: true } });
  if (!target) return { ok: false, error: "Nie znaleziono przestrzeni docelowej." };
  const w = await prisma.organizationWorkflow.findUnique({
    where: { id: workflowId },
    include: { nodes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!w) return { ok: false, error: "Nie znaleziono procesu-wzorca." };
  if (await workflowNameTakenInSpace(targetOrgId, w.name)) {
    return { ok: false, error: `Proces „${w.name}" jest już w tej przestrzeni — nie tworzę drugiej kopii.` };
  }
  try {
    await cloneOneWorkflow(w as unknown as WorkflowWithNodes, targetOrgId);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("[admin:assignProcessToSpace]", e);
    return { ok: false, error: "Nie udało się przypisać procesu." };
  }
}

export type CreateSpaceResult = {
  ok: boolean;
  error?: string;
  space?: { id: string; name: string; slug: string; loginUrl: string };
  credentials?: { email: string; password: string };
};

/**
 * Tworzy dedykowaną przestrzeń (organizację = pełny EventBoard):
 * organizacja + konto właściciela (login + wygenerowane hasło) + wpięcie
 * admina platformy jako SERVICE. Admin pozostaje zalogowany na swoim koncie.
 */
export async function createEventSpace(input: {
  spaceName: string;
  ownerName?: string;
  ownerEmail: string;
  plan?: PlanKey;
  copyProcessesFromOrgId?: string;
}): Promise<CreateSpaceResult> {
  const admin = await assertPlatformAdmin();

  const spaceName = input.spaceName?.trim();
  const ownerEmail = input.ownerEmail?.trim().toLowerCase();
  const ownerName = input.ownerName?.trim() || null;
  const plan = normalizePlan(input.plan);

  if (!spaceName) return { ok: false, error: "Podaj nazwę przestrzeni." };
  if (!EMAIL_RE.test(ownerEmail)) return { ok: false, error: "Podaj poprawny e-mail właściciela." };

  const dup = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (dup) return { ok: false, error: "Konto z tym e-mailem już istnieje." };

  const slug = await uniqueSlug(spaceName);
  const password = generatePassword();

  try {
    const org = await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          email: ownerEmail,
          password: await hashPassword(password),
          name: ownerName,
          role: "STAFF", // konto klienta — NIE admin platformy
          isActive: true,
        },
      });
      const organization = await tx.organization.create({
        data: { name: spaceName, slug, ownerId: owner.id, plan },
      });
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: owner.id, role: "OWNER", isAdmin: true },
      });
      // Ty (serviceUser) wpięty do każdej tworzonej przestrzeni.
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: admin.id, role: "SERVICE" },
      });
      return organization;
    });

    // Standardowe procesy na start — skopiowane z wybranej przestrzeni wzorcowej.
    if (input.copyProcessesFromOrgId) {
      try {
        await cloneWorkflows(input.copyProcessesFromOrgId, org.id);
      } catch (e) {
        console.error("[admin:cloneWorkflows]", e);
      }
    }

    revalidatePath("/admin");
    const loginUrl = `${appBase()}/pl/auth?space=${slug}`;
    return {
      ok: true,
      space: { id: org.id, name: org.name, slug: org.slug, loginUrl },
      credentials: { email: ownerEmail, password },
    };
  } catch (e) {
    console.error("[admin:createEventSpace]", e);
    return { ok: false, error: "Nie udało się utworzyć przestrzeni." };
  }
}

/**
 * „Wejdź w przestrzeń" — admin platformy zaczyna pracować w danej organizacji.
 * Dopisuje się jako SERVICE (jeśli jeszcze nie jest) i ustawia aktywną org w
 * ciasteczku, które helpery `active-org` czytają w tym żądaniu.
 */
export async function enterSpace(orgId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await assertPlatformAdmin();
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { id: true } });
  if (!org) return { ok: false, error: "Nie znaleziono przestrzeni." };

  const existing = await prisma.organizationMember.findFirst({
    where: { organizationId: orgId, userId: admin.id },
    select: { id: true },
  });
  if (!existing) {
    await prisma.organizationMember.create({
      data: { organizationId: orgId, userId: admin.id, role: "SERVICE" },
    });
  }

  const jar = await cookies();
  jar.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { ok: true };
}

/** „Wyjdź z przestrzeni" — wraca do domyślnego kontekstu admina. */
export async function exitSpace(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACTIVE_ORG_COOKIE);
}

/** Zmiana planu przestrzeni (subskrypcja). Limity liczone przez effectiveLimits. */
export async function setSpacePlan(orgId: string, plan: PlanKey): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  await prisma.organization.update({ where: { id: orgId }, data: { plan: normalizePlan(plan) } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Ręczne limity licencji per przestrzeń (null = domyślny z planu / bez limitu). */
export async function setSpaceLimits(orgId: string, input: { maxAdmins: number | null; maxUsers: number | null }): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const clean = (n: number | null) => (n == null || Number.isNaN(n) || n < 0 ? null : Math.floor(n));
  const maxAdmins = clean(input.maxAdmins);
  const maxUsers = clean(input.maxUsers);

  const [adminsUsed, usersUsed] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId, role: { not: "SERVICE" }, isAdmin: true } }),
    prisma.organizationMember.count({ where: { organizationId: orgId, role: { not: "SERVICE" }, isAdmin: false } }),
  ]);
  if (maxAdmins != null && adminsUsed > maxAdmins) return { ok: false, error: `Adminów jest ${adminsUsed}, limit ${maxAdmins}. Usuń konta lub podnieś limit.` };
  if (maxUsers != null && usersUsed > maxUsers) return { ok: false, error: `Użytkowników jest ${usersUsed}, limit ${maxUsers}. Usuń konta lub podnieś limit.` };

  await prisma.organization.update({ where: { id: orgId }, data: { maxAdmins, maxUsers } });
  revalidatePath("/admin");
  return { ok: true };
}

export type AddMemberResult = {
  ok: boolean;
  error?: string;
  credentials?: { email: string; password: string };
};

/**
 * Dodaje konto do przestrzeni (licencja). Poziom dostępu (admin/zwykły) liczy
 * się do osobnej puli limitu; użytkownik może mieć WIELE ról operacyjnych.
 * Konto SERVICE nie liczy się do limitów.
 */
export async function addSpaceMember(orgId: string, input: {
  name?: string;
  email: string;
  isAdmin?: boolean;
  roles?: string[];
}): Promise<AddMemberResult> {
  await assertPlatformAdmin();

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { plan: true, maxAdmins: true, maxUsers: true } });
  if (!org) return { ok: false, error: "Nie znaleziono przestrzeni." };

  const email = input.email?.trim().toLowerCase();
  const name = input.name?.trim() || null;
  const isAdmin = !!input.isAdmin;
  const roles = Array.isArray(input.roles) ? input.roles.filter((r) => typeof r === "string" && r.trim()) : [];
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Podaj poprawny e-mail." };

  const limits = effectiveLimits(org.plan, { maxAdmins: org.maxAdmins, maxUsers: org.maxUsers });
  const used = await prisma.organizationMember.count({
    where: { organizationId: orgId, role: { not: "SERVICE" }, isAdmin },
  });
  const max = isAdmin ? limits.maxAdmins : limits.maxUsers;
  if (max != null && used >= max) {
    return { ok: false, error: `Limit ${isAdmin ? "adminów" : "użytkowników"} osiągnięty (${max}). Podnieś limit, aby dodać kolejne konto.` };
  }

  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup) return { ok: false, error: "Konto z tym e-mailem już istnieje." };

  const password = generatePassword();
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: { email, password: await hashPassword(password), name, role: "STAFF", isActive: true },
    });
    await tx.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: u.id,
        role: isAdmin ? "MANAGER" : "STAFF",
        isAdmin,
        rolesJson: JSON.stringify(roles),
      },
    });
  });

  revalidatePath("/admin");
  return { ok: true, credentials: { email, password } };
}

/** Nowe hasło startowe dla właściciela przestrzeni (np. gdy klient je zgubił). */
export async function resetSpaceOwnerPassword(orgId: string): Promise<{ ok: boolean; email?: string; password?: string; error?: string }> {
  await assertPlatformAdmin();
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { ownerId: true } });
  if (!org) return { ok: false, error: "Nie znaleziono przestrzeni." };
  const owner = await prisma.user.findUnique({ where: { id: org.ownerId }, select: { email: true } });
  if (!owner) return { ok: false, error: "Brak właściciela." };
  const password = generatePassword();
  await prisma.user.update({ where: { id: org.ownerId }, data: { password: await hashPassword(password) } });
  revalidatePath("/admin");
  return { ok: true, email: owner.email, password };
}
