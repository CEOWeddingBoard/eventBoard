-- Powiadomienia o krokach czekających na akceptację + porządki w panelu admina.
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "notifyDaysBefore" INTEGER DEFAULT 7;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "notifyEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "notifySms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "approvalReminderAt" TIMESTAMP(3);
