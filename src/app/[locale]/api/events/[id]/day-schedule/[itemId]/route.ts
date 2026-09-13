import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, handleApiError } from "@/lib/api/auth-helper";
import { syncAllToGoogle } from "@/lib/google-calendar-sync";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  startTime: z.string().optional(),
  endTime: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const authResult = await requireEventAccess(req, id);
    if (!authResult.allowed) return authResult.response;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      );
    }
    const data = parsed.data as Record<string, unknown>;
    if (data.startTime) data.startTime = new Date(data.startTime as string);
    if (data.endTime !== undefined)
      data.endTime = data.endTime ? new Date(data.endTime as string) : null;
    const item = await prisma.dayScheduleItem.update({
      where: { id: itemId, eventId: id },
      data,
    });
    void syncAllToGoogle().catch(() => {});
    return NextResponse.json(item);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const authResult = await requireEventAccess(_req, id);
    if (!authResult.allowed) return authResult.response;
    await prisma.dayScheduleItem.delete({
      where: { id: itemId, eventId: id },
    });
    void syncAllToGoogle().catch(() => {});
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}
