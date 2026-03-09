import { relations } from "drizzle-orm"
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"
import { articlesTable } from "./articles"

export const articleSectionsTable = pgTable(
  "article_sections",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    articleId: text("article_id")
      .notNull()
      .references(() => articlesTable.id, { onDelete: "cascade" }),
    heading: text("heading").notNull(),
    body: text("body").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("section_article_idx").on(table.articleId),
    index("section_order_idx").on(table.sortOrder),
  ],
)

export const insertArticleSectionSchema =
  createInsertSchema(articleSectionsTable)
export const updateArticleSectionSchema =
  createUpdateSchema(articleSectionsTable)

export type SelectArticleSection = typeof articleSectionsTable.$inferSelect
export type InsertArticleSection = typeof articleSectionsTable.$inferInsert

export const articleSectionsRelations = relations(
  articleSectionsTable,
  ({ one }) => ({
    article: one(articlesTable, {
      fields: [articleSectionsTable.articleId],
      references: [articlesTable.id],
    }),
  }),
)
