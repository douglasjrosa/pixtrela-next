ALTER TABLE "app_branding_settings" ADD COLUMN "menu_logo_background_color" varchar(32);--> statement-breakpoint
ALTER TABLE "app_branding_settings" ADD COLUMN "menu_logo_background_color_opacity" double precision DEFAULT 0 NOT NULL;
