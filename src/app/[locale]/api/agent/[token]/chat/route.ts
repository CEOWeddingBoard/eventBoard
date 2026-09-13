import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAIResponse } from "@/lib/ai";
import {
  buildWeddingContextSummary,
  type WeddingChatContext,
} from "@/lib/ai/chat-context";

const COUPLE_SYSTEM =
  "Jesteś asystentem Wedding Board dla pary młodej. Odpowiadaj krótko i merytorycznie (2–4 zdania), na podstawie podanych danych: budżet, goście, zadania, harmonogram. Odpowiadaj w tym samym języku co użytkownik.\n\nDane o weselu:\n";

function buildGuestPrompt(
  event: {
    name: string;
    date: Date;
    description: string | null;
    dressCode: string | null;
    mapLocationUrl: string | null;
    ceremonyLocationName: string | null;
    ceremonyLocationUrl: string | null;
    receptionLocationName: string | null;
    receptionLocationUrl: string | null;
    publicSlug: string | null;
  },
  scheduleLines: string,
  locale: string,
  message: string
): string {
  const isPl = locale === "pl";
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString(isPl ? "pl-PL" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : isPl
      ? "data wkrótce"
      : "date coming soon";
  const basePrompt = isPl
    ? `Jesteś asystentem AI wesela dla GOŚCI. Odpowiadasz tylko na pytania o: datę, godzinę i miejsce, plan dnia, dress code, dojazd/parking (jeśli w danych). Nie odpowiadasz o budżet, zadania ani dane osobowe. Jeśli czegoś nie ma – powiedz, że para nie udostępniła tej informacji. Odpowiadaj zwięźle, 1–3 zdania, w języku gościa (tu: ${locale}).`
    : `You are the wedding AI assistant for GUESTS. Answer only about: date, time, place, schedule, dress code, transport/parking (if in data). Do not answer about budget, tasks or personal data. If something is missing, say the couple has not shared it. Answer concisely in 1–3 sentences in the guest's language (here: ${locale}).`;
  const rsvpHint =
    event.publicSlug && isPl
      ? " Goście mogą potwierdzić udział (RSVP) na stronie zaproszenia pod linkiem, który para im wysłała."
      : event.publicSlug
        ? " Guests can confirm attendance (RSVP) on the invitation page link the couple sent them."
        : "";
  const context = `
Nazwa wesela: ${event.name}
Data: ${dateStr}
Opis: ${event.description || (isPl ? "brak" : "none")}
Dress code: ${event.dressCode || (isPl ? "nieokreślony" : "not specified")}
Mapa: ${event.mapLocationUrl || (isPl ? "brak" : "none")}
Ceremonia: ${event.ceremonyLocationName || (isPl ? "brak" : "none")}
Mapa ceremonii: ${event.ceremonyLocationUrl || (isPl ? "brak" : "none")}
Przyjęcie weselne: ${event.receptionLocationName || (isPl ? "brak" : "none")}
Mapa przyjęcia: ${event.receptionLocationUrl || (isPl ? "brak" : "none")}
Plan dnia:
${scheduleLines}
${rsvpHint}
`;
  return `${basePrompt}\n${context}\n\nPytanie: ${message}`;
}

function buildVendorPrompt(
  event: { name: string; date: Date },
  vendor: { name: string; category: string; notes: string | null; vendorDaySchedule: string | null; contact: string | null; email: string | null; phone: string | null },
  locale: string,
  message: string
): string {
  const isPl = locale === "pl";
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString(isPl ? "pl-PL" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const basePrompt = isPl
    ? `Jesteś asystentem AI dla USŁUGODAWCY weselnego. Masz dostęp tylko do danych tego wydarzenia i tej usługi (kategoria, uwagi, kontakt). Odpowiadasz zwięźle na pytania o termin wesela, ustalenia z parą i szczegóły dotyczące tej usługi. Nie podawaj danych innych usługodawców ani gości. Odpowiadaj w języku użytkownika (tu: ${locale}).`
    : `You are the wedding AI assistant for a VENDOR. You only have access to this event and this vendor's data (category, notes, contact). Answer briefly about wedding date, arrangements with the couple and this service. Do not share other vendors' or guests' data. Answer in the user's language (here: ${locale}).`;
  const context = `
Wesele: ${event.name}
Data: ${dateStr}

Usługodawca: ${vendor.name}
Kategoria: ${vendor.category}
${vendor.notes ? `Uwagi/ustalenia: ${vendor.notes}` : ""}
${vendor.vendorDaySchedule ? `Harmonogram dla usługodawcy: ${vendor.vendorDaySchedule}` : ""}
${vendor.contact ? `Osoba kontaktowa: ${vendor.contact}` : ""}
${vendor.email ? `Email: ${vendor.email}` : ""}
${vendor.phone ? `Telefon: ${vendor.phone}` : ""}
`;
  return `${basePrompt}\n${context}\n\nPytanie: ${message}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string; token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? (body.message as string).trim() : "";
    if (!message) {
      return NextResponse.json(
        { error: "Missing or invalid message" },
        { status: 400 }
      );
    }
    const locale = (body?.locale as string) || "pl";

    const agent = await prisma.sharedChatbotAgent.findUnique({
      where: { token },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            description: true,
            dressCode: true,
            mapLocationUrl: true,
            ceremonyLocationName: true,
            ceremonyLocationUrl: true,
            receptionLocationName: true,
            receptionLocationUrl: true,
            publicSlug: true,
            brideName: true,
            groomName: true,
            style: true,
            targetBudget: true,
            budgetCurrency: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            category: true,
            notes: true,
            vendorDaySchedule: true,
            contact: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!agent || !agent.event) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const event = agent.event;
    const isPl = (body?.locale as string) === "pl" || locale === "pl";

    if (agent.scope === "GUEST") {
      const scheduleItems = await prisma.dayScheduleItem.findMany({
        where: { eventId: event.id },
        orderBy: { startTime: "asc" },
        select: { startTime: true, title: true, location: true },
      });
      const scheduleLines =
        scheduleItems.length > 0
          ? scheduleItems
              .map((item) => {
                const time = new Date(item.startTime).toLocaleTimeString(
                  isPl ? "pl-PL" : "en-US",
                  { hour: "2-digit", minute: "2-digit" }
                );
                const loc = item.location ? ` (${item.location})` : "";
                return `- ${time}: ${item.title}${loc}`;
              })
              .join("\n")
          : isPl
            ? "Brak harmonogramu."
            : "No schedule.";
      const prompt = buildGuestPrompt(
        {
          name: event.name,
          date: event.date,
          description: event.description,
          dressCode: event.dressCode,
          mapLocationUrl: event.mapLocationUrl,
          ceremonyLocationName: event.ceremonyLocationName,
          ceremonyLocationUrl: event.ceremonyLocationUrl,
          receptionLocationName: event.receptionLocationName,
          receptionLocationUrl: event.receptionLocationUrl,
          publicSlug: event.publicSlug,
        },
        scheduleLines,
        locale || "pl",
        message
      );
      const { content } = await generateAIResponse(prompt);
      return NextResponse.json({ content: content?.trim() ?? "" });
    }

    if (agent.scope === "VENDOR" && agent.vendor) {
      const prompt = buildVendorPrompt(
        { name: event.name, date: event.date },
        {
          name: agent.vendor.name,
          category: agent.vendor.category,
          notes: agent.vendor.notes,
          vendorDaySchedule: agent.vendor.vendorDaySchedule,
          contact: agent.vendor.contact,
          email: agent.vendor.email,
          phone: agent.vendor.phone,
        },
        locale || "pl",
        message
      );
      const { content } = await generateAIResponse(prompt);
      return NextResponse.json({ content: content?.trim() ?? "" });
    }

    if (agent.scope === "COUPLE") {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const [tasks, guestCount, guestConfirmed, budgetItems, scheduleItems] =
        await Promise.all([
          prisma.task.findMany({
            where: { eventId: event.id },
            select: { title: true, dueDate: true, status: true },
          }),
          prisma.guest.count({ where: { eventId: event.id } }),
          prisma.guest.count({
            where: { eventId: event.id, status: "CONFIRMED" },
          }),
          prisma.budgetItem.findMany({
            where: { eventId: event.id },
            select: { plannedAmount: true, actualAmount: true },
          }),
          prisma.dayScheduleItem.findMany({
            where: {
              eventId: event.id,
              startTime: { gte: now },
            },
            orderBy: { startTime: "asc" },
            take: 5,
            select: { title: true, startTime: true, location: true },
          }),
        ]);
      const tasksDueSoon = tasks
        .filter(
          (t) =>
            t.status !== "DONE" &&
            t.dueDate != null &&
            t.dueDate >= now &&
            t.dueDate <= weekEnd
        )
        .map((t) => ({
          title: t.title,
          dueDate: t.dueDate
            ? t.dueDate.toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "short",
              })
            : "",
        }))
        .slice(0, 15);
      const budgetPlannedTotal =
        budgetItems.length > 0
          ? budgetItems.reduce(
              (sum, item) => sum + (item.plannedAmount ?? 0),
              0
            )
          : null;
      const budgetActualTotal =
        budgetItems.length > 0
          ? budgetItems.reduce(
              (sum, item) => sum + (item.actualAmount ?? 0),
              0
            )
          : null;
      const nextScheduleItems = scheduleItems.map((item) => ({
        title: item.title,
        time: item.startTime.toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        location: item.location,
      }));
      const ctx: WeddingChatContext = {
        eventName: event.name,
        eventDate: event.date.toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        brideName: event.brideName ?? null,
        groomName: event.groomName ?? null,
        style: event.style ?? null,
        targetBudget: event.targetBudget ?? null,
        budgetCurrency: event.budgetCurrency ?? "PLN",
        guestCount,
        guestConfirmed,
        tasksTotal: tasks.length,
        tasksDone: tasks.filter((t) => t.status === "DONE").length,
        tasksDueSoon,
        budgetPlannedTotal,
        budgetActualTotal,
        guestsPending: Math.max(guestCount - guestConfirmed, 0),
        nextScheduleItems,
      };
      const contextSummary = buildWeddingContextSummary(ctx);
      const fullPrompt = `${COUPLE_SYSTEM}${contextSummary}\n\n---\nPytanie użytkownika: ${message}`;
      const { content } = await generateAIResponse(fullPrompt);
      return NextResponse.json({ content: content?.trim() ?? "" });
    }

    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  } catch (error) {
    console.error("[agent/chat]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
