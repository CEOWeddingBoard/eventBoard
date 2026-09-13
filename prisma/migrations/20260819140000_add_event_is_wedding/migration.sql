-- Event: flaga wesele (udostępnienie Wedding Board dla pary) + pola agendy
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "organizerName" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "responsiblePerson" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "eventEndTime" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "occasionLabel" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "scenarioNotes" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "isWedding" BOOLEAN NOT NULL DEFAULT false;
