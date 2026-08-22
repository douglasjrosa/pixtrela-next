ALTER TABLE "awards" ADD COLUMN "actual_price" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "awards" ADD COLUMN "auto_recalculate" boolean DEFAULT true NOT NULL;
