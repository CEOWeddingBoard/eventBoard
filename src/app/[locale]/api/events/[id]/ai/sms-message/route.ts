import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyEventAccess, handleApiError } from "@/lib/api/auth-helper";
import { prisma } from "@/lib/prisma";
import { generateAIResponse } from "@/lib/ai";

type Scenario = "rsvp_reminder" | "one_week_before" | "thanks";

interface Body {
  scenario: Scenario;
  extraContext?: string;
}

function buildPrompt(
  scenario: Scenario,
  locale: string,
  extraContext: string | undefined,
  data: {
    eventName: string;
    eventDate: string;
    locationHint?: string | null;
    guestStats: { total: number; confirmed: number; pending: number };
  }
): string {
  const isPl = locale === "pl";
  const common = isPl
    ? `Kontekst: Wesele "${data.eventName}", data: ${data.eventDate}. Miejsce: ${data.locationHint || "nie podano"}. Goście: ${data.guestStats.confirmed} potwierdzonych, ${data.guestStats.pending} oczekuje na RSVP, łącznie ${data.guestStats.total}.`
    : `Context: Wedding "${data.eventName}", date: ${data.eventDate}. Location: ${data.locationHint || "n/a"}. Guests: ${data.guestStats.confirmed} confirmed, ${data.guestStats.pending} pending RSVP, ${data.guestStats.total} total.`;

  const taskPl =
    scenario === "rsvp_reminder"
      ? "Napisz jedną wiadomość SMS (max 160 znaków) z przypomnieniem o potwierdzeniu obecności (RSVP). Ton: uprzejmy, krótki. Bez placeholderów typu [IMIĘ]. Zwracaj się do wszystkich (liczba mnoga)."
      : scenario === "one_week_before"
      ? "Napisz jedną wiadomość SMS (max 160 znaków) „tydzień przed weselem” – radosne przypomnienie o dacie, godzinie, miejscu. Ton: ciepły, konkretny. Bez placeholderów."
      : "Napisz jedną wiadomość SMS (max 160 znaków) z podziękowaniem dla gości po weselu. Ton: serdeczny, zwięzły. Bez placeholderów.";

  const taskEn =
    scenario === "rsvp_reminder"
      ? "Write a single SMS (max 160 characters) reminding guests to confirm attendance (RSVP). Tone: polite, short. No placeholders like [NAME]. Address everyone (plural)."
      : scenario === "one_week_before"
      ? "Write a single SMS (max 160 characters) \"one week before the wedding\" – cheerful reminder of date, time, place. Tone: warm, concrete. No placeholders."
      : "Write a single SMS (max 160 characters) thanking guests after the wedding. Tone: warm, concise. No placeholders.";

  const task = isPl ? taskPl : taskEn;
  const extra = extraContext?.trim()
    ? (isPl ? ` Dodatkowe uwagi od użytkownika: ${extraContext.trim()}` : ` User's extra notes: ${extraContext.trim()}`)
    : "";

  return (
    (isPl
      ? "Jesteś asystentem Wedding Board. Wygeneruj treść jednej wiadomości SMS do gości. Odpowiedz wyłącznie samą treścią SMS (bez cudzysłowów, bez komentarzy). Maksymalnie 160 znaków."
      : "You are a wedding planner assistant. Generate the body of one SMS to guests. Reply with only the SMS text (no quotes, no comments). Max 160 characters.") +
    "\n\n" +
    common +
    "\n\n" +
    task +
    extra
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; locale: string }> }
) {
  try {
    const [{ id: eventId, locale }] = await Promise.all([params]);
    const user = await requireAuth(req);
    if (!(await verifyEventAccess(user.id, eventId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    if (!body?.scenario || !["rsvp_reminder", "one_week_before", "thanks"].includes(body.scenario)) {
      return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: { select: { status: true, invitationToken: true } },
        dayScheduleItems: { orderBy: { startTime: "asc" }, take: 1, select: { location: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const totalGuests = event.guests.length;
    const confirmed = event.guests.filter((g) => g.status === "CONFIRMED").length;
    const pending = event.guests.filter(
      (g) => (g.status === "INVITED" || g.status === "PENDING") && g.invitationToken
    ).length;

    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "not set";

    const locationHint = event.dayScheduleItems[0]?.location ?? null;

    const prompt = buildPrompt(
      body.scenario,
      locale,
      body.extraContext,
      {
        eventName: event.name,
        eventDate,
        locationHint,
        guestStats: { total: totalGuests, confirmed, pending },
      }
    );

    const { content } = await generateAIResponse(prompt);
    const text = (content?.trim() ?? "").replace(/^["']|["']$/g, "").slice(0, 320);

    return NextResponse.json({ content: text });
  } catch (error) {
    return handleApiError(error);
  }
}
