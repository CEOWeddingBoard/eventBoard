-- Sposob wyboru menu na kroku MENU_SELECTION.
-- WHOLE_VARIANT — klient wskazuje gotowy zestaw; PER_DISH — sklada menu z dan.

ALTER TABLE "workflow_nodes" ADD COLUMN IF NOT EXISTS "menuMode" TEXT;
