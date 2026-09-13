import { prisma } from "@/lib/prisma";

let ensured = false;

export async function ensureUserAuthColumns() {
  if (ensured) return;
  ensured = true;

  const ddl = [
    'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT \'STAFF\'',
    'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true',
    'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "metadataJson" TEXT',
  ];

  for (const sql of ddl) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // Kolumna już istnieje lub dialekt nie wspiera DDL — ignoruj.
    }
  }
}
