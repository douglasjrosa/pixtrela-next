ALTER TABLE "currency_for_subtasks"
  ADD COLUMN "valid_from" timestamp with time zone
    DEFAULT '1970-01-01T00:00:00Z' NOT NULL;
ALTER TABLE "currency_for_subtasks"
  ADD COLUMN "valid_until" timestamp with time zone;
