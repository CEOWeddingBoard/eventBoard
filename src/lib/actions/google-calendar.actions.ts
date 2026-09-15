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
  canWrite,
  canDelete,
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
      await zapiszDziennik(organizationId, cel, "UPDATE", event.name, event.id);
    } else {
      const googleId = await createCalendarEventWithToken(token, calendarId, wejscie, event.id);
      await prisma.event.update({
        where: { id: event.id },
        data: { googleCalendarEventId: googleId },
      });
      await zapiszDziennik(organizationId, cel, "CREATE", event.name, event.id);
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

/**
 * Automatyczna synchronizacja przyjęcia do Google.
 *
 * Wołana po każdym zapisie przyjęcia, nie przez człowieka — dlatego
 * NIGDY nie rzuca i nie sprawdza uprawnień modułu: zapis przyjęcia nie może
 * się wywrócić dlatego, że Google akurat nie odpowiada. Uprawnienia
 * sprawdziła już akcja, która ten zapis wykonała.
 *
 * Decyduje sama, co zrobić: wpis powstaje, aktualizuje się przy zmianie
 * daty czy sali, a przy statusie ARCHIVED znika z kalendarza. Bez tego
 * ostatniego przesunięty albo odwołany termin zostawał w Google zablokowany
 * na zawsze — grafik pokazywałby nieprawdę.
 */
export async function zsynchronizujEventZGoogle(eventId: string): Promise<void> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        date: true,
        eventEndTime: true,
        hallId: true,
        status: true,
        organizationId: true,
        googleCalendarEventId: true,
        receptionLocationName: true,
        scenarioNotes: true,
      },
    });
    if (!event?.organizationId) return;

    const polaczenia = await prisma.googleCalendarConnection.findMany({
      where: { organizationId: event.organizationId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (polaczenia.length === 0) return;

    const cel =
      (event.hallId ? polaczenia.find((c) => c.venueHallId === event.hallId) : undefined) ??
      polaczenia.find((c) => c.venueHallId === null) ??
      polaczenia[0];

    // Kalendarz podłączony tylko do podglądu nie przyjmuje zapisów — obiekt
    // świadomie wybrał, że EventBoard ma go wyłącznie czytać.
    if (!canWrite(cel.accessMode)) return;

    const token = await getValidAccessToken({
      id: cel.id,
      userId: cel.userId,
      refreshToken: cel.refreshToken,
      accessToken: cel.accessToken,
      tokenExpiresAt: cel.tokenExpiresAt,
      calendarId: cel.calendarId,
    });
    const calendarId = cel.calendarId ?? "primary";

    // Przyjęcie zarchiwizowane zwalnia termin — wpis musi zniknąć z Google.
    // Przy poziomie „zapis bez kasowania" zostawiamy go i tylko oznaczamy,
    // bo obiekt zastrzegł, że nic z jego kalendarza nie ma znikać.
    if (event.status === "ARCHIVED") {
      if (event.googleCalendarEventId && !canDelete(cel.accessMode)) {
        await updateCalendarEventWithToken(token, calendarId, event.googleCalendarEventId, {
          summary: `[odwołane] ${event.name}`,
          start: { dateTime: new Date(event.date).toISOString() },
          end: {
            dateTime: (
              event.eventEndTime ?? new Date(new Date(event.date).getTime() + 5 * 3600_000)
            ).toISOString(),
          },
        });
        await zapiszDziennik(event.organizationId, cel, "UPDATE", event.name, event.id,
          "Przyjęcie odwołane — wpis oznaczony, bo poziom dostępu nie pozwala kasować.");
        return;
      }
      if (event.googleCalendarEventId) {
        const { deleteCalendarEventWithToken } = await import("@/lib/google-calendar");
        await deleteCalendarEventWithToken(token, calendarId, event.googleCalendarEventId);
        await prisma.event.update({
          where: { id: event.id },
          data: { googleCalendarEventId: null },
        });
        await zapiszDziennik(event.organizationId, cel, "DELETE", event.name, event.id);
      }
      return;
    }

    const start = new Date(event.date);
    // Bez godziny zakończenia przyjmujemy pięć godzin — wpis bez końca Google
    // traktuje jako całodniowy i zabrudziłby widok kalendarza.
    const koniec = event.eventEndTime ?? new Date(start.getTime() + 5 * 60 * 60 * 1000);

    const wejscie = {
      summary: event.status === "DRAFT" ? `[wstępna] ${event.name}` : event.name,
      description: event.scenarioNotes ?? undefined,
      location: event.receptionLocationName ?? undefined,
      start: { dateTime: start.toISOString() },
      end: { dateTime: koniec.toISOString() },
    };

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
  } catch (e) {
    // Log, nie wyjątek: przyjęcie jest już zapisane, a obiekt ma w karcie
    // przycisk ręcznego wysłania, gdyby Google było chwilowo niedostępne.
    console.error("[google:autosync]", eventId, e);
  }
}

/**
 * Wpis do dziennika operacji na kalendarzu Google.
 *
 * Notujemy oba konta: kto działał w EventBoardzie i na jakim koncie Google
 * to wylądowało. Nazwa połączenia i adres są przepisywane w chwili zdarzenia,
 * żeby dziennik dało się czytać także po odłączeniu kalendarza.
 *
 * Nigdy nie rzuca — nieudany zapis do dziennika nie może wywrócić operacji,
 * którą właśnie opisuje.
 */
async function zapiszDziennik(
  organizationId: string,
  polaczenie: { id: string; label: string; googleAccountEmail: string | null },
  action: "CREATE" | "UPDATE" | "DELETE",
  subject: string,
  eventId: string,
  message?: string,
): Promise<void> {
  try {
    const user = await getCurrentUser();
    await prisma.googleCalendarAuditLog.create({
      data: {
        organizationId,
        connectionId: polaczenie.id,
        connectionLabel: polaczenie.label,
        googleAccountEmail: polaczenie.googleAccountEmail,
        action,
        subject,
        eventId,
        actorUserId: user?.id ?? null,
        actorEmail: user?.email ?? null,
        message: message ?? null,
      },
    });
  } catch (e) {
    console.error("[google:dziennik]", e);
  }
}

export type WpisDziennika = {
  id: string;
  action: string;
  subject: string | null;
  kalendarz: string | null;
  kontoGoogle: string | null;
  ktoEventBoard: string | null;
  ok: boolean;
  message: string | null;
  kiedy: string;
};

/** Ostatnie operacje na kalendarzach tej przestrzeni. */
export async function listGoogleAuditLog(limit = 40): Promise<WpisDziennika[]> {
  try {
    const organizationId = await orgIdLubBlad();
    const wpisy = await prisma.googleCalendarAuditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });
    return wpisy.map((w) => ({
      id: w.id,
      action: w.action,
      subject: w.subject,
      kalendarz: w.connectionLabel,
      kontoGoogle: w.googleAccountEmail,
      // Brak osoby znaczy „zrobiła to synchronizacja po zapisie przyjęcia".
      ktoEventBoard: w.actorEmail,
      ok: w.ok,
      message: w.message,
      kiedy: w.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Zmiana poziomu dostępu istniejącego połączenia. */
export async function setConnectionAccessMode(
  connectionId: string,
  mode: "READ" | "WRITE" | "FULL",
): Promise<{ ok: boolean; error?: string; wymagaPonownejZgody?: boolean }> {
  await assertModuleEdit("configuration");
  const organizationId = await orgIdLubBlad();

  const polaczenie = await prisma.googleCalendarConnection.findFirst({
    where: { id: connectionId, organizationId },
    select: { id: true, label: true, accessMode: true, googleAccountEmail: true },
  });
  if (!polaczenie) return { ok: false, error: "Nie znaleziono połączenia." };

  await prisma.googleCalendarConnection.update({
    where: { id: connectionId },
    data: { accessMode: mode },
  });

  const user = await getCurrentUser();
  await prisma.googleCalendarAuditLog.create({
    data: {
      organizationId,
      connectionId,
      connectionLabel: polaczenie.label,
      googleAccountEmail: polaczenie.googleAccountEmail,
      action: "MODE_CHANGE",
      subject: `${polaczenie.accessMode} → ${mode}`,
      actorUserId: user?.id ?? null,
      actorEmail: user?.email ?? null,
    },
  });

  revalidatePath("/app/settings/configuration");

  // Zejście z podglądu na zapis wymaga szerszego zakresu, a tego Google nie
  // doda do już wydanego tokenu — trzeba podłączyć kalendarz ponownie.
  const bylTylkoOdczyt = polaczenie.accessMode === "READ";
  return { ok: true, wymagaPonownejZgody: bylTylkoOdczyt && mode !== "READ" };
}
