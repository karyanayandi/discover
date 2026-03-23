import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db/client"
import {
  type InsertPlatformApiKey,
  insertPlatformApiKeySchema,
  platformApiKeysTable,
  type SelectPlatformApiKey,
  updatePlatformApiKeySchema,
} from "@/lib/db/schemas/auth"

export type UpdatePlatformApiKey = Parameters<
  typeof updatePlatformApiKeySchema.parse
>[0]

export async function createPlatformApiKey(
  data: InsertPlatformApiKey,
): Promise<SelectPlatformApiKey> {
  const validated = insertPlatformApiKeySchema.parse(data)
  const [result] = await db
    .insert(platformApiKeysTable)
    .values(validated)
    .returning()
  return result
}

export async function getAllPlatformApiKeys(): Promise<SelectPlatformApiKey[]> {
  return await db
    .select()
    .from(platformApiKeysTable)
    .orderBy(platformApiKeysTable.createdAt)
}

export async function getPlatformApiKeyById(
  id: string,
): Promise<SelectPlatformApiKey | undefined> {
  const [result] = await db
    .select()
    .from(platformApiKeysTable)
    .where(eq(platformApiKeysTable.id, id))
    .limit(1)
  return result
}

export async function getActivePlatformApiKeysByProvider(
  provider: string,
): Promise<SelectPlatformApiKey[]> {
  return await db
    .select()
    .from(platformApiKeysTable)
    .where(
      and(
        eq(platformApiKeysTable.provider, provider),
        eq(platformApiKeysTable.isActive, true),
      ),
    )
    .orderBy(platformApiKeysTable.createdAt)
}

export async function updatePlatformApiKey(
  id: string,
  data: Partial<UpdatePlatformApiKey>,
): Promise<SelectPlatformApiKey | undefined> {
  const validated = updatePlatformApiKeySchema.partial().parse(data)
  const [result] = await db
    .update(platformApiKeysTable)
    .set(validated)
    .where(eq(platformApiKeysTable.id, id))
    .returning()
  return result
}

export async function updatePlatformApiKeyLastUsed(id: string): Promise<void> {
  await db
    .update(platformApiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(platformApiKeysTable.id, id))
}

export async function deletePlatformApiKey(id: string): Promise<void> {
  await db.delete(platformApiKeysTable).where(eq(platformApiKeysTable.id, id))
}

export async function togglePlatformApiKeyStatus(
  id: string,
  isActive: boolean,
): Promise<SelectPlatformApiKey | undefined> {
  const [result] = await db
    .update(platformApiKeysTable)
    .set({ isActive })
    .where(eq(platformApiKeysTable.id, id))
    .returning()
  return result
}

export async function renamePlatformApiKey(
  id: string,
  name: string,
): Promise<SelectPlatformApiKey | undefined> {
  const [result] = await db
    .update(platformApiKeysTable)
    .set({ name })
    .where(eq(platformApiKeysTable.id, id))
    .returning()
  return result
}
