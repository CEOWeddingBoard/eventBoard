"use client";

import { AlertTriangle } from "lucide-react";
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
 * Podgląd agendy jako kartka.
 *
 * Agenda nie ma własnej konfiguracji — składa się wyłącznie z kroków procesu.
 * Lista „co trafi do agendy” odpowiadała na pytanie CZY, ale nie na pytanie
 * GDZIE. Dopiero kartka pokazuje dokument, który zobaczy kuchnia: które miejsce
 * już ktoś wypełni, a które zostanie puste.
 *
 * Układ odwzorowuje `src/lib/agenda/agenda-docx.ts` — tytuł, sekcje w kolejności
 * grup, wiersze „Etykieta: wartość”. Zmieniasz układ dokumentu, popraw i tutaj,
 * inaczej kartka obiecuje co innego, niż wyjdzie z drukarki.
 */

function Zrodla({ zrodla }: { zrodla: ZrodloWpisu[] }) {
  return (
    <span className="text-[10px] text-blue-600">
      {zrodla.map((z, i) => (
        <span key={i}>
          {i > 0 && ", "}
          {z.krok}
        </span>
      ))}
    </span>
  );
}

export function AgendaPreview({ nodes }: { nodes: WorkflowNodeData[] }) {
  const { wypelnione, harmonogram, krokiBezWkladu, wlasneKlucze } = policzPodgladAgendy(nodes);
  const liczbaWypelnionych = wypelnione.size + wlasneKlucze.size + (harmonogram.length > 0 ? 1 : 0);

  return (
    <aside className="space-y-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-neutral-800">Tak wyjdzie agenda</h3>
        <span className="text-[11px] tabular-nums text-neutral-400">
          {liczbaWypelnionych} z {AGENDA_TARGETS.length} pozycji
        </span>
      </div>

      {/* Kartka A4 — proporcja i cień, żeby było widać, że to dokument */}
      <div className="rounded-sm border border-neutral-300 bg-white px-6 py-7 shadow-[0_2px_12px_rgba(0,0,0,0.10)]">
        <p className="text-center text-[13px] font-bold uppercase tracking-wide text-neutral-800">
          Agenda wydarzenia
        </p>
        <div className="mx-auto mt-1 h-px w-full bg-neutral-800" />
        <p className="mt-1 text-center text-[10px] text-neutral-400">
          Wesele Anny i Tomasza · 14 czerwca 2026
        </p>

        {AGENDA_TARGET_GROUPS.map((grupa) => {
          const wGrupie = AGENDA_TARGETS.filter((t) => t.group === grupa);
          const zHarmonogramem = grupa === "Agenda" && harmonogram.length > 0;

          return (
            <section key={grupa} className="mt-5">
              <p className="border-b border-neutral-200 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7a5f28]">
                {grupa}
              </p>

              <dl className="mt-1.5 space-y-1">
                {zHarmonogramem && (
                  <div>
                    <dt className="text-[11px] font-semibold text-neutral-800">Harmonogram</dt>
                    <dd className="mt-0.5 space-y-0.5 pl-3">
                      {harmonogram.map((krok, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-[11px]">
                          <span className="font-mono text-neutral-400">--:--</span>
                          <span className="text-neutral-700">{krok}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}

                {wGrupie.map((t) => {
                  if (t.key === SCHEDULE_AGENDA_KEY) return null;
                  const zrodla = wypelnione.get(t.key);

                  return (
                    <div key={t.key} className="flex items-baseline gap-2">
                      <dt
                        className={`shrink-0 text-[11px] font-semibold ${
                          zrodla ? "text-neutral-800" : "text-neutral-300"
                        }`}
                      >
                        {t.label}:
                      </dt>
                      <dd className="min-w-0 flex-1">
                        {zrodla ? (
                          <span className="inline-flex items-baseline gap-1.5">
                            <span className="rounded-sm bg-blue-50 px-1.5 text-[11px] text-blue-700 ring-1 ring-blue-100">
                              wypełni: <Zrodla zrodla={zrodla} />
                            </span>
                          </span>
                        ) : (
                          // Kreska w miejscu, gdzie w dokumencie zostanie pusto —
                          // to jest cała informacja, po którą się tu patrzy.
                          <span className="block border-b border-dotted border-neutral-300 text-[11px] leading-4">
                            &nbsp;
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          );
        })}

        {wlasneKlucze.size > 0 && (
          <section className="mt-5">
            <p className="border-b border-neutral-200 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7a5f28]">
              Pozycje własne
            </p>
            <dl className="mt-1.5 space-y-1">
              {[...wlasneKlucze.entries()].map(([klucz, zrodla]) => (
                <div key={klucz} className="flex items-baseline gap-2">
                  <dt className="shrink-0 break-all text-[11px] font-semibold text-neutral-800">
                    {agendaTargetLabel(klucz)}:
                  </dt>
                  <dd className="min-w-0 flex-1">
                    <span className="rounded-sm bg-blue-50 px-1.5 text-[11px] text-blue-700 ring-1 ring-blue-100">
                      wypełni: <Zrodla zrodla={zrodla} />
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-1 text-[9px] text-neutral-400">
              Klucze spoza listy trafiają na koniec dokumentu.
            </p>
          </section>
        )}

        {liczbaWypelnionych === 0 && (
          <p className="mt-6 text-center text-[11px] text-neutral-400">
            Wszystkie miejsca puste — żaden krok nic jeszcze nie oddaje do agendy.
          </p>
        )}
      </div>

      {krokiBezWkladu.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {krokiBezWkladu.length === 1
              ? "Ten krok nic nie oddaje do agendy"
              : `Te kroki nic nie oddają do agendy (${krokiBezWkladu.length})`}
          </p>
          <p className="mt-1 text-[12px] text-amber-900/80">{krokiBezWkladu.join(", ")}</p>
        </div>
      )}
    </aside>
  );
}
