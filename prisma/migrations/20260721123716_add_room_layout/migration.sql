ALTER TABLE "venue_reservations" ADD COLUMN IF NOT EXISTS "roomLayout" TEXT;

CREATE TABLE IF NOT EXISTS "venue_room_layout_templates" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_room_layout_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "venue_room_layout_templates_venueId_idx" ON "venue_room_layout_templates"("venueId");

DO $$ BEGIN
    ALTER TABLE "venue_room_layout_templates" ADD CONSTRAINT "venue_room_layout_templates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table OR undefined_column THEN NULL; END $$;
