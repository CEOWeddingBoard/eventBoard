import { NextRequest, NextResponse } from "next/server";
import { getGoogleCalendarToken } from "@/lib/google-calendar-clerk";

export async function GET(req: NextRequest) {
  try {
    const tokenResult = await getGoogleCalendarToken();
    if (!tokenResult.ok) {
      return NextResponse.json({ error: tokenResult.reason }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get("calendarId") ?? tokenResult.calendarId ?? "primary";
    const timeMin = new Date().toISOString();

    const params = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin,
      maxResults: "50",
    });
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${tokenResult.token}` } }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Google API error: ${err}` }, { status: 502 });
    }
    const data = await res.json();
    type GoogleEvent = {
      id?: string;
      summary?: string;
      description?: string;
      location?: string;
      htmlLink?: string;
      extendedProperties?: { private?: Record<string, string>; shared?: Record<string, string> };
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    };
    const events = ((data.items ?? []) as GoogleEvent[]).map((e) => ({
      googleEventId: e.id,
      summary: e.summary ?? "",
      description: e.description ?? "",
      location: e.location ?? "",
      startDate: e.start?.dateTime ?? e.start?.date ?? "",
      endDate: e.end?.dateTime ?? e.end?.date ?? "",
      isAllDay: !!e.start?.date,
      htmlLink: e.htmlLink ?? "",
      existingOurId: e.extendedProperties?.private?.weddingPlannerId ?? undefined,
    }));

    return NextResponse.json({ events });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
