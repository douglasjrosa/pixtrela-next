CREATE INDEX IF NOT EXISTS "activities_sub_task_action_ts_idx"
  ON "activities" ("sub_task_id", "action", "timestamp" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sub_task_assignees_sub_task_id_idx"
  ON "sub_task_assignees" ("sub_task_id");
