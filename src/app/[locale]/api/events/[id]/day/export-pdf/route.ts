import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, verifyEventAccess, handleApiError } from "@/lib/api/auth-helper";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    let userId: string | null = null;
    try {
      const user = await requireAuth(req);
      userId = user.id;
    } catch {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    if (userId && !(await verifyEventAccess(userId, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!userId && process.env.NODE_ENV === "development") {
      const event = await prisma.event.findFirst({ where: { id: eventId } });
      if (!event) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const type = req.nextUrl.searchParams.get("type") ?? "both";
    const onlySchedule = type === "schedule";
    const onlyMenu = type === "menu";

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true, date: true },
    });
    const schedule = await prisma.dayScheduleItem.findMany({
      where: { eventId },
      orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
    });
    const menuVariants = await prisma.menuVariant.findMany({
      where: { eventId },
      include: { courses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    const menu = menuVariants.flatMap((v) =>
      v.courses.map((c) => ({ name: c.name, courseType: c.courseType, description: c.description }))
    );

    const { buildDayExportPdf } = await import("@/lib/pdf/day-export-pdf");

    const buffer = await buildDayExportPdf({
      eventName: event?.name ?? null,
      eventDate: event?.date ?? null,
      schedule: schedule.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        title: s.title,
        description: s.description,
        location: s.location,
      })),
      menu,
      onlySchedule,
      onlyMenu,
    });

    const filename = onlySchedule
      ? `harmonogram-dnia-${eventId.slice(0, 8)}.pdf`
      : onlyMenu
        ? `menu-weselne-${eventId.slice(0, 8)}.pdf`
        : `organizacja-dnia-${eventId.slice(0, 8)}.pdf`;

    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
