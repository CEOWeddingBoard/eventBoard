CREATE TABLE IF NOT EXISTS "voice_notes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "transcription" TEXT,
    "duration" INTEGER,
    "section" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voice_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "voice_notes_eventId_idx" ON "voice_notes"("eventId");
DO $$ BEGIN
    ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
