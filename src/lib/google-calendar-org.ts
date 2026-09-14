import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";
import {
  listAllUpcomingEvents,
  type GoogleCalendarConnection as LibConnection,
} from "@/lib/google-calendar";

/**
 * Kalendarze Google przestrzeni.
 *
 * Obiekt zwykle prowadzi kilka kalendarzy na różnych kontach — sali,
 * właściciela, koordynatora. Wcześniejszy model dopuszczał jedno połączenie na
 * użytkownika i sięgał po token Clerka, którego w tym produkcie już nie ma.
 * Tutaj połączenie należy do PRZESTRZENI: ma swoją nazwę, kolor na grafiku
 * i może być przypisane do konkretnej sali.
 */

export type PolaczenieKalendarza = {
  id: string;
  label: string;
  color: string;
  calendarId: string | null;
  venueHallId: string | null;
  isActive: boolean;
  lastSyncAt: Date | null;
};

/** Rezerwacja z Google pokazywana na grafiku — tylko do odczytu. */
export type RezerwacjaZGoogle = {
  id: string;
  tytul: string;
  start: string;
  koniec: string | null;
  calyDzien: boolean;
  /** Skąd pochodzi — po to jest kolor i nazwa. */
  polaczenieId: string;
  polaczenieLabel: string;
  kolor: string;
  venueHallId: string | null;
};

function doLibConnection(c: {
  id: string;
  userId: string;
  refreshToken: string;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
  calendarId: string | null;
}): LibConnection {
  return {
    id: c.id,
    userId: c.userId,
    refreshToken: c.refreshToken,
    accessToken: c.accessToken,
    tokenExpiresAt: c.tokenExpiresAt,
    calendarId: c.calendarId,
  };
}

async function aktywnaOrganizacja(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getActiveOrgId(user.id);
}

export async function listOrgConnections(): Promise<PolaczenieKalendarza[]> {
  const orgId = await aktywnaOrganizacja();
  if (!orgId) return [];
  try {
    const rows = await prisma.googleCalendarConnection.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        label: true,
        color: true,
        calendarId: true,
        venueHallId: true,
        isActive: true,
        lastSyncAt: true,
      },
    });
    return rows;
  } catch (e) {
    console.error("[google:listOrgConnections]", e);
    return [];
  }
}

/**
 * Rezerwacje ze wszystkich włączonych kalendarzy przestrzeni.
 *
 * Jedno padnięte połączenie (cofnięty dostęp, wygasły refresh token) nie może
 * wygasić całego grafiku — pozostałe kalendarze mają się pokazać, a błąd ląduje
 * w logu. Grafik bez jednego źródła jest użyteczny, pusty grafik nie jest.
 */
export async function listOrgGoogleReservations(
  od: Date,
  doKiedy: Date,
): Promise<RezerwacjaZGoogle[]> {
  const orgId = await aktywnaOrganizacja();
  if (!orgId) return [];

  let polaczenia;
  try {
    polaczenia = await prisma.googleCalendarConnection.findMany({
      where: { organizationId: orgId, isActive: true },
    });
  } catch (e) {
    console.error("[google:reservations:list]", e);
    return [];
  }

  const wyniki = await Promise.all(
    polaczenia.map(async (c) => {
      try {
        const wydarzenia = await listAllUpcomingEvents(
          doLibConnection(c),
          c.calendarId ?? "primary",
          od,
          250,
          doKiedy,
        );
        return wydarzenia.map<RezerwacjaZGoogle>((w) => ({
          id: `${c.id}:${w.googleEventId}`,
          tytul: w.summary || "(bez nazwy)",
          start: w.startDate,
          koniec: w.endDate ?? null,
          calyDzien: w.isAllDay,
          polaczenieId: c.id,
          polaczenieLabel: c.label,
          kolor: c.color,
          venueHallId: c.venueHallId,
        }));
      } catch (e) {
        console.error(`[google:reservations] połączenie ${c.id} (${c.label})`, e);
        return [];
      }
    }),
  );

  return wyniki.flat();
}
