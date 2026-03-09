CREATE TABLE "app_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_categories" (
	"article_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "article_categories_article_id_category_id_pk" PRIMARY KEY("article_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "article_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"heading" text NOT NULL,
	"body" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"thumbnail_url" text,
	"thumbnail_asset_id" text,
	"source_count" integer DEFAULT 0 NOT NULL,
	"reading_time_minutes" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon_url" text,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"domain" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" text PRIMARY KEY NOT NULL,
	"feed_source_id" text NOT NULL,
	"guid" text NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"description" text,
	"author" text,
	"published_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "feed_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"site_url" text,
	"icon_url" text,
	"description" text,
	"language" text DEFAULT 'en',
	"fetch_interval_minutes" integer DEFAULT 60 NOT NULL,
	"last_fetched_at" timestamp,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_sources_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "saved_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"article_id" text NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_sections" ADD CONSTRAINT "article_sections_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_thumbnail_asset_id_assets_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_feed_source_id_feed_sources_id_fk" FOREIGN KEY ("feed_source_id") REFERENCES "public"."feed_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ac_article_idx" ON "article_categories" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "ac_category_idx" ON "article_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "section_article_idx" ON "article_sections" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "section_order_idx" ON "article_sections" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "article_slug_idx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "article_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "article_published_idx" ON "articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "category_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "citation_article_idx" ON "citations" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "citation_domain_idx" ON "citations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "feed_item_source_idx" ON "feed_items" USING btree ("feed_source_id");--> statement-breakpoint
CREATE INDEX "feed_item_status_idx" ON "feed_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feed_item_guid_idx" ON "feed_items" USING btree ("guid");--> statement-breakpoint
CREATE INDEX "feed_item_published_idx" ON "feed_items" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "feed_source_enabled_idx" ON "feed_sources" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "feed_source_last_fetched_idx" ON "feed_sources" USING btree ("last_fetched_at");--> statement-breakpoint
CREATE INDEX "saved_user_idx" ON "saved_articles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_article_idx" ON "saved_articles" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "saved_user_article_idx" ON "saved_articles" USING btree ("user_id","article_id");