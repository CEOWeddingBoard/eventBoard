/**
 * @jest-environment node
 */
/**
 * Przypisywanie wzorca procesu do przestrzeni klienta.
 *
 * Przypisanie jest KOPIĄ — klient może zmieniać proces u siebie. Dlatego drugie
 * kliknięcie tego samego wzorca dałoby mu dwa identyczne procesy na liście
 * i żadnej podpowiedzi, który jest właściwy.
 */

type Workflow = { id: string; organizationId: string; name: string; description: string | null; eventType: string | null; isDefault: boolean; nodes: unknown[] };

const store: { workflows: Workflow[] } = { workflows: [] };

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/lib/auth/utils", () => ({
  getCurrentUser: jest.fn(async () => ({ id: "admin-1", email: "admin@kodalabs.pl", name: "Admin" })),
}));

const utworzoneWorkflow: Array<{ organizationId: string; name: string }> = [];

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(async () => ({ id: "admin-1", role: "ADMIN", isActive: true })) },
    organization: {
      findUnique: jest.fn(async ({ where }: { where: { id?: string; slug?: string } }) =>
        where.id === "org-klient" ? { id: "org-klient" } : null,
      ),
    },
    organizationWorkflow: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        store.workflows.find((w) => w.id === where.id) ?? null,
      ),
      findFirst: jest.fn(async ({ where }: { where: { organizationId: string; name: string } }) =>
        store.workflows.find(
          (w) => w.organizationId === where.organizationId && w.name === where.name,
        ) ?? null,
      ),
      create: jest.fn(async ({ data }: { data: { organizationId: string; name: string } }) => {
        utworzoneWorkflow.push(data);
        const created = { ...data, id: "wf-nowy-" + utworzoneWorkflow.length, nodes: [] } as unknown as Workflow;
        store.workflows.push({ ...created, description: null, eventType: null, isDefault: false });
        return created;
      }),
    },
    workflowNode: { create: jest.fn(async () => ({ id: "n-1" })), update: jest.fn(async () => ({})) },
  },
}));

import { assignProcessToSpace } from "@/lib/actions/admin.actions";

beforeEach(() => {
  jest.clearAllMocks();
  utworzoneWorkflow.length = 0;
  store.workflows = [
    {
      id: "wf-wzorzec",
      organizationId: "org-biblioteka",
      name: "Wesele — pełna obsługa",
      description: null,
      eventType: "WEDDING",
      isDefault: false,
      nodes: [],
    },
  ];
});

describe("assignProcessToSpace", () => {
  it("kopiuje wzorzec do przestrzeni klienta", async () => {
    const wynik = await assignProcessToSpace("wf-wzorzec", "org-klient");

    expect(wynik.ok).toBe(true);
    expect(utworzoneWorkflow).toHaveLength(1);
    expect(utworzoneWorkflow[0]).toMatchObject({
      organizationId: "org-klient",
      name: "Wesele — pełna obsługa",
    });
  });

  it("drugie przypisanie tego samego wzorca nie tworzy drugiej kopii", async () => {
    await assignProcessToSpace("wf-wzorzec", "org-klient");
    const drugie = await assignProcessToSpace("wf-wzorzec", "org-klient");

    expect(drugie.ok).toBe(false);
    expect(drugie.error).toContain("jest już w tej przestrzeni");
    expect(utworzoneWorkflow).toHaveLength(1);
  });

  it("odmawia, gdy przestrzeń docelowa nie istnieje", async () => {
    const wynik = await assignProcessToSpace("wf-wzorzec", "org-nieistnieje");

    expect(wynik.ok).toBe(false);
    expect(wynik.error).toContain("przestrzeni docelowej");
    expect(utworzoneWorkflow).toHaveLength(0);
  });

  it("odmawia, gdy wzorca nie ma", async () => {
    const wynik = await assignProcessToSpace("wf-nie-ma", "org-klient");

    expect(wynik.ok).toBe(false);
    expect(wynik.error).toContain("procesu-wzorca");
  });
});
