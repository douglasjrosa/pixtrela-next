CREATE TABLE "sub_task_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"ref" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sub_task_categories_ref_unique" UNIQUE("ref")
);

CREATE TABLE "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_task_category_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flags_category_index_unique" UNIQUE("sub_task_category_id","index")
);

ALTER TABLE "flags"
	ADD CONSTRAINT "flags_sub_task_category_id_sub_task_categories_id_fk"
	FOREIGN KEY ("sub_task_category_id")
	REFERENCES "public"."sub_task_categories"("id")
	ON DELETE restrict ON UPDATE no action;

CREATE TABLE "sub_task_flags" (
	"sub_task_id" uuid NOT NULL,
	"flag_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sub_task_flags_pk" PRIMARY KEY("sub_task_id","flag_id"),
	CONSTRAINT "sub_task_flags_flag_id_unique" UNIQUE("flag_id")
);

ALTER TABLE "sub_task_flags"
	ADD CONSTRAINT "sub_task_flags_sub_task_id_sub_tasks_id_fk"
	FOREIGN KEY ("sub_task_id")
	REFERENCES "public"."sub_tasks"("id")
	ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sub_task_flags"
	ADD CONSTRAINT "sub_task_flags_flag_id_flags_id_fk"
	FOREIGN KEY ("flag_id")
	REFERENCES "public"."flags"("id")
	ON DELETE restrict ON UPDATE no action;

ALTER TABLE "sub_tasks" ADD COLUMN "sub_task_category_id" uuid;
ALTER TABLE "sub_task_presets" ADD COLUMN "sub_task_category_id" uuid;
ALTER TABLE "template_sub_tasks" ADD COLUMN "sub_task_category_id" uuid;

ALTER TABLE "sub_tasks"
	ADD CONSTRAINT "sub_tasks_sub_task_category_id_sub_task_categories_id_fk"
	FOREIGN KEY ("sub_task_category_id")
	REFERENCES "public"."sub_task_categories"("id")
	ON DELETE set null ON UPDATE no action;

ALTER TABLE "sub_task_presets"
	ADD CONSTRAINT "sub_task_presets_sub_task_category_id_sub_task_categories_id_fk"
	FOREIGN KEY ("sub_task_category_id")
	REFERENCES "public"."sub_task_categories"("id")
	ON DELETE set null ON UPDATE no action;

ALTER TABLE "template_sub_tasks"
	ADD CONSTRAINT "template_sub_tasks_sub_task_category_id_sub_task_categories_id_fk"
	FOREIGN KEY ("sub_task_category_id")
	REFERENCES "public"."sub_task_categories"("id")
	ON DELETE set null ON UPDATE no action;

ALTER TABLE "sub_tasks" DROP COLUMN "reason_for_deactivation";
