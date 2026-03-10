import type { APIRoute } from "astro"
import { desc, eq } from "drizzle-orm"
import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { articlesTable } from "@/lib/db/schemas"

export const GET: APIRoute = async () => {
  const cache = createRedisCache()

  try {
    const cacheKey = "articles:featured"
    const cached = await cache.getCache<unknown>(cacheKey)
    if (cached) {
      return Response.json(cached)
    }

    const articles = await db
      .select({
        id: articlesTable.id,
        slug: articlesTable.slug,
        title: articlesTable.title,
        summary: articlesTable.summary,
        thumbnailUrl: articlesTable.thumbnailUrl,
        sourceCount: articlesTable.sourceCount,
        readingTimeMinutes: articlesTable.readingTimeMinutes,
        publishedAt: articlesTable.publishedAt,
      })
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(5)

    const result = { articles }
    await cache.setCache(cacheKey, result, 600)

    return Response.json(result)
  } finally {
    await cache.close()
  }
}
