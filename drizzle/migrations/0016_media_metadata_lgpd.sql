CREATE TYPE "public"."media_category" AS ENUM(
  'avatar',
  'face',
  'award',
  'currency',
  'branding',
  'route_theme',
  'document',
  'other'
);--> statement-breakpoint
CREATE TYPE "public"."media_sensitivity" AS ENUM(
  'public',
  'internal',
  'biometric'
);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "display_name" varchar(255);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "alt_text" varchar(512);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "category" "media_category" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "sensitivity" "media_sensitivity" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_assets_category_idx" ON "media_assets" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_assets_sensitivity_idx" ON "media_assets" ("sensitivity");--> statement-breakpoint
UPDATE "media_assets" AS m
SET
  "category" = 'award',
  "sensitivity" = 'public',
  "updated_at" = now()
FROM "awards" AS a
WHERE a."image_media_id" = m."id";--> statement-breakpoint
UPDATE "media_assets" AS m
SET
  "category" = 'currency',
  "sensitivity" = 'public',
  "updated_at" = now()
FROM "currencies" AS c
WHERE c."icon_media_id" = m."id";--> statement-breakpoint
UPDATE "media_assets" AS m
SET
  "category" = 'route_theme',
  "sensitivity" = 'public',
  "updated_at" = now()
FROM "route_themes" AS r
WHERE r."background_image_media_id" = m."id";--> statement-breakpoint
UPDATE "media_assets" AS m
SET
  "category" = 'branding',
  "sensitivity" = 'public',
  "updated_at" = now()
FROM "app_branding_settings" AS b
WHERE m."id" IN (
  b."menu_logo_media_id",
  b."ranking_first_media_id",
  b."ranking_second_media_id",
  b."ranking_third_media_id"
);--> statement-breakpoint
UPDATE "media_assets" AS m
SET
  "category" = 'avatar',
  "sensitivity" = 'internal',
  "updated_at" = now()
FROM "users" AS u
WHERE u."avatar_media_id" = m."id";--> statement-breakpoint
UPDATE "media_assets" AS m
SET
  "category" = 'face',
  "sensitivity" = 'biometric',
  "updated_at" = now()
FROM "users" AS u
WHERE u."face_photo_media_id" = m."id";--> statement-breakpoint
UPDATE "media_assets"
SET
  "display_name" = regexp_replace("original_filename", '\.[^.]+$', ''),
  "updated_at" = now()
WHERE "display_name" IS NULL
  AND "original_filename" IS NOT NULL
  AND trim("original_filename") <> '';
