ALTER TABLE "venue_menu_packages" ADD COLUMN IF NOT EXISTS "season" TEXT DEFAULT 'ALL';

ALTER TABLE "venue_blocked_dates" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
ALTER TABLE "venue_blocked_dates" ADD COLUMN IF NOT EXISTS "endTime" TEXT;
ALTER TABLE "venue_blocked_dates" ADD COLUMN IF NOT EXISTS "recurrence" TEXT DEFAULT 'NONE';

ALTER TABLE "venue_blocked_dates" DROP CONSTRAINT IF EXISTS "venue_blocked_dates_venueId_hallId_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "venue_blocked_dates_venueId_hallId_date_startTime_key" ON "venue_blocked_dates"("venueId", "hallId", "date", "startTime");
