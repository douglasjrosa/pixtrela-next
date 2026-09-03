ALTER TABLE "kiosk_settings"
ADD COLUMN "queue_page_size" integer
DEFAULT 15 NOT NULL;
