-- Uprawnienia modułowe per rola (brak/podgląd/edycja).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "modulePermissionsJson" TEXT;
