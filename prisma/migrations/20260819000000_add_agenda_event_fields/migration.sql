-- Add agenda fields to events (Organizator, Odpowiedzialny, Zakończenie, Okoliczność, Scenariusz)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "organizerName" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "responsiblePerson" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "eventEndTime" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "occasionLabel" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "scenarioNotes" TEXT;
