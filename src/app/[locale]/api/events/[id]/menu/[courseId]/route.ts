import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, handleApiError } from "@/lib/api/auth-helper";

const COURSE_TYPES = ["APPETIZER", "SOUP", "MAIN", "DESSERT", "CAKE", "DRINKS", "OTHER"] as const;

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  courseType: z.enum(COURSE_TYPES).optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
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
    const course = await prisma.menuCourse.update({
      where: { id: courseId, eventId: id },
      data: parsed.data,
    });
    return NextResponse.json(course);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const { id, courseId } = await params;
    const authResult = await requireEventAccess(_req, id);
    if (!authResult.allowed) return authResult.response;
    await prisma.menuCourse.delete({
      where: { id: courseId, eventId: id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}
