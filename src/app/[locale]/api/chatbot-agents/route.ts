import { NextRequest, NextResponse } from "next/server";
import { getUrlUserEvent } from "@/lib/actions/event.actions";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";

const createBodySchema = z.object({
  scope: z.enum(["GUEST", "COUPLE", "VENDOR"]),
  vendorId: z.string().optional(),
  displayName: z.string().max(120).optional(),
});

export async function GET() {
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
    const [agents, vendors] = await Promise.all([
      prisma.sharedChatbotAgent.findMany({
        where: { eventId: event.id },
        include: {
          vendor: { select: { id: true, name: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.findMany({
        where: { eventId: event.id },
        select: { id: true, name: true, category: true, vendorDaySchedule: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({
      agents,
      vendors,
      guestPortal: {
        publicSlug: event.publicSlug,
        guestPortalEnabled: event.guestPortalEnabled,
      },
    });
  } catch (error) {
    console.error("[chatbot-agents GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { scope, vendorId, displayName } = parsed.data;
    if (scope === "VENDOR" && !vendorId) {
      return NextResponse.json(
        { error: "vendorId required when scope is VENDOR" },
        { status: 400 }
      );
    }
    if (scope === "VENDOR" && vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: { id: vendorId, eventId: event.id },
      });
      if (!vendor) {
        return NextResponse.json(
          { error: "Vendor not found or not in this event" },
          { status: 404 }
        );
      }
    }
    const token = randomBytes(24).toString("base64url");
    const agent = await prisma.sharedChatbotAgent.create({
      data: {
        eventId: event.id,
        scope,
        vendorId: scope === "VENDOR" ? vendorId : null,
        token,
        displayName: displayName?.trim() || null,
      },
      include: {
        vendor: { select: { id: true, name: true, category: true } },
      },
    });
    return NextResponse.json({ agent });
  } catch (error) {
    console.error("[chatbot-agents POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
