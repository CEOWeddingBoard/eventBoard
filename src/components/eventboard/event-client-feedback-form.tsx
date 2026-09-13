"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { submitEventClientFeedback } from "@/lib/actions/event-client.actions";

type ApprovalItem = { section: string; status: string };

export function EventClientFeedbackForm({
  token,
  approvals,
  clientReviewedAt,
  clientFeedback,
}: {
  token: string;
  approvals: ApprovalItem[];
  clientReviewedAt: string | null;
  clientFeedback: string | null;
}) {
  const pending = approvals.filter((a) => a.status !== "APPROVED");
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(!!clientReviewedAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const result = await submitEventClientFeedback(token, {
        approveAll: false,
        sections: selected,
        feedback,
      });
      if (result.ok) {
        setDone(true);
        toast.success("Odpowiedź wysłana do restauracji");
      } else {
        toast.error(result.error ?? "Nie udało się wysłać odpowiedzi");
      }
    } catch {
      toast.error("Nie udało się wysłać odpowiedzi");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900">
              Odpowiedź została przekazana restauracji.
            </p>
            <p className="mt-1 text-emerald-800/80">
              {clientReviewedAt
                ? `Potwierdzono: ${new Date(clientReviewedAt).toLocaleString("pl-PL", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Dziękujemy za potwierdzenie."}
            </p>
            {clientFeedback && (
              <p className="mt-2 text-xs italic text-emerald-800/70">
                Twoje uwagi: „{clientFeedback}”
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600">
            Zaznacz sekcje, które akceptujesz:
          </p>
          {pending.map((item) => (
            <label
              key={item.section}
              className="flex items-center gap-2.5 text-sm text-neutral-700 cursor-pointer select-none"
            >
              <Checkbox
                checked={selected.includes(item.section)}
                onCheckedChange={(checked) =>
                  setSelected((prev) =>
                    checked === true
                      ? [...prev, item.section]
                      : prev.filter((s) => s !== item.section)
                  )
                }
              />
              {item.section}
            </label>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
          <MessageSquare className="h-3.5 w-3.5" />
          Uwagi / zmiany (opcjonalnie)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder="Np. prosimy o wersję wege dla 5 osób, zmianę godziny deseru..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-blue-400"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={sending}>
          {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Wyślij odpowiedź
        </Button>
      </div>
    </form>
  );
}
