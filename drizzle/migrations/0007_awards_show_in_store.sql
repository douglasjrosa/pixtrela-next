ALTER TABLE "awards" ADD COLUMN "show_in_store" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
UPDATE "awards" SET "show_in_store" = "active";
