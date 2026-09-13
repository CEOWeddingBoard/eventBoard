import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { trialEndsAtFromCreatedAt } from "@/lib/trial";
import { getUserBillingMetadata, updateUserBillingMetadata } from "@/lib/user-metadata";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const createdAt = dbUser?.createdAt ? dbUser.createdAt.getTime() : Date.now();
    const trialEndsAt = trialEndsAtFromCreatedAt(createdAt);
    const existing = await getUserBillingMetadata(user.id);
    await updateUserBillingMetadata(user.id, {
      termsAcceptedAt: new Date().toISOString(),
      trialEndsAt: existing.trialEndsAt ?? trialEndsAt,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("accept-terms:", e);
    return NextResponse.json(
      { error: "Failed to save acceptance" },
      { status: 500 }
    );
  }
}
