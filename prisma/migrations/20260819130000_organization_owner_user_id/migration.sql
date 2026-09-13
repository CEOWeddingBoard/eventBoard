-- Organization.ownerId: clerkId → users.id (konta lokalne)
ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "organizations_ownerId_fkey";
UPDATE "organizations" o SET "ownerId" = u.id FROM "users" u WHERE u."clerkId" = o."ownerId";
DO $$ BEGIN
    ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
