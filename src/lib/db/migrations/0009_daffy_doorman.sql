CREATE TABLE "asset_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"max_upload_size_mb" integer DEFAULT 50 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
