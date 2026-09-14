-- Dane kontaktowe klienta i dziennik notatek admina platformy.
-- Pojedyncze pole adminNote było nadpisywane przy każdej zmianie, więc wiedza
-- o tym, czego klienci potrzebują, ginęła. Notatki są teraz listą wpisów.
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "contactPerson" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;

CREATE TABLE IF NOT EXISTS "org_admin_notes" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorName" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'UWAGA',
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_admin_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "org_admin_notes_organizationId_createdAt_idx"
  ON "org_admin_notes"("organizationId", "createdAt");

ALTER TABLE "org_admin_notes" DROP CONSTRAINT IF EXISTS "org_admin_notes_organizationId_fkey";
ALTER TABLE "org_admin_notes" ADD CONSTRAINT "org_admin_notes_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
