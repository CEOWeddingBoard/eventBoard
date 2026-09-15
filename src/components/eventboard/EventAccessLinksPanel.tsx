"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Plus, Ban, Copy, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listEventAccessLinks,
  createEventAccessLink,
  revokeEventAccessLink,
  sendEventAccessLink,
  type LinkDecyzyjny,
} from "@/lib/actions/event-access-links.actions";
import { ASSIGNEE_ROLE_OPTIONS, assigneeRoleLabel } from "@/lib/workflow-roles";

/**
 * Linki decyzyjne dla osób bez konta w systemie.
 *
 * Przy jednym przyjęciu decyduje więcej osób z zewnątrz niż sam zamawiający:
 * wedding planner prowadzi ustalenia w imieniu klienta, podwykonawca
 * potwierdza swoją część. Każde z nich dostaje własny link w swojej roli
 * i widzi wyłącznie kroki tej roli.
 */

// Role, które realnie wchodzą przez link. Kuchnia, kelnerzy i manager pracują
// w panelu na koncie, więc linku decyzyjnego nie potrzebują.
const ROLE_ZEWNETRZNE = ["CLIENT", "PLANNER"];

function dataPl(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EventAccessLinksPanel({
  eventId,
  canEdit,
  locale = "pl",
}: {
  eventId: string;
  canEdit: boolean;
  locale?: string;
}) {
  const [linki, setLinki] = useState<LinkDecyzyjny[] | null>(null);
  const [form, setForm] = useState({ role: "CLIENT", label: "", email: "" });
  const [wlasnaRola, setWlasnaRola] = useState("");
  const [busy, setBusy] = useState(false);
  const [swiezyLink, setSwiezyLink] = useState<{ id: string; url: string; path: string } | null>(null);
  const [wysylka, setWysylka] = useState(false);
  const [skopiowany, setSkopiowany] = useState(false);

  useEffect(() => {
    listEventAccessLinks(eventId).then(setLinki);
  }, [eventId]);

  const rolaDoZapisu = form.role === "CUSTOM" ? wlasnaRola.trim() : form.role;

  async function dodaj() {
    if (!form.label.trim() || !rolaDoZapisu) return;
    setBusy(true);
    try {
      const res = await createEventAccessLink(eventId, {
        role: rolaDoZapisu,
        label: form.label.trim(),
        email: form.email || null,
        locale,
      });
      if (res.ok && res.link) {
        setLinki((prev) => [...(prev ?? []), res.link!]);
        setSwiezyLink({
          id: res.link.id,
          url: `${window.location.origin}${res.link.url}`,
          path: res.link.url!,
        });
        setSkopiowany(false);
        setForm({ role: form.role, label: "", email: "" });
      } else {
        toast.error(res.error ?? "Nie udało się utworzyć linku");
      }
    } finally {
      setBusy(false);
    }
  }

  async function uniewaznij(id: string) {
    const res = await revokeEventAccessLink(id);
    if (res.ok) {
      setLinki((prev) =>
        (prev ?? []).map((l) => (l.id === id ? { ...l, revokedAt: new Date().toISOString() } : l)),
      );
      if (swiezyLink?.id === id) setSwiezyLink(null);
    } else {
      toast.error(res.error ?? "Nie udało się unieważnić");
    }
  }

  async function wyslijMailem() {
    const link = linki?.find((l) => l.id === swiezyLink?.id);
    const email = form.email.trim() || link?.email || "";
    if (!swiezyLink || !email) {
      toast.error("Podaj adres e-mail przed wystawieniem linku.");
      return;
    }
    setWysylka(true);
    try {
      const res = await sendEventAccessLink(eventId, {
        linkId: swiezyLink.id,
        email,
        url: swiezyLink.path,
      });
      if (res.ok) {
        toast.success(`Link wysłany na ${email}`);
        setLinki((prev) => (prev ?? []).map((l) => (l.id === swiezyLink.id ? { ...l, email } : l)));
      } else {
        toast.error(res.error ?? "Nie udało się wysłać");
      }
    } finally {
      setWysylka(false);
    }
  }

  async function kopiuj() {
    if (!swiezyLink) return;
    try {
      await navigator.clipboard.writeText(swiezyLink.url);
      setSkopiowany(true);
    } catch {
      toast.error("Skopiuj adres ręcznie — przeglądarka nie dała dostępu do schowka.");
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-800">
        <Link2 className="h-4 w-4 text-[#7a5f28]" />
        Linki decyzyjne (bez konta)
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        Każda osoba spoza systemu — zamawiający, planner, podwykonawca — dostaje własny
        link i widzi <b>wyłącznie kroki swojej roli</b>.
      </p>

      {linki && linki.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {linki.map((l) => {
            const wygasl = new Date(l.expiresAt) < new Date();
            const nieaktywny = !!l.revokedAt || wygasl;
            return (
              <li
                key={l.id}
                className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-2 ${
                  nieaktywny ? "bg-neutral-50/50 opacity-60" : "bg-neutral-50"
                }`}
              >
                <span className="text-sm font-medium text-neutral-800">{l.label}</span>
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                  {assigneeRoleLabel(l.role)}
                </span>
                {l.email && <span className="text-[11px] text-neutral-500">{l.email}</span>}

                <span className="text-[11px] text-neutral-400">
                  {l.revokedAt
                    ? "unieważniony"
                    : wygasl
                      ? "wygasł"
                      : `ważny do ${dataPl(l.expiresAt)}`}
                </span>
                {l.lastUsedAt && (
                  <span className="text-[11px] text-neutral-400">
                    · użyty {dataPl(l.lastUsedAt)}
                  </span>
                )}

                {canEdit && !nieaktywny && (
                  <button
                    type="button"
                    onClick={() => uniewaznij(l.id)}
                    title="Unieważnij link"
                    className="ml-auto rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {linki && linki.length === 0 && (
        <p className="mt-3 text-xs text-neutral-400">Nie wystawiono jeszcze żadnego linku.</p>
      )}

      {/* Adres pokazujemy raz — w bazie leży wyłącznie skrót tokenu, więc
          zgubionego linku nie da się odtworzyć, trzeba wystawić nowy. */}
      {swiezyLink && (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-900">
            Skopiuj i wyślij teraz — tego adresu nie pokażemy drugi raz.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 text-[11px] text-neutral-700">
              {swiezyLink.url}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={wyslijMailem}
              disabled={wysylka}
            >
              <Send className="mr-1 h-3.5 w-3.5" />
              Wyślij mailem
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={kopiuj}>
              {skopiowany ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" /> Skopiowano
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Kopiuj
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Kto to jest, np. Ania — planner"
            className="h-8 max-w-[220px] text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-xs"
            aria-label="Rola"
          >
            {ASSIGNEE_ROLE_OPTIONS.filter(
              (r) => ROLE_ZEWNETRZNE.includes(r.value) || r.value === "CUSTOM",
            ).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {form.role === "CUSTOM" && (
            <Input
              value={wlasnaRola}
              onChange={(e) => setWlasnaRola(e.target.value)}
              placeholder="np. Florysta"
              className="h-8 w-36 text-sm"
            />
          )}
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="E-mail (opcjonalnie)"
            className="h-8 w-48 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={dodaj}
            disabled={busy || !form.label.trim() || !rolaDoZapisu}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Wystaw link
          </Button>
        </div>
      )}
    </section>
  );
}
