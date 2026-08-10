CREATE TYPE "public"."activation_status" AS ENUM('inactive', 'active', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."activity_action" AS ENUM('started', 'stoped');--> statement-breakpoint
CREATE TYPE "public"."greeting_gender" AS ENUM('male', 'female', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."sharing_type" AS ENUM('qty', 'duration');--> statement-breakpoint
CREATE TYPE "public"."sub_task_status" AS ENUM('waiting', 'producing', 'paused', 'finished');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('waiting', 'producing', 'paused', 'finished', 'reviewed', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'leader', 'colaborator', 'kiosk');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_task_id" uuid NOT NULL,
	"colaborator_id" uuid NOT NULL,
	"action" "activity_action" NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"qty" integer DEFAULT 0 NOT NULL,
	"currency_awarded" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "award_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"award_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"number_of" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"title" varchar(256),
	"description" text,
	"warnings" text,
	"image_media_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"date" date NOT NULL,
	"previous_balance" double precision DEFAULT 0 NOT NULL,
	"total_income" double precision DEFAULT 0 NOT NULL,
	"total_outcome" double precision DEFAULT 0 NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL,
	"title" varchar(128),
	"plural_title" varchar(128),
	"currency_per_second" double precision DEFAULT 0 NOT NULL,
	"icon_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "currency_for_subtasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"award_id" uuid NOT NULL,
	"currency_id" uuid NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"number_of" double precision NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kiosk_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_idle_seconds" integer DEFAULT 120 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" varchar(128),
	"byte_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_key" varchar(128) NOT NULL,
	"label" varchar(128) NOT NULL,
	"background_color" varchar(32),
	"background_color_opacity" double precision,
	"background_size" varchar(64),
	"background_position" varchar(64),
	"background_repeat" varchar(64),
	"background_motion" varchar(64),
	"parallax_intensity" double precision,
	"parallax_direction" varchar(32),
	"parallax_bleed" double precision,
	"content_margin_mobile" double precision,
	"content_margin_desktop" double precision,
	"foreground_color" varchar(32),
	"surface_color" varchar(32),
	"surface_color_opacity" double precision,
	"background_image_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "route_themes_route_key_unique" UNIQUE("route_key")
);
--> statement-breakpoint
CREATE TABLE "steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_task_assignees" (
	"sub_task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_task_dependencies" (
	"sub_task_id" uuid NOT NULL,
	"depends_on_sub_task_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_task_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"expected_time" integer DEFAULT 0 NOT NULL,
	"sharing_type" "sharing_type" DEFAULT 'duration' NOT NULL,
	"max_same_time_workers" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"sharing_type" "sharing_type" DEFAULT 'duration' NOT NULL,
	"max_same_time_workers" integer DEFAULT 1 NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"status" "sub_task_status" DEFAULT 'waiting' NOT NULL,
	"activation_status" "activation_status" DEFAULT 'inactive' NOT NULL,
	"expected_time" integer DEFAULT 0 NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"reason_for_deactivation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_automation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(256) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"reason_for_deactivation" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"delivery_date" date,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"step_id" uuid,
	"index" integer DEFAULT 0 NOT NULL,
	"status" "task_status" DEFAULT 'waiting' NOT NULL,
	"total_expected_time" integer DEFAULT 0 NOT NULL,
	"total_time_spent" integer DEFAULT 0 NOT NULL,
	"template_task_code" varchar(64),
	"crm_pedido_id" integer,
	"crm_item_key" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"leader_id" uuid,
	"exchanges_first_day" integer DEFAULT 3 NOT NULL,
	"exchanges_last_day" integer DEFAULT 15 NOT NULL,
	"since" date,
	"until" date,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_sub_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_task_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"expected_time" integer DEFAULT 0 NOT NULL,
	"sharing_type" "sharing_type" DEFAULT 'duration' NOT NULL,
	"max_same_time_workers" integer DEFAULT 1 NOT NULL,
	"dependency_indexes" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_tasks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(64) NOT NULL,
	"email" varchar(255),
	"password_hash" text NOT NULL,
	"name" varchar(128) NOT NULL,
	"last_name" varchar(128),
	"phone" varchar(32),
	"code" integer DEFAULT 0 NOT NULL,
	"role" "user_role" NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"reason_for_deactivation" text,
	"greeting_gender" "greeting_gender" DEFAULT 'neutral',
	"user_tag" varchar(64),
	"face_vector" jsonb,
	"avatar_media_id" uuid,
	"face_photo_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_sub_task_id_sub_tasks_id_fk" FOREIGN KEY ("sub_task_id") REFERENCES "public"."sub_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_colaborator_id_users_id_fk" FOREIGN KEY ("colaborator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_prices" ADD CONSTRAINT "award_prices_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_prices" ADD CONSTRAINT "award_prices_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "awards" ADD CONSTRAINT "awards_image_media_id_media_assets_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_icon_media_id_media_assets_id_fk" FOREIGN KEY ("icon_media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "currency_for_subtasks" ADD CONSTRAINT "currency_for_subtasks_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_themes" ADD CONSTRAINT "route_themes_background_image_media_id_media_assets_id_fk" FOREIGN KEY ("background_image_media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_task_assignees" ADD CONSTRAINT "sub_task_assignees_sub_task_id_sub_tasks_id_fk" FOREIGN KEY ("sub_task_id") REFERENCES "public"."sub_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_task_assignees" ADD CONSTRAINT "sub_task_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_task_dependencies" ADD CONSTRAINT "sub_task_dependencies_sub_task_id_sub_tasks_id_fk" FOREIGN KEY ("sub_task_id") REFERENCES "public"."sub_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_task_dependencies" ADD CONSTRAINT "sub_task_dependencies_depends_on_sub_task_id_sub_tasks_id_fk" FOREIGN KEY ("depends_on_sub_task_id") REFERENCES "public"."sub_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_tasks" ADD CONSTRAINT "sub_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_step_id_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_sub_tasks" ADD CONSTRAINT "template_sub_tasks_template_task_id_template_tasks_id_fk" FOREIGN KEY ("template_task_id") REFERENCES "public"."template_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_media_id_media_assets_id_fk" FOREIGN KEY ("avatar_media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_face_photo_media_id_media_assets_id_fk" FOREIGN KEY ("face_photo_media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;