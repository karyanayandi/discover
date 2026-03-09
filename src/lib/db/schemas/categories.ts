import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const categoriesTable = pgTable(
  "categories",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    iconUrl: text("icon_url"),
    color: text("color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("category_slug_idx").on(table.slug)],
)

export const insertCategorySchema = createInsertSchema(categoriesTable)
export const updateCategorySchema = createUpdateSchema(categoriesTable)

export type SelectCategory = typeof categoriesTable.$inferSelect
export type InsertCategory = typeof categoriesTable.$inferInsert
