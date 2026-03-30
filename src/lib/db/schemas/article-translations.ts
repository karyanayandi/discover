import { relations } from "drizzle-orm"
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { createCustomId } from "@/lib/utils/custom-id"
import { articlesTable } from "./articles"

export const articleTranslationsTable = pgTable(
  "article_translations",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    articleId: text("article_id")
      .notNull()
      .references(() => articlesTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    isAutoTranslated: boolean("is_auto_translated").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("translation_article_idx").on(table.articleId),
    index("translation_language_idx").on(table.language),
  ],
)

export const articleTranslationsRelations = relations(
  articleTranslationsTable,
  ({ one }) => ({
    article: one(articlesTable, {
      fields: [articleTranslationsTable.articleId],
      references: [articlesTable.id],
    }),
  }),
)

export type SelectArticleTranslation =
  typeof articleTranslationsTable.$inferSelect
export type InsertArticleTranslation =
  typeof articleTranslationsTable.$inferInsert
