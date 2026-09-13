import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, handleApiError } from "@/lib/api/auth-helper";
import { syncAllToGoogle } from "@/lib/google-calendar-sync";

const scheduleItemSchema = z.object({
  title: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireEventAccess(req, id);
    if (!authResult.allowed) return authResult.response;
    const items = await prisma.dayScheduleItem.findMany({
      where: { eventId: id },
      orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(items);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireEventAccess(req, id);
    if (!authResult.allowed) return authResult.response;
    const body = await req.json();
    const parsed = scheduleItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const item = await prisma.dayScheduleItem.create({
      data: {
        eventId: id,
        title: data.title,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        description: data.description ?? null,
        location: data.location ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    void syncAllToGoogle().catch(() => {});
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
