"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { generateWeddingBoardToken } from "@/lib/wedding-board-utils";

export type WeddingBoardPortalData = {
  eventId: string;
  eventName: string;
  eventDate: string;
  location: string | null;
  organizerName: string | null;
  guestCount: number | null;
  organizationName: string | null;
  organizationLogo: string | null;
  schedule: Array<{ time: string; title: string; description: string | null; location: string | null }>;
  menuVariants: Array<{
    id: string;
    label: string;
    description: string | null;
    imageUrl: string | null;
    notes: string | null;
    courses: Array<{ typeLabel: string; name: string; description: string | null }>;
  }>;
  menuSelection: Array<{ variantId: string; guests: number }>;
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  APPETIZER: "Przystawka",
  SOUP: "Zupa",
  MAIN: "Danie główne",
  DESSERT: "Deser",
  CAKE: "Tort",
  COLD_PLATTER: "Zimna płyta",
  BUFFET: "Bufet",
  DINNER: "Kolacja",
  COFFEE_TEA: "Kawa i herbata",
  DRINKS: "Napoje",
  ALCOHOL: "Alkohol",
  OTHER: "Inne",
};

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export async function getWeddingBoardPortalData(
  token: string
): Promise<WeddingBoardPortalData | null> {
  if (!token || token.length < 16) return null;

  const event = await prisma.event.findUnique({
    where: { weddingBoardToken: token },
    select: {
      id: true,
      name: true,
      date: true,
      receptionLocationName: true,
      organizerName: true,
      estimatedGuestCount: true,
      clientMenuSelectionJson: true,
      organization: { select: { name: true, logo: true } },
    },
  });
  if (!event) return null;

  const [schedule, menuVariants] = await Promise.all([
    prisma.dayScheduleItem.findMany({
      where: { eventId: event.id },
      orderBy: { sortOrder: "asc" },
      select: { startTime: true, title: true, description: true, location: true },
    }),
    prisma.menuVariant.findMany({
      where: { eventId: event.id },
      include: { courses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  let menuSelection: Array<{ variantId: string; guests: number }> = [];
  try {
    menuSelection = event.clientMenuSelectionJson
      ? JSON.parse(event.clientMenuSelectionJson)
      : [];
  } catch {}

  return {
    eventId: event.id,
    eventName: event.name,
    eventDate: new Date(event.date).toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    location: event.receptionLocationName,
    organizerName: event.organizerName,
    guestCount: event.estimatedGuestCount,
    organizationName: event.organization?.name ?? null,
    organizationLogo: event.organization?.logo ?? null,
    schedule: schedule.map((s) => ({
      time: formatTime(s.startTime),
      title: s.title,
      description: s.description,
      location: s.location,
    })),
    menuVariants: menuVariants.map((v) => ({
      id: v.id,
      label: v.label,
      description: v.description,
      imageUrl: v.imageUrl,
      notes: v.notes,
      courses: v.courses.map((c) => ({
        typeLabel: COURSE_TYPE_LABELS[c.courseType] ?? c.courseType,
        name: c.name,
        description: c.description,
      })),
    })),
    menuSelection,
  };
}

/** Generuje token WeddingBoard dla eventu weselnego. */
export async function generateWeddingBoardLink(
  eventId: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Brak uprawnień" };

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return { ok: false, error: "Brak organizacji" };

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: membership.organizationId },
    select: { id: true, isWedding: true, weddingBoardToken: true },
  });
  if (!event) return { ok: false, error: "Event nie istnieje" };
  if (!event.isWedding) return { ok: false, error: "Event nie jest weselem" };

  if (event.weddingBoardToken) {
    return { ok: true, token: event.weddingBoardToken };
  }

  const token = generateWeddingBoardToken();
  await prisma.event.update({
    where: { id: eventId },
    data: { weddingBoardToken: token },
  });

  revalidatePath(`/app/events/${eventId}`);
  return { ok: true, token };
}

/** Resetuje token WeddingBoard (generuje nowy). */
export async function resetWeddingBoardLink(
  eventId: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Brak uprawnień" };

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return { ok: false, error: "Brak organizacji" };

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: membership.organizationId },
    select: { id: true },
  });
  if (!event) return { ok: false, error: "Event nie istnieje" };

  const token = generateWeddingBoardToken();
  await prisma.event.update({
    where: { id: eventId },
    data: { weddingBoardToken: token },
  });

  revalidatePath(`/app/events/${eventId}`);
  return { ok: true, token };
}
