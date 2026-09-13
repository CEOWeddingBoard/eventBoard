import { SignJWT, jwtVerify } from 'jose';
import { DEV_USERS, getDevUserByEmail, isDevMode, type DevUser } from './dev-users';

export { isDevMode };

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
);

export interface DevAuthUser {
  id: string;
  email: string;
  name: string;
  role: 'bride' | 'groom' | 'guest';
  permissions: string[];
}

export interface DevAuthResult {
  success: boolean;
  user?: DevAuthUser;
  error?: string;
  token?: string;
}

/**
 * Loguje użytkownika deweloperskiego
 */
export async function loginDevUser(email: string): Promise<DevAuthResult> {
  if (!isDevMode()) {
    return { success: false, error: 'Tryb deweloperski jest wyłączony' };
  }

  const user = getDevUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Nieprawidłowy użytkownik deweloperski' };
  }

  // Generuj JWT token
  const token = await generateToken(user);

  return {
    success: true,
    user,
    token
  };
}

/**
 * Weryfikuje JWT token
 */
export async function verifyDevToken(token: string): Promise<DevAuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // Znajdź użytkownika po ID
    const user = Object.values(DEV_USERS).find(u => u.id === userId);
    return user || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generuje JWT token dla użytkownika
 */
async function generateToken(user: DevUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Pobiera aktualnie zalogowanego użytkownika z cookies
 */
export async function getCurrentDevUser(request?: Request): Promise<DevAuthUser | null> {
  if (!isDevMode()) return null;

  // Sprawdź najpierw w headers (dla API routes)
  let token: string | null = null;

  if (request) {
    // W middleware cookies są dostępne przez headers
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const authCookie = cookies.find(c => c.startsWith('dev-auth-token='));
      token = authCookie?.split('=')[1] || null;
    }
    // Sprawdź też Authorization header
    token = token || request.headers.get('authorization')?.replace('Bearer ', '') || null;
  } else {
    // Sprawdź w cookies przeglądarki (client-side)
    const cookies = document?.cookie?.split(';') || [];
    const authCookie = cookies.find(c => c.trim().startsWith('dev-auth-token='));
    token = authCookie?.split('=')[1] || null;
  }

  if (!token) return null;

  return verifyDevToken(token);
}

/**
 * Middleware do sprawdzania autentykacji
 */
export async function requireDevAuth(request: Request): Promise<DevAuthUser> {
  const user = await getCurrentDevUser(request);

  if (!user) {
    throw new Error('Brak autentykacji deweloperskiej');
  }

  return user;
}

/**
 * Sprawdza czy użytkownik ma uprawnienia
 */
export function hasPermission(user: DevAuthUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

/**
 * Wrapper dla API routes z autentykacją deweloperską
 */
export function withDevAuth<T extends unknown[]>(
  handler: (user: DevAuthUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const request = args[0] as Request;
      const user = await requireDevAuth(request);
      return await handler(user, ...args);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Błąd autentykacji'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}