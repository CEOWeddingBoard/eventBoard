-- Pola dania: liczba porcji i status zatwierdzenia + konfiguracja parsera menu.
-- Idempotentne — bezpieczne na bazach postawionych przez db push.

ALTER TABLE "menu_variant_courses" ADD COLUMN IF NOT EXISTS "portions" INTEGER;
ALTER TABLE "menu_variant_courses" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "menu_parser_configs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "rulesJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "menu_parser_configs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  CREATE UNIQUE INDEX "menu_parser_configs_organizationId_key" ON "menu_parser_configs"("organizationId");
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "menu_parser_configs" ADD CONSTRAINT "menu_parser_configs_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "menu_variants" ADD COLUMN IF NOT EXISTS "pricePerPerson" DOUBLE PRECISION;
