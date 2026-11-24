ALTER TABLE "workdays" ALTER COLUMN "action" DROP DEFAULT;--> statement-breakpoint
ALTER TYPE "workday_action" RENAME TO "workday_action_old";--> statement-breakpoint
CREATE TYPE "workday_action" AS ENUM(
  'absence',
  'excused_absence',
  'partial_absence',
  'partial_excused_absence',
  'off',
  'holiday',
  'work',
  'overtime',
  'make_up'
);--> statement-breakpoint
ALTER TABLE "workdays" ALTER COLUMN "action" TYPE "workday_action"
  USING "action"::text::"workday_action";--> statement-breakpoint
DROP TYPE "workday_action_old";--> statement-breakpoint
ALTER TABLE "workdays" ALTER COLUMN "action" SET DEFAULT 'work';--> statement-breakpoint
ALTER TABLE "workdays" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "workdays" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "workdays" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "workdays" ADD CONSTRAINT "workdays_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workdays" ADD CONSTRAINT "workdays_updated_by_users_id_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "workday_slots"
  SET "start_minute" = 0, "end_minute" = 1440
  WHERE "all_day" = true;--> statement-breakpoint
ALTER TABLE "workday_slots" DROP CONSTRAINT "workday_slots_time_check";--> statement-breakpoint
ALTER TABLE "workday_slots" DROP COLUMN "all_day";--> statement-breakpoint
ALTER TABLE "workday_slots" ALTER COLUMN "start_minute" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workday_slots" ALTER COLUMN "end_minute" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workday_slots" ADD CONSTRAINT "workday_slots_time_check"
  CHECK ("start_minute" >= 0 AND "end_minute" <= 1440 AND "end_minute" > "start_minute");
