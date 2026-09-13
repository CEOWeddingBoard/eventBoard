"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentChatProps {
  locale: string;
  token: string;
  displayName: string;
  scope: string;
}

export function AgentChat({ locale, token, displayName, scope }: AgentChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const scopeLabel =
    locale === "pl"
      ? scope === "COUPLE"
        ? "Asystent dla pary młodej"
        : scope === "VENDOR"
        ? "Asystent dla usługodawcy"
        : "Asystent dla gości"
      : scope === "COUPLE"
      ? "Assistant for the couple"
      : scope === "VENDOR"
      ? "Assistant for vendor"
      : "Assistant for guests";

  const scopeHint =
    locale === "pl"
      ? scope === "COUPLE"
        ? "Widzę budżet, zadania, gości i plan dnia tego wesela."
        : scope === "VENDOR"
        ? "Odpowiadam tylko w oparciu o dane tej usługi i terminu wesela."
        : "Odpowiadam na pytania o datę, miejsce, plan dnia i dress code."
      : scope === "COUPLE"
      ? "I see this wedding's budget, tasks, guests and schedule."
      : scope === "VENDOR"
      ? "I only use data about this service and wedding date."
      : "I answer about date, location, schedule and dress code.";

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/agent/${token}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: locale === "pl"
              ? `Błąd: ${err?.error ?? res.statusText}. Spróbuj ponownie.`
              : `Error: ${err?.error ?? res.statusText}. Please try again.`,
          },
        ]);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.content ?? "" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            locale === "pl"
              ? "Nie udało się połączyć. Spróbuj ponownie."
              : "Could not connect. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions =
    locale === "pl"
      ? [
          "O której zaczyna się wesele?",
          "Gdzie dokładnie jest wesele?",
          "Jaki jest dress code?",
        ]
      : [
          "What time does the wedding start?",
          "Where exactly is the wedding?",
          "What is the dress code?",
        ];

  return (
    <div className="flex flex-col h-full min-h-[360px] bg-white/90">
      <div className="px-4 pt-3 pb-2 border-b border-olive/10 bg-olive-muted/10">
        <p className="text-[11px] font-medium text-olive uppercase tracking-wide">
          {scopeLabel}
        </p>
        <p className="text-xs text-ink-muted mt-0.5">{scopeHint}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="space-y-3 text-[15px] text-ink-muted">
            <p>
              {locale === "pl"
                ? "Zadaj pytanie, a odpowiem na podstawie skonfigurowanych danych o weselu."
                : "Ask a question and I'll answer based on the configured wedding data."}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-xl px-3 py-2 text-[15px] ${
              m.role === "user"
                ? "ml-6 bg-olive/10 text-ink"
                : "mr-6 bg-olive-muted/50 text-ink"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-ink-muted text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{locale === "pl" ? "Piszę…" : "Typing…"}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 p-3 border-t border-olive/15 bg-white/95">
        {quickQuestions.map((q) => (
          <Button
            key={q}
            type="button"
            variant="outline"
            size="sm"
            className="text-[13px] rounded-full"
            onClick={() => sendMessage(q)}
            disabled={loading}
          >
            {q}
          </Button>
        ))}
      </div>
      <div className="p-3 border-t border-olive/15 flex gap-2 bg-white/95">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={locale === "pl" ? "Twoje pytanie…" : "Your question…"}
          rows={2}
          className="resize-none text-[15px] flex-1"
          disabled={loading}
        />
        <Button
          type="button"
          size="icon"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
