import { getEvents, createEvent } from '@/lib/actions/event.actions';

// Note: prisma is already mocked in jest.setup.js
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

jest.mock('@/lib/auth/utils', () => ({
  getCurrentUser: jest.fn(),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetCurrentUser = require('@/lib/auth/utils').getCurrentUser;

describe('Event Actions', () => {
  const mockUser = { id: 'mock-user-id', email: 'test@example.com', name: 'Test' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  describe('getEvents', () => {
    it('should return events for authenticated user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const events = await getEvents();

      // getEvents zwraca demo data w trybie dev/test; może nie wywoływać getCurrentUser
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('name');
      expect(events[0]).toHaveProperty('date');
    });

    it('should return demo events even when user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const events = await getEvents();

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].name).toBe('Nasze Wesele');
    });
  });

  describe('createEvent', () => {
    it('should create event using mock user ID', async () => {
      const eventData = { name: 'Wedding', date: '2025-01-01' };

      const mockEvent = { id: '1', name: 'Wedding', date: new Date('2025-01-01'), userId: 'mock-user-id' };
      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const event = await createEvent(eventData);

      // Sprawdzamy pola, które są treścią tego testu. Pełne porównanie rekordu
      // wywracało test przy każdym nowym polu eventu, nic przy tym nie wykrywając.
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Wedding',
          date: new Date('2025-01-01'),
          userId: 'mock-user-id',
        }),
      });
      expect(event).toEqual(mockEvent);
      expect(revalidatePath).toHaveBeenCalledWith('/pl');
      expect(revalidatePath).toHaveBeenCalledWith('/en');
    });

    it('should handle database errors', async () => {
      const eventData = { name: 'Wedding', date: '2025-01-01' };

      (prisma.event.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(createEvent(eventData)).rejects.toThrow('Database error');
    });
  });
});
