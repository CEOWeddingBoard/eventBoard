"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardPaste, Loader2, Settings2 } from "lucide-react";
import Link from "next/link";
import { parseMenuText, COURSE_TYPES, type ParsedVariant, type ParserRules } from "@/lib/menu-parser";
import { getMenuParserRules, importParsedMenu } from "@/lib/actions/menu-parser.actions";

const typeLabel = (t: string) => COURSE_TYPES.find((c) => c.value === t)?.label ?? t;

export function MenuImportDialog({ eventId, onImported }: { eventId: string; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rules, setRules] = useState<ParserRules | null>(null);
  const [parsed, setParsed] = useState<ParsedVariant[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleOpen(v: boolean) {
    setOpen(v);
    if (v && !rules) {
      try {
        setRules(await getMenuParserRules());
      } catch {
        /* użyjemy domyślnych po pierwszym parsowaniu */
      }
    }
  }

  function reparse(value: string) {
    setText(value);
    setParsed(parseMenuText(value, rules ?? undefined));
  }

  const totalCourses = parsed.reduce((s, v) => s + v.courses.length, 0);

  async function handleImport() {
    if (parsed.length === 0) return;
    setBusy(true);
    try {
      const res = await importParsedMenu(eventId, parsed);
      toast.success(`Zaimportowano ${res.created} wariant(y) menu`);
      setOpen(false);
      setText("");
      setParsed([]);
      onImported();
    } catch {
      toast.error("Nie udało się zaimportować menu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <ClipboardPaste className="h-4 w-4" />
          Wklej menu z tekstu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import menu z tekstu</DialogTitle>
          <DialogDescription>
            Wklej menu (warianty, sekcje, pozycje od myślnika). System rozpozna strukturę wg reguł
            organizacji — sprawdź podgląd i zaimportuj.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-600">Wklejone menu</label>
              <Link href="/pl/app/settings/menu-parser" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                <Settings2 className="h-3 w-3" /> Reguły parsera
              </Link>
            </div>
            <Textarea
              value={text}
              onChange={(e) => reparse(e.target.value)}
              rows={16}
              placeholder={"Wariant I – menu klasyczne\n250 PLN netto/os.\n\nBufet dań ciepłych\n* cordon bleu ze schabu,\n* pierogi z kapustą i grzybami.\n\nBufet deserowy\n* sernik cynamonowy."}
              className="text-xs font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Podgląd ({parsed.length} wariant(y), {totalCourses} pozycji)
            </label>
            <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50/60 p-3">
              {parsed.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-400">Wklej tekst po lewej, żeby zobaczyć rozpoznaną strukturę.</p>
              ) : (
                parsed.map((v, i) => (
                  <div key={i} className="rounded-md border border-neutral-200 bg-white p-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-800">{v.label}</p>
                      {v.pricePerPerson != null && (
                        <span className="text-xs font-semibold text-emerald-700">{v.pricePerPerson} zł/os.</span>
                      )}
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {v.courses.map((c, ci) => (
                        <li key={ci} className="flex items-center gap-2 text-xs text-neutral-700">
                          <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                            {typeLabel(c.courseType)}
                          </span>
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

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Anuluj</Button>
          <Button onClick={handleImport} disabled={busy || parsed.length === 0}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importuj do menu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
