"use client";

import { AlertTriangle, CalendarClock, FileText } from "lucide-react";
import {
  AGENDA_TARGETS,
  AGENDA_TARGET_GROUPS,
  SCHEDULE_AGENDA_KEY,
  agendaTargetLabel,
} from "@/lib/workflow-agenda-fields";
import {
  policzPodgladAgendy,
  type ZrodloWpisu,
} from "@/lib/workflow-agenda-preview";
import type { WorkflowNodeData } from "@/lib/actions/workflow-builder.actions";

/**
 * Podgląd agendy składanej z kroków procesu.
 *
 * Agenda nie ma własnej konfiguracji, więc do tej pory efekt pracy w edytorze
 * widać było dopiero na prawdziwym evencie — tydzień później, jako pustą sekcję
 * w dokumencie dla kuchni. Ten panel pokazuje od razu, która pozycja agendy
 * zostanie wypełniona i przez który krok.
 *
 * Liczy dokładnie to, co robi runtime (`applyStepFields` / `applyFieldMappings`):
 * pole kroku trafia pod swój `targetAgendaKey`, pole-czas oznaczone jako pozycja
 * harmonogramu idzie WYŁĄCZNIE do harmonogramu, a krok wyboru menu odkłada menu
 * niezależnie od konfiguracji.
 */

function Zrodla({ zrodla }: { zrodla: ZrodloWpisu[] }) {
  return (
    <span className="text-[11px] text-neutral-500">
      {zrodla.map((z, i) => (
        <span key={i}>
          {i > 0 && ", "}
          {z.krok}
          <span className="text-neutral-400"> · {z.pole}</span>
        </span>
      ))}
    </span>
  );
}

export function AgendaPreview({ nodes }: { nodes: WorkflowNodeData[] }) {
  const { wypelnione, harmonogram, krokiBezWkladu, wlasneKlucze } = policzPodgladAgendy(nodes);
  const liczbaWypelnionych = wypelnione.size + wlasneKlucze.size + (harmonogram.length > 0 ? 1 : 0);

  return (
    <aside className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
        <h3 className="text-sm font-semibold text-neutral-800">Tak wyjdzie agenda</h3>
        <span className="ml-auto text-[11px] text-neutral-400 tabular-nums">
          {liczbaWypelnionych} z {AGENDA_TARGETS.length}
        </span>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {liczbaWypelnionych === 0 && (
          <p className="text-[13px] text-neutral-500">
            Na razie żaden krok nic nie oddaje do agendy. Dodaj krokowi pole w zakładce
            <span className="font-medium text-neutral-700"> Pola</span> i wskaż, gdzie ma trafić.
          </p>
        )}

        {harmonogram.length > 0 && (
          <section>
            <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              Harmonogram
            </h4>
            <ul className="space-y-1">
              {harmonogram.map((krok, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[13px]">
                  <span className="font-mono text-neutral-400 shrink-0">--:--</span>
                  <span className="text-neutral-700">{krok}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-neutral-400">
              Godziny wypełnia obsługa na evencie; agenda posortuje pozycje chronologicznie.
            </p>
          </section>
        )}

        {AGENDA_TARGET_GROUPS.map((grupa) => {
          const wGrupie = AGENDA_TARGETS.filter(
            (t) => t.group === grupa && t.key !== SCHEDULE_AGENDA_KEY,
          );
          const aktywne = wGrupie.filter((t) => wypelnione.has(t.key));
          if (aktywne.length === 0) return null;

          return (
            <section key={grupa}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
                {grupa}
              </h4>
              <ul className="space-y-1.5">
                {aktywne.map((t) => (
                  <li key={t.key}>
                    <div className="text-[13px] font-medium text-neutral-800">{t.label}</div>
                    <Zrodla zrodla={wypelnione.get(t.key)!} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {wlasneKlucze.size > 0 && (
          <section>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">
              Klucze własne
            </h4>
            <ul className="space-y-1.5">
              {[...wlasneKlucze.entries()].map(([klucz, zrodla]) => (
                <li key={klucz}>
                  <div className="text-[13px] font-medium text-neutral-800 break-all">
                    {agendaTargetLabel(klucz)}
                  </div>
                  <Zrodla zrodla={zrodla} />
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[11px] text-neutral-400">
              Klucz spoza listy trafia do agendy, ale nie ma stałego miejsca w dokumencie.
            </p>
          </section>
        )}

        {krokiBezWkladu.length > 0 && (
          <section className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <h4 className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-800 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {krokiBezWkladu.length === 1
                ? "Ten krok nic nie oddaje do agendy"
                : `Te kroki nic nie oddają do agendy (${krokiBezWkladu.length})`}
            </h4>
            <p className="text-[12px] text-amber-900/80">{krokiBezWkladu.join(", ")}</p>
            <p className="mt-1 text-[11px] text-amber-800/70">
              To w porządku dla kroków czysto organizacyjnych — ale jeśli krok zbiera ustalenia,
              dodaj mu pole ze wskazanym miejscem w agendzie.
            </p>
          </section>
        )}
      </div>
    </aside>
  );
}
