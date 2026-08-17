ALTER TABLE "exchanges" ADD COLUMN "award_title" text;--> statement-breakpoint
ALTER TABLE "exchanges" ADD COLUMN "currency_plural_title" text;--> statement-breakpoint

UPDATE "exchanges" AS e
SET
  "award_title" = COALESCE(NULLIF(a."title", ''), a."name"),
  "currency_plural_title" = COALESCE(
    NULLIF(c."plural_title", ''),
    NULLIF(c."title", ''),
    c."name"
  )
FROM "awards" AS a, "currencies" AS c
WHERE e."award_id" = a."id" AND e."currency_id" = c."id";--> statement-breakpoint

ALTER TABLE "exchanges" ALTER COLUMN "award_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "exchanges" ALTER COLUMN "currency_plural_title" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_award_id_awards_id_fk";--> statement-breakpoint
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_currency_id_currencies_id_fk";--> statement-breakpoint
ALTER TABLE "exchanges" DROP COLUMN "award_id";--> statement-breakpoint
ALTER TABLE "exchanges" DROP COLUMN "currency_id";--> statement-breakpoint

ALTER TABLE "balances" ADD COLUMN "currency_plural_title" text;--> statement-breakpoint

UPDATE "balances" AS b
SET "currency_plural_title" = COALESCE(
  NULLIF(c."plural_title", ''),
  NULLIF(c."title", ''),
  c."name"
)
FROM "currencies" AS c
WHERE b."currency_id" = c."id";--> statement-breakpoint

ALTER TABLE "balances" ALTER COLUMN "currency_plural_title" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "balances" DROP CONSTRAINT "balances_currency_id_currencies_id_fk";--> statement-breakpoint
ALTER TABLE "balances" DROP COLUMN "currency_id";
