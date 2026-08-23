CREATE TYPE "public"."cart_status" AS ENUM('open', 'checked_out', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."exchange_order_status" AS ENUM('completed', 'cancelled');--> statement-breakpoint

CREATE TABLE "carts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "status" "cart_status" DEFAULT 'open' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "carts_one_open_per_user"
  ON "carts" ("user_id")
  WHERE "status" = 'open';--> statement-breakpoint

CREATE TABLE "cart_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cart_id" uuid NOT NULL,
  "award_id" uuid NOT NULL,
  "qty" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "cart_items_qty_positive" CHECK ("qty" >= 1)
);--> statement-breakpoint

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk"
  FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_award_id_awards_id_fk"
  FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id")
  ON DELETE no action ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_award_unique"
  UNIQUE ("cart_id", "award_id");--> statement-breakpoint

CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" ("cart_id");--> statement-breakpoint

CREATE TABLE "exchange_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "status" "exchange_order_status" DEFAULT 'completed' NOT NULL,
  "currency_plural_title" text NOT NULL,
  "total_number_of" double precision NOT NULL,
  "item_count" integer DEFAULT 0 NOT NULL,
  "checked_out_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "exchange_orders" ADD CONSTRAINT "exchange_orders_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "exchange_orders_user_checked_out_idx"
  ON "exchange_orders" ("user_id", "checked_out_at");--> statement-breakpoint

CREATE TABLE "exchange_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "award_id" uuid,
  "award_title" text NOT NULL,
  "qty" integer DEFAULT 1 NOT NULL,
  "unit_number_of" double precision NOT NULL,
  "line_number_of" double precision NOT NULL,
  CONSTRAINT "exchange_order_items_qty_positive" CHECK ("qty" >= 1)
);--> statement-breakpoint

ALTER TABLE "exchange_order_items"
  ADD CONSTRAINT "exchange_order_items_order_id_exchange_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."exchange_orders"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "exchange_order_items"
  ADD CONSTRAINT "exchange_order_items_award_id_awards_id_fk"
  FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "exchange_order_items_order_id_idx"
  ON "exchange_order_items" ("order_id");--> statement-breakpoint

ALTER TABLE "exchanges" ADD COLUMN "order_id" uuid;--> statement-breakpoint

ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_order_id_exchange_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."exchange_orders"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "exchanges_order_id_idx" ON "exchanges" ("order_id");
