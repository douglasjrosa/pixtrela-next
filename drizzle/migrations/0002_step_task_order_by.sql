CREATE TYPE "step_task_order_by" AS ENUM(
  'manual',
  'delivery_date_asc',
  'delivery_date_desc',
  'created_at_asc',
  'created_at_desc'
);--> statement-breakpoint
ALTER TABLE "steps" ADD COLUMN "task_order_by" "step_task_order_by" DEFAULT 'manual' NOT NULL;
