ALTER TABLE "currencies" ADD COLUMN "show_in_store" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "currency_id" uuid;--> statement-breakpoint
UPDATE "cart_items" AS "ci"
SET "currency_id" = (
  SELECT "cfs"."currency_id" FROM "currency_for_subtasks" AS "cfs" LIMIT 1
)
WHERE "ci"."currency_id" IS NULL;--> statement-breakpoint
DELETE FROM "cart_items" WHERE "currency_id" IS NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ALTER COLUMN "currency_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_currency_id_currencies_id_fk"
  FOREIGN KEY ("currency_id") REFERENCES "currencies"("id");--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_award_unique";--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_award_currency_unique"
  UNIQUE ("cart_id", "award_id", "currency_id");
