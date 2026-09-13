import {
  buildWelcomeEmailParams,
  getWelcomeEmailHtml,
  getWelcomeEmailSubject,
  getWelcomeCtaUrl,
} from "./welcome-email";

describe("welcome-email", () => {
  it("builds PL subject and CTA to welcome page", () => {
    expect(getWelcomeEmailSubject("pl")).toContain("Planerze Weselnym");
    expect(getWelcomeCtaUrl("https://app.example.com", "pl")).toBe(
      "https://app.example.com/pl/welcome"
    );
  });

  it("includes trial and CTA in HTML", () => {
    const html = getWelcomeEmailHtml(
      buildWelcomeEmailParams({
        firstName: "Anna",
        baseUrl: "https://app.example.com",
        locale: "pl",
      })
    );
    expect(html).toContain("Anna");
    expect(html).toContain("30 dni");
    expect(html).toContain("https://app.example.com/pl/welcome");
    expect(html).toContain("Rozpocznij planowanie");
  });

  it("builds EN variant", () => {
    const html = getWelcomeEmailHtml(
      buildWelcomeEmailParams({
        firstName: "John",
        baseUrl: "https://app.example.com",
        locale: "en",
      })
    );
    expect(html).toContain("Hello, John");
    expect(html).toContain("30-day free trial");
    expect(getWelcomeEmailSubject("en")).toContain("Wedding Board");
  });
});
