-- Poziom dostępu i wiele ról operacyjnych na członku + limity licencji per przestrzeń.
-- Idempotentne.

ALTER TABLE "organization_members" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organization_members" ADD COLUMN IF NOT EXISTS "rolesJson" TEXT NOT NULL DEFAULT '[]';

-- Właściciele (OWNER) są administratorami przestrzeni.
UPDATE "organization_members" SET "isAdmin" = true WHERE "role" = 'OWNER' AND "isAdmin" = false;

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxAdmins" INTEGER;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER;
