-- Add weddingBoardToken to events table
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "weddingBoardToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "events_weddingBoardToken_key" ON "events"("weddingBoardToken");
