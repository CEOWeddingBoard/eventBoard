import { createEvent, getEvents, updateEvent } from '../event.actions';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
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

describe('createEvent', () => {
  const mockUser = { id: 'mock-user-id', email: 'test@test.com', name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockUser);
  });

  it('should create event successfully', async () => {
    const eventData = { name: 'Test Wedding', date: '2025-06-15' };

    const mockCreatedEvent = {
      id: 'event1',
      name: 'Test Wedding',
      date: new Date('2025-06-15'),
      userId: 'mock-user-id',
    };

    (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);

    const result = await createEvent(eventData);

    expect(result).toEqual(mockCreatedEvent);
    expect(prisma.event.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Wedding',
        date: new Date('2025-06-15'),
        userId: 'mock-user-id',
        brideName: null,
        groomName: null,
        estimatedGuestCount: null,
        targetBudget: null,
      },
    });
  });

  it('should handle database errors', async () => {
    const eventData = { name: 'Test', date: '2025-01-01' };

    (prisma.event.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(createEvent(eventData)).rejects.toThrow('Database error');
  });

  it('should revalidate correct paths', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mockRevalidatePath = require('next/cache').revalidatePath;
    const eventData = { name: 'Test', date: '2025-01-01' };

    const mockCreatedEvent = {
      id: 'event1',
      name: 'Test',
      date: new Date('2025-01-01'),
      userId: 'mock-user-id',
    };

    (prisma.event.create as jest.Mock).mockResolvedValue(mockCreatedEvent);

    await createEvent(eventData);

    expect(mockRevalidatePath).toHaveBeenCalledWith('/pl');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/pl/dashboard');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/dashboard');
  });
});

describe('getEvents', () => {
  const mockUser = { id: 'user1', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return demo events for authenticated user', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const result = await getEvents();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'demo-event-1',
      name: 'Nasze Wesele',
      userId: 'demo-user',
      targetBudget: 50000,
      estimatedGuestCount: 100,
      style: 'Klasyczny',
      priorities: ['Fotograf', 'Catering', 'Muzyka'],
    });
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should return demo events even when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const result = await getEvents();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Nasze Wesele');
  });
});

describe('updateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass guest portal fields to prisma and normalize slug', async () => {
    const payload = {
      publicSlug: ' Wesele Ani i Piotra 2026 ',
      description: 'Opis dla gości',
      dressCode: 'Elegancko',
      mapLocationUrl: 'https://maps.google.com/?q=test',
      guestPortalEnabled: true,
    };

    (prisma.event.update as jest.Mock).mockResolvedValue({
      id: 'event1',
      ...payload,
      publicSlug: 'wesele-ani-i-piotra-2026',
    });

    const result = await updateEvent('event1', payload);

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'event1' },
      data: expect.objectContaining({
        publicSlug: 'wesele-ani-i-piotra-2026',
        description: 'Opis dla gości',
        dressCode: 'Elegancko',
        mapLocationUrl: 'https://maps.google.com/?q=test',
        guestPortalEnabled: true,
      }),
    });

    expect(result).toMatchObject({
      id: 'event1',
      publicSlug: 'wesele-ani-i-piotra-2026',
    });
  });
});