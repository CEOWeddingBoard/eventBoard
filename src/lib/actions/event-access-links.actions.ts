"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/utils";
import { requireOrgId } from "@/lib/auth/active-org";
import { assertModuleEdit } from "@/lib/permissions/guard";

/**
 * Linki decyzyjne dla osób bez konta w systemie.
 *
 * Zamawiający, wedding planner prowadzący przyjęcie w imieniu klienta,
 * podwykonawca — każde z nich dostaje własny link w swojej roli i widzi
 * wyłącznie kroki tej roli. Stary, pojedynczy link klienta
 * (`Event.clientLinkTokenHash`) dalej działa; te linki są obok niego,
 * żeby nie unieważnić niczego, co obiekt już wysłał klientom.
 */

const TTL_DNI = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type LinkDecyzyjny = {
  id: string;
  role: string;
  label: string;
  email: string | null;
  expiresAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  /** Pełny adres wracamy TYLKO przy tworzeniu — potem jest już nie do odtworzenia. */
  url?: string;
};

async function orgIdDlaEventu(eventId: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const organizationId = await requireOrgId(user.id);

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: { id: true },
  });
  if (!event) throw new Error("Nie znaleziono przyjęcia w tej przestrzeni.");
  return organizationId;
}

function naWidok(l: {
  id: string;
  role: string;
  label: string;
  email: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}): LinkDecyzyjny {
  return {
    id: l.id,
    role: l.role,
    label: l.label,
    email: l.email,
    expiresAt: l.expiresAt.toISOString(),
    revokedAt: l.revokedAt?.toISOString() ?? null,
    lastUsedAt: l.lastUsedAt?.toISOString() ?? null,
  };
}

export async function listEventAccessLinks(eventId: string): Promise<LinkDecyzyjny[]> {
  try {
    await orgIdDlaEventu(eventId);
    const linki = await prisma.eventAccessLink.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        label: true,
        email: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
      },
    });
    return linki.map(naWidok);
  } catch {
    return [];
  }
}

export async function createEventAccessLink(
  eventId: string,
  input: { role: string; label: string; email?: string | null; locale?: string },
): Promise<{ ok: boolean; link?: LinkDecyzyjny; error?: string }> {
  await assertModuleEdit("events");

  const role = input.role?.trim();
  const label = input.label?.trim();
  if (!role) return { ok: false, error: "Wskaż rolę, w której ta osoba podejmuje decyzje." };
  if (!label) return { ok: false, error: "Podaj nazwę, po której rozpoznasz ten link." };
  if (label.length > 80) return { ok: false, error: "Nazwa może mieć najwyżej 80 znaków." };

  try {
    await orgIdDlaEventu(eventId);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Brak dostępu." };
  }

  const user = await getCurrentUser();
  // Token wraca do przeglądarki raz. W bazie leży wyłącznie skrót, więc
  // wyciek bazy nie daje wejścia do portalu, a zgubionego linku nie da się
  // odzyskać — wystawia się nowy.
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_DNI * 24 * 60 * 60 * 1000);

  const utworzony = await prisma.eventAccessLink.create({
    data: {
      eventId,
      role,
      label,
      email: input.email?.trim() || null,
      tokenHash: hashToken(token),
      expiresAt,
      createdById: user?.id ?? null,
    },
    select: {
      id: true,
      role: true,
      label: true,
      email: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
    },
  });

  revalidatePath(`/app/events/${eventId}`);
  return {
    ok: true,
    link: { ...naWidok(utworzony), url: `/${input.locale || "pl"}/portal/${token}` },
  };
}

export async function revokeEventAccessLink(
  linkId: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertModuleEdit("events");

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized" };
  const organizationId = await requireOrgId(user.id);

  // Unieważniamy przez `revokedAt`, a nie przez usunięcie wiersza: obiekt ma
  // widzieć, że taki link istniał i kiedy był ostatnio użyty.
  const { count } = await prisma.eventAccessLink.updateMany({
    where: { id: linkId, revokedAt: null, event: { organizationId } },
    data: { revokedAt: new Date() },
  });
  if (count === 0) return { ok: false, error: "Nie znaleziono aktywnego linku." };

  const link = await prisma.eventAccessLink.findUnique({
    where: { id: linkId },
    select: { eventId: true },
  });
  if (link) revalidatePath(`/app/events/${link.eventId}`);
  return { ok: true };
}
