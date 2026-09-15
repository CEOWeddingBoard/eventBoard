"use server";

import { prisma } from "@/lib/prisma";
import { assertModuleEdit } from "@/lib/permissions/guard";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId } from "@/lib/auth/active-org";
import { ensureEventP1Columns } from "@/lib/events/event-schema-migration";
import { buildSimpleDocx } from "@/lib/agenda/agenda-docx";

// ── wspólne ──────────────────────────────────────────────────────────────

async function getUserOrgId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getActiveOrgId(user.id);
}

async function canManageEvent(eventId: string): Promise<boolean> {
  const organizationId = await getUserOrgId();
  if (!organizationId) return false;
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: { id: true },
  });
  return !!event;
}

// ── powiadomienia in-app ─────────────────────────────────────────────────

export async function notifyOrganization(
  organizationId: string,
  input: { type?: string; title: string; body?: string; link?: string },
) {
  try {
    await ensureEventP1Columns();
    await prisma.orgNotification.create({
      data: {
        organizationId,
        type: input.type ?? "INFO",
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (e) {
    console.error("[notifyOrganization]", e);
  }
}

export async function listOrgNotifications() {
  const organizationId = await getUserOrgId();
  if (!organizationId) return [];
  await ensureEventP1Columns();
  return prisma.orgNotification.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markOrgNotificationsRead(ids: string[]) {
  const organizationId = await getUserOrgId();
  if (!organizationId) return { ok: true };
  await ensureEventP1Columns();
  await prisma.orgNotification.updateMany({
    where: { id: { in: ids }, organizationId },
    data: { read: true },
  });
  return { ok: true };
}

// ── szablony agendy/menu ─────────────────────────────────────────────────

export async function listOrgTemplates() {
  const organizationId = await getUserOrgId();
  if (!organizationId) return [];
  await ensureEventP1Columns();
  return prisma.orgTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveEventAsTemplate(eventId: string, name: string) {
  await assertModuleEdit("events");
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");
  await ensureEventP1Columns();

  const [schedule, menuVariants] = await Promise.all([
    prisma.dayScheduleItem.findMany({
      where: { eventId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.menuVariant.findMany({
      where: { eventId },
      include: { courses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const content = {
    schedule: schedule.map((s) => ({
      time: new Date(s.startTime).toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: s.title,
      description: s.description,
      location: s.location,
    })),
    menuVariants: menuVariants.map((v) => ({
      label: v.label,
      courses: v.courses.map((c) => ({
        name: c.name,
        courseType: c.courseType,
        description: c.description,
        allergens: c.allergens,
        priceBase: c.priceBase,
        priceExtra: c.priceExtra,
      })),
    })),
  };

  await prisma.orgTemplate.create({
    data: {
      organizationId,
      name: name.trim(),
      kind: "AGENDA",
      contentJson: JSON.stringify(content),
    },
  });

  revalidatePath("/pl/app");
  return { ok: true };
}

export async function applyTemplateToEvent(templateId: string, eventId: string) {
  await assertModuleEdit("events");
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  await ensureEventP1Columns();

  const template = await prisma.orgTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Szablon nie istnieje");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { date: true },
  });
  if (!event) throw new Error("Event nie istnieje");

  const content = JSON.parse(template.contentJson || "{}");
  const base = new Date(event.date);

  for (const item of (content.schedule ?? []) as Array<{
    time: string;
    title: string;
    description?: string | null;
    location?: string | null;
  }>) {
    const [h, m] = (item.time || "12:00").split(":").map((n: string) => parseInt(n, 10));
    const start = new Date(base);
    start.setHours(h || 0, m || 0, 0, 0);
    await prisma.dayScheduleItem.create({
      data: {
        eventId,
        startTime: start,
        title: item.title,
        description: item.description ?? null,
        location: item.location ?? null,
      },
    });
  }

  for (const variant of (content.menuVariants ?? []) as Array<{
    label: string;
    courses: Array<{
      name: string;
      courseType: string;
      description?: string | null;
      allergens?: string | null;
      priceBase?: number | null;
      priceExtra?: number | null;
    }>;
  }>) {
    const created = await prisma.menuVariant.create({
      data: { eventId, label: variant.label },
    });
    for (const course of variant.courses) {
      await prisma.menuVariantCourse.create({
        data: {
          menuVariantId: created.id,
          name: course.name,
          courseType: course.courseType,
          description: course.description ?? null,
          allergens: course.allergens ?? null,
          priceBase: course.priceBase ?? null,
          priceExtra: course.priceExtra ?? null,
        },
      });
    }
  }

  revalidatePath("/pl/app");
  return { ok: true };
}

// ── checklista produkcyjna (Task + assignee) ─────────────────────────────

export async function listEventTasks(eventId: string) {
  return prisma.task.findMany({
    where: { eventId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });
}

export async function createEventTask(
  eventId: string,
  input: { title: string; dueDate?: string; assigneeId?: string },
) {
  await assertModuleEdit("events");
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  const task = await prisma.task.create({
    data: {
      eventId,
      title: input.title.trim(),
      status: "TODO",
      priority: "MEDIUM",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assigneeId: input.assigneeId || null,
    },
  });
  revalidatePath("/pl/app");
  return task;
}

export async function toggleEventTask(taskId: string) {
  await assertModuleEdit("events");
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task?.eventId || !(await canManageEvent(task.eventId))) {
    throw new Error("Forbidden");
  }
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: task.status === "DONE" ? "TODO" : "DONE" },
  });
  revalidatePath("/pl/app");
  return updated;
}

export async function deleteEventTask(taskId: string) {
  await assertModuleEdit("events");
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task?.eventId || !(await canManageEvent(task.eventId))) {
    throw new Error("Forbidden");
  }
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/pl/app");
  return { ok: true };
}

// ── płatności manualne (cashflow bez bramki) ─────────────────────────────

export async function listEventPayments(eventId: string) {
  await ensureEventP1Columns();
  return prisma.eventPayment.findMany({
    where: { eventId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });
}

export async function addEventPayment(
  eventId: string,
  input: { label: string; amount: number; dueDate?: string; notes?: string },
) {
  await assertModuleEdit("finances");
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  await ensureEventP1Columns();
  const payment = await prisma.eventPayment.create({
    data: {
      eventId,
      label: input.label.trim(),
      amount: input.amount,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes?.trim() || null,
    },
  });
  revalidatePath("/pl/app");
  return payment;
}

export async function markEventPaymentPaid(paymentId: string, method?: string) {
  await assertModuleEdit("finances");
  const payment = await prisma.eventPayment.findUnique({ where: { id: paymentId } });
  if (!payment || !(await canManageEvent(payment.eventId))) throw new Error("Forbidden");
  const updated = await prisma.eventPayment.update({
    where: { id: paymentId },
    data: { status: "PAID", paidAt: new Date(), method: method ?? null },
  });
  revalidatePath("/pl/app");
  return updated;
}

export async function markEventPaymentPending(paymentId: string) {
  await assertModuleEdit("finances");
  const payment = await prisma.eventPayment.findUnique({ where: { id: paymentId } });
  if (!payment || !(await canManageEvent(payment.eventId))) throw new Error("Forbidden");
  const updated = await prisma.eventPayment.update({
    where: { id: paymentId },
    data: { status: "PENDING", paidAt: null },
  });
  revalidatePath("/pl/app");
  return updated;
}

export async function deleteEventPayment(paymentId: string) {
  await assertModuleEdit("finances");
  const payment = await prisma.eventPayment.findUnique({ where: { id: paymentId } });
  if (!payment || !(await canManageEvent(payment.eventId))) throw new Error("Forbidden");
  await prisma.eventPayment.delete({ where: { id: paymentId } });
  revalidatePath("/pl/app");
  return { ok: true };
}

// ── kosztorys / deadline'y ───────────────────────────────────────────────

export type EventQuote = {
  guests: number | null;
  variants: Array<{
    id: string;
    label: string;
    pricePerPerson: number;
    totalForGuests: number;
  }>;
  extras: Array<{ label: string; amount: number }>;
  notes: string | null;
  menuDeadlineAt: string | null;
  guestListDeadlineAt: string | null;
};

export async function getEventQuote(eventId: string): Promise<EventQuote> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      estimatedGuestCount: true,
      quoteJson: true,
      menuDeadlineAt: true,
      guestListDeadlineAt: true,
    },
  });
  if (!event) throw new Error("Event not found");

  const variants = await prisma.menuVariant.findMany({
    where: { eventId },
    include: { courses: true },
    orderBy: { sortOrder: "asc" },
  });

  let extras: Array<{ label: string; amount: number }> = [];
  let notes: string | null = null;
  try {
    const parsed = event.quoteJson ? JSON.parse(event.quoteJson) : {};
    extras = Array.isArray(parsed.items) ? parsed.items : [];
    notes = parsed.notes ?? null;
  } catch {
    // ignoruj
  }

  const guests = event.estimatedGuestCount;
  return {
    guests,
    variants: variants.map((v) => {
      // Cena/os. wariantu (np. bufet 250 zł/os.) ma pierwszeństwo; gdy jej nie
      // ma, sumujemy ceny dań (menu składane z pojedynczych pozycji).
      const summed = v.courses.reduce(
        (sum, c) => sum + (c.priceBase ?? 0) + (c.priceExtra ?? 0),
        0,
      );
      const perPerson =
        v.pricePerPerson != null && v.pricePerPerson > 0 ? v.pricePerPerson : summed;
      return {
        id: v.id,
        label: v.label,
        pricePerPerson: perPerson,
        totalForGuests: guests ? guests * perPerson : 0,
      };
    }),
    extras,
    notes,
    menuDeadlineAt: event.menuDeadlineAt?.toISOString() ?? null,
    guestListDeadlineAt: event.guestListDeadlineAt?.toISOString() ?? null,
  };
}

export async function saveEventQuote(
  eventId: string,
  input: { items: Array<{ label: string; amount: number }>; notes?: string },
) {
  await assertModuleEdit("finances");
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  await prisma.event.update({
    where: { id: eventId },
    data: { quoteJson: JSON.stringify(input) },
  });
  revalidatePath("/pl/app");
  return { ok: true };
}

export async function saveEventDeadlines(
  eventId: string,
  input: { menuDeadlineAt?: string | null; guestListDeadlineAt?: string | null },
) {
  await assertModuleEdit("events");
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  await prisma.event.update({
    where: { id: eventId },
    data: {
      menuDeadlineAt: input.menuDeadlineAt ? new Date(input.menuDeadlineAt) : null,
      guestListDeadlineAt: input.guestListDeadlineAt
        ? new Date(input.guestListDeadlineAt)
        : null,
    },
  });
  revalidatePath("/pl/app");
  return { ok: true };
}

// ── leady (publiczny formularz zapytania) ────────────────────────────────

export async function createOrgLead(
  organizationId: string,
  input: {
    name: string;
    email?: string;
    phone?: string;
    eventDate?: string;
    guestCount?: number;
    message?: string;
  },
) {
  await ensureEventP1Columns();
  const lead = await prisma.orgLead.create({
    data: {
      organizationId,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      guestCount: input.guestCount ?? null,
      message: input.message?.trim() || null,
    },
  });
  await notifyOrganization(organizationId, {
    type: "LEAD",
    title: `Nowe zapytanie: ${lead.name}`,
    body: input.eventDate
      ? `Data: ${new Date(input.eventDate).toLocaleDateString("pl-PL")}${input.guestCount ? ` · ${input.guestCount} os.` : ""}`
      : undefined,
    link: "/app/leads",
  });
  return { ok: true };
}

export async function listOrgLeads() {
  const organizationId = await getUserOrgId();
  if (!organizationId) return [];
  await ensureEventP1Columns();
  return prisma.orgLead.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrgLeadStatus(leadId: string, status: string) {
  await assertModuleEdit("leads");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");
  const allowed = ["NEW", "CONTACTED", "WON", "LOST"];
  if (!allowed.includes(status)) throw new Error("Nieprawidłowy status");
  await prisma.orgLead.updateMany({
    where: { id: leadId, organizationId },
    data: { status },
  });
  revalidatePath("/pl/app");
  return { ok: true };
}

export async function convertLeadToEvent(leadId: string) {
  await assertModuleEdit("leads");
  const organizationId = await getUserOrgId();
  if (!organizationId) throw new Error("Forbidden");

  const lead = await prisma.orgLead.findFirst({
    where: { id: leadId, organizationId },
  });
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "WON") throw new Error("Lead już skonwertowany");

  const user = await getCurrentUser();
  const event = await prisma.event.create({
    data: {
      name: lead.name,
      date: lead.eventDate ?? new Date(),
      userId: user!.id,
      organizationId,
      estimatedGuestCount: lead.guestCount,
      organizerName: lead.name,
      eventType: "OTHER",
      isWedding: false,
      status: "DRAFT",
    },
  });

  await prisma.orgLead.update({ where: { id: leadId }, data: { status: "WON" } });
  revalidatePath("/pl/app");

  // Zapytanie zamienione w przyjęcie blokuje termin, więc musi być widoczne
  // w Google tak samo jak przyjęcie założone ręcznie.
  const { zsynchronizujEventZGoogle } = await import("@/lib/actions/google-calendar.actions");
  void zsynchronizujEventZGoogle(event.id);

  return event;
}

// ── umowa DOCX ───────────────────────────────────────────────────────────

export async function generateEventContractDocxBase64(
  eventId: string,
): Promise<{ base64: string; fileName: string }> {
  if (!(await canManageEvent(eventId))) throw new Error("Forbidden");
  await ensureEventP1Columns();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      name: true,
      date: true,
      estimatedGuestCount: true,
      receptionLocationName: true,
      organizerName: true,
      occasionLabel: true,
      scenarioNotes: true,
      organization: { select: { name: true, address: true, email: true, phone: true } },
    },
  });
  if (!event) throw new Error("Event not found");

  const quote = await getEventQuote(eventId);
  const payments = await listEventPayments(eventId);
  const paidSum = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pendingSum = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);

  const lines = [
    { text: "UMOWA / POTWIERDZENIE REZERWACJI", bold: true, center: true },
    { text: "" },
    { text: `Event: ${event.name}`, bold: true },
    { text: `Data: ${new Date(event.date).toLocaleDateString("pl-PL", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}` },
    event.receptionLocationName ? { text: `Miejsce: ${event.receptionLocationName}` } : null,
    event.estimatedGuestCount != null ? { text: `Liczba osób: ${event.estimatedGuestCount}` } : null,
    event.occasionLabel ? { text: `Okoliczność: ${event.occasionLabel}` } : null,
    { text: "" },
    { text: "ORGANIZATOR", bold: true },
    event.organization?.name ? { text: event.organization.name } : null,
    event.organization?.address ? { text: event.organization.address } : null,
    event.organization?.phone ? { text: `Tel: ${event.organization.phone}` } : null,
    event.organization?.email ? { text: `E-mail: ${event.organization.email}` } : null,
    { text: "" },
    { text: "MENU I WYCENA", bold: true },
    ...quote.variants.flatMap((v) => [
      { text: `${v.label}: ${v.pricePerPerson.toLocaleString("pl-PL")} zł / os.${quote.guests ? ` × ${quote.guests} os. = ${v.totalForGuests.toLocaleString("pl-PL")} zł` : ""}` },
    ]),
    ...quote.extras.map((e) => ({
      text: `Dodatkowe: ${e.label} — ${e.amount.toLocaleString("pl-PL")} zł`,
    })),
    { text: "" },
    { text: "PŁATNOŚCI", bold: true },
    ...payments.map((p) => ({
      text: `${p.status === "PAID" ? "Opłacone" : "Do zapłaty"}: ${p.label} — ${p.amount.toLocaleString("pl-PL")} zł${p.dueDate ? ` (termin: ${new Date(p.dueDate).toLocaleDateString("pl-PL")})` : ""}${p.paidAt ? ` — zapłacono ${new Date(p.paidAt).toLocaleDateString("pl-PL")}` : ""}`,
    })),
    { text: `Suma opłacona: ${paidSum.toLocaleString("pl-PL")} zł` },
    { text: `Pozostało do zapłaty: ${pendingSum.toLocaleString("pl-PL")} zł` },
    { text: "" },
    event.scenarioNotes
      ? { text: "SCENARIUSZ", bold: true }
      : null,
    ...(event.scenarioNotes ? event.scenarioNotes.split("\n").filter(Boolean).map((l) => ({ text: l })) : []),
    { text: "" },
    { text: "" },
    { text: "Podpis organizatora: ................................" },
    { text: "" },
    { text: "Podpis zamawiającego: ................................" },
  ].filter((l): l is { text: string; bold?: boolean; center?: boolean } => !!l);

  const buffer = buildSimpleDocx(lines);
  return {
    base64: buffer.toString("base64"),
    fileName: `umowa-${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.docx`,
  };
}
