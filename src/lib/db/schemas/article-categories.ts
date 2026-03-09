import { relations } from "drizzle-orm"
import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core"

import { articlesTable } from "./articles"
import { categoriesTable } from "./categories"

export const articleCategoriesTable = pgTable(
  "article_categories",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => articlesTable.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categoriesTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.categoryId] }),
    index("ac_article_idx").on(table.articleId),
    index("ac_category_idx").on(table.categoryId),
  ],
)

export const articleCategoriesRelations = relations(
  articleCategoriesTable,
  ({ one }) => ({
    article: one(articlesTable, {
      fields: [articleCategoriesTable.articleId],
      references: [articlesTable.id],
    }),
    category: one(categoriesTable, {
      fields: [articleCategoriesTable.categoryId],
      references: [categoriesTable.id],
    }),
  }),
)
