/**
 * @jest-environment node
 */
/**
 * Trwały licznik prób logowania.
 *
 * Najważniejsze zachowanie nie jest oczywiste z kodu: **awaria bazy nie może
 * zablokować logowania wszystkim**. Licznik ma hamować zgadywanie haseł, a nie
 * być kolejnym pojedynczym punktem awarii.
 */

const store: { row: { key: string; count: number; expiresAt: Date } | null; padnie: boolean } = {
  row: null,
  padnie: false,
};

jest.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimitHit: {
      findUnique: jest.fn(async () => {
        if (store.padnie) throw new Error("baza nie odpowiada");
        return store.row;
      }),
      upsert: jest.fn(async ({ where, create }: { where: { key: string }; create: { key: string; count: number; expiresAt: Date } }) => {
        store.row = { key: where.key, count: create.count, expiresAt: create.expiresAt };
        return store.row;
      }),
      update: jest.fn(async () => {
        store.row = { ...store.row!, count: store.row!.count + 1 };
        return store.row;
      }),
      deleteMany: jest.fn(async () => {
        store.row = null;
        return { count: 1 };
      }),
    },
  },
}));

import {
  checkPersistentRateLimit,
  clearPersistentRateLimit,
} from "@/lib/api/rate-limit-db";

const OPCJE = { key: "login:email:klient@sala.pl", limit: 3, windowMs: 60_000 };

async function wProdukcji<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  try {
    return await fn();
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prev;
  }
}

beforeEach(() => {
  store.row = null;
  store.padnie = false;
  jest.clearAllMocks();
});

describe("checkPersistentRateLimit", () => {
  it("przepuszcza do wyczerpania limitu, potem odmawia", async () => {
    await wProdukcji(async () => {
      expect((await checkPersistentRateLimit(OPCJE)).ok).toBe(true);
      expect((await checkPersistentRateLimit(OPCJE)).ok).toBe(true);
      expect((await checkPersistentRateLimit(OPCJE)).ok).toBe(true);
      expect((await checkPersistentRateLimit(OPCJE)).ok).toBe(false);
    });
  });

  it("odlicza pozostałe próby", async () => {
    await wProdukcji(async () => {
      expect((await checkPersistentRateLimit(OPCJE)).remaining).toBe(2);
      expect((await checkPersistentRateLimit(OPCJE)).remaining).toBe(1);
    });
  });

  it("po upływie okna licznik startuje od nowa", async () => {
    await wProdukcji(async () => {
      store.row = {
        key: OPCJE.key,
        count: 99,
        expiresAt: new Date(Date.now() - 1000),
      };
      expect((await checkPersistentRateLimit(OPCJE)).ok).toBe(true);
      expect(store.row!.count).toBe(1);
    });
  });

  it("awaria bazy nie blokuje logowania", async () => {
    await wProdukcji(async () => {
      store.padnie = true;
      const wynik = await checkPersistentRateLimit(OPCJE);
      expect(wynik.ok).toBe(true);
    });
  });

  it("w środowisku testowym nie liczy niczego", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await checkPersistentRateLimit(OPCJE)).ok).toBe(true);
    }
  });
});

describe("clearPersistentRateLimit", () => {
  it("kasuje licznik po udanym logowaniu", async () => {
    await wProdukcji(async () => {
      await checkPersistentRateLimit(OPCJE);
      expect(store.row).not.toBeNull();
      await clearPersistentRateLimit(OPCJE.key);
      expect(store.row).toBeNull();
    });
  });
});
