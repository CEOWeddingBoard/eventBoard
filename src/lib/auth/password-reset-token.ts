import { SignJWT, jwtVerify, decodeJwt } from "jose";

/**
 * Token resetu hasła — jednorazowy, podpisany, ważny godzinę.
 *
 * Jednorazowość bez nowej kolumny w bazie: klucz podpisu zawiera bieżący skrót
 * hasła użytkownika. Po ustawieniu nowego hasła skrót się zmienia, więc każdy
 * wcześniej wydany token przestaje weryfikować się sam z siebie — również ten,
 * którym właśnie zmieniono hasło.
 */

export const PASSWORD_RESET_TTL_SEC = 60 * 60; // 1 godzina

type ResetPayload = {
  type: "pwreset";
  sub: string;
  email: string;
};

function baseSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.PARTNER_ACCESS_SECRET?.trim() ||
    "dev-auth-secret-change-me"
  );
}

/** Klucz związany z konkretnym użytkownikiem i jego aktualnym hasłem. */
function keyFor(passwordHash: string): Uint8Array {
  return new TextEncoder().encode(`${baseSecret()}:pwreset:${passwordHash}`);
}

export async function createPasswordResetToken(user: {
  id: string;
  email: string;
  password: string;
}): Promise<string> {
  return new SignJWT({ type: "pwreset", sub: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PASSWORD_RESET_TTL_SEC}s`)
    .sign(keyFor(user.password));
}

/** ID użytkownika zapisane w tokenie — bez weryfikacji podpisu. */
export function readSubjectFromResetToken(token: string): string | null {
  try {
    const payload = decodeJwt(token);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Weryfikuje token względem aktualnego skrótu hasła. `null` = token nieważny,
 * wygasły albo już zużyty (hasło zdążyło się zmienić).
 */
export async function verifyPasswordResetToken(
  token: string,
  currentPasswordHash: string,
): Promise<ResetPayload | null> {
  try {
    const { payload } = await jwtVerify(token, keyFor(currentPasswordHash));
    if (payload.type !== "pwreset") return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return { type: "pwreset", sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
