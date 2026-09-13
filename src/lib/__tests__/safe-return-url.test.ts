import { safeReturnUrl } from "@/lib/safe-return-url";

describe("safeReturnUrl", () => {
  it("allows same-locale relative paths", () => {
    expect(safeReturnUrl("/pl/wedding-client/abc123", "pl")).toBe(
      "/pl/wedding-client/abc123",
    );
  });

  it("rejects other locales and external URLs", () => {
    expect(safeReturnUrl("/en/dashboard", "pl")).toBeNull();
    expect(safeReturnUrl("https://evil.com", "pl")).toBeNull();
    expect(safeReturnUrl("/pl//evil", "pl")).toBeNull();
  });
});
