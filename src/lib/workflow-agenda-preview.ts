import { AGENDA_TARGETS } from "@/lib/workflow-agenda-fields";
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

    for (const pole of node.fields ?? []) {
      // Pole-czas w harmonogramie nie tworzy osobnej pozycji agendy — tak samo
      // jak w runtime, inaczej ta sama godzina dublowałaby się w dokumencie.
      if (pole.scheduleLine && pole.type === "time") {
        harmonogram.push(nazwaKroku);
        wklad++;
        continue;
      }
      if (!pole.targetAgendaKey) continue;
      dopisz(pole.targetAgendaKey, { krok: nazwaKroku, pole: pole.label?.trim() || pole.key });
      wklad++;
    }

    for (const map of node.fieldMappings ?? []) {
      if (!map.targetAgendaKey || !map.sourceKey) continue;
      dopisz(map.targetAgendaKey, { krok: nazwaKroku, pole: map.sourceKey });
      wklad++;
    }

    // Runtime odkłada wybór menu zawsze, także bez skonfigurowanego mapowania.
    if (node.actionType === "MENU_SELECTION") {
      dopisz("agenda.menu", { krok: nazwaKroku, pole: "wybór klienta" });
      wklad++;
    }

    if (wklad === 0) krokiBezWkladu.push(nazwaKroku);
  });

  return { wypelnione, wlasneKlucze, harmonogram, krokiBezWkladu };
}
