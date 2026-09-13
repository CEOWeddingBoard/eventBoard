/**
 * Google Calendar API (REST) – OAuth token refresh i operacje na wydarzeniach.
 * Wymaga: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET w env.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const EXTENDED_PROP_SOURCE = "weddingPlannerSource";
const EXTENDED_PROP_ID = "weddingPlannerId";
const EXTENDED_PROP_EVENT_TYPE = "eventType";
const EXTENDED_PROP_GUEST_COUNT = "guestCount";
const EXTENDED_PROP_MENU_LABEL = "menuLabel";
const EXTENDED_PROP_STATUS = "status";

export interface GoogleCalendarConnection {
  id: string;
  userId: string;
  refreshToken: string;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
  calendarId: string | null;
}

const NOT_CONFIGURED_MSG = "Google Calendar is not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)";

function getClientConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isGoogleCalendarConfigured(): boolean {
  return getClientConfig() !== null;
}

export function getOAuthAuthorizeUrl(redirectUri: string, state?: string): string {
  const config = getClientConfig();
  if (!config) throw new Error(NOT_CONFIGURED_MSG);
  const { clientId } = config;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  if (state) params.set("state", state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const config = getClientConfig();
  if (!config) throw new Error(NOT_CONFIGURED_MSG);
  const { clientId, clientSecret } = config;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  if (!data.refresh_token) {
    throw new Error("Google did not return refresh_token – user may have already authorized. Revoke access and try again.");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function refreshAccessToken(connection: GoogleCalendarConnection): Promise<string> {
  const config = getClientConfig();
  if (!config) throw new Error(NOT_CONFIGURED_MSG);
  const { clientId, clientSecret } = config;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data.access_token;
}

export async function getValidAccessToken(connection: GoogleCalendarConnection): Promise<string> {
  const now = new Date();
  const expiresAt = connection.tokenExpiresAt;
  if (connection.accessToken && expiresAt && expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    return connection.accessToken;
  }
  const accessToken = await refreshAccessToken(connection);
  return accessToken;
}

const calendarBase = (calendarId: string) => `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;

export interface EventExtendedProperties {
  eventType?: string;
  guestCount?: string;
  menuLabel?: string;
  status?: string;
}

function extendedProps(ourId: string, extra?: EventExtendedProperties): { private: Record<string, string> } {
  const props: Record<string, string> = {
    [EXTENDED_PROP_SOURCE]: "true",
    [EXTENDED_PROP_ID]: ourId,
  };
  if (extra?.eventType) props[EXTENDED_PROP_EVENT_TYPE] = extra.eventType;
  if (extra?.guestCount) props[EXTENDED_PROP_GUEST_COUNT] = extra.guestCount;
  if (extra?.menuLabel) props[EXTENDED_PROP_MENU_LABEL] = extra.menuLabel;
  if (extra?.status) props[EXTENDED_PROP_STATUS] = extra.status;
  return { private: props };
}

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string | null;
  location?: string | null;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

/** Wersja z tokenem (np. z Clerk) – bez potrzeby GOOGLE_CLIENT_ID. */
export async function createCalendarEventWithToken(
  token: string,
  calendarId: string,
  input: GoogleCalendarEventInput,
  ourId: string,
  extra?: EventExtendedProperties
): Promise<string> {
  const body = {
    summary: input.summary,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
    start: input.start,
    end: input.end,
    extendedProperties: extendedProps(ourId, extra),
  };
  const res = await fetch(calendarBase(calendarId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar create failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function createCalendarEvent(
  connection: GoogleCalendarConnection,
  input: GoogleCalendarEventInput,
  ourId: string,
  extra?: EventExtendedProperties
): Promise<string> {
  const token = await getValidAccessToken(connection);
  const calId = connection.calendarId ?? "primary";
  return createCalendarEventWithToken(token, calId, input, ourId, extra);
}

/** Wersja z tokenem (np. z Clerk). */
export async function updateCalendarEventWithToken(
  token: string,
  calendarId: string,
  googleEventId: string,
  input: GoogleCalendarEventInput
): Promise<void> {
  const body = {
    summary: input.summary,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
    start: input.start,
    end: input.end,
  };
  const res = await fetch(`${calendarBase(calendarId)}/${encodeURIComponent(googleEventId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar update failed: ${res.status} ${err}`);
  }
}

export async function updateCalendarEvent(
  connection: GoogleCalendarConnection,
  googleEventId: string,
  input: GoogleCalendarEventInput
): Promise<void> {
  const token = await getValidAccessToken(connection);
  const calId = connection.calendarId ?? "primary";
  return updateCalendarEventWithToken(token, calId, googleEventId, input);
}

/** Wersja z tokenem (np. z Clerk). */
export async function deleteCalendarEventWithToken(
  token: string,
  calendarId: string,
  googleEventId: string
): Promise<void> {
  const res = await fetch(`${calendarBase(calendarId)}/${encodeURIComponent(googleEventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 204 && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Google Calendar delete failed: ${res.status} ${err}`);
  }
}

export async function deleteCalendarEvent(
  connection: GoogleCalendarConnection,
  googleEventId: string
): Promise<void> {
  const token = await getValidAccessToken(connection);
  const calId = connection.calendarId ?? "primary";
  return deleteCalendarEventWithToken(token, calId, googleEventId);
}

export interface SyncedCalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  ourId: string;
  htmlLink?: string;
}

/** Wersja z tokenem (np. z Clerk). */
export async function listSyncedEventsWithToken(
  token: string,
  calendarId: string
): Promise<SyncedCalendarEvent[]> {
  const params = new URLSearchParams({
    privateExtendedProperty: `${EXTENDED_PROP_SOURCE}=true`,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(`${calendarBase(calendarId)}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar list failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
      extendedProperties?: { private?: Record<string, string> };
      htmlLink?: string;
    }>;
  };
  const items = data.items ?? [];
  return items
    .filter((e) => e.extendedProperties?.private?.[EXTENDED_PROP_ID])
    .map((e) => ({
      id: e.id,
      summary: e.summary ?? "",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      ourId: e.extendedProperties!.private![EXTENDED_PROP_ID],
      htmlLink: e.htmlLink,
    }));
}

export async function listSyncedEvents(connection: GoogleCalendarConnection): Promise<SyncedCalendarEvent[]> {
  const token = await getValidAccessToken(connection);
  const calId = connection.calendarId ?? "primary";
  return listSyncedEventsWithToken(token, calId);
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
  timeZone?: string;
}

export async function listCalendars(connection: GoogleCalendarConnection): Promise<GoogleCalendarInfo[]> {
  const token = await getValidAccessToken(connection);
  const res = await fetch(`${CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar list failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      primary?: boolean;
      timeZone?: string;
    }>;
  };
  return (data.items ?? []).map((c) => ({
    id: c.id,
    summary: c.summary ?? c.id,
    primary: c.primary ?? false,
    timeZone: c.timeZone,
  }));
}

export interface ParsedGoogleEvent {
  googleEventId: string;
  summary: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  htmlLink?: string;
  existingOurId?: string;
  extendedProps?: EventExtendedProperties;
}

export async function listAllUpcomingEvents(
  connection: GoogleCalendarConnection,
  calendarId?: string,
  timeMin?: Date,
  maxResults = 50
): Promise<ParsedGoogleEvent[]> {
  const token = await getValidAccessToken(connection);
  const calId = calendarId ?? connection.calendarId ?? "primary";
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(maxResults),
  });
  if (timeMin) params.set("timeMin", timeMin.toISOString());
  const res = await fetch(
    `${calendarBase(calId)}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar upcoming events failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
      extendedProperties?: { private?: Record<string, string> };
      htmlLink?: string;
    }>;
  };
  return (data.items ?? []).map((e) => ({
    googleEventId: e.id,
    summary: e.summary ?? "",
    description: e.description,
    location: e.location,
    startDate: e.start?.dateTime ?? e.start?.date ?? "",
    endDate: e.end?.dateTime ?? e.end?.date ?? "",
    isAllDay: !!e.start?.date,
    htmlLink: e.htmlLink,
    existingOurId: e.extendedProperties?.private?.[EXTENDED_PROP_ID],
    extendedProps: {
      eventType: e.extendedProperties?.private?.[EXTENDED_PROP_EVENT_TYPE],
      guestCount: e.extendedProperties?.private?.[EXTENDED_PROP_GUEST_COUNT],
      menuLabel: e.extendedProperties?.private?.[EXTENDED_PROP_MENU_LABEL],
      status: e.extendedProperties?.private?.[EXTENDED_PROP_STATUS],
    },
  }));
}

export async function updateCalendarEventExtendedProps(
  connection: GoogleCalendarConnection,
  googleEventId: string,
  extra: EventExtendedProperties
): Promise<void> {
  const token = await getValidAccessToken(connection);
  const calId = connection.calendarId ?? "primary";
  const res = await fetch(`${calendarBase(calId)}/${encodeURIComponent(googleEventId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      extendedProperties: extendedProps("pending", extra),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar PATCH extended props failed: ${res.status} ${err}`);
  }
}
