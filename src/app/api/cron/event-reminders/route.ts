import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyOrganization } from "@/lib/actions/org-ecosystem.actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { menuDeadlineAt: { gte: now, lte: in3Days } },
        { guestListDeadlineAt: { gte: now, lte: in3Days } },
      ],
    },
    select: {
      id: true,
      name: true,
      menuDeadlineAt: true,
      guestListDeadlineAt: true,
      organizationId: true,
      organization: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  let sent = 0;
  for (const event of events) {
    const menuDaysLeft = event.menuDeadlineAt
      ? Math.ceil((event.menuDeadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const guestDaysLeft = event.guestListDeadlineAt
      ? Math.ceil((event.guestListDeadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (menuDaysLeft !== null && menuDaysLeft >= 0 && menuDaysLeft <= 3) {
      await notifyOrganization(event.organizationId, {
        type: "DEADLINE_REMINDER",
        title: `Termin wyboru menu: ${event.name}`,
        body: `Klient ma ${menuDaysLeft} dni na wybór menu.`,
        link: "/app/events",
      });
      sent++;
    }

    if (guestDaysLeft !== null && guestDaysLeft >= 0 && guestDaysLeft <= 3) {
      await notifyOrganization(event.organizationId, {
        type: "DEADLINE_REMINDER",
        title: `Termin listy gości: ${event.name}`,
        body: `Klient ma ${guestDaysLeft} dni na dostarczenie listy gości.`,
        link: "/app/events",
      });
      sent++;
    }
  }

  return NextResponse.json({ success: true, events: events.length, notifications: sent });
}
