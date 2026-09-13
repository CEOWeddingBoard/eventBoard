import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidCronSecret } from "@/lib/api/cron-auth";
import { sendSms, isSmsConfigured } from "@/lib/sms";
import { assigneeRoleLabel } from "@/lib/workflow-roles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEDUP_MS = 20 * 60 * 60 * 1000; // nie częściej niż raz na ~dobę
const MAX_WINDOW_DAYS = 90;

function parseRoles(json: string | null | undefined): string[] {
  try {
    const r = JSON.parse(json ?? "[]");
    return Array.isArray(r) ? r.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Cron: wysyła e-mail + SMS, gdy krok procesu czeka na akceptację, a event jest
 * w oknie „X dni przed" (parametr per organizacja: notifyDaysBefore).
 * Zaplanuj codziennie. Zabezpieczony CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!isValidCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const maxDate = new Date(now.getTime() + MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      organizationId: { not: null },
      date: { gte: now, lte: maxDate },
      processState: { isNot: null },
    },
    select: {
      id: true, name: true, date: true, approvalReminderAt: true,
      organization: {
        select: {
          id: true, name: true, email: true, phone: true, archivedAt: true,
          notifyDaysBefore: true, notifyEmail: true, notifySms: true,
        },
      },
      processState: { select: { currentNodeId: true, completedNodeIds: true } },
    },
  });

  const { getPublicAppUrl, getResendFrom } = await import("@/lib/env");
  const appUrl = getPublicAppUrl();
  type ResendLike = { emails: { send: (o: unknown) => Promise<unknown> } };
  let resend: ResendLike | null = null;
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    resend = new Resend(process.env.RESEND_API_KEY.trim()) as unknown as ResendLike;
  }

  const result = { checked: events.length, pending: 0, emailed: 0, smsed: 0, skipped: 0 };

  for (const ev of events) {
    const org = ev.organization;
    if (!org || org.archivedAt) { result.skipped++; continue; }
    if (!org.notifyEmail && !org.notifySms) { result.skipped++; continue; }

    const daysBefore = org.notifyDaysBefore ?? 7;
    const windowEnd = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);
    if (ev.date > windowEnd) { result.skipped++; continue; } // za wcześnie
    if (ev.approvalReminderAt && now.getTime() - ev.approvalReminderAt.getTime() < DEDUP_MS) { result.skipped++; continue; }

    const currentNodeId = ev.processState?.currentNodeId;
    if (!currentNodeId) { result.skipped++; continue; }
    const completed: string[] = (() => { try { return JSON.parse(ev.processState?.completedNodeIds ?? "[]"); } catch { return []; } })();
    if (completed.includes(currentNodeId)) { result.skipped++; continue; }

    const node = await prisma.workflowNode.findUnique({
      where: { id: currentNodeId },
      select: { name: true, approveRole: true },
    });
    const approveRole = node?.approveRole?.trim();
    if (!node || !approveRole) { result.skipped++; continue; } // krok nie wymaga akceptacji

    result.pending++;

    // Odbiorcy e-mail: członkowie z rolą akceptującą; awaryjnie admini/właściciel; + e-mail organizacji.
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: org.id, role: { not: "SERVICE" } },
      select: { isAdmin: true, role: true, rolesJson: true, user: { select: { email: true } } },
    });
    let recipients = members
      .filter((m) => parseRoles((m as { rolesJson?: string }).rolesJson).includes(approveRole))
      .map((m) => m.user.email);
    if (recipients.length === 0) {
      recipients = members.filter((m) => m.isAdmin || m.role === "OWNER").map((m) => m.user.email);
    }
    if (org.email) recipients.push(org.email);
    recipients = Array.from(new Set(recipients.filter(Boolean)));

    const roleLabel = assigneeRoleLabel(approveRole);
    const dateStr = ev.date.toLocaleDateString("pl-PL");
    const link = `${appUrl}/pl/app/events/${ev.id}`;
    const subject = `Krok czeka na akceptację — ${ev.name}`;
    const text =
      `Event "${ev.name}" (${dateStr}) ma krok "${node.name}" czekający na akceptację (${roleLabel}).\n` +
      `Otwórz: ${link}`;

    if (org.notifyEmail && resend && recipients.length > 0) {
      try {
        await resend.emails.send({
          from: getResendFrom(),
          to: recipients,
          subject,
          text,
        });
        result.emailed++;
      } catch (e) {
        console.error("[cron:step-approval] email", ev.id, e);
      }
    }

    if (org.notifySms && org.phone && isSmsConfigured()) {
      const sms = await sendSms(org.phone, `${subject}. ${node.name} (${dateStr}). ${link}`);
      if (sms.ok) result.smsed++;
    }

    await prisma.event.update({ where: { id: ev.id }, data: { approvalReminderAt: now } });
  }

  return NextResponse.json({ ok: true, ...result });
}
