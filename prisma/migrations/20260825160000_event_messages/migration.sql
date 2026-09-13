CREATE TABLE IF NOT EXISTS "event_messages" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL DEFAULT 'ORGANIZER',
  "senderName" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "event_messages_eventId_createdAt_idx" ON "event_messages"("eventId", "createdAt");
DO $$ BEGIN
    ALTER TABLE "event_messages" ADD CONSTRAINT "event_messages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
