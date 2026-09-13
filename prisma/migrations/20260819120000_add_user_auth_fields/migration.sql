-- Konta lokalne zamiast Clerk: rola, aktywność, metadane bilingowe
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'STAFF';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "metadataJson" TEXT;
