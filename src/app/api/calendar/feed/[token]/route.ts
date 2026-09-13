import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildIcsCalendar, eventToIcsEvents } from "@/lib/calendar";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { calendarFeedToken: token.trim() },
    include: {
      tasks: { orderBy: { createdAt: "desc" } },
      dayScheduleItems: { orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }] },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = eventToIcsEvents(event);
  const ics = buildIcsCalendar(events);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
