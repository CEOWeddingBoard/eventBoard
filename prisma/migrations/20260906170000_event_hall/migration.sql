-- Przypisanie wydarzenia do sali.
-- Obiekt z kilkoma salami prowadzi równoległe imprezy tego samego dnia,
-- więc kalendarz i lista muszą wiedzieć, która sala jest zajęta.

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "hallId" TEXT;

CREATE INDEX IF NOT EXISTS "events_hallId_idx" ON "events"("hallId");

DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_hallId_fkey"
        FOREIGN KEY ("hallId") REFERENCES "venue_halls"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
