"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Clock, ChevronRight } from "lucide-react";
import { updateEventWidgetData } from "@/lib/actions/event-widget.actions";

type RunsheetItem = {
  id: string;
  time: string;
  duration: number;
  label: string;
  responsible: string;
  note: string;
  done: boolean;
};

export function RunsheetWidget({ widgetId, dataJson }: { widgetId: string; dataJson: string }) {
  const initial = JSON.parse(dataJson || "{}");
  const [items, setItems] = useState<RunsheetItem[]>(initial.items ?? []);
  const [liveMode, setLiveMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (newItems: RunsheetItem[]) => {
    setSaving(true);
    try {
      await updateEventWidgetData(widgetId, JSON.stringify({ items: newItems }));
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const newItem: RunsheetItem = {
      id: crypto.randomUUID(),
      time: "",
      duration: 15,
      label: "Nowy punkt",
      responsible: "",
      note: "",
      done: false,
    };
    const updated = [...items, newItem];
    setItems(updated);
    save(updated);
  };

  const updateItem = (id: string, field: keyof RunsheetItem, value: string | number | boolean) => {
    const updated = items.map((i) => (i.id === id ? { ...i, [field]: value } : i));
    setItems(updated);
    save(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    save(updated);
  };

  const currentIdx = items.findIndex((i) => !i.done);

  if (liveMode) {
    const current = items[currentIdx];
    const next = items[currentIdx + 1];
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Tryb live</span>
          <Button variant="outline" size="sm" onClick={() => setLiveMode(false)}>Edytuj</Button>
        </div>
        {current ? (
          <div className="rounded-xl bg-slate-900 text-white p-6 space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="h-4 w-4" />
              {current.time} · {current.duration} min
            </div>
            <p className="text-2xl font-semibold">{current.label}</p>
            {current.responsible && <p className="text-slate-400 text-sm">Odpowiada: {current.responsible}</p>}
            {current.note && <p className="text-slate-300 text-sm italic">{current.note}</p>}
            <Button className="mt-4 w-full" onClick={() => updateItem(current.id, "done", true)}>
              Dalej <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-8">Wszystkie punkty ukończone</div>
        )}
        {next && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">
            Następnie: <span className="text-slate-800 font-medium">{next.time} · {next.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setLiveMode(true)}>
          Tryb live
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">Brak punktów scenariusza</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[auto_1fr_auto] gap-2 items-start rounded-lg border border-slate-200 p-3">
          <Checkbox
            checked={item.done}
            onCheckedChange={(v) => updateItem(item.id, "done", !!v)}
            className="mt-1"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              value={item.time}
              onChange={(e) => updateItem(item.id, "time", e.target.value)}
              placeholder="HH:MM"
              className="h-8 text-sm"
            />
            <Input
              value={item.label}
              onChange={(e) => updateItem(item.id, "label", e.target.value)}
              placeholder="Punkt scenariusza"
              className="h-8 text-sm sm:col-span-2"
            />
            <Input
              value={String(item.duration)}
              type="number"
              min={1}
              onChange={(e) => updateItem(item.id, "duration", Number(e.target.value))}
              placeholder="Czas (min)"
              className="h-8 text-sm"
            />
            <Input
              value={item.responsible}
              onChange={(e) => updateItem(item.id, "responsible", e.target.value)}
              placeholder="Kto odpowiada"
              className="h-8 text-sm"
            />
            <Input
              value={item.note}
              onChange={(e) => updateItem(item.id, "note", e.target.value)}
              placeholder="Notatka"
              className="h-8 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem} className="w-full border-dashed">
        <Plus className="h-4 w-4 mr-1" /> Dodaj punkt
      </Button>
      {saving && <p className="text-xs text-slate-400 text-right">Zapisywanie...</p>}
    </div>
  );
}
