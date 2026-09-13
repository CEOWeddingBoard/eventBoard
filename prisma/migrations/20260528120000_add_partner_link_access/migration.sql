-- CreateTable
CREATE TABLE IF NOT EXISTS "event_partner_link_access" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_partner_link_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "event_partner_link_access_tokenHash_key" ON "event_partner_link_access"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "event_partner_link_access_eventId_idx" ON "event_partner_link_access"("eventId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "event_partner_link_access" ADD CONSTRAINT "event_partner_link_access_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
