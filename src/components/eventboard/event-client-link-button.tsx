"use client";

import { useEffect, useState } from "react";
import { Link2, Loader2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generateEventClientLink,
  revokeEventClientLink,
} from "@/lib/actions/event-client.actions";

export function EventClientLinkButton({
  locale,
  eventId,
  eventName,
}: {
  locale: string;
  eventId: string;
  eventName: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fullUrl = url ? `${origin}${url}` : url;

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const result = await generateEventClientLink(eventId, locale);
      if (result.ok && result.url) {
        setUrl(result.url);
        setOpen(true);
      } else {
        toast.error(result.error ?? "Nie udało się wygenerować linku");
      }
    } catch {
      toast.error("Nie udało się wygenerować linku");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      const result = await revokeEventClientLink(eventId);
      if (result.ok) {
        setUrl(null);
        setOpen(false);
        toast.success("Link unieważniony");
      } else {
        toast.error(result.error ?? "Błąd");
      }
    } catch {
      toast.error("Błąd");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleGenerate} disabled={busy}>
        {busy ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="mr-1.5 h-4 w-4" />
        )}
        Link dla klienta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link decyzyjny dla klienta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Wyślij ten link zamawiającemu ({eventName}). Klient zobaczy harmonogram, menu
              i potwierdzi ustalenia — odpowiedź wróci do Ciebie w tym panelu.
            </p>
            {url && (
              <div className="flex items-center gap-2">
                  <Input readOnly value={fullUrl ?? ""} className="text-xs" />
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
            <div className="flex justify-between">
              <Button size="sm" variant="ghost" className="text-red-600" onClick={handleRevoke}>
                <X className="mr-1 h-3.5 w-3.5" />
                Unieważnij link
              </Button>
              <Button size="sm" variant="outline" onClick={handleGenerate} disabled={busy}>
                Generuj nowy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
