import { index, pgTable, real, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { createCustomId } from "@/lib/utils/custom-id"
import { clustersTable } from "./clusters"

export const clusterMergesTable = pgTable(
  "cluster_merges",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    sourceClusterId: text("source_cluster_id")
      .notNull()
      .references(() => clustersTable.id, { onDelete: "cascade" }),
    targetClusterId: text("target_cluster_id")
      .notNull()
      .references(() => clustersTable.id, { onDelete: "cascade" }),
    mergedAt: timestamp("merged_at").defaultNow().notNull(),
    approvedBy: text("approved_by").notNull(),
    similarityScore: real("similarity_score"),
  },
  (table) => [
    index("cluster_merge_source_idx").on(table.sourceClusterId),
    index("cluster_merge_target_idx").on(table.targetClusterId),
    index("cluster_merge_merged_at_idx").on(table.mergedAt),
  ],
)

export const insertClusterMergeSchema = createInsertSchema(clusterMergesTable)
export const updateClusterMergeSchema = createUpdateSchema(clusterMergesTable)

export type SelectClusterMerge = typeof clusterMergesTable.$inferSelect
export type InsertClusterMerge = typeof clusterMergesTable.$inferInsert
