import { test, expect } from "@playwright/test";

/**
 * Izolacja danych między przestrzeniami klientów (Faza 3 planu naprawy).
 *
 * Scenariusz: konto serwisowe należy do każdej przestrzeni. Wchodzi w przestrzeń
 * klienta B, zakłada event i sprawdza, że event NIE pojawił się u klienta A.
 *
 * Wymaga prawdziwej bazy i konta admina platformy — uruchom z:
 *   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npx playwright test tenant-isolation
 * Bez tych zmiennych test jest pomijany, żeby nie wywracać CI bez środowiska.
 */

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("Izolacja przestrzeni klientów", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "Brak E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD — test wymaga konta admina platformy.",
  );

  test("event założony po wejściu w przestrzeń B nie trafia do przestrzeni A", async ({ page }) => {
    await page.goto("/pl/auth");
    await page.getByLabel(/e-mail/i).fill(EMAIL!);
    await page.getByLabel(/hasło/i).fill(PASSWORD!);
    await page.getByRole("button", { name: /zaloguj/i }).click();
    await page.waitForURL(/\/pl\/(app|admin)/);

    // Panel administratora platformy — lista przestrzeni.
    await page.goto("/pl/admin");
    const spaces = page.getByTestId("admin-space-row");
    await expect(spaces.first()).toBeVisible();
    expect(await spaces.count()).toBeGreaterThanOrEqual(2);

    const spaceA = spaces.nth(0);
    const spaceB = spaces.nth(1);
    const nameA = (await spaceA.getByTestId("space-name").innerText()).trim();
    const nameB = (await spaceB.getByTestId("space-name").innerText()).trim();

    // Wejście w przestrzeń B.
    await spaceB.getByRole("button", { name: /wejdź w przestrzeń/i }).click();
    await page.waitForURL(/\/pl\/app/);
    await expect(page.getByText(new RegExp(nameB, "i"))).toBeVisible();

    const eventName = `E2E izolacja ${Date.now()}`;
    await page.goto("/pl/app/events");
    await page.getByRole("button", { name: /nowy event|dodaj event/i }).click();
    await page.getByLabel(/nazwa/i).fill(eventName);
    await page.getByLabel(/data/i).fill("2030-06-15");
    await page.getByRole("button", { name: /utwórz|zapisz/i }).click();
    await expect(page.getByText(eventName)).toBeVisible();

    // Przejście do przestrzeni A — eventu tam być nie może.
    await page.goto("/pl/admin");
    await spaceA.getByRole("button", { name: /wejdź w przestrzeń/i }).click();
    await page.waitForURL(/\/pl\/app/);
    await page.goto("/pl/app/events");
    await expect(page.getByText(new RegExp(nameA, "i"))).toBeVisible();
    await expect(page.getByText(eventName)).toHaveCount(0);
  });
});
