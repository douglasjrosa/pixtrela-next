ALTER TABLE "media_assets" ADD COLUMN "original_filename" varchar(255);

CREATE TABLE "app_branding_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_logo_media_id" uuid,
	"ranking_first_media_id" uuid,
	"ranking_second_media_id" uuid,
	"ranking_third_media_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_branding_settings" ADD CONSTRAINT "app_branding_settings_menu_logo_media_id_media_assets_id_fk" FOREIGN KEY ("menu_logo_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "app_branding_settings" ADD CONSTRAINT "app_branding_settings_ranking_first_media_id_media_assets_id_fk" FOREIGN KEY ("ranking_first_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "app_branding_settings" ADD CONSTRAINT "app_branding_settings_ranking_second_media_id_media_assets_id_fk" FOREIGN KEY ("ranking_second_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "app_branding_settings" ADD CONSTRAINT "app_branding_settings_ranking_third_media_id_media_assets_id_fk" FOREIGN KEY ("ranking_third_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
