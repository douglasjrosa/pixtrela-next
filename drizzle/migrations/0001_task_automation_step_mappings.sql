ALTER TABLE "tasks" DROP CONSTRAINT "tasks_step_id_steps_id_fk";
--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "waiting_step_id" uuid;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "producing_step_id" uuid;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "paused_step_id" uuid;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "finished_step_id" uuid;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "reviewed_step_id" uuid;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "delivered_step_id" uuid;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD COLUMN "assign_warn_max" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD CONSTRAINT "task_automation_settings_waiting_step_id_steps_id_fk" FOREIGN KEY ("waiting_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD CONSTRAINT "task_automation_settings_producing_step_id_steps_id_fk" FOREIGN KEY ("producing_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD CONSTRAINT "task_automation_settings_paused_step_id_steps_id_fk" FOREIGN KEY ("paused_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD CONSTRAINT "task_automation_settings_finished_step_id_steps_id_fk" FOREIGN KEY ("finished_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD CONSTRAINT "task_automation_settings_reviewed_step_id_steps_id_fk" FOREIGN KEY ("reviewed_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_automation_settings" ADD CONSTRAINT "task_automation_settings_delivered_step_id_steps_id_fk" FOREIGN KEY ("delivered_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_step_id_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;