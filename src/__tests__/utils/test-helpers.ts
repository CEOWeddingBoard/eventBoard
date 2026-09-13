/**
 * Test utilities and helpers for consistent testing
 */

import { PrismaClient } from "@prisma/client"

/**
 * Create a test Prisma client
 */
export function createTestPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/wedding_planner_test",
      },
    },
  })
}

/**
 * Clean up test data
 */
export async function cleanupTestData(prisma: PrismaClient) {
  await prisma.guest.deleteMany({})
  await prisma.table.deleteMany({})
  await prisma.task.deleteMany({})
  await prisma.budgetItem.deleteMany({})
  await prisma.vendor.deleteMany({})
  await prisma.seatingRule.deleteMany({})
  await prisma.event.deleteMany({})
  await prisma.wedding.deleteMany({})
  await prisma.user.deleteMany({})
}

/**
 * Create test user
 */
export async function createTestUser(prisma: PrismaClient, data?: { email?: string; name?: string }) {
  return prisma.user.create({
    data: {
      email: data?.email || `test-${Date.now()}@example.com`,
      name: data?.name || "Test User",
      clerkId: `test-clerk-${Date.now()}`,
    },
  })
}

/**
 * Create test event
 */
export async function createTestEvent(prisma: PrismaClient, userId: string, data?: { name?: string }) {
  return prisma.event.create({
    data: {
      name: data?.name || "Test Event",
      userId,
      ceremonyDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })
}

/**
 * Create test guest
 */
export async function createTestGuest(prisma: PrismaClient, eventId: string, data?: { name?: string }) {
  return prisma.guest.create({
    data: {
      name: data?.name || "Test Guest",
      eventId,
      status: "CONFIRMED",
    },
  })
}

/**
 * Mock Clerk user
 */
export function mockClerkUser(overrides?: Partial<{ id: string; email: string; firstName: string }>) {
  return {
    id: overrides?.id || "user_test123",
    emailAddresses: [{ emailAddress: overrides?.email || "test@example.com" }],
    firstName: overrides?.firstName || "Test",
    lastName: "User",
  }
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock fetch response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockFetchResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response
}

/**
 * Mock fetch error
 */
export function mockFetchError(message = "Network error") {
  return Promise.reject(new Error(message))
}
