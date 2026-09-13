/**
 * Global test setup and configuration
 * This file is imported in jest.setup.tsx
 */

// Mock environment variables
if (typeof process !== 'undefined') {
  process.env.NODE_ENV = process.env.NODE_ENV || "test"
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/wedding_planner_test"
  process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || "test-secret-key"
}
