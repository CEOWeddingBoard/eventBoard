import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  requireAuth,
  verifyEventAccessOrPartner,
  handleApiError,
} from "@/lib/api/auth-helper";
import { ACTIVE_EVENT_COOKIE } from "@/lib/active-event";

const bodySchema = z.object({ eventId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;
    try {
      const user = await requireAuth(req);
      userId = user.id;
    } catch {
      /* partner session */
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    const allowed = await verifyEventAccessOrPartner(
      userId,
      parsed.data.eventId,
      req,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const store = await cookies();
    store.set(ACTIVE_EVENT_COOKIE, parsed.data.eventId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ ok: true, eventId: parsed.data.eventId });
  } catch (error) {
    return handleApiError(error);
  }
}
