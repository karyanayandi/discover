import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { isAdmin } from "@/lib/auth/is-admin"
import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { appConfigTable } from "@/lib/db/schemas"

const cache = createRedisCache()
const CONFIG_CACHE_TTL = 300

const forbidden = () => Response.json({ error: "Forbidden" }, { status: 403 })

export const GET: APIRoute = async ({ locals }) => {
  if (!isAdmin(locals.user)) return forbidden()

  const cacheKey = "config:all"
  const cached =
    await cache.getCache<{ key: string; value: string }[]>(cacheKey)
  if (cached) {
    return Response.json(cached)
  }

  const configs = await db.query.appConfigTable.findMany()
  await cache.setCache(cacheKey, configs, CONFIG_CACHE_TTL)

  return Response.json(configs)
}

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!isAdmin(locals.user)) return forbidden()
  const body = await request.json()
  const entries = body as { key: string; value: string }[]

  if (!Array.isArray(entries) || entries.length === 0) {
    return Response.json(
      { error: "Expected array of {key, value} entries" },
      { status: 400 },
    )
  }

  for (const entry of entries) {
    if (!entry.key || entry.value === undefined) continue

    const existing = await db.query.appConfigTable.findFirst({
      where: eq(appConfigTable.key, entry.key),
    })

    if (existing) {
      await db
        .update(appConfigTable)
        .set({ value: entry.value, updatedAt: new Date() })
        .where(eq(appConfigTable.key, entry.key))
    } else {
      await db.insert(appConfigTable).values({
        key: entry.key,
        value: entry.value,
      })
    }
  }

  await cache.deleteCache("config:all")

  return Response.json({ updated: true })
}
