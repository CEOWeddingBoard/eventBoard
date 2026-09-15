import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { effectiveLimits } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Kolory nadawane kolejnym kalendarzom, żeby grafik był czytelny od razu. */
const KOLORY = ["#0ea5e9", "#f97316", "#8b5cf6", "#10b981", "#ec4899", "#eab308"];

function odczytajState(
  state: string | null,
): { orgId: string; locale: string; mode: string } | null {
  if (!state) return null;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    if (typeof parsed?.orgId !== "string") return null;
    const mode =
      parsed?.mode === "READ" || parsed?.mode === "WRITE" || parsed?.mode === "FULL"
        ? parsed.mode
        : "FULL";
    return {
      orgId: parsed.orgId,
      locale: typeof parsed.locale === "string" ? parsed.locale : "pl",
      mode,
    };
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

    // Limit kalendarzy zależy od pakietu (START 5, PRO 10, ENTERPRISE bez
    // limitu), z możliwością ręcznego nadpisania per przestrzeń.
    const org = await prisma.organization.findUnique({
      where: { id: state.orgId },
      select: { plan: true, maxGoogleCalendars: true },
    });
    const ile = await prisma.googleCalendarConnection.count({
      where: { organizationId: state.orgId },
    });
    const limit = effectiveLimits(org?.plan, {
      maxGoogleCalendars: org?.maxGoogleCalendars ?? null,
    }).maxGoogleCalendars;
    if (limit != null && ile >= limit) return wrocDo("limit");

    // Adres konta Google bierzemy z kalendarza podstawowego — jego `id` to
    // właśnie ten adres. Dzięki temu dziennik mówi, NA JAKIM koncie coś się
    // wydarzyło, a nie tylko kto kliknął w EventBoardzie. Nie prosimy o osobny
    // zakres do danych profilowych, bo ten wystarcza.
    let kontoGoogle: string | null = null;
    try {
      const odp = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary",
        { headers: { Authorization: `Bearer ${tokeny.accessToken}` } },
      );
      if (odp.ok) {
        const dane = (await odp.json()) as { id?: string };
        kontoGoogle = typeof dane.id === "string" ? dane.id : null;
      }
    } catch {
      // Brak adresu nie jest powodem, by odrzucić połączenie — dziennik
      // pokaże wtedy samą nazwę kalendarza.
    }

    const polaczenie = await prisma.googleCalendarConnection.create({
      data: {
        organizationId: state.orgId,
        userId: user.id,
        label: kontoGoogle ? `Kalendarz ${kontoGoogle}` : `Kalendarz ${ile + 1}`,
        color: KOLORY[ile % KOLORY.length],
        refreshToken: tokeny.refreshToken,
        accessToken: tokeny.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokeny.expiresIn * 1000),
        calendarId: "primary",
        accessMode: state.mode,
        googleAccountEmail: kontoGoogle,
      },
    });

    await prisma.googleCalendarAuditLog.create({
      data: {
        organizationId: state.orgId,
        connectionId: polaczenie.id,
        connectionLabel: polaczenie.label,
        googleAccountEmail: kontoGoogle,
        action: "CONNECT",
        subject: `Poziom dostępu: ${state.mode}`,
        actorUserId: user.id,
        actorEmail: user.email ?? null,
      },
    });

    return wrocDo("polaczono");
  } catch (e) {
    console.error("[google:callback]", e);
    return wrocDo("blad");
  }
}
