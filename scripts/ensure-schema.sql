-- Idempotentna sieć bezpieczeństwa schematu.
-- Uruchamiana przy KAŻDYM starcie aplikacji, po migrate deploy i db push.
-- Wszystko musi być bezpieczne do wielokrotnego wykonania (IF NOT EXISTS / DO $$ guard).

-- ── workflow_nodes ─────────────────────────────────────────────────────────
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
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_nodes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workflow_nodes_workflowId_sortOrder_idx"
    ON "workflow_nodes"("workflowId", "sortOrder");

DO $$ BEGIN
    ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflowId_fkey"
        FOREIGN KEY ("workflowId") REFERENCES "organization_workflows"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- ── event_process_states ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "event_process_states" (
    "id"               TEXT NOT NULL,
    "eventId"          TEXT NOT NULL,
    "workflowId"       TEXT NOT NULL,
    "currentNodeId"    TEXT NOT NULL,
    "completedNodeIds" TEXT NOT NULL DEFAULT '[]',
    "nodeDataJson"     TEXT NOT NULL DEFAULT '{}',
    "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_process_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_process_states_eventId_key"
    ON "event_process_states"("eventId");
CREATE INDEX IF NOT EXISTS "event_process_states_workflowId_idx"
    ON "event_process_states"("workflowId");

DO $$ BEGIN
    ALTER TABLE "event_process_states" ADD CONSTRAINT "event_process_states_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "events"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- ── event_agenda_data ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "event_agenda_data" (
    "id"        TEXT NOT NULL,
    "eventId"   TEXT NOT NULL,
    "dataJson"  TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_agenda_data_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_agenda_data_eventId_key"
    ON "event_agenda_data"("eventId");

DO $$ BEGIN
    ALTER TABLE "event_agenda_data" ADD CONSTRAINT "event_agenda_data_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "events"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- ── event_widgets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "event_widgets" (
    "id"         TEXT NOT NULL,
    "eventId"    TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "title"      TEXT NOT NULL,
    "sortOrder"  INTEGER NOT NULL DEFAULT 0,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "dataJson"   TEXT NOT NULL DEFAULT '{}',
    "isVisible"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_widgets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "event_widgets_eventId_sortOrder_idx"
    ON "event_widgets"("eventId", "sortOrder");

DO $$ BEGIN
    ALTER TABLE "event_widgets" ADD CONSTRAINT "event_widgets_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "events"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- ── kolumny dodawane na istniejących tabelach ──────────────────────────────
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "weddingBoardToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "events_weddingBoardToken_key"
    ON "events"("weddingBoardToken");

ALTER TABLE "organization_workflows" ALTER COLUMN "stagesJson" SET DEFAULT '[]';

-- Tryb wyboru menu na kroku procesu
ALTER TABLE "workflow_nodes" ADD COLUMN IF NOT EXISTS "menuMode" TEXT;

-- Przypisanie wydarzenia do sali obiektu
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "hallId" TEXT;
CREATE INDEX IF NOT EXISTS "events_hallId_idx" ON "events"("hallId");

DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_hallId_fkey"
        FOREIGN KEY ("hallId") REFERENCES "venue_halls"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;

-- Pola profilu publicznego organizacji (/org/<slug>)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "city"        TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "postalCode"  TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "website"     TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "capacity"    INTEGER;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "priceRange"  TEXT;

-- Przypisanie typu obiektu do procesu (kartoteki trzymane w visibleInJson)
ALTER TABLE "organization_object_types" ADD COLUMN IF NOT EXISTS "workflowId" TEXT;
CREATE INDEX IF NOT EXISTS "organization_object_types_workflowId_idx"
    ON "organization_object_types"("workflowId");

DO $$ BEGIN
    ALTER TABLE "organization_object_types" ADD CONSTRAINT "organization_object_types_workflowId_fkey"
        FOREIGN KEY ("workflowId") REFERENCES "organization_workflows"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
