-- CreateTable
CREATE TABLE IF NOT EXISTS "google_calendar_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "calendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_connections_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "events" ADD COLUMN "googleCalendarEventId" TEXT;

-- AlterTable
ALTER TABLE "day_schedule_items" ADD COLUMN "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "googleEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "google_calendar_connections_userId_key" ON "google_calendar_connections"("userId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
