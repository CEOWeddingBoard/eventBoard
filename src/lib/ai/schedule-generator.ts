"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { planSchedule } from "@/lib/ai/schedule-planner";

interface GeneratedScheduleItem {
  title: string;
  description: string;
  location: string | null;
  startTime: string;
  endTime: string;
}

function buildScheduleContext(event: any, menuVariants: any[]): string {
  const eventTypeLabels: Record<string, string> = {
    WEDDING: "ślub i wesele",
    COMMUNION: "komunia",
    CHRISTMAS_EVE: "wigilia firmowa",
    CORPORATE: "impreza firmowa",
    OTHER: "wydarzenie okolicznościowe",
  };

  let ctx = `Typ wydarzenia: ${eventTypeLabels[event.eventType] ?? event.eventType}.
Data: ${new Date(event.date).toLocaleDateString("pl-PL")}.
Nazwa: ${event.name}.
Szacowana liczba gości: ${event.estimatedGuestCount ?? "nieznana"}.
Styl: ${event.style ?? "nieokreślony"}.
`;

  if (menuVariants.length > 0) {
    ctx += `\nWarianty menu: ${menuVariants.map((v: any) => v.label).join(", ")}.`;
    const totalCourses = menuVariants.reduce((sum: number, v: any) => sum + v.courses.length, 0);
    ctx += ` Łącznie ${totalCourses} dań.`;
  }

  return ctx;
}

export async function generateAISchedule(
  eventId: string,
  instructions?: string
): Promise<GeneratedScheduleItem[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      name: true, date: true, eventType: true, estimatedGuestCount: true,
      style: true, receptionLocationName: true,
    },
  });
  if (!event) throw new Error("Event not found");

  const menuVariants = await prisma.menuVariant.findMany({
    where: { eventId },
    include: { courses: true },
  });

  const context = buildScheduleContext(event, menuVariants);

  // Bez skonfigurowanego modelu wchodzi planer deterministyczny. Wcześniej
  // była tu zaślepka z pięcioma sztywnymi punktami, identyczna dla wesela,
  // komunii i bankietu, ignorująca wskazówki i menu.
  if (!process.env.AI_PROVIDER || process.env.AI_PROVIDER === "mock") {
    return planSchedule(event, menuVariants, instructions);
  }

  const { generateAIResponse } = await import("@/lib/ai");
  const prompt = `Jesteś menadżerem sali bankietowej. Na podstawie kontekstu wygeneruj szczegółowy harmonogram dnia (5-10 punktów).

${context}
${instructions ? `Dodatkowe instrukcje: ${instructions}` : ""}

Format: JSON array obiektów:
{
  "title": "nazwa punktu",
  "description": "szczegóły",
  "location": "miejsce lub null",
  "startTime": "YYYY-MM-DDTHH:MM",
  "endTime": "YYYY-MM-DDTHH:MM"
}

Zwróć TYLKO JSON array.`;

  try {
    const result = await generateAIResponse(prompt, { jsonMode: true });
    const text = result.content;
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    if (jsonStart === -1) throw new Error("Invalid AI response");
    return JSON.parse(text.slice(jsonStart, jsonEnd));
  } catch {
    // Model zawiódł albo zwrócił coś, czego nie da się sparsować — użytkownik
    // i tak dostaje sensowny plan, a nie pustą listę.
    return planSchedule(event, menuVariants, instructions);
  }
}

export async function saveGeneratedSchedule(eventId: string, items: GeneratedScheduleItem[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.$transaction(async (tx) => {
    await tx.dayScheduleItem.deleteMany({ where: { eventId } });
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await tx.dayScheduleItem.create({
        data: {
          eventId,
          title: item.title,
          description: item.description,
          location: item.location,
          startTime: new Date(item.startTime),
          endTime: item.endTime ? new Date(item.endTime) : null,
          sortOrder: i,
        },
      });
    }
  });

  return { ok: true, count: items.length };
}
