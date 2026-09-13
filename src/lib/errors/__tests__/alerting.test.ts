/**
 * @jest-environment node
 */
/**
 * Alerty o awarii.
 *
 * `sendServerErrorAlert` jest wyciszony w NODE_ENV=test (żeby testy nie wysyłały
 * maili), więc tutaj podmieniamy środowisko i mockujemy Resend.
 */

const wyslane: Array<{ to: string; subject: string; text: string }> = [];

jest.mock("resend", () => ({
  Resend: class {
    emails = {
      send: async (msg: { to: string; subject: string; text: string }) => {
        wyslane.push(msg);
        return { id: "test" };
      },
    };
  },
}));

import { sendServerErrorAlert, resetAlertDedupForTests } from "@/lib/errors/alerting";

async function wProdukcji(fn: () => Promise<void>) {
  const prev = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  try {
    await fn();
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prev;
  }
}

beforeEach(() => {
  wyslane.length = 0;
  resetAlertDedupForTests();
  process.env.ALERT_EMAIL = "dyzur@kodalabs.pl";
  process.env.RESEND_API_KEY = "re_test";
  delete process.env.ALERT_SMS_TO;
});

describe("sendServerErrorAlert", () => {
  it("wysyła e-mail przy błędzie 5xx", async () => {
    await wProdukcji(async () => {
      await sendServerErrorAlert({ message: "Baza nie odpowiada", statusCode: 500, path: "/pl/app/events" });
    });

    expect(wyslane).toHaveLength(1);
    expect(wyslane[0].to).toBe("dyzur@kodalabs.pl");
    expect(wyslane[0].subject).toContain("500");
    expect(wyslane[0].text).toContain("Baza nie odpowiada");
    expect(wyslane[0].text).toContain("/pl/app/events");
  });

  it("milczy przy błędach 4xx — to nie awaria", async () => {
    await wProdukcji(async () => {
      await sendServerErrorAlert({ message: "Nie znaleziono", statusCode: 404 });
    });
    expect(wyslane).toHaveLength(0);
  });

  it("nie zasypuje skrzynki powtórką tego samego błędu", async () => {
    await wProdukcji(async () => {
      const awaria = { message: "Baza nie odpowiada", statusCode: 500, path: "/pl/app/events" };
      await sendServerErrorAlert(awaria);
      await sendServerErrorAlert(awaria);
      await sendServerErrorAlert(awaria);
    });
    expect(wyslane).toHaveLength(1);
  });

  it("inny błąd przechodzi mimo tłumienia poprzedniego", async () => {
    await wProdukcji(async () => {
      await sendServerErrorAlert({ message: "Baza nie odpowiada", statusCode: 500 });
      await sendServerErrorAlert({ message: "Timeout płatności", statusCode: 500 });
    });
    expect(wyslane).toHaveLength(2);
  });

  it("nie wysyła nic bez skonfigurowanego odbiorcy", async () => {
    delete process.env.ALERT_EMAIL;
    await wProdukcji(async () => {
      await sendServerErrorAlert({ message: "Baza nie odpowiada", statusCode: 500 });
    });
    expect(wyslane).toHaveLength(0);
  });

  it("w środowisku testowym milczy nawet przy 5xx", async () => {
    await sendServerErrorAlert({ message: "Baza nie odpowiada", statusCode: 500 });
    expect(wyslane).toHaveLength(0);
  });
});
