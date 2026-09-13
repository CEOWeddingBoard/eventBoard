import { NextResponse } from "next/server";
import { getGoogleCalendarToken } from "@/lib/google-calendar-clerk";

export async function GET() {
  try {
    const tokenResult = await getGoogleCalendarToken();
    if (!tokenResult.ok) {
      return NextResponse.json({ error: tokenResult.reason }, { status: 401 });
    }

    const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${tokenResult.token}` },
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Google API error: ${err}` }, { status: 502 });
    }
    const data = await res.json();
    type GoogleCalendar = {
      id?: string;
      summary?: string;
      description?: string;
      primary?: boolean;
      backgroundColor?: string;
      accessRole?: string;
      timeZone?: string;
    };
    const calendars = ((data.items ?? []) as GoogleCalendar[]).map((c) => ({
      id: c.id,
      summary: c.summary ?? c.id,
      primary: c.primary ?? false,
      timeZone: c.timeZone,
    }));

    return NextResponse.json({ calendars });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
