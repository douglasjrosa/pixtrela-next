ALTER TABLE "task_automation_settings"
  ADD COLUMN IF NOT EXISTS "leader_exchanges_first_day" integer DEFAULT 3 NOT NULL;

ALTER TABLE "task_automation_settings"
  ADD COLUMN IF NOT EXISTS "leader_exchanges_last_day" integer DEFAULT 15 NOT NULL;
