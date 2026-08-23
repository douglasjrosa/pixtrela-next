ALTER TABLE "exchange_order_items"
  ADD COLUMN "currency_id" uuid;--> statement-breakpoint

ALTER TABLE "exchange_order_items"
  ADD COLUMN "currency_plural_title" text;--> statement-breakpoint

ALTER TABLE "exchange_order_items"
  ADD CONSTRAINT "exchange_order_items_currency_id_currencies_id_fk"
  FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint

UPDATE "exchange_order_items" AS items
SET
  "currency_plural_title" = orders."currency_plural_title"
FROM "exchange_orders" AS orders
WHERE items."order_id" = orders."id"
  AND items."currency_plural_title" IS NULL;--> statement-breakpoint

UPDATE "exchange_order_items" AS items
SET "currency_id" = currencies."id"
FROM "exchange_orders" AS orders
INNER JOIN "currencies" AS currencies
  ON currencies."plural_title" = orders."currency_plural_title"
  OR currencies."title" = orders."currency_plural_title"
  OR currencies."name" = orders."currency_plural_title"
WHERE items."order_id" = orders."id"
  AND items."currency_id" IS NULL;
