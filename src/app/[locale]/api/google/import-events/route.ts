import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const clerkUserId = currentUser?.id ?? null;
    if (!clerkUserId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const body = await req.json();
    const events = body.events as Array<{
      googleEventId: string;
      summary: string;
      description?: string;
      location?: string;
      startDate: string;
      endDate: string;
      isAllDay: boolean;
    }>;

    if (!events || events.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    let importedCount = 0;
    for (const ev of events) {
      const existing = await prisma.event.findFirst({
        where: { googleCalendarEventId: ev.googleEventId },
      });
      if (existing) continue;

      await prisma.event.create({
        data: {
          name: ev.summary,
          date: new Date(ev.startDate),
          userId: user.id,
          eventType: "OTHER",
          googleCalendarEventId: ev.googleEventId,
          description: ev.description ?? null,
          ceremonyLocationName: ev.location ?? null,
        },
      });
      importedCount++;
    }

    return NextResponse.json({ ok: true, count: importedCount });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
