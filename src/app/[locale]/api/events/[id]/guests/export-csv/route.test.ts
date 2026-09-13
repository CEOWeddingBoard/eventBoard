/**
 * @jest-environment node
 */
import { GET } from './route';
import { authorizeRequest } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { NextResponse } from 'next/server';

jest.mock('@/lib/auth-utils', () => ({
  __esModule: true,
  authorizeRequest: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    guest: {
      findMany: jest.fn(),
    },
  },
}));

const mockAuthorizeRequest = authorizeRequest as jest.Mock;
const mockGuestFindMany = prisma.guest.findMany as jest.Mock;

describe('GET /[locale]/api/events/[id]/guests/export-csv', () => {
    const req = {} as Request;
    const params = Promise.resolve({ id: 'wedding-123' });
    const dbUser: User = { id: 'user-123', clerkId: 'clerk-123', email: 't@t.com', firstName: 'Test', lastName: 'User', imageUrl: '', createdAt: new Date(), updatedAt: new Date() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return an authorization error if authorizeRequest fails', async () => {
        mockAuthorizeRequest.mockResolvedValue({ error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
        const res = await GET(req, { params });
        expect(res.status).toBe(401);
    });

    it('should generate a correct CSV for guests', async () => {
        mockAuthorizeRequest.mockResolvedValue({ user: dbUser });
        const mockData = [
            {
                firstName: 'Jan', lastName: 'Kowalski', household: { name: 'Kowalscy', rsvpStatus: 'PENDING' },
                isAttending: true, foodPreference: 'Wege', allergies: null, needsHotel: false, needsTransport: true,
                relation: 'Brat', notes: 'Ważny gość',
            },
            {
                firstName: 'Anna', lastName: 'Nowak', household: { name: 'Nowakowie', rsvpStatus: 'CONFIRMED' },
                isAttending: true, foodPreference: null, allergies: 'Orzechy', needsHotel: true, needsTransport: true,
                relation: 'Przyjaciółka', notes: null,
            },
        ];
        mockGuestFindMany.mockResolvedValue(mockData);

        const response = await GET(req, { params });
        const text = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Disposition')).toContain('lista_gosci_wedding-123.csv');

        const expectedHeader = 'Imię,Nazwisko,Nazwa,Email,Telefon,Nazwa grupy domowej,Czy potwierdzono udział?,Status';
        expect(text.split('\r\n')[0]).toBe(expectedHeader);
        expect(text).toContain('Jan');
        expect(text).toContain('Kowalski');
        expect(text).toContain('Kowalscy');
        expect(text).toContain('Anna');
        expect(text).toContain('Nowak');
    });

    it('should return an empty CSV with headers if no guests are found', async () => {
        mockAuthorizeRequest.mockResolvedValue({ user: dbUser });
        mockGuestFindMany.mockResolvedValue([]);
        const response = await GET(req, { params });
        const text = await response.text();

        expect(response.status).toBe(200);
        const expectedHeader = 'Imię,Nazwisko,Nazwa,Email,Telefon,Nazwa grupy domowej,Czy potwierdzono udział?,Status';
        expect(text.trim()).toBe(expectedHeader);
    });
});
