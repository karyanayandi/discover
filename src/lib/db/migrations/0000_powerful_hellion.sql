CREATE TABLE "post_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"uri" varchar(500) NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"user_agent_hash" varchar(64) NOT NULL,
	"fingerprint" varchar(64),
	"session_id" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "view_aggregates" (
	"uri" varchar(500) PRIMARY KEY NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"views_24h" integer DEFAULT 0 NOT NULL,
	"views_7d" integer DEFAULT 0 NOT NULL,
	"views_30d" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "uri_idx" ON "post_views" USING btree ("uri");--> statement-breakpoint
CREATE INDEX "viewed_at_idx" ON "post_views" USING btree ("viewed_at");