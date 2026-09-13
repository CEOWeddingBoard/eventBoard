import { cookies } from "next/headers";
import {
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SEC,
  verifySessionToken,
  type UserSessionPayload,
} from "./session-token";

/** Serwer (server components / actions): sesja z cookies(). */
export async function getSessionPayloadFromCookies(): Promise<UserSessionPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
