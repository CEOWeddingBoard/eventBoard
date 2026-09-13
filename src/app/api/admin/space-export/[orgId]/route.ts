import { NextRequest, NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/actions/admin.actions";
import { buildSpaceExport } from "@/lib/actions/space-export";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Eksport danych jednej przestrzeni (RODO — prawo do przenoszenia).
 *
 * Endpoint leży pod gołym `/api`, więc musi być wpisany w
 * `isLocaleAgnosticPublicRoute` w `src/middleware.ts` — inaczej i18n przepisze
 * go na `/pl/api/...` i zwróci 404. „Public" w nazwie tej listy dotyczy
 * wyłącznie omijania i18n; autoryzację robimy tutaj.
 *
 * Dla nie-adminów zwracamy 404, a nie 403 — tak samo jak panel `/pl/admin`,
 * żeby nie potwierdzać istnienia przestrzeni o zgadywanym identyfikatorze.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  if (!(await isPlatformAdmin())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { orgId } = await params;
  const data = await buildSpaceExport(orgId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const org = data.organization as { slug?: string } | undefined;
  const nazwaPliku = `eventboard-${org?.slug ?? orgId}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nazwaPliku}"`,
      "Cache-Control": "no-store",
    },
  });
}
