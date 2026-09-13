import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { getCurrentUser } from "@/lib/auth/utils";
import { renderEventDocumentHtml } from "@/lib/documents/render-event-document";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const templateId = req.nextUrl.searchParams.get("templateId");
    if (!templateId) return new NextResponse("Brak szablonu", { status: 400 });

    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const membership = await getActiveMembership(user.id);
    if (!membership) return new NextResponse("Forbidden", { status: 403 });

    const event = await prisma.event.findFirst({
      where: { id, organizationId: membership.organizationId },
      select: { id: true },
    });
    if (!event) return new NextResponse("Not found", { status: 404 });

    const html = await renderEventDocumentHtml(id, templateId);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[document render]", error);
    return new NextResponse("Nie udało się wygenerować dokumentu", { status: 500 });
  }
}
