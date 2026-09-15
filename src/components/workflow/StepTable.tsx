"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Download, Plus, Sigma, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepField, TableRow } from "@/lib/workflow-agenda-fields";
import {
  formatujLiczbe,
  maPodsumowanie,
  podsumujTabele,
} from "@/lib/workflow-table-summary";

/**
 * Tabela kroku procesu — lista gości, teksty na winietki, cokolwiek, co jest
 * arkuszem.
 *
 * Ludzie mają te dane w Excelu i nie będą ich przepisywać komórka po komórce,
 * dlatego wklejanie bloku z arkusza jest tu funkcją pierwszej klasy, a nie
 * dodatkiem: wklejenie w dowolną komórkę rozkłada zawartość schowka na wiersze
 * i kolumny, dokładając brakujące wiersze.
 */

function emptyRow(columns: StepField[]): TableRow {
  const row: TableRow = {};
  for (const c of columns) row[c.key] = "";
  return row;
}

function inputType(type: StepField["type"]): string {
  if (type === "number") return "number";
  if (type === "date") return "date";
  if (type === "time") return "time";
  return "text";
}

export function StepTable({
  columns,
  rows,
  onChange,
  disabled = false,
}: {
  columns: StepField[];
  rows: TableRow[];
  onChange: (rows: TableRow[]) => void;
  disabled?: boolean;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (columns.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 px-3 py-4 text-sm text-neutral-500">
        Ten krok nie ma jeszcze zdefiniowanych kolumn. Uzupełnij je w edytorze procesu.
      </p>
    );
  }

  const setCell = (rowIndex: number, key: string, value: string) => {
    const next = rows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r));
    onChange(next);
  };

  const addRow = () => onChange([...rows, emptyRow(columns)]);

  const removeRow = (rowIndex: number) => {
    const next = rows.filter((_, i) => i !== rowIndex);
    onChange(next.length > 0 ? next : [emptyRow(columns)]);
  };

  /** Wklejenie bloku z arkusza: kolumny rozdzielone tabulatorem, wiersze nową linią. */
  const handlePaste = (rowIndex: number, colIndex: number, e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return; // zwykłe wklejenie do komórki

    e.preventDefault();
    const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim() !== "");
    const next = [...rows];

    lines.forEach((line, r) => {
      const cells = line.split("\t");
      const target = rowIndex + r;
      while (next.length <= target) next.push(emptyRow(columns));
      const row = { ...next[target] };
      cells.forEach((cell, c) => {
        const col = columns[colIndex + c];
        if (col) row[col.key] = cell.trim();
      });
      next[target] = row;
    });

    onChange(next);
  };

  const downloadTemplate = () => {
    const csv = Papa.unparse({
      fields: columns.map((c) => c.label || c.key),
      data: [columns.map(() => "")],
    });
    // BOM, żeby Excel nie połamał polskich znaków.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "szablon.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setImportError(null);
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim()));
        if (data.length === 0) {
          setImportError("Plik nie zawiera danych.");
          return;
        }
        // Pierwszy wiersz traktujemy jako nagłówki, gdy pasuje do etykiet kolumn.
        const first = data[0].map((c) => String(c).trim().toLowerCase());
        const labels = columns.map((c) => (c.label || c.key).toLowerCase());
        const hasHeader = first.some((c) => labels.includes(c));
        const body = hasHeader ? data.slice(1) : data;

        const imported = body.map((cells) => {
          const row = emptyRow(columns);
          cells.forEach((cell, i) => {
            const col = columns[i];
            if (col) row[col.key] = String(cell).trim();
          });
          return row;
        });

        onChange(imported.length > 0 ? imported : [emptyRow(columns)]);
      },
      error: () => setImportError("Nie udało się odczytać pliku."),
    });
  };

  const visibleRows = rows.length > 0 ? rows : [emptyRow(columns)];

  // Zestawienie liczy się w przeglądarce przy każdej zmianie komórki: osoba
  // wypełniająca widzi „mięsne × 45” od razu, a nie dopiero w agendzie.
  const podsumowanie = maPodsumowanie(columns) ? podsumujTabele(columns, rows) : null;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="w-9 border-b border-neutral-200 px-2 py-2 text-right text-[11px] font-medium text-neutral-400">
                #
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="border-b border-neutral-200 px-2 py-2 text-left text-xs font-semibold text-neutral-700"
                >
                  {c.label || c.key}
                  {c.required && <span className="text-red-500"> *</span>}
                </th>
              ))}
              <th className="w-9 border-b border-neutral-200" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, r) => (
              <tr key={r} className="even:bg-neutral-50/40">
                <td className="px-2 py-1 text-right text-[11px] text-neutral-400 tabular-nums">
                  {r + 1}
                </td>
                {columns.map((c, ci) => (
                  <td key={c.key} className="px-1 py-1">
                    {c.type === "select" ? (
                      <select
                        value={row[c.key] ?? ""}
                        disabled={disabled}
                        onChange={(e) => setCell(r, c.key, e.target.value)}
                        className="w-full min-w-[9rem] rounded border border-neutral-200 bg-white px-2 py-1 text-sm"
                      >
                        <option value="">—</option>
                        {(c.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={inputType(c.type)}
                        value={row[c.key] ?? ""}
                        disabled={disabled}
                        onChange={(e) => setCell(r, c.key, e.target.value)}
                        onPaste={(e) => handlePaste(r, ci, e)}
                        className="w-full min-w-[9rem] rounded border border-neutral-200 bg-white px-2 py-1 text-sm"
                      />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() => removeRow(r)}
                    disabled={disabled}
                    aria-label={`Usuń wiersz ${r + 1}`}
                    className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={disabled}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Dodaj wiersz
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={downloadTemplate} disabled={disabled}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Szablon CSV
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="mr-1 h-3.5 w-3.5" />
          Wgraj plik
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <span className="text-[11px] text-neutral-400">
          Możesz też wkleić dane prosto z Excela — wystarczy zaznaczyć komórki i wkleić w tabelę.
        </span>
      </div>

      {importError && <p className="text-sm text-red-600">{importError}</p>}

      {podsumowanie && podsumowanie.liczbaWierszy > 0 && (
        <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
            <Sigma className="h-3.5 w-3.5" />
            Zestawienie
            <span className="font-normal text-blue-700">
              · {podsumowanie.liczbaWierszy}{" "}
              {podsumowanie.liczbaWierszy === 1 ? "wiersz" : "wierszy"}
            </span>
          </div>

          {podsumowanie.sumy.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {podsumowanie.sumy.map((s) => (
                <span key={s.key} className="text-sm text-blue-900">
                  {s.label}:{" "}
                  <b className="tabular-nums">{formatujLiczbe(s.suma)}</b>
                </span>
              ))}
            </div>
          )}

          {podsumowanie.grupy.map((g) => (
            <div key={g.key} className="mt-2">
              <p className="text-[11px] uppercase tracking-wide text-blue-700">{g.label}</p>
              <ul className="mt-1 space-y-0.5">
                {g.pozycje.map((p) => (
                  <li key={p.wartosc} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium text-blue-950">{p.wartosc}</span>
                    <span className="tabular-nums text-blue-700">× {p.liczba}</span>
                    {p.sumy
                      .filter((s) => s.suma !== 0)
                      .map((s) => (
                        <span key={s.key} className="text-xs text-blue-600">
                          {s.label}: <b className="tabular-nums">{formatujLiczbe(s.suma)}</b>
                        </span>
                      ))}
                  </li>
                ))}
              </ul>
              {g.pozycje.length === 0 && (
                <p className="mt-1 text-xs text-blue-600">Kolumna jeszcze nieuzupełniona.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
