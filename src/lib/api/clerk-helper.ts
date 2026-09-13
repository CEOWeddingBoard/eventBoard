import { getCurrentUser } from "@/lib/auth/utils";
import { NextResponse } from "next/server";

/**
 * Helper function to get authenticated user
 * Returns the database user ID
 */
export async function getAuthUser() {
  const user = await getCurrentUser();
  return user;
}

/**
 * Helper function to require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

/**
 * Helper function to check if user has access to wedding
 */
export async function checkWeddingAccess(dbUserId: string, weddingId: string) {
  const { prisma } = await import("@/lib/prisma");
  
  const weddingAccess = await prisma.wedding.findFirst({
    where: {
      id: weddingId,
      participants: { some: { userId: dbUserId } },
    },
  });
  
  return !!weddingAccess;
}

/**
 * Helper function to check if user has access to event
 */
export async function checkEventAccess(dbUserId: string, eventId: string) {
  const { prisma } = await import("@/lib/prisma");
  
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      userId: dbUserId,
    },
  });
  
  return !!event;
}

/**
 * Helper to return unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Helper to return forbidden response
 */
export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * Helper to return user not found response
 */
export function userNotFoundResponse() {
  return NextResponse.json({ error: 'User not found' }, { status: 404 });
}
