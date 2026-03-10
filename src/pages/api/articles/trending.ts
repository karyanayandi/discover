import type { APIRoute } from "astro"
import { desc, eq, gte, sql } from "drizzle-orm"
import { createRedisCache } from "@/lib/cache"
import { db } from "@/lib/db/client"
import { articlesTable, articleViewsTable } from "@/lib/db/schemas"

export const GET: APIRoute = async () => {
  const cache = createRedisCache()

  try {
    const cacheKey = "articles:trending"
    const cached = await cache.getCache<unknown>(cacheKey)
    if (cached) {
      return Response.json(cached)
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

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
        viewCount: sql<number>`count(${articleViewsTable.id})::int`,
      })
      .from(articlesTable)
      .leftJoin(
        articleViewsTable,
        eq(articlesTable.id, articleViewsTable.articleId),
      )
      .where(eq(articlesTable.status, "published"))
      .groupBy(articlesTable.id)
      .having(gte(sql`count(${articleViewsTable.id})`, 1))
      .orderBy(desc(sql`count(${articleViewsTable.id})`))
      .limit(10)

    const result = { articles }
    await cache.setCache(cacheKey, result, 300)

    return Response.json(result)
  } finally {
    await cache.close()
  }
}
