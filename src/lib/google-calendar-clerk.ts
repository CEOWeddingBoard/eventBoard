import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { getValidAccessToken, type GoogleCalendarConnection } from "@/lib/google-calendar";

/**
 * Token dostępu do jednego kalendarza przestrzeni.
 *
 * Nazwa pliku jest zaszłością po logowaniu przez Clerk — token brało się wtedy
 * z sesji Clerka i było jedno na użytkownika. Teraz połączenia należą do
 * PRZESTRZENI i jest ich wiele, więc trzeba powiedzieć, o które chodzi.
 */

export type GoogleCalendarTokenResult =
  | { ok: true; token: string; calendarId: string; connectionId: string }
  | { ok: false; reason: "unauthenticated" | "no_connection" };

export async function getGoogleCalendarToken(
  connectionId?: string,
): Promise<GoogleCalendarTokenResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const orgId = await getActiveOrgId(user.id);
  if (!orgId) return { ok: false, reason: "no_connection" };

  const connection = await prisma.googleCalendarConnection.findFirst({
    where: {
      organizationId: orgId,
      isActive: true,
      ...(connectionId ? { id: connectionId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  if (!connection) return { ok: false, reason: "no_connection" };

  const conn: GoogleCalendarConnection = {
    id: connection.id,
    userId: connection.userId,
    refreshToken: connection.refreshToken,
    accessToken: connection.accessToken,
    tokenExpiresAt: connection.tokenExpiresAt,
    calendarId: connection.calendarId,
  };

  return {
    ok: true,
    token: await getValidAccessToken(conn),
    calendarId: connection.calendarId ?? "primary",
    connectionId: connection.id,
  };
}
