ALTER TABLE "sub_tasks" ADD COLUMN "linked_to_previous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "template_sub_tasks" ADD COLUMN "linked_to_previous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "chain_run_id" uuid;
