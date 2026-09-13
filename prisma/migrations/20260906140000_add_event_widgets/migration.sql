-- CreateTable
CREATE TABLE IF NOT EXISTS "event_widgets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "dataJson" TEXT NOT NULL DEFAULT '{}',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_widgets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "event_widgets" ADD CONSTRAINT "event_widgets_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object OR undefined_table THEN NULL; END $$;
