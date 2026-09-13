/**
 * Builds a Google Calendar "Add event" URL (opens in browser, no OAuth).
 * Works for any user with a Google account (including Gmail).
 */

export interface CalendarEventInput {
  name: string;
  date: Date | string;
  description?: string | null;
  mapLocationUrl?: string | null;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * All-day event: start = event date, end = next day (Google uses exclusive end).
 * Uses local date parts to avoid timezone shifts for the displayed day.
 */
export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const d = typeof event.date === "string" ? new Date(event.date) : event.date;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const startStr = `${y}${pad(m)}${pad(day)}`;
  const end = new Date(y, d.getMonth(), day + 1);
  const endStr = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${startStr}/${endStr}`,
  });
  if (event.description?.trim()) params.set("details", event.description.trim());
  if (event.mapLocationUrl?.trim()) params.set("location", event.mapLocationUrl.trim());

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --- ICS (iCalendar) export for full sync ---

export interface IcsEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  uid?: string;
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsDateUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${min}${sec}Z`;
}

function formatIcsDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}${m}${day}`;
}

export function buildIcsCalendar(events: IcsEventInput[], productId = "WeddingPlanner"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${productId}//EN`,
    "CALSCALE:GREGORIAN",
  ];

  const dtstamp = formatIcsDateUtc(new Date());

  for (const ev of events) {
    const uid = ev.uid ?? `ev-${ev.start.getTime()}-${Math.random().toString(36).slice(2, 9)}`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);

    if (ev.allDay) {
      const endExclusive = new Date(ev.start);
      endExclusive.setDate(endExclusive.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${formatIcsDateOnly(ev.start)}`);
      lines.push(`DTEND;VALUE=DATE:${formatIcsDateOnly(endExclusive)}`);
    } else {
      lines.push(`DTSTART:${formatIcsDateUtc(ev.start)}`);
      lines.push(`DTEND:${formatIcsDateUtc(ev.end)}`);
    }

    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.description?.trim()) lines.push(`DESCRIPTION:${escapeIcsText(ev.description.trim())}`);
    if (ev.location?.trim()) lines.push(`LOCATION:${escapeIcsText(ev.location.trim())}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export interface EventForIcs {
  id: string;
  name: string;
  date: Date;
  description?: string | null;
  mapLocationUrl?: string | null;
  tasks: Array<{ id: string; title: string; description?: string | null; dueDate: Date | null }>;
  dayScheduleItems: Array<{
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: Date;
    endTime: Date | null;
  }>;
}

export function eventToIcsEvents(event: EventForIcs): IcsEventInput[] {
  const out: IcsEventInput[] = [];
  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
  out.push({
    title: event.name,
    description: event.description ?? undefined,
    location: event.mapLocationUrl ?? undefined,
    start: eventDate,
    end: eventDate,
    allDay: true,
    uid: `wedding-${event.id}`,
  });
  for (const item of event.dayScheduleItems) {
    const start = item.startTime instanceof Date ? item.startTime : new Date(item.startTime);
    const end = item.endTime
      ? item.endTime instanceof Date ? item.endTime : new Date(item.endTime)
      : new Date(start.getTime() + 60 * 60 * 1000);
    out.push({
      title: item.title,
      description: item.description ?? undefined,
      location: item.location ?? undefined,
      start,
      end,
      allDay: false,
      uid: `schedule-${item.id}`,
    });
  }
  for (const task of event.tasks) {
    if (!task.dueDate) continue;
    const d = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    out.push({
      title: task.title,
      description: task.description ?? undefined,
      location: undefined,
      start: d,
      end: d,
      allDay: true,
      uid: `task-${task.id}`,
    });
  }
  return out;
}
