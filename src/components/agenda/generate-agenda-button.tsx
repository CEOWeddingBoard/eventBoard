"use client";

import { useState } from "react";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateAgendaDocxBase64 } from "@/lib/ai/agenda-generator";

export function GenerateAgendaButton({ eventId }: { eventId: string }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { base64, fileName } = await generateAgendaDocxBase64(eventId);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Agenda wygenerowana (DOCX)");
    } catch {
      toast.error("Nie udało się wygenerować agendy");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={generating} size="sm">
      {generating ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-1.5 h-4 w-4" />
      )}
      Generuj agendę (DOCX)
    </Button>
  );
}
