-- CreateTable
CREATE TABLE IF NOT EXISTS "agenda_document_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pagesJson" TEXT NOT NULL,
    "settingsJson" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "agenda_document_templates_organizationId_idx" ON "agenda_document_templates"("organizationId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "agenda_document_templates" ADD CONSTRAINT "agenda_document_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
