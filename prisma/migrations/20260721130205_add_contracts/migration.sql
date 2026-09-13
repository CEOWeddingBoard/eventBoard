CREATE TABLE IF NOT EXISTS "contract_templates" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MAIN',
    "name" TEXT NOT NULL,
    "docxUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "placeholders" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contract_templates_venueId_type_idx" ON "contract_templates"("venueId", "type");

CREATE TABLE IF NOT EXISTS "contracts" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MAIN',
    "quoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "filledData" TEXT,
    "pdfUrl" TEXT,
    "signingTokenHash" TEXT,
    "signingTokenExp" TIMESTAMP(3),
    "signedCoupleAt" TIMESTAMP(3),
    "signedVenueAt" TIMESTAMP(3),
    "signedPdfUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "contracts_signingTokenHash_key" ON "contracts"("signingTokenHash");
CREATE INDEX IF NOT EXISTS "contracts_reservationId_idx" ON "contracts"("reservationId");
CREATE INDEX IF NOT EXISTS "contracts_reservationId_status_idx" ON "contracts"("reservationId", "status");

DO $$ BEGIN
    ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "contracts" ADD CONSTRAINT "contracts_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "venue_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
