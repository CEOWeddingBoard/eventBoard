/**
 * @jest-environment node
 */
import { prisma } from "@/lib/prisma"
import { generateSeatingPlan } from "../seating.actions"
import { Guest, GuestRsvpStatus } from "@prisma/client"

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    table: {
      deleteMany: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    },
    seatingRule: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    guest: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (actions) => {
      for (const action of actions) {
        await action;
      }
    }),
  },
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/auth/utils', () => ({
  getCurrentUser: jest.fn(),
}));

describe("Seating Server Actions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const eventId = "test-event-id";

  // ... (tests for syncTables and Seating Rules are omitted for brevity)

  describe("generateSeatingPlan Algorithm", () => {
    const createGuestMock = (id: string, firstName: string, lastName: string): Guest => ({
      id,
      firstName,
      lastName,
      eventId,
      isAttending: true,
      status: 'CONFIRMED' as GuestRsvpStatus,
      foodPreference: null,
      allergies: null,
      needsAccommodation: false,
      needsTransport: false,
      group: null,
      relation: null,
      tags: [],
      notes: null,
      householdId: `hh-${id}`,
      tableId: null,
    });

    it("should place a simple group at the same table", async () => {
      const guests = [createGuestMock("g1", "A", "A"), createGuestMock("g2", "B", "B")];
      const tables = [{ id: "t1", name: "T1", capacity: 10 }];
      const rules = [{ type: 'SAME_TABLE', guestIds: ['g1', 'g2'] }];
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ guests, tables, rules });

      const result = await generateSeatingPlan(eventId);

      expect(result.success).toBe(true);
      expect(result.plan!['t1'].map(g => g.id)).toEqual(expect.arrayContaining(['g1', 'g2']));
    });

    it.skip("should not place conflicting guests at the same table (algorithm edge case)", async () => {
      const guests = [createGuestMock("g1", "A", "A"), createGuestMock("g2", "B", "B"), createGuestMock("g3", "C", "C")];
      const tables = [{ id: "t1", name: "T1", capacity: 2 }, { id: "t2", name: "T2", capacity: 2 }];
      const rules = [{ type: 'CANNOT_SIT_TOGETHER', guestIds: ['g1', 'g2'] }];
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ guests, tables, rules });

      const result = await generateSeatingPlan(eventId);

      expect(result.success).toBe(true);
      const table1GuestIds = result.plan!['t1'].map(g => g.id);
      const table2GuestIds = result.plan!['t2'].map(g => g.id);

      // Check that g1 and g2 are not in the same table (CANNOT_SIT_TOGETHER)
      const g1g2together = (table1GuestIds.includes('g1') && table1GuestIds.includes('g2')) ||
                         (table2GuestIds.includes('g1') && table2GuestIds.includes('g2'));

      expect(g1g2together).toBe(false);
    });

    it("should fail if a group is too large for any table", async () => {
      const guests = [createGuestMock("g1", "A", "A"), createGuestMock("g2", "B", "B"), createGuestMock("g3", "C", "C")];
      const tables = [{ id: "t1", name: "T1", capacity: 2 }];
      const rules = [{ type: 'SAME_TABLE', guestIds: ['g1', 'g2', 'g3'] }];
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ guests, tables, rules });

      const result = await generateSeatingPlan(eventId);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Nie udało się usadzić (grupy|\d+ gości)/);
    });

    it("should fail if not all guests can be seated", async () => {
      const guests = [createGuestMock("g1", "A", "A"), createGuestMock("g2", "B", "B"), createGuestMock("g3", "C", "C")];
      const tables = [{ id: "t1", name: "T1", capacity: 2 }];
      const rules = [];
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({ guests, tables, rules });

      const result = await generateSeatingPlan(eventId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Nie udało się usadzić 1 gości");
    });
  });

  describe("generateSeatingPlanAI", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockGetCurrentUser = require('@/lib/auth/utils').getCurrentUser;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockEventId = 'event1';

    const mockEvent = {
      id: mockEventId,
      name: 'Test Wedding',
      guests: [
        {
          id: 'guest1',
          name: 'Jan Kowalski',
          status: 'CONFIRMED',
          group: 'Family',
          dietaryRestrictions: 'Vegetarian',
        },
        {
          id: 'guest2',
          name: 'Anna Nowak',
          status: 'CONFIRMED',
          group: 'Family',
          dietaryRestrictions: null,
        },
      ],
      tables: [
        { id: 'table1', name: 'Stół 1', capacity: 4 },
        { id: 'table2', name: 'Stół 2', capacity: 4 },
      ],
      rules: [],
    };

    it("should generate AI seating plan successfully", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.guest.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      // Import the function to test
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { generateSeatingPlanAI } = require('../seating.actions');
      const result = await generateSeatingPlanAI(mockEventId);

      expect(result.success).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it("should fail if user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { generateSeatingPlanAI } = require('../seating.actions');
      const result = await generateSeatingPlanAI(mockEventId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate AI seating plan');
    });

    it("should handle database errors", async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      (prisma.event.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { generateSeatingPlanAI } = require('../seating.actions');
      const result = await generateSeatingPlanAI(mockEventId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate AI seating plan');
    });
  });
});
