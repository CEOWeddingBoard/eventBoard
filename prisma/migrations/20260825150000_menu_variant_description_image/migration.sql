ALTER TABLE "menu_variants" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "menu_variants" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "menu_variants" DROP COLUMN IF EXISTS "guestCount";
