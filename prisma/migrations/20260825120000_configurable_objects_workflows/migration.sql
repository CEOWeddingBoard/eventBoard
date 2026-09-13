CREATE TABLE IF NOT EXISTS "organization_object_types" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "fieldsJson" TEXT NOT NULL,
  "visibleInJson" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_object_types_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "organization_object_types_organizationId_idx" ON "organization_object_types"("organizationId");
DO $$ BEGIN
    ALTER TABLE "organization_object_types" ADD CONSTRAINT "organization_object_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "organization_workflows" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "eventType" TEXT,
  "stagesJson" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_workflows_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "organization_workflows_organizationId_eventType_idx" ON "organization_workflows"("organizationId", "eventType");
DO $$ BEGIN
    ALTER TABLE "organization_workflows" ADD CONSTRAINT "organization_workflows_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
