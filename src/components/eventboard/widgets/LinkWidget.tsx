"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { updateEventWidgetData } from "@/lib/actions/event-widget.actions";

type LinkItem = { id: string; label: string; url: string };

export function LinkWidget({ widgetId, dataJson }: { widgetId: string; dataJson: string }) {
  const parsed = (() => { try { return JSON.parse(dataJson || "{}"); } catch { return {}; } })();
  const [links, setLinks] = useState<LinkItem[]>(parsed.links ?? []);

  const save = async (next: LinkItem[]) => {
    await updateEventWidgetData(widgetId, JSON.stringify({ links: next }));
  };

  const add = () => {
    const updated = [...links, { id: crypto.randomUUID(), label: "Nowy link", url: "" }];
    setLinks(updated);
    save(updated);
  };

  const update = (id: string, field: keyof LinkItem, value: string) => {
    const updated = links.map((l) => (l.id === id ? { ...l, [field]: value } : l));
    setLinks(updated);
    save(updated);
  };

  const remove = (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    save(updated);
  };

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <div key={link.id} className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex-1 grid gap-1.5 sm:grid-cols-2">
            <Input
              value={link.label}
              onChange={(e) => update(link.id, "label", e.target.value)}
              placeholder="Etykieta"
              className="h-7 text-sm"
            />
            <Input
              value={link.url}
              onChange={(e) => update(link.id, "url", e.target.value)}
              placeholder="https://..."
              className="h-7 text-sm"
            />
          </div>
          {link.url && (
            <a
              href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-blue-500 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={() => remove(link.id)}
            className="shrink-0 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {links.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-3">Brak linków</p>
      )}

      <Button variant="outline" size="sm" onClick={add} className="w-full border-dashed gap-1.5">
        <Plus className="h-4 w-4" /> Dodaj link
      </Button>
    </div>
  );
}
