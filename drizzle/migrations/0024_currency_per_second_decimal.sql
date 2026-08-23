ALTER TABLE "currencies"
ALTER COLUMN "currency_per_second" TYPE numeric(12, 2)
USING round("currency_per_second"::numeric, 2);

ALTER TABLE "currencies"
ALTER COLUMN "currency_per_second" SET DEFAULT '0';
