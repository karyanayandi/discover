import { integer, pgTable, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const assetSettingsTable = pgTable("asset_settings", {
  id: integer("id").primaryKey().default(1),
  maxUploadSizeMB: integer("max_upload_size_mb").notNull().default(50),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const insertAssetSettingsSchema = createInsertSchema(assetSettingsTable)
export const updateAssetSettingsSchema = createUpdateSchema(assetSettingsTable)

export type SelectAssetSettings = typeof assetSettingsTable.$inferSelect
export type InsertAssetSettings = typeof assetSettingsTable.$inferInsert
export type UpdateAssetSettings = typeof assetSettingsTable.$inferInsert
