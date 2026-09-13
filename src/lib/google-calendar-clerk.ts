/**
 * Pobiera token Google (do Calendar API) z Clerk – gdy użytkownik loguje się przez Google.
 * Clerk w Dashboard musi mieć dodany scope: https://www.googleapis.com/auth/calendar
 * (Configure → Social connections → Google → Additional scopes).
 * Nie wymaga GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET w aplikacji.
 */

import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import type { GoogleCalendarConnection } from "@/lib/google-calendar";

export type GoogleCalendarTokenResult =
  | { ok: true; token: string; calendarId: string; source: "clerk" | "connection" }
  | { ok: false; reason: "unauthenticated" | "no_google_token" | "no_connection" };

/**
 * Zwraca token dostępu do Google Calendar: najpierw z Clerk (logowanie przez Google),
 * jeśli brak – z zapisanego połączenia OAuth (GoogleCalendarConnection).
 */
export async function getGoogleCalendarToken(): Promise<GoogleCalendarTokenResult> {
  const currentUser = await getCurrentUser();
  const clerkUserId = currentUser?.id ?? null;
  if (!clerkUserId) {
    return { ok: false, reason: "unauthenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { id: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, reason: "no_google_token" };
  }

  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId: user.id },
  });
  if (!connection) {
    return { ok: false, reason: "no_connection" };
  }

  const { getValidAccessToken } = await import("@/lib/google-calendar");
  const conn: GoogleCalendarConnection = {
    id: connection.id,
    userId: connection.userId,
    refreshToken: connection.refreshToken,
    accessToken: connection.accessToken,
    tokenExpiresAt: connection.tokenExpiresAt,
    calendarId: connection.calendarId,
  };
  try {
    const token = await getValidAccessToken(conn);
    return {
      ok: true,
      token,
      calendarId: connection.calendarId ?? "primary",
      source: "connection",
    };
  } catch {
    return { ok: false, reason: "no_connection" };
  }
}
