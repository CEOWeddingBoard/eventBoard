"use client";

import { useEffect, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAgendaDocumentTemplates } from "@/lib/actions/agenda-document-template.actions";

type Template = { id: string; name: string; description: string | null };

export function EventDocumentPanel({ locale, eventId }: { locale: string; eventId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAgendaDocumentTemplates()
      .then((items) => setTemplates(items))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const open = (templateId: string) => {
    window.open(`/${locale}/app/events/${eventId}/document?templateId=${templateId}`, "_blank");
  };

  if (loading) return null;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-bold text-neutral-800">Dokumenty eventu</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Wygeneruj dokument z szablonu wypełnionego danymi tego eventu.
      </p>
      {templates.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-400">
          Brak szablonów dokumentów. Dodaj je w konfiguracji organizacji.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {templates.map((template) => (
            <Button key={template.id} size="sm" variant="outline" onClick={() => open(template.id)}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {template.name}
              <ExternalLink className="ml-1 h-3 w-3 text-neutral-400" />
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
