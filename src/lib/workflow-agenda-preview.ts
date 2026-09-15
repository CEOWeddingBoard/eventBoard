import { AGENDA_TARGETS, isTableStep } from "@/lib/workflow-agenda-fields";
import type { WorkflowNodeData } from "@/lib/actions/workflow-builder.actions";

/**
 * Co dany proces odłoży w agendzie — policzone z samej konfiguracji, bez eventu.
 *
 * Musi odwzorowywać `applyStepFields` / `applyFieldMappings` z
 * `process-runtime.actions.ts`. Rozjazd między tym a runtime jest gorszy niż brak
 * podglądu: edytor obiecywałby wtedy coś, czego agenda nie zrobi.
 */

export type ZrodloWpisu = { krok: string; pole: string };

export type PodgladAgendy = {
  /** Klucze z listy `AGENDA_TARGETS` → kroki, które je zasilą. */
  wypelnione: Map<string, ZrodloWpisu[]>;
  /** Klucze spoza listy — trafią do agendy, ale bez stałego miejsca w dokumencie. */
  wlasneKlucze: Map<string, ZrodloWpisu[]>;
  /** Nazwy kroków, które utworzą pozycję harmonogramu (w kolejności kroków). */
  harmonogram: string[];
  /** Kroki, które nie oddają do agendy niczego. */
  krokiBezWkladu: string[];
};

const ZNANE_KLUCZE = new Set(AGENDA_TARGETS.map((t) => t.key));

export function policzPodgladAgendy(nodes: WorkflowNodeData[]): PodgladAgendy {
  const wypelnione = new Map<string, ZrodloWpisu[]>();
  const wlasneKlucze = new Map<string, ZrodloWpisu[]>();
  const harmonogram: string[] = [];
  const krokiBezWkladu: string[] = [];

  const dopisz = (klucz: string, zrodlo: ZrodloWpisu) => {
    const cel = ZNANE_KLUCZE.has(klucz) ? wypelnione : wlasneKlucze;
    const lista = cel.get(klucz) ?? [];
    lista.push(zrodlo);
    cel.set(klucz, lista);
  };

  nodes.forEach((node, i) => {
    const nazwaKroku = node.name?.trim() || `Krok ${i + 1}`;
    let wklad = 0;

    const tabela = isTableStep(node.actionType);

    for (const pole of node.fields ?? []) {
      // W kroku tabelarycznym `fields` to KOLUMNY — kolumna z godzinami nie
      // tworzy jednej pozycji harmonogramu, tylko listę wartości pod swoim
      // kluczem. Runtime robi to samo (`tableAgendaEntries`).
      if (!tabela && pole.scheduleLine && pole.type === "time") {
        harmonogram.push(nazwaKroku);
        wklad++;
        continue;
      }
      if (!pole.targetAgendaKey) continue;
      // Kolumna z podsumowaniem oddaje zestawienie, a nie kolejne wiersze —
      // podgląd ma to powiedzieć wprost, bo to zupełnie inna treść w agendzie.
      const opisKolumny = (nazwa: string) => {
        if (pole.aggregate === "sum") return `suma kolumny „${nazwa}”`;
        if (pole.aggregate === "group") return `zestawienie kolumny „${nazwa}”`;
        return `kolumna „${nazwa}”`;
      };

      dopisz(pole.targetAgendaKey, {
        krok: nazwaKroku,
        pole: tabela
          ? opisKolumny(pole.label?.trim() || pole.key)
          : pole.label?.trim() || pole.key,
      });
      wklad++;
    }

    for (const map of node.fieldMappings ?? []) {
      if (!map.targetAgendaKey || !map.sourceKey) continue;
      dopisz(map.targetAgendaKey, { krok: nazwaKroku, pole: map.sourceKey });
      wklad++;
    }

    // Runtime odkłada menu zawsze, także bez skonfigurowanego mapowania.
    if (node.actionType === "MENU_SELECTION") {
      dopisz("agenda.menu", { krok: nazwaKroku, pole: "wybór klienta" });
      wklad++;
    }
    if (node.actionType === "MENU_IMPORT") {
      dopisz("agenda.menu", { krok: nazwaKroku, pole: "wklejone menu" });
      wklad++;
    }

    if (wklad === 0) krokiBezWkladu.push(nazwaKroku);
  });

  return { wypelnione, wlasneKlucze, harmonogram, krokiBezWkladu };
}
