import { policzPodgladAgendy } from "@/lib/workflow-agenda-preview";
import type { WorkflowNodeData } from "@/lib/actions/workflow-builder.actions";

/**
 * Ostrzeżenia przed zapisem procesu.
 *
 * Do tej pory zapis sprawdzał wyłącznie, czy proces ma nazwę. Można było zapisać
 * proces, w którym żaden krok nic nie oddaje do agendy — i dowiedzieć się o tym
 * tydzień później, otwierając pusty dokument dla kuchni. Edytor wie o tym
 * w momencie zapisu i ma to powiedzieć.
 *
 * To są OSTRZEŻENIA, nie blokada: bywają procesy czysto organizacyjne, które
 * świadomie nie zasilają agendy. Decyzję zostawiamy człowiekowi.
 */

export type OstrzezenieProcesu = {
  kod: string;
  tresc: string;
};

export function sprawdzProces(
  nodes: WorkflowNodeData[],
  opcje: { nazwa: string },
): OstrzezenieProcesu[] {
  const out: OstrzezenieProcesu[] = [];

  if (nodes.length === 0) {
    out.push({ kod: "brak-krokow", tresc: "Proces nie ma ani jednego kroku." });
    return out;
  }

  const bezNazwy = nodes.filter((n) => !n.name?.trim()).length;
  if (bezNazwy > 0) {
    out.push({
      kod: "krok-bez-nazwy",
      tresc:
        bezNazwy === 1
          ? "Jeden krok nie ma nazwy — obsługa zobaczy pustą pozycję na osi."
          : `${bezNazwy} kroki nie mają nazwy — obsługa zobaczy puste pozycje na osi.`,
    });
  }

  const startowe = nodes.filter((n) => n.isStart).length;
  if (startowe > 1) {
    out.push({
      kod: "wiele-startow",
      tresc: `${startowe} kroki oznaczono jako startowe — proces ruszy od pierwszego z listy, reszta zostanie pominięta.`,
    });
  }

  const { krokiBezWkladu } = policzPodgladAgendy(nodes);
  if (krokiBezWkladu.length === nodes.length) {
    out.push({
      kod: "agenda-pusta",
      tresc: "Żaden krok nic nie oddaje do agendy — dokument dla kuchni wyjdzie pusty.",
    });
  } else if (krokiBezWkladu.length > 0) {
    out.push({
      kod: "kroki-bez-agendy",
      tresc: `Nic nie oddają do agendy: ${krokiBezWkladu.join(", ")}.`,
    });
  }

  // Pole bez wskazanego miejsca w agendzie zbiera dane, które nigdzie nie trafią.
  const osierocone = nodes.flatMap((n) =>
    (n.fields ?? [])
      .filter((f) => f.label?.trim() && !f.targetAgendaKey && !f.scheduleLine)
      .map((f) => `${n.name?.trim() || "krok bez nazwy"} · ${f.label}`),
  );
  if (osierocone.length > 0) {
    out.push({
      kod: "pole-bez-celu",
      tresc: `Pola bez wskazanego miejsca w agendzie: ${osierocone.join(", ")}.`,
    });
  }

  // Warunek bez wskazanego kroku docelowego zatrzyma proces w miejscu.
  const slepeWarunki = nodes.flatMap((n) =>
    (n.conditions ?? [])
      .filter((c) => !c.nextNodeId)
      .map(() => n.name?.trim() || "krok bez nazwy"),
  );
  if (slepeWarunki.length > 0) {
    out.push({
      kod: "warunek-bez-celu",
      tresc: `Warunek bez wskazanego następnego kroku: ${[...new Set(slepeWarunki)].join(", ")}.`,
    });
  }

  if (!opcje.nazwa.trim()) {
    out.push({ kod: "brak-nazwy", tresc: "Proces nie ma nazwy." });
  }

  return out;
}
