import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const feedSourcesTable = pgTable(
  "feed_sources",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    siteUrl: text("site_url"),
    iconUrl: text("icon_url"),
    description: text("description"),
    language: text("language").default("en"),
    fetchIntervalMinutes: integer("fetch_interval_minutes")
      .notNull()
      .default(60),
    lastFetchedAt: timestamp("last_fetched_at"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("feed_source_enabled_idx").on(table.enabled),
    index("feed_source_last_fetched_idx").on(table.lastFetchedAt),
  ],
)

export const insertFeedSourceSchema = createInsertSchema(feedSourcesTable)
export const updateFeedSourceSchema = createUpdateSchema(feedSourcesTable)

export type SelectFeedSource = typeof feedSourcesTable.$inferSelect
export type InsertFeedSource = typeof feedSourcesTable.$inferInsert
