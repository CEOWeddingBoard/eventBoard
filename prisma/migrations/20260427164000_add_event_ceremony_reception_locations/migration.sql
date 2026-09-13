ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "ceremonyLocationName" TEXT,
ADD COLUMN IF NOT EXISTS "ceremonyLocationUrl" TEXT,
ADD COLUMN IF NOT EXISTS "receptionLocationName" TEXT,
ADD COLUMN IF NOT EXISTS "receptionLocationUrl" TEXT;
