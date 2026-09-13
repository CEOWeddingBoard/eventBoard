"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, RotateCcw, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  getAgendaApprovals,
  initializeAgendaApprovals,
  approveAgendaSection,
  rejectAgendaSection,
  resetAgendaApprovals,
} from "@/lib/actions/agenda-approval.actions";
import { generateAgendaDocxBase64, checkAllAgendaApproved } from "@/lib/ai/agenda-generator";

interface Approval {
  id: string;
  eventId: string;
  section: string;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  comment: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  SCHEDULE: "Harmonogram",
  MENU: "Menu",
  GUESTS: "Goście",
  KITCHEN: "Kuchnia",
  GENERAL: "Ogólne",
};

interface AgendaApprovalPanelProps {
  eventId: string;
}

export function AgendaApprovalPanel({ eventId }: AgendaApprovalPanelProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [allApproved, setAllApproved] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getAgendaApprovals(eventId);
      if (data.length === 0) {
        await initializeAgendaApprovals(eventId);
        const fresh = await getAgendaApprovals(eventId);
        setApprovals(fresh);
      } else {
        setApprovals(data);
      }
      try {
        const ok = await checkAllAgendaApproved(eventId);
        setAllApproved(ok);
      } catch (error) {
        console.error("[agenda-approval] status check failed:", error);
        setAllApproved(false);
      }
    } catch (error) {
      console.error("[agenda-approval] load failed:", error);
      setApprovals([]);
      setAllApproved(false);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (section: string) => {
    try {
      await approveAgendaSection(eventId, section);
      setApprovals((prev) =>
        prev.map((a) =>
          a.section === section ? { ...a, status: "APPROVED" } : a
        )
      );
      toast.success(`${SECTION_LABELS[section]} — zaakceptowano`);
      const ok = await checkAllAgendaApproved(eventId);
      setAllApproved(ok);
    } catch {
      toast.error("Nie udało się zaakceptować");
    }
  };

  const handleReject = async (section: string) => {
    const reason = prompt("Powód odrzucenia:");
    if (!reason) return;
    try {
      await rejectAgendaSection(eventId, section, reason);
      setApprovals((prev) =>
        prev.map((a) =>
          a.section === section ? { ...a, status: "REJECTED", comment: reason } : a
        )
      );
      toast.success(`${SECTION_LABELS[section]} — odrzucono`);
      setAllApproved(false);
    } catch {
      toast.error("Błąd");
    }
  };

  const handleReset = async () => {
    try {
      await resetAgendaApprovals(eventId);
      const data = await getAgendaApprovals(eventId);
      setApprovals(data);
      setAllApproved(false);
      toast.success("Zresetowano akceptacje");
    } catch {
      toast.error("Błąd");
    }
  };

  const handleGenerateAgenda = async () => {
    setGenerating(true);
    try {
      const { base64, fileName } = await generateAgendaDocxBase64(eventId);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Agenda wygenerowana (DOCX)");
    } catch {
      toast.error("Nie udało się wygenerować agendy");
    } finally {
      setGenerating(false);
    }
  };

  const approvedCount = approvals.filter((a) => a.status === "APPROVED").length;
  const totalCount = approvals.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-olive" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Akceptacje agendy</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" onClick={handleGenerateAgenda} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-1 h-4 w-4" />
            )}
            Generuj agendę
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Badge variant={allApproved ? "default" : "secondary"}>
            {approvedCount}/{totalCount} zaakceptowanych
          </Badge>
        </div>
        <div className="space-y-2">
          {approvals.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                a.status === "APPROVED"
                  ? "border-green-200 bg-green-50/50"
                  : a.status === "REJECTED"
                  ? "border-red-200 bg-red-50/50"
                  : "border-olive/10"
              }`}
            >
              <div className="flex items-center gap-3">
                {a.status === "APPROVED" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : a.status === "REJECTED" ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="font-medium text-sm">{SECTION_LABELS[a.section] ?? a.section}</p>
                  {a.comment && (
                    <p className="text-xs text-ink-muted">{a.comment}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={a.status === "APPROVED" ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => handleApprove(a.section)}
                  disabled={a.status === "APPROVED"}
                >
                  Akceptuję
                </Button>
                <Button
                  size="sm"
                  variant={a.status === "REJECTED" ? "default" : "outline"}
                  className="h-8 text-xs text-red-600"
                  onClick={() => handleReject(a.section)}
                >
                  Odrzucam
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
