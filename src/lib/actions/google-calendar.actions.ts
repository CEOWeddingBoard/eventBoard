"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { requireOrgId } from "@/lib/auth/active-org";
import { assertModuleEdit } from "@/lib/permissions/guard";
import { effectiveLimits } from "@/lib/plans";
import {
  getValidAccessToken,
  createCalendarEventWithToken,
  updateCalendarEventWithToken,
} from "@/lib/google-calendar";

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

/** Ile kalendarzy wolno podłączyć w tej przestrzeni i ile już jest. */
export async function getGoogleCalendarLimit(): Promise<{ uzyte: number; limit: number | null }> {
  try {
    const organizationId = await orgIdLubBlad();
    const [org, uzyte] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true, maxGoogleCalendars: true },
      }),
      prisma.googleCalendarConnection.count({ where: { organizationId } }),
    ]);
    const limit = effectiveLimits(org?.plan, {
      maxGoogleCalendars: org?.maxGoogleCalendars ?? null,
    }).maxGoogleCalendars;
    return { uzyte, limit };
  } catch {
    return { uzyte: 0, limit: null };
  }
}

/**
 * Eksport przyjęcia do Google — druga strona synchronizacji.
 *
 * Kalendarz docelowy wynika z mapowania: jeśli event ma salę, a któryś
 * kalendarz jest do niej przypisany, trafia tam. Inaczej idzie do kalendarza
 * „całego obiektu” (bez przypisanej sali), a w ostateczności do pierwszego
 * włączonego. Dzięki temu rezerwacja wraca na ten sam grafik, z którego
 * czytamy zajętość — bez tego wpis lądowałby w losowym kalendarzu.
 */
export async function eksportujEventDoGoogle(
  eventId: string,
): Promise<{ ok: boolean; kalendarz?: string; error?: string }> {
  await assertModuleEdit("events");
  const organizationId = await orgIdLubBlad();

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: {
      id: true,
      name: true,
      date: true,
      eventEndTime: true,
      hallId: true,
      googleCalendarEventId: true,
      receptionLocationName: true,
      scenarioNotes: true,
    },
  });
  if (!event) return { ok: false, error: "Nie znaleziono przyjęcia." };

  const polaczenia = await prisma.googleCalendarConnection.findMany({
    where: { organizationId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (polaczenia.length === 0) {
    return { ok: false, error: "Nie podłączono żadnego kalendarza Google." };
  }

  const cel =
    (event.hallId ? polaczenia.find((c) => c.venueHallId === event.hallId) : undefined) ??
    polaczenia.find((c) => c.venueHallId === null) ??
    polaczenia[0];

  const start = new Date(event.date);
  // Bez godziny zakończenia przyjmujemy pięć godzin — tyle trwa typowe
  // przyjęcie, a wpis bez końca Google traktuje jako całodniowy.
  const koniec = event.eventEndTime ?? new Date(start.getTime() + 5 * 60 * 60 * 1000);

  const wejscie = {
    summary: event.name,
    description: event.scenarioNotes ?? undefined,
    location: event.receptionLocationName ?? undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: koniec.toISOString() },
  };

  try {
    const token = await getValidAccessToken({
      id: cel.id,
      userId: cel.userId,
      refreshToken: cel.refreshToken,
      accessToken: cel.accessToken,
      tokenExpiresAt: cel.tokenExpiresAt,
      calendarId: cel.calendarId,
    });
    const calendarId = cel.calendarId ?? "primary";

    if (event.googleCalendarEventId) {
      await updateCalendarEventWithToken(token, calendarId, event.googleCalendarEventId, wejscie);
    } else {
      const googleId = await createCalendarEventWithToken(token, calendarId, wejscie, event.id);
      await prisma.event.update({
        where: { id: event.id },
        data: { googleCalendarEventId: googleId },
      });
    }

    await prisma.googleCalendarConnection.update({
      where: { id: cel.id },
      data: { lastSyncAt: new Date() },
    });

    revalidatePath(`/app/events/${eventId}`);
    revalidatePath("/app/calendar");
    return { ok: true, kalendarz: cel.label };
  } catch (e) {
    console.error("[google:eksport]", e);
    return { ok: false, error: "Nie udało się zapisać w Google. Sprawdź połączenie w Konfiguracji." };
  }
}
