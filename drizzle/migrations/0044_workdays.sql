CREATE TYPE "workday_action" AS ENUM('work', 'off');--> statement-breakpoint
CREATE TYPE "workday_scope" AS ENUM('global', 'team', 'user');--> statement-breakpoint
CREATE TABLE "workdays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"action" "workday_action" DEFAULT 'work' NOT NULL,
	"scope" "workday_scope" DEFAULT 'global' NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Sao_Paulo' NOT NULL,
	"valid_from" date,
	"valid_until" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workdays_validity_range_check" CHECK ("valid_from" IS NULL OR "valid_until" IS NULL OR "valid_until" >= "valid_from")
);--> statement-breakpoint
CREATE INDEX "workdays_active_scope_idx" ON "workdays" USING btree ("active","scope");--> statement-breakpoint
CREATE TABLE "workday_teams" (
	"workday_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	CONSTRAINT "workday_teams_workday_id_team_id_pk" PRIMARY KEY("workday_id","team_id")
);--> statement-breakpoint
ALTER TABLE "workday_teams" ADD CONSTRAINT "workday_teams_workday_id_workdays_id_fk" FOREIGN KEY ("workday_id") REFERENCES "public"."workdays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workday_teams" ADD CONSTRAINT "workday_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workday_teams_team_id_idx" ON "workday_teams" USING btree ("team_id");--> statement-breakpoint
CREATE TABLE "workday_users" (
	"workday_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "workday_users_workday_id_user_id_pk" PRIMARY KEY("workday_id","user_id")
);--> statement-breakpoint
ALTER TABLE "workday_users" ADD CONSTRAINT "workday_users_workday_id_workdays_id_fk" FOREIGN KEY ("workday_id") REFERENCES "public"."workdays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workday_users" ADD CONSTRAINT "workday_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workday_users_user_id_idx" ON "workday_users" USING btree ("user_id");--> statement-breakpoint
CREATE TABLE "workday_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workday_id" uuid NOT NULL,
	"is_recurrent" boolean DEFAULT false NOT NULL,
	"day_of_week" smallint,
	"date" date,
	"all_day" boolean DEFAULT false NOT NULL,
	"start_minute" integer,
	"end_minute" integer,
	CONSTRAINT "workday_slots_recurrence_check" CHECK (("is_recurrent" = true AND "day_of_week" BETWEEN 0 AND 6 AND "date" IS NULL) OR ("is_recurrent" = false AND "date" IS NOT NULL AND "day_of_week" IS NULL)),
	CONSTRAINT "workday_slots_time_check" CHECK (("all_day" = true AND "start_minute" IS NULL AND "end_minute" IS NULL) OR ("all_day" = false AND "start_minute" IS NOT NULL AND "end_minute" IS NOT NULL AND "start_minute" >= 0 AND "end_minute" <= 1440 AND "end_minute" > "start_minute"))
);--> statement-breakpoint
ALTER TABLE "workday_slots" ADD CONSTRAINT "workday_slots_workday_id_workdays_id_fk" FOREIGN KEY ("workday_id") REFERENCES "public"."workdays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workday_slots_workday_id_idx" ON "workday_slots" USING btree ("workday_id");--> statement-breakpoint
CREATE INDEX "workday_slots_date_idx" ON "workday_slots" USING btree ("date");
