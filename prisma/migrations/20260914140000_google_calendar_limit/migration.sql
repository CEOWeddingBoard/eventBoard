-- Limit podłączonych kalendarzy Google per przestrzeń.
-- null = limit wynikający z planu (START 5, PRO 10, ENTERPRISE bez limitu).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "maxGoogleCalendars" INTEGER;
