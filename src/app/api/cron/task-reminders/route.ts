import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTaskReminderSms } from "@/lib/notifications";

/**
 * Endpoint do wywołania przez crona (np. Railway Cron, cron-job.org).
 * Wysyła SMS z przypomnieniami o zadaniach (dziś / ten tydzień).
 * Wymaga: CRON_SECRET w zmiennych środowiskowych.
 *
 * Przykład: GET /api/cron/task-reminders?type=daily&secret=YOUR_CRON_SECRET
 * type = daily | weekly
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const type = req.nextUrl.searchParams.get("type") as "daily" | "weekly" | null;

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (type !== "daily" && type !== "weekly") {
    return NextResponse.json(
      { error: "Query param type must be 'daily' or 'weekly'" },
      { status: 400 }
    );
  }

  const events = await prisma.event.findMany({
    where: {
      notificationPhone: { not: null },
      ...(type === "daily"
        ? { notificationDailyEnabled: true }
        : { notificationWeeklyEnabled: true }),
    },
    select: { id: true },
  });

  const results: { eventId: string; ok: boolean; message?: string }[] = [];
  for (const event of events) {
    const result = await sendTaskReminderSms(event.id, type);
    results.push({
      eventId: event.id,
      ok: result.ok && (result.sent ?? false),
      message: result.message,
    });
  }

  return NextResponse.json({
    type,
    processed: results.length,
    results,
  });
}
