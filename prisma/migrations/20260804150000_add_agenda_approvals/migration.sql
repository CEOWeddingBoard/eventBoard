CREATE TABLE IF NOT EXISTS "agenda_approvals" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agenda_approvals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "agenda_approvals_eventId_section_key" ON "agenda_approvals"("eventId", "section");
DO $$ BEGIN
    ALTER TABLE "agenda_approvals" ADD CONSTRAINT "agenda_approvals_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
