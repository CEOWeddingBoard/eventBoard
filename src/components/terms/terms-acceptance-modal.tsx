"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TermsContent, TERMS_TITLE } from "./terms-content";
import { cn } from "@/lib/utils";

interface TermsAcceptanceModalProps {
  open: boolean;
  locale: string;
  onAccepted: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Domyślnie akceptacja przez Clerk (właściciel konta). */
  acceptTermsPath?: string;
}

export function TermsAcceptanceModal({
  open,
  locale,
  onAccepted,
  dismissible = false,
  onDismiss,
  acceptTermsPath,
}: TermsAcceptanceModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [internalOpen, setInternalOpen] = React.useState(open);

  React.useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const path = acceptTermsPath ?? `/${locale}/api/accept-terms`;
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Błąd zapisu");
      }
      onAccepted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && dismissible) {
      setInternalOpen(false);
      onDismiss?.();
    }
  };

  return (
    <DialogPrimitive.Root open={internalOpen} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[100] w-full max-w-lg max-h-[85vh]",
            "translate-x-[-50%] translate-y-[-50%]",
            "border border-olive/25 bg-wedding-card shadow-wedding",
            "flex flex-col rounded-2xl overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          onPointerDownOutside={(e) => {
            if (!dismissible) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!dismissible) {
              e.preventDefault();
            }
          }}
          aria-describedby="terms-body"
        >
          <DialogPrimitive.Title className="sr-only">
            {TERMS_TITLE}
          </DialogPrimitive.Title>
          <div className="p-6 sm:p-8 border-b border-olive/20">
            <h2 className="font-script text-3xl font-normal text-ink tracking-tight" id="terms-heading">
              {TERMS_TITLE}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Korzystanie z serwisu wymaga akceptacji regulaminu. Przeczytaj go i potwierdź przed dodaniem płatności.
            </p>
          </div>
          <div id="terms-body" className="flex-1 overflow-y-auto p-6 sm:p-8 min-h-0" aria-labelledby="terms-heading">
            <TermsContent />
          </div>
          <div className="p-6 sm:p-8 border-t border-olive/20 bg-white/50">
            {error && (
              <p className="mb-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {dismissible && (
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="order-2 text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline sm:order-1"
                >
                  Wrócę do tego później
                </button>
              )}
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className={cn(
                  "order-1 w-full rounded-xl px-6 py-3.5 text-base font-semibold tracking-wide",
                  "bg-gold-soft text-ink shadow-gold-soft",
                  "hover:bg-gold hover:shadow-wedding-hover",
                  "active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
                  "transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none sm:order-2 sm:w-auto sm:min-w-[180px]"
                )}
              >
                {loading ? "Zapisywanie…" : "Akceptuję regulamin"}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
