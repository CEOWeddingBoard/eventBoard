ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "workflowId" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "workflowStageId" TEXT;
CREATE TABLE IF NOT EXISTS "event_workflow_history" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "fromStage" TEXT,
  "toStage" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_workflow_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "event_workflow_history_eventId_createdAt_idx" ON "event_workflow_history"("eventId", "createdAt");
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "organization_workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "event_workflow_history" ADD CONSTRAINT "event_workflow_history_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
