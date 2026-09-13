-- AlterTable
ALTER TABLE "events" ADD COLUMN "calendarFeedToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "events_calendarFeedToken_key" ON "events"("calendarFeedToken");
