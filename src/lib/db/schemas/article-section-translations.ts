import { relations } from "drizzle-orm"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { createCustomId } from "@/lib/utils/custom-id"
import { articleSectionsTable } from "./article-sections"

export const articleSectionTranslationsTable = pgTable(
  "article_section_translations",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    sectionId: text("section_id")
      .notNull()
      .references(() => articleSectionsTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    heading: text("heading").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("section_translation_section_idx").on(table.sectionId),
    index("section_translation_language_idx").on(table.language),
  ],
)

export const articleSectionTranslationsRelations = relations(
  articleSectionTranslationsTable,
  ({ one }) => ({
    section: one(articleSectionsTable, {
      fields: [articleSectionTranslationsTable.sectionId],
      references: [articleSectionsTable.id],
    }),
  }),
)

export type SelectArticleSectionTranslation =
  typeof articleSectionTranslationsTable.$inferSelect
export type InsertArticleSectionTranslation =
  typeof articleSectionTranslationsTable.$inferInsert
