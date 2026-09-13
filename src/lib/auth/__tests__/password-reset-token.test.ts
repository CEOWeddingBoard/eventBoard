/**
 * @jest-environment node
 */
/**
 * Token resetu hasła: ważny godzinę, jednorazowy.
 *
 * Jednorazowość nie ma osobnej kolumny w bazie — klucz podpisu zawiera bieżący
 * skrót hasła, więc zmiana hasła unieważnia token. Te testy pilnują tej własności,
 * bo nie widać jej z samego kodu wywołującego.
 */

import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  readSubjectFromResetToken,
  PASSWORD_RESET_TTL_SEC,
} from "@/lib/auth/password-reset-token";

const USER = {
  id: "user-123",
  email: "klient@sala.pl",
  password: "$2a$10$staryskrothasla000000000000000000000000000000000000",
};

const PO_ZMIANIE = "$2a$10$nowyskrothasla1111111111111111111111111111111111111";

describe("token resetu hasła", () => {
  it("weryfikuje się dla właściwego użytkownika", async () => {
    const token = await createPasswordResetToken(USER);
    const payload = await verifyPasswordResetToken(token, USER.password);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe(USER.id);
    expect(payload?.email).toBe(USER.email);
  });

  it("przestaje działać po zmianie hasła — czyli nie da się użyć dwa razy", async () => {
    const token = await createPasswordResetToken(USER);
    expect(await verifyPasswordResetToken(token, USER.password)).not.toBeNull();

    // Po skutecznym resecie skrót hasła w bazie jest już inny.
    expect(await verifyPasswordResetToken(token, PO_ZMIANIE)).toBeNull();
  });

  it("unieważnia też starsze tokeny tego samego użytkownika", async () => {
    const pierwszy = await createPasswordResetToken(USER);
    const drugi = await createPasswordResetToken(USER);

    expect(await verifyPasswordResetToken(pierwszy, PO_ZMIANIE)).toBeNull();
    expect(await verifyPasswordResetToken(drugi, PO_ZMIANIE)).toBeNull();
  });

  it("odrzuca token podrobiony lub uszkodzony", async () => {
    const token = await createPasswordResetToken(USER);
    const zepsuty = token.slice(0, -3) + "aaa";

    expect(await verifyPasswordResetToken(zepsuty, USER.password)).toBeNull();
    expect(await verifyPasswordResetToken("zupelnie.nie.token", USER.password)).toBeNull();
  });

  it("odrzuca token wygasły", async () => {
    jest.useFakeTimers();
    try {
      const token = await createPasswordResetToken(USER);
      jest.setSystemTime(Date.now() + (PASSWORD_RESET_TTL_SEC + 60) * 1000);
      expect(await verifyPasswordResetToken(token, USER.password)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("pozwala odczytać właściciela tokenu bez weryfikacji podpisu", async () => {
    const token = await createPasswordResetToken(USER);
    expect(readSubjectFromResetToken(token)).toBe(USER.id);
    expect(readSubjectFromResetToken("nie-token")).toBeNull();
  });
});
