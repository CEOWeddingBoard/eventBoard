CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "roles_eventId_idx" ON "roles"("eventId");

CREATE TABLE IF NOT EXISTS "section_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "section_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "section_permissions_roleId_section_key" ON "section_permissions"("roleId", "section");

DO $$ BEGIN
    ALTER TABLE "roles" ADD CONSTRAINT "roles_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "section_permissions" ADD CONSTRAINT "section_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

ALTER TABLE "event_participants" ADD COLUMN "roleId" TEXT;
