CREATE TABLE "platform_api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "platform_api_key_provider_idx" ON "platform_api_keys" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "platform_api_key_isActive_idx" ON "platform_api_keys" USING btree ("is_active");