-- Venue portal expansion: choice groups, schedule, quotes, portal config

-- AlterTable venue_menu_package_items: replace choiceGroup string with choiceGroupId FK
ALTER TABLE "venue_menu_package_items" DROP COLUMN IF EXISTS "choiceGroup";
ALTER TABLE "venue_menu_package_items" ADD COLUMN IF NOT EXISTS "choiceGroupId" TEXT;

-- CreateTable venue_menu_choice_groups
CREATE TABLE IF NOT EXISTS "venue_menu_choice_groups" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "minPick" INTEGER NOT NULL DEFAULT 1,
    "maxPick" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultItemId" TEXT,

    CONSTRAINT "venue_menu_choice_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "venue_menu_choice_groups_packageId_key_key" ON "venue_menu_choice_groups"("packageId", "key");
CREATE INDEX IF NOT EXISTS "venue_menu_choice_groups_packageId_idx" ON "venue_menu_choice_groups"("packageId");

DO $$ BEGIN
    ALTER TABLE "venue_menu_choice_groups" ADD CONSTRAINT "venue_menu_choice_groups_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "venue_menu_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "venue_menu_package_items" ADD CONSTRAINT "venue_menu_package_items_choiceGroupId_fkey" FOREIGN KEY ("choiceGroupId") REFERENCES "venue_menu_choice_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

-- AlterTable venue_reservations
ALTER TABLE "venue_reservations" ADD COLUMN IF NOT EXISTS "guestsCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "venue_reservations" ADD COLUMN IF NOT EXISTS "scheduleCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "venue_reservations" ADD COLUMN IF NOT EXISTS "couplePortalConfig" TEXT;

-- AlterTable venue_client_guests
ALTER TABLE "venue_client_guests" ADD COLUMN IF NOT EXISTS "guestGroup" TEXT;
ALTER TABLE "venue_client_guests" ADD COLUMN IF NOT EXISTS "attendanceStatus" TEXT DEFAULT 'CONFIRMED';

-- CreateTable venue_client_schedule_items
CREATE TABLE IF NOT EXISTS "venue_client_schedule_items" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_client_schedule_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "venue_client_schedule_items_reservationId_sortOrder_idx" ON "venue_client_schedule_items"("reservationId", "sortOrder");

DO $$ BEGIN
    ALTER TABLE "venue_client_schedule_items" ADD CONSTRAINT "venue_client_schedule_items_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

-- CreateTable venue_quotes
CREATE TABLE IF NOT EXISTS "venue_quotes" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "reservationId" TEXT,
    "packageId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "label" TEXT,
    "guestCount" INTEGER,
    "selections" TEXT,
    "lineItems" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_quotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "venue_quotes_venueId_reservationId_idx" ON "venue_quotes"("venueId", "reservationId");
CREATE INDEX IF NOT EXISTS "venue_quotes_reservationId_status_idx" ON "venue_quotes"("reservationId", "status");

DO $$ BEGIN
    ALTER TABLE "venue_quotes" ADD CONSTRAINT "venue_quotes_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_quotes" ADD CONSTRAINT "venue_quotes_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_quotes" ADD CONSTRAINT "venue_quotes_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "venue_menu_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
