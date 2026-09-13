import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; token: string }> }
) {
  try {
    const { token } = await params;
    const agent = await prisma.sharedChatbotAgent.findUnique({
      where: { token },
      select: {
        id: true,
        displayName: true,
        scope: true,
        eventId: true,
        event: { select: { name: true } },
      },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json({
      displayName: agent.displayName || agent.event?.name || "Asystent wesela",
      scope: agent.scope,
    });
  } catch (error) {
    console.error("[agent GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
