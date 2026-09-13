CREATE TABLE IF NOT EXISTS "venue_messages" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL DEFAULT 'VENUE',
    "senderName" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "venue_messages_reservationId_createdAt_idx" ON "venue_messages"("reservationId", "createdAt");

DO $$ BEGIN
    ALTER TABLE "venue_messages" ADD CONSTRAINT "venue_messages_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
