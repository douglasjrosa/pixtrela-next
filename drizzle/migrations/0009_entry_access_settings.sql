CREATE TABLE "entry_access_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"surface" varchar(16) NOT NULL,
	"computer_username" boolean DEFAULT true NOT NULL,
	"computer_code" boolean DEFAULT false NOT NULL,
	"computer_face" boolean DEFAULT false NOT NULL,
	"computer_nfc" boolean DEFAULT false NOT NULL,
	"mobile_username" boolean DEFAULT true NOT NULL,
	"mobile_code" boolean DEFAULT false NOT NULL,
	"mobile_face" boolean DEFAULT true NOT NULL,
	"mobile_nfc" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entry_access_settings_surface_unique" UNIQUE("surface")
);
