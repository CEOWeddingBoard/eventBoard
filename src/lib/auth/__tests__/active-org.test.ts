/**
 * Izolacja danych między klientami.
 *
 * Konto serwisowe jest członkiem KAŻDEJ przestrzeni. Poprzednia wersja brała
 * „najstarsze członkostwo", więc admin, który wszedł w przestrzeń klienta B,
 * zapisywał dane u klienta A. Te testy pilnują, żeby to nie wróciło.
 */

const cookieStore = { value: null as string | null };

jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "eb_active_org" && cookieStore.value
        ? { name, value: cookieStore.value }
        : undefined,
  }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organizationMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getActiveOrgId, requireOrgId, OrgContextError } from "@/lib/auth/active-org";

const memberOf = prisma.organizationMember.findFirst as jest.Mock;
const allMemberships = prisma.organizationMember.findMany as jest.Mock;

const USER = "user-1";

beforeEach(() => {
  jest.clearAllMocks();
  cookieStore.value = null;
});

describe("aktywna przestrzeń wskazana ciasteczkiem", () => {
  it("zwraca przestrzeń z ciasteczka, nie najstarsze członkostwo", async () => {
    cookieStore.value = "org-klient-B";
    memberOf.mockResolvedValue({ id: "m-2", organizationId: "org-klient-B" });

    await expect(getActiveOrgId(USER)).resolves.toBe("org-klient-B");
    await expect(requireOrgId(USER)).resolves.toBe("org-klient-B");

    // Zapytanie musi być ograniczone do organizacji z ciasteczka.
    expect(memberOf).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER, organizationId: "org-klient-B" },
      }),
    );
    expect(allMemberships).not.toHaveBeenCalled();
  });

  it("nie wpuszcza do przestrzeni, do której użytkownik nie należy", async () => {
    cookieStore.value = "org-obca";
    memberOf.mockResolvedValue(null);

    await expect(getActiveOrgId(USER)).resolves.toBeNull();
    await expect(requireOrgId(USER)).rejects.toThrow(OrgContextError);
  });
});

describe("brak ciasteczka", () => {
  it("zwraca jedyne członkostwo, gdy nie ma czego mylić", async () => {
    allMemberships.mockResolvedValue([{ id: "m-1", organizationId: "org-jedyna" }]);

    await expect(getActiveOrgId(USER)).resolves.toBe("org-jedyna");
    await expect(requireOrgId(USER)).resolves.toBe("org-jedyna");
  });

  it("odmawia wyboru, gdy konto należy do kilku przestrzeni (konto serwisowe)", async () => {
    allMemberships.mockResolvedValue([
      { id: "m-1", organizationId: "org-klient-A" },
      { id: "m-2", organizationId: "org-klient-B" },
    ]);

    // Stara implementacja zwracała tu „org-klient-A" — najstarsze członkostwo.
    await expect(getActiveOrgId(USER)).resolves.toBeNull();
    await expect(requireOrgId(USER)).rejects.toThrow(OrgContextError);
  });

  it("odmawia, gdy konto nie należy do żadnej przestrzeni", async () => {
    allMemberships.mockResolvedValue([]);

    await expect(getActiveOrgId(USER)).resolves.toBeNull();
    await expect(requireOrgId(USER)).rejects.toThrow(OrgContextError);
  });
});
