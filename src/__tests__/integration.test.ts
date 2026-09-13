/**
 * @jest-environment node
 */
import { createEvent } from '@/lib/actions/event.actions';
import { generateSeatingPlanAI } from '@/lib/actions/seating.actions';
import { createGuest } from '@/lib/actions/guest.actions';

// Mock all external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    guest: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    table: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth/utils', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetCurrentUser = require('@/lib/auth/utils').getCurrentUser;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockPrisma = require('@/lib/prisma').prisma;

describe('Wedding Board Integration Tests', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  describe('Complete Wedding Planning Flow', () => {
    it('should create a wedding event and manage guests and seating', async () => {
      // Step 1: Create a wedding event
      const eventData = {
        name: 'Summer Wedding 2025',
        date: new Date('2025-07-15T16:00:00Z'),
      };

      const mockEvent = {
        id: 'wedding-123',
        ...eventData,
        userId: mockUser.id,
      };

      mockPrisma.event.create.mockResolvedValue(mockEvent);

      const createdEvent = await createEvent(eventData);

      expect(createdEvent).toMatchObject({
        id: 'wedding-123',
        name: 'Summer Wedding 2025',
        userId: mockUser.id,
      });

      // Step 2: Add guests to the wedding
      const guestsData = [
        {
          name: 'Jan Kowalski',
          email: 'jan@example.com',
          status: 'CONFIRMED',
          eventId: 'wedding-123',
        },
        {
          name: 'Anna Nowak',
          email: 'anna@example.com',
          status: 'CONFIRMED',
          eventId: 'wedding-123',
        },
        {
          name: 'Maria Wiśniewska',
          email: 'maria@example.com',
          status: 'CONFIRMED',
          eventId: 'wedding-123',
        },
      ];

      guestsData.forEach((guest, index) => {
        mockPrisma.guest.create.mockResolvedValueOnce({
          id: `guest-${index + 1}`,
          ...guest,
        });
      });

      // Create guests (createGuestSchema: name, eventId wymagane; reszta optional)
      for (const guestData of guestsData) {
        const createdGuest = await createGuest({
          name: guestData.name,
          email: guestData.email,
          status: guestData.status,
          eventId: guestData.eventId,
          relationship: 'Friend',
          notes: '',
        });
        expect(createdGuest).toHaveProperty('id');
        expect(createdGuest.name).toBe(guestData.name);
      }

      // Step 3: Generate AI seating plan
      const mockEventWithGuests = {
        id: 'wedding-123',
        name: 'Summer Wedding 2025',
        guests: guestsData.map((g, i) => ({
          id: `guest-${i + 1}`,
          name: g.name,
          status: 'CONFIRMED',
          group: 'Family',
          dietaryRestrictions: null,
        })),
        tables: [
          { id: 'table1', name: 'Stół 1', capacity: 4 },
          { id: 'table2', name: 'Stół 2', capacity: 4 },
        ],
        rules: [],
      };

      mockPrisma.event.findUnique.mockResolvedValue(mockEventWithGuests);
      mockPrisma.guest.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.$transaction.mockResolvedValue([]);

      const seatingResult = await generateSeatingPlanAI('wedding-123');

      expect(seatingResult.success).toBe(true);
      expect(seatingResult.plan).toBeDefined();
      expect(seatingResult.warnings).toBeDefined();
      expect(seatingResult.suggestions).toBeDefined();

      // Verify database updates
      expect(mockPrisma.guest.updateMany).toHaveBeenCalledWith({
        where: { eventId: 'wedding-123' },
        data: { tableId: null },
      });
    });

    it('should handle authentication errors throughout the flow', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(createEvent({ name: 'Test Wedding', date: new Date() })).rejects.toThrow(
        /zalogowany|Musisz być zalogowany/
      );

      const result = await generateSeatingPlanAI('event-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate AI seating plan');
    });

    it('should handle database errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockPrisma.event.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(createEvent({
        name: 'Test Wedding',
        date: new Date(),
      })).rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate wedding event data', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Test invalid event name
      await expect(createEvent({
        name: '', // Invalid: too short
        date: new Date(),
      })).rejects.toThrow();

      // Test invalid date
      await expect(createEvent({
        name: 'Valid Name',
        date: new Date('invalid-date'),
      })).rejects.toThrow();
    });

    it('should validate guest data', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Test invalid guest name
      await expect(createGuest({
        name: '', // Invalid: empty
        email: 'test@example.com',
        status: 'CONFIRMED',
        eventId: 'event-123',
        group: 'Family',
        dietaryRestrictions: null,
        relationship: 'Friend',
        age: 30,
        needsHotel: false,
        needsTransport: false,
        notes: '',
      })).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple guests efficiently', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser);

      // Create mock event with many guests
      const manyGuests = Array.from({ length: 50 }, (_, i) => ({
        id: `guest-${i}`,
        name: `Guest ${i}`,
        status: 'CONFIRMED' as const,
        group: 'Family',
        dietaryRestrictions: i % 5 === 0 ? 'Vegetarian' : null,
      }));

      const eventWithManyGuests = {
        id: 'large-event',
        name: 'Large Wedding',
        guests: manyGuests,
        tables: Array.from({ length: 10 }, (_, i) => ({
          id: `table-${i}`,
          name: `Stół ${i + 1}`,
          capacity: 6,
        })),
        rules: [],
      };

      mockPrisma.event.findUnique.mockResolvedValue(eventWithManyGuests);
      mockPrisma.guest.updateMany.mockResolvedValue({ count: 50 });
      mockPrisma.$transaction.mockResolvedValue([]);

      const startTime = Date.now();
      const result = await generateSeatingPlanAI('large-event');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});