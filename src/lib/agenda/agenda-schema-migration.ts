import { prisma } from "@/lib/prisma";

let ensured = false;

const COLUMNS: Array<{ name: string; ddl: string }> = [
  { name: "organizerName", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "organizerName" TEXT' },
  { name: "responsiblePerson", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "responsiblePerson" TEXT' },
  { name: "eventEndTime", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "eventEndTime" TIMESTAMP(3)' },
  { name: "occasionLabel", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "occasionLabel" TEXT' },
  { name: "scenarioNotes", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "scenarioNotes" TEXT' },
  { name: "isWedding", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "isWedding" BOOLEAN NOT NULL DEFAULT false' },
  { name: "clientLinkTokenHash", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientLinkTokenHash" TEXT' },
  { name: "clientLinkExpiresAt", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientLinkExpiresAt" TIMESTAMP(3)' },
  { name: "clientReviewedAt", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientReviewedAt" TIMESTAMP(3)' },
  { name: "clientFeedback", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientFeedback" TEXT' },
  { name: "status", ddl: 'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'DRAFT\'' },
];

export async function ensureAgendaEventColumns() {
  if (ensured) return;
  ensured = true;

  for (const col of COLUMNS) {
    try {
      await prisma.$executeRawUnsafe(col.ddl);
    } catch {
      // Kolumna już istnieje lub dialekt nie wspiera DDL — ignoruj.
    }
  }
}
