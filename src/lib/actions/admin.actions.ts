"use server";

import { prisma } from "@/lib/prisma";
import { assigneeRoleLabel } from "@/lib/workflow-roles";
import { getCurrentUser } from "@/lib/auth/utils";
import { hashPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/active-org";
import { normalizePlan, effectiveLimits, type PlanKey } from "@/lib/plans";
import { RODZAJE_NOTATEK } from "@/lib/admin-notes";

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

/** Jeden etap wdrożenia klienta — nazwa, czy zrobiony i gdzie to ustawić. */
export type EtapWdrozenia = {
  klucz: string;
  nazwa: string;
  zrobiony: boolean;
  podpowiedz: string;
};

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
  maxGoogleCalendars: number | null;
  eventCount: number;
  loginUrl: string;
  customRoles: { value: string; label: string }[];
  billingPaidUntil: string | null;
  billingNote: string | null;
  adminNote: string | null;
  archived: boolean;
  brandColor: string | null;
  brandLogoUrl: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  /** Postęp wdrożenia — widoczny od razu na liście klientów. */
  wdrozenie: EtapWdrozenia[];
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
      maxAdmins: true, maxUsers: true, maxGoogleCalendars: true, customRolesJson: true, billingPaidUntil: true, billingNote: true,
      adminNote: true, archivedAt: true, brandColor: true, brandLogoUrl: true,
      contactPerson: true, contactPhone: true, email: true,
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
  const wdrozenia = await wdrozeniaDlaPrzestrzeni(orgIds);
  const base = appBase();
  return orgs.map((o) => {
    const owner = owners.find((u) => u.id === o.ownerId) ?? null;
    const plan = normalizePlan(o.plan);
    const limits = effectiveLimits(plan, { maxAdmins: o.maxAdmins, maxUsers: o.maxUsers, maxGoogleCalendars: o.maxGoogleCalendars });
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
      maxGoogleCalendars: limits.maxGoogleCalendars,
      eventCount: o._count.events,
      loginUrl: `${base}/pl/auth?space=${o.slug}`,
      customRoles: parseCustomRoles(o.customRolesJson),
      billingPaidUntil: o.billingPaidUntil ? o.billingPaidUntil.toISOString() : null,
      billingNote: o.billingNote ?? null,
      adminNote: o.adminNote ?? null,
      archived: !!o.archivedAt,
      brandColor: o.brandColor ?? null,
      brandLogoUrl: o.brandLogoUrl ?? null,
      contactPerson: o.contactPerson ?? null,
      contactPhone: o.contactPhone ?? null,
      contactEmail: o.email ?? null,
      wdrozenie: wdrozenia.get(o.id) ?? [],
    };
  });
}

/**
 * Etapy wdrożenia dla wszystkich przestrzeni naraz.
 *
 * Liczone zbiorczo (kilka zapytań grupujących zamiast dziesięciu na klienta),
 * bo lista klientów ma się otwierać od razu, a nie po sekundzie. Wszystkie dane
 * już są w bazie — to tylko ich odczytanie, nic nowego nie zapisujemy.
 */
async function wdrozeniaDlaPrzestrzeni(orgIds: string[]): Promise<Map<string, EtapWdrozenia[]>> {
  const pusty = new Map<string, EtapWdrozenia[]>();
  if (orgIds.length === 0) return pusty;

  const zbierz = async <T extends { organizationId: string | null }>(
    rows: Promise<T[]>,
  ): Promise<Set<string>> => {
    const out = new Set<string>();
    for (const r of await rows) if (r.organizationId) out.add(r.organizationId);
    return out;
  };

  const [procesy, sale, regulyMenu, kalendarze, zespol, eventy, linki, procesyRuszyly, agendy] =
    await Promise.all([
      zbierz(prisma.organizationWorkflow.findMany({
        where: { organizationId: { in: orgIds }, nodes: { some: {} } },
        select: { organizationId: true },
      })),
      zbierz(prisma.venue.findMany({
        where: { organizationId: { in: orgIds }, halls: { some: {} } },
        select: { organizationId: true },
      })),
      zbierz(prisma.menuParserConfig.findMany({
        where: { organizationId: { in: orgIds } },
        select: { organizationId: true },
      })),
      zbierz(prisma.googleCalendarConnection.findMany({
        where: { organizationId: { in: orgIds } },
        select: { organizationId: true },
      })),
      zbierz(prisma.organizationMember.findMany({
        where: { organizationId: { in: orgIds }, role: { notIn: ["SERVICE", "OWNER"] } },
        select: { organizationId: true },
      })),
      zbierz(prisma.event.findMany({
        where: { organizationId: { in: orgIds } },
        select: { organizationId: true },
      })),
      zbierz(prisma.event.findMany({
        where: { organizationId: { in: orgIds }, clientLinkTokenHash: { not: null } },
        select: { organizationId: true },
      })),
      zbierz(prisma.event.findMany({
        where: { organizationId: { in: orgIds }, processState: { isNot: null } },
        select: { organizationId: true },
      })),
      zbierz(prisma.event.findMany({
        where: { organizationId: { in: orgIds }, agendaData: { isNot: null } },
        select: { organizationId: true },
      })),
    ]);

  for (const id of orgIds) {
    pusty.set(id, [
      { klucz: "proces", nazwa: "Proces obsługi", zrobiony: procesy.has(id), podpowiedz: "Ustawienia → Procesy" },
      { klucz: "sale", nazwa: "Sale", zrobiony: sale.has(id), podpowiedz: "Ustawienia → Sale" },
      { klucz: "menu", nazwa: "Reguły importu menu", zrobiony: regulyMenu.has(id), podpowiedz: "Konfiguracja → Reguły importu menu" },
      { klucz: "kalendarz", nazwa: "Kalendarz Google", zrobiony: kalendarze.has(id), podpowiedz: "Konfiguracja → Kalendarze Google" },
      { klucz: "zespol", nazwa: "Zespół", zrobiony: zespol.has(id), podpowiedz: "Zespół → Dodaj konto" },
      { klucz: "event", nazwa: "Pierwsze przyjęcie", zrobiony: eventy.has(id), podpowiedz: "Eventy → Nowy event" },
      { klucz: "link", nazwa: "Link wysłany klientowi", zrobiony: linki.has(id), podpowiedz: "Event → Link dla klienta" },
      { klucz: "proces-ruszyl", nazwa: "Proces uruchomiony", zrobiony: procesyRuszyly.has(id), podpowiedz: "Event → Proces obsługi" },
      { klucz: "agenda", nazwa: "Agenda wypełniona", zrobiony: agendy.has(id), podpowiedz: "Kroki procesu zasilają agendę" },
    ]);
  }
  return pusty;
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
export async function setSpaceLimits(
  orgId: string,
  input: { maxAdmins: number | null; maxUsers: number | null; maxGoogleCalendars?: number | null },
): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const clean = (n: number | null | undefined) => (n == null || Number.isNaN(n) || n < 0 ? null : Math.floor(n));
  const maxAdmins = clean(input.maxAdmins);
  const maxUsers = clean(input.maxUsers);
  const maxGoogleCalendars = clean(input.maxGoogleCalendars);

  const [adminsUsed, usersUsed, kalendarzeUzyte] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId, role: { not: "SERVICE" }, isAdmin: true } }),
    prisma.organizationMember.count({ where: { organizationId: orgId, role: { not: "SERVICE" }, isAdmin: false } }),
    prisma.googleCalendarConnection.count({ where: { organizationId: orgId } }),
  ]);
  if (maxAdmins != null && adminsUsed > maxAdmins) return { ok: false, error: `Adminów jest ${adminsUsed}, limit ${maxAdmins}. Usuń konta lub podnieś limit.` };
  if (maxUsers != null && usersUsed > maxUsers) return { ok: false, error: `Użytkowników jest ${usersUsed}, limit ${maxUsers}. Usuń konta lub podnieś limit.` };
  if (maxGoogleCalendars != null && kalendarzeUzyte > maxGoogleCalendars) {
    return { ok: false, error: `Kalendarzy jest ${kalendarzeUzyte}, limit ${maxGoogleCalendars}. Odłącz kalendarz lub podnieś limit.` };
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { maxAdmins, maxUsers, maxGoogleCalendars },
  });
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

// ── Dane kontaktowe i dziennik notatek o kliencie ────────────────────────

export type NotatkaKlienta = {
  id: string;
  kind: string;
  content: string;
  autor: string | null;
  createdAt: string;
};

/** Dane kontaktowe klienta — poza e-mailem właściciela. */
export async function setSpaceContact(
  orgId: string,
  input: { contactPerson: string | null; contactPhone: string | null; email: string | null },
): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  const email = input.email?.trim() || null;
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "Podaj poprawny e-mail." };

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      contactPerson: input.contactPerson?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      email,
    },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function listSpaceNotes(orgId: string): Promise<NotatkaKlienta[]> {
  await assertPlatformAdmin();
  const rows = await prisma.orgAdminNote.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    content: r.content,
    autor: r.authorName,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Dopisanie notatki o kliencie.
 *
 * To jest źródło wiedzy o tym, w którą stronę rozwijać produkt: czego klienci
 * proszą, na czym się potykają, co obiecaliśmy. Dlatego notatki są DOPISYWANE,
 * a nie nadpisywane — historia jest tu treścią, nie balastem.
 */
export async function addSpaceNote(
  orgId: string,
  input: { kind: string; content: string },
): Promise<{ ok: boolean; notatka?: NotatkaKlienta; error?: string }> {
  const admin = await assertPlatformAdmin();
  const content = input.content?.trim();
  if (!content) return { ok: false, error: "Notatka nie może być pusta." };
  if (content.length > 2000) return { ok: false, error: "Notatka może mieć najwyżej 2000 znaków." };

  const kind = RODZAJE_NOTATEK.some((r) => r.value === input.kind) ? input.kind : "UWAGA";
  const autor = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { name: true, email: true },
  });

  const row = await prisma.orgAdminNote.create({
    data: {
      organizationId: orgId,
      authorId: admin.id,
      authorName: autor?.name ?? autor?.email ?? null,
      kind,
      content,
    },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    notatka: {
      id: row.id,
      kind: row.kind,
      content: row.content,
      autor: row.authorName,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export async function removeSpaceNote(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertPlatformAdmin();
  await prisma.orgAdminNote.deleteMany({ where: { id } });
  revalidatePath("/admin");
  return { ok: true };
}

/** Proces zdefiniowany w przestrzeni klienta. */
export type ProcesPrzestrzeni = {
  id: string;
  name: string;
  liczbaKrokow: number;
  /** Ile przyjęć faktycznie tego procesu używa — proces bez użyć to sygnał. */
  liczbaEventow: number;
};

/** Konto w przestrzeni klienta, z danymi potrzebnymi do resetu hasła. */
export type KontoPrzestrzeni = {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  /** Role operacyjne (Kucharz, Kelner…), gotowe do pokazania. */
  roleOperacyjne: string[];
};

export type SzczegolyPrzestrzeni = {
  procesy: ProcesPrzestrzeni[];
  konta: KontoPrzestrzeni[];
};

/**
 * Szczegóły przestrzeni doczytywane przy rozwinięciu wiersza.
 *
 * Świadomie NIE są częścią `listEventSpaces`: lista klientów ma się otwierać
 * od razu, a procesy i konta to dwa dodatkowe zapytania na każdą przestrzeń.
 * Przy kilkudziesięciu klientach lista ładowałaby się zauważalnie wolniej,
 * żeby pokazać dane, na które patrzy się przy jednym kliencie naraz.
 */
export async function getSpaceDetails(orgId: string): Promise<SzczegolyPrzestrzeni> {
  await assertPlatformAdmin();

  const [workflows, members] = await Promise.all([
    prisma.organizationWorkflow.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, _count: { select: { nodes: true } } },
    }),
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        role: true,
        isAdmin: true,
        rolesJson: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  const uzycia = await prisma.event.groupBy({
    by: ["workflowId"],
    where: { organizationId: orgId, workflowId: { not: null } },
    _count: { _all: true },
  });
  const licznik = new Map(uzycia.map((u) => [u.workflowId, u._count._all]));

  return {
    procesy: workflows.map((w) => ({
      id: w.id,
      name: w.name,
      liczbaKrokow: w._count.nodes,
      liczbaEventow: licznik.get(w.id) ?? 0,
    })),
    // Konto serwisowe należy do każdej przestrzeni — na liście klienta
    // tylko myli, bo to nasze konto, nie jego.
    konta: members
      .filter((m) => m.role !== "SERVICE")
      .map((m) => ({
        userId: m.user.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
        isAdmin: m.isAdmin,
        roleOperacyjne: (() => {
          try {
            const r = JSON.parse(m.rolesJson ?? "[]");
            return Array.isArray(r)
              ? r.filter((x): x is string => typeof x === "string").map(assigneeRoleLabel)
              : [];
          } catch {
            return [];
          }
        })(),
      })),
  };
}
