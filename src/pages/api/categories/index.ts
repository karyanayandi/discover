import type { APIRoute } from "astro"
import { asc } from "drizzle-orm"

import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { categoriesTable } from "@/lib/db/schemas"

const cache = createRedisCache()

export const GET: APIRoute = async () => {
  const cacheKey = "categories:all"
  const cached = await cache.getCache(cacheKey)
  if (cached) {
    return Response.json(cached)
  }

  const categories = await db.query.categoriesTable.findMany({
    orderBy: [asc(categoriesTable.name)],
  })

  await cache.setCache(cacheKey, categories, 3600)
  return Response.json(categories)
}
