import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Kolory nadawane kolejnym kalendarzom, żeby grafik był czytelny od razu. */
const KOLORY = ["#0ea5e9", "#f97316", "#8b5cf6", "#10b981", "#ec4899", "#eab308"];

function odczytajState(state: string | null): { orgId: string; locale: string } | null {
  if (!state) return null;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    if (typeof parsed?.orgId !== "string") return null;
    return { orgId: parsed.orgId, locale: typeof parsed.locale === "string" ? parsed.locale : "pl" };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = odczytajState(searchParams.get("state"));
  const locale = state?.locale ?? "pl";
  const wrocDo = (status: string) =>
    NextResponse.redirect(`${req.nextUrl.origin}/${locale}/app/settings/configuration?google=${status}`);

  if (searchParams.get("error") || !searchParams.get("code") || !state) {
    return wrocDo("blad");
  }

  const user = await getCurrentUser();
  if (!user) return wrocDo("sesja");

  // Państwo z `state` nie wystarcza: sprawdzamy, czy wracający użytkownik
  // faktycznie należy do tej przestrzeni. Inaczej podrobiony `state`
  // podpinałby kalendarz do cudzego obiektu.
  const czlonek = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizationId: state.orgId },
    select: { id: true },
  });
  if (!czlonek) return wrocDo("brak-dostepu");

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
    const tokeny = await exchangeCodeForTokens(
      searchParams.get("code")!,
      `${base}/${locale}/api/google/callback`,
    );

    const ile = await prisma.googleCalendarConnection.count({
      where: { organizationId: state.orgId },
    });

    await prisma.googleCalendarConnection.create({
      data: {
        organizationId: state.orgId,
        userId: user.id,
        label: `Kalendarz ${ile + 1}`,
        color: KOLORY[ile % KOLORY.length],
        refreshToken: tokeny.refreshToken,
        accessToken: tokeny.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokeny.expiresIn * 1000),
        calendarId: "primary",
      },
    });

    return wrocDo("polaczono");
  } catch (e) {
    console.error("[google:callback]", e);
    return wrocDo("blad");
  }
}
