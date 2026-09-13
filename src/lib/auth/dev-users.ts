export interface DevUser {
  id: string;
  email: string;
  name: string;
  role: 'bride' | 'groom' | 'guest';
  permissions: string[];
}

export const DEV_USERS: Record<string, DevUser> = {
  BRIDE: {
    id: 'dev-bride-001',
    email: 'bride@example.com',
    name: 'Pani Młoda',
    role: 'bride',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  GROOM: {
    id: 'dev-groom-001',
    email: 'groom@example.com',
    name: 'Pan Młody',
    role: 'groom',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  GUEST: {
    id: 'dev-guest-001',
    email: 'guest@example.com',
    name: 'Gość',
    role: 'guest',
    permissions: ['read'] // tylko odczyt dla gości
  }
};

export function getDevUserByEmail(email: string): DevUser | null {
  return Object.values(DEV_USERS).find(user => user.email === email) || null;
}

export function getAllDevUsers(): DevUser[] {
  return Object.values(DEV_USERS);
}

export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development' ||
         process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}