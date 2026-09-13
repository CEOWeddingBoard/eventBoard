"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { COURSE_TYPES, parseMenuText, type ParserRules, type CourseType } from "@/lib/menu-parser";
import { saveMenuParserRules } from "@/lib/actions/menu-parser.actions";

const EXAMPLE = `Wariant I – menu bufetowe klasyczne
250 PLN netto/os.

Bufet dań ciepłych
* cordon bleu ze schabu,
* pierogi z kapustą i grzybami.

Bufet deserowy
* sernik cynamonowy.`;

const typeLabel = (t: string) => COURSE_TYPES.find((c) => c.value === t)?.label ?? t;

export function MenuParserRulesEditor({ initial }: { initial: ParserRules }) {
  const [rules, setRules] = useState<ParserRules>(initial);
  const [saving, setSaving] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const parsed = previewText.trim() ? parseMenuText(previewText, rules) : [];

  function updateSection(i: number, patch: Partial<{ match: string; courseType: CourseType }>) {
    setRules((r) => ({ ...r, sections: r.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  }
  function addSection() {
    setRules((r) => ({ ...r, sections: [...r.sections, { match: "", courseType: "MAIN" }] }));
  }
  function removeSection(i: number) {
    setRules((r) => ({ ...r, sections: r.sections.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveMenuParserRules({
        ...rules,
        sections: rules.sections.filter((s) => s.match.trim()),
        variantMarkers: rules.variantMarkers.map((m) => m.trim()).filter(Boolean),
        ignoreContains: rules.ignoreContains.map((m) => m.trim()).filter(Boolean),
      });
      toast.success("Zapisano reguły parsera");
    } catch {
      toast.error("Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sekcje: słowo kluczowe → typ dania */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-800">Sekcje menu (słowo kluczowe → typ dania)</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Gdy linia menu <b>zawiera</b> słowo kluczowe, kolejne pozycje (od myślnika) trafiają do
          wskazanego typu. Dopasowanie bez rozróżniania wielkości liter.
        </p>
        <div className="mt-4 space-y-2">
          {rules.sections.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="h-8 flex-1 text-sm"
                placeholder="np. Bufet deserowy"
                value={s.match}
                onChange={(e) => updateSection(i, { match: e.target.value })}
              />
              <span className="text-neutral-400">→</span>
              <select
                className="h-8 w-44 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                value={s.courseType}
                onChange={(e) => updateSection(i, { courseType: e.target.value as CourseType })}
              >
                {COURSE_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => removeSection(i)} className="rounded p-1.5 hover:bg-red-50">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={addSection}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Dodaj sekcję
        </Button>
      </section>

      {/* Pozostałe ustawienia */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-800">Początek wariantu</h3>
          <p className="mt-1 text-xs text-neutral-500">Linie zaczynające się od tych słów = nowy wariant.</p>
          <Input
            className="mt-3 h-8 text-sm"
            value={rules.variantMarkers.join(", ")}
            onChange={(e) => setRules((r) => ({ ...r, variantMarkers: e.target.value.split(",").map((x) => x.trim()) }))}
            placeholder="Wariant, Menu, Pakiet"
          />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-800">Znaki pozycji</h3>
          <p className="mt-1 text-xs text-neutral-500">Znaki rozpoczynające danie (myślnik, gwiazdka…).</p>
          <Input
            className="mt-3 h-8 text-sm font-mono"
            value={rules.bulletChars}
            onChange={(e) => setRules((r) => ({ ...r, bulletChars: e.target.value }))}
            placeholder="*-•–"
          />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-800">Pomijaj linie zawierające</h3>
          <p className="mt-1 text-xs text-neutral-500">Np. podsumowania cen — nie stają się pozycją.</p>
          <Input
            className="mt-3 h-8 text-sm"
            value={rules.ignoreContains.join(", ")}
            onChange={(e) => setRules((r) => ({ ...r, ignoreContains: e.target.value.split(",").map((x) => x.trim()) }))}
            placeholder="Cena menu, Cena za"
          />
        </div>
      </section>

      {/* Podgląd na żywo — wklej menu i zobacz, jak reguły je mapują */}
      <section className="rounded-xl border-2 border-dashed border-[#b45309]/30 bg-[#fffaf3] p-5">
        <h2 className="text-sm font-semibold text-neutral-800">Sprawdź reguły na przykładzie</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Wklej fragment menu — od razu zobaczysz, jak zostanie rozpoznane. To tylko podgląd,
          nic nie zapisuje. Prawdziwy import robisz w evencie („Warianty menu → Wklej menu z tekstu”).
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Wklejony tekst</span>
              <button type="button" onClick={() => setPreviewText(EXAMPLE)} className="text-[11px] text-blue-600 hover:underline">
                Wstaw przykład
              </button>
            </div>
            <Textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              rows={12}
              placeholder="Wklej tutaj menu, żeby sprawdzić mapowanie…"
              className="text-xs font-mono leading-relaxed"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-neutral-600">
              Podgląd ({parsed.length} wariant(y))
            </span>
            <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
              {parsed.length === 0 ? (
                <p className="py-6 text-center text-xs text-neutral-400">Wklej tekst po lewej, żeby zobaczyć wynik.</p>
              ) : (
                parsed.map((v, i) => (
                  <div key={i} className="rounded border border-neutral-200 p-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-neutral-800">{v.label}</span>
                      {v.pricePerPerson != null && <span className="text-xs font-semibold text-emerald-700">{v.pricePerPerson} zł/os.</span>}
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {v.courses.map((c, ci) => (
                        <li key={ci} className="flex items-center gap-2 text-xs text-neutral-700">
                          <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">{typeLabel(c.courseType)}</span>
                          <span className="truncate">{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#0f172a] text-white hover:bg-[#1e293b]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Zapisz reguły
        </Button>
      </div>
    </div>
  );
}
