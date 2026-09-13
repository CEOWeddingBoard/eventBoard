-- Migration: add_workflow_nodes_process_state_agenda_data
-- Adds WorkflowNode, EventProcessState, EventAgendaData models
-- Marks OrganizationWorkflow.stagesJson and Event.workflowStageId as deprecated (data preserved)
-- Idempotentne: bezpieczne do ponownego uruchomienia na bazie zbudowanej przez `db push`.

-- WorkflowNode: węzły procesu (drzewo decyzyjne, zastępuje stagesJson)
CREATE TABLE IF NOT EXISTS "workflow_nodes" (
    "id"                TEXT NOT NULL,
    "workflowId"        TEXT NOT NULL,
    "name"              TEXT NOT NULL,
    "description"       TEXT,
    "nodeType"          TEXT NOT NULL DEFAULT 'ACTION',
    "actionType"        TEXT NOT NULL DEFAULT 'NONE',
    "assigneeRole"      TEXT NOT NULL DEFAULT 'MANAGER',
    "sortOrder"         INTEGER NOT NULL DEFAULT 0,
    "color"             TEXT,
    "fieldMappingsJson" TEXT NOT NULL DEFAULT '[]',
    "conditionsJson"    TEXT NOT NULL DEFAULT '[]',
    "nextNodeId"        TEXT,
    "isStart"           BOOLEAN NOT NULL DEFAULT false,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_nodes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workflow_nodes_workflowId_sortOrder_idx" ON "workflow_nodes"("workflowId", "sortOrder");

DO $$ BEGIN
    ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflowId_fkey"
        FOREIGN KEY ("workflowId") REFERENCES "organization_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- EventProcessState: stan instancji procesu na evencie
CREATE TABLE IF NOT EXISTS "event_process_states" (
    "id"               TEXT NOT NULL,
    "eventId"          TEXT NOT NULL,
    "workflowId"       TEXT NOT NULL,
    "currentNodeId"    TEXT NOT NULL,
    "completedNodeIds" TEXT NOT NULL DEFAULT '[]',
    "nodeDataJson"     TEXT NOT NULL DEFAULT '{}',
    "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_process_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_process_states_eventId_key" ON "event_process_states"("eventId");
CREATE INDEX IF NOT EXISTS "event_process_states_workflowId_idx" ON "event_process_states"("workflowId");

DO $$ BEGIN
    ALTER TABLE "event_process_states" ADD CONSTRAINT "event_process_states_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- EventAgendaData: magazyn danych agendy z mapowania pól węzłów
CREATE TABLE IF NOT EXISTS "event_agenda_data" (
    "id"        TEXT NOT NULL,
    "eventId"   TEXT NOT NULL,
    "dataJson"  TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_agenda_data_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_agenda_data_eventId_key" ON "event_agenda_data"("eventId");

DO $$ BEGIN
    ALTER TABLE "event_agenda_data" ADD CONSTRAINT "event_agenda_data_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- OrganizationWorkflow.stagesJson: zmiana DEFAULT na '[]' (dane historyczne zachowane)
ALTER TABLE "organization_workflows" ALTER COLUMN "stagesJson" SET DEFAULT '[]';
