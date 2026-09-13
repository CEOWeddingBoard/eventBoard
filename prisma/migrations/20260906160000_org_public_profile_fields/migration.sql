-- Pola profilu publicznego organizacji (/org/<slug>).
-- Strona odpytywała te kolumny, zanim istniały, więc render kończył się 500.

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "city"        TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "postalCode"  TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "website"     TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "capacity"    INTEGER;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "priceRange"  TEXT;
