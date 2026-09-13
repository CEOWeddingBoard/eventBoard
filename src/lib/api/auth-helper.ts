import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
// Sesje partnerskie (link dla pary/plannera) należały do wycofanego produktu
// weselnego. Funkcje poniżej zachowują sygnatury, ale dostęp daje już wyłącznie
// konto użytkownika — dzięki temu wywołania w kodzie EventBoard nie zmieniają się.

export const EVENT_EDIT_ROLES = [
  "COUPLE_SECONDARY",
  "CO_ORGANIZER",
  "WEDDING_PLANNER",
] as const;

export const EVENT_INVITE_ROLES = ["COUPLE_SECONDARY", "WEDDING_PLANNER"] as const;

export async function requireAuth(_req: NextRequest): Promise<{ id: string; email: string }> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { id: user.id, email: user.email };
}

export async function requireEventAccess(
  req: NextRequest,
  eventId: string
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  let userId: string | null = null;
  try {
    const user = await requireAuth(req);
    userId = user.id;
  } catch {
    if (process.env.NODE_ENV !== "development") {
      return { allowed: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
  }

  if (await verifyEventAccessOrPartner(userId, eventId, req)) {
    return { allowed: true };
  }

  if (!userId) {
    if (process.env.NODE_ENV === "development") {
      const event = await prisma.event.findFirst({ where: { id: eventId } });
      if (!event) {
        return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
      }
      return { allowed: true };
    }
    return { allowed: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

export async function verifyEventAccess(
  userId: string,
  eventId: string
): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { userId },
        {
          participants: {
            some: { userId },
          },
        },
      ],
    },
  });

  return !!event;
}

export async function verifyPartnerEventAccess(_eventId: string): Promise<boolean> {
  return false;
}

export async function verifyEventAccessOrPartner(
  userId: string | null | undefined,
  eventId: string,
  _req?: NextRequest,
): Promise<boolean> {
  return !!userId && (await verifyEventAccess(userId, eventId));
}

export async function verifyEventEditAccess(
  userId: string,
  eventId: string
): Promise<boolean> {
  if (await verifyPartnerEventAccess(eventId)) return true;

  const owner = await prisma.event.findFirst({
    where: { id: eventId, userId },
  });
  if (owner) return true;

  const participant = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
      role: { in: [...EVENT_EDIT_ROLES] },
    },
  });
  return !!participant;
}

export async function verifyEventInviteAccess(
  userId: string,
  eventId: string
): Promise<boolean> {
  const owner = await prisma.event.findFirst({
    where: { id: eventId, userId },
  });
  if (owner) return true;

  const participant = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
      role: { in: [...EVENT_INVITE_ROLES, "COUPLE_SECONDARY"] },
    },
  });
  return !!participant;
}

/** @deprecated Użyj verifyEventAccess — eventId i weddingId to ten sam identyfikator Event. */
export async function verifyWeddingAccess(
  userId: string,
  eventId: string
): Promise<boolean> {
  return verifyEventAccess(userId, eventId);
}

export async function verifyWeddingAccessWithRoles(
  userId: string,
  eventId: string,
  roles: string[]
): Promise<boolean> {
  const owner = await prisma.event.findFirst({
    where: { id: eventId, userId },
  });
  if (owner) return true;

  const participant = await prisma.eventParticipant.findFirst({
    where: {
      eventId,
      userId,
      role: { in: roles },
    },
  });
  return !!participant;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
  }

  console.error("API Error:", error);
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}
