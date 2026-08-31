ALTER TABLE "sub_task_presets" ADD COLUMN "active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "active" boolean DEFAULT true NOT NULL;
