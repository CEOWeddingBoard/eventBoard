import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRsvpReminder, sendMilestoneNotification } from "@/lib/notifications/notification-service";

const MILESTONES = [
  { label: "12 miesięcy do ślubu", months: 12 },
  { label: "9 miesięcy do ślubu", months: 9 },
  { label: "6 miesięcy do ślubu", months: 6 },
  { label: "3 miesiące do ślubu", months: 3 },
  { label: "1 miesiąc do ślubu", months: 1 },
  { label: "2 tygodnie do ślubu", days: 14 },
  { label: "1 tydzień do ślubu", days: 7 },
];

interface CronSummary {
  eventsChecked: number;
  rsvpRemindersSent: number;
  milestoneEmailsSent: number;
  overdueTasksFound: number;
  errors: string[];
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const secret = req.nextUrl.searchParams.get("secret");

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary: CronSummary = {
    eventsChecked: 0,
    rsvpRemindersSent: 0,
    milestoneEmailsSent: 0,
    overdueTasksFound: 0,
    errors: [],
  };

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const futureEvents = await prisma.event.findMany({
      where: {
        date: { gte: now },
      },
      select: {
        id: true,
        name: true,
        date: true,
        partnerEmail: true,
        brideName: true,
        groomName: true,
        guests: {
          where: {
            status: { in: ["PENDING", "INVITED"] },
            email: { not: null },
          },
          select: { id: true, name: true, email: true, status: true },
        },
        tasks: {
          where: {
            status: { notIn: ["DONE", "SKIPPED"] },
            dueDate: { lte: now },
          },
          select: { id: true, title: true, dueDate: true },
        },
      },
    });

    summary.eventsChecked = futureEvents.length;

    for (const event of futureEvents) {
      if (!event.partnerEmail) continue;

      // 1. Check for RSVP reminders (7-day and 3-day windows before wedding)
      const daysLeft = Math.ceil(
        (event.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft === 7 || daysLeft === 3) {
        for (const guest of event.guests) {
          if (!guest.email) continue;
          try {
            await sendRsvpReminder(event.id, guest.id);
            summary.rsvpRemindersSent++;
          } catch (err) {
            summary.errors.push(
              `RSVP reminder failed for guest ${guest.id}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      }

      // 2. Check for milestone notifications
      for (const milestone of MILESTONES) {
        const targetDate = new Date(event.date);
        if (milestone.months) {
          targetDate.setMonth(targetDate.getMonth() - milestone.months);
        } else if (milestone.days) {
          targetDate.setDate(targetDate.getDate() - milestone.days);
        }

        const diffDays = Math.abs(
          Math.ceil((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        if (diffDays <= 1) {
          try {
            await sendMilestoneNotification(event.id, milestone.label);
            summary.milestoneEmailsSent++;
          } catch (err) {
            summary.errors.push(
              `Milestone notification failed for event ${event.id}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
          break;
        }
      }

      // 3. Count overdue tasks
      summary.overdueTasksFound += event.tasks.length;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary,
    });
  } catch (error) {
    console.error("[cron:wedding-notifications] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        summary,
      },
      { status: 500 }
    );
  }
}
