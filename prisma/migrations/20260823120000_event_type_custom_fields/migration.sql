-- AlterTable
ALTER TABLE "event_categories" ADD COLUMN IF NOT EXISTS "customFieldsJson" TEXT;
ALTER TABLE "event_categories" ADD COLUMN IF NOT EXISTS "agendaTemplateId" TEXT;
