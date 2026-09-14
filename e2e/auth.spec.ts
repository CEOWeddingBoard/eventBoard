import { test, expect } from "@playwright/test";

/**
 * Brama sesji i widoczność paneli.
 *
 * Wcześniej ten plik sprawdzał tytuł strony `/pl/sign-in` — trasy z czasów
 * logowania przez Clerk. Teraz pilnuje rzeczy, które realnie chronią produkt
 * i nie wymagają kont testowych: że panel obiektu nie wpuszcza bez sesji,
 * że panel administratora nie zdradza swojego istnienia, i że portal klienta
 * nie otwiera się na zmyślony token.
 */

test.describe("Brama sesji", () => {
  test("logowanie jest pod /pl/auth i pokazuje formularz", async ({ page }) => {
    await page.goto("/pl/auth");
    // Formularz, nie nagłówek: nagłówek zmienia się zależnie od tego, czy link
    // niósł nazwę przestrzeni. Pola e-mail i hasło są tam zawsze.
    await expect(page.locator("#signin-email")).toBeVisible();
    await expect(page.locator("#signin-password")).toBeVisible();
  });

  test("panel obiektu bez sesji przekierowuje na logowanie", async ({ page }) => {
    await page.goto("/pl/app/dashboard");
    await expect(page).toHaveURL(/\/pl\/auth/);
  });

  test("kalendarz i eventy też są za bramą", async ({ page }) => {
    for (const sciezka of ["/pl/app/calendar", "/pl/app/events"]) {
      await page.goto(sciezka);
      await expect(page).toHaveURL(/\/pl\/auth/);
    }
  });
});

test.describe("Panel administratora platformy", () => {
  // Celowo NIE przekierowuje na logowanie: przekierowanie zdradzałoby, że panel
  // istnieje. Dla nie-admina ma być zwykłe 404.
  test("dla niezalogowanego zwraca 404, nie przekierowanie", async ({ page }) => {
    const odpowiedz = await page.goto("/pl/admin");
    expect(odpowiedz?.status()).toBe(404);
    await expect(page).toHaveURL(/\/pl\/admin/);
  });
});

test.describe("Portal klienta", () => {
  test("zmyślony token nie otwiera portalu", async ({ page }) => {
    await page.goto("/pl/portal/token-ktorego-nie-ma-1234567890");
    await expect(page.getByText(/Link jest nieaktualny/i)).toBeVisible();
  });

  test("komunikat nie rozróżnia tokenu nieznanego od wygasłego", async ({ page }) => {
    await page.goto("/pl/portal/inny-zmyslony-token-0987654321");
    const tresc = await page.locator("body").innerText();
    // Komunikat mówi „wygasł ALBO został unieważniony” — celowo nie wskazuje,
    // który przypadek zaszedł. Zdradzałoby to, które tokeny istnieją.
    expect(tresc).toMatch(/Link jest nieaktualny/i);
    expect(tresc).not.toMatch(/nie istnieje|nieznany token|nie znaleziono/i);
  });
});
