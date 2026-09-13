import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ensureUserAuthColumns } from "@/lib/auth/schema-migration";
import { isValidAdminSecret } from "@/lib/auth/admin-access-code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_PASSWORD = "admin123";

/**
 * Jednorazowe założenie / reset konta administratora platformy (role=ADMIN).
 * Sekret to albo pełny CRON_SECRET, albo dzienny kod dostępu z logów aplikacji
 * (patrz lib/auth/admin-access-code). Bez ważnego sekretu zwracamy 404, żeby
 * endpoint był niewykrywalny.
 *
 * Użycie (w przeglądarce):
 *   /api/admin/bootstrap?secret=<dzienny-kod-z-logu>&email=adam.postawka@icloud.com
 * Opcjonalnie &password=... (domyślnie "admin123" — zmień po pierwszym logowaniu).
 */
async function handle(req: NextRequest) {
  const provided = req.nextUrl.searchParams.get("secret");
  if (!isValidAdminSecret(provided)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = (req.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  const password = req.nextUrl.searchParams.get("password") ?? DEFAULT_PASSWORD;
  const name = req.nextUrl.searchParams.get("name") ?? null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Podaj poprawny email w ?email=" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Hasło musi mieć min. 8 znaków." }, { status: 400 });
  }

  try {
    await ensureUserAuthColumns();
    const hash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: "ADMIN", isActive: true, password: hash, ...(name ? { name } : {}) },
      create: { email, password: hash, role: "ADMIN", isActive: true, name },
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({
      ok: true,
      user,
      message:
        "Konto administratora gotowe. Zaloguj się na /pl/auth, wejdź na /pl/admin i zmień hasło w karcie „Twoje konto”.",
      defaultPassword: req.nextUrl.searchParams.get("password") ? undefined : DEFAULT_PASSWORD,
    });
  } catch (error) {
    console.error("[api:admin:bootstrap]", error);
    return NextResponse.json({ ok: false, error: "Błąd zapisu do bazy." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
