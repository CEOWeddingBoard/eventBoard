import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { getEventWithDayScheduleAndMenu } from "@/lib/actions/event.actions";
import { DayScheduleAndMenu } from "@/components/day-schedule/day-schedule-and-menu";
import { MenuVariantEditor } from "@/components/menu/MenuVariantEditor";
import { AgendaApprovalPanel } from "@/components/agenda/AgendaApprovalPanel";
import { GenerateAgendaButton } from "@/components/agenda/generate-agenda-button";
import { EventClientLinkButton } from "@/components/eventboard/event-client-link-button";
import { WeddingBoardLinkPanel } from "@/components/eventboard/WeddingBoardLinkPanel";
import { EventOperationsPanel } from "@/components/eventboard/event-operations-panel";
import { ProcessCenterPanel } from "@/components/workflow/ProcessCenterPanel";
import { getEventProcessState } from "@/lib/actions/process-runtime.actions";
import { EventChat } from "@/components/eventboard/event-chat";
import { EventWidgetBoard } from "@/components/eventboard/EventWidgetBoard";
import { getEventWidgets } from "@/lib/actions/event-widget.actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function EventBoardEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);
  if (!membership) redirect(`/${locale}/app/dashboard`);

  const event = await prisma.event.findFirst({
    where: { id, organizationId: membership.organizationId },
    select: {
      id: true,
      name: true,
      date: true,
      estimatedGuestCount: true,
      isWedding: true,
      weddingBoardToken: true,
      notificationPhone: true,
      notificationDailyEnabled: true,
      notificationWeeklyEnabled: true,
      clientReviewedAt: true,
      clientFeedback: true,
      clientWorkflowStatus: true,
      clientMenuSelectionJson: true,
      clientLinkTokenHash: true,
      workflowId: true,
      workflowStageId: true,
      workflow: { select: { name: true, stagesJson: true } },
    },
  });
  if (!event) notFound();

  let menuSelectionRaw: Array<{ variantId: string; guests: number }> = [];
  try {
    menuSelectionRaw = event.clientMenuSelectionJson
      ? JSON.parse(event.clientMenuSelectionJson)
      : [];
  } catch {}

  // Resolve variant labels for ProcessCenterPanel
  const menuVariants = await prisma.menuVariant.findMany({
    where: { eventId: event.id },
    select: { id: true, label: true },
  });
  const menuSelection = menuSelectionRaw.map((s) => ({
    variantLabel: menuVariants.find((v) => v.id === s.variantId)?.label ?? s.variantId,
    guests: s.guests,
  }));

  const processState = await getEventProcessState(event.id);

  const fullEvent = await getEventWithDayScheduleAndMenu(event.id);
  const schedule = fullEvent?.dayScheduleItems ?? [];
  const menu = fullEvent?.menuCourses ?? [];
  const guests = await prisma.guest.findMany({
    where: { eventId: event.id },
    select: { id: true, name: true, phone: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: membership.organizationId },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  const memberList = members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  const canManage = membership.role !== "VIEWER";
  // Role operacyjne widza + prawo nadpisania (właściciel/admin/serwis widzą i
  // mogą wykonać każdy krok; specjalista tylko kroki swojej roli).
  const viewerRoles: string[] = (() => {
    try {
      const r = JSON.parse((membership as { rolesJson?: string }).rolesJson ?? "[]");
      return Array.isArray(r) ? r : [];
    } catch {
      return [];
    }
  })();
  const canOverride =
    (membership as { isAdmin?: boolean }).isAdmin === true ||
    membership.role === "OWNER" ||
    membership.role === "SERVICE";
  const widgets = await getEventWidgets(event.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/${locale}/app/events`}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Wróć do eventów
          </Link>
          <h1 className="text-base font-bold text-neutral-800 truncate mt-1">{event.name}</h1>
          <p className="text-xs text-neutral-500">
            {new Date(event.date).toLocaleDateString("pl-PL", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {event.estimatedGuestCount != null && ` · ${event.estimatedGuestCount} os.`}
            {event.isWedding && " · Wesele"}
          </p>
        </div>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <GenerateAgendaButton eventId={event.id} />
          {!event.isWedding && (
            <EventClientLinkButton
              locale={locale}
              eventId={event.id}
              eventName={event.name}
            />
          )}
        </div>
      )}

      {canManage && event.isWedding && (
        <WeddingBoardLinkPanel
          eventId={event.id}
          initialToken={event.weddingBoardToken ?? null}
        />
      )}

      {event.clientReviewedAt && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <p className="font-semibold text-emerald-900">
            Klient potwierdził ustalenia —{" "}
            {new Date(event.clientReviewedAt).toLocaleString("pl-PL", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {event.clientFeedback && (
            <p className="mt-1 text-xs text-emerald-800/80">
              Uwagi klienta: „{event.clientFeedback}”
            </p>
          )}
        </div>
      )}

      {canManage && (
        <ProcessCenterPanel
          eventId={event.id}
          initialState={processState}
          menuSelection={menuSelection}
          viewerRoles={viewerRoles}
          canOverride={canOverride}
        />
      )}

      {canManage && (
        <EventChat mode="organizer" eventId={event.id} />
      )}

      {canManage && <MenuVariantEditor eventId={event.id} />}

      <DayScheduleAndMenu
        initialSchedule={schedule}
        initialMenu={menu}
        eventId={event.id}
        eventDate={event.date}
        initialGuests={guests}
        notificationPhone={event.notificationPhone}
        notificationDailyEnabled={event.notificationDailyEnabled}
        notificationWeeklyEnabled={event.notificationWeeklyEnabled}
      />

      {/* Stary, sztywny panel akceptacji (5 zabetonowanych sekcji) dubluje
          kroki akceptacji w procesie — pokazujemy go tylko dla eventów bez
          przypisanego procesu, żeby nie było dwóch miejsc na to samo. */}
      {!processState && <AgendaApprovalPanel eventId={event.id} />}

      {canManage && (
        <EventOperationsPanel eventId={event.id} members={memberList} />
      )}

      {canManage && (
        <EventWidgetBoard eventId={event.id} initialWidgets={widgets} />
      )}
    </div>
  );
}
