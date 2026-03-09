import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const appConfigTable = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const insertAppConfigSchema = createInsertSchema(appConfigTable)
export const updateAppConfigSchema = createUpdateSchema(appConfigTable)

export type SelectAppConfig = typeof appConfigTable.$inferSelect
export type InsertAppConfig = typeof appConfigTable.$inferInsert
