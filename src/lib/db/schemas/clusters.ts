import {
  index,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const aiModelEnum = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] as const
export type AIModel = (typeof aiModelEnum)[number]

export const clustersTable = pgTable(
  "clusters",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    topic: text("topic").notNull(),
    keywords: text("keywords").array().notNull().default([]),
    aiModel: varchar("ai_model", { length: 50 }),
    similarityScore: real("similarity_score"),
    lastSimilarityCheck: timestamp("last_similarity_check"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("cluster_topic_idx").on(table.topic),
    index("cluster_ai_model_idx").on(table.aiModel),
    index("cluster_similarity_score_idx").on(table.similarityScore),
  ],
)

export const insertClusterSchema = createInsertSchema(clustersTable)
export const updateClusterSchema = createUpdateSchema(clustersTable)

export type SelectCluster = typeof clustersTable.$inferSelect
export type InsertCluster = typeof clustersTable.$inferInsert
