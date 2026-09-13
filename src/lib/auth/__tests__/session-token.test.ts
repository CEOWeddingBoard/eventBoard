/**
 * @jest-environment node
 */
/**
 * Token sesji — podstawa całej autoryzacji.
 *
 * Middleware przepuszcza żądanie wyłącznie na podstawie tego tokenu, więc
 * podrobiony albo źle zweryfikowany token to wejście do cudzej przestrzeni.
 */

import {
  createSessionToken,
  verifySessionToken,
  readSessionTokenFromRequest,
  AUTH_SESSION_COOKIE,
  AUTH_SESSION_MAX_AGE_SEC,
} from "@/lib/auth/session-token";

const KONTO = {
  sub: "user-77",
  email: "manager@dworek.pl",
  role: "STAFF",
  name: "Anna Kowalska",
};

describe("createSessionToken / verifySessionToken", () => {
  it("zwraca dane konta po weryfikacji", async () => {
    const token = await createSessionToken(KONTO);
    const payload = await verifySessionToken(token);

    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({
      type: "user",
      sub: KONTO.sub,
      email: KONTO.email,
      role: KONTO.role,
    });
  });

  it("zapisuje brak nazwiska jako null, nie undefined", async () => {
    const token = await createSessionToken({ ...KONTO, name: null });
    const payload = await verifySessionToken(token);
    expect(payload?.name).toBeNull();
  });

  it("odrzuca token z naruszonym podpisem", async () => {
    const token = await createSessionToken(KONTO);
    const czesci = token.split(".");
    const podrobiony = [czesci[0], czesci[1], "aaaaaaaaaaaaaaaaaaaa"].join(".");
    expect(await verifySessionToken(podrobiony)).toBeNull();
  });

  it("odrzuca śmieci zamiast tokenu", async () => {
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("nie.jest.tokenem")).toBeNull();
  });

  it("odrzuca token po upływie ważności", async () => {
    jest.useFakeTimers();
    try {
      const token = await createSessionToken(KONTO);
      jest.setSystemTime(Date.now() + (AUTH_SESSION_MAX_AGE_SEC + 60) * 1000);
      expect(await verifySessionToken(token)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("sesja trwa siedem dni", () => {
    expect(AUTH_SESSION_MAX_AGE_SEC).toBe(60 * 60 * 24 * 7);
  });
});

describe("readSessionTokenFromRequest", () => {
  it("wyciąga token z nagłówka cookie obok innych ciasteczek", () => {
    const token = "abc.def.ghi";
    const header = `theme=dark; ${AUTH_SESSION_COOKIE}=${token}; eb_active_org=org-1`;
    expect(readSessionTokenFromRequest(header)).toBe(token);
  });

  it("zwraca null, gdy ciasteczka sesji nie ma", () => {
    expect(readSessionTokenFromRequest("theme=dark")).toBeNull();
    expect(readSessionTokenFromRequest(null)).toBeNull();
  });
});
