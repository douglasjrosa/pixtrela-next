CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"route" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"detail" text,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "logs_created_at_idx" ON "logs" USING btree ("created_at");

CREATE INDEX "logs_route_created_at_idx" ON "logs" USING btree ("route","created_at");

CREATE INDEX "logs_user_id_idx" ON "logs" USING btree ("user_id");
