"use server";

import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

export async function getTasksDueToday(eventId: string): Promise<{ id: string; title: string }[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      eventId,
      dueDate: { gte: start, lte: end },
      status: { not: "DONE" },
    },
    orderBy: { dueDate: "asc" },
    select: { id: true, title: true },
  });
  return tasks;
}

export async function getTasksDueNextSevenDays(eventId: string): Promise<{ id: string; title: string; dueDate: Date }[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      eventId,
      dueDate: { gte: start, lte: end },
      status: { not: "DONE" },
    },
    orderBy: { dueDate: "asc" },
    select: { id: true, title: true, dueDate: true },
  });
  return tasks.filter(
    (t): t is { id: string; title: string; dueDate: Date } => t.dueDate !== null,
  );
}

function formatTasksForSms(tasks: { title: string }[], prefix: string): string {
  if (tasks.length === 0) return `${prefix} Brak zadań.`;
  const list = tasks.slice(0, 8).map((t) => `• ${t.title}`).join("\n");
  const more = tasks.length > 8 ? `\n… i ${tasks.length - 8} więcej` : "";
  return `${prefix}\n\n${list}${more}`;
}

export async function sendTaskReminderSms(
  eventId: string,
  kind: "daily" | "weekly"
): Promise<{ ok: boolean; message?: string; sent?: boolean }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      name: true,
      notificationPhone: true,
      notificationDailyEnabled: true,
      notificationWeeklyEnabled: true,
    },
  });

  if (!event?.notificationPhone?.trim()) {
    return { ok: false, message: "Nie ustawiono numeru do powiadomień." };
  }

  const phone = event.notificationPhone.trim();
  if (kind === "daily" && !event.notificationDailyEnabled) {
    return { ok: false, message: "Powiadomienia dzienne są wyłączone." };
  }
  if (kind === "weekly" && !event.notificationWeeklyEnabled) {
    return { ok: false, message: "Powiadomienia tygodniowe są wyłączone." };
  }

  const tasksToday = await getTasksDueToday(eventId);
  const tasksWeek = await getTasksDueNextSevenDays(eventId);

  const eventName = event.name || "Wesele";
  let body: string;
  if (kind === "daily") {
    body = formatTasksForSms(
      tasksToday,
      `[${eventName}] Zadania na dziś:`
    );
  } else {
    body = formatTasksForSms(
      tasksWeek.map((t) => ({ title: `${t.title} (${new Date(t.dueDate).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })})` })),
      `[${eventName}] Zadania w tym tygodniu:`
    );
  }

  const { ok } = await sendSms(phone, body);
  return { ok, sent: ok };
}
