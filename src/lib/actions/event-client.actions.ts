"use server";

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { ensureAgendaEventColumns } from "@/lib/agenda/agenda-schema-migration";

const LINK_TTL_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(18).toString("base64url");
}

export type ClientLinkResult = {
  ok: boolean;
  error?: string;
  url?: string;
  expiresAt?: string;
};

async function canManageEvent(eventId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const organizationId = await getActiveOrgId(user.id);
  if (!organizationId) return false;

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: organizationId },
    select: { id: true },
  });
  return !!event;
}

/** Generuje (lub przedłuża) link decyzyjny dla klienta eventu. */
export async function generateEventClientLink(eventId: string, locale = "pl"): Promise<ClientLinkResult> {
  if (!(await canManageEvent(eventId))) {
    return { ok: false, error: "Brak uprawnień do tego eventu." };
  }
  await ensureAgendaEventColumns();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.event.update({
    where: { id: eventId },
    data: {
      clientLinkTokenHash: hashToken(token),
      clientLinkExpiresAt: expiresAt,
      clientReviewedAt: null,
      clientFeedback: null,
      clientWorkflowStatus: "MENU_SENT",
      clientMenuSelectionJson: null,
      clientNextStepTitle: null,
      clientNextStepMessage: null,
      clientNextStepSentAt: null,
    },
  });

  revalidatePath("/pl/app");
  return {
    ok: true,
    url: `/${locale}/portal/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function revokeEventClientLink(eventId: string): Promise<ClientLinkResult> {
  if (!(await canManageEvent(eventId))) {
    return { ok: false, error: "Brak uprawnień do tego eventu." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { clientLinkTokenHash: null, clientLinkExpiresAt: null },
  });

  revalidatePath("/pl/app");
  return { ok: true };
}

// ── Portal klienta (publiczny, przez token) ─────────────────────────────

export type EventClientPortalData = {
  eventName: string;
  eventDate: string;
  location: string | null;
  organizerName: string | null;
  guestCount: number | null;
  isWedding: boolean;
  clientReviewedAt: string | null;
  clientFeedback: string | null;
  workflowStatus: string;
  menuSelection: Array<{ variantId: string; guests: number }>;
  nextStep: { title: string; message: string } | null;
  organizationName: string | null;
  organizationLogo: string | null;
  schedule: Array<{ time: string; title: string; description: string | null; location: string | null }>;
   menuVariants: Array<{ id: string; label: string; description: string | null; imageUrl: string | null; notes: string | null; courses: Array<{ typeLabel: string; name: string; description: string | null; priceBase: number | null; priceExtra: number | null }> }>;
  approvals: Array<{ section: string; status: string }>;
};

const SECTION_LABELS: Record<string, string> = {
  SCHEDULE: "Harmonogram",
  MENU: "Menu",
  GUESTS: "Goście",
  KITCHEN: "Kuchnia",
  GENERAL: "Ogólne",
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  APPETIZER: "Przystawka",
  SOUP: "Zupa",
  MAIN: "Danie główne",
  DESSERT: "Deser",
  CAKE: "Tort",
  COLD_PLATTER: "Zimna płyta",
  BUFFET: "Bufet",
  DINNER: "Kolacja",
  COFFEE_TEA: "Kawa i herbata",
  DRINKS: "Napoje",
  ALCOHOL: "Alkohol",
  OTHER: "Inne",
};

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export async function getEventClientPortalData(
  token: string,
): Promise<EventClientPortalData | null> {
  if (!token || token.length < 16) return null;
  await ensureAgendaEventColumns();

  const event = await prisma.event.findUnique({
    where: { clientLinkTokenHash: hashToken(token) },
    select: {
      id: true,
      name: true,
      date: true,
      receptionLocationName: true,
      organizerName: true,
      estimatedGuestCount: true,
      isWedding: true,
      clientLinkExpiresAt: true,
      clientReviewedAt: true,
      clientFeedback: true,
      clientWorkflowStatus: true,
      clientMenuSelectionJson: true,
      clientNextStepTitle: true,
      clientNextStepMessage: true,
      organization: { select: { name: true, logo: true } },
    },
  });
  if (!event) return null;
  if (event.clientLinkExpiresAt && event.clientLinkExpiresAt < new Date()) return null;

  const [schedule, menuVariants, approvals] = await Promise.all([
    prisma.dayScheduleItem.findMany({
      where: { eventId: event.id },
      orderBy: { sortOrder: "asc" },
      select: { startTime: true, title: true, description: true, location: true },
    }),
    prisma.menuVariant.findMany({
      where: { eventId: event.id },
      include: { courses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.agendaApproval.findMany({
      where: { eventId: event.id },
      select: { section: true, status: true },
    }),
  ]);

  let menuSelection: Array<{ variantId: string; guests: number }> = [];
  try {
    menuSelection = event.clientMenuSelectionJson ? JSON.parse(event.clientMenuSelectionJson) : [];
  } catch {}

  return {
    eventName: event.name,
    eventDate: new Date(event.date).toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    location: event.receptionLocationName,
    organizerName: event.organizerName,
    guestCount: event.estimatedGuestCount,
    isWedding: event.isWedding,
    clientReviewedAt: event.clientReviewedAt?.toISOString() ?? null,
    clientFeedback: event.clientFeedback,
    workflowStatus: event.clientWorkflowStatus,
    menuSelection,
    nextStep: event.clientNextStepTitle
      ? { title: event.clientNextStepTitle, message: event.clientNextStepMessage ?? "" }
      : null,
    organizationName: event.organization?.name ?? null,
    organizationLogo: event.organization?.logo ?? null,
    schedule: schedule.map((s) => ({
      time: formatTime(s.startTime),
      title: s.title,
      description: s.description,
      location: s.location,
    })),
    menuVariants: menuVariants.map((v) => ({
      id: v.id,
      label: v.label,
      description: v.description,
      imageUrl: v.imageUrl,
      notes: v.notes,
      courses: v.courses.map((c) => ({
        typeLabel: COURSE_TYPE_LABELS[c.courseType] ?? c.courseType,
        name: c.name,
        description: c.description,
        priceBase: c.priceBase,
        priceExtra: c.priceExtra,
      })),
    })),
    approvals: approvals.map((a) => ({
      section: SECTION_LABELS[a.section] ?? a.section,
      status: a.status,
    })),
  };
}

/** Klient wybiera wariant menu i liczbę osób dla każdego wariantu. */
export async function submitEventClientMenu(
  token: string,
  selections: Array<{ variantId: string; guests: number }>,
): Promise<{ ok: boolean; error?: string }> {
  if (!token || token.length < 16) return { ok: false, error: "Nieprawidłowy link." };
  await ensureAgendaEventColumns();
  const event = await prisma.event.findUnique({
    where: { clientLinkTokenHash: hashToken(token) },
    select: {
      id: true,
      name: true,
      clientLinkExpiresAt: true,
      organization: { select: { id: true } },
    },
  });
  if (!event) return { ok: false, error: "Nieprawidłowy link." };
  if (event.clientLinkExpiresAt && event.clientLinkExpiresAt < new Date()) {
    return { ok: false, error: "Link wygasł. Poproś restaurację o nowy." };
  }
  if (!selections.length || selections.some((s) => !s.variantId || !Number.isInteger(s.guests) || s.guests < 1)) {
    return { ok: false, error: "Wybierz menu i podaj poprawną liczbę osób." };
  }
  const variants = await prisma.menuVariant.findMany({
    where: { id: { in: selections.map((s) => s.variantId) }, eventId: event.id },
    select: { id: true },
  });
  if (variants.length !== selections.length) return { ok: false, error: "Nieprawidłowy wariant menu." };

  await prisma.event.update({
    where: { id: event.id },
    data: {
      clientMenuSelectionJson: JSON.stringify(selections),
      clientWorkflowStatus: "MENU_SUBMITTED",
    },
  });
  if (event.organization?.id) {
    const { notifyOrganization } = await import("@/lib/actions/org-ecosystem.actions");
    await notifyOrganization(event.organization.id, {
      type: "CLIENT_REPLY",
      title: `Klient wybrał menu: ${event.name}`,
      body: selections.map((s) => `${s.variantId}: ${s.guests} os.`).join(", "),
      link: "/app/events",
    });
  }
  return { ok: true };
}

/** Organizator przekazuje klientowi kolejny krok procesu. */
export async function sendEventClientNextStep(
  eventId: string,
  input: { title: string; message: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!(await canManageEvent(eventId))) return { ok: false, error: "Brak uprawnień." };
  await ensureAgendaEventColumns();
  await prisma.event.update({
    where: { id: eventId },
    data: {
      clientWorkflowStatus: "NEXT_STEP",
      clientNextStepTitle: input.title.trim(),
      clientNextStepMessage: input.message.trim(),
      clientNextStepSentAt: new Date(),
    },
  });
  revalidatePath("/pl/app");
  return { ok: true };
}

/** Klient zatwierdza sekcje agendy i/lub zostawia uwagi. */
export async function submitEventClientFeedback(
  token: string,
  input: { approveAll?: boolean; sections?: string[]; feedback?: string },
): Promise<{ ok: boolean; error?: string }> {
  if (!token || token.length < 16) return { ok: false, error: "Nieprawidłowy link." };
  await ensureAgendaEventColumns();

  const event = await prisma.event.findUnique({
    where: { clientLinkTokenHash: hashToken(token) },
    select: {
      id: true,
      name: true,
      clientLinkExpiresAt: true,
      user: { select: { email: true, name: true } },
      organization: { select: { id: true, email: true, name: true } },
    },
  });
  if (!event) return { ok: false, error: "Nieprawidłowy link." };
  if (event.clientLinkExpiresAt && event.clientLinkExpiresAt < new Date()) {
    return { ok: false, error: "Link wygasł. Poproś restaurację o nowy." };
  }

  const approveSections = input.approveAll
    ? ["SCHEDULE", "MENU", "GUESTS", "KITCHEN", "GENERAL"]
    : (input.sections ?? []);

  if (approveSections.length > 0) {
    for (const section of approveSections) {
      if (!["SCHEDULE", "MENU", "GUESTS", "KITCHEN", "GENERAL"].includes(section)) continue;
      await prisma.agendaApproval.upsert({
        where: { eventId_section: { eventId: event.id, section } },
        create: { eventId: event.id, section, status: "APPROVED" },
        update: { status: "APPROVED", approvedAt: new Date() },
      });
    }
  }

  await prisma.event.update({
    where: { id: event.id },
    data: {
      clientReviewedAt: new Date(),
      clientFeedback: input.feedback?.trim() || null,
    },
  });

  // Powiadomienie in-app dla restauracji.
  if (event.organization?.id) {
    try {
      const { notifyOrganization } = await import("@/lib/actions/org-ecosystem.actions");
      await notifyOrganization(event.organization.id, {
        type: "CLIENT_REPLY",
        title: `Klient odpowiedział: ${event.name}`,
        body: input.feedback?.trim() || "Klient potwierdził ustalenia.",
        link: "/app/events",
      });
    } catch (e) {
      console.error("[event-client] notify failed:", e);
    }
  }

  // Powiadomienie restauracji o odpowiedzi klienta (jeśli Resend skonfigurowany).
  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    const notifyEmail =
      event.organization?.email?.trim() || event.user.email?.trim();
    if (resendKey && notifyEmail) {
      const { Resend } = await import("resend");
      const { getResendFrom } = await import("@/lib/env");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: getResendFrom(),
        to: notifyEmail,
        subject: `EventBoard — odpowiedź klienta: ${event.name}`,
        html: `<p>Klient odpowiedział na link decyzyjny dla eventu <strong>${event.name}</strong>.</p>
        ${input.feedback?.trim() ? `<p><strong>Uwagi:</strong> ${input.feedback.trim()}</p>` : ""}
        <p>Zajrzyj do EventBoard → Eventy → ${event.name}, aby zobaczyć szczegóły.</p>`,
      });
    }
  } catch (e) {
    console.error("[event-client] notification failed:", e);
  }

  return { ok: true };
}

// ── Czat klient ⇄ organizator ────────────────────────────────────────────

async function findEventByClientToken(token: string) {
  if (!token || token.length < 16) return null;
  await ensureAgendaEventColumns();
  const event = await prisma.event.findUnique({
    where: { clientLinkTokenHash: hashToken(token) },
    select: { id: true, name: true, clientLinkExpiresAt: true, organization: { select: { id: true, name: true } } },
  });
  if (!event) return null;
  if (event.clientLinkExpiresAt && event.clientLinkExpiresAt < new Date()) return null;
  return event;
}

export async function getEventClientMessages(token: string) {
  const event = await findEventByClientToken(token);
  if (!event) return [];
  return prisma.eventMessage.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

export async function sendEventClientMessage(token: string, content: string): Promise<{ ok: boolean; error?: string }> {
  const event = await findEventByClientToken(token);
  if (!event) return { ok: false, error: "Nieprawidłowy link." };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Pusta wiadomość." };

  await prisma.eventMessage.create({
    data: { eventId: event.id, senderRole: "CLIENT", senderName: "Klient", content: trimmed },
  });

  if (event.organization?.id) {
    try {
      const { notifyOrganization } = await import("@/lib/actions/org-ecosystem.actions");
      await notifyOrganization(event.organization.id, {
        type: "CLIENT_REPLY",
        title: `Wiadomość od klienta: ${event.name}`,
        body: trimmed.slice(0, 120),
        link: "/app/events",
      });
    } catch (e) {
      console.error("[event-client] notify failed:", e);
    }
  }

  return { ok: true };
}

export async function getEventOrganizerMessages(eventId: string) {
  if (!(await canManageEvent(eventId))) return [];
  await ensureAgendaEventColumns();
  return prisma.eventMessage.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

export async function sendEventOrganizerMessage(eventId: string, content: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await canManageEvent(eventId))) return { ok: false, error: "Brak uprawnień." };
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Pusta wiadomość." };

  await prisma.eventMessage.create({
    data: { eventId, senderRole: "ORGANIZER", senderName: "Organizator", content: trimmed },
  });

  return { ok: true };
}

/** Organizator zatwierdza wybór menu klienta. */
export async function markEventMenuReviewed(eventId: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await canManageEvent(eventId))) return { ok: false, error: "Brak uprawnień." };
  await ensureAgendaEventColumns();
  await prisma.event.update({ where: { id: eventId }, data: { clientWorkflowStatus: "ORGANIZER_REVIEW" } });
  revalidatePath("/pl/app");
  return { ok: true };
}
