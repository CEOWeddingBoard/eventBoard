import { NextRequest, NextResponse } from "next/server";
import { getDailyAdminCode, logDailyAdminCode } from "@/lib/auth/admin-access-code";
import { isValidCronSecret } from "@/lib/api/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron: raz na dobę wypisuje dzisiejszy kod dostępu admina do logów aplikacji.
 * Zabezpieczony CRON_SECRET (jak pozostałe crony). Zaplanuj codziennie.
 */
export async function GET(req: NextRequest) {
  if (!isValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  logDailyAdminCode("cron");
  // W odpowiedzi nie zwracamy samego kodu — jest tylko w logach.
  return NextResponse.json({ ok: true, hasCode: !!getDailyAdminCode() });
}
