"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { requireOrgId } from "@/lib/auth/active-org";
import { assertModuleEdit } from "@/lib/permissions/guard";

/**
 * Personel obiektu i obsada przyjęć.
 *
 * To NIE są konta w systemie. Kelner, kucharz czy barman nie musi się logować,
 * żeby trafić na obsadę przyjęcia i do agendy dla obsługi — wystarczy, że
 * manager go wpisze. Konta zakłada się tylko tym, którzy realnie pracują
 * w panelu, i to one liczą się do limitu pakietu.
 */

export type OsobaZPersonelu = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  note: string | null;
  isActive: boolean;
};

export type ObsadaPozycja = {
  id: string;
  staffId: string;
  name: string;
  role: string;
  phone: string | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

async function orgId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return requireOrgId(user.id);
}

export async function listStaff(): Promise<OsobaZPersonelu[]> {
  try {
    const organizationId = await orgId();
    return await prisma.orgStaff.findMany({
      where: { organizationId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, role: true, phone: true, note: true, isActive: true },
    });
  } catch {
    return [];
  }
}

export async function addStaff(input: {
  name: string;
  role: string;
  phone?: string | null;
  note?: string | null;
}): Promise<{ ok: boolean; osoba?: OsobaZPersonelu; error?: string }> {
  await assertModuleEdit("team");
  const organizationId = await orgId();

  const name = input.name?.trim();
  if (!name) return { ok: false, error: "Podaj imię i nazwisko." };
  if (name.length > 80) return { ok: false, error: "Nazwa może mieć najwyżej 80 znaków." };

  const osoba = await prisma.orgStaff.create({
    data: {
      organizationId,
      name,
      role: input.role?.trim() || "STAFF",
      phone: input.phone?.trim() || null,
      note: input.note?.trim() || null,
    },
    select: { id: true, name: true, role: true, phone: true, note: true, isActive: true },
  });

  revalidatePath("/app/team");
  return { ok: true, osoba };
}

export async function updateStaff(
  id: string,
  patch: { name?: string; role?: string; phone?: string | null; isActive?: boolean; note?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("team");
  const organizationId = await orgId();

  const istnieje = await prisma.orgStaff.findFirst({ where: { id, organizationId }, select: { id: true } });
  if (!istnieje) return { ok: false, error: "Nie znaleziono osoby." };

  const name = patch.name?.trim();
  if (name !== undefined && !name) return { ok: false, error: "Nazwa nie może być pusta." };

  await prisma.orgStaff.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(patch.role !== undefined ? { role: patch.role.trim() || "STAFF" } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone?.trim() || null } : {}),
      ...(patch.note !== undefined ? { note: patch.note?.trim() || null } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    },
  });

  revalidatePath("/app/team");
  return { ok: true };
}

export async function removeStaff(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("team");
  const organizationId = await orgId();
  const { count } = await prisma.orgStaff.deleteMany({ where: { id, organizationId } });
  if (count === 0) return { ok: false, error: "Nie znaleziono osoby." };
  revalidatePath("/app/team");
  return { ok: true };
}

// ── Obsada przyjęcia ─────────────────────────────────────────────────────

async function eventWPrzestrzeni(eventId: string, organizationId: string): Promise<boolean> {
  const e = await prisma.event.findFirst({ where: { id: eventId, organizationId }, select: { id: true } });
  return !!e;
}

export async function listEventStaff(eventId: string): Promise<ObsadaPozycja[]> {
  try {
    const organizationId = await orgId();
    if (!(await eventWPrzestrzeni(eventId, organizationId))) return [];

    const rows = await prisma.eventStaff.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        staffId: true,
        role: true,
        startTime: true,
        endTime: true,
        note: true,
        staff: { select: { name: true, role: true, phone: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      name: r.staff.name,
      role: r.role ?? r.staff.role,
      phone: r.staff.phone,
      startTime: r.startTime,
      endTime: r.endTime,
      note: r.note,
    }));
  } catch {
    return [];
  }
}

export async function assignStaffToEvent(
  eventId: string,
  input: { staffId: string; role?: string | null; startTime?: string | null; endTime?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("events");
  const organizationId = await orgId();

  if (!(await eventWPrzestrzeni(eventId, organizationId))) {
    return { ok: false, error: "Nie znaleziono przyjęcia." };
  }
  const osoba = await prisma.orgStaff.findFirst({
    where: { id: input.staffId, organizationId },
    select: { id: true },
  });
  if (!osoba) return { ok: false, error: "Nie znaleziono osoby w personelu." };

  try {
    await prisma.eventStaff.create({
      data: {
        eventId,
        staffId: input.staffId,
        role: input.role?.trim() || null,
        startTime: input.startTime?.trim() || null,
        endTime: input.endTime?.trim() || null,
      },
    });
  } catch {
    // Unikat (eventId, staffId) — ta sama osoba już jest w obsadzie.
    return { ok: false, error: "Ta osoba jest już w obsadzie tego przyjęcia." };
  }

  revalidatePath(`/app/events/${eventId}`);
  return { ok: true };
}

export async function removeStaffFromEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("events");
  const organizationId = await orgId();

  const pozycja = await prisma.eventStaff.findFirst({
    where: { id, event: { organizationId } },
    select: { id: true, eventId: true },
  });
  if (!pozycja) return { ok: false, error: "Nie znaleziono pozycji obsady." };

  await prisma.eventStaff.delete({ where: { id } });
  revalidatePath(`/app/events/${pozycja.eventId}`);
  return { ok: true };
}
