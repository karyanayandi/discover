import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db/client"
import {
  apiKeysTable,
  type InsertApiKey,
  insertApiKeySchema,
  type SelectApiKey,
  updateApiKeySchema,
} from "@/lib/db/schemas/auth"

// Inferred types
export type UpdateApiKey = Parameters<typeof updateApiKeySchema.parse>[0]

export async function createApiKey(data: InsertApiKey): Promise<SelectApiKey> {
  const validated = insertApiKeySchema.parse(data)
  const [result] = await db.insert(apiKeysTable).values(validated).returning()
  return result
}

export async function getApiKeysByUserId(
  userId: string,
): Promise<SelectApiKey[]> {
  return await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .orderBy(apiKeysTable.createdAt)
}

export async function getApiKeyById(
  id: string,
): Promise<SelectApiKey | undefined> {
  const [result] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.id, id))
    .limit(1)
  return result
}

export async function getApiKeyByHash(
  keyHash: string,
): Promise<SelectApiKey | undefined> {
  const [result] = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, keyHash))
    .limit(1)
  return result
}

export async function updateApiKey(
  id: string,
  data: Partial<UpdateApiKey>,
): Promise<SelectApiKey | undefined> {
  const validated = updateApiKeySchema.partial().parse(data)
  const [result] = await db
    .update(apiKeysTable)
    .set(validated)
    .where(eq(apiKeysTable.id, id))
    .returning()
  return result
}

export async function updateApiKeyLastUsed(id: string): Promise<void> {
  await db
    .update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, id))
}

export async function deleteApiKey(id: string): Promise<void> {
  await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id))
}

export async function deleteApiKeyByUserId(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(apiKeysTable)
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, userId)))
    .returning()
  return result.length > 0
}

export async function toggleApiKeyStatus(
  id: string,
  userId: string,
  isActive: boolean,
): Promise<SelectApiKey | undefined> {
  const [result] = await db
    .update(apiKeysTable)
    .set({ isActive })
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, userId)))
    .returning()
  return result
}

export async function renameApiKey(
  id: string,
  userId: string,
  name: string,
): Promise<SelectApiKey | undefined> {
  const [result] = await db
    .update(apiKeysTable)
    .set({ name })
    .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, userId)))
    .returning()
  return result
}
