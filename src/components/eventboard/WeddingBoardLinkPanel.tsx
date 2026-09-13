"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWeddingBoardLink, resetWeddingBoardLink } from "@/lib/actions/wedding-board-portal.actions";
import { toast } from "sonner";

const WEDDINGBOARD_URL =
  process.env.NEXT_PUBLIC_WEDDINGBOARD_URL ?? "";

function buildWeddingLink(token: string): string {
  const base = WEDDINGBOARD_URL || "";
  return base ? `${base}/wedding/${token}` : `/wedding/${token}`;
}

export function WeddingBoardLinkPanel({
  eventId,
  initialToken,
}: {
  eventId: string;
  initialToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const link = token ? buildWeddingLink(token) : null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateWeddingBoardLink(eventId);
      if (result.ok && result.token) {
        setToken(result.token);
        toast.success("Link WeddingBoard wygenerowany");
      } else {
        toast.error(result.error ?? "Nie udało się wygenerować linku");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    try {
      const result = await resetWeddingBoardLink(eventId);
      if (result.ok && result.token) {
        setToken(result.token);
        toast.success("Link został zresetowany — stary link przestał działać");
      } else {
        toast.error(result.error ?? "Nie udało się zresetować linku");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link skopiowany do schowka");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nie udało się skopiować");
    }
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-violet-500 fill-violet-500" />
        <h3 className="text-sm font-semibold text-violet-900">Link dla pary — WeddingBoard</h3>
      </div>

      {!token ? (
        <div>
          <p className="text-xs text-violet-700 mb-3">
            Wygeneruj link dla pary młodej. Otworzą dedykowaną stronę WeddingBoard z harmonogramem,
            menu i procesem akceptacji. Mogą korzystać bez zakładania konta.
          </p>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? "Generowanie…" : "Wygeneruj link WeddingBoard"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border border-violet-200 bg-white px-3 py-2">
            <span className="flex-1 truncate text-xs text-neutral-700 font-mono">{link}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 text-violet-500 hover:text-violet-700"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={link!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Otwórz podgląd
            </a>
            <span className="text-neutral-300">·</span>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Wygeneruj nowy link
            </button>
          </div>
          <p className="text-[11px] text-violet-600">
            Para może otworzyć ten link bez logowania. Jeśli chce pełnych funkcji WeddingBoard (budżet, seating, zadania) — może się zarejestrować ze strony linku.
          </p>
        </div>
      )}
    </div>
  );
}
