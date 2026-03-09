import { relations } from "drizzle-orm"

import { articleCategoriesTable } from "./article-categories"
import { articleSectionsTable } from "./article-sections"
import { articlesTable } from "./articles"
import { assetsTable } from "./assets"
import { categoriesTable } from "./categories"
import { citationsTable } from "./citations"
import { feedItemsTable } from "./feed-items"
import { feedSourcesTable } from "./feed-sources"
import { savedArticlesTable } from "./saved-articles"

export const articlesRelations = relations(articlesTable, ({ one, many }) => ({
  thumbnailAsset: one(assetsTable, {
    fields: [articlesTable.thumbnailAssetId],
    references: [assetsTable.id],
  }),
  sections: many(articleSectionsTable),
  citations: many(citationsTable),
  articleCategories: many(articleCategoriesTable),
  savedArticles: many(savedArticlesTable),
}))

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  articleCategories: many(articleCategoriesTable),
}))

export const feedSourcesRelations = relations(feedSourcesTable, ({ many }) => ({
  feedItems: many(feedItemsTable),
}))
