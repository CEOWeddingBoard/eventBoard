CREATE TABLE IF NOT EXISTS "menu_variants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "menu_variants_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "menu_variants_eventId_idx" ON "menu_variants"("eventId");

CREATE TABLE IF NOT EXISTS "menu_variant_courses" (
    "id" TEXT NOT NULL,
    "menuVariantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseType" TEXT NOT NULL,
    "description" TEXT,
    "allergens" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "menu_variant_courses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "menu_variant_courses_menuVariantId_idx" ON "menu_variant_courses"("menuVariantId");

DO $$ BEGIN
    ALTER TABLE "menu_variants" ADD CONSTRAINT "menu_variants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "menu_variant_courses" ADD CONSTRAINT "menu_variant_courses_menuVariantId_fkey" FOREIGN KEY ("menuVariantId") REFERENCES "menu_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
