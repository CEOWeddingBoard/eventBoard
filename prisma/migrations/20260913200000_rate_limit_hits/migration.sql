-- Trwałe liczniki prób (logowanie, reset hasła).
-- Licznik w pamięci procesu znaczył tyle, że dwie instancje na Railway dawały
-- dwa razy wyższy limit, a restart instancji zerował go całkiem.
CREATE TABLE IF NOT EXISTS "rate_limit_hits" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_hits_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "rate_limit_hits_expiresAt_idx" ON "rate_limit_hits"("expiresAt");
