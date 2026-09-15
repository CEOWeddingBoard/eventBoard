-- Poziom dostepu per polaczenie oraz konto Google, z ktorego je podlaczono.
ALTER TABLE "google_calendar_connections"
  ADD COLUMN IF NOT EXISTS "accessMode" TEXT NOT NULL DEFAULT 'FULL',
  ADD COLUMN IF NOT EXISTS "googleAccountEmail" TEXT;

-- Dziennik operacji na kalendarzach Google.
CREATE TABLE IF NOT EXISTS "google_calendar_audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT,
    "connectionLabel" TEXT,
    "googleAccountEmail" TEXT,
    "action" TEXT NOT NULL,
    "subject" TEXT,
    "eventId" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_calendar_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "google_calendar_audit_logs_org_created_idx"
  ON "google_calendar_audit_logs"("organizationId", "createdAt");
