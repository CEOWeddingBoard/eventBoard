"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getEventClientMessages,
  sendEventClientMessage,
  getEventOrganizerMessages,
  sendEventOrganizerMessage,
} from "@/lib/actions/event-client.actions";

type Message = { id: string; senderRole: string; senderName: string | null; content: string; createdAt: Date };

export function EventChat({ mode, token, eventId }: { mode: "client" | "organizer"; token?: string; eventId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = mode === "client" && token ? await getEventClientMessages(token) : eventId ? await getEventOrganizerMessages(eventId) : [];
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [mode, token, eventId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const result = mode === "client" && token
        ? await sendEventClientMessage(token, text)
        : eventId
        ? await sendEventOrganizerMessage(eventId, text)
        : { ok: false };
      if (result.ok) {
        setText("");
        await load();
      } else {
        toast.error(result.error ?? "Nie udało się wysłać wiadomości");
      }
    } catch {
      toast.error("Nie udało się wysłać wiadomości");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-bold text-neutral-800">Konwersacja z {mode === "client" ? "organizatorem" : "klientem"}</h3>
      </div>

      <div className="flex h-72 flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-400">Brak wiadomości. Rozpocznij rozmowę.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderRole === (mode === "client" ? "CLIENT" : "ORGANIZER") ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.senderRole === (mode === "client" ? "CLIENT" : "ORGANIZER") ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-800"}`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">
                    {m.senderRole === "ORGANIZER" ? "Organizator" : "Klient"} · {new Date(m.createdAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-neutral-100 px-3 py-2">
          <Input className="h-9 text-sm" placeholder="Napisz wiadomość..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </section>
  );
}
