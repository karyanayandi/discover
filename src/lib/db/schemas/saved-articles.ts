import { relations } from "drizzle-orm"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { articlesTable } from "./articles"
import { usersTable } from "./auth"

export const savedArticlesTable = pgTable(
  "saved_articles",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => articlesTable.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
  },
  (table) => [
    index("saved_user_idx").on(table.userId),
    index("saved_article_idx").on(table.articleId),
    index("saved_user_article_idx").on(table.userId, table.articleId),
  ],
)

export const insertSavedArticleSchema = createInsertSchema(savedArticlesTable)
export const updateSavedArticleSchema = createUpdateSchema(savedArticlesTable)

export type SelectSavedArticle = typeof savedArticlesTable.$inferSelect
export type InsertSavedArticle = typeof savedArticlesTable.$inferInsert

export const savedArticlesRelations = relations(
  savedArticlesTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [savedArticlesTable.userId],
      references: [usersTable.id],
    }),
    article: one(articlesTable, {
      fields: [savedArticlesTable.articleId],
      references: [articlesTable.id],
    }),
  }),
)
