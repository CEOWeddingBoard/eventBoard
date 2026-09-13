import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { buildIcsCalendar, eventToIcsEvents } from "@/lib/calendar";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await prisma.event.findFirst({
    where: { userId: user.id },
    include: {
      tasks: { orderBy: { createdAt: "desc" } },
      dayScheduleItems: { orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "No event found" }, { status: 404 });
  }

  const events = eventToIcsEvents(event);
  const ics = buildIcsCalendar(events);
  const filename = `wesele-${event.name.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40)}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
