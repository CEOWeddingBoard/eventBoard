"use server"

import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveOrgId, requireOrgId } from "@/lib/auth/active-org";
import { znajdzKolizje, type Kolizja } from "@/lib/kolizje-terminow";
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { assertModuleEdit } from "@/lib/permissions/guard";
import { revalidatePath } from "next/cache"
import { validate } from "@/lib/validations/validation-utils"
import { createEventSimpleSchema } from "@/lib/validations/event"
import bcrypt from "bcryptjs"
import { ensureAgendaEventColumns } from "@/lib/agenda/agenda-schema-migration";
import { ensureEventP1Columns } from "@/lib/events/event-schema-migration";
import { getActiveEventIdFromCookie } from "@/lib/active-event";
import { applyTemplateToEvent } from "@/lib/actions/org-ecosystem.actions";
import { generateWeddingBoardToken } from "@/lib/wedding-board-utils";

function accessibleEventsWhere(userId: string) {
  return {
    OR: [
      { userId },
      { participants: { some: { userId } } },
    ],
  };
}


/**
 * Pobiera wszystkie wydarzenia dla zalogowanego użytkownika.
 */
export async function getEvents() {
  // In development, return mock events immediately if DB/Clerk not configured
  const dbAvailable = !!process.env.DATABASE_URL;
  const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;
  
  if (process.env.NODE_ENV === 'development' && (!dbAvailable || !clerkConfigured)) {
    // Return mock events immediately without any async operations
    return [
      {
        id: 'demo-event-1',
        name: 'Nasze Wesele',
        date: new Date('2025-08-15T14:00:00Z'),
        userId: 'demo-user',
        eventType: 'WEDDING',
        guestListMode: 'FULL',
        targetBudget: 50000,
        estimatedGuestCount: 100,
        style: 'Klasyczny',
        priorities: ['Fotograf', 'Catering', 'Muzyka'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  // W trybie demo nie wymagamy logowania
  let user = null;
  
  if (clerkConfigured) {
    try {
      // Add timeout for getCurrentUser
      const userPromise = getCurrentUser();
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 2000)
      );
      user = await Promise.race([userPromise, timeoutPromise]);
    } catch (error) {
      // Ignore auth errors in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Auth not available, using mock user:', error);
      }
    }
  }

  try {
    // W trybie demo zwracamy mockowe wydarzenia
    return [
      {
        id: 'demo-event-1',
        name: 'Nasze Wesele',
        date: new Date('2025-08-15T14:00:00Z'),
        userId: user?.id || 'demo-user',
        eventType: 'WEDDING',
        guestListMode: 'FULL',
        targetBudget: 50000,
        estimatedGuestCount: 100,
        style: 'Klasyczny',
        priorities: ['Fotograf', 'Catering', 'Muzyka'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  } catch (error) {
    // Return mock events for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Database not available, using mock events:', error);
    }
    return [
      {
        id: 'mock-event-1',
        name: 'Nasze Wesele',
        date: new Date('2025-08-15T14:00:00Z'),
        userId: user?.id || 'demo-user',
        eventType: 'WEDDING',
        guestListMode: 'FULL',
        targetBudget: 50000,
        estimatedGuestCount: 100,
        style: 'Klasyczny',
        priorities: ['Fotograf', 'Catering', 'Muzyka'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }
}

/**
 * Pobiera podstawowe informacje o wydarzeniu dla zalogowanego użytkownika.
 * Zoptymalizowane - nie ładuje wszystkich relacji naraz.
 * Cache disabled in dev mode to avoid conflicts with headers()
 */
export async function getUrlUserEvent() {
    // Check if database is available
    const dbAvailable = !!process.env.DATABASE_URL;
    
    if (!dbAvailable && process.env.NODE_ENV === 'development') {
      // Return mock event immediately if DB is not configured
      return {
        id: 'mock-event-1',
        name: 'Nasze Wesele',
        date: new Date('2025-08-15T14:00:00Z'),
        userId: 'demo-user',
        brideName: null,
        groomName: null,
        targetBudget: 50000,
        budgetCurrency: 'PLN',
        estimatedGuestCount: 100,
        style: 'Klasyczny',
        priorities: 'Fotograf,Catering,Muzyka',
        publicSlug: null,
        guestPortalEnabled: false,
        description: null,
        dressCode: null,
        ceremonyLocationName: null,
        ceremonyLocationUrl: null,
        receptionLocationName: null,
        receptionLocationUrl: null,
        mapLocationUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tables: [],
        vendors: [],
      };
    }

    let user = null;
    try {
      // Add timeout for getCurrentUser
      const userPromise = getCurrentUser();
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 2000)
      );
      user = await Promise.race([userPromise, timeoutPromise]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('getCurrentUser error, using mock:', error);
      }
    }

    const userId = user?.id ?? 'mock-user-id';

    if (!user && process.env.NODE_ENV === 'development' && dbAvailable) {
      // Dev without auth: look for events created with mock-user-id; if none, return null so create form shows
      try {
        const devEvent = await prisma.event.findFirst({
          where: { userId: 'mock-user-id' },
          select: {
            id: true,
            name: true,
            date: true,
            userId: true,
            targetBudget: true,
            budgetCurrency: true,
            estimatedGuestCount: true,
            style: true,
            priorities: true,
          brideName: true,
          groomName: true,
          publicSlug: true,
          description: true,
          dressCode: true,
          ceremonyLocationName: true,
          ceremonyLocationUrl: true,
          receptionLocationName: true,
          receptionLocationUrl: true,
          mapLocationUrl: true,
            guestPortalEnabled: true,
            organizerName: true,
            responsiblePerson: true,
            eventEndTime: true,
            occasionLabel: true,
            scenarioNotes: true,
            isWedding: true,
            notificationPhone: true,
            notificationDailyEnabled: true,
            notificationWeeklyEnabled: true,
            createdAt: true,
            updatedAt: true,
            tables: { include: { guests: true } },
            vendors: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (devEvent) return devEvent;
        return null;
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('getUrlUserEvent dev query error:', e);
        }
        return null;
      }
    }

    if (!user) return null;

    try {
      const activeEventId = await getActiveEventIdFromCookie();
      const accessWhere = accessibleEventsWhere(user.id);

      if (activeEventId) {
        const activeEvent = await prisma.event.findFirst({
          where: { id: activeEventId, ...accessWhere },
          select: {
            id: true,
            name: true,
            date: true,
            userId: true,
            brideName: true,
            groomName: true,
            targetBudget: true,
            budgetCurrency: true,
            estimatedGuestCount: true,
            style: true,
            priorities: true,
            publicSlug: true,
            description: true,
            dressCode: true,
            ceremonyLocationName: true,
            ceremonyLocationUrl: true,
            receptionLocationName: true,
            receptionLocationUrl: true,
            mapLocationUrl: true,
            guestPortalEnabled: true,
            organizerName: true,
            responsiblePerson: true,
            eventEndTime: true,
            occasionLabel: true,
            scenarioNotes: true,
            isWedding: true,
            createdAt: true,
            updatedAt: true,
            tables: { include: { guests: true } },
            vendors: true,
          },
        });
        if (activeEvent) return activeEvent;
      }

      const queryPromise = prisma.event.findFirst({
        where: accessWhere,
        select: {
          id: true,
          name: true,
          date: true,
          userId: true,
          brideName: true,
          groomName: true,
          targetBudget: true,
          budgetCurrency: true,
          estimatedGuestCount: true,
          style: true,
          priorities: true,
          publicSlug: true,
          description: true,
          dressCode: true,
          ceremonyLocationName: true,
          ceremonyLocationUrl: true,
          receptionLocationName: true,
          receptionLocationUrl: true,
          mapLocationUrl: true,
          guestPortalEnabled: true,
          createdAt: true,
          updatedAt: true,
          tables: {
            include: {
              guests: true,
            },
          },
          vendors: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 3000)
      );
      
      const event = await Promise.race([queryPromise, timeoutPromise]);
      
      if (event) {
        return event;
      }
      
      // If query timed out, return mock in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Database query timeout, using mock event');
        return {
          id: 'mock-event-1',
          name: 'Nasze Wesele',
          date: new Date('2025-08-15T14:00:00Z'),
          userId,
          brideName: null as string | null,
          groomName: null as string | null,
          targetBudget: 50000,
          budgetCurrency: 'PLN',
          estimatedGuestCount: 100,
          style: 'Klasyczny',
          priorities: 'Fotograf,Catering,Muzyka',
          publicSlug: null as string | null,
          guestPortalEnabled: false,
          description: null as string | null,
          dressCode: null as string | null,
          ceremonyLocationName: null as string | null,
          ceremonyLocationUrl: null as string | null,
          receptionLocationName: null as string | null,
          receptionLocationUrl: null as string | null,
          mapLocationUrl: null as string | null,
          organizerName: null as string | null,
          responsiblePerson: null as string | null,
          eventEndTime: null as Date | null,
          occasionLabel: null as string | null,
          scenarioNotes: null as string | null,
          isWedding: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          tables: [] as never[],
          vendors: [] as never[],
        };
      }

      return null;
    } catch (error) {
      // Return mock event for development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Database error, using mock event:', error);
        return {
          id: 'mock-event-1',
          name: 'Nasze Wesele',
          date: new Date('2025-08-15T14:00:00Z'),
          userId,
          brideName: null as string | null,
          groomName: null as string | null,
          targetBudget: 50000,
          budgetCurrency: 'PLN',
          estimatedGuestCount: 100,
          style: 'Klasyczny',
          priorities: 'Fotograf,Catering,Muzyka',
          publicSlug: null as string | null,
          guestPortalEnabled: false,
          description: null as string | null,
          dressCode: null as string | null,
          ceremonyLocationName: null as string | null,
          ceremonyLocationUrl: null as string | null,
          receptionLocationName: null as string | null,
          receptionLocationUrl: null as string | null,
          mapLocationUrl: null as string | null,
          organizerName: null as string | null,
          responsiblePerson: null as string | null,
          eventEndTime: null as Date | null,
          occasionLabel: null as string | null,
          scenarioNotes: null as string | null,
          isWedding: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          tables: [] as never[],
          vendors: [] as never[],
        };
      }
      return null;
    }
}

/**
 * Pobiera pełne dane wydarzenia z zadaniami (lazy loaded)
 */
export async function getEventWithTasks(eventId: string) {
  try {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  } catch {
    return null;
  }
}

/**
 * Pobiera pełne dane wydarzenia z gośćmi (lazy loaded)
 */
export async function getEventWithGuests(eventId: string) {
  try {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  } catch {
    return null;
  }
}

/**
 * Pobiera wydarzenie z gośćmi i stołami – do zakładki Usadzenie / konfiguratora stołów.
 */
export async function getEventForSeating(eventId: string) {
  try {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tables: { include: { guests: true }, orderBy: { name: "asc" } },
        guests: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Pobiera pełne dane wydarzenia z budżetem (lazy loaded)
 */
export async function getEventWithBudget(eventId: string) {
  try {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        budget: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  } catch {
    return null;
  }
}

/**
 * Pobiera pełne dane wydarzenia z dostawcami (lazy loaded)
 */
export async function getEventWithVendors(eventId: string) {
  try {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        vendors: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  } catch {
    return null;
  }
}

/**
 * Pobiera wydarzenie z harmonogramem dnia i menu (organizacja dnia wesela)
 */
export async function getEventWithDayScheduleAndMenu(eventId: string) {
  try {
    return await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        dayScheduleItems: { orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }] },
        menuCourses: { orderBy: [{ sortOrder: "asc" }, { courseType: "asc" }, { name: "asc" }] },
      },
    });
  } catch {
    return null;
  }
}

/** W dev: upewnia się, że użytkownik mock-user-id istnieje (FK przy tworzeniu Event). */
async function ensureMockUser(): Promise<void> {
  const hashedPassword = await bcrypt.hash("dev-password", 10);
  await prisma.user.upsert({
    where: { id: "mock-user-id" },
    update: { name: "Mock User" },
    create: {
      id: "mock-user-id",
      email: "mock@example.com",
      password: hashedPassword,
      name: "Mock User",
    },
  });
}

/**
 * Tworzy nowe wydarzenie (wesele).
 * Przyjmuje name, date oraz opcjonalnie brideName, groomName, estimatedGuestCount, targetBudget.
 * Przypisuje wydarzenie do zalogowanego użytkownika (getCurrentUser).
 */
export async function createEvent(data: {
  name: string;
  date: string | Date;
  eventType?: string;
  guestListMode?: string;
  brideName?: string;
  groomName?: string;
  partnerEmail?: string;
  estimatedGuestCount?: number;
  targetBudget?: number;
  ceremonyLocationName?: string;
  ceremonyLocationUrl?: string;
  receptionLocationName?: string;
  receptionLocationUrl?: string;
  organizerName?: string;
  responsiblePerson?: string;
  eventEndTime?: string | Date | null;
  occasionLabel?: string;
  scenarioNotes?: string;
  isWedding?: boolean;
  status?: string;
  categoryId?: string;
  hallId?: string;
  customFieldValues?: Record<string, string>;
  workflowId?: string;
}) {
  await assertModuleEdit("events");
  const validated = validate(createEventSimpleSchema, data, { action: "create_event" });
  const date = validated.date instanceof Date ? validated.date : new Date(validated.date);

  let user: { id: string } | null = null;
  try {
    // eslint-disable-next-line no-console
    console.log("[events:createEvent] calling getCurrentUser");
    user = await getCurrentUser();
  } catch {
    // eslint-disable-next-line no-console
    console.error("[events:createEvent] getCurrentUser threw");
  }

  let userId = user?.id ?? null;
  if (!userId && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[events:createEvent] no userId in dev, using mock-user-id");
    await ensureMockUser();
    userId = "mock-user-id";
  }
  if (!userId) {
    // eslint-disable-next-line no-console
    console.error("[events:createEvent] missing userId, refusing to create event", {
      NODE_ENV: process.env.NODE_ENV,
      hasClerkKeys: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY,
    });
    throw new Error("Musisz być zalogowany, aby utworzyć wesele.");
  }

  await ensureAgendaEventColumns();
  await ensureEventP1Columns();

  // Przypisz event do organizacji użytkownika (restauracja / firma eventowa).
  let organizationId: string | null = null;
  if (userId) {
    try {
      organizationId = await getActiveOrgId(userId);
    } catch {
      organizationId = null;
    }
  }

  const event = await prisma.event.create({
    data: {
      name: validated.name,
      date,
      userId,
      organizationId,
      eventType: validated.eventType ?? "WEDDING",
      guestListMode: validated.guestListMode ?? "FULL",
      brideName: validated.brideName?.trim() || null,
      groomName: validated.groomName?.trim() || null,
      partnerEmail: validated.partnerEmail?.trim()
        ? validated.partnerEmail.trim().toLowerCase()
        : null,
      estimatedGuestCount: validated.estimatedGuestCount ?? null,
      targetBudget: validated.targetBudget ?? null,
      ceremonyLocationName: validated.ceremonyLocationName?.trim() || null,
      ceremonyLocationUrl: validated.ceremonyLocationUrl?.trim() || null,
      receptionLocationName: validated.receptionLocationName?.trim() || null,
      receptionLocationUrl: validated.receptionLocationUrl?.trim() || null,
      organizerName: validated.organizerName?.trim() || null,
      responsiblePerson: validated.responsiblePerson?.trim() || null,
      eventEndTime: validated.eventEndTime
        ? validated.eventEndTime instanceof Date
          ? validated.eventEndTime
          : new Date(validated.eventEndTime)
        : null,
      occasionLabel: validated.occasionLabel?.trim() || null,
      scenarioNotes: validated.scenarioNotes?.trim() || null,
      isWedding: validated.isWedding ?? false,
      weddingBoardToken: (validated.isWedding ?? false) ? generateWeddingBoardToken() : null,
      status: validated.status ?? "DRAFT",
      categoryId: validated.categoryId || null,
      hallId: validated.hallId || null,
      customFieldValuesJson: validated.customFieldValues
        ? JSON.stringify(validated.customFieldValues)
        : null,
      workflowId: validated.workflowId || null,
    },
  });

  if (validated.categoryId && organizationId) {
    const category = await prisma.eventCategory.findFirst({
      where: { id: validated.categoryId, organizationId },
      select: { agendaTemplateId: true },
    });
    if (category?.agendaTemplateId) {
      try {
        await applyTemplateToEvent(category.agendaTemplateId, event.id);
      } catch (error) {
        console.error("[events:createEvent] agenda template failed:", error);
      }
    }
  }

  revalidatePath("/pl");
  revalidatePath("/en");
  revalidatePath("/pl/dashboard");
  revalidatePath("/en/dashboard");
  revalidatePath("/pl/app");
  revalidatePath("/en/app");

  return event;
}

/**
 * Aktualizuje istniejące wydarzenie (wesele).
 * Przyjmuje id oraz opcjonalne pola do aktualizacji.
 */
export async function updateEvent(eventId: string, data: {
  name?: string;
  date?: string | Date;
  eventType?: string;
  guestListMode?: string;
  brideName?: string;
  groomName?: string;
  partnerEmail?: string;
  estimatedGuestCount?: number;
  targetBudget?: number;
  budgetCurrency?: string;
  publicSlug?: string;
  description?: string;
  dressCode?: string;
  mapLocationUrl?: string;
  ceremonyLocationName?: string;
  ceremonyLocationUrl?: string;
  receptionLocationName?: string;
  receptionLocationUrl?: string;
  guestPortalEnabled?: boolean;
  notificationPhone?: string;
  notificationDailyEnabled?: boolean;
  notificationWeeklyEnabled?: boolean;
  organizerName?: string;
  responsiblePerson?: string;
  eventEndTime?: string | Date | null;
  occasionLabel?: string;
  scenarioNotes?: string;
  isWedding?: boolean;
  status?: string;
  categoryId?: string;
  hallId?: string;
}) {
  await assertModuleEdit("events");
  const validated = validate(createEventSimpleSchema.partial(), data, { action: "update_event" });

  const updateData: Prisma.EventUncheckedUpdateInput = {};

  const normalizeSlug = (value: string | undefined | null): string | null => {
    if (!value) return null;
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    return slug || null;
  };

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.eventType !== undefined) updateData.eventType = validated.eventType;
  if (validated.guestListMode !== undefined) updateData.guestListMode = validated.guestListMode;
  if (validated.date !== undefined) {
    updateData.date = validated.date instanceof Date ? validated.date : new Date(validated.date);
  }
  if (validated.brideName !== undefined) updateData.brideName = validated.brideName?.trim() || null;
  if (validated.groomName !== undefined) updateData.groomName = validated.groomName?.trim() || null;
  if (validated.estimatedGuestCount !== undefined) updateData.estimatedGuestCount = validated.estimatedGuestCount;
  if (validated.targetBudget !== undefined) updateData.targetBudget = validated.targetBudget;
   if (validated.budgetCurrency !== undefined) updateData.budgetCurrency = validated.budgetCurrency;
  if (validated.publicSlug !== undefined) {
    updateData.publicSlug = normalizeSlug(validated.publicSlug);
  }
  if (validated.description !== undefined) {
    updateData.description = validated.description?.trim() || null;
  }
  if (validated.dressCode !== undefined) {
    updateData.dressCode = validated.dressCode?.trim() || null;
  }
  if (validated.mapLocationUrl !== undefined) {
    updateData.mapLocationUrl = validated.mapLocationUrl?.trim() || null;
  }
  if (validated.ceremonyLocationName !== undefined) {
    updateData.ceremonyLocationName = validated.ceremonyLocationName?.trim() || null;
  }
  if (validated.ceremonyLocationUrl !== undefined) {
    updateData.ceremonyLocationUrl = validated.ceremonyLocationUrl?.trim() || null;
  }
  if (validated.receptionLocationName !== undefined) {
    updateData.receptionLocationName = validated.receptionLocationName?.trim() || null;
  }
  if (validated.receptionLocationUrl !== undefined) {
    updateData.receptionLocationUrl = validated.receptionLocationUrl?.trim() || null;
  }
  if (validated.guestPortalEnabled !== undefined) {
    updateData.guestPortalEnabled = validated.guestPortalEnabled;
  }
  if (validated.notificationPhone !== undefined) {
    updateData.notificationPhone = validated.notificationPhone?.trim() || null;
  }
  if (validated.notificationDailyEnabled !== undefined) {
    updateData.notificationDailyEnabled = validated.notificationDailyEnabled;
  }
  if (validated.notificationWeeklyEnabled !== undefined) {
    updateData.notificationWeeklyEnabled = validated.notificationWeeklyEnabled;
  }
  if (validated.organizerName !== undefined) {
    updateData.organizerName = validated.organizerName?.trim() || null;
  }
  if (validated.responsiblePerson !== undefined) {
    updateData.responsiblePerson = validated.responsiblePerson?.trim() || null;
  }
  if (validated.eventEndTime !== undefined) {
    updateData.eventEndTime = validated.eventEndTime
      ? validated.eventEndTime instanceof Date
        ? validated.eventEndTime
        : new Date(validated.eventEndTime)
      : null;
  }
  if (validated.occasionLabel !== undefined) {
    updateData.occasionLabel = validated.occasionLabel?.trim() || null;
  }
  if (validated.scenarioNotes !== undefined) {
    updateData.scenarioNotes = validated.scenarioNotes?.trim() || null;
  }
  if (validated.isWedding !== undefined) {
    updateData.isWedding = validated.isWedding;
    if (validated.isWedding) {
      const existing = await prisma.event.findUnique({
        where: { id: eventId },
        select: { weddingBoardToken: true },
      });
      if (!existing?.weddingBoardToken) {
        updateData.weddingBoardToken = generateWeddingBoardToken();
      }
    }
  }
  if (validated.status !== undefined) {
    updateData.status = validated.status;
  }
  if (validated.categoryId !== undefined) {
    updateData.categoryId = validated.categoryId?.trim() || null;
  }
  if (validated.hallId !== undefined) {
    updateData.hallId = validated.hallId?.trim() || null;
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
  });

  revalidatePath("/pl");
  revalidatePath("/en");
  revalidatePath("/pl/dashboard");
  revalidatePath("/en/dashboard");
  revalidatePath("/pl/app");
  revalidatePath("/en/app");

  const { syncAllToGoogle } = await import("@/lib/google-calendar-sync");
  void syncAllToGoogle().catch(() => {});

  return event;
}


/** Duplikuje event (dane + harmonogram + warianty menu) w ramach organizacji. */
export async function duplicateEvent(eventId: string) {
  await assertModuleEdit("events");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const organizationId = await requireOrgId(user.id);

  const source = await prisma.event.findFirst({
    where: { id: eventId, organizationId: organizationId },
    include: {
      dayScheduleItems: { orderBy: { sortOrder: "asc" } },
      menuVariants: {
        include: { courses: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!source) throw new Error("Event not found");

  await ensureEventP1Columns();

  const copy = await prisma.event.create({
    data: {
      name: `${source.name} (kopia)`,
      date: source.date,
      userId: source.userId,
      organizationId: source.organizationId,
      eventType: source.eventType,
      guestListMode: source.guestListMode,
      brideName: source.brideName,
      groomName: source.groomName,
      estimatedGuestCount: source.estimatedGuestCount,
      targetBudget: source.targetBudget,
      ceremonyLocationName: source.ceremonyLocationName,
      receptionLocationName: source.receptionLocationName,
      organizerName: source.organizerName,
      responsiblePerson: source.responsiblePerson,
      occasionLabel: source.occasionLabel,
      scenarioNotes: source.scenarioNotes,
      isWedding: source.isWedding,
      status: "DRAFT",
      categoryId: source.categoryId,
    },
  });

  for (const item of source.dayScheduleItems) {
    await prisma.dayScheduleItem.create({
      data: {
        eventId: copy.id,
        startTime: item.startTime,
        endTime: item.endTime,
        title: item.title,
        description: item.description,
        location: item.location,
        sortOrder: item.sortOrder,
      },
    });
  }

  for (const variant of source.menuVariants) {
    const copyVariant = await prisma.menuVariant.create({
      data: { eventId: copy.id, label: variant.label, sortOrder: variant.sortOrder },
    });
    for (const course of variant.courses) {
      await prisma.menuVariantCourse.create({
        data: {
          menuVariantId: copyVariant.id,
          name: course.name,
          courseType: course.courseType,
          description: course.description,
          allergens: course.allergens,
          priceBase: course.priceBase,
          priceExtra: course.priceExtra,
          sortOrder: course.sortOrder,
        },
      });
    }
  }

  revalidatePath("/pl/app");
  revalidatePath("/en/app");
  return copy;
}

/**
 * Sprawdzenie terminu przed zapisem przyjęcia.
 *
 * Wołane z formularza przy zmianie daty lub sali — ostrzeżenie pojawia się,
 * zanim ktokolwiek kliknie „Utwórz”. Świadomie nie blokuje zapisu: dwa wesela
 * na dwóch salach tego samego dnia to normalny dzień dużego obiektu.
 */
export async function sprawdzTerminEventu(input: {
  date: string;
  hallId?: string | null;
  pomijanyEventId?: string | null;
}): Promise<Kolizja[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    const organizationId = await getActiveOrgId(user.id);
    if (!organizationId) return [];

    const data = new Date(input.date);
    if (Number.isNaN(data.getTime())) return [];

    const od = new Date(data);
    od.setHours(0, 0, 0, 0);
    const doKiedy = new Date(data);
    doKiedy.setHours(23, 59, 59, 999);

    const [eventy, zablokowane] = await Promise.all([
      prisma.event.findMany({
        where: { organizationId, date: { gte: od, lte: doKiedy } },
        select: { id: true, name: true, date: true, hallId: true, hall: { select: { name: true } } },
      }),
      prisma.orgBlockedDate.findMany({
        where: { organizationId, date: { gte: od, lte: doKiedy } },
        select: { date: true, reason: true },
      }),
    ]);

    return znajdzKolizje(
      { data, hallId: input.hallId ?? null, pomijanyEventId: input.pomijanyEventId ?? null },
      eventy.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        hallId: e.hallId,
        hallName: e.hall?.name ?? null,
      })),
      zablokowane,
    );
  } catch (e) {
    // Sprawdzenie terminu nie może zablokować tworzenia eventu.
    console.error("[event:sprawdzTermin]", e);
    return [];
  }
}
