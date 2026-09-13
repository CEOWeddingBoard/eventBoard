"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { submitEventClientMenu } from "@/lib/actions/event-client.actions";

type Variant = { id: string; label: string };
type Selection = { variantId: string; guests: number };

export function EventClientMenuForm({
  token,
  variants,
  initialSelection,
  submitted,
}: {
  token: string;
  variants: Variant[];
  initialSelection: Selection[];
  submitted: boolean;
}) {
  const [selection, setSelection] = useState<Selection[]>(initialSelection);
  const [sending, setSending] = useState(false);

  const update = (variantId: string, guests: string) => {
    const value = Number.parseInt(guests, 10);
    setSelection((current) => [
      ...current.filter((item) => item.variantId !== variantId),
      ...(Number.isInteger(value) && value > 0 ? [{ variantId, guests: value }] : []),
    ]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const result = await submitEventClientMenu(token, selection);
      if (!result.ok) toast.error(result.error ?? "Nie udało się wysłać wyboru");
      else toast.success("Wybór menu wysłany do organizatora");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <p className="text-xs text-neutral-500">Wpisz liczbę osób przy wybranym menu. Możesz wybrać więcej niż jeden wariant.</p>
      {variants.map((variant) => {
        const current = selection.find((item) => item.variantId === variant.id);
        return (
          <div key={variant.id} className="flex items-center gap-3 rounded-md border border-neutral-200 p-3">
            <input
              type="checkbox"
              checked={!!current}
              onChange={(e) => update(variant.id, e.target.checked ? String(current?.guests ?? 1) : "")}
            />
            <span className="flex-1 text-sm font-medium">{variant.label}</span>
            <Input
              className="h-8 w-28 text-xs"
              type="number"
              min={1}
              placeholder="osoby"
              value={current?.guests ?? ""}
              onChange={(e) => update(variant.id, e.target.value)}
            />
          </div>
        );
      })}
      <Button type="submit" disabled={sending || selection.length === 0}>
        {submitted ? "Wyślij aktualizację wyboru" : "Potwierdź menu i wyślij"}
      </Button>
    </form>
  );
}
