import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, verifyEventAccess, handleApiError } from "@/lib/api/auth-helper";

const bodySchema = z.object({
  guestId: z.string().min(1),
  tableId: z.string().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
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

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { guestId, tableId } = parsed.data;

    const guest = await prisma.guest.findFirst({
      where: { id: guestId, eventId },
    });
    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    if (tableId) {
      const table = await prisma.table.findFirst({
        where: { id: tableId, eventId },
      });
      if (!table) {
        return NextResponse.json({ error: "Table not found" }, { status: 404 });
      }
    }

    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: { tableId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
