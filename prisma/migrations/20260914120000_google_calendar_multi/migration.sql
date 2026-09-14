-- Wiele kalendarzy Google na przestrzeń, z kolorem i przypisaniem do sali.
-- Dotąd model dopuszczał JEDNO połączenie na użytkownika (userId UNIQUE),
-- więc obiekt prowadzący kalendarz sali i kalendarz właściciela nie mógł
-- pokazać obu na grafiku.

ALTER TABLE "google_calendar_connections" DROP CONSTRAINT IF EXISTS "google_calendar_connections_userId_key";
DROP INDEX IF EXISTS "google_calendar_connections_userId_key";

ALTER TABLE "google_calendar_connections" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "google_calendar_connections" ADD COLUMN IF NOT EXISTS "label" TEXT NOT NULL DEFAULT 'Kalendarz Google';
ALTER TABLE "google_calendar_connections" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#0ea5e9';
ALTER TABLE "google_calendar_connections" ADD COLUMN IF NOT EXISTS "venueHallId" TEXT;
ALTER TABLE "google_calendar_connections" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "google_calendar_connections" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

-- Istniejące połączenia przypinamy do pierwszej przestrzeni ich właściciela.
UPDATE "google_calendar_connections" c
SET "organizationId" = m."organizationId"
FROM "organization_members" m
WHERE c."organizationId" IS NULL AND m."userId" = c."userId";

-- Połączenia bez przestrzeni są bezużyteczne — grafik nie ma ich gdzie pokazać.
DELETE FROM "google_calendar_connections" WHERE "organizationId" IS NULL;

ALTER TABLE "google_calendar_connections" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "google_calendar_connections_organizationId_isActive_idx"
  ON "google_calendar_connections"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "google_calendar_connections_userId_idx"
  ON "google_calendar_connections"("userId");
