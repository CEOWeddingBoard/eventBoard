import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, handleApiError } from "@/lib/api/auth-helper";

const COURSE_TYPES = ["APPETIZER", "SOUP", "MAIN", "DESSERT", "CAKE", "DRINKS", "OTHER"] as const;

const courseSchema = z.object({
  name: z.string().min(1),
  courseType: z.enum(COURSE_TYPES),
  description: z.string().optional().nullable(),
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
    const courses = await prisma.menuCourse.findMany({
      where: { eventId: id },
      orderBy: [{ sortOrder: "asc" }, { courseType: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(courses);
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
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      );
    }
    const course = await prisma.menuCourse.create({
      data: {
        eventId: id,
        name: parsed.data.name,
        courseType: parsed.data.courseType,
        description: parsed.data.description ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
