CREATE TABLE "app_branding_slots" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"media_id" uuid,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_branding_slots" ADD CONSTRAINT "app_branding_slots_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT
	'menu_logo',
	b."menu_logo_media_id",
	jsonb_strip_nulls(
		jsonb_build_object(
			'backgroundColor', b."menu_logo_background_color",
			'backgroundColorOpacity', b."menu_logo_background_color_opacity"
		)
	)
FROM "app_branding_settings" AS b
LIMIT 1;
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'ranking_first', b."ranking_first_media_id", '{}'::jsonb
FROM "app_branding_settings" AS b
LIMIT 1;
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'ranking_second', b."ranking_second_media_id", '{}'::jsonb
FROM "app_branding_settings" AS b
LIMIT 1;
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'ranking_third', b."ranking_third_media_id", '{}'::jsonb
FROM "app_branding_settings" AS b
LIMIT 1;
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
VALUES (
	'cart_watermark',
	NULL,
	jsonb_build_object('displayOpacity', 70, 'widthPercent', 50)
)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'menu_logo', NULL, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "app_branding_slots" WHERE "key" = 'menu_logo');
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'ranking_first', NULL, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "app_branding_slots" WHERE "key" = 'ranking_first');
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'ranking_second', NULL, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "app_branding_slots" WHERE "key" = 'ranking_second');
--> statement-breakpoint
INSERT INTO "app_branding_slots" ("key", "media_id", "config")
SELECT 'ranking_third', NULL, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "app_branding_slots" WHERE "key" = 'ranking_third');
--> statement-breakpoint
DROP TABLE "app_branding_settings";
