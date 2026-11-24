ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'panel';--> statement-breakpoint
CREATE TABLE "panels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(128) NOT NULL,
  "slug" varchar(64) NOT NULL,
  "step_id" uuid NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "panels" ADD CONSTRAINT "panels_slug_unique" UNIQUE ("slug");--> statement-breakpoint
ALTER TABLE "panels" ADD CONSTRAINT "panels_step_id_steps_id_fk"
  FOREIGN KEY ("step_id") REFERENCES "steps"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "panel_teams" (
  "panel_id" uuid NOT NULL,
  "team_id" uuid NOT NULL
);--> statement-breakpoint
ALTER TABLE "panel_teams" ADD CONSTRAINT "panel_teams_panel_id_panel_id_fk"
  FOREIGN KEY ("panel_id") REFERENCES "panels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_teams" ADD CONSTRAINT "panel_teams_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_teams" ADD CONSTRAINT "panel_teams_panel_id_team_id_pk"
  PRIMARY KEY ("panel_id", "team_id");--> statement-breakpoint
CREATE INDEX "panel_teams_team_id_idx" ON "panel_teams" ("team_id");--> statement-breakpoint
CREATE TABLE "panel_shift_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "panel_id" uuid NOT NULL,
  "business_date" date NOT NULL,
  "packed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "today_task_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "tomorrow_task_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "overrun_task_id" uuid,
  "next_business_date" date,
  "usable_today_by_sub_task" jsonb DEFAULT '{}'::jsonb NOT NULL
);--> statement-breakpoint
ALTER TABLE "panel_shift_snapshots" ADD CONSTRAINT "panel_shift_snapshots_panel_id_panels_id_fk"
  FOREIGN KEY ("panel_id") REFERENCES "panels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_shift_snapshots" ADD CONSTRAINT "panel_shift_snapshots_panel_date_unique"
  UNIQUE ("panel_id", "business_date");--> statement-breakpoint
CREATE INDEX "panel_shift_snapshots_panel_id_idx" ON "panel_shift_snapshots" ("panel_id");
