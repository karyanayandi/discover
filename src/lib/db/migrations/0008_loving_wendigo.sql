CREATE TABLE "cluster_merges" (
	"id" text PRIMARY KEY NOT NULL,
	"source_cluster_id" text NOT NULL,
	"target_cluster_id" text NOT NULL,
	"merged_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" text NOT NULL,
	"similarity_score" real
);
--> statement-breakpoint
ALTER TABLE "clusters" ADD COLUMN "similarity_score" real;--> statement-breakpoint
ALTER TABLE "clusters" ADD COLUMN "last_similarity_check" timestamp;--> statement-breakpoint
ALTER TABLE "cluster_merges" ADD CONSTRAINT "cluster_merges_source_cluster_id_clusters_id_fk" FOREIGN KEY ("source_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_merges" ADD CONSTRAINT "cluster_merges_target_cluster_id_clusters_id_fk" FOREIGN KEY ("target_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cluster_merge_source_idx" ON "cluster_merges" USING btree ("source_cluster_id");--> statement-breakpoint
CREATE INDEX "cluster_merge_target_idx" ON "cluster_merges" USING btree ("target_cluster_id");--> statement-breakpoint
CREATE INDEX "cluster_merge_merged_at_idx" ON "cluster_merges" USING btree ("merged_at");--> statement-breakpoint
CREATE INDEX "cluster_similarity_score_idx" ON "clusters" USING btree ("similarity_score");