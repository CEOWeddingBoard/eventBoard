"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createOrgLead } from "@/lib/actions/org-ecosystem.actions";

export function OrgInquiryForm({
  organizationId,
  brandColor = "#0f172a",
}: {
  organizationId: string;
  /** Kolor przewodni obiektu — formularz jest jego wizytówką, nie naszą. */
  brandColor?: string;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    guestCount: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Podaj imię i email");
      return;
    }
    setBusy(true);
    try {
      await createOrgLead(organizationId, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        eventDate: form.eventDate || undefined,
        guestCount: form.guestCount ? parseInt(form.guestCount) : undefined,
        message: form.message || undefined,
      });
      toast.success("Zapytanie wysłane! Skontaktujemy się wkrótce.");
      setForm({
        name: "",
        email: "",
        phone: "",
        eventDate: "",
        guestCount: "",
        message: "",
      });
    } catch {
      toast.error("Błąd wysyłania zapytania");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        placeholder="Imię i nazwisko"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        type="tel"
        placeholder="Telefon (opcjonalnie)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <div>
        <label htmlFor="lead-date" className="mb-1 block text-xs font-medium text-neutral-600">
          Preferowana data
        </label>
        <Input
          id="lead-date"
          type="date"
          value={form.eventDate}
          onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
        />
      </div>
      <Input
        type="number"
        placeholder="Liczba gości (opcjonalnie)"
        value={form.guestCount}
        onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
      />
      <Textarea
        placeholder="Wiadomość (opcjonalnie)"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        rows={4}
      />
      <Button
        type="submit"
        disabled={busy}
        className="w-full border-0 text-white hover:opacity-90"
        style={{ backgroundColor: brandColor }}
      >
        {busy ? "Wysyłanie…" : "Wyślij zapytanie"}
      </Button>
      <p className="text-center text-[11px] text-neutral-400">
        Odpowiadamy zwykle w ciągu jednego dnia roboczego.
      </p>
    </form>
  );
}
