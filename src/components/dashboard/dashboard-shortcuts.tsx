"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDashboardShortcuts } from "@/lib/actions/organization.actions";

type Shortcut = { label: string; href: string };

/**
 * Gotowe cele skrótów. Wcześniej trzeba było znać wewnętrzne ścieżki
 * i wpisać je ręcznie w pole tekstowe — bez podpowiedzi i bez sprawdzenia,
 * czy adres w ogóle istnieje.
 */
const CELE: { label: string; path: string }[] = [
  { label: "Kalendarz", path: "/app/calendar" },
  { label: "Eventy", path: "/app/events" },
  { label: "Zapytania", path: "/app/leads" },
  { label: "Finanse", path: "/app/finances" },
  { label: "Zespół", path: "/app/team" },
  { label: "Konfiguracja", path: "/app/settings/configuration" },
  { label: "Procesy obsługi", path: "/app/settings/workflows" },
  { label: "Menu i katalog", path: "/app/settings/menu" },
  { label: "Reguły importu menu", path: "/app/settings/menu-parser" },
  { label: "Obiekty i sale", path: "/app/settings/venues" },
  { label: "Ustawienia", path: "/app/settings" },
];

const WLASNY = "__custom__";

export function DashboardShortcuts({
  initial,
  locale = "pl",
}: {
  initial: Shortcut[];
  locale?: string;
}) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(initial);
  const [editing, setEditing] = useState(false);
  const [cel, setCel] = useState<string>(CELE[0].path);
  const [label, setLabel] = useState(CELE[0].label);
  const [href, setHref] = useState("");
  const [busy, setBusy] = useState(false);

  const wlasny = cel === WLASNY;

  /** Skrót zapisany bez prefiksu języka i tak ma działać. */
  function pelnyAdres(path: string): string {
    if (/^https?:\/\//.test(path)) return path;
    if (path.startsWith(`/${locale}/`)) return path;
    return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
  }

  async function save(next: Shortcut[]) {
    setBusy(true);
    try {
      await updateDashboardShortcuts(next);
      setShortcuts(next);
      toast.success("Skróty zapisane");
      return true;
    } catch {
      toast.error("Nie udało się zapisać");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function wybierzCel(value: string) {
    setCel(value);
    if (value === WLASNY) {
      setLabel("");
      setHref("");
    } else {
      setLabel(CELE.find((c) => c.path === value)?.label ?? "");
      setHref("");
    }
  }

  async function add() {
    const docelowy = wlasny ? href.trim() : cel;
    const nazwa = label.trim() || CELE.find((c) => c.path === cel)?.label || "";
    if (!nazwa || !docelowy) {
      toast.error("Podaj nazwę i adres skrótu");
      return;
    }
    if (shortcuts.some((s) => s.href === docelowy)) {
      toast.error("Taki skrót już jest na pulpicie");
      return;
    }

    const ok = await save([...shortcuts, { label: nazwa, href: docelowy }]);
    // Tryb edycji zostaje otwarty — dodanie kilku skrótów pod rząd
    // nie powinno wymagać ponownego klikania „Edytuj”.
    if (ok) {
      wybierzCel(CELE[0].path);
    }
  }

  function remove(index: number) {
    void save(shortcuts.filter((_, i) => i !== index));
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Skróty</h3>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
          onClick={() => setEditing((s) => !s)}
        >
          {editing ? (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Gotowe
            </span>
          ) : (
            "Edytuj"
          )}
        </button>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap gap-2">
          {shortcuts.map((s, i) => (
            // Przycisk usuwania stoi obok odsyłacza, nie w środku — przycisk
            // zagnieżdżony w <a> jest niepoprawny i łapał kliknięcia linku.
            <span
              key={`${s.href}-${i}`}
              className="inline-flex items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50"
            >
              <Link
                href={pelnyAdres(s.href)}
                className="px-3 py-2 text-sm text-neutral-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {s.label}
              </Link>
              {editing && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={busy}
                  aria-label={`Usuń skrót ${s.label}`}
                  className="border-l border-neutral-200 px-2 py-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
          {shortcuts.length === 0 && !editing && (
            <p className="text-xs text-neutral-500">Brak skrótów. Kliknij „Edytuj”, aby dodać.</p>
          )}
        </div>

        {editing && (
          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={cel} onValueChange={wybierzCel}>
                <SelectTrigger className="h-8 w-[210px] text-xs">
                  <SelectValue placeholder="Dokąd ma prowadzić" />
                </SelectTrigger>
                <SelectContent>
                  {CELE.map((c) => (
                    <SelectItem key={c.path} value={c.path} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                  <SelectItem value={WLASNY} className="text-xs">
                    Własny adres…
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                className="h-8 w-40"
                placeholder="Nazwa na kafelku"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />

              {wlasny && (
                <Input
                  className="h-8 min-w-[180px] flex-1"
                  placeholder="/app/events albo https://…"
                  value={href}
                  onChange={(e) => setHref(e.target.value)}
                />
              )}

              <Button size="sm" onClick={add} disabled={busy}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Dodaj
              </Button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Wybierz miejsce z listy albo podaj własny adres. Skróty widzi cała organizacja.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
