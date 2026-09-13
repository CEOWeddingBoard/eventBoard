/**
 * @jest-environment node
 */
/**
 * Test integracyjny rdzenia produktu: proces → agenda.
 *
 * Agenda nie ma własnej konfiguracji — składa się wyłącznie z tego, co kroki
 * procesu do niej oddają. Ten test przechodzi całą drogę: dane wpisane na kroku
 * → mapowania i pola kroku → płaski `EventAgendaData.dataJson` → przejście do
 * następnego węzła. Baza jest podmieniona na magazyn w pamięci, ale logika
 * `completeProcessNode` jest prawdziwa.
 */

type Node = {
  id: string;
  name: string;
  sortOrder: number;
  actionType: string;
  nextNodeId: string | null;
  conditionsJson: string;
  fieldMappingsJson: string;
  fieldsJson: string;
};

const store: {
  agenda: Record<string, string>;
  state: { eventId: string; workflowId: string; currentNodeId: string; completedNodeIds: string; nodeDataJson: string } | null;
  nodes: Node[];
  historia: Array<{ fromStage?: string; toStage: string }>;
  powiadomienia: Array<{ title: string }>;
  eventDostepny: boolean;
} = { agenda: {}, state: null, nodes: [], historia: [], powiadomienia: [], eventDostepny: true };

const sesja: { user: { id: string } | null; orgId: string | null } = {
  user: { id: "manager-1" },
  orgId: "org-1",
};

jest.mock("@/lib/auth/utils", () => ({
  getCurrentUser: jest.fn(async () => sesja.user),
}));

jest.mock("@/lib/auth/active-org", () => ({
  getActiveOrgId: jest.fn(async () => sesja.orgId),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    eventProcessState: {
      findUnique: jest.fn(async () => store.state),
      update: jest.fn(async ({ data }: { data: Record<string, string> }) => {
        store.state = { ...store.state!, ...data } as typeof store.state;
        return store.state;
      }),
    },
    organizationWorkflow: {
      findUnique: jest.fn(async () => ({ id: "wf-1", name: "Wesele", nodes: store.nodes })),
    },
    eventAgendaData: {
      findUnique: jest.fn(async ({ where }: { where: { eventId: string } }) =>
        store.agenda[where.eventId] ? { dataJson: store.agenda[where.eventId] } : null,
      ),
      upsert: jest.fn(async ({ where, create, update }: { where: { eventId: string }; create: { dataJson: string }; update: { dataJson: string } }) => {
        store.agenda[where.eventId] = store.agenda[where.eventId] ? update.dataJson : create.dataJson;
        return { dataJson: store.agenda[where.eventId] };
      }),
    },
    event: {
      update: jest.fn(async () => ({})),
      findFirst: jest.fn(async () =>
        store.eventDostepny ? { organizationId: "org-1", name: "Wesele Kowalskich" } : null,
      ),
    },
    eventWorkflowHistory: {
      create: jest.fn(async ({ data }: { data: { fromStage?: string; toStage: string } }) => {
        store.historia.push(data);
        return data;
      }),
    },
    orgNotification: {
      create: jest.fn(async ({ data }: { data: { title: string } }) => {
        store.powiadomienia.push(data);
        return data;
      }),
    },
  },
}));

import { completeProcessNode } from "@/lib/actions/process-runtime.actions";

const EVENT = "event-1";

function node(over: Partial<Node> & { id: string; name: string }): Node {
  return {
    sortOrder: 0,
    actionType: "NONE",
    nextNodeId: null,
    conditionsJson: "[]",
    fieldMappingsJson: "[]",
    fieldsJson: "[]",
    ...over,
  };
}

function ustawProces(nodes: Node[], currentNodeId = nodes[0].id) {
  store.agenda = {};
  store.historia = [];
  store.powiadomienia = [];
  store.nodes = nodes;
  store.eventDostepny = true;
  store.state = {
    eventId: EVENT,
    workflowId: "wf-1",
    currentNodeId,
    completedNodeIds: "[]",
    nodeDataJson: "{}",
  };
}

function agenda(): Record<string, unknown> {
  return store.agenda[EVENT] ? JSON.parse(store.agenda[EVENT]) : {};
}

beforeEach(() => {
  jest.clearAllMocks();
  sesja.user = { id: "manager-1" };
  sesja.orgId = "org-1";
});

const TOKEN = "token-klienta-abcdef0123456789";

describe("pola kroku trafiają do agendy", () => {
  it("wartość pola ląduje pod wskazanym kluczem agendy", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Ustalenia wstępne",
        fieldsJson: JSON.stringify([
          { key: "liczbaGosci", label: "Liczba gości", type: "number", targetAgendaKey: "agenda.liczbaGosci" },
          { key: "tort", label: "Tort", type: "text", targetAgendaKey: "agenda.tort" },
        ]),
      }),
    ]);

    await completeProcessNode(EVENT, "n1", { liczbaGosci: 120, tort: "Trzypiętrowy, bez orzechów" }, "ORGANIZER");

    expect(agenda()["agenda.liczbaGosci"]).toBe("120");
    expect(agenda()["agenda.tort"]).toBe("Trzypiętrowy, bez orzechów");
  });

  it("puste pole nie nadpisuje agendy pustką", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Krok",
        fieldsJson: JSON.stringify([
          { key: "uwagi", label: "Uwagi", type: "text", targetAgendaKey: "agenda.uwagiKuchnia" },
        ]),
      }),
    ]);

    await completeProcessNode(EVENT, "n1", { uwagi: "   " }, "ORGANIZER");

    expect(agenda()["agenda.uwagiKuchnia"]).toBeUndefined();
  });
});

describe("harmonogram składa się z kroków czasowych", () => {
  it("pole-czas tworzy linię „godzina — nazwa kroku” i nie dubluje się jako osobny wpis", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Wjazd tortu",
        nextNodeId: "n2",
        fieldsJson: JSON.stringify([
          { key: "godzina", label: "Godzina", type: "time", targetAgendaKey: "agenda.godzinaStart", scheduleLine: true },
        ]),
      }),
      node({ id: "n2", name: "Koniec", sortOrder: 1 }),
    ]);

    await completeProcessNode(EVENT, "n1", { godzina: "22:30" }, "ORGANIZER");

    expect(agenda()["agenda.harmonogram"]).toBe("22:30 — Wjazd tortu");
    // Ta sama godzina nie może wylądować drugi raz jako osobna pozycja agendy.
    expect(agenda()["agenda.godzinaStart"]).toBeUndefined();
  });

  it("kroki z różnych godzin układają się chronologicznie, niezależnie od kolejności wypełniania", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Obiad",
        nextNodeId: "n2",
        fieldsJson: JSON.stringify([
          { key: "g", label: "Godzina", type: "time", targetAgendaKey: "agenda.harmonogram", scheduleLine: true },
        ]),
      }),
      node({
        id: "n2",
        name: "Powitanie",
        sortOrder: 1,
        fieldsJson: JSON.stringify([
          { key: "g", label: "Godzina", type: "time", targetAgendaKey: "agenda.harmonogram", scheduleLine: true },
        ]),
      }),
    ]);

    await completeProcessNode(EVENT, "n1", { g: "17:00" }, "ORGANIZER");
    await completeProcessNode(EVENT, "n2", { g: "15:30" }, "ORGANIZER");

    expect(agenda()["agenda.harmonogram"]).toBe("15:30 — Powitanie\n17:00 — Obiad");
  });
});

describe("mapowania pól (starszy mechanizm)", () => {
  it("łączy listę przecinkami, gdy wskazano takie przekształcenie", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Atrakcje",
        fieldMappingsJson: JSON.stringify([
          { sourceKey: "atrakcje", targetAgendaKey: "agenda.atrakcje", transform: "join_comma" },
        ]),
      }),
    ]);

    await completeProcessNode(EVENT, "n1", { atrakcje: ["Fotobudka", "Barman", "Ciężki dym"] }, "ORGANIZER");

    expect(agenda()["agenda.atrakcje"]).toBe("Fotobudka, Barman, Ciężki dym");
  });

  it("brak wartości źródłowej nie tworzy pustego klucza", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Atrakcje",
        fieldMappingsJson: JSON.stringify([
          { sourceKey: "atrakcje", targetAgendaKey: "agenda.atrakcje" },
        ]),
      }),
    ]);

    await completeProcessNode(EVENT, "n1", {}, "ORGANIZER");

    expect(Object.keys(agenda())).not.toContain("agenda.atrakcje");
  });
});

describe("wybór menu", () => {
  it("trafia do agendy nawet bez skonfigurowanego mapowania", async () => {
    ustawProces([node({ id: "n1", name: "Wybór menu", actionType: "MENU_SELECTION" })]);

    await completeProcessNode(
      EVENT,
      "n1",
      { menuSummary: "Wariant Złoty — 80 os., Wariant Srebrny — 40 os.", selectedDishes: ["Rosół", "Schab"] },
      "CLIENT",
      TOKEN,
    );

    expect(agenda()["agenda.menu"]).toContain("Wariant Złoty");
    expect(agenda()["agenda.menuSzczegoly"]).toBe("Rosół, Schab");
  });

  it("ukończenie kroku przez klienta powiadamia obiekt", async () => {
    ustawProces([node({ id: "n1", name: "Wybór menu", actionType: "MENU_SELECTION" })]);

    await completeProcessNode(EVENT, "n1", { menuSummary: "Wariant Złoty" }, "CLIENT", TOKEN);

    expect(store.powiadomienia).toHaveLength(1);
    expect(store.powiadomienia[0].title).toContain("Wybór menu");
  });
});

describe("przejście do następnego kroku", () => {
  it("idzie do wskazanego węzła i zapisuje historię", async () => {
    ustawProces([
      node({ id: "n1", name: "Zaliczka", nextNodeId: "n2" }),
      node({ id: "n2", name: "Ustalenie menu", sortOrder: 1 }),
    ]);

    const wynik = await completeProcessNode(EVENT, "n1", {}, "ORGANIZER");

    expect(wynik).toEqual({ nextNodeId: "n2", done: false });
    expect(store.state?.currentNodeId).toBe("n2");
    expect(store.historia[0]).toMatchObject({ fromStage: "Zaliczka", toStage: "Ustalenie menu" });
  });

  it("ostatni krok kończy proces", async () => {
    ustawProces([node({ id: "n1", name: "Rozliczenie" })]);

    const wynik = await completeProcessNode(EVENT, "n1", {}, "ORGANIZER");

    expect(wynik.done).toBe(true);
    expect(JSON.parse(store.state!.completedNodeIds)).toEqual(["n1"]);
  });

  it("wybór klienta kieruje proces na właściwą gałąź", async () => {
    ustawProces([
      node({
        id: "n1",
        name: "Wybór wariantu",
        actionType: "MENU_SELECTION",
        conditionsJson: JSON.stringify([
          { label: "Złoty", conditionType: "client_choice", conditionValue: "Złoty", nextNodeId: "n-zloty" },
          { label: "Srebrny", conditionType: "client_choice", conditionValue: "Srebrny", nextNodeId: "n-srebrny" },
        ]),
      }),
      node({ id: "n-zloty", name: "Ścieżka złota", sortOrder: 1 }),
      node({ id: "n-srebrny", name: "Ścieżka srebrna", sortOrder: 2 }),
    ]);

    const wynik = await completeProcessNode(EVENT, "n1", { selectedVariantLabel: "Srebrny" }, "CLIENT", TOKEN);

    expect(wynik.nextNodeId).toBe("n-srebrny");
  });

  it("nie pozwala ukończyć kroku, który nie jest bieżący", async () => {
    ustawProces([
      node({ id: "n1", name: "Zaliczka", nextNodeId: "n2" }),
      node({ id: "n2", name: "Menu", sortOrder: 1 }),
    ]);

    await expect(completeProcessNode(EVENT, "n2", {}, "ORGANIZER")).rejects.toThrow(
      /is not the current node/,
    );
  });
});

describe("kto może zamknąć krok", () => {
  it("klient bez tokenu nie zamknie kroku", async () => {
    ustawProces([node({ id: "n1", name: "Wybór menu", actionType: "MENU_SELECTION" })]);

    await expect(completeProcessNode(EVENT, "n1", {}, "CLIENT")).rejects.toThrow(/tokenu/i);
  });

  it("klient z tokenem, którego event nie zna, nie zamknie kroku", async () => {
    ustawProces([node({ id: "n1", name: "Wybór menu", actionType: "MENU_SELECTION" })]);
    store.eventDostepny = false;

    await expect(
      completeProcessNode(EVENT, "n1", {}, "CLIENT", "nie-ten-token"),
    ).rejects.toThrow(/nieaktualny/i);
  });

  it("obsługa bez sesji nie zamknie kroku", async () => {
    ustawProces([node({ id: "n1", name: "Zaliczka" })]);
    sesja.user = null;

    await expect(completeProcessNode(EVENT, "n1", {}, "ORGANIZER")).rejects.toThrow(/Unauthorized/);
  });

  it("obsługa nie zamknie kroku eventu spoza swojej przestrzeni", async () => {
    ustawProces([node({ id: "n1", name: "Zaliczka" })]);
    store.eventDostepny = false;

    await expect(completeProcessNode(EVENT, "n1", {}, "ORGANIZER")).rejects.toThrow(/Forbidden/);
  });
});

describe("krok tabelaryczny", () => {
  const KOLUMNY = JSON.stringify([
    { key: "imie", label: "Imię", type: "text", targetAgendaKey: "" },
    { key: "winietka", label: "Winietka", type: "text", targetAgendaKey: "agenda.dekoracje" },
    { key: "alergie", label: "Alergie", type: "text", targetAgendaKey: "agenda.uczulenia" },
  ]);

  it("wiersze tabeli trafiają do agendy kolumna po kolumnie", async () => {
    ustawProces([node({ id: "n1", name: "Lista gości", actionType: "TABLE", fieldsJson: KOLUMNY })]);

    await completeProcessNode(
      EVENT,
      "n1",
      {
        __rows: [
          { imie: "Anna", winietka: "Anna Kowalska", alergie: "orzechy" },
          { imie: "Jan", winietka: "Jan Kowalski", alergie: "" },
        ],
      },
      "CLIENT",
      TOKEN,
    );

    expect(agenda()["agenda.dekoracje"]).toBe("Anna Kowalska\nJan Kowalski");
    expect(agenda()["agenda.uczulenia"]).toBe("orzechy");
  });

  it("puste wiersze nie zaśmiecają agendy", async () => {
    ustawProces([node({ id: "n1", name: "Lista gości", actionType: "TABLE", fieldsJson: KOLUMNY })]);

    await completeProcessNode(
      EVENT,
      "n1",
      { __rows: [{ imie: "", winietka: "", alergie: "" }] },
      "CLIENT",
      TOKEN,
    );

    expect(Object.keys(agenda())).not.toContain("agenda.dekoracje");
  });

  it("brak wierszy nie wywraca kroku", async () => {
    ustawProces([node({ id: "n1", name: "Lista gości", actionType: "TABLE", fieldsJson: KOLUMNY })]);

    const wynik = await completeProcessNode(EVENT, "n1", {}, "CLIENT", TOKEN);

    expect(wynik.done).toBe(true);
  });
});

describe("krok wklejenia menu", () => {
  it("podsumowanie trafia do agendy tak samo jak przy wyborze klienta", async () => {
    ustawProces([node({ id: "n1", name: "Wklej menu", actionType: "MENU_IMPORT" })]);

    await completeProcessNode(
      EVENT,
      "n1",
      { menuSummary: "Wariant Złoty — 80 os." },
      "ORGANIZER",
    );

    expect(agenda()["agenda.menu"]).toBe("Wariant Złoty — 80 os.");
  });
});
