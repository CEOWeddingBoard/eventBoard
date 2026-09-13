/**
 * @jest-environment node
 */
/**
 * Uwierzytelnienie endpointów maszynowych.
 *
 * Crony wysyłają SMS-y i e-maile do klientów obiektu, więc otwarty endpoint to
 * zarówno koszt, jak i sposób na nękanie ich klientów. Najważniejszy przypadek:
 * brak `CRON_SECRET` w środowisku ma zamykać crony, a nie otwierać.
 */

import { isValidCronSecret } from "@/lib/api/cron-auth";

type FakeReq = {
  headers: Headers;
  nextUrl: { searchParams: URLSearchParams };
};

function req(opts: { header?: string; query?: string }): FakeReq {
  return {
    headers: new Headers(opts.header ? { "x-cron-secret": opts.header } : {}),
    nextUrl: { searchParams: new URLSearchParams(opts.query ? { secret: opts.query } : {}) },
  };
}

const call = (r: FakeReq) => isValidCronSecret(r as unknown as Parameters<typeof isValidCronSecret>[0]);

describe("isValidCronSecret", () => {
  const poprzedni = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "tajne-haslo-crona";
  });

  afterAll(() => {
    if (poprzedni === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = poprzedni;
  });

  it("przepuszcza poprawny sekret w nagłówku", () => {
    expect(call(req({ header: "tajne-haslo-crona" }))).toBe(true);
  });

  it("przepuszcza poprawny sekret w query — dla zgodności ze starym harmonogramem", () => {
    expect(call(req({ query: "tajne-haslo-crona" }))).toBe(true);
  });

  it("odrzuca zły sekret", () => {
    expect(call(req({ header: "nie-ten" }))).toBe(false);
    expect(call(req({ query: "nie-ten" }))).toBe(false);
  });

  it("odrzuca brak sekretu", () => {
    expect(call(req({}))).toBe(false);
  });

  it("odrzuca pusty sekret", () => {
    expect(call(req({ header: "   " }))).toBe(false);
  });

  it("BRAK CRON_SECRET w środowisku zamyka crony, nie otwiera ich", () => {
    delete process.env.CRON_SECRET;
    expect(call(req({ header: "cokolwiek" }))).toBe(false);
    expect(call(req({}))).toBe(false);
  });

  it("pusty CRON_SECRET też zamyka", () => {
    process.env.CRON_SECRET = "   ";
    expect(call(req({ header: "   " }))).toBe(false);
  });
});
