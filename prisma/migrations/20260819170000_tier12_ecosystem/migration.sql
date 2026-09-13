-- Tier 1+2: szablony, powiadomienia, płatności manualne, leady, kosztorys/deadline'y
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "quoteJson" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "menuDeadlineAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "guestListDeadlineAt" TIMESTAMP(3);

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
DO $$ BEGIN
    ALTER TABLE "org_templates" ADD CONSTRAINT "org_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

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
DO $$ BEGIN
    ALTER TABLE "org_notifications" ADD CONSTRAINT "org_notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

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
DO $$ BEGIN
    ALTER TABLE "event_payments" ADD CONSTRAINT "event_payments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

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
DO $$ BEGIN
    ALTER TABLE "org_leads" ADD CONSTRAINT "org_leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
