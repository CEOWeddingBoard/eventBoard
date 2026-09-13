"use client";
import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { updateEventWidgetData } from "@/lib/actions/event-widget.actions";

export function NoteWidget({ widgetId, dataJson }: { widgetId: string; dataJson: string }) {
  const initial = JSON.parse(dataJson || "{}");
  const [text, setText] = useState<string>(initial.text ?? "");
  const [saving, setSaving] = useState(false);

  const save = useCallback(async (val: string) => {
    setSaving(true);
    try { await updateEventWidgetData(widgetId, JSON.stringify({ text: val })); }
    finally { setSaving(false); }
  }, [widgetId]);

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => save(text)}
        placeholder="Notatki do eventu..."
        className="min-h-[120px] text-sm resize-none"
      />
      {saving && <p className="text-xs text-slate-400 text-right">Zapisywanie...</p>}
    </div>
  );
}
