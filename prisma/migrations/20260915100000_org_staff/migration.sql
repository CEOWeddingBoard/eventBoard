-- Personel obiektu bez kont w systemie + obsada przyjęcia.
-- Kelner czy kucharz nie musi się logować, żeby trafić na obsadę i do agendy.
CREATE TABLE IF NOT EXISTS "org_staff" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'STAFF',
  "phone" TEXT,
  "note" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_staff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "org_staff_organizationId_isActive_idx"
  ON "org_staff"("organizationId", "isActive");

ALTER TABLE "org_staff" DROP CONSTRAINT IF EXISTS "org_staff_organizationId_fkey";
ALTER TABLE "org_staff" ADD CONSTRAINT "org_staff_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "event_staff" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "role" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_staff_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_staff_eventId_staffId_key" ON "event_staff"("eventId", "staffId");
CREATE INDEX IF NOT EXISTS "event_staff_eventId_idx" ON "event_staff"("eventId");

ALTER TABLE "event_staff" DROP CONSTRAINT IF EXISTS "event_staff_eventId_fkey";
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_staff" DROP CONSTRAINT IF EXISTS "event_staff_staffId_fkey";
ALTER TABLE "event_staff" ADD CONSTRAINT "event_staff_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "org_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
