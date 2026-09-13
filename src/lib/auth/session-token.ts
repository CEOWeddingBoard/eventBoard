import { SignJWT, jwtVerify } from "jose";

export const AUTH_SESSION_COOKIE = "wb_session";
export const AUTH_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 dni

export type UserSessionPayload = {
  type: "user";
  sub: string; // User.id
  email: string;
  role: string;
  name: string | null;
};

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.PARTNER_ACCESS_SECRET?.trim() ||
    "dev-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: Omit<UserSessionPayload, "type">,
): Promise<string> {
  return new SignJWT({
    type: "user" as const,
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "user") return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      type: "user",
      sub: payload.sub,
      email: payload.email,
      role: typeof payload.role === "string" ? payload.role : "STAFF",
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

/** Cookie z nagłówka requestu — edge-safe (middleware). */
export function readSessionTokenFromRequest(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === AUTH_SESSION_COOKIE) {
      return rest.join("=") || null;
    }
  }
  return null;
}

/** Weryfikacja sesji z surowego nagłówka Cookie (edge-safe, bez prisma). */
export async function getSessionPayloadFromRequest(
  cookieHeader: string | null | undefined,
): Promise<UserSessionPayload | null> {
  const token = readSessionTokenFromRequest(cookieHeader);
  if (!token) return null;
  return verifySessionToken(token);
}
