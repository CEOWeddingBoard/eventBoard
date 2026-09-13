"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STATUS_LABELS, leadStatusLabel } from "@/lib/event-status";
import { toast } from "sonner";
import {
  updateOrgLeadStatus,
  convertLeadToEvent,
} from "@/lib/actions/org-ecosystem.actions";

type Lead = {
  id: string;
  createdAt: Date;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  eventDate: Date | null;
  guestCount: number | null;
  message: string | null;
};

export default function LeadsClientPage({
  initialLeads,
  locale,
}: {
  initialLeads: Lead[];
  locale: string;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  // Bez filtrów lista działa przy trzech zapytaniach, ale nie przy pięćdziesięciu.
  const visibleLeads = filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  const handleStatusChange = async (leadId: string, status: string) => {
    setBusy(leadId);
    try {
      await updateOrgLeadStatus(leadId, status);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
      toast.success("Status zaktualizowany");
    } catch {
      toast.error("Błąd aktualizacji");
    } finally {
      setBusy(null);
    }
  };

  const handleConvert = async (leadId: string) => {
    setBusy(leadId);
    try {
      const result = await convertLeadToEvent(leadId);
      toast.success("Lead przekonwertowany na event");
      window.location.href = `/${locale}/app/events/${result.id}`;
    } catch {
      toast.error("Błąd konwersji");
    } finally {
      setBusy(null);
    }
  };

  const statusColors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-yellow-100 text-yellow-700",
    WON: "bg-emerald-100 text-emerald-700",
    LOST: "bg-neutral-100 text-neutral-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Zapytania</h1>
        <p className="text-sm text-neutral-500">Zarządzaj zapytaniami od klientów</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200">
        {[["ALL", "Wszystkie"], ...Object.entries(LEAD_STATUS_LABELS)].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              filter === value
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {label}
            <span className="ml-1.5 text-neutral-400">
              {value === "ALL" ? leads.length : leads.filter((l) => l.status === value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visibleLeads.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-500">
            Brak zapytań w tym filtrze.
          </p>
        )}
        {visibleLeads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  {lead.name || "Bez nazwy"}
                </p>
                <p className="text-xs text-neutral-500">
                  Wpłynęło {new Date(lead.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
              <Badge className={statusColors[lead.status] || "bg-neutral-100"}>
                {leadStatusLabel(lead.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {lead.email && (
                <div>
                  <span className="text-neutral-500">Email:</span>{" "}
                  <span className="text-neutral-700">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div>
                  <span className="text-neutral-500">Telefon:</span>{" "}
                  <span className="text-neutral-700">{lead.phone}</span>
                </div>
              )}
              {lead.eventDate && (
                <div>
                  <span className="text-neutral-500">Preferowana data:</span>{" "}
                  <span className="text-neutral-700">
                    {new Date(lead.eventDate).toLocaleDateString("pl-PL")}
                  </span>
                </div>
              )}
              {lead.guestCount && (
                <div>
                  <span className="text-neutral-500">Goście:</span>{" "}
                  <span className="text-neutral-700">{lead.guestCount}</span>
                </div>
              )}
            </div>

            {lead.message && (
              <div className="text-xs">
                <span className="text-neutral-500">Wiadomość:</span>
                <p className="mt-1 text-neutral-700 bg-neutral-50 p-2 rounded">
                  {lead.message}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Select
                value={lead.status}
                onValueChange={(v) => handleStatusChange(lead.id, v)}
                disabled={busy === lead.id}
              >
                <SelectTrigger className="h-8 w-[170px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_STATUS_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              {lead.status !== "WON" && (
                <Button
                  size="sm"
                  onClick={() => handleConvert(lead.id)}
                  disabled={busy === lead.id}
                >
                  Utwórz event
                </Button>
              )}
            </div>
          </div>
        ))}
        {leads.length === 0 && (
          <p className="text-sm text-neutral-400">Brak zapytań.</p>
        )}
      </div>
    </div>
  );
}
