"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { requireOrgId } from "@/lib/auth/active-org";
import { assertModuleEdit } from "@/lib/permissions/guard";

/**
 * Zarządzanie kalendarzami Google przestrzeni.
 *
 * Połączenie należy do przestrzeni, nie do osoby, która je podłączyła —
 * kalendarz sali ma działać także wtedy, gdy manager odejdzie z pracy.
 * Dlatego każda operacja sprawdza przynależność połączenia do aktywnej
 * przestrzeni, a nie do bieżącego użytkownika.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

async function orgIdLubBlad(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return requireOrgId(user.id);
}

export type KalendarzWKonfiguracji = {
  id: string;
  label: string;
  color: string;
  calendarId: string | null;
  venueHallId: string | null;
  venueHallName: string | null;
  isActive: boolean;
  podlaczyl: string | null;
  lastSyncAt: string | null;
};

export async function listGoogleCalendars(): Promise<KalendarzWKonfiguracji[]> {
  try {
    const organizationId = await orgIdLubBlad();
    const rows = await prisma.googleCalendarConnection.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        label: true,
        color: true,
        calendarId: true,
        venueHallId: true,
        isActive: true,
        lastSyncAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    const sale = await prisma.venueHall.findMany({
      where: { venue: { organizationId } },
      select: { id: true, name: true },
    });
    const nazwaSali = new Map(sale.map((s) => [s.id, s.name]));

    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      color: r.color,
      calendarId: r.calendarId,
      venueHallId: r.venueHallId,
      venueHallName: r.venueHallId ? (nazwaSali.get(r.venueHallId) ?? null) : null,
      isActive: r.isActive,
      podlaczyl: r.user?.name ?? r.user?.email ?? null,
      lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null,
    }));
  } catch {
    return [];
  }
}

/** Sale przestrzeni — do przypisania kalendarza. */
export async function listHallsForMapping(): Promise<{ id: string; name: string }[]> {
  try {
    const organizationId = await orgIdLubBlad();
    return await prisma.venueHall.findMany({
      where: { venue: { organizationId } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function updateGoogleCalendar(
  id: string,
  patch: { label?: string; color?: string; venueHallId?: string | null; isActive?: boolean; calendarId?: string },
): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("configuration");
  const organizationId = await orgIdLubBlad();

  const istnieje = await prisma.googleCalendarConnection.findFirst({
    where: { id, organizationId },
    select: { id: true },
  });
  if (!istnieje) return { ok: false, error: "Nie znaleziono kalendarza." };

  const label = patch.label?.trim();
  if (label !== undefined && (label.length === 0 || label.length > 60)) {
    return { ok: false, error: "Nazwa musi mieć od 1 do 60 znaków." };
  }
  if (patch.color !== undefined && !HEX.test(patch.color)) {
    return { ok: false, error: "Kolor musi być w formacie #rrggbb." };
  }

  // Sala musi należeć do tej samej przestrzeni — inaczej kalendarz wylądowałby
  // na grafiku cudzego obiektu.
  if (patch.venueHallId) {
    const sala = await prisma.venueHall.findFirst({
      where: { id: patch.venueHallId, venue: { organizationId } },
      select: { id: true },
    });
    if (!sala) return { ok: false, error: "Nie znaleziono takiej sali." };
  }

  await prisma.googleCalendarConnection.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.venueHallId !== undefined ? { venueHallId: patch.venueHallId || null } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.calendarId !== undefined ? { calendarId: patch.calendarId } : {}),
    },
  });

  revalidatePath("/app/settings/configuration");
  revalidatePath("/app/calendar");
  return { ok: true };
}

export async function removeGoogleCalendar(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("configuration");
  const organizationId = await orgIdLubBlad();

  const { count } = await prisma.googleCalendarConnection.deleteMany({
    where: { id, organizationId },
  });
  if (count === 0) return { ok: false, error: "Nie znaleziono kalendarza." };

  revalidatePath("/app/settings/configuration");
  revalidatePath("/app/calendar");
  return { ok: true };
}
