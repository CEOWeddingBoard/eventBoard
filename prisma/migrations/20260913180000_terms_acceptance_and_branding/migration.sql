-- Akceptacja regulaminu (per użytkownik) + lekki branding per klient.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "acceptedTermsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "acceptedTermsAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "brandColor" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "brandLogoUrl" TEXT;
