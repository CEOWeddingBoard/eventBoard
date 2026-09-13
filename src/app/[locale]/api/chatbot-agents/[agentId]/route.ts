import { NextResponse } from "next/server";
import { getUrlUserEvent } from "@/lib/actions/event.actions";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ locale: string; agentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const event = await getUrlUserEvent();
    if (!event) {
      return NextResponse.json(
        { error: "No wedding event found" },
        { status: 404 }
      );
    }
    const { agentId } = await params;
    const agent = await prisma.sharedChatbotAgent.findFirst({
      where: { id: agentId, eventId: event.id },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    await prisma.sharedChatbotAgent.delete({ where: { id: agentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[chatbot-agents DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
