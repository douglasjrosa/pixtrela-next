ALTER TABLE "users" ALTER COLUMN "code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint
UPDATE "users" SET "code" = NULL WHERE "code" = 0;
