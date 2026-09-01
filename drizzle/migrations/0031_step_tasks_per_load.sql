ALTER TABLE "steps"
  ADD COLUMN "tasks_per_load" integer DEFAULT 10 NOT NULL;
--> statement-breakpoint
ALTER TABLE "steps"
  ADD CONSTRAINT "steps_tasks_per_load_range"
  CHECK ("tasks_per_load" >= 5 AND "tasks_per_load" <= 50);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_active_step_index_idx"
  ON "tasks" ("active", "step_id", "index");
