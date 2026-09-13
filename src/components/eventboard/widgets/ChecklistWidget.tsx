"use client";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { updateEventWidgetData } from "@/lib/actions/event-widget.actions";

type ChecklistItem = { id: string; label: string; done: boolean };

export function ChecklistWidget({ widgetId, dataJson }: { widgetId: string; dataJson: string }) {
  const initial = JSON.parse(dataJson || "{}");
  const [items, setItems] = useState<ChecklistItem[]>(initial.items ?? []);
  const [newLabel, setNewLabel] = useState("");

  const save = async (newItems: ChecklistItem[]) => {
    await updateEventWidgetData(widgetId, JSON.stringify({ items: newItems }));
  };

  const toggle = (id: string) => {
    const updated = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    setItems(updated);
    save(updated);
  };

  const add = () => {
    if (!newLabel.trim()) return;
    const updated = [...items, { id: crypto.randomUUID(), label: newLabel.trim(), done: false }];
    setItems(updated);
    setNewLabel("");
    save(updated);
  };

  const remove = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    save(updated);
  };

  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <p className="text-xs text-slate-500">{done}/{items.length} ukończone</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 group">
          <Checkbox checked={item.done} onCheckedChange={() => toggle(item.id)} />
          <span className={`flex-1 text-sm ${item.done ? "line-through text-slate-400" : "text-slate-800"}`}>
            {item.label}
          </span>
          <Button
            variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => remove(item.id)}
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Dodaj punkt..."
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={add} className="h-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
