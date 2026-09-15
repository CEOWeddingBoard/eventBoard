-- Link decyzyjny dla osoby bez konta w systemie.
-- Event mial dotad dokladnie jeden taki link i zawsze w roli klienta;
-- przy jednym przyjeciu decyzje podejmuje wiecej osob z zewnatrz
-- (zamawiajacy, wedding planner, podwykonawca), a kazda z nich musi
-- widziec wylacznie kroki swojej roli.
CREATE TABLE IF NOT EXISTS "event_access_links" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_access_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_access_links_tokenHash_key" ON "event_access_links"("tokenHash");
CREATE INDEX IF NOT EXISTS "event_access_links_eventId_idx" ON "event_access_links"("eventId");

ALTER TABLE "event_access_links"
    ADD CONSTRAINT "event_access_links_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
