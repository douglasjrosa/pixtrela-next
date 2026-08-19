CREATE TYPE "public"."exchange_batch_status" AS ENUM('pending', 'ready');--> statement-breakpoint

CREATE TABLE "exchange_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "status" "exchange_batch_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "exchange_batches_year_month_unique" UNIQUE("year", "month")
);--> statement-breakpoint

ALTER TABLE "exchange_orders" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "exchange_orders" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "exchange_orders" ADD COLUMN "month" integer;--> statement-breakpoint

UPDATE "exchange_orders"
SET
  "year" = EXTRACT(YEAR FROM "checked_out_at" AT TIME ZONE 'UTC')::integer,
  "month" = EXTRACT(MONTH FROM "checked_out_at" AT TIME ZONE 'UTC')::integer
WHERE "year" IS NULL OR "month" IS NULL;--> statement-breakpoint

-- Keep one order per user/year/month (oldest wins) before unique constraint.
DELETE FROM "exchange_orders" AS eo
USING "exchange_orders" AS older
WHERE eo."user_id" = older."user_id"
  AND eo."year" = older."year"
  AND eo."month" = older."month"
  AND eo."checked_out_at" > older."checked_out_at";--> statement-breakpoint

ALTER TABLE "exchange_orders" ALTER COLUMN "year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exchange_orders" ALTER COLUMN "month" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "exchange_orders"
  ADD CONSTRAINT "exchange_orders_batch_id_exchange_batches_id_fk"
  FOREIGN KEY ("batch_id") REFERENCES "public"."exchange_batches"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "exchange_orders_batch_id_idx" ON "exchange_orders" ("batch_id");--> statement-breakpoint

ALTER TABLE "exchange_orders"
  ADD CONSTRAINT "exchange_orders_user_year_month_unique"
  UNIQUE ("user_id", "year", "month");
