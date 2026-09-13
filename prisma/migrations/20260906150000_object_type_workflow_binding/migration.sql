-- Powiązanie typu obiektu z procesem (workflow).
-- Kartoteki, w których obiekt jest widoczny, pozostają w visibleInJson.

ALTER TABLE "organization_object_types" ADD COLUMN IF NOT EXISTS "workflowId" TEXT;

CREATE INDEX IF NOT EXISTS "organization_object_types_workflowId_idx"
    ON "organization_object_types"("workflowId");

DO $$ BEGIN
    ALTER TABLE "organization_object_types" ADD CONSTRAINT "organization_object_types_workflowId_fkey"
        FOREIGN KEY ("workflowId") REFERENCES "organization_workflows"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
