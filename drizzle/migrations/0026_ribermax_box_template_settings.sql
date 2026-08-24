CREATE TABLE "ribermax_box_template_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cut_seconds" integer DEFAULT 60 NOT NULL,
  "adhesive_seconds" integer DEFAULT 30 NOT NULL,
  "fastener_seconds" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
