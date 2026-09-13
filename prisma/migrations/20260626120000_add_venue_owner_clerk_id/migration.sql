-- Link venue owner to Clerk user for DB lookup (avoids Clerk Organizations API on every request)
ALTER TABLE "venues" ADD COLUMN "ownerClerkId" TEXT;

CREATE INDEX IF NOT EXISTS "venues_ownerClerkId_idx" ON "venues"("ownerClerkId");
