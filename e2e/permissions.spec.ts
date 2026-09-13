import { test, expect } from "@playwright/test";

/**
 * Uprawnienia modułowe w przeglądarce (Faza 6 planu naprawy).
 *
 * Trzy poziomy: brak / podgląd / edycja. Test jednostkowy pilnuje samej reguły
 * (src/lib/permissions/__tests__/guard.test.ts); tutaj sprawdzamy, że interfejs
 * faktycznie się do niej stosuje.
 *
 * Wymaga trzech kont w jednej przestrzeni, po jednym na poziom:
 *   E2E_NONE_EMAIL / E2E_VIEW_EMAIL / E2E_EDIT_EMAIL  (+ *_PASSWORD)
 */

type Level = "none" | "view" | "edit";

const ACCOUNTS: Record<Level, { email?: string; password?: string }> = {
  none: { email: process.env.E2E_NONE_EMAIL, password: process.env.E2E_NONE_PASSWORD },
  view: { email: process.env.E2E_VIEW_EMAIL, password: process.env.E2E_VIEW_PASSWORD },
  edit: { email: process.env.E2E_EDIT_EMAIL, password: process.env.E2E_EDIT_PASSWORD },
};

const configured = Object.values(ACCOUNTS).every((a) => a.email && a.password);

test.describe("Uprawnienia modułowe — moduł Eventy", () => {
  test.skip(!configured, "Brak kont testowych E2E_{NONE,VIEW,EDIT}_EMAIL / _PASSWORD.");

  async function loginAs(page: import("@playwright/test").Page, level: Level) {
    const { email, password } = ACCOUNTS[level];
    await page.goto("/pl/auth");
    await page.getByLabel(/e-mail/i).fill(email!);
    await page.getByLabel(/hasło/i).fill(password!);
    await page.getByRole("button", { name: /zaloguj/i }).click();
    await page.waitForURL(/\/pl\/app/);
  }

  test("brak dostępu — moduł nie jest widoczny i wejście odbija na pulpit", async ({ page }) => {
    await loginAs(page, "none");
    await expect(page.getByRole("link", { name: "Eventy" })).toHaveCount(0);
    await page.goto("/pl/app/events");
    await expect(page).toHaveURL(/\/pl\/app\/dashboard/);
  });

  test("podgląd — lista widoczna, bez przycisków zapisu", async ({ page }) => {
    await loginAs(page, "view");
    await page.goto("/pl/app/events");
    await expect(page).toHaveURL(/\/pl\/app\/events/);
    await expect(page.getByRole("heading", { name: "Eventy" })).toBeVisible();
    await expect(page.getByRole("button", { name: /nowy event/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /więcej działań/i })).toHaveCount(0);
  });

  test("edycja — przyciski zapisu dostępne", async ({ page }) => {
    await loginAs(page, "edit");
    await page.goto("/pl/app/events");
    await expect(page.getByRole("button", { name: /nowy event/i })).toBeVisible();
  });
});
