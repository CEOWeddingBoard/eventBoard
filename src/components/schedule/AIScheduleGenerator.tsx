"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Save, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { generateAISchedule, saveGeneratedSchedule } from "@/lib/ai/schedule-generator";

interface GeneratedItem {
  title: string;
  description: string;
  location: string | null;
  startTime: string;
  endTime: string;
}

interface AIScheduleGeneratorProps {
  eventId: string;
  onScheduleGenerated?: () => void;
}

export function AIScheduleGenerator({ eventId, onScheduleGenerated }: AIScheduleGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [instructions, setInstructions] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateAISchedule(eventId, instructions || undefined);
      setItems(result);
    } catch {
      toast.error("Nie udało się wygenerować harmonogramu");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveGeneratedSchedule(eventId, items);
      toast.success(`Zapisano ${items.length} punktów harmonogramu`);
      setOpen(false);
      onScheduleGenerated?.();
    } catch {
      toast.error("Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <Sparkles className="h-4 w-4" />
        Generuj harmonogram (AI)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-olive" />
              Harmonogram dnia — AI
            </DialogTitle>
            <DialogDescription>
              AI wygeneruje szczegółowy harmonogram na podstawie danych wydarzenia, menu i liczby gości.
            </DialogDescription>
          </DialogHeader>

          {items.length === 0 ? (
            <div className="space-y-4">
              <div>
                <Label>Dodatkowe instrukcje (opcjonalnie)</Label>
                <Input
                  className="h-9 text-sm mt-1"
                  placeholder="np. obiad o 14:00, przerwa kawowa o 16:00..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generowanie...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generuj harmonogram
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-olive/10 bg-olive-muted/5">
                  <Clock className="h-4 w-4 mt-0.5 text-olive shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink text-sm">
                      {formatTime(item.startTime)} — {formatTime(item.endTime)}
                    </p>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-ink-muted">{item.description}</p>
                    {item.location && (
                      <p className="text-xs text-ink-muted">Miejsce: {item.location}</p>
                    )}
                  </div>
                </div>
              ))}
              <DialogFooter>
                <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                  Regeneruj
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Zapisz harmonogram
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
