-- Venue Manager (B2B)

CREATE TABLE IF NOT EXISTS "venues" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "capacity" INTEGER,
    "stripeConnectAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_halls" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_halls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_blocked_dates" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "hallId" TEXT,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_blocked_dates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_menu_packages" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerPerson" DOUBLE PRECISION NOT NULL,
    "minGuests" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_menu_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_menu_items" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePerPerson" DOUBLE PRECISION,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_menu_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_menu_package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "choiceGroup" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "includedInPackage" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "venue_menu_package_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_table_templates" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "hallId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_table_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_reservations" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "eventId" TEXT,
    "hallId" TEXT,
    "basePackageId" TEXT,
    "accessTokenHash" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "isPremiumUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "menuCompleted" BOOLEAN NOT NULL DEFAULT false,
    "seatingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "coupleEmail" TEXT NOT NULL,
    "coupleName" TEXT,
    "couplePhone" TEXT,
    "internalNotes" TEXT,
    "source" TEXT,
    "guestCountEstimate" INTEGER,
    "guestCountConfirmed" INTEGER,
    "estimatedTotalCost" DOUBLE PRECISION,
    "finalTotalCost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "seatingLockAt" TIMESTAMP(3),
    "seatingLockedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "wedding_menu_selections" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "basePackageId" TEXT,
    "selections" TEXT,
    "estimatedTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_menu_selections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_client_guests" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dietType" TEXT,
    "allergies" TEXT,
    "tableNumber" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_client_guests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "guest_seating_exports" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guestCount" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "guest_seating_exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_payment_installments" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidAmount" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_payment_installments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_reservation_notes" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "authorClerkId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_reservation_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "venue_reservation_activities" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_reservation_activities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "venues_clerkOrgId_key" ON "venues"("clerkOrgId");
CREATE UNIQUE INDEX IF NOT EXISTS "venues_slug_key" ON "venues"("slug");
CREATE INDEX IF NOT EXISTS "venue_halls_venueId_idx" ON "venue_halls"("venueId");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_blocked_dates_venueId_hallId_date_key" ON "venue_blocked_dates"("venueId", "hallId", "date");
CREATE INDEX IF NOT EXISTS "venue_menu_packages_venueId_isActive_idx" ON "venue_menu_packages"("venueId", "isActive");
CREATE INDEX IF NOT EXISTS "venue_menu_items_venueId_category_isActive_idx" ON "venue_menu_items"("venueId", "category", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_menu_package_items_packageId_menuItemId_key" ON "venue_menu_package_items"("packageId", "menuItemId");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_table_templates_venueId_number_key" ON "venue_table_templates"("venueId", "number");
CREATE INDEX IF NOT EXISTS "venue_table_templates_venueId_idx" ON "venue_table_templates"("venueId");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_reservations_eventId_key" ON "venue_reservations"("eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "venue_reservations_accessTokenHash_key" ON "venue_reservations"("accessTokenHash");
CREATE INDEX IF NOT EXISTS "venue_reservations_venueId_weddingDate_idx" ON "venue_reservations"("venueId", "weddingDate");
CREATE INDEX IF NOT EXISTS "venue_reservations_venueId_status_idx" ON "venue_reservations"("venueId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "wedding_menu_selections_reservationId_key" ON "wedding_menu_selections"("reservationId");
CREATE INDEX IF NOT EXISTS "venue_client_guests_reservationId_idx" ON "venue_client_guests"("reservationId");
CREATE UNIQUE INDEX IF NOT EXISTS "guest_seating_exports_reservationId_key" ON "guest_seating_exports"("reservationId");
CREATE INDEX IF NOT EXISTS "venue_payment_installments_reservationId_status_idx" ON "venue_payment_installments"("reservationId", "status");
CREATE INDEX IF NOT EXISTS "venue_reservation_notes_reservationId_idx" ON "venue_reservation_notes"("reservationId");
CREATE INDEX IF NOT EXISTS "venue_reservation_activities_reservationId_createdAt_idx" ON "venue_reservation_activities"("reservationId", "createdAt");

DO $$ BEGIN
    ALTER TABLE "venue_halls" ADD CONSTRAINT "venue_halls_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_blocked_dates" ADD CONSTRAINT "venue_blocked_dates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_blocked_dates" ADD CONSTRAINT "venue_blocked_dates_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "venue_halls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_menu_packages" ADD CONSTRAINT "venue_menu_packages_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_menu_items" ADD CONSTRAINT "venue_menu_items_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_menu_package_items" ADD CONSTRAINT "venue_menu_package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "venue_menu_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_menu_package_items" ADD CONSTRAINT "venue_menu_package_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "venue_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_table_templates" ADD CONSTRAINT "venue_table_templates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_reservations" ADD CONSTRAINT "venue_reservations_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_reservations" ADD CONSTRAINT "venue_reservations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_reservations" ADD CONSTRAINT "venue_reservations_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "venue_halls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_reservations" ADD CONSTRAINT "venue_reservations_basePackageId_fkey" FOREIGN KEY ("basePackageId") REFERENCES "venue_menu_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "wedding_menu_selections" ADD CONSTRAINT "wedding_menu_selections_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_client_guests" ADD CONSTRAINT "venue_client_guests_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "guest_seating_exports" ADD CONSTRAINT "guest_seating_exports_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_payment_installments" ADD CONSTRAINT "venue_payment_installments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_reservation_notes" ADD CONSTRAINT "venue_reservation_notes_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venue_reservation_activities" ADD CONSTRAINT "venue_reservation_activities_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "venue_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
