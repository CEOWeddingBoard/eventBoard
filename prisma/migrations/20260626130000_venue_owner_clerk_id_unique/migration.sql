-- One venue per Clerk user (single manager account)
DROP INDEX IF EXISTS "venues_ownerClerkId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "venues_ownerClerkId_key" ON "venues"("ownerClerkId");
