ALTER TABLE "events" ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'WEDDING';
ALTER TABLE "events" ADD COLUMN "guestListMode" TEXT NOT NULL DEFAULT 'FULL';
CREATE INDEX IF NOT EXISTS "events_eventType_idx" ON "events"("eventType");
