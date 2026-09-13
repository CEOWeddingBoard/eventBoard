-- Migration: add Organization, OrganizationMember, EventCategory models
-- EventBoard foundation — multi-tenant organization support

-- 1. Organization (firma/sala/biznes eventowy)
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "planExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organizations_slug_key" UNIQUE ("slug")
);

-- 2. OrganizationMember (użytkownik → organizacja z rolą)
CREATE TABLE IF NOT EXISTS "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "permissions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organization_members_unique" UNIQUE ("organizationId", "userId")
);

-- 3. EventCategory (własne kategorie eventów per organizacja)
CREATE TABLE IF NOT EXISTS "event_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "modulesJson" TEXT,
    "defaultsJson" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id")
);

-- 4. Add organizationId + categoryId + modulesOverride to Event
ALTER TABLE "events" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "events" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "events" ADD COLUMN "modulesOverrideJson" TEXT;

-- 5. Add organizationId to Venue
ALTER TABLE "venues" ADD COLUMN "organizationId" TEXT;

-- 6. Foreign keys
DO $$ BEGIN
    ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "events" ADD CONSTRAINT "events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "venues" ADD CONSTRAINT "venues_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS "organizations_ownerId_idx" ON "organizations"("ownerId");
CREATE INDEX IF NOT EXISTS "organization_members_organizationId_idx" ON "organization_members"("organizationId");
CREATE INDEX IF NOT EXISTS "event_categories_organizationId_idx" ON "event_categories"("organizationId");
CREATE INDEX IF NOT EXISTS "events_organizationId_idx" ON "events"("organizationId");
CREATE INDEX IF NOT EXISTS "events_categoryId_idx" ON "events"("categoryId");
CREATE INDEX IF NOT EXISTS "venues_organizationId_idx" ON "venues"("organizationId");
