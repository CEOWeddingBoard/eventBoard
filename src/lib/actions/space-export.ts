import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Eksport wszystkich danych jednej przestrzeni.
 *
 * Dwa powody: RODO (prawo do przenoszenia danych) i argument sprzedażowy —
 * klient, który wie, że wyjdzie z własnymi danymi, łatwiej wchodzi.
 *
 * Świadomie NIE eksportujemy skrótów haseł ani tokenów dostępu: to dane
 * uwierzytelniające, nie dane klienta, a w pliku wysyłanym mailem byłyby
 * wyłącznie ryzykiem.
 */

export type SpaceExport = Record<string, unknown>;

export async function buildSpaceExport(organizationId: string): Promise<SpaceExport | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true, name: true, slug: true, address: true, city: true, postalCode: true,
      phone: true, email: true, website: true, description: true, capacity: true,
      priceRange: true, plan: true, createdAt: true,
    },
  });
  if (!organization) return null;

  const [members, events, workflows, venues, leads, blockedDates, templates] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId },
      select: {
        role: true, isAdmin: true, rolesJson: true, createdAt: true,
        user: { select: { email: true, name: true, isActive: true, createdAt: true } },
      },
    }),
    prisma.event.findMany({
      where: { organizationId },
      select: {
        id: true, name: true, date: true, eventType: true, status: true,
        estimatedGuestCount: true, organizerName: true, responsiblePerson: true,
        occasionLabel: true, scenarioNotes: true, createdAt: true,
        dayScheduleItems: {
          orderBy: { sortOrder: "asc" },
          select: { startTime: true, title: true, description: true, location: true },
        },
        menuVariants: {
          orderBy: { sortOrder: "asc" },
          select: {
            label: true, description: true, notes: true, pricePerPerson: true,
            courses: {
              orderBy: { sortOrder: "asc" },
              select: {
                name: true, courseType: true, description: true, allergens: true,
                priceBase: true, priceExtra: true, portions: true, approved: true,
              },
            },
          },
        },
        agendaData: { select: { dataJson: true, updatedAt: true } },
        processState: {
          select: { currentNodeId: true, completedNodeIds: true, nodeDataJson: true, startedAt: true },
        },
        payments: {
          select: { label: true, amount: true, status: true, dueDate: true, paidAt: true, method: true, notes: true },
        },
      },
    }),
    prisma.organizationWorkflow.findMany({
      where: { organizationId },
      select: {
        name: true, description: true, eventType: true, isDefault: true,
        nodes: {
          orderBy: { sortOrder: "asc" },
          select: {
            name: true, description: true, nodeType: true, actionType: true,
            assigneeRole: true, fillRole: true, approveRole: true, menuMode: true,
            fieldsJson: true, fieldMappingsJson: true, conditionsJson: true, sortOrder: true,
          },
        },
      },
    }),
    prisma.venue.findMany({
      where: { organizationId },
      select: {
        name: true, address: true, city: true,
        halls: { select: { name: true, capacity: true } },
      },
    }),
    prisma.orgLead.findMany({
      where: { organizationId },
      select: { name: true, email: true, phone: true, eventDate: true, guestCount: true, message: true, status: true, createdAt: true },
    }),
    prisma.orgBlockedDate.findMany({
      where: { organizationId },
      select: { date: true, reason: true },
    }),
    prisma.orgTemplate.findMany({
      where: { organizationId },
      select: { name: true, kind: true, contentJson: true, createdAt: true },
    }),
  ]);

  return {
    _meta: {
      format: "eventboard-space-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      uwaga:
        "Eksport nie zawiera haseł ani tokenów dostępu — to dane uwierzytelniające, nie dane klienta.",
    },
    organization,
    members,
    events,
    workflows,
    venues,
    leads,
    blockedDates,
    templates,
  };
}
