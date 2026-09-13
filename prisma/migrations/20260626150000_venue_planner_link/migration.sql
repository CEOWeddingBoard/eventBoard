-- AlterTable
ALTER TABLE "venue_reservations" ADD COLUMN "linkCodeHash" TEXT;
ALTER TABLE "venue_reservations" ADD COLUMN "linkCodeExpiresAt" TIMESTAMP(3);
ALTER TABLE "venue_reservations" ADD COLUMN "linkedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "guests" ADD COLUMN "venueClientGuestId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "venue_module_correction_requests" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL DEFAULT 'portal',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_module_correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "venue_reservations_linkCodeHash_key" ON "venue_reservations"("linkCodeHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "guests_venueClientGuestId_key" ON "guests"("venueClientGuestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "venue_module_correction_requests_reservationId_status_idx" ON "venue_module_correction_requests"("reservationId", "status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "guests" ADD CONSTRAINT "guests_venueClientGuestId_fkey" FOREIGN KEY ("venueClientGuestId") REFERENCES "venue_client_guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "venue_module_correction_requests" ADD CONSTRAINT "venue_module_correction_requests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
