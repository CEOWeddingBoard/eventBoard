"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";

export type WidgetType = "RUNSHEET" | "NOTE" | "CHECKLIST" | "STAT" | "LINK" | "CUSTOM_FORM";

export type EventWidgetData = {
  id: string;
  widgetType: WidgetType;
  title: string;
  sortOrder: number;
  configJson: string;
  dataJson: string;
  isVisible: boolean;
};

export async function getEventWidgets(eventId: string): Promise<EventWidgetData[]> {
  return prisma.eventWidget.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, widgetType: true, title: true, sortOrder: true, configJson: true, dataJson: true, isVisible: true },
  }) as Promise<EventWidgetData[]>;
}

export async function createEventWidget(
  eventId: string,
  widgetType: WidgetType,
  title: string,
  configJson?: string
): Promise<EventWidgetData> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const count = await prisma.eventWidget.count({ where: { eventId } });

  return prisma.eventWidget.create({
    data: { eventId, widgetType, title, sortOrder: count, configJson: configJson ?? '{"visibleInPortal":false}' },
    select: { id: true, widgetType: true, title: true, sortOrder: true, configJson: true, dataJson: true, isVisible: true },
  }) as Promise<EventWidgetData>;
}

export async function updateEventWidgetData(
  widgetId: string,
  dataJson: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.eventWidget.update({ where: { id: widgetId }, data: { dataJson, updatedAt: new Date() } });
}

export async function updateEventWidgetConfig(
  widgetId: string,
  title: string,
  configJson: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.eventWidget.update({ where: { id: widgetId }, data: { title, configJson } });
}

export async function reorderEventWidgets(
  eventId: string,
  orderedIds: string[]
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await Promise.all(
    orderedIds.map((id, i) =>
      prisma.eventWidget.update({ where: { id }, data: { sortOrder: i } })
    )
  );
  revalidatePath(`/app/events/${eventId}`);
}

export async function deleteEventWidget(widgetId: string, eventId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await prisma.eventWidget.delete({ where: { id: widgetId } });
  revalidatePath(`/app/events/${eventId}`);
}
