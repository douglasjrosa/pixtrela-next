CREATE TABLE "reason_for_deactivation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(128) NOT NULL,
	"record_ids" uuid[] NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reason_for_deactivation_table_name_idx"
	ON "reason_for_deactivation" ("table_name");
--> statement-breakpoint
CREATE INDEX "reason_for_deactivation_record_ids_gin"
	ON "reason_for_deactivation" USING GIN ("record_ids");
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "reason_for_deactivation";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "reason_for_deactivation";
