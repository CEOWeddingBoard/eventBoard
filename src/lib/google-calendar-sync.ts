/**
 * Synchronizacja wydarzenia wesela, zadań i planu dnia z Google Calendar.
 * Preferuje token z Clerk (logowanie przez Google); fallback na GoogleCalendarConnection.
 */

import { prisma } from "@/lib/prisma";
import type { GoogleCalendarConnection } from "@/lib/google-calendar";
import {
  createCalendarEvent,
  createCalendarEventWithToken,
  updateCalendarEvent,
  updateCalendarEventWithToken,
  deleteCalendarEvent,
  deleteCalendarEventWithToken,
} from "@/lib/google-calendar";

const WEDDING_EVENT_PREFIX = "wedding-";

function toGoogleDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toGoogleDateTime(d: Date): string {
  return d.toISOString();
}

type TokenOrConnection =
  | { type: "token"; token: string; calendarId: string }
  | { type: "connection"; connection: GoogleCalendarConnection };

async function syncWeddingEvent(
  ctx: TokenOrConnection,
  event: { id: string; name: string; date: Date; description?: string | null; mapLocationUrl?: string | null; googleCalendarEventId?: string | null; eventType?: string | null; estimatedGuestCount?: number | null; guestListMode?: string | null }
): Promise<void> {
  const start = event.date instanceof Date ? event.date : new Date(event.date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const ourId = WEDDING_EVENT_PREFIX + event.id;
  const extra = {
    eventType: event.eventType ?? undefined,
    guestCount: event.estimatedGuestCount ? String(event.estimatedGuestCount) : undefined,
    menuLabel: event.guestListMode ?? undefined,
  };
  const input = {
    summary: event.name,
    description: event.description ?? undefined,
    location: event.mapLocationUrl ?? undefined,
    start: { date: toGoogleDateOnly(start) },
    end: { date: toGoogleDateOnly(end) },
  };
  if (ctx.type === "token") {
    if (event.googleCalendarEventId) {
      await updateCalendarEventWithToken(ctx.token, ctx.calendarId, event.googleCalendarEventId, input);
    } else {
      const googleId = await createCalendarEventWithToken(ctx.token, ctx.calendarId, input, ourId, extra);
      await prisma.event.update({
        where: { id: event.id },
        data: { googleCalendarEventId: googleId },
      });
    }
  } else {
    if (event.googleCalendarEventId) {
      await updateCalendarEvent(ctx.connection, event.googleCalendarEventId, input);
    } else {
      const googleId = await createCalendarEvent(ctx.connection, input, ourId, extra);
      await prisma.event.update({
        where: { id: event.id },
        data: { googleCalendarEventId: googleId },
      });
    }
  }
}

async function syncTask(
  ctx: TokenOrConnection,
  task: { id: string; title: string; description?: string | null; dueDate: Date | null; googleEventId?: string | null }
): Promise<void> {
  if (!task.dueDate) return;
  const d = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  const end = new Date(d);
  end.setDate(end.getDate() + 1);
  const input = {
    summary: task.title,
    description: task.description ?? undefined,
    location: undefined,
    start: { date: toGoogleDateOnly(d) },
    end: { date: toGoogleDateOnly(end) },
  };
  if (ctx.type === "token") {
    if (task.googleEventId) {
      await updateCalendarEventWithToken(ctx.token, ctx.calendarId, task.googleEventId, input);
    } else {
      const googleId = await createCalendarEventWithToken(ctx.token, ctx.calendarId, input, task.id);
      await prisma.task.update({ where: { id: task.id }, data: { googleEventId: googleId } });
    }
  } else {
    if (task.googleEventId) {
      await updateCalendarEvent(ctx.connection, task.googleEventId, input);
    } else {
      const googleId = await createCalendarEvent(ctx.connection, input, task.id);
      await prisma.task.update({ where: { id: task.id }, data: { googleEventId: googleId } });
    }
  }
}

async function syncDayScheduleItem(
  ctx: TokenOrConnection,
  _eventDate: Date,
  item: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: Date;
    endTime: Date | null;
    googleEventId?: string | null;
  }
): Promise<void> {
  const start = item.startTime instanceof Date ? item.startTime : new Date(item.startTime);
  const end = item.endTime
    ? item.endTime instanceof Date
      ? item.endTime
      : new Date(item.endTime)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const input = {
    summary: item.title,
    description: item.description ?? undefined,
    location: item.location ?? undefined,
    start: { dateTime: toGoogleDateTime(start) },
    end: { dateTime: toGoogleDateTime(end) },
  };
  if (ctx.type === "token") {
    if (item.googleEventId) {
      await updateCalendarEventWithToken(ctx.token, ctx.calendarId, item.googleEventId, input);
    } else {
      const googleId = await createCalendarEventWithToken(ctx.token, ctx.calendarId, input, item.id);
      await prisma.dayScheduleItem.update({ where: { id: item.id }, data: { googleEventId: googleId } });
    }
  } else {
    if (item.googleEventId) {
      await updateCalendarEvent(ctx.connection, item.googleEventId, input);
    } else {
      const googleId = await createCalendarEvent(ctx.connection, input, item.id);
      await prisma.dayScheduleItem.update({ where: { id: item.id }, data: { googleEventId: googleId } });
    }
  }
}

export async function removeTaskFromGoogle(
  connection: GoogleCalendarConnection,
  googleEventId: string,
  taskId: string
): Promise<void> {
  await deleteCalendarEvent(connection, googleEventId);
  await prisma.task.update({
    where: { id: taskId },
    data: { googleEventId: null },
  });
}

export async function removeDayScheduleItemFromGoogle(
  connection: GoogleCalendarConnection,
  googleEventId: string,
  itemId: string
): Promise<void> {
  await deleteCalendarEvent(connection, googleEventId);
  await prisma.dayScheduleItem.update({
    where: { id: itemId },
    data: { googleEventId: null },
  });
}

export async function removeWeddingEventFromGoogle(
  connection: GoogleCalendarConnection,
  googleEventId: string,
  eventId: string
): Promise<void> {
  await deleteCalendarEvent(connection, googleEventId);
  await prisma.event.update({
    where: { id: eventId },
    data: { googleCalendarEventId: null },
  });
}

/** Pełna synchronizacja: wesele + zadania + plan dnia. Token z Clerk (logowanie Google) lub z GoogleCalendarConnection. */
export async function syncAllToGoogle(): Promise<{ ok: boolean; error?: string }> {
  const { getCurrentUser } = await import("@/lib/auth/utils");
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Zaloguj się" };
  }

  const tokenResult = await import("@/lib/google-calendar-clerk").then((m) => m.getGoogleCalendarToken());
  if (!tokenResult.ok) {
    if (tokenResult.reason === "unauthenticated") return { ok: false, error: "Zaloguj się" };
    if (tokenResult.reason === "no_connection") {
      return {
        ok: false,
        error: "Nie podłączono żadnego kalendarza Google. Zrób to w Konfiguracji, albo pobierz plik .ics na tej stronie.",
      };
    }
    return { ok: false, error: "Brak dostępu do Google Calendar" };
  }

  const ctx: TokenOrConnection = { type: "token", token: tokenResult.token, calendarId: tokenResult.calendarId };

  try {
    const event = await prisma.event.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        date: true,
        description: true,
        mapLocationUrl: true,
        googleCalendarEventId: true,
        eventType: true,
        estimatedGuestCount: true,
        guestListMode: true,
        tasks: true,
        dayScheduleItems: { orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }] },
      },
    });
    if (!event) {
      return { ok: false, error: "Brak wydarzenia wesela" };
    }

    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);

    await syncWeddingEvent(ctx, {
      id: event.id,
      name: event.name,
      date: event.date,
      description: event.description,
      mapLocationUrl: event.mapLocationUrl,
      googleCalendarEventId: event.googleCalendarEventId,
      eventType: event.eventType,
      estimatedGuestCount: event.estimatedGuestCount,
      guestListMode: event.guestListMode,
    });

    for (const task of event.tasks) {
      if (task.dueDate) {
        await syncTask(ctx, {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          googleEventId: task.googleEventId,
        });
      }
    }

    for (const item of event.dayScheduleItems) {
      await syncDayScheduleItem(ctx, eventDate, {
        id: item.id,
        title: item.title,
        description: item.description,
        location: item.location,
        startTime: item.startTime,
        endTime: item.endTime,
        googleEventId: item.googleEventId,
      });
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Błąd synchronizacji";
    return { ok: false, error: message };
  }
}
