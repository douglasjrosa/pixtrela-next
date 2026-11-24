ALTER TABLE "task_automation_settings"
  ADD COLUMN "production_gap_tolerance_minutes" integer DEFAULT 30 NOT NULL;
