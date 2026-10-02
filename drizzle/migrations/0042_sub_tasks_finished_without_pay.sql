ALTER TABLE "sub_tasks"
  ADD COLUMN IF NOT EXISTS "finished_without_pay" boolean DEFAULT false NOT NULL;
