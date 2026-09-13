-- Krok procesu: kto wypełnia (fillRole), kto akceptuje (approveRole)
-- oraz definicja pól kroku (fieldsJson). Idempotentne — bezpieczne na
-- bazach postawionych przez db push.

ALTER TABLE "workflow_nodes" ADD COLUMN IF NOT EXISTS "fillRole" TEXT;
ALTER TABLE "workflow_nodes" ADD COLUMN IF NOT EXISTS "approveRole" TEXT;
ALTER TABLE "workflow_nodes" ADD COLUMN IF NOT EXISTS "fieldsJson" TEXT NOT NULL DEFAULT '[]';
