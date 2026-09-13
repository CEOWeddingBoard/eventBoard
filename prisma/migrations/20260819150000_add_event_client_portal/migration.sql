-- Portal decyzyjny klienta (eventy nie-weselne)
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientLinkTokenHash" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientLinkExpiresAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientReviewedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "clientFeedback" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "events_clientLinkTokenHash_key" ON "events"("clientLinkTokenHash");
