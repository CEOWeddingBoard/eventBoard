import { prisma } from "@/lib/prisma";

let ensured = false;

export async function ensureEventP1Columns() {
  if (ensured) return;
  ensured = true;

  const ddl = [
    'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'DRAFT\'',
    'ALTER TABLE "menu_variant_courses" ADD COLUMN IF NOT EXISTS "priceBase" DOUBLE PRECISION',
    'ALTER TABLE "menu_variant_courses" ADD COLUMN IF NOT EXISTS "priceExtra" DOUBLE PRECISION',
    'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "quoteJson" TEXT',
    'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "menuDeadlineAt" TIMESTAMP(3)',
    'ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "guestListDeadlineAt" TIMESTAMP(3)',
  ];

  for (const sql of ddl) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // kolumna już istnieje lub dialekt nie wspiera — ignoruj
    }
  }

  const table = `
    CREATE TABLE IF NOT EXISTS "org_blocked_dates" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "reason" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "org_blocked_dates_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "org_blocked_dates_organizationId_date_key" ON "org_blocked_dates"("organizationId", "date");
    CREATE INDEX IF NOT EXISTS "org_blocked_dates_organizationId_date_idx" ON "org_blocked_dates"("organizationId", "date");
  `;
  try {
    await prisma.$executeRawUnsafe(table);
  } catch {
    // tabela już istnieje — ignoruj
  }

  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "org_blocked_dates" ADD CONSTRAINT "org_blocked_dates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
  } catch {
    // FK już istnieje — ignoruj
  }

  const extraTables = `
    CREATE TABLE IF NOT EXISTS "org_templates" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "kind" TEXT NOT NULL DEFAULT 'AGENDA',
      "contentJson" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "org_templates_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "org_templates_organizationId_kind_idx" ON "org_templates"("organizationId", "kind");
    CREATE TABLE IF NOT EXISTS "org_notifications" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'INFO',
      "title" TEXT NOT NULL,
      "body" TEXT,
      "link" TEXT,
      "read" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "org_notifications_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "org_notifications_organizationId_read_createdAt_idx" ON "org_notifications"("organizationId", "read", "createdAt");
    CREATE TABLE IF NOT EXISTS "event_payments" (
      "id" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "dueDate" TIMESTAMP(3),
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "paidAt" TIMESTAMP(3),
      "method" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "event_payments_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "event_payments_eventId_status_idx" ON "event_payments"("eventId", "status");
    CREATE TABLE IF NOT EXISTS "org_leads" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT,
      "phone" TEXT,
      "eventDate" TIMESTAMP(3),
      "guestCount" INTEGER,
      "message" TEXT,
      "status" TEXT NOT NULL DEFAULT 'NEW',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "org_leads_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "org_leads_organizationId_status_idx" ON "org_leads"("organizationId", "status");
  `;
  try {
    await prisma.$executeRawUnsafe(extraTables);
  } catch {
    // tabele już istnieją — ignoruj
  }
}
