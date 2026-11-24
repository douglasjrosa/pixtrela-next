ALTER TABLE "kiosk_settings"
ADD COLUMN "show_producing_started_at" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "kiosk_settings"
ADD COLUMN "show_producing_expected_time" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "kiosk_settings"
ADD COLUMN "show_producing_elapsed" boolean DEFAULT true NOT NULL;
