-- P1: status eventu, ceny menu, blokady terminów organizacji
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "menu_variant_courses" ADD COLUMN IF NOT EXISTS "priceBase" DOUBLE PRECISION;
ALTER TABLE "menu_variant_courses" ADD COLUMN IF NOT EXISTS "priceExtra" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "org_blocked_dates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "org_blocked_dates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "org_blocked_dates_organizationId_date_key" ON "org_blocked_dates"("organizationId", "date");
CREATE INDEX IF NOT EXISTS "org_blocked_dates_organizationId_date_idx" ON "org_blocked_dates"("organizationId", "date");
DO $$ BEGIN
    ALTER TABLE "org_blocked_dates" ADD CONSTRAINT "org_blocked_dates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
