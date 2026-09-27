CREATE TYPE "chain_run_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "chain_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"head_sub_task_id" uuid NOT NULL,
	"status" "chain_run_status" DEFAULT 'open' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"capacity" integer NOT NULL
);--> statement-breakpoint
ALTER TABLE "chain_runs" ADD CONSTRAINT "chain_runs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_runs" ADD CONSTRAINT "chain_runs_head_sub_task_id_sub_tasks_id_fk" FOREIGN KEY ("head_sub_task_id") REFERENCES "public"."sub_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chain_runs_open_head_idx" ON "chain_runs" USING btree ("status","head_sub_task_id");--> statement-breakpoint
CREATE TABLE "open_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone,
	"chain_run_id" uuid
);--> statement-breakpoint
ALTER TABLE "open_sessions" ADD CONSTRAINT "open_sessions_sub_task_id_sub_tasks_id_fk" FOREIGN KEY ("sub_task_id") REFERENCES "public"."sub_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_sessions" ADD CONSTRAINT "open_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "open_sessions" ADD CONSTRAINT "open_sessions_chain_run_id_chain_runs_id_fk" FOREIGN KEY ("chain_run_id") REFERENCES "public"."chain_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "open_sessions_sub_task_idx" ON "open_sessions" USING btree ("sub_task_id");--> statement-breakpoint
CREATE INDEX "open_sessions_chain_run_idx" ON "open_sessions" USING btree ("chain_run_id");--> statement-breakpoint
CREATE INDEX "open_sessions_user_idx" ON "open_sessions" USING btree ("user_id");