import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";
import {
  getOAuthAuthorizeUrl,
  isGoogleCalendarConfigured,
  type GoogleAccessMode,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Start autoryzacji Google Calendar.
 *
 * `state` niesie ID przestrzeni, bo połączenie należy do niej, a nie do osoby,
 * która akurat klika — kalendarz sali ma działać także wtedy, gdy podłączający
 * manager odejdzie z pracy. Callback sprawdza, czy wracający użytkownik nadal
 * ma dostęp do tej przestrzeni.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: "Brak aktywnej przestrzeni" }, { status: 403 });

  const locale = req.nextUrl.searchParams.get("locale") ?? "pl";

  // Ta trasa jest celem KLIKNIĘCIA, nie wywołaniem z JavaScriptu — surowy JSON
  // z błędem lądował więc użytkownikowi na całym ekranie. Wracamy tam, skąd
  // przyszedł, z informacją do pokazania w interfejsie.
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(
      new URL(`/${locale}/app/settings/configuration?google=nieskonfigurowany`, req.nextUrl.origin),
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
  const redirectUri = `${base}/${locale}/api/google/callback`;

  // Poziom dostępu wybiera człowiek w kreatorze; decyduje o zakresie, o jaki
  // prosimy Google, więc musi przejechać przez `state` i wrócić w callbacku.
  const zadany = req.nextUrl.searchParams.get("mode");
  const mode: GoogleAccessMode =
    zadany === "READ" || zadany === "WRITE" || zadany === "FULL" ? zadany : "FULL";

  const state = Buffer.from(JSON.stringify({ orgId, locale, mode })).toString("base64url");
  return NextResponse.redirect(getOAuthAuthorizeUrl(redirectUri, state, mode));
}
