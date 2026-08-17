CREATE INDEX IF NOT EXISTS "activities_sub_task_colaborator_ts_idx"
  ON "activities" ("sub_task_id", "colaborator_id", "timestamp" DESC);
