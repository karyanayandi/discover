import { relations } from "drizzle-orm"
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { articlesTable } from "./articles"

export const citationsTable = pgTable(
  "citations",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    articleId: text("article_id")
      .notNull()
      .references(() => articlesTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    domain: text("domain").notNull(),
    iconUrl: text("icon_url"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("citation_article_idx").on(table.articleId),
    index("citation_domain_idx").on(table.domain),
  ],
)

export const insertCitationSchema = createInsertSchema(citationsTable)
export const updateCitationSchema = createUpdateSchema(citationsTable)

export type SelectCitation = typeof citationsTable.$inferSelect
export type InsertCitation = typeof citationsTable.$inferInsert

export const citationsRelations = relations(citationsTable, ({ one }) => ({
  article: one(articlesTable, {
    fields: [citationsTable.articleId],
    references: [articlesTable.id],
  }),
}))
