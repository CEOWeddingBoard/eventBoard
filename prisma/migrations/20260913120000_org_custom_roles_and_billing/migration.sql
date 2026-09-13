-- Własne role operacyjne per przestrzeń + ręczne śledzenie płatności klienta (admin platformy).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "customRolesJson" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "billingPaidUntil" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "billingNote" TEXT;
