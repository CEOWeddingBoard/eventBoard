import { canonicalizeAppOrigin, canonicalizeAppUrl } from "@/lib/env";

describe("canonicalize app URLs", () => {
  it("canonicalizeAppOrigin returns host only", () => {
    expect(canonicalizeAppOrigin("https://weddingboard.pl")).toBe(
      "https://www.weddingboard.pl"
    );
  });

  it("canonicalizeAppUrl preserves partner path and token", () => {
    const input =
      "https://weddingboard.pl/pl/partner/wejscie/abc123token";
    expect(canonicalizeAppUrl(input)).toBe(
      "https://www.weddingboard.pl/pl/partner/wejscie/abc123token"
    );
  });
});
