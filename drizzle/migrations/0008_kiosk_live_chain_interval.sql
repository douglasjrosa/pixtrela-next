ALTER TABLE "kiosk_settings"
ADD COLUMN "max_simultaneous_subtask_interval_seconds" integer
DEFAULT 300 NOT NULL;
