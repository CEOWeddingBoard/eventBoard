import { cookies } from "next/headers";

export const ACTIVE_EVENT_COOKIE = "activeEventId";

export async function getActiveEventIdFromCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACTIVE_EVENT_COOKIE)?.value;
}
