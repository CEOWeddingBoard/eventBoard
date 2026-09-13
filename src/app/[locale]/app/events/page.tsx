import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/auth/active-org";
import { EventBoardEventsList } from "@/components/eventboard/event-board-events-list";

export const metadata = { robots: { index: false, follow: false } };

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);

  const membership = await getActiveMembership(user.id);

  const events = membership
    ? await prisma.event.findMany({
        where: { organizationId: membership.organizationId },
        // Najbliższa impreza na górze — lista służy do pracy nad tym,
        // co dopiero nadchodzi, a nie do przeglądania archiwum.
        orderBy: { date: "asc" },
        select: {
          id: true,
          name: true,
          date: true,
          estimatedGuestCount: true,
          isWedding: true,
          organizerName: true,
          occasionLabel: true,
          status: true,
          workflowId: true,
          workflowStageId: true,
          clientWorkflowStatus: true,
          workflow: { select: { name: true } },
          category: { select: { name: true, color: true } },
          hall: { select: { name: true, venue: { select: { name: true } } } },
        },
      })
    : [];

  // Bieżący krok bierzemy ze stanu procesu. Wcześniej odczytywano go
  // z przestarzałego stagesJson, które nowy builder zapisuje jako puste.
  const processStates = membership
    ? await prisma.eventProcessState.findMany({
        where: { event: { organizationId: membership.organizationId } },
        select: { eventId: true, currentNodeId: true },
      })
    : [];
  const nodes = processStates.length
    ? await prisma.workflowNode.findMany({
        where: { id: { in: [...new Set(processStates.map((s) => s.currentNodeId))] } },
        select: { id: true, name: true },
      })
    : [];
  const nodeName = new Map(nodes.map((n) => [n.id, n.name]));
  const stageByEvent = new Map(
    processStates.map((s) => [s.eventId, nodeName.get(s.currentNodeId) ?? null]),
  );

  // Sale obiektów — do przypisania wydarzenia przy tworzeniu i edycji.
  const venues = membership
    ? await prisma.venue.findMany({
        where: { organizationId: membership.organizationId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          halls: {
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, capacity: true },
          },
        },
      })
    : [];
  const halls = venues.map((v) => ({ venueId: v.id, venueName: v.name, halls: v.halls }));

  return (
    <EventBoardEventsList
      locale={locale}
      events={events.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        estimatedGuestCount: e.estimatedGuestCount,
        isWedding: e.isWedding,
        organizerName: e.organizerName,
        occasionLabel: e.occasionLabel,
        status: e.status,
        workflowName: e.workflow?.name ?? null,
        workflowStage: stageByEvent.get(e.id) ?? null,
        clientWorkflowStatus: e.clientWorkflowStatus,
        categoryName: e.category?.name ?? null,
        categoryColor: e.category?.color ?? null,
        hallName: e.hall?.name ?? null,
        venueName: e.hall?.venue?.name ?? null,
      }))}
      halls={halls}
    />
  );
}
