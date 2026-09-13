"use client";

import { useState } from "react";
import {
  completeProcessNode,
  type ProcessStateView,
  type ProcessNodeView,
} from "@/lib/actions/process-runtime.actions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StepField } from "@/lib/workflow-agenda-fields";
import {
  CheckCircle2,
  Circle,
  UtensilsCrossed,
  CheckSquare,
  ClipboardList,
  ArrowRight,
  Clock,
} from "lucide-react";

export type MenuVariantOption = {
  id: string;
  label: string;
  imageUrl?: string | null;
  courses?: { typeLabel: string; name: string }[];
};

function StepIndicator({ nodes }: { nodes: ProcessNodeView[] }) {
  // Pokazujemy parze wyłącznie jej kroki — wewnętrzne akceptacje zespołu
  // tylko by ją zdezorientowały. Lista pionowa: ukończone, bieżący, kolejne.
  const clientNodes = nodes.filter(
    (n) => n.assigneeRole === "CLIENT" || n.assigneeRole === "BOTH"
  );
  if (clientNodes.length === 0) return null;
  const done = clientNodes.filter((n) => n.status === "completed").length;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Twoje kroki
        </span>
        <span className="text-xs font-medium text-neutral-500">
          {done} z {clientNodes.length} gotowe
        </span>
      </div>
      <ol className="space-y-2.5">
        {/* Klientowi pokazujemy tylko to, co już zrobił, i to, co robi teraz —
            przyszłe kroki tylko go rozpraszają i gubią wyraźny „Twój ruch". */}
        {clientNodes.filter((n) => n.status !== "pending").map((n) => {
          const done = n.status === "completed";
          const current = n.status === "current";
          return (
            <li key={n.id} className="flex items-start gap-2.5">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : current ? (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 fill-blue-100 text-blue-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
              )}
              <div className="min-w-0">
                <span
                  className={`block text-sm ${
                    done
                      ? "text-neutral-400 line-through"
                      : current
                      ? "font-semibold text-blue-700"
                      : "text-neutral-500"
                  }`}
                >
                  {n.name}
                </span>
                {current && (
                  <span className="text-[11px] text-blue-500">← teraz Twój ruch</span>
                )}
                {done && (
                  <span className="text-[11px] text-emerald-600">wysłane</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {clientNodes.some((n) => n.status === "pending") && (
        <p className="mt-3 border-t border-neutral-200 pt-2.5 text-[11px] text-neutral-400">
          Kolejne kroki pojawią się tutaj, gdy ukończysz bieżący.
        </p>
      )}
    </div>
  );
}

/**
 * Wybór pojedynczych dań — para składa menu sama, zamiast brać gotowy zestaw.
 * Tryb ustawia się na kroku procesu, bo jedna sala sprzedaje zestawy,
 * a inna pozwala komponować.
 */
function DishSelectionStep({
  node,
  eventId,
  variants,
  onDone,
}: {
  node: ProcessNodeView;
  eventId: string;
  variants: MenuVariantOption[];
  onDone: () => void;
}) {
  const [wybrane, setWybrane] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Dania grupujemy po kategorii, żeby para wybierała „zupę”, a nie z listy 30 pozycji.
  const grupy = new Map<string, { key: string; nazwa: string; wariant: string }[]>();
  for (const v of variants) {
    for (const c of v.courses ?? []) {
      const kategoria = c.typeLabel || "Pozostałe";
      const lista = grupy.get(kategoria) ?? [];
      lista.push({ key: `${v.id}::${c.name}`, nazwa: c.name, wariant: v.label });
      grupy.set(kategoria, lista);
    }
  }

  function toggle(key: string) {
    setWybrane((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function submit() {
    if (wybrane.length === 0) return;
    setBusy(true);
    try {
      const nazwy = wybrane.map((k) => k.split("::")[1]);
      await completeProcessNode(
        eventId,
        node.id,
        {
          selectedDishes: nazwy,
          menuSummary: nazwy.join(", "),
          selectedVariantLabel: "Menu własne",
          note,
        },
        "CLIENT",
      );
      onDone();
    } finally {
      setBusy(false);
    }
  }

  if (grupy.size === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Restauracja nie dodała jeszcze dań do wyboru. Skontaktujemy się z Wami.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {[...grupy.entries()].map(([kategoria, dania]) => (
        <div key={kategoria}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {kategoria}
          </p>
          <div className="space-y-1.5">
            {dania.map((d) => {
              const zaznaczone = wybrane.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggle(d.key)}
                  className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors ${
                    zaznaczone
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      zaznaczone ? "border-blue-500 bg-blue-500 text-white" : "border-neutral-300"
                    }`}
                  >
                    {zaznaczone && <CheckSquare className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{d.nazwa}</span>
                  {variants.length > 1 && (
                    <span className="shrink-0 text-[11px] text-neutral-400">{d.wariant}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <label className="mb-1 block text-xs text-neutral-500">Uwagi (alergie, preferencje)</label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="text-sm" />
      </div>

      <Button onClick={submit} disabled={busy || wybrane.length === 0} className="w-full">
        Wyślij wybór ({wybrane.length})
      </Button>
    </div>
  );
}

function MenuSelectionStep({
  node,
  eventId,
  variants,
  initialSelection,
  onDone,
}: {
  node: ProcessNodeView;
  eventId: string;
  variants: MenuVariantOption[];
  initialSelection: { variantId: string; guests: number }[];
  onDone: () => void;
}) {
  const [selections, setSelections] = useState<{ variantId: string; guests: number }[]>(
    initialSelection.length > 0
      ? initialSelection
      : variants.map((v) => ({ variantId: v.id, guests: 0 }))
  );
  const [busy, setBusy] = useState(false);

  const total = selections.reduce((s, x) => s + x.guests, 0);

  function setGuests(variantId: string, val: number) {
    setSelections((prev) =>
      prev.map((s) => (s.variantId === variantId ? { ...s, guests: Math.max(0, val) } : s))
    );
  }

  async function submit() {
    if (total === 0) return;
    setBusy(true);
    try {
      const chosen = selections.filter((s) => s.guests > 0);
      const variantLabels = chosen
        .map((s) => {
          const v = variants.find((vv) => vv.id === s.variantId);
          return v ? `${v.label} (${s.guests} os.)` : `${s.variantId} (${s.guests} os.)`;
        })
        .join(", ");
      await completeProcessNode(
        eventId,
        node.id,
        {
          menuSelection: chosen,
          selectedVariantLabel: chosen[0]
            ? (variants.find((v) => v.id === chosen[0].variantId)?.label ?? "")
            : "",
          menuSummary: variantLabels,
        },
        "CLIENT"
      );
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">{node.description || "Wybierz warianty menu i podaj liczbę osób dla każdego."}</p>
      <div className="space-y-3">
        {variants.map((v) => {
          const sel = selections.find((s) => s.variantId === v.id);
          return (
            <div
              key={v.id}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-3 space-y-3"
            >
             <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-neutral-800">{v.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuests(v.id, (sel?.guests ?? 0) - 1)}
                  className="w-7 h-7 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100 flex items-center justify-center text-lg leading-none"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  value={sel?.guests ?? 0}
                  onChange={(e) => setGuests(v.id, parseInt(e.target.value, 10) || 0)}
                  className="w-16 text-center text-sm font-semibold text-neutral-800 rounded-md border border-neutral-200 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  aria-label={`Liczba osób — ${v.label}`}
                />
                <button
                  type="button"
                  onClick={() => setGuests(v.id, (sel?.guests ?? 0) + 1)}
                  className="w-7 h-7 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100 flex items-center justify-center text-lg leading-none"
                >
                  +
                </button>
              </div>
             </div>
              {v.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.imageUrl}
                  alt={`Skan menu — ${v.label}`}
                  className="max-h-56 w-auto rounded-md border border-neutral-200 object-contain"
                />
              )}
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-neutral-500">Łącznie: {total} osób</p>
      )}
      <Button
        onClick={submit}
        disabled={busy || total === 0}
        className="bg-orange-500 hover:bg-orange-600 text-white w-full"
      >
        <CheckSquare className="w-4 h-4 mr-2" />
        {busy ? "Wysyłanie…" : "Wyślij wybór menu"}
      </Button>
    </div>
  );
}

function ApprovalStep({
  node,
  eventId,
  onDone,
}: {
  node: ProcessNodeView;
  eventId: string;
  onDone: () => void;
}) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await completeProcessNode(eventId, node.id, { approved: true, comment }, "CLIENT");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        {node.description || "Przejrzyj powyższe ustalenia i potwierdź ich akceptację."}
      </p>
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">
          Uwagi / komentarz (opcjonalnie)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Twoje uwagi trafią bezpośrednio do restauracji…"
          className="text-sm"
        />
      </div>
      <Button
        onClick={submit}
        disabled={busy}
        className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        {busy ? "Wysyłanie…" : "Potwierdzam ustalenia"}
      </Button>
    </div>
  );
}

function GenericClientStep({
  node,
  eventId,
  onDone,
}: {
  node: ProcessNodeView;
  eventId: string;
  onDone: () => void;
}) {
  const fields = node.fields ?? [];
  const [answer, setAnswer] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const missingRequired = fields.some(
    (f) => f.required && !(fieldValues[f.key] ?? "").trim()
  );

  async function submit() {
    setBusy(true);
    try {
      const payload = fields.length > 0 ? { ...fieldValues } : { answer };
      await completeProcessNode(eventId, node.id, payload, "CLIENT");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  // Krok z konfigurowalnymi polami (godzina, alergeny, napoje…) — wypełnia
  // klient, wartości po zatwierdzeniu przez restaurację lądują w agendzie.
  if (fields.length > 0) {
    return (
      <div className="space-y-3">
        {fields.map((f: StepField) => (
          <label key={f.key} className="block text-sm font-medium text-neutral-700">
            {f.label}
            {f.required && <span className="text-red-500"> *</span>}
            {f.type === "textarea" ? (
              <Textarea
                value={fieldValues[f.key] ?? ""}
                onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={3}
                className="mt-1.5 text-sm font-normal"
              />
            ) : f.type === "select" ? (
              <select
                value={fieldValues[f.key] ?? ""}
                onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal bg-white"
              >
                <option value="">— wybierz —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <Input
                type={f.type === "time" ? "time" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                value={fieldValues[f.key] ?? ""}
                onChange={(e) => setFieldValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="mt-1.5 text-sm font-normal"
              />
            )}
          </label>
        ))}
        <Button
          onClick={submit}
          disabled={busy || missingRequired}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          {busy ? "Wysyłanie…" : "Wyślij"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        {node.name}
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          placeholder="Wpisz tutaj i wyślij do restauracji…"
          className="mt-1.5 text-sm font-normal"
        />
      </label>
      <Button
        onClick={submit}
        disabled={busy || !answer.trim()}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        {busy ? "Wysyłanie…" : "Wyślij"}
      </Button>
    </div>
  );
}

export function ClientProcessStep({
  eventId,
  processState,
  variants,
  initialMenuSelection,
}: {
  eventId: string;
  processState: ProcessStateView;
  variants: MenuVariantOption[];
  initialMenuSelection: { variantId: string; guests: number }[];
}) {
  const currentNode = processState.nodes.find(
    (n) => n.id === processState.currentNodeId
  );

  const isClientNode =
    currentNode &&
    (currentNode.assigneeRole === "CLIENT" || currentNode.assigneeRole === "BOTH");

  const isDone = processState.nodes.every((n) => n.status === "completed");

  function reload() {
    window.location.reload();
  }

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
          Twój krok w procesie
        </h2>
      </div>

      {/* Progress indicator */}
      <StepIndicator nodes={processState.nodes} />

      {isDone ? (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium text-emerald-700">
            Wszystkie Twoje kroki zostały ukończone. Dziękujemy!
          </p>
        </div>
      ) : !currentNode || !isClientNode ? (
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 border border-neutral-200 px-4 py-3">
          <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <p className="text-sm text-neutral-500">
            Restauracja pracuje nad kolejnym krokiem. Wróć wkrótce.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {(processState.nodes.filter((n) => n.status === "completed").length) + 1}
            </span>
            <h3 className="text-base font-semibold text-neutral-900">
              {currentNode.name}
            </h3>
          </div>
          {currentNode.description && (
            <p className="mb-3 ml-8 text-sm text-neutral-600">{currentNode.description}</p>
          )}
          <div className="mt-2">

          {currentNode.actionType === "MENU_SELECTION" && variants.length > 0 ? (
            currentNode.menuMode === "PER_DISH" ? (
              <DishSelectionStep
                node={currentNode}
                eventId={eventId}
                variants={variants}
                onDone={reload}
              />
            ) : (
              <MenuSelectionStep
                node={currentNode}
                eventId={eventId}
                variants={variants}
                initialSelection={initialMenuSelection}
                onDone={reload}
              />
            )
          ) : currentNode.actionType === "APPROVAL" ? (
            <ApprovalStep node={currentNode} eventId={eventId} onDone={reload} />
          ) : (
            <GenericClientStep node={currentNode} eventId={eventId} onDone={reload} />
          )}
          </div>
        </div>
      )}
    </section>
  );
}
