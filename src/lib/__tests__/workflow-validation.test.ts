/**
 * Ostrzeżenia przed zapisem procesu.
 *
 * Ich sens: edytor wie w momencie zapisu, że agenda wyjdzie pusta albo że
 * warunek nie prowadzi donikąd — i ma to powiedzieć wtedy, a nie tydzień
 * później, gdy kuchnia otworzy dokument.
 *
 * Świadomie są to ostrzeżenia, nie blokady: proces czysto organizacyjny,
 * który nic nie oddaje do agendy, bywa poprawny.
 */

import { sprawdzProces } from "@/lib/workflow-validation";
import type { WorkflowNodeData } from "@/lib/actions/workflow-builder.actions";

function krok(over: Partial<WorkflowNodeData> & { name: string }): WorkflowNodeData {
  return {
    nodeType: "ACTION",
    actionType: "NONE",
    assigneeRole: "MANAGER",
    sortOrder: 0,
    fieldMappings: [],
    conditions: [],
    ...over,
  };
}

const kody = (n: WorkflowNodeData[], nazwa = "Proces") =>
  sprawdzProces(n, { nazwa }).map((o) => o.kod);

describe("sprawdzProces", () => {
  it("poprawny proces nie generuje ostrzeżeń", () => {
    expect(
      kody([
        krok({
          name: "Ustalenia",
          isStart: true,
          fields: [
            { key: "g", label: "Liczba gości", type: "number", targetAgendaKey: "agenda.liczbaGosci" },
          ],
        }),
      ]),
    ).toEqual([]);
  });

  it("ostrzega, gdy agenda wyjdzie pusta", () => {
    expect(kody([krok({ name: "Telefon powitalny" })])).toContain("agenda-pusta");
  });

  it("wskazuje pojedyncze kroki, które nic nie oddają", () => {
    const wynik = kody([
      krok({
        name: "Ustalenia",
        fields: [{ key: "g", label: "Goście", type: "number", targetAgendaKey: "agenda.liczbaGosci" }],
      }),
      krok({ name: "Telefon", sortOrder: 1 }),
    ]);
    expect(wynik).toContain("kroki-bez-agendy");
    expect(wynik).not.toContain("agenda-pusta");
  });

  it("ostrzega o kroku bez nazwy", () => {
    expect(kody([krok({ name: "   " })])).toContain("krok-bez-nazwy");
  });

  it("ostrzega, gdy kilka kroków oznaczono jako startowe", () => {
    expect(
      kody([
        krok({ name: "A", isStart: true }),
        krok({ name: "B", isStart: true, sortOrder: 1 }),
      ]),
    ).toContain("wiele-startow");
  });

  it("jeden krok startowy jest w porządku", () => {
    expect(kody([krok({ name: "A", isStart: true })])).not.toContain("wiele-startow");
  });

  it("ostrzega o polu bez wskazanego miejsca w agendzie", () => {
    expect(
      kody([
        krok({
          name: "Ustalenia",
          fields: [{ key: "x", label: "Coś ważnego", type: "text", targetAgendaKey: "" }],
        }),
      ]),
    ).toContain("pole-bez-celu");
  });

  it("pole-czas w harmonogramie nie jest polem osieroconym", () => {
    expect(
      kody([
        krok({
          name: "Wjazd tortu",
          fields: [
            { key: "g", label: "Godzina", type: "time", targetAgendaKey: "", scheduleLine: true },
          ],
        }),
      ]),
    ).not.toContain("pole-bez-celu");
  });

  it("ostrzega o warunku, który nie prowadzi do żadnego kroku", () => {
    expect(
      kody([
        krok({
          name: "Decyzja",
          fields: [{ key: "g", label: "G", type: "text", targetAgendaKey: "agenda.uwagiKuchnia" }],
          conditions: [{ label: "Tak", conditionType: "always", nextNodeId: "" }],
        }),
      ]),
    ).toContain("warunek-bez-celu");
  });

  it("pusty proces to jedno ostrzeżenie, nie lawina", () => {
    expect(kody([])).toEqual(["brak-krokow"]);
  });

  it("brak nazwy procesu też jest zgłaszany", () => {
    const wynik = kody(
      [krok({ name: "A", fields: [{ key: "g", label: "G", type: "text", targetAgendaKey: "agenda.uwagiKuchnia" }] })],
      "  ",
    );
    expect(wynik).toContain("brak-nazwy");
  });
});
