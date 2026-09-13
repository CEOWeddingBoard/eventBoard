"use server";

import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword, isPasswordValid } from "@/lib/auth/password";
import { ensureUserAuthColumns } from "@/lib/auth/schema-migration";
import { createSessionToken } from "@/lib/auth/session-token";
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionPayloadFromCookies,
} from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/utils";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/api/rate-limit";
import {
  createPasswordResetToken,
  readSubjectFromResetToken,
  verifyPasswordResetToken,
  PASSWORD_RESET_TTL_SEC,
} from "@/lib/auth/password-reset-token";
import {
  getPasswordResetEmailHtml,
  getPasswordResetEmailText,
} from "@/lib/email/password-reset-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthActionResult = {
  ok: boolean;
  error?: string;
  user?: { id: string; email: string; name: string | null };
};

function publicUser(u: { id: string; email: string; name: string | null }) {
  return { id: u.id, email: u.email, name: u.name };
}

async function startSessionForUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
}) {
  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  await setSessionCookie(token);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || `org-${Date.now().toString(36)}`
  );
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${slugify(base).slice(0, 56)}-${suffix++}`;
  }
  return slug;
}

/**
 * Rejestracja: tworzy konto użytkownika ORAZ organizację (restauracja / firma eventowa).
 * Rejestrujący zostaje właścicielem (OrganizationMember.OWNER).
 * Podkonta tworzy później z panelu organizacji.
 */
export async function registerOrganization(input: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}): Promise<AuthActionResult & { organizationId?: string }> {
  await ensureUserAuthColumns();

  // Samoobsługowa rejestracja organizacji jest zamknięta — przestrzenie
  // zakłada administrator platformy po opłaceniu i podpisaniu umowy
  // (panel /admin). Dopuszczamy wyłącznie zalogowanego admina platformy.
  const current = await getCurrentUser();
  const isAdmin =
    current &&
    (await prisma.user.findUnique({ where: { id: current.id }, select: { role: true } }))?.role === "ADMIN";
  if (!isAdmin) {
    return {
      ok: false,
      error: "Rejestracja jest zamknięta. Napisz do nas — założymy Ci przestrzeń po ustaleniu subskrypcji.",
    };
  }

  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const password = input.password ?? "";
  const organizationName = input.organizationName?.trim();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Podaj poprawny adres e-mail." };
  }
  if (!isPasswordValid(password)) {
    return { ok: false, error: "Hasło musi mieć co najmniej 8 znaków." };
  }
  if (!organizationName) {
    return { ok: false, error: "Podaj nazwę organizacji (np. nazwę restauracji)." };
  }

  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate) {
    return { ok: false, error: "Konto z tym adresem e-mail już istnieje. Zaloguj się." };
  }

  const slug = await uniqueSlug(organizationName).catch(() => `org-${Date.now().toString(36)}`);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: await hashPassword(password),
          name,
          role: "ADMIN",
          isActive: true,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          ownerId: user.id,
        },
      });

      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: user.id, role: "OWNER" },
      });

      return { user, organization };
    });

    await startSessionForUser(created.user);
    revalidatePath("/pl/dashboard");
    revalidatePath("/pl/app");
    return { ok: true, user: publicUser(created.user), organizationId: created.organization.id };
  } catch (error) {
    console.error("[auth:registerOrganization]", error);
    return { ok: false, error: "Nie udało się połączyć z bazą danych. Sprawdź DATABASE_URL." };
  }
}

/** Rejestracja pary młodej — konto konsumenckie BEZ organizacji (tylko Wedding Board). */
export async function registerCoupleAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  await ensureUserAuthColumns();

  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const password = input.password ?? "";

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Podaj poprawny adres e-mail." };
  }
  if (!isPasswordValid(password)) {
    return { ok: false, error: "Hasło musi mieć co najmniej 8 znaków." };
  }

  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate) {
    return { ok: false, error: "Konto z tym adresem e-mail już istnieje. Zaloguj się." };
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        name,
        role: "STAFF",
        isActive: true,
      },
    });

    await startSessionForUser(user);
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    console.error("[auth:registerCoupleAccount]", error);
    return { ok: false, error: "Nie udało się połączyć z bazą danych. Sprawdź DATABASE_URL." };
  }
}

/** Konto testowe bez e-maila — tworzy użytkownika + organizację i loguje od razu. */
/**
 * Wejście do konta demo.
 *
 * Wcześniej każde kliknięcie zakładało nową, pustą organizację — pokaz
 * zaczynał się od pustego kalendarza, a na środowisku zbierały się dziesiątki
 * porzuconych kont. Teraz przycisk wchodzi zawsze w tę samą organizację
 * i odtwarza ją do znanego stanu, więc demo wygląda identycznie za każdym razem.
 */
export async function createTestAccount(): Promise<AuthActionResult & { organizationId?: string }> {
  await ensureUserAuthColumns();

  try {
    const { seedDemoOrganization } = await import("@/lib/demo/demo-seed");
    const { userId, organizationId } = await seedDemoOrganization();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Nie udało się przygotować konta demo." };

    await startSessionForUser(user);
    revalidatePath("/pl/app");
    return { ok: true, user: publicUser(user), organizationId };
  } catch (error) {
    console.error("[auth:createTestAccount]", error);
    return { ok: false, error: "Nie udało się przygotować konta demo." };
  }
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const email = normalizeEmail(input.email);
  const password = input.password ?? "";

  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false, error: "Podaj e-mail i hasło." };
  }

  // Bez limitu formularz logowania jest zaproszeniem do zgadywania haseł.
  // Licznik na IP zatrzymuje jeden adres, licznik na e-mail — atak z wielu adresów.
  const ip = await clientIpForRateLimit();
  for (const key of [`login:ip:${ip}`, `login:email:${email}`]) {
    if (!checkRateLimit({ key, limit: 10, windowMs: 15 * 60_000 }).ok) {
      return { ok: false, error: "Za dużo nieudanych prób. Spróbuj ponownie za kilkanaście minut." };
    }
  }

  try {
    await ensureUserAuthColumns();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return { ok: false, error: "Nieprawidłowy e-mail lub hasło." };
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return { ok: false, error: "Nieprawidłowy e-mail lub hasło." };
    }

    await startSessionForUser(user);
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    console.error("[auth:loginAccount]", error);
    return { ok: false, error: "Nie udało się połączyć z bazą danych. Sprawdź DATABASE_URL." };
  }
}

export async function logoutAccount(): Promise<{ ok: boolean }> {
  await clearSessionCookie();
  return { ok: true };
}

/** Bieżący użytkownik + jego organizacja (dla headerów panelu). */
export async function getCurrentSessionUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
  orgRole: string | null;
} | null> {
  const current = await getCurrentUser();
  if (!current) return null;
  const user = await prisma.user.findUnique({ where: { id: current.id } });
  if (!user || !user.isActive) return null;

  const active = await getActiveMembership(user.id);
  const membership = active
    ? await prisma.organizationMember.findUnique({
        where: { id: active.id },
        include: { organization: { select: { id: true, name: true } } },
      })
    : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: membership?.organization.id ?? null,
    organizationName: membership?.organization.name ?? null,
    orgRole: membership?.role ?? null,
  };
}

// ── Organizacja bieżącego użytkownika ───────────────────────────────────

export async function getUserOrganization(): Promise<{
  id: string;
  name: string;
  slug: string;
  plan: string;
} | null> {
  const current = await getCurrentUser();
  if (!current) return null;

  const active = await getActiveMembership(current.id);
  if (!active) return null;
  const membership = await prisma.organizationMember.findUnique({
    where: { id: active.id },
    include: { organization: true },
  });
  return membership?.organization ?? null;
}

async function canManageMembers(): Promise<boolean> {
  const session = await getSessionPayloadFromCookies();
  if (!session) return false;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.isActive) return false;
  if (user.role === "ADMIN") return true;

  const membership = await getActiveMembership(user.id);
  return !!membership && (membership.role === "OWNER" || membership.role === "MANAGER");
}

// ── Podkonta (panel organizacji) ────────────────────────────────────────

export type OrganizationMemberItem = {
  id: string; // member id
  userId: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

export async function listOrganizationMembers(): Promise<OrganizationMemberItem[]> {
  if (!(await canManageMembers())) {
    throw new Error("Brak uprawnień do zarządzania kontami.");
  }
  const organization = await getUserOrganization();
  if (!organization) return [];

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.user.id,
    email: m.user.email,
    name: m.user.name,
    role: m.role,
    isActive: m.user.isActive,
    createdAt: m.user.createdAt,
  }));
}

export async function createOrganizationMember(input: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<AuthActionResult> {
  if (!(await canManageMembers())) {
    return { ok: false, error: "Brak uprawnień do zarządzania kontami." };
  }
  await ensureUserAuthColumns();

  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const password = input.password ?? "";
  const role = ["OWNER", "MANAGER", "STAFF", "VIEWER"].includes(input.role) ? input.role : "STAFF";

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Podaj poprawny adres e-mail." };
  }
  if (!isPasswordValid(password)) {
    return { ok: false, error: "Hasło musi mieć co najmniej 8 znaków." };
  }

  const duplicate = await prisma.user.findUnique({ where: { email } });
  if (duplicate) {
    return { ok: false, error: "Konto z tym adresem e-mail już istnieje." };
  }

  const organization = await getUserOrganization();
  if (!organization) {
    return { ok: false, error: "Brak organizacji." };
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      name,
      role: "STAFF",
      isActive: true,
    },
  });

  await prisma.organizationMember.create({
    data: { organizationId: organization.id, userId: user.id, role },
  });

  revalidatePath("/pl/dashboard/admin");
  return { ok: true, user: publicUser(user) };
}

export async function updateOrganizationMember(
  memberId: string,
  input: { role?: string; isActive?: boolean },
): Promise<AuthActionResult> {
  if (!(await canManageMembers())) {
    return { ok: false, error: "Brak uprawnień do zarządzania kontami." };
  }
  const organization = await getUserOrganization();
  if (!organization) return { ok: false, error: "Brak organizacji." };

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: organization.id },
  });
  if (!member) return { ok: false, error: "Nie znaleziono podkonta." };

  if (input.role !== undefined) {
    const role = ["OWNER", "MANAGER", "STAFF", "VIEWER"].includes(input.role) ? input.role : "STAFF";
    await prisma.organizationMember.update({ where: { id: memberId }, data: { role } });
  }

  if (input.isActive !== undefined) {
    await prisma.user.update({
      where: { id: member.userId },
      data: { isActive: input.isActive },
    });
  }

  revalidatePath("/pl/dashboard/admin");
  return { ok: true };
}

export async function resetMemberPassword(
  memberId: string,
  newPassword: string,
): Promise<AuthActionResult> {
  if (!(await canManageMembers())) {
    return { ok: false, error: "Brak uprawnień do zarządzania kontami." };
  }
  if (!isPasswordValid(newPassword)) {
    return { ok: false, error: "Hasło musi mieć co najmniej 8 znaków." };
  }
  const organization = await getUserOrganization();
  if (!organization) return { ok: false, error: "Brak organizacji." };

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: organization.id },
  });
  if (!member) return { ok: false, error: "Nie znaleziono podkonta." };

  await prisma.user.update({
    where: { id: member.userId },
    data: { password: await hashPassword(newPassword) },
  });
  return { ok: true };
}

/**
 * Zmiana własnego hasła przez zalogowanego użytkownika.
 * Wymaga podania obecnego hasła (weryfikacja) i nowego (min. 8 znaków).
 */
export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthActionResult> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, error: "Musisz być zalogowany." };
  if (!isPasswordValid(input.newPassword)) {
    return { ok: false, error: "Nowe hasło musi mieć co najmniej 8 znaków." };
  }
  try {
    await ensureUserAuthColumns();
    const user = await prisma.user.findUnique({ where: { id: current.id } });
    if (!user || !user.isActive) return { ok: false, error: "Nie znaleziono konta." };

    const valid = await verifyPassword(input.currentPassword ?? "", user.password);
    if (!valid) return { ok: false, error: "Obecne hasło jest nieprawidłowe." };

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(input.newPassword) },
    });
    return { ok: true };
  } catch (error) {
    console.error("[auth:changeOwnPassword]", error);
    return { ok: false, error: "Nie udało się zmienić hasła." };
  }
}

// ── Samodzielny reset hasła ─────────────────────────────────────────────

/** IP klienta dla limitów prób — server action nie dostaje Request. */
async function clientIpForRateLimit(): Promise<string> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    const first = xff?.split(",")[0]?.trim();
    if (first) return first;
    return h.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Wysyła link do zmiany hasła.
 *
 * Odpowiedź jest zawsze taka sama — inaczej formularz stałby się wyszukiwarką
 * kont istniejących w systemie.
 */
export async function requestPasswordReset(input: {
  email: string;
  locale?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = normalizeEmail(input.email ?? "");
  const locale = input.locale === "en" ? "en" : "pl";
  const generic = { ok: true as const };

  if (!EMAIL_RE.test(email)) return { ok: false, error: "Podaj poprawny adres e-mail." };

  const ip = await clientIpForRateLimit();
  for (const key of [`pwreset:ip:${ip}`, `pwreset:email:${email}`]) {
    if (!checkRateLimit({ key, limit: 5, windowMs: 15 * 60_000 }).ok) {
      return { ok: false, error: "Za dużo prób. Spróbuj ponownie za kilkanaście minut." };
    }
  }

  try {
    await ensureUserAuthColumns();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return generic;

    const token = await createPasswordResetToken(user);
    const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${base}/${locale}/auth/reset/${token}`;
    const expiresInMinutes = Math.round(PASSWORD_RESET_TTL_SEC / 60);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[auth:requestPasswordReset] Brak RESEND_API_KEY — link:", resetUrl);
      return generic;
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "EventBoard <onboarding@resend.dev>",
      to: user.email,
      subject: "Ustaw nowe hasło — EventBoard",
      html: getPasswordResetEmailHtml({ resetUrl, expiresInMinutes }),
      text: getPasswordResetEmailText({ resetUrl, expiresInMinutes }),
    });
    return generic;
  } catch (error) {
    console.error("[auth:requestPasswordReset]", error);
    // Też nie zdradzamy, czy konto istnieje.
    return generic;
  }
}

/** Czy token nadal można wykorzystać (do wyświetlenia formularza). */
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const sub = readSubjectFromResetToken(token);
  if (!sub) return false;
  try {
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user || !user.isActive) return false;
    return !!(await verifyPasswordResetToken(token, user.password));
  } catch {
    return false;
  }
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
}): Promise<AuthActionResult> {
  if (!isPasswordValid(input.newPassword ?? "")) {
    return { ok: false, error: "Hasło musi mieć co najmniej 8 znaków." };
  }

  const ip = await clientIpForRateLimit();
  if (!checkRateLimit({ key: `pwreset-confirm:ip:${ip}`, limit: 10, windowMs: 15 * 60_000 }).ok) {
    return { ok: false, error: "Za dużo prób. Spróbuj ponownie za kilkanaście minut." };
  }

  const sub = readSubjectFromResetToken(input.token ?? "");
  if (!sub) return { ok: false, error: "Link jest nieprawidłowy lub wygasł." };

  try {
    await ensureUserAuthColumns();
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user || !user.isActive) return { ok: false, error: "Link jest nieprawidłowy lub wygasł." };

    const payload = await verifyPasswordResetToken(input.token, user.password);
    if (!payload) return { ok: false, error: "Link jest nieprawidłowy lub wygasł." };

    // Zmiana skrótu hasła unieważnia ten i każdy inny wydany wcześniej token.
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(input.newPassword) },
    });
    return { ok: true, user: publicUser(user) };
  } catch (error) {
    console.error("[auth:resetPasswordWithToken]", error);
    return { ok: false, error: "Nie udało się zmienić hasła." };
  }
}
